const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "public")));
const COLORS = ["red", "yellow", "green", "blue"];
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
function makeDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, type: "number", value: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color, type: "number", value: n });
      deck.push({ color, type: "number", value: n });
    }
    for (const type of ["skip", "reverse", "draw2"]) {
      deck.push({ color, type, value: type });
      deck.push({ color, type, value: type });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "black", type: "wild", value: "wild" });
    deck.push({ color: "black", type: "wild4", value: "wild4" });
  }
  return shuffle(deck);
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function cardKey(c) { return c.color + "-" + c.type + "-" + c.value; }
function cardLabel(c) {
  if (c.type === "number") return (COLOR_TR[c.color] || c.color) + " " + c.value;
  if (c.type === "skip") return COLOR_TR[c.color] + " Atla";
  if (c.type === "reverse") return COLOR_TR[c.color] + " Ters";
  if (c.type === "draw2") return COLOR_TR[c.color] + " +2";
  if (c.type === "wild") return "Joker";
  if (c.type === "wild4") return "Joker +4";
  return "?";
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
function hasMatchingColor(hand, color) { return hand.some((c) => c.color === color); }
const rooms = new Map();
function codeGen() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? codeGen() : code;
}
function publicRoom(room, viewerId) {
  const g = room.game;
  return {
    code: room.code, maxPlayers: room.maxPlayers, hostId: room.hostId, status: room.status,
    players: room.players.map((p) => ({
      id: p.id, name: p.name, connected: p.connected,
      cardCount: g ? g.hands[p.id].length : 0,
      saidUno: g ? !!g.saidUno[p.id] : false,
      isTurn: g ? g.currentId === p.id : false
    })),
    game: g ? {
      top: g.discard[g.discard.length - 1], chosenColor: g.chosenColor, direction: g.direction,
      currentId: g.currentId, winnerId: g.winnerId, lastAction: g.lastAction,
      hand: g.hands[viewerId] || [], deckCount: g.deck.length
    } : null
  };
}
function emitRoom(room) {
  for (const p of room.players) {
    if (p.socketId) io.to(p.socketId).emit("state", publicRoom(room, p.id));
  }
}
function nameOf(room, id) {
  const p = room.players.find((x) => x.id === id);
  return p ? p.name : "Oyuncu";
}
function nextAlive(room, fromId, skipOne) {
  const ids = room.players.map((p) => p.id);
  if (!ids.length) return fromId;
  const dir = room.game.direction;
  let i = ids.indexOf(fromId);
  if (i < 0) i = 0;
  const step = skipOne ? 2 : 1;
  return ids[(i + step * dir + ids.length * 10) % ids.length];
}
function drawCards(game, playerId, n) {
  const taken = [];
  for (let i = 0; i < n; i++) {
    if (!game.deck.length) {
      const top = game.discard.pop();
      game.deck = shuffle(game.discard);
      game.discard = top ? [top] : [];
      if (!game.deck.length) break;
    }
    const c = game.deck.pop();
    game.hands[playerId].push(c);
    taken.push(c);
  }
  game.saidUno[playerId] = false;
  return taken;
}
function startGame(room) {
  const deck = makeDeck();
  const hands = {};
  for (const p of room.players) hands[p.id] = [];
  for (let i = 0; i < 7; i++) {
    for (const p of room.players) hands[p.id].push(deck.pop());
  }
  let first = deck.pop();
  while (first && first.type === "wild4") { deck.unshift(first); first = deck.pop(); }
  const currentId = room.players[0].id;
  room.game = {
    deck: deck, discard: [first], hands: hands, currentId: currentId, direction: 1,
    chosenColor: first.color === "black" ? null : first.color,
    saidUno: {}, winnerId: null, lastAction: "Oyun basladi. Ust kart: " + cardLabel(first)
  };
  room.status = "playing";
  if (first.type === "skip") {
    room.game.currentId = nextAlive(room, currentId, false);
    room.game.lastAction = "Acilis Atla";
  } else if (first.type === "reverse") {
    if (room.players.length === 2) room.game.currentId = nextAlive(room, currentId, false);
    else room.game.direction = -1;
    room.game.lastAction = "Acilis Ters";
  } else if (first.type === "draw2") {
    drawCards(room.game, currentId, 2);
    room.game.currentId = nextAlive(room, currentId, false);
    room.game.lastAction = "Acilis +2";
  }
}
io.on("connection", (socket) => {
  socket.data.playerId = null;
  socket.data.roomCode = null;
  socket.on("create", ({ name, maxPlayers }) => {
    const n = Math.max(2, Math.min(10, parseInt(maxPlayers, 10) || 2));
    const code = codeGen();
    const playerId = socket.id;
    const room = {
      code: code, hostId: playerId, maxPlayers: n, status: "lobby", game: null,
      players: [{ id: playerId, name: String(name || "Kurucu").slice(0, 16), socketId: socket.id, connected: true }]
    };
    rooms.set(code, room);
    socket.data.playerId = playerId;
    socket.data.roomCode = code;
    socket.join(code);
    socket.emit("created", { code: code, playerId: playerId });
    emitRoom(room);
  });
  socket.on("join", ({ code, name }) => {
    const room = rooms.get(String(code || "").toUpperCase());
    if (!room) return socket.emit("errorMsg", "Oda bulunamadi.");
    if (room.status !== "lobby") return socket.emit("errorMsg", "Oyun zaten basladi.");
    if (room.players.length >= room.maxPlayers) return socket.emit("errorMsg", "Oda dolu.");
    const playerId = socket.id;
    room.players.push({ id: playerId, name: String(name || "Oyuncu").slice(0, 16), socketId: socket.id, connected: true });
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    socket.emit("joined", { code: room.code, playerId: playerId });
    emitRoom(room);
  });
  socket.on("start", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.hostId !== socket.data.playerId) return socket.emit("errorMsg", "Sadece kurucu baslatabilir.");
    if (room.status !== "lobby") return;
    if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
    startGame(room);
    emitRoom(room);
  });
  socket.on("play", ({ cardIndex, chosenColor }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    const g = room.game;
    const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    const hand = g.hands[pid];
    const card = hand[cardIndex];
    if (!card) return;
    const top = g.discard[g.discard.length - 1];
    if (!canPlay(card, top, g.chosenColor)) return socket.emit("errorMsg", "Bu kart oynanamaz.");
    if (card.type === "wild4") {
      const colorNow = top.color === "black" ? g.chosenColor : top.color;
      if (colorNow && hasMatchingColor(hand.filter((_, i) => i !== cardIndex), colorNow)) {
        return socket.emit("errorMsg", "+4 sadece o renkte kartin yoksa atilir.");
      }
    }
    if ((card.type === "wild" || card.type === "wild4") && COLORS.indexOf(chosenColor) < 0) {
      return socket.emit("errorMsg", "Renk sec.");
    }
    hand.splice(cardIndex, 1);
    g.discard.push(card);
    g.chosenColor = card.color === "black" ? chosenColor : card.color;
    if (hand.length === 1 && !g.saidUno[pid]) {
      drawCards(g, pid, 2);
      g.lastAction = nameOf(room, pid) + " UNO demedi, 2 kart cekti.";
    }
    if (hand.length === 0) {
      g.winnerId = pid;
      g.lastAction = nameOf(room, pid) + " kazandi!";
      room.status = "finished";
      emitRoom(room);
      return;
    }
    const two = room.players.length === 2;
    let skip = false;
    if (card.type === "skip") skip = true;
    if (card.type === "reverse") {
      if (two) skip = true; else g.direction *= -1;
    }
    if (card.type === "draw2") {
      const victim = nextAlive(room, pid, skip);
      drawCards(g, victim, 2);
      skip = true;
      g.lastAction = nameOf(room, pid) + " +2 atti. " + nameOf(room, victim) + " 2 kart cekti.";
    } else if (card.type === "wild4") {
      const victim = nextAlive(room, pid, false);
      drawCards(g, victim, 4);
      skip = true;
      g.lastAction = nameOf(room, pid) + " +4 atti. " + nameOf(room, victim) + " 4 kart cekti.";
    } else if (card.type === "wild") {
      g.lastAction = nameOf(room, pid) + " Joker atti.";
    } else {
      g.lastAction = nameOf(room, pid) + " " + cardLabel(card) + " atti.";
    }
    g.currentId = nextAlive(room, pid, skip);
    emitRoom(room);
  });
  socket.on("draw", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    const g = room.game;
    const pid = socket.data.playerId;
    if (g.winnerId || g.currentId !== pid) return;
    const top = g.discard[g.discard.length - 1];
    if (g.hands[pid].some((c) => canPlay(c, top, g.chosenColor))) {
      return socket.emit("errorMsg", "Oynayabilecegin kart var, cekemezsin.");
    }
    const taken = drawCards(g, pid, 1);
    const drawn = taken[0];
    if (drawn && canPlay(drawn, top, g.chosenColor)) {
      g.pendingDrawn = { playerId: pid, card: drawn };
      g.lastAction = nameOf(room, pid) + " kart cekti, oynayabilir.";
      emitRoom(room);
      socket.emit("drawnPlayable");
      return;
    }
    g.lastAction = nameOf(room, pid) + " kart cekti, oynayamadi.";
    g.currentId = nextAlive(room, pid, false);
    emitRoom(room);
  });
  socket.on("passAfterDraw", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const g = room.game;
    const pid = socket.data.playerId;
    if (!g.pendingDrawn || g.pendingDrawn.playerId !== pid) return;
    delete g.pendingDrawn;
    g.lastAction = nameOf(room, pid) + " cektigi karti oynamadi.";
    g.currentId = nextAlive(room, pid, false);
    emitRoom(room);
  });
  socket.on("uno", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const pid = socket.data.playerId;
    if (room.game.hands[pid].length <= 2) {
      room.game.saidUno[pid] = true;
      room.game.lastAction = nameOf(room, pid) + ": UNO!";
      emitRoom(room);
    }
  });
  socket.on("again", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    room.status = "lobby";
    room.game = null;
    emitRoom(room);
  });
  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const pid = socket.data.playerId;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.find((x) => x.id === pid);
    if (p) { p.connected = false; p.socketId = null; }
    if (room.status === "lobby") {
      room.players = room.players.filter((x) => x.id !== pid);
      if (!room.players.length) { rooms.delete(code); return; }
      if (room.hostId === pid) room.hostId = room.players[0].id;
    } else if (room.game && room.game.currentId === pid && !room.game.winnerId) {
      room.game.lastAction = (p ? p.name : "Oyuncu") + " koptu.";
      room.game.currentId = nextAlive(room, pid, false);
    }
    emitRoom(room);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log("Uno sunucu port " + PORT); });
