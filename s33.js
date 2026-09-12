const _publicRoom33 = publicRoom;
publicRoom = function (room, viewerId) {
  const o = _publicRoom33(room, viewerId);
  o.turnSeconds = room.turnSeconds || 0;
  o.timeScores = room.timeScores || {};
  o.players = (o.players || []).map(function (p) {
    p.timeScore = (room.timeScores && room.timeScores[p.id]) || 0;
    p.totalScore = (p.score || 0) + p.timeScore;
    return p;
  });
  if (o.game) {
    o.game.turnSeconds = room.turnSeconds || 0;
    o.game.turnEndsAt = room.turnEndsAt || 0;
  }
  o.vPatch = "V33";
  return o;
};
const _emit33 = emitRoom;
emitRoom = function (room) {
  if (room && room.status === "playing" && room.game && room.turnSeconds) {
    const g = room.game;
    let actor = g.currentId;
    if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
    if (room._clockActor !== actor) {
      room._clockActor = actor;
      room.turnEndsAt = Date.now() + room.turnSeconds * 1000;
    }
    g.turnSeconds = room.turnSeconds;
    g.turnEndsAt = room.turnEndsAt;
  }
  _emit33(room);
};
io.on("connection", function (socket) {
  socket.on("create", function (d) {
    setTimeout(function () {
      const room = rooms.get(socket.data.roomCode);
      if (!room) return;
      var sec = parseInt(d && d.turnSeconds, 10) || 0;
      if (sec && sec < 5) sec = 5;
      if (sec > 180) sec = 180;
      room.turnSeconds = sec;
      if (!room.timeScores) room.timeScores = {};
    }, 0);
  });
  socket.on("setTurnSeconds", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    if (room.status !== "lobby") return;
    var sec = parseInt(d && d.turnSeconds, 10) || 0;
    if (sec && sec < 5) sec = 5;
    if (sec > 180) sec = 180;
    room.turnSeconds = sec;
    emitRoom(room);
  });
  socket.on("start", function () {
    setTimeout(function () {
      const room = rooms.get(socket.data.roomCode);
      if (!room) return;
      if (!room.timeScores) room.timeScores = {};
      (room.players || []).forEach(function (p) {
        if (room.timeScores[p.id] == null) room.timeScores[p.id] = 0;
      });
      room._clockActor = null;
      if (room.turnSeconds && room.game) {
        room.turnEndsAt = Date.now() + room.turnSeconds * 1000;
        room.game.turnSeconds = room.turnSeconds;
        room.game.turnEndsAt = room.turnEndsAt;
        emitRoom(room);
      }
    }, 50);
  });
  socket.on("turnTimeout", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game || !room.turnSeconds) return;
    if (room._toAt && Date.now() - room._toAt < 2000) return;
    const g = room.game;
    let actor = g.currentId;
    if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
    if (actor !== socket.data.playerId) return;
    room._toAt = Date.now();
    if (!room.timeScores) room.timeScores = {};
    room.timeScores[actor] = (room.timeScores[actor] || 0) + 1;
    room.turnEndsAt = Date.now() + room.turnSeconds * 1000;
    room._clockActor = actor;
    g.turnEndsAt = room.turnEndsAt;
    g.turnSeconds = room.turnSeconds;
    g.notice = "Sure doldu: +1 sure puani";
    emitRoom(room);
  });
});
