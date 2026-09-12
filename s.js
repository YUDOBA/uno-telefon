function startTurnClock(room) {
  const g = room.game;
  if (!g) return;
  const sec = Number(room.turnSeconds) || 0;
  g.turnEndsAt = sec > 0 ? (Date.now() + sec * 1000) : 0;
}
var _emitRoom = emitRoom;
emitRoom = function (room) {
  const g = room.game;
  if (g) {
    let actor = g.currentId;
    if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
    if (g._clockActor !== actor) {
      g._clockActor = actor;
      startTurnClock(room);
    }
  }
  _emitRoom(room);
};
var _publicRoom = publicRoom;
publicRoom = function (room, viewerId) {
  const out = _publicRoom(room, viewerId);
  out.turnSeconds = room.turnSeconds || 0;
  out.timeScores = room.timeScores || {};
  out.chat = (room.chat || []).slice(-80);
  (out.players || []).forEach(function (p) {
    p.timeScore = (room.timeScores && room.timeScores[p.id]) || 0;
    p.totalScore = (p.score || 0) + p.timeScore;
  });
  if (out.game) {
    out.game.turnEndsAt = (room.game && room.game.turnEndsAt) || 0;
    out.game.turnSeconds = room.turnSeconds || 0;
    if (out.game.top) delete out.game.top.fresh;
  }
  return out;
};
io.on("connection", function (socket) {
  socket.on("create", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.turnSeconds = Math.max(0, Math.min(180, parseInt(d && d.turnSeconds, 10) || 0));
    if (!room.timeScores) room.timeScores = {};
    if (!room.chat) room.chat = [];
    emitRoom(room);
  });
  socket.on("setTurnSeconds", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || room.status !== "lobby") return;
    room.turnSeconds = Math.max(0, Math.min(180, parseInt(d && d.turnSeconds, 10) || 0));
    emitRoom(room);
  });
  socket.on("turnTimeout", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game || room.status !== "playing") return;
    const g = room.game;
    const pid = socket.data.playerId;
    if (!room.turnSeconds || g.currentId !== pid) return;
    if (!g.turnEndsAt || Date.now() + 250 < g.turnEndsAt) return;
    if (!room.timeScores) room.timeScores = {};
    room.timeScores[pid] = (room.timeScores[pid] || 0) + 1;
    startTurnClock(room);
    g.lastAction = nameOf(room, pid) + " sure doldu. +1 sure puani.";
    g.notice = g.lastAction;
    emitRoom(room);
  });
  socket.on("uno", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const g = room.game;
    const pid = socket.data.playerId;
    const penal = !!(g.plusStack || (g.drawQueue && g.drawQueue.length));
    if (penal || !g.hands[pid] || g.hands[pid].length !== 2 || g.currentId !== pid) {
      g.saidUno[pid] = false;
    }
  });
  socket.on("chat", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const text = String((d && d.text) || "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!text) return;
    if (!room.chat) room.chat = [];
    room.chat.push({ name: nameOf(room, socket.data.playerId), text: text, ts: Date.now() });
    if (room.chat.length > 80) room.chat = room.chat.slice(-80);
    emitRoom(room);
  });
  socket.on("abortGame", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    room.status = "lobby";
    room.game = null;
    room.roundNow = 1;
    room.scores = {};
    room.timeScores = {};
    room.lastRoundPts = {};
    room.lastWinnerId = null;
    room.gameOver = false;
    room.readyNext = {};
    room.sawScores = {};
    emitRoom(room);
  });
});
