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
const VERSION = "V1";
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function makeDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, type: "number", value: 0 });
    for (let n = 1; n <= 9; n++) { deck.push({ color, type: "number", value: n }); deck.push({ color, type: "number", value: n }); }
    for (const type of ["skip", "reverse", "draw2"]) { deck.push({ color, type, value: type }); deck.push({ color, type, value: type }); }
  }
  for (let i = 0; i < 4; i++) { deck.push({ color: "black", type: "wild", value: "wild" }); deck.push({ color: "black", type: "wild4", value: "wild4" }); }
  return shuffle(deck);
}
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
function normCode(v) { return String(v || "").replace(/\D/g, ""); }
function codeGen() { const code = String(1000 + Math.floor(Math.random() * 9000)); return rooms.has(code) ? codeGen() : code; }
function anyoneOffline(room) { return room.players.some((p) => !p.connected); }
function nameOf(room, id) { const p = room.players.find((x) => x.id === id); return p ? p.name : "Oyuncu"; }
function nextSeat(room, fromId, skipOne) {
  const ids = room.seats && room.seats.length ? room.seats : room.players.map((p) => p.id);
  if (!ids.length) return fromId;
  const dir = room.game ? room.game.direction : 1;
  let i = ids.indexOf(fromId); if (i < 0) i = 0;
  const step = skipOne ? 2 : 1;
  return ids[(i + step * dir + ids.length * 20) % ids.length];
}
function publicRoom(room, viewerId) {
  const g = room.game;
  const actor = g && g.drawQueue && g.drawQueue.length ? g.drawQueue[0].playerId : (g ? g.currentId : null);
  return {
    version: VERSION, code: room.code, maxPlayers: room.maxPlayers, hostId: room.hostId, status: room.status,
    paused: !!(g && anyoneOffline(room) && room.status === "playing"),
    seats: room.seats || room.players.map((p) => p.id),
    players: room.players.map((p) => ({
      id: p.id, name: p.name, connected: p.connected,
      cardCount: g && g.hands[p.id] ? g.hands[p.id].length : 0,
      saidUno: g ? !!g.saidUno[p.id] : false, isTurn: actor === p.id
    })),
    game: g ? {
      top: g.discard[g.discard.length - 1], chosenColor: g.chosenColor, direction: g.direction,
      currentId: g.currentId, actorId: actor, winnerId: g.winnerId, lastAction: g.lastAction,
      hand: g.hands[viewerId] || [], deckCount: g.deck.length, drawQueue: g.drawQueue || []
    } : null
  };
}
function emitRoom(room) { for (const p of room.players) { if (p.socketId) io.to(p.socketId).emit("state", publicRoom(room, p.id)); } }
function drawCards(game, playerId, n) {
  const taken = [];
  if (!game.hands[playerId]) game.hands[playerId] = [];
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
  for (let i = 0; i < 7; i++) { for (const p of room.players) hands[p.id].push(deck.pop()); }
  let first = deck.pop();
  while (first && first.type === "wild4") { deck.unshift(first); first = deck.pop(); }
  room.seats = shuffle(room.players.map((p) => p.id));
  room.game = {
    deck, discard: [first], hands, currentId: room.seats[0], direction: 1,
    chosenColor: first.color === "black" ? COLORS[Math.floor(Math.random() * 4)] : first.color,
    saidUno: {}, winnerId: null, drawQueue: [],
    lastAction: "Oyun basladi. Ust kart: " + cardLabel(first)
  };
  room.status = "playing";
}
io.on("connection", (socket) => {
  socket.data.playerId = null; socket.data.roomCode = null;
  socket.on("create", ({ name, maxPlayers }) => {
    const n = Math.max(2, Math.min(10, parseInt(maxPlayers, 10) || 2));
    const code = codeGen(); const playerId = uid(); const token = uid();
    const room = { code, hostId: playerId, maxPlayers: n, status: "lobby", game: null, seats: [],
      players: [{ id: playerId, token, name: String(name || "Kurucu").slice(0, 16), socketId: socket.id, connected: true }] };
    rooms.set(code, room);
    socket.data.playerId = playerId; socket.data.roomCode = code; socket.join(code);
    socket.emit("created", { code, playerId, token, version: VERSION }); emitRoom(room);
  });
  socket.on("join", ({ code, name, token }) => {
    const raw = normCode(code); const room = rooms.get(raw);
    if (!room) return socket.emit("errorMsg", rooms.size === 0 ? "Sunucu yeni acildi. Kurucu yeni oda acsin." : "Oda bulunamadi (" + raw + ").");
    const nm = String(name || "Oyuncu").slice(0, 16);
    let existing = room.players.find((p) => token && p.token === token);
    if (!existing) existing = room.players.find((p) => !p.connected && p.name === nm);
    if (existing) {
      existing.socketId = socket.id; existing.connected = true; if (nm) existing.name = nm;
      socket.data.playerId = existing.id; socket.data.roomCode = room.code; socket.join(room.code);
      socket.emit("joined", { code: room.code, playerId: existing.id, token: existing.token, version: VERSION });
      emitRoom(room); return;
    }
    if (room.status !== "lobby") return socket.emit("errorMsg", "Oyun devam ediyor. Kopan oyuncu ayni ad ile donebilir.");
    if (room.players.length >= room.maxPlayers) return socket.emit("errorMsg", "Oda dolu.");
    const playerId = uid(); const tok = uid();
    room.players.push({ id: playerId, token: tok, name: nm, socketId: socket.id, connected: true });
    socket.data.playerId = playerId; socket.data.roomCode = room.code; socket.join(room.code);
    socket.emit("joined", { code: room.code, playerId, token: tok, version: VERSION }); emitRoom(room);
  });
  socket.on("start", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || room.status !== "lobby") return;
    if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
    startGame(room); emitRoom(room);
  });
  socket.on("play", ({ cardIndex, chosenColor, assign }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    if (anyoneOffline(room)) return socket.emit("errorMsg", "Kopan oyuncu donene kadar oyun bekliyor.");
    const g = room.game; const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.drawQueue && g.drawQueue.length) return socket.emit("errorMsg", "Once ceza kartlari cekilmeli.");
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    const hand = g.hands[pid]; const card = hand[cardIndex]; if (!card) return;
    const top = g.discard[g.discard.length - 1];
    if (!canPlay(card, top, g.chosenColor)) return socket.emit("errorMsg", "Bu kart oynanamaz.");
    if (card.type === "wild4") {
      const colorNow = top.color === "black" ? g.chosenColor : top.color;
      if (colorNow && hasMatchingColor(hand.filter((_, i) => i !== cardIndex), colorNow))
        return socket.emit("errorMsg", "+4 sadece o renkte kartin yoksa atilir.");
    }
    if ((card.type === "wild" || card.type === "wild4") && COLORS.indexOf(chosenColor) < 0) return socket.emit("errorMsg", "Renk sec.");
    const penalty = card.type === "draw2" ? 2 : (card.type === "wild4" ? 4 : 0);
    let queue = [];
    if (penalty) {
      const others = room.players.filter((p) => p.id !== pid);
      if (!assign || !assign.length) queue = [{ playerId: nextSeat(room, pid, false), left: penalty }];
      else {
        let sum = 0;
        for (const a of assign) {
          const n = Math.max(0, parseInt(a.n, 10) || 0); if (!n) continue;
          if (!others.some((o) => o.id === a.playerId)) continue;
          queue.push({ playerId: a.playerId, left: n }); sum += n;
        }
        if (sum !== penalty) return socket.emit("errorMsg", "Toplam ceza " + penalty + " olmali.");
      }
    }
    hand.splice(cardIndex, 1); g.discard.push(card);
    g.chosenColor = card.color === "black" ? chosenColor : card.color;
    if (hand.length === 1 && !g.saidUno[pid]) { drawCards(g, pid, 2); g.lastAction = nameOf(room, pid) + " UNO demedi, 2 kart cekti."; }
    if (hand.length === 0) { g.winnerId = pid; g.lastAction = nameOf(room, pid) + " kazandi!"; room.status = "finished"; emitRoom(room); return; }
    const two = room.players.length === 2;
    let skip = false;
    if (card.type === "skip") skip = true;
    if (card.type === "reverse") { if (two) skip = true; else g.direction *= -1; }
    if (penalty) {
      g.drawQueue = queue; g.afterDrawTo = nextSeat(room, pid, false);
      g.lastAction = nameOf(room, pid) + " 