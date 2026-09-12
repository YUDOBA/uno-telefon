io.on("connection", function (socket) {
  socket.on("chat", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const p = room.players.find(function (x) { return x.id === socket.data.playerId; });
    if (!p) return;
    const text = String((d && d.text) || "").slice(0, 160).trim();
    if (!text) return;
    if (!room.chat) room.chat = [];
    room.chat.push({ name: p.name, text: text, at: Date.now() });
    if (room.chat.length > 80) room.chat = room.chat.slice(-80);
    emitRoom(room);
  });
});
const _pr44 = publicRoom;
publicRoom = function (room, viewerId) {
  const o = _pr44(room, viewerId);
  o.chat = room.chat || [];
  o.holdGame = !!room.holdGame;
  return o;
};
