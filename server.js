"use strict";
// Dapai sunucusu: Express + Socket.io. Oyun kuralları src/ altındadır.

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const R = require("./src/rules");
const E = require("./src/engine");
const B = require("./src/bots");

const VERSION = "V93";
const PORT = process.env.PORT || 3000;
const STORE = path.join(__dirname, "rooms-v85.json");
const EMPTY_CLOSE_MS = 45000;
const BOT_DELAY_MS = process.env.YD_FAST_BOTS ? [60, 120] : [2000, 3000]; // test için hızlı botlar

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 30000 });

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders(res, file) {
    if (/\.(html|js|css|json|webmanifest)$/.test(file)) res.setHeader("Cache-Control", "no-cache");
  }
}));
app.get("/health", (req, res) => res.json({ ok: true, v: VERSION }));

// ---------- Odalar ----------
const rooms = new Map();

function serializeRoom(r) {
  const out = {};
  for (const k of Object.keys(r)) if (!k.startsWith("_")) out[k] = r[k];
  out.players = r.players.map((p) => Object.assign({}, p, { socketId: null, connected: p.isBot ? p.connected : false }));
  return out;
}

let saveTimer = null;
function saveRooms() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(STORE, JSON.stringify([...rooms.values()].map(serializeRoom))); } catch (e) { /* disk yoksa sorun değil */ }
  }, 1500);
}

function loadRooms() {
  try {
    if (!fs.existsSync(STORE)) return;
    const list = JSON.parse(fs.readFileSync(STORE, "utf8") || "[]");
    list.forEach((r) => {
      if (!r || !r.code || !Array.isArray(r.players)) return;
      r.timeScores = r.timeScores || {};
      r.scores = r.scores || {};
      r.chat = r.chat || [];
      rooms.set(String(r.code), r);
    });
  } catch (e) { /* bozuk dosya yok sayılır */ }
}

function newCode() {
  let code;
  do { code = String(1000 + Math.floor(Math.random() * 9000)); } while (rooms.has(code));
  return code;
}

function clearRoomTimers(room) {
  ["_botTimer", "_clockTimer", "_emptyTimer"].forEach((k) => { if (room[k]) clearTimeout(room[k]); room[k] = null; });
}

function closeRoom(room, reason) {
  clearRoomTimers(room);
  rooms.delete(room.code);
  io.to(room.code).emit("roomClosed", reason || "Oda kapatıldı.");
  io.in(room.code).socketsLeave(room.code);
  saveRooms();
}

// ---------- İstemciye gönderilen görünüm ----------
function publicRoom(room, viewerId) {
  const g = room.game;
  const actor = g ? E.actorOf(g) : null;
  const penal = E.isPenalty(g);
  const actorP = room.players.find((p) => p.id === actor);
  const live = room.status === "playing" && !!g;
  const top = g ? g.discard[g.discard.length - 1] : null;
  return {
    v: VERSION,
    code: room.code, hostId: room.hostId, maxPlayers: room.maxPlayers, status: room.status,
    held: room.status === "lobby" && !!g,
    seats: E.seatIds(room),
    roundsTotal: room.roundsTotal, roundNow: room.roundNow, roundId: room.roundId || 0,
    turnSeconds: room.turnSeconds || 0, botLevel: room.botLevel || "mid",
    clockLeftMs: live && room._clockEnds ? Math.max(0, room._clockEnds - Date.now()) : 0,
    paused: !!(live && actorP && !actorP.isBot && !actorP.connected),
    lastRoundPts: room.lastRoundPts || {}, lastWinnerId: room.lastWinnerId || null, winBonus: R.WIN_BONUS,
    gameOver: !!room.gameOver, readyNext: room.readyNext || {}, sawScores: room.sawScores || {},
    chat: room.chat || [],
    leftHands: room.status === "winnerShow" && g ? Object.fromEntries(room.players.map((p) => [p.id, (g.hands[p.id] || []).map((c) => ({ color: c.color, type: c.type, value: c.value }))])) : null,
    players: room.players.map((p) => ({
      id: p.id, name: p.name, connected: !!p.connected, isBot: !!p.isBot,
      cardCount: g && g.hands[p.id] ? g.hands[p.id].length : 0,
      saidUno: !!(g && g.saidUno[p.id]),
      score: room.scores[p.id] || 0, timeScore: room.timeScores[p.id] || 0
    })),
    game: g ? {
      top: { color: top.color, type: top.type, value: top.value },
      chosenColor: g.chosenColor, direction: g.direction, actorId: actor,
      notice: g.notice || "", noticeYou: (g.noticeYou && g.noticeYou[viewerId]) || "",
      hand: (g.hands[viewerId] || []).map((c) => ({ color: c.color, type: c.type, value: c.value, fresh: !!c.fresh })),
      deckCount: g.deck.length, plusStack: g.plusStack || 0,
      stackKind: penal ? g.stackKind : null, isPenalty: penal,
      penaltyLeft: g.drawQueue.length ? g.drawQueue[0].left : (g.plusStack || 0),
      drewOnce: !!(g.pendingDrawn && g.pendingDrawn.playerId === viewerId),
      winnerId: g.winnerId
    } : null
  };
}

