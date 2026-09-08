const socket = io();
const app = document.getElementById("app");
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
const SYMBOL = { skip: "X", reverse: "R", draw2: "+2", wild: "*", wild4: "+4" };
let me = { playerId: null, name: "" };
let state = null;
let screen = "home";
let err = "";
let pendingWild = null;
let drawnChoice = false;
socket.on("created", ({ playerId }) => { me.playerId = playerId; screen = "lobby"; err = ""; render(); });
socket.on("joined", ({ playerId }) => { me.playerId = playerId; screen = "lobby"; err = ""; render(); });
socket.on("state", (s) => {
  state = s;
  if (s.status === "playing" || s.status === "finished") screen = "game";
  if (s.status === "lobby") screen = "lobby";
  render();
});
socket.on("errorMsg", (m) => { err = m; render(); });
socket.on("drawnPlayable", () => { drawnChoice = true; render(); });
function cardFace(c) {
  const inner = c.type === "number" ? c.value : (SYMBOL[c.type] || "?");
  return "<div class=\"ucard " + c.color + "\">" + inner + "</div>";
}
function canPlay(card, top, chosenColor) {
  if (!top) return true;
  if (card.type === "wild" || card.type === "wild4") return true;
  const color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
function esc(s) {
  return String(s || "").replace(/[&<>\"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
  });
}
function render() {
  if (screen === "home") return renderHome();
  if (screen === "create") return renderCreate();
  if (screen === "join") return renderJoin();
  if (screen === "lobby") return renderLobby();
  return renderGame();
}
function renderHome() {
  app.innerHTML = "<div class=\"logo\">UNO</div><p class=\"sub\" style=\"text-align:center\">Telefonlardan kodla katil</p><button class=\"btn btn-main\" onclick=\"goCreate()\">Oyun kur</button><button class=\"btn btn-ghost\" onclick=\"goJoin()\">Koda katil</button><p class=\"err\">" + esc(err) + "</p>";
}
function renderCreate() {
  app.innerHTML = "<h1>Oyun kur</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>";
}
function renderJoin() {
  app.innerHTML = "<h1>Oyuna katil</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Oyun kodu</label><input id=\"code\" maxlength=\"6\" style=\"text-transform:uppercase\" /><button class=\"btn btn-main\" onclick=\"doJoin()\">Katil</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>";
}
function renderLobby() {
  if (!state) { app.innerHTML = "<p>Baglaniyor...</p>"; return; }
  const isHost = state.hostId === me.playerId;
  const full = state.players.length >= state.maxPlayers;
  let list = state.players.map(function (p) {
    return "<div class=\"row\"><span class=\"" + (p.id === me.playerId ? "you" : "") + "\">" + esc(p.name) + (p.id === state.hostId ? " kurucu" : "") + (p.id === me.playerId ? " (sen)" : "") + "</span><span class=\"badge\">" + (p.connected ? "bagli" : "koptu") + "</span></div>";
  }).join("");
  let btn = isHost ? ("<button class=\"btn btn-main\" " + (state.players.length < 2 ? "disabled" : "") + " onclick=\"socket.emit('start')\">" + (full ? "Oyunu baslat" : "Eksik olsa da baslat") + "</button>") : "<p class=\"sub\">Kurucu baslatinca oyun acilir.</p>";
  app.innerHTML = "<h1>Lobi</h1><div class=\"panel\"><div class=\"code\">" + esc(state.code) + "</div><p style=\"text-align:center\">" + state.players.length + " / " + state.maxPlayers + "</p></div><div class=\"panel\">" + list + "</div>" + btn + "<p class=\"err\">" + esc(err) + "</p>";
}
function renderGame() {
  const g = state.game;
  if (!g) return renderLobby();
  const top = g.top;
  const myTurn = g.currentId === me.playerId && !g.winnerId;
  const hand = g.hand || [];
  let html = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Deste " + g.deckCount + "</span></div><p class=\"msg\">" + esc(g.lastAction || "") + "</p><div class=\"top-wrap\">" + (top ? cardFace(top) : "") + "<div>Renk: <b>" + (g.chosenColor ? COLOR_TR[g.chosenColor] : "-") + "</b></div></div><div class=\"panel\">";
  html += state.players.map(function (p) {
    return "<div class=\"row\"><span>" + (p.isTurn ? "> " : "") + esc(p.name) + (p.saidUno ? " UNO" : "") + "</span><span>" + p.cardCount + " kart</span></div>";
  }).join("");
  html += "</div>";
  if (g.winnerId) {
    const w = state.players.find(function (p) { return p.id === g.winnerId; });
    html += "<div class=\"panel\"><h2>" + esc(w ? w.name : "Oyuncu") + " kazandi</h2>";
    if (state.hostId === me.playerId) html += "<button class=\"btn btn-main\" onclick=\"socket.emit('again')\">Yeni el</button>";
    html += "</div>";
  } else {
    html += "<div class=\"hand\">";
    html += hand.map(function (c, i) {
      const ok = myTurn && canPlay(c, top, g.chosenColor);
      const face = c.type === "number" ? c.value : (SYMBOL[c.type] || "?");
      return "<div onclick=\"tryPlay(" + i + ")\" class=\"ucard sm " + c.color + " " + (ok ? "ok" : "off") + "\">" + face + "</div>";
    }).join("");
    html += "</div><button class=\"btn btn-ghost\" " + (myTurn ? "" : "disabled") + " onclick=\"socket.emit('draw')\">Kart cek</button><button class=\"btn btn-main\" onclick=\"socket.emit('uno')\">UNO!</button>";
    if (pendingWild !== null) {
      html += "<div class=\"panel\"><p>Renk sec</p><div class=\"colors\"><button style=\"background:var(--red)\" onclick=\"confirmWild('red')\">Kirmizi</button><button style=\"background:var(--yellow);color:#222\" onclick=\"confirmWild('yellow')\">Sari</button><button style=\"background:var(--green)\" onclick=\"confirmWild('green')\">Yesil</button><button style=\"background:var(--blue)\" onclick=\"confirmWild('blue')\">Mavi</button></div></div>";
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
  const card = state.game.hand[i];
  if (!card) return;
  if (card.type === "wild" || card.type === "wild4") { pendingWild = i; render(); return; }
  socket.emit("play", { cardIndex: i });
}
function confirmWild(color) {
  const i = pendingWild;
  pendingWild = null;
  socket.emit("play", { cardIndex: i, chosenColor: color });
}
function playDrawn() {
  drawnChoice = false;
  const last = state.game.hand.length - 1;
  const card = state.game.hand[last];
  if (card && (card.type === "wild" || card.type === "wild4")) { pendingWild = last; render(); return; }
  socket.emit("play", { cardIndex: last });
}
function passDrawn() { drawnChoice = false; socket.emit("passAfterDraw"); }
function goHome() { screen = "home"; err = ""; render(); }
function goCreate() { screen = "create"; err = ""; render(); }
function goJoin() { screen = "join"; err = ""; render(); }
function doCreate() {
  const name = document.getElementById("name").value.trim() || "Kurucu";
  const max = document.getElementById("max").value;
  me.name = name;
  socket.emit("create", { name: name, maxPlayers: max });
}
function doJoin() {
  const name = document.getElementById("name").value.trim() || "Oyuncu";
  const code = document.getElementById("code").value.trim().toUpperCase();
  me.name = name;
  socket.emit("join", { name: name, code: code });
}
render();
