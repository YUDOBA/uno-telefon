const socket = io({ reconnection: true, reconnectionDelay: 800, reconnectionAttempts: 40, pingInterval: 10000, pingTimeout: 40000 });
socket.on("connect", function () {
  var code = localStorage.getItem("uno_code") || "";
  var token = localStorage.getItem("uno_token") || "";
  var name = localStorage.getItem("uno_name") || me.name || "";
  if (code && token) socket.emit("join", { name: name, code: code, token: token });
});
setInterval(function () { try { fetch("/health"); socket.emit("ping"); } catch (e) {} }, 20000);
const app = document.getElementById("app");
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
const VERSION = "V39";
let me = { playerId: null, name: localStorage.getItem("uno_name") || "", token: localStorage.getItem("uno_token") || "" };
let state = null, screen = "home", err = "", pendingWild = null, pendingCustom = null, assignMap = {}, drawnChoice = false, showScores = false, picked = null, flying = null, iSaidUno = false, holdTurnId = null, unoBurst = null;
socket.on("created", function (d) { me.playerId = d.playerId; me.token = d.token; localStorage.setItem("uno_token", d.token); localStorage.setItem("uno_name", me.name); if (d.code) localStorage.setItem("uno_code", d.code); screen = "lobby"; err = ""; render(); });
socket.on("joined", function (d) { me.playerId = d.playerId; me.token = d.token; localStorage.setItem("uno_token", d.token); localStorage.setItem("uno_name", me.name); if (d.code) localStorage.setItem("uno_code", d.code); screen = "lobby"; err = ""; render(); });
socket.on("state", function (s) { state = s; if (s.status === "playing" || s.status === "finished" || s.status === "roundEnd" || s.status === "winnerShow") screen = "game"; if (s.status === "lobby") screen = "lobby"; render(); });
socket.on("errorMsg", function (m) { err = m; render(); });
socket.on("drawnPlayable", function () { drawnChoice = true; render(); });
function esc(s) {
  s = String(s == null ? "" : s);
  s = s.split("&").join(String.fromCharCode(38) + "amp;");
  s = s.split("<").join(String.fromCharCode(38) + "lt;");
  s = s.split(">").join(String.fromCharCode(38) + "gt;");
  s = s.split('"').join(String.fromCharCode(38) + "quot;");
  return s;
}
function canPlay(card, top, chosenColor, stackKind) {
  if (!card) return false; if (!top) return true;
  if (stackKind === "draw2") return card.type === "draw2";
  if (stackKind === "wild4" || stackKind === "custom" || stackKind === "wdraw2") return false;
  if (card.type === "wild" || card.type === "custom" || card.type === "wdraw2" || card.type === "wtarget2" || card.type === "wskip2" || card.type === "swap" || card.type === "shuffle" || card.type === "skipall") return true;
  if (card.type === "wild4") return top.type === "number" || top.type === "wild" || top.type === "wild4" || top.type === "custom";
  var color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
function corner(t) { return "<span class=\"c-tl\">" + t + "</span><span class=\"c-br\">" + t + "</span>"; }
function cardHtml(c, extra, idx) {
  extra = extra || ""; var click = (idx == null) ? "" : (" onclick=\"tryPick(" + idx + ")\""); var mid = "", cor = "";
  if (c.type === "number") { cor = corner(String(c.value)); mid = "<div class=\"oval\"><span class=\"oval-n\">" + c.value + "</span></div>"; }
  else if (c.type === "skip") { cor = corner("X"); mid = "<div class=\"oval\"><div class=\"skip-ring mark\"></div></div>"; }
  else if (c.type === "reverse") { cor = corner("R"); mid = "<div class=\"oval\"><div class=\"rev mark\">R</div></div>"; }
  else if (c.type === "draw2") { cor = corner("+2"); mid = "<div class=\"oval\"><div class=\"plus\">+2</div></div>"; }
  else if (c.type === "wild") { mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div>"; }
  else if (c.type === "wild4") { cor = corner("+4"); mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div>"; }
  else if (c.type === "custom") { cor = corner("8"); mid = "<div class=\"oval\"><div class=\"plus\">8</div></div>"; }
  else if (c.type === "wdraw2") { cor = corner("+2"); mid = "<div class=\"oval\"><div class=\"plus\">+2</div></div>"; }
  else if (c.type === "wtarget2") { cor = corner("+2"); mid = "<div class=\"oval\"><div class=\"plus\">@2</div></div>"; }
  else if (c.type === "wskip2") { cor = corner("XX"); mid = "<div class=\"oval\"><div class=\"plus\">XX</div></div>"; }
  else if (c.type === "swap") { cor = corner("SW"); mid = "<div class=\"oval\"><div class=\"plus\">SW</div></div>"; }
  else if (c.type === "shuffle") { cor = corner("SH"); mid = "<div class=\"oval\"><div class=\"plus\">SH</div></div>"; }
  else if (c.type === "skipall") { cor = corner("ALL"); mid = "<div class=\"oval\"><div class=\"plus\">ALL</div></div>"; }
  return "<div class=\"ucard sm " + c.color + " " + extra + "\"" + click + ">" + cor + mid + (c.fresh ? "<span class=\"fresh-dot\"></span>" : "") + "</div>";
}
function backs(n) { var h = "", s = Math.min(n, 8); for (var i = 0; i < s; i++) h += "<div class=\"back\"></div>"; return h; }
function isActor() { return state && state.game && state.game.currentId === me.playerId; }
function colorRank(c) {
  if (c.color === "yellow") return 0;
  if (c.color === "green") return 1;
  if (c.color === "red") return 2;
  if (c.color === "blue") return 3;
  return 4;
}
function sortHand(hand) {
  return (hand || []).map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) {
    var d = colorRank(a.c) - colorRank(b.c); if (d) return d;
    var na = a.c.type === "number" ? Number(a.c.value) : 100;
    var nb = b.c.type === "number" ? Number(b.c.value) : 100;
    if (na !== nb) return na - nb;
    return String(a.c.type).localeCompare(String(b.c.type));
  });
}
function handHtml(hand, myTurn, g) {
  return "<div class=\"hand\">" + sortHand(hand).map(function (it) {
    var c = it.c, idx = it.i, cls = "";
    if (myTurn && g && canPlay(c, g.top, g.chosenColor, g.stackKind)) cls += " ok";
    else cls += " off";
    if (picked === idx) cls += " picked";
    return cardHtml(c, cls, idx);
  }).join("") + "</div>";
}
function render() {
  try {
    if (screen === "home") return home();
    if (screen === "cards") return cardsHelp();
    if (screen === "counts") return countsHelp();
    if (screen === "rules") return rulesHelp();
    if (screen === "create") return create();
    if (screen === "join") return join();
    if (screen === "lobby") return lobby();
    return game();
  } catch (e) { app.innerHTML = "<p class='err'>" + esc(e.message) + "</p>"; }
}
function ver() { return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V39</p>"; }
function home() { app.innerHTML = "<div class=\"logo\">UNO</div><p class=\"sub\" style=\"text-align:center\">Telefonlardan kodla katil</p><button class=\"btn btn-main\" onclick=\"goCreate()\">Oyun kur</button><button class=\"btn btn-ghost\" onclick=\"goJoin()\">Koda katil</button><button class=\"btn btn-ghost\" onclick=\"goCards()\">Ozel kartlar</button><button class=\"btn btn-ghost\" onclick=\"goCounts()\">Kart sayilari</button><button class=\"btn btn-ghost\" onclick=\"goRules()\">Kurallar</button><p class=\"err\">" + esc(err) + "</p>" + ver(); }
function create() { app.innerHTML = "<h1>Oyun kur</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>" + ver(); }
function join() { app.innerHTML = "<h1>Oyuna katil / geri don</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Oyun kodu</label><input id=\"code\" maxlength=\"6\" inputmode=\"numeric\" /><button class=\"btn btn-main\" onclick=\"doJoin()\">Katil</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>" + ver(); }
function lobby() {
  if (!state) { app.innerHTML = "<p>Baglaniyor...</p>"; return; }
  var isHost = state.hostId === me.playerId;
  var seats = state.seats || state.players.map(function (p) { return p.id; });
  var html = "<h1>Lobi</h1><div class=\"panel\"><div class=\"code\">" + esc(state.code) + "</div><p style=\"text-align:center\">" + state.players.length + " / " + state.maxPlayers + "</p></div><div class=\"panel\"><p>Masa sirasi (saat yonu, ilk altta)</p>";
  seats.forEach(function (id, i) {
    var p = null; for (var k = 0; k < state.players.length; k++) if (state.players[k].id === id) p = state.players[k];
    if (!p) return;
    html += "<div class=\"row\"><span>" + (i + 1) + ". " + esc(p.name) + (p.id === me.playerId ? " (sen)" : "") + "</span>";
    if (isHost) html += "<span><button class=\"mini-btn\" onclick=\"moveSeat(" + i + ",-1)\">Yukari</button><button class=\"mini-btn\" onclick=\"moveSeat(" + i + ",1)\">Asagi</button></span>";
    html += "</div>";
  });
  html += "</div>";
  if (isHost) {
    var rt = state.roundsTotal || 3;
    html += "<div class=\"panel\"><label>Tur sayisi (secili: "+rt+")</label><select id=\"rounds\" onchange=\"setRounds()\">";
    for (var n=1;n<=10;n++) html += "<option"+(n===rt?" selected":"")+">"+n+"</option>";
    html += "</select></div>";
    html += "<button class=\"btn btn-main\" " + (state.players.length < 2 ? "disabled" : "") + " onclick=\"doStart()\">Oyunu baslat</button>";
  } else html += "<p class=\"sub\">Kurucu sirayi ayarlar ve baslatir.</p>";
  html += "<button class=\"btn btn-ghost\" onclick=\"goCards()\">Ozel kartlar</button>";
  html += "<p class=\"err\">" + esc(err) + "</p>" + ver();
  app.innerHTML = html;
}