// Oyuncu yeni bir sırada hamle yapınca, önceki sıralardan kalan "yeni" işaretleri silinir
function clearOldFresh(room, pid) {
  const g = room.game;
  if (!g || !g.hands || !g.hands[pid] || E.actorOf(g) !== pid) return;
  g.hands[pid].forEach((c) => { if (c.fresh && c.fresh !== room._freshTok) delete c.fresh; });
}

function emitRoom(room) {
  if (rooms.get(room.code) !== room) return;
  const g = room.game;
  // "Yeni" işaretleri: her sıra değişiminde oturum numarası artar; yeni çekilen kart o oturumla damgalanır
  if (g && g.hands) {
    const actor = E.actorOf(g);
    if (actor !== room._freshActor) { room._freshTok = (room._freshTok || 0) + 1; room._freshActor = actor; }
    Object.keys(g.hands).forEach((pid) => g.hands[pid].forEach((c) => { if (c.fresh === true) c.fresh = room._freshTok; }));
  }
  botsAcknowledge(room);
  updateClock(room);
  room.players.forEach((p) => { if (p.socketId) io.to(p.socketId).emit("state", publicRoom(room, p.id)); });
  scheduleBot(room);
  scheduleEmptyClose(room);
  saveRooms();
}

function flush(room, fx) {
  fx.events.forEach(([name, data]) => io.to(room.code).emit(name, data));
  emitRoom(room);
}

// ---------- Sıra süresi (sunucu tarafında sayılır) ----------
function updateClock(room) {
  const g = room.game;
  if (room.status !== "playing" || !g || g.winnerId || !room.turnSeconds) {
    if (room._clockTimer) clearTimeout(room._clockTimer);
    room._clockTimer = null; room._clockEnds = 0; room._clockKey = null;
    return;
  }
  // Her yeni hamlede (ya da sıra değişince) sayaç başa döner
  const key = E.actorOf(g) + "#" + room.moveSeq;
  if (room._clockKey === key && room._clockTimer) return;
  room._clockKey = key;
  startClock(room);
}

function startClock(room) {
  if (room._clockTimer) clearTimeout(room._clockTimer);
  room._clockEnds = Date.now() + room.turnSeconds * 1000;
  room._clockTimer = setTimeout(() => onClockZero(room), room.turnSeconds * 1000 + 150);
}

function onClockZero(room) {
  room._clockTimer = null;
  if (rooms.get(room.code) !== room || room.status !== "playing" || !room.game) return;
  const actor = E.actorOf(room.game);
  const p = room.players.find((x) => x.id === actor);
  if (p && !p.isBot) {
    room.timeScores[actor] = (room.timeScores[actor] || 0) + 1;
    room.game.notice = "Süre doldu: " + p.name + " +1 süre puanı aldı.";
    room.game.noticeYou = {};
  }
  startClock(room);
  emitRoom(room);
}

// ---------- Botlar ----------
function scheduleBot(room) {
  if (room._botTimer) return;
  if (room.status !== "playing" || !room.game || room.game.winnerId) return;
  const actor = room.players.find((p) => p.id === E.actorOf(room.game));
  if (!actor || !actor.isBot) return;
  const wait = BOT_DELAY_MS[0] + Math.floor(Math.random() * (BOT_DELAY_MS[1] - BOT_DELAY_MS[0]));
  room._botTimer = setTimeout(() => {
    room._botTimer = null;
    if (rooms.get(room.code) !== room) return;
    const fx = { events: [] };
    if (B.botStep(room, fx)) flush(room, fx);
  }, wait);
}

// Tur sonunda botlar skoru görmüş ve hazır sayılır
function botsAcknowledge(room) {
  if (room.status !== "winnerShow") return;
  room.players.forEach((p) => {
    if (!p.isBot) return;
    room.sawScores[p.id] = true;
    if (!room.gameOver) room.readyNext[p.id] = true;
  });
  if (!room.gameOver && room.players.every((p) => room.readyNext[p.id])) {
    room.roundNow += 1;
    E.startRound(room);
  }
}

function scheduleEmptyClose(room) {
  if (B.humanCount(room) > 0) {
    if (room._emptyTimer) { clearTimeout(room._emptyTimer); room._emptyTimer = null; }
    return;
  }
  if (room._emptyTimer) return;
  room._emptyTimer = setTimeout(() => {
    room._emptyTimer = null;
    if (rooms.get(room.code) === room && B.humanCount(room) === 0) closeRoom(room, "Odada kimse kalmadı.");
  }, EMPTY_CLOSE_MS);
}

