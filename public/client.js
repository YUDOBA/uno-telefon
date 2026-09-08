const socket = io();
const app = document.getElementById("app");
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
const VERSION = "V4";
let me = { playerId: null, name: localStorage.getItem("uno_name") || "", token: localStorage.getItem("uno_token") || "" };
let state = null, screen = "home", err = "", pendingWild = null, pendingCustom = null, assignMap = {}, drawnChoice = false, showScores = false;
socket.on("created", function (d) { me.playerId = d.playerId; me.token = d.token; localStorage.setItem("uno_token", d.token); localStorage.setItem("uno_name", me.name); screen = "lobby"; err = ""; render(); });
socket.on("joined", function (d) { me.playerId = d.playerId; me.token = d.token; localStorage.setItem("uno_token", d.token); localStorage.setItem("uno_name", me.name); screen = "lobby"; err = ""; render(); });
socket.on("state", function (s) { state = s; if (s.status === "playing" || s.status === "finished" || s.status === "roundEnd") screen = "game"; if (s.status === "lobby") screen = "lobby"; render(); });
socket.on("errorMsg", function (m) { err = m; render(); });
socket.on("drawnPlayable", function () { drawnChoice = true; render(); });
function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function canPlay(card, top, chosenColor, stackKind) {
  if (!card) return false; if (!top) return true;
  if (stackKind === "draw2") return card.type === "draw2";
  if (stackKind === "wild4" || stackKind === "custom") return false;
  if (card.type === "wild" || card.type === "custom") return true;
  if (card.type === "wild4") return top.type === "number" || top.type === "wild" || top.type === "wild4" || top.type === "custom";
  var color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
function corner(t) { return "<span class=\"c-tl\">" + t + "</span><span class=\"c-br\">" + t + "</span>"; }
function cardHtml(c, extra, idx) {
  extra = extra || ""; var click = idx == null ? "" : (" onclick=\"tryPlay(" + idx + ")\""); var mid = "", cor = "";
  if (c.type === "number") { cor = corner(String(c.value)); mid = "<div class=\"oval\"><span class=\"oval-n\">" + c.value + "</span></div>"; }
  else if (c.type === "skip") { cor = corner("X"); mid = "<div class=\"oval\"><div class=\"skip-ring mark\"></div></div>"; }
  else if (c.type === "reverse") { cor = corner("R"); mid = "<div class=\"oval\"><div class=\"rev mark\">R</div></div>"; }
  else if (c.type === "draw2") { cor = corner("+2"); mid = "<div class=\"oval\"><div class=\"plus\">+2</div></div>"; }
  else if (c.type === "wild") { mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div>"; }
  else if (c.type === "wild4") { cor = corner("+4"); mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div>"; }
  else if (c.type === "custom") { cor = corner("8"); mid = "<div class=\"oval\"><div class=\"plus\">8</div></div>"; }
  return "<div class=\"ucard sm " + c.color + " " + extra + "\"" + click + ">" + cor + mid + "</div>";
}
function backs(n) { var h = "", s = Math.min(n, 8); for (var i = 0; i < s; i++) h += "<div class=\"back\"></div>"; return h; }
function isActor() { return state && state.game && state.game.currentId === me.playerId; }
function render() {
  try {
    if (screen === "home") return home();
    if (screen === "create") return create();
    if (screen === "join") return join();
    if (screen === "lobby") return lobby();
    return game();
  } catch (e) { app.innerHTML = "<p class='err'>" + esc(e.message) + "</p>"; }
}
function ver() { return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon " + VERSION + "</p>"; }
function home() { app.innerHTML = "<div class=\"logo\">UNO</div><p class=\"sub\" style=\"text-align:center\">Telefonlardan kodla katil</p><button class=\"btn btn-main\" onclick=\"goCreate()\">Oyun kur</button><button class=\"btn btn-ghost\" onclick=\"goJoin()\">Koda katil</button><p class=\"err\">" + esc(err) + "</p>" + ver(); }
function create() { app.innerHTML = "<h1>Oyun kur</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>" + ver(); }
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
    html += "<div class=\"panel\"><label>Tur sayisi</label><select id=\"rounds\"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select></div>";
    html += "<button class=\"btn btn-main\" " + (state.players.length < 2 ? "disabled" : "") + " onclick=\"doStart()\">Oyunu baslat</button>";
  } else html += "<p class=\"sub\">Kurucu sirayi ayarlar ve baslatir.</p>";
  html += "<p class=\"err\">" + esc(err) + "</p>" + ver();
  app.innerHTML = html;
}
function scoreTable() {
  var rows = (state.players || []).slice().sort(function (a, b) { return (a.score || 0) - (b.score || 0); });
  var h = "<div class=\"panel\"><h2>Skor</h2><p>Tur " + (state.roundNow || 1) + " / " + (state.roundsTotal || 1) + "</p>";
  rows.forEach(function (p, i) {
    var extra = state.lastRoundPts && state.lastRoundPts[p.id] != null ? " (tur +" + state.lastRoundPts[p.id] + ")" : "";
    h += "<div class=\"row\"><span>" + (i + 1) + ". " + esc(p.name) + "</span><span>" + (p.score || 0) + extra + "</span></div>";
  });
  if (state.status === "playing") h += "<button class=\"btn btn-ghost\" onclick=\"showScores=false;render()\">Oyuna don</button>";
  if (state.status === "roundEnd" && state.hostId === me.playerId) h += "<button class=\"btn btn-main\" onclick=\"socket.emit('start',{})\">Sonraki tur</button>";
  if (state.status === "finished") {
    h += "<p><b>En dusuk puan kazanir.</b></p>";
    if (state.hostId === me.playerId) h += "<button class=\"btn btn-main\" onclick=\"socket.emit('again')\">Yeni oyun</button>";
  }
  return h + "</div>";
}
function tableHtml() {
  var seats = state.seats || state.players.map(function (p) { return p.id; });
  var selfI = seats.indexOf(me.playerId); if (selfI < 0) selfI = 0;
  var n = seats.length || 1, html = "<div class=\"table\">";
  html += "<div class=\"felt\">" + (state.game && state.game.top ? cardHtml(state.game.top, "") : "") + "<div class=\"dir\">" + (state.game && state.game.direction === 1 ? "Saat yonunde" : "Ters yon") + "</div></div>";
  for (var i = 0; i < n; i++) {
    var pid = seats[i], p = null;
    for (var k = 0; k < state.players.length; k++) if (state.players[k].id === pid) p = state.players[k];
    if (!p) continue;
    var a = Math.PI / 2 + ((i - selfI) / n) * 2 * Math.PI;
    var x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 38;
    html += "<div class=\"seat" + (p.isTurn ? " seat-turn" : "") + (p.id === me.playerId ? " seat-me" : "") + "\" style=\"left:" + x + "%;top:" + y + "%\">";
    html += "<div class=\"seat-name\">" + esc(p.name) + (p.id === me.playerId ? " (sen)" : "") + "</div>";
    html += "<div class=\"seat-backs\">" + backs(p.cardCount) + "</div><div class=\"seat-count\">" + p.cardCount + " kart</div>";
    if (p.saidUno) html += "<div class=\"seat-uno\">UNO</div>";
    html += "</div>";
  }
  return html + "</div>";
}
function assignPanel() {
  var others = state.players.filter(function (p) { return p.id !== me.playerId; });
  var sum = 0; others.forEach(function (p) { sum += assignMap[p.id] || 0; });
  var h = "<div class=\"panel\"><p>8 cezayi dagit (" + sum + " / 8)</p>";
  others.forEach(function (p) {
    var v = assignMap[p.id] || 0;
    h += "<div class=\"row\"><span>" + esc(p.name) + "</span><span><button class=\"mini-btn\" onclick=\"chgAs('" + p.id + "',-1)\">-</button> " + v + " <button class=\"mini-btn\" onclick=\"chgAs('" + p.id + "',1)\">+</button></span></div>";
  });
  h += "<button class=\"btn btn-main\" " + (sum === 8 ? "" : "disabled") + " onclick=\"confirmCustom()\">Dagit ve at</button>";
  h += "<button class=\"btn btn-ghost\" onclick=\"pendingCustom=null;pendingWild=null;render()\">Vazgec</button></div>";
  return h;
}
function game() {
  var g = state && state.game;
  if (state.status === "roundEnd" || state.status === "finished" || showScores) {
    app.innerHTML = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + state.roundNow + "/" + state.roundsTotal + "</span></div>" + scoreTable() + ver();
    return;
  }
  if (!g) return lobby();
  var myTurn = isActor() && !g.winnerId && !state.paused;
  var html = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + (state.roundNow || 1) + "/" + (state.roundsTotal || 1) + "</span></div>";
  if (g.noticeYou) html += "<div class=\"panel warn\">" + esc(g.noticeYou) + "</div>";
  else if (g.notice) html += "<div class=\"panel warn\">" + esc(g.notice) + "</div>";
  if (state.paused) html += "<div class=\"panel warn\">Kopan oyuncu donmeli.</div>";
  if (g.plusStack) html += "<div class=\"panel warn\">Ceza yigini: " + g.plusStack + "</div>";
  html += "<p class=\"msg\">" + esc(g.lastAction || "") + "</p>" + tableHtml();
  html += "<div class=\"hand\">" + (g.hand || []).map(function (c, idx) {
    return cardHtml(c, myTurn && canPlay(c, g.top, g.chosenColor, g.stackKind) ? "ok" : "off", idx);
  }).join("") + "</div>";
  html += "<button class=\"btn btn-ghost\" " + (myTurn && !state.paused ? "" : "disabled") + " onclick=\"socket.emit('draw')\">Kart cek</button>";
  html += "<button class=\"btn btn-main\" onclick=\"socket.emit('uno')\">UNO!</button>";
  html += "<button class=\"btn btn-ghost\" onclick=\"showScores=true;render()\">Skor tabelasi</button>";
  if (pendingWild !== null && !pendingCustom) {
    html += "<div class=\"panel\"><p>Renk sec</p><div class=\"colors\">";
    html += "<button style=\"background:var(--red)\" onclick=\"confirmWild('red')\">Kirmizi</button>";
    html += "<button style=\"background:var(--yellow);color:#222\" onclick=\"confirmWild('yellow')\">Sari</button>";
    html += "<button style=\"background:var(--green)\" onclick=\"confirmWild('green')\">Yesil</button>";
    html += "<button style=\"background:var(--blue)\" onclick=\"confirmWild('blue')\">Mavi</button></div></div>";
  }
  if (pendingCustom && pendingCustom.color) html += assignPanel();
  if (drawnChoice && myTurn && !g.plusStack && !(g.drawQueue && g.drawQueue.length)) {
    html += "<div class=\"panel\"><p>Cektigin karti oynayabilirsin.</p><button class=\"btn btn-main\" onclick=\"playDrawn()\">Oyna</button><button class=\"btn btn-ghost\" onclick=\"passDrawn()\">Pas</button></div>";
  }
  html += "<p class=\"err\">" + esc(err) + "</p>" + ver();
  app.innerHTML = html;
}
function moveSeat(i, dir) {
  var seats = (state.seats || []).slice();
  var j = i + dir; if (j < 0 || j >= seats.length) return;
  var t = seats[i]; seats[i] = seats[j]; seats[j] = t;
  socket.emit("setSeats", { seats: seats });
}
function doStart() {
  var r = document.getElementById("rounds");
  socket.emit("start", { rounds: r ? r.value : 3 });
}
function tryPlay(i) {
  err = ""; if (!state || !state.game) return;
  if (state.paused) { err = "Oyun bekliyor."; render(); return; }
  var card = state.game.hand[i]; if (!card) return;
  if (!isActor()) { err = "Sira sende degil."; render(); return; }
  if (card.type === "custom") { pendingCustom = { i: i, color: null }; pendingWild = i; render(); return; }
  if (card.type === "wild" || card.type === "wild4") { pendingWild = i; render(); return; }
  socket.emit("play", { cardIndex: i });
}
function confirmWild(color) {
  var i = pendingWild; pendingWild = null;
  if (pendingCustom) { pendingCustom.color = color; render(); return; }
  socket.emit("play", { cardIndex: i, chosenColor: color });
}
function chgAs(id, d) {
  var v = (assignMap[id] || 0) + d; if (v < 0) v = 0;
  var sum = 0; Object.keys(assignMap).forEach(function (k) { if (k !== id) sum += assignMap[k] || 0; });
  if (sum + v > 8) v = 8 - sum; assignMap[id] = v; render();
}
function confirmCustom() {
  var assign = []; Object.keys(assignMap).forEach(function (k) { if (assignMap[k]) assign.push({ playerId: k, n: assignMap[k] }); });
  socket.emit("play", { cardIndex: pendingCustom.i, chosenColor: pendingCustom.color, assign: assign });
  pendingCustom = null; assignMap = {}; pendingWild = null;
}
function playDrawn() { drawnChoice = false; tryPlay(state.game.hand.length - 1); }
function passDrawn() { drawnChoice = false; socket.emit("passAfterDraw"); }
function goHome() { screen = "home"; err = ""; render(); }
function goCreate() { screen = "create"; err = ""; render(); }
function goJoin() { screen = "join"; err = ""; render(); }
function doCreate() { var name = document.getElementById("name").value.trim() || "Kurucu"; me.name = name; socket.emit("create", { name: name, maxPlayers: document.getElementById("max").value }); }
function doJoin() { var name = document.getElementById("name").value.trim() || "Oyuncu"; me.name = name; socket.emit("join", { name: name, code: document.getElementById("code").value.trim(), token: me.token }); }
render();
