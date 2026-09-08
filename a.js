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
const VERSION = "V4";
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
  return "?";
}
function cardPts(c) {
  if (c.type === "number") return Number(c.value) || 0;
  return 10;
}
function canPlay(card, top, chosenColor, stackKind) {
  if (!top) return true;
  if (stackKind === "draw2") return card.type === "draw2";
  if (stackKind === "wild4" || stackKind === "custom") return false;
  if (card.type === "wild" || card.type === "custom") return true;
  if (card.type === "wild4") return top.type === "number" || top.type === "wild" || top.type === "wild4" || top.type === "custom";
  const color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type && card.color !== "black") return true;
  return false;
}
const rooms = new Map();
function normCode(v) { return String(v || "").replace(/\D/g, ""); }
function codeGen() {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  return rooms.has(code) ? codeGen() : code;
}
function anyoneOffline(room) { return room.players.some(function (p) { return !p.connected; }); }
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
  return {
    version: VERSION, code: room.code, maxPlayers: room.maxPlayers, hostId: room.hostId, status: room.status,
    paused: !!(g && anyoneOffline(room) && room.status === "playing"),
    seats: room.seats || room.players.map(function (p) { return p.id; }),
    roundsTotal: room.roundsTotal || 1, roundNow: room.roundNow || 1,
    scores: room.scores || {}, lastRoundPts: room.lastRoundPts || {},
    players: room.players.map(function (p) {
      return {
        id: p.id, name: p.name, connected: p.connected,
        cardCount: g && g.hands && g.hands[p.id] ? g.hands[p.id].length : 0,
        saidUno: g ? !!g.saidUno[p.id] : false, isTurn: actor === p.id,
        score: (room.scores && room.scores[p.id]) || 0
      };
    }),
    game: g ? {
      top: g.discard[g.discard.length - 1], chosenColor: g.chosenColor, direction: g.direction,
      currentId: actor, actorId: actor, winnerId: g.winnerId, lastAction: g.lastAction,
      notice: g.notice || "", noticeYou: g.noticeYou && g.noticeYou[viewerId] ? g.noticeYou[viewerId] : "",
      hand: g.hands[viewerId] || [], deckCount: g.deck.length,
      plusStack: g.plusStack || 0, stackKind: g.stackKind || null,
      drawQueue: g.drawQueue || []
    } : null
  };
}
function emitRoom(room) {
  for (const p of room.players) {
    if (p.socketId) io.to(p.socketId).emit("state", publicRoom(room, p.id));
  }
}
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
  for (let i = 0; i < 7; i++) {
    for (const p of room.players) hands[p.id].push(deck.pop());
  }
  let first = deck.pop();
  while (first && (first.type === "wild4" || first.type === "custom")) { deck.unshift(first); first = deck.pop(); }
  if (!room.seats || room.seats.length !== room.players.length) {
    room.seats = room.players.map(function (p) { return p.id; });
  }
  room.seats = room.seats.filter(function (id) { return room.players.some(function (p) { return p.id === id; }); });
  room.players.forEach(function (p) { if (room.seats.indexOf(p.id) < 0) room.seats.push(p.id); });
  if (!room.scores) room.scores = {};
  room.players.forEach(function (p) { if (room.scores[p.id] == null) room.scores[p.id] = 0; });
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
  if (room.roundNow >= room.roundsTotal) {
    room.status = "finished";
    g.winnerId = winnerId;
    g.lastAction = "Oyun bitti. En dusuk puan kazanir.";
  } else {
    room.status = "roundEnd";
    g.winnerId = winnerId;
    g.lastAction = "Tur " + room.roundNow + " bitti. " + nameOf(room, winnerId) + " turu aldi (-10).";
  }
}
