io.on("connection", function (socket) {
  socket.on("turnTimeout", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    if (room._toAt && Date.now() - room._toAt < 2000) return;
    if (room.turnSeconds) return;
    var sec = (d && d.sec) || 0;
    if (!sec) return;
    room.turnSeconds = sec;
    const g = room.game;
    let actor = g.currentId;
    if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
    if (actor !== socket.data.playerId) return;
    room._toAt = Date.now();
    if (!room.timeScores) room.timeScores = {};
    room.timeScores[actor] = (room.timeScores[actor] || 0) + 1;
    room.turnEndsAt = Date.now() + sec * 1000;
    g.notice = "Sure doldu: +1 sure puani";
    emitRoom(room);
  });
  socket.on("toLobby", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    room.holdGame = room.game || room.holdGame || null;
    room.status = "lobby";
    emitRoom(room);
  });
  socket.on("resumeGame", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    if (room.holdGame) room.game = room.holdGame;
    if (!room.game) return;
    room.status = "playing";
    room.holdGame = null;
    emitRoom(room);
  });
});
