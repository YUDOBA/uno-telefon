function moveSeat(i, dir) {
  var seats = (state.seats || []).slice();
  var j = i + dir; if (j < 0 || j >= seats.length) return;
  var t = seats[i]; seats[i] = seats[j]; seats[j] = t;
  socket.emit("setSeats", { seats: seats });
}
function setRounds(){ var r=document.getElementById("rounds"); socket.emit("setRounds",{rounds:r?r.value:3}); }
function doStart() {
  var r = document.getElementById("rounds");
  socket.emit("start", { rounds: r ? r.value : 3 });
}
function tryPick(i) {
  err = ""; if (!state || !state.game) return;
  var card = state.game.hand[i]; if (!card) return;
  if (picked !== i) { picked = i; render(); return; }
  tryPlay(i);
}
function tryPlay(i) {
  err = ""; if (!state || !state.game) return;
  if (state.paused) { err = "Oyun bekliyor."; render(); return; }
  var card = state.game.hand[i]; if (!card) return;
  if (!isActor()) { err = "Sira sende degil."; render(); return; }
  if (card.type === "custom") { pendingCustom = { i: i, color: null }; pendingWild = i; picked = null; render(); return; }
  if (card.type === "wild" || card.type === "wild4" || card.type === "wdraw2" || card.type === "wskip2" || card.type === "shuffle" || card.type === "skipall") { pendingWild = i; picked = null; render(); return; }
  if (card.type === "wtarget2" || card.type === "swap") { pendingCustom = { i: i, color: null, kind: card.type }; pendingWild = i; picked = null; render(); return; }
  if (!canPlay(card, state.game.top, state.game.chosenColor, state.game.stackKind)) {
    err = "Bu kart oynanamaz."; render(); return;
  }
  picked = null;
  socket.emit("play", { cardIndex: i });
}
function confirmWild(color) {
  var i = pendingWild; pendingWild = null;
  if (pendingCustom) { pendingCustom.color = color; render(); return; }
  socket.emit("play", { cardIndex: i, chosenColor: color });
}
function colorTiles() {
  return "<div class=\"color-row\">" +
    "<button class=\"color-tile\" style=\"background:var(--yellow)\" onclick=\"confirmWild('yellow')\"></button>" +
    "<button class=\"color-tile\" style=\"background:var(--green)\" onclick=\"confirmWild('green')\"></button>" +
    "<button class=\"color-tile\" style=\"background:var(--red)\" onclick=\"confirmWild('red')\"></button>" +
    "<button class=\"color-tile\" style=\"background:var(--blue)\" onclick=\"confirmWild('blue')\"></button></div>";
}
function pickScreen() {
  var others = (state.players || []).filter(function (p) { return p.id !== me.playerId; });
  var html = "<div class=\"pick-screen\"><h1>Secim</h1>";
  html += "<p class=\"sub\">Kart rengini secin</p>" + colorTiles();
  var col = pendingCustom && pendingCustom.color;
  if (col) html += "<p><b>Secilen renk: " + (COLOR_TR[col] || col) + "</b></p>";
  if (pendingCustom && pendingCustom.kind) {
    html += "<p>" + (pendingCustom.kind === "swap" ? "El degisecegin oyuncu" : "Hedef oyuncu") + "</p>";
    others.forEach(function (p) {
      var on = pendingCustom.target === p.id;
      html += "<button class=\"btn " + (on ? "btn-main" : "btn-ghost") + "\" onclick=\"pendingCustom.target='" + p.id + "';render()\">" + esc(p.name) + " (" + (p.cardCount || 0) + " kart)</button>";
    });
    html += "<button class=\"btn btn-main\" " + (col && pendingCustom.target ? "" : "disabled") + " onclick=\"confirmTarget()\">Tamam</button>";
  } else if (pendingCustom) {
    var sum = 0; others.forEach(function (p) { sum += assignMap[p.id] || 0; });
    html += "<p>8 cezayi dagit (" + sum + " / 8)</p>";
    others.forEach(function (p) {
      var v = assignMap[p.id] || 0;
      html += "<div class=\"row\"><span>" + esc(p.name) + " (" + (p.cardCount || 0) + " kart)</span><span><button class=\"mini-btn\" onclick=\"chgAs('" + p.id + "',-1)\">-</button> " + v + " <button class=\"mini-btn\" onclick=\"chgAs('" + p.id + "',1)\">+</button></span></div>";
    });
    html += "<button class=\"btn btn-main\" " + (sum === 8 && col ? "" : "disabled") + " onclick=\"confirmCustom()\">Tamam</button>";
  }
  html += "<p class=\"sub\">Elin</p>";
  html += handHtml((state.game && state.game.hand) || [], false, state.game);
  html += "<button class=\"btn btn-ghost\" onclick=\"pendingCustom=null;pendingWild=null;assignMap={};render()\">Vazgec</button><p class=\"err\">" + esc(err) + "</p></div>" + ver();
  app.innerHTML = html;
}
function chgAs(id, d) {
  var v = (assignMap[id] || 0) + d; if (v < 0) v = 0;
  var sum = 0; Object.keys(assignMap).forEach(function (k) { if (k !== id) sum += assignMap[k] || 0; });
  if (sum + v > 8) v = 8 - sum; assignMap[id] = v; render();
}
function confirmTarget() {
  socket.emit("play", { cardIndex: pendingCustom.i, chosenColor: pendingCustom.color, targetId: pendingCustom.target });
  pendingCustom = null; pendingWild = null;
}
function confirmCustom() {
  var assign = []; Object.keys(assignMap).forEach(function (k) { if (assignMap[k]) assign.push({ playerId: k, n: assignMap[k] }); });
  socket.emit("play", { cardIndex: pendingCustom.i, chosenColor: pendingCustom.color, assign: assign });
  pendingCustom = null; assignMap = {}; pendingWild = null;
}
function shoutUno() {
  try {
    if (window.speechSynthesis) {
      var u = new SpeechSynthesisUtterance("UNOOOO");
      u.lang = "tr-TR"; u.rate = 0.85; u.pitch = 1.15; u.volume = 1;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }
  } catch (e) {}
}
function pressUno() {
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n === 2) { iSaidUno = true; shoutUno(); }
  socket.emit("uno");
}
socket.on("unoShout", function (d) {
  if (iSaidUno) iSaidUno = false;
  else shoutUno();
  try { if (navigator.vibrate) navigator.vibrate([400,120,400,120,400,120,400]); } catch (e) {}
  unoBurst = d || {};
  render();
  setTimeout(function () { unoBurst = null; render(); }, 1000);
});
socket.on("cardFly", function (d) {
  if (!d || !d.card) return;
  flying = { card: d.card, fromId: d.fromId, kind: "play" };
  holdTurnId = d.fromId;
  render();
  setTimeout(function () { flying = null; holdTurnId = null; render(); }, 2000);
});
socket.on("cardDraw", function (d) {
  flying = { card: { color: "black", type: "wild", value: "back" }, fromId: d && d.toId, kind: "draw" };
  render();
  setTimeout(function () { flying = null; render(); }, 1000);
});
function playDrawn() { drawnChoice = false; tryPlay(state.game.hand.length - 1); }
function passDrawn() { drawnChoice = false; socket.emit("passAfterDraw"); }
function cardsHelp() {
  function row(card, title, text) {
    return "<div class=\"panel guide\">" + cardHtml(card, "") + "<div><b>" + title + "</b><p class=\"sub\">" + text + "</p></div></div>";
  }
  var html = "<h1>Ozel kartlar</h1>";
  html += row({color:"red",type:"skip",value:"skip"}, "Atla (Skip)", "Ayni renk veya baska Atla ustune atilir. Siradaki oyuncu atlanir.");
  html += row({color:"blue",type:"reverse",value:"reverse"}, "Ters (Reverse)", "Ayni renk veya baska Ters ustune atilir. Akis yonu doner. 2 kiside Atla gibi siradaki atlanir.");
  html += row({color:"green",type:"draw2",value:"draw2"}, "+2 (Draw Two)", "Ayni renk veya herhangi +2 ustune atilir. Siradaki +2 ceker veya elindeki herhangi renk +2 ile yigini artirir. Son +2 renginden devam.");
  html += row({color:"black",type:"wild",value:"wild"}, "Joker (Wild)", "Her zaman atilir. Atan yeni rengi secer.");
  html += row({color:"black",type:"wild4",value:"wild4"}, "Joker +4 (Wild Draw Four)", "Ustte sayi karti veya joker varken atilir. Atla / Ters / +2 ustune atilmaz. Siradaki 4 kart ceker, sonra kart atabilir.");
  html += row({color:"black",type:"custom",value:"custom"}, "Ozel Joker 8", "Her zaman atilir. Atmadan once toplam 8 cezayi oyunculara dagitirsin. Secilenler sirayla ceker, son ceken kart atabilir.");
  html += row({color:"black",type:"wdraw2",value:"wdraw2"}, "Joker +2", "Her zaman atilir. Renk secilir. Siradaki 2 kart ceker, sonra atabilir.");
  html += row({color:"black",type:"wtarget2",value:"wtarget2"}, "Hedef +2", "Her zaman atilir. Renk ve hedef secilir. Hedef 2 kart ceker.");
  html += row({color:"black",type:"wskip2",value:"wskip2"}, "Cift Atla", "Her zaman atilir. Renk secilir. Sonraki 2 oyuncu atlanir.");
  html += row({color:"black",type:"swap",value:"swap"}, "El Degis", "Her zaman atilir. Secilen oyuncu ile eller degisir.");
  html += row({color:"black",type:"shuffle",value:"shuffle"}, "El Karistir", "Her zaman atilir. Butun eller toplanir, karistirilir, ayni sayida dagitilir.");
  html += row({color:"black",type:"skipall",value:"skipall"}, "Herkesi Atla", "Her zaman atilir. Renk secilir. Diger herkes atlanir, ayni oyuncu tekrar oynar.");
  html += "<button class=\"btn btn-main\" onclick=\"backFromCards()\">Oyuna don</button>" + ver();
  app.innerHTML = html;
}
function seatXY(pid) {
  var seats = (state && (state.seats || (state.players||[]).map(function (p) { return p.id; }))) || [];
  var selfI = seats.indexOf(me.playerId); if (selfI < 0) selfI = 0;
  var n = seats.length || 1;
  var i = seats.indexOf(pid); if (i < 0) i = 0;
  var a = Math.PI / 2 + ((i - selfI) / n) * 2 * Math.PI;
  return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 36 };
}
function countsHelp() {
  var html = "<h1>Kart sayilari</h1><div class=\"panel\">";
  html += "<p>Toplam deste: <b>136</b></p>";
  html += "<div class=\"row\"><span>0 (her renkten 1)</span><span>4</span></div>";
  html += "<div class=\"row\"><span>1-9 (her sayi, her renkten 2)</span><span>72</span></div>";
  html += "<div class=\"row\"><span>Atla (her renkten 2)</span><span>8</span></div>";
  html += "<div class=\"row\"><span>Ters (her renkten 2)</span><span>8</span></div>";
  html += "<div class=\"row\"><span>+2 (her renkten 2)</span><span>8</span></div>";
  html += "<div class=\"row\"><span>Joker</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Joker +4</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Ozel Joker 8</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Joker +2</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Hedef +2</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Cift Atla</span><span>4</span></div>";
  html += "<div class=\"row\"><span>El Degis</span><span>4</span></div>";
  html += "<div class=\"row\"><span>El Karistir</span><span>4</span></div>";
  html += "<div class=\"row\"><span>Herkesi Atla</span><span>4</span></div>";
  html += "</div><button class=\"btn btn-main\" onclick=\"goHome()\">Geri</button>" + ver();
  app.innerHTML = html;
}
function rulesHelp() {
  var html = "<h1>Kurallar</h1>";
  html += "<div class=\"panel\"><b>1. Amac</b><p class=\"sub\">Elini ilk bitiren turi kazanir. Belirlenen tur sonunda en dusuk toplam puan oyunu kazanir.</p></div>";
  html += "<div class=\"panel\"><b>2. Kurulum</b><p class=\"sub\">2-8 oyuncu. Herkese 7 kart. Ortaya yalniz sayi karti acilir. Ilk yon saat yonudur.</p></div>";
  html += "<div class=\"panel\"><b>3. Sira</b><p class=\"sub\">Ustteki kartla ayni renk veya ayni sayi/tur kart atilir. Atacak kart yoksa veya istenirse kart cekilir. Cekilen oynanabilirse atilir veya Pas.</p></div>";
  html += "<div class=\"panel\"><b>4. Kartlar</b><p class=\"sub\">Atla, Ters, +2, Joker, Joker +4, Ozel 8, Joker +2, Hedef +2, Cift Atla, El Degis, El Karistir, Herkesi Atla.</p></div>";
  html += "<div class=\"panel\"><b>5. UNO</b><p class=\"sub\">2 kart kalinca UNO denir. Denmezse 2 ceza karti.</p></div>";
  html += "<div class=\"panel\"><b>6. Puan</b><p class=\"sub\">Sayi karti yuzu kadar, ozel kart 10. Turu bitiren -10. En dusuk toplam kazanir.</p></div>";
  html += "<button class=\"btn btn-main\" onclick=\"goHome()\">Geri</button>" + ver();
  app.innerHTML = html;
}
function goCounts() { screen = "counts"; err = ""; render(); }
function goRules() { screen = "rules"; err = ""; render(); }
function goCards() { screen = "cards"; err = ""; render(); }
function backFromCards() {
  if (state && (state.status === "playing" || state.status === "winnerShow" || state.status === "finished" || state.status === "roundEnd")) screen = "game";
  else if (state && state.status === "lobby") screen = "lobby";
  else screen = "home";
  err = ""; render();
}
function goFull() {
  var el = document.documentElement;
  var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  try { if (fn) fn.call(el); } catch (e) {}
  try { window.scrollTo(0, 1); } catch (e) {}
}
function closeRoom() {
  try { socket.emit("leave"); } catch (e) {}
  try { localStorage.removeItem("uno_code"); } catch (e) {}
  state = null; pendingWild = null; pendingCustom = null; assignMap = {};
  screen = "home"; err = ""; render();
}
function goHome() { screen = "home"; err = ""; render(); }
function goCreate() { goFull(); screen = "create"; err = ""; render(); }
function goJoin() { goFull(); screen = "join"; err = ""; render(); }
function doCreate() { var name = document.getElementById("name").value.trim() || "Kurucu"; me.name = name; socket.emit("create", { name: name, maxPlayers: document.getElementById("max").value }); }
function doJoin() { var name = document.getElementById("name").value.trim() || "Oyuncu"; me.name = name; socket.emit("join", { name: name, code: document.getElementById("code").value.trim(), token: me.token }); }
var _lobbyFn = lobby;
lobby = function () {
  _lobbyFn();
  if (!app) return;
  var html = app.innerHTML || "";
  if (html.indexOf("closeRoom()") >= 0) return;
  app.innerHTML = html.replace("</p>" + ver(), "</p><button class=\"btn btn-ghost\" onclick=\"closeRoom()\">Oyunu kapat</button>" + ver());
  if (app.innerHTML.indexOf("closeRoom()") < 0) app.innerHTML = html.replace(ver(), "<button class=\"btn btn-ghost\" onclick=\"closeRoom()\">Oyunu kapat</button>" + ver());
};
render();