// ---------- Bağlantılar ----------
function clampSeconds(v) {
  let s = parseInt(v, 10) || 0;
  if (s && s < 5) s = 5;
  if (s > 180) s = 180;
  return s;
}

// Kurucu ayrılırsa kuruculuk bağlı başka bir insana geçer
function passHost(room, fromId) {
  const next = room.players.find((p) => p.id !== fromId && !p.isBot && p.connected);
  if (next) room.hostId = next.id;
}

function cleanName(v, fallback) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, 16) || fallback;
}

function attach(socket, room, player) {
  player.socketId = socket.id;
  player.connected = true;
  socket.data.roomCode = room.code;
  socket.data.playerId = player.id;
  socket.join(room.code);
  socket.emit("session", { code: room.code, playerId: player.id, token: player.token, v: VERSION });
  emitRoom(room);
}

io.on("connection", (socket) => {
  const ctx = () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return {};
    const me = room.players.find((p) => p.id === socket.data.playerId);
    return me ? { room, me, isHost: room.hostId === me.id } : {};
  };
  const fail = (msg) => socket.emit("errorMsg", msg);

  socket.on("create", (d) => {
    d = d || {};
    const player = { id: B.uid(), token: B.uid(), name: cleanName(d.name, "Kurucu"), connected: true, isBot: false };
    const code = newCode();
    const room = {
      code, hostId: player.id, maxPlayers: Math.max(2, Math.min(8, parseInt(d.maxPlayers, 10) || 4)),
      status: "lobby", game: null, players: [player], seats: [player.id],
      roundsTotal: 3, roundNow: 1, scores: {}, timeScores: {}, lastRoundPts: {},
      turnSeconds: clampSeconds(d.turnSeconds), botLevel: "mid", chat: [], moveSeq: 0, roundId: 0
    };
    rooms.set(code, room);
    attach(socket, room, player);
  });

  // d.silent: uygulama açılınca kayıtlı oturumla sessizce geri dönme
  socket.on("join", (d) => {
    d = d || {};
    const code = String(d.code || "").replace(/\D/g, "");
    if (code.length !== 4) return d.silent ? socket.emit("roomLost") : fail("4 haneli oyun kodunu yaz.");
    const room = rooms.get(code);
    if (!room) return d.silent ? socket.emit("roomLost") : fail("Oda bulunamadı (" + code + ").");
    const name = cleanName(d.name, "Oyuncu");

    // Aynı cihaz (token) ya da kopan / bota devredilen aynı ad → kendi koltuğu
    let p = d.token ? room.players.find((x) => x.token === d.token && !x.bornBot) : null;
    if (!p && !d.silent) p = room.players.find((x) => !x.bornBot && (x.botTakeover || !x.connected) && B.stripBotTag(x.name) === name);
    if (p) {
      if (p.isBot || p.botTakeover) B.restoreHuman(p, p.humanName || name);
      return attach(socket, room, p);
    }
    if (d.silent) return socket.emit("roomLost");

    if (room.status !== "lobby" || room.game) {
      // Oyun sürüyorsa doğuştan botlardan biri yeni oyuncuya verilir
      const bots = room.players.filter((x) => x.bornBot);
      if (!bots.length) return fail("Oyun devam ediyor. Koptuysan aynı adı yaz.");
      const take = bots[Math.floor(Math.random() * bots.length)];
      B.restoreHuman(take, name);
      take.token = B.uid();
      return attach(socket, room, take);
    }
    if (room.players.length >= room.maxPlayers) return fail("Oda dolu.");
    if (room.players.some((x) => x.name === name)) return fail("Bu ad odada var, başka ad yaz.");
    const np = { id: B.uid(), token: B.uid(), name, connected: true, isBot: false };
    room.players.push(np);
    room.seats.push(np.id);
    attach(socket, room, np);
  });

  socket.on("setSeats", (d) => {
    const { room, isHost } = ctx();
    if (!isHost || room.status !== "lobby" || room.game) return;
    const ids = (d && d.seats) || [];
    if (ids.length !== room.players.length || !ids.every((id) => room.players.some((p) => p.id === id))) return;
    room.seats = ids.slice();
    emitRoom(room);
  });

  socket.on("settings", (d) => {
    const { room, isHost } = ctx();
    if (!isHost || room.status !== "lobby" || room.game) return;
    d = d || {};
    if (d.rounds != null) room.roundsTotal = Math.max(1, Math.min(15, parseInt(d.rounds, 10) || 3));
    if (d.turnSeconds != null) room.turnSeconds = clampSeconds(d.turnSeconds);
    if (["easy", "mid", "hard"].includes(d.botLevel)) room.botLevel = d.botLevel;
    if (d.maxPlayers != null) {
      const n = Math.max(2, Math.min(8, parseInt(d.maxPlayers, 10) || room.maxPlayers));
      room.maxPlayers = Math.max(n, room.players.length);
    }
    emitRoom(room);
  });

  socket.on("start", () => {
    const { room, isHost } = ctx();
    if (!room) return socket.emit("roomLost");
    if (!isHost) return fail("Sadece kurucu başlatabilir.");
    if (room.status !== "lobby" || room.game) return;
    B.fillBots(room);
    room.roundNow = 1;
    room.scores = {};
    room.timeScores = {};
    E.startRound(room);
    emitRoom(room);
  });

  const act = (fn, move) => (d) => {
    const { room, me } = ctx();
    if (!room) return socket.emit("roomLost");
    if (move) clearOldFresh(room, me.id);
    const fx = { events: [] };
    const err = fn(room, me.id, d || {}, fx);
    if (err) { fail(err); return emitRoom(room); }
    flush(room, fx);
  };
  socket.on("play", act((room, pid, d, fx) => E.play(room, pid, d, fx), true));
  socket.on("draw", act((room, pid, d, fx) => E.draw(room, pid, fx), true));
  socket.on("pass", act((room, pid) => E.pass(room, pid), true));
  socket.on("uno", act((room, pid, d, fx) => E.sayUno(room, pid, fx)));

  socket.on("sawScores", () => {
    const { room, me } = ctx();
    if (!room || room.status !== "winnerShow") return;
    room.sawScores[me.id] = true;
    emitRoom(room);
  });

  socket.on("readyNext", () => {
    const { room, me } = ctx();
    if (!room || room.status !== "winnerShow" || room.gameOver) return;
    room.readyNext[me.id] = true;
    if (room.players.every((p) => room.readyNext[p.id])) {
      room.roundNow += 1;
      E.startRound(room);
    }
    emitRoom(room);
  });

  // Oyun bitince kurucu aynı odayla lobiye döner
  socket.on("again", () => {
    const { room, isHost } = ctx();
    if (!isHost || room.status !== "winnerShow") return;
    room.status = "lobby"; room.game = null; room.roundNow = 1;
    room.scores = {}; room.timeScores = {}; room.lastRoundPts = {};
    // Botlar ve bağlı olmayanlar lobiden çıkar; oyun başlarken boş koltuklar yeniden bot olur
    room.players = room.players.filter((p) => !p.isBot && p.connected);
    room.seats = room.seats.filter((id) => room.players.some((p) => p.id === id));
    emitRoom(room);
  });

  socket.on("toLobby", () => {
    const { room, isHost } = ctx();
    if (!isHost || room.status !== "playing") return;
    room.status = "lobby";
    emitRoom(room);
  });

  socket.on("resumeGame", () => {
    const { room, isHost } = ctx();
    if (!isHost || room.status !== "lobby" || !room.game) return;
    room.status = room.game.winnerId ? "winnerShow" : "playing";
    room._clockKey = null;
    emitRoom(room);
  });

  socket.on("chat", (d) => {
    const { room, me } = ctx();
    if (!room) return;
    const text = String((d && d.text) || "").trim().slice(0, 160);
    if (!text) return;
    room.chat.push({ id: me.id, name: me.name, text, at: Date.now() });
    if (room.chat.length > 80) room.chat = room.chat.slice(-80);
    emitRoom(room);
  });

  socket.on("leave", () => {
    const { room, me, isHost } = ctx();
    socket.data.roomCode = null;
    socket.data.playerId = null;
    if (!room) return;
    socket.leave(room.code);
    const idle = room.status === "lobby" || (room.status === "winnerShow" && room.gameOver);
    if (isHost && idle) return closeRoom(room, "Kurucu oyunu kapattı.");
    if (isHost) passHost(room, me.id);
    if (room.status === "lobby" && !room.game) {
      room.players = room.players.filter((p) => p.id !== me.id);
      room.seats = room.seats.filter((id) => id !== me.id);
    } else {
      me.socketId = null;
      B.takeOver(me);
    }
    emitRoom(room);
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode, pid = socket.data.playerId, sid = socket.id;
    if (!code) return;
    setTimeout(() => {
      const room = rooms.get(code);
      if (!room) return;
      const p = room.players.find((x) => x.id === pid);
      if (!p || (p.socketId && p.socketId !== sid)) return;
      p.connected = false;
      p.socketId = null;
      if (room.status !== "lobby" || room.game) {
        B.takeOver(p);
        if (room.hostId === p.id) passHost(room, p.id);
      }
      emitRoom(room);
    }, 1600);
  });
});

loadRooms();
rooms.forEach((room) => scheduleEmptyClose(room));
server.listen(PORT, () => console.log("Dapai " + VERSION + " port " + PORT));

module.exports = { rooms, emitRoom };
