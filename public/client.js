const socket = io();
const app = document.getElementById("app");
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
let me = { playerId: null, name: "" };
let state = null;
let screen = "home";
let err = "";
let pendingWild = null;
let drawnChoice = false;
socket.on("created", function (d) { me.playerId = d.playerId; screen = "lobby"; err = ""; render(); });
socket.on("joined", function (d) { me.playerId = d.playerId; screen = "lobby"; err = ""; render(); });
socket.on("state", function (s) {
  state = s;
  if (s.status === "playing" || s.status === "finished") screen = "game";
  if (s.status === "lobby") screen = "lobby";
  render();
});
socket.on("errorMsg", function (m) { err = m; render(); });
socket.on("drawnPlayable", function () { drawnChoice = true; render(); });
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function canPlay(card, top, chosenColor) {
  if (!card) return false;
  if (!top) return true;
  if (card.type === "wild" || card.type === "wild4") return true;
  var color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
function corner(txt) {
  return "<span class=\"c-tl\">" + txt + "</span><span class=\"c-br\">" + txt + "</span>";
}
function cardHtml(c, extra, idx) {
  extra = extra || "";
  var click = idx == null ? "" : (" onclick=\"tryPlay(" + idx + ")\"");
  var mid = "";
  var cor = "";
  if (c.type === "number") {
    cor = corner(String(c.value));
    mid = "<div class=\"oval\"><span class=\"oval-n\">" + c.value + "</span></div>";
  } else if (c.type === "skip") {
    cor = corner("∅");
    mid = "<div class=\"oval\"><div class=\"skip-ring mark\"></div></div>";
  } else if (c.type === "reverse") {
    cor = corner("⇄");
    mid = "<div class=\"oval\"><div class=\"rev mark\">⇄</div></div>";
  } else if (c.type === "draw2") {
    cor = corner("+2");
    mid = "<div class=\"oval\"><div class=\"mini-stack mark\"><i class=\"mini\"></i><i class=\"mini\"></i></div><div class=\"plus\">+2</div></div>";
  } else if (c.type === "wild") {
    cor = corner("");
    mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div>";
  } else if (c.type === "wild4") {
    cor = corner("+4");
    mid = "<div class=\"oval\"><div class=\"wheel\"><i></i><i></i><i></i><i></i></div></div><div class=\"uno-word\">+4</div>";
  }
  return "<div class=\"ucard sm " + c.color + " " + extra + "\"" + click + ">" + cor + mid + "</div>";
}
function render() {
  try {
    if (screen === "home") return renderHome();
    if (screen === "create") return renderCreate();
    if (screen === "join") return renderJoin();
    if (screen === "lobby") return renderLobby();
    return renderGame();
  } catch (e) {
    app.innerHTML = "<p class='err'>Ekran hatasi: " + esc(e.message) + "</p>";
  }
}
function renderHome() {
  app.innerHTML = "<div class=\"logo\">UNO</div><p class=\"sub\" style=\"text-align:center\">Telefonlardan kodla katil</p><button class=\"btn btn-main\" onclick=\"goCreate()\">Oyun kur</button><button class=\"btn btn-ghost\" onclick=\"goJoin()\">Koda katil</button><p class=\"err\">" + esc(err) + "</p>";
}
function renderCreate() {
  app.innerHTML = "<h1>Oyun kur</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>";
}
function renderJoin() {
  app.innerHTML = "<h1>Oyuna katil</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Oyun kodu</label><input id=\"code\" maxlength=\"6\" inputmode=\"numeric\" /><button class=\"btn btn-main\" onclick=\"doJoin()\">Katil</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>";
}
function renderLobby() {
  if (!state) { app.innerHTML = "<p>Baglaniyor...</p>"; return; }
  var isHost = state.hostId === me.playerId;
  var full = state.players.length >= state.maxPlayers;
  var list = state.players.map(function (p) {
    return "<div class=\"row\"><span class=\"" + (p.id === me.playerId ? "you" : "") + "\">" + esc(p.name) + (p.id === state.hostId ? " kurucu" : "") + (p.id === me.playerId ? " (sen)" : "") + "</span><span class=\"badge\">" + (p.connected ? "bagli" : "koptu") + "</span></div>";
  }).join("");
  var btn = isHost
    ? "<button class=\"btn btn-main\" " + (state.players.length < 2 ? "disabled" : "") + " onclick=\"socket.emit('start')\">" + (full ? "Oyunu baslat" : "Eksik olsa da baslat") + "</button>"
    : "<p class=\"sub\">Kurucu baslatinca oyun acilir.</p>";
  app.innerHTML = "<h1>Lobi</h1><div class=\"panel\"><div class=\"code\">" + esc(state.code) + "</div><p style=\"text-align:center\">" + state.players.length + " / " + state.maxPlayers + "</p></div><div class=\"panel\">" + list + "</div>" + btn + "<p class=\"err\">" + esc(err) + "</p>";
}
function renderGame() {
  var g = state && state.game;
  if (!g) return renderLobby();
  var top = g.top;
  var myTurn = g.currentId === me.playerId && !g.winnerId;
  var hand = g.hand || [];
  var turnName = "";
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].id === g.currentId) turnName = state.players[i].name;
  }
  var html = "";
  html += "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Deste " + g.deckCount + "</span></div>";
  html += "<div class=\"panel\"><b>" + (myTurn ? "SIRA SENDE. Uygun karta dokun veya cek." : ("SIRA: " + esc(turnName || "?") + " - bekle.")) + "</b></div>";
  html += "<p class=\"msg\">" + esc(g.lastAction || "") + "</p>";
  html += "<div class=\"top-wrap\">" + (top ? cardHtml(top, "") : "") + "<div>Renk: <b>" + esc(g.chosenColor ? (COLOR_TR[g.chosenColor] || g.chosenColor) : "-") + "</b></div></div>";
  html += "<div class=\"panel\">";
  html += state.players.map(function (p) {
    return "<div class=\"row\"><span class=\"" + (p.id === me.playerId ? "you" : "") + "\">" + (p.isTurn ? "> " : "") + esc(p.name) + (p.saidUno ? " UNO" : "") + "</span><span>" + p.cardCount + " kart</span></div>";
  }).join("");
  html += "</div>";
  if (g.winnerId) {
    var wname = "Oyuncu";
    for (var j = 0; j < state.players.length; j++) if (state.players[j].id === g.winnerId) wname = state.players[j].name;
    html += "<div class=\"panel\"><h2>" + esc(wname) + " kazandi</h2>";
    if (state.hostId === me.playerId) html += "<button class=\"btn btn-main\" onclick=\"socket.emit('again')\">Yeni el</button>";
    html += "</div>";
  } else {
    html += "<div class=\"hand\">";
    html += hand.map(function (c, idx) {
      var ok = myTurn && canPlay(c, top, g.chosenColor);
      return cardHtml(c, ok ? "ok" : "off", idx);
    }).join("");
    html += "</div>";
    html += "<button class=\"btn btn-ghost\" " + (myTurn ? "" : "disabled") + " onclick=\"socket.emit('draw')\">Kart cek</button>";
    html += "<button class=\"btn btn-main\" onclick=\"socket.emit('uno')\">UNO!</button>";
    if (pendingWild !== null) {
      html += "<div class=\"panel\"><p>Renk sec</p><div class=\"colors\">";
      html += "<button style=\"background:var(--red)\" onclick=\"confirmWild('red')\">Kirmizi</button>";
      html += "<button style=\"background:var(--yellow);color:#222\" onclick=\"confirmWild('yellow')\">Sari</button>";
      html += "<button style=\"background:var(--green)\" onclick=\"confirmWild('green')\">Yesil</button>";
      html += "<button style=\"background:var(--blue)\" onclick=\"confirmWild('blue')\">Mavi</button></div></div>";
    }
    if (drawnChoice && myTurn) {
      html += "<div class=\"panel\"><p>Cektigin karti oynayabilirsin.</p><button class=\"btn btn-main\" onclick=\"playDrawn()\">Oyna</button><button class=\"btn btn-ghost\" onclick=\"passDrawn()\">Pas</button></div>";
    }
  }
  html += "<p class=\"err\">" + esc(err) + "</p>";
  app.innerHTML = html;
}
function tryPlay(i) {
  err = "";
  if (!state || !state.game) return;
  var card = state.game.hand[i];
  if (!card) return;
  if (state.game.currentId !== me.playerId) { err = "Sira sende degil."; render(); return; }
  if (card.type === "wild" || card.type === "wild4") { pendingWild = i; render(); return; }
  socket.emit("play", { cardIndex: i });
}
function confirmWild(color) {
  var i = pendingWild;
  pendingWild = null;
  socket.emit("play", { cardIndex: i, chosenColor: color });
}
function playDrawn() {
  drawnChoice = false;
  var last = state.game.hand.length - 1;
  var card = state.game.hand[last];
  if (card && (card.type === "wild" || card.type === "wild4")) { pendingWild = last; render(); return; }
  socket.emit("play", { cardIndex: last });
}
function passDrawn() { drawnChoice = false; socket.emit("passAfterDraw"); }
function goHome() { screen = "home"; err = ""; render(); }
function goCreate() { screen = "create"; err = ""; render(); }
function goJoin() { screen = "join"; err = ""; render(); }
function doCreate() {
  var name = document.getElementById("name").value.trim() || "Kurucu";
  var max = document.getElementById("max").value;
  me.name = name;
  socket.emit("create", { name: name, maxPlayers: max });
}
function doJoin() {
  var name = document.getElementById("name").value.trim() || "Oyuncu";
  var code = document.getElementById("code").value.trim();
  me.name = name;
  socket.emit("join", { name: name, code: code });
}
render();
