const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, pingInterval: 10000, pingTimeout: 40000 });
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", function (req, res) { res.send("ok"); });
const COLORS = ["red", "yellow", "green", "blue"];
const COLOR_TR = { red: "Kirmizi", yellow: "Sari", green: "Yesil", blue: "Mavi" };
const VERSION = "V27";
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color: color, type: "number", value: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color: color, type: "number", value: n });
      deck.push({ color: color, type: "number", value: n });
    }
    for (const type of ["skip", "reverse", "draw2"]) {
      deck.push({ color: color, type: type, value: type });
      deck.push({ color: color, type: type, value: type });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "black", type: "wild", value: "wild" });
    deck.push({ color: "black", type: "wild4", value: "wild4" });
    deck.push({ color: "black", type: "custom", value: "custom" });
    deck.push({ color: "black", type: "wdraw2", value: "wdraw2" });
    deck.push({ color: "black", type: "wtarget2", value: "wtarget2" });
    deck.push({ color: "black", type: "wskip2", value: "wskip2" });
    deck.push({ color: "black", type: "swap", value: "swap" });
    deck.push({ color: "black", type: "shuffle", value: "shuffle" });
    deck.push({ color: "black", type: "skipall", value: "skipall" });
  }
  return shuffle(deck);
}
function cardLabel(c) {
  if (c.type === "number") return (COLOR_TR[c.color] || c.color) + " " + c.value;
  if (c.type === "skip") return COLOR_TR[c.color] + " Atla";
  if (c.type === "reverse") return COLOR_TR[c.color] + " Ters";
  if (c.type === "draw2") return COLOR_TR[c.color] + " +2";
  if (c.type === "wild") return "Joker";
  if (c.type === "wild4") return "Joker +4";
  if (c.type === "custom") return "Ozel Joker (8)";
  if (c.type === "wdraw2") return "Joker +2";
  if (c.type === "wtarget2") return "Hedef +2";
  if (c.type === "wskip2") return "Cift Atla";
  if (c.type === "swap") return "El Degis";
  if (c.type === "shuffle") return "El Karistir";
  if (c.type === "skipall") return "Herkesi Atla";
  return "?";
}
function cardPts(c) {
  if (c.type === "number") return Number(c.value) || 0;
  return 10;
}
function canPlay(card, top, chosenColor, stackKind) {
  if (!top) return true;
  if (stackKind === "draw2") return card.type === "draw2";
  if (stackKind === "wild4" || stackKind === "custom" || stackKind === "wdraw2") return false;
  if (card.type === "wild" || card.type === "custom" || card.type === "wdraw2" || card.type === "wtarget2" || card.type === "wskip2" || card.type === "swap" || card.type === "shuffle" || card.type === "skipall") return true;
  if (card.type === "wild4") return top.type === "number" || top.type === "wild" || top.type === "wild4" || top.type === "custom";
  const color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
const rooms = new Map();
const STORE = path.join(__dirname, "rooms-store.json");
function saveRooms() {
  try {
    const list = [];
    rooms.forEach(function (room) {
      list.push({
        code: room.code, hostId: room.hostId, maxPlayers: room.maxPlayers, status: room.status,
        seats: room.seats, roundsTotal: room.roundsTotal, roundNow: room.roundNow,
        scores: room.scores || {}, lastRoundPts: room.lastRoundPts || {},
        lastWinnerId: room.lastWinnerId || null, gameOver: !!room.gameOver,
        readyNext: room.readyNext || {}, sawScores: room.sawScores || {},
        players: (room.players || []).map(function (p) {
          return { id: p.id, token: p.token, name: p.name, connected: false, socketId: null };
        }),
        game: room.game || null
      });
    });
    fs.writeFileSync(STORE, JSON.stringify(list));
  } catch (e) {}
}
function loadRooms() {
  try {
    if (!fs.existsSync(STORE)) return;
    const list = JSON.parse(fs.readFileSync(STORE, "utf8") || "[]");
    (list || []).forEach(function (room) {
      if (room && room.code && !rooms.has(String(room.code))) rooms.set(String(room.code), room);
    });
  } catch (e) {}
}
loadRooms();
function normCode(v) { return String(v || "").replace(/\D/g, ""); }
function codeGen() {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  return rooms.has(code) ? codeGen() : code;
}
function nameOf(room, id) {
  const p = room.players.find(function (x) { return x.id === id; });
  return p ? p.name : "Oyuncu";
}
function nextSeat(room, fromId, skipOne) {
  const ids = room.seats && room.seats.length ? room.seats : room.players.map(function (p) { return p.id; });
  if (!ids.length) return fromId;
  const dir = room.game ? room.game.direction : 1;
  let i = ids.indexOf(fromId);
  if (i < 0) i = 0;
  const step = skipOne ? 2 : 1;
  return ids[(i + step * dir + ids.length * 20) % ids.length];
}
function publicRoom(room, viewerId) {
  const g = room.game;
  let actor = g ? g.currentId : null;
  if (g && g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
  const actorP = actor && room.players.find(function (x) { return x.id === actor; });
  const penal = !!(g && ((g.plusStack || 0) > 0 || (g.drawQueue && g.drawQueue.length)));
  return {
    version: VERSION, code: room.code, maxPlayers: room.maxPlayers, hostId: room.hostId, status: room.status,
    paused: !!(g && room.status === "playing" && actorP && !actorP.connected),
    seats: room.seats || room.players.map(function (p) { return p.id; }),
    roundsTotal: room.roundsTotal || 1, roundNow: room.roundNow || 1,
    scores: room.scores || {}, lastRoundPts: room.lastRoundPts || {},
    lastWinnerId: room.lastWinnerId || null, gameOver: !!room.gameOver,
    readyNext: room.readyNext || {}, sawScores: room.sawScores || {},
    players: room.players.map(function (p) {
      return {
        id: p.id, name: p.name, connected: p.connected,
        cardCount: g && g.hands && g.hands[p.id] ? g.hands[p.id].length : 0,
        saidUno: g ? !!g.saidUno[p.id] : false, isTurn: actor === p.id,
        isPenalty: !!(actor === p.id && penal),
        score: (room.scores && room.scores[p.id]) || 0
      };
    }),
    game: g ? {
      top: g.discard[g.discard.length - 1], chosenColor: g.chosenColor, direction: g.direction,
      currentId: actor, actorId: actor, winnerId: g.winnerId, lastAction: g.lastAction,
      notice: g.notice || "", noticeYou: g.noticeYou && g.noticeYou[viewerId] ? g.noticeYou[viewerId] : "",
      hand: g.hands[viewerId] || [], deckCount: g.deck.length,
      plusStack: g.plusStack || 0,
      stackKind: penal ? g.stackKind : null,
      drawQueue: g.drawQueue || [],
      canPass: !!(g.pendingDrawn && g.pendingDrawn.playerId === viewerId),
      drewOnce: !!(g.pendingDrawn && g.pendingDrawn.playerId === viewerId),
      isPenalty: penal
    } : null
  };
}
function emitRoom(room) {
  const g = room.game;
  if (g && g.hands) {
    let actor = g.currentId;
    if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
    Object.keys(g.hands).forEach(function (pid) {
      if (pid === actor) return;
      (g.hands[pid] || []).forEach(function (c) { if (c) delete c.fresh; });
    });
  }
  for (const p of room.players) {
    if (p.socketId) io.to(p.socketId).emit("state", publicRoom(room, p.id));
  }
  saveRooms();
}
function drawCards(game, playerId, n) {
  const taken = [];
  if (!game.hands[playerId]) game.hands[playerId] = [];
  for (let i = 0; i < n; i++) {
    if (!game.deck.length) {
      const top = game.discard.pop();
      game.deck = shuffle(game.discard);
      game.discard = top ? [top] : [];
      game.notice = "Cekme destesi bitti. Yere atilan kartlar karistirildi, yeni deste olustu.";
      game.lastAction = game.notice;
      if (!game.noticeYou) game.noticeYou = {};
      if (!game.deck.length) break;
    }
    const c = game.deck.pop();
    c.fresh = true;
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
  while (first && first.type !== "number") { deck.unshift(first); first = deck.pop(); }
  if (!room.seats || room.seats.length !== room.players.length) {
    room.seats = room.players.map(function (p) { return p.id; });
  }
  room.seats = room.seats.filter(function (id) { return room.players.some(function (p) { return p.id === id; }); });
  room.players.forEach(function (p) { if (room.seats.indexOf(p.id) < 0) room.seats.push(p.id); });
  if (!room.scores) room.scores = {};
  room.players.forEach(function (p) { if (room.scores[p.id] == null) room.scores[p.id] = 0; });
  room.readyNext = {}; room.sawScores = {}; room.gameOver = false;
  room.game = {
    deck: deck, discard: [first], hands: hands, currentId: room.seats[0], direction: 1,
    chosenColor: first.color === "black" ? COLORS[Math.floor(Math.random() * 4)] : first.color,
    saidUno: {}, winnerId: null, plusStack: 0, stackKind: null, drawQueue: [], notice: "", noticeYou: {},
    lastAction: "Tur " + room.roundNow + "/" + room.roundsTotal + " basladi. Ust: " + cardLabel(first)
  };
  room.status = "playing";
}
function endRound(room, winnerId) {
  const g = room.game;
  const last = {};
  room.players.forEach(function (p) {
    const hand = (g.hands[p.id] || []);
    let pts = 0;
    hand.forEach(function (c) { pts += cardPts(c); });
    last[p.id] = pts;
    room.scores[p.id] = (room.scores[p.id] || 0) + pts;
  });
  if (winnerId) room.scores[winnerId] = (room.scores[winnerId] || 0) - 10;
  room.lastRoundPts = last;
  room.lastWinnerId = winnerId;
  room.readyNext = {};
  room.sawScores = {};
  room.gameOver = room.roundNow >= room.roundsTotal;
  room.status = "winnerShow";
  if (g) { g.winnerId = winnerId; g.lastAction = room.gameOver ? "Oyun bitti." : ("Tur " + room.roundNow + " bitti."); }
}
