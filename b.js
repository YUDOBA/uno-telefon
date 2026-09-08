io.on("connection", function (socket) {
  socket.data.playerId = null;
  socket.data.roomCode = null;
  socket.on("create", function (d) {
    d = d || {};
    const n = Math.max(2, Math.min(10, parseInt(d.maxPlayers, 10) || 2));
    const code = codeGen();
    const playerId = uid();
    const token = uid();
    const room = {
      code: code, hostId: playerId, maxPlayers: n, status: "lobby", game: null, seats: [],
      players: [{ id: playerId, token: token, name: String(d.name || "Kurucu").slice(0, 16), socketId: socket.id, connected: true }]
    };
    rooms.set(code, room);
    socket.data.playerId = playerId;
    socket.data.roomCode = code;
    socket.join(code);
    socket.emit("created", { code: code, playerId: playerId, token: token, version: VERSION });
    emitRoom(room);
  });
  socket.on("join", function (d) {
    d = d || {};
    const raw = normCode(d.code);
    const room = rooms.get(raw);
    if (!room) return socket.emit("errorMsg", rooms.size === 0 ? "Sunucu yeni acildi. Kurucu yeni oda acsin." : "Oda bulunamadi (" + raw + ").");
    const nm = String(d.name || "Oyuncu").slice(0, 16);
    let existing = room.players.find(function (p) { return d.token && p.token === d.token; });
    if (!existing) existing = room.players.find(function (p) { return !p.connected && p.name === nm; });
    if (existing) {
      existing.socketId = socket.id;
      existing.connected = true;
      if (nm) existing.name = nm;
      socket.data.playerId = existing.id;
      socket.data.roomCode = room.code;
      socket.join(room.code);
      socket.emit("joined", { code: room.code, playerId: existing.id, token: existing.token, version: VERSION });
      emitRoom(room);
      return;
    }
    if (room.status !== "lobby") return socket.emit("errorMsg", "Oyun devam ediyor. Kopan oyuncu ayni ad ile donebilir.");
    if (room.players.length >= room.maxPlayers) return socket.emit("errorMsg", "Oda dolu.");
    const playerId = uid();
    const tok = uid();
    room.players.push({ id: playerId, token: tok, name: nm, socketId: socket.id, connected: true });
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    socket.emit("joined", { code: room.code, playerId: playerId, token: tok, version: VERSION });
    emitRoom(room);
  });
  socket.on("start", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.hostId !== socket.data.playerId) return socket.emit("errorMsg", "Sadece kurucu baslatabilir.");
    if (room.status !== "lobby") return;
    if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
    startGame(room);
    emitRoom(room);
  });
  socket.on("play", function (d) {
    d = d || {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    if (anyoneOffline(room)) return socket.emit("errorMsg", "Kopan oyuncu donene kadar oyun bekliyor.");
    const g = room.game;
    const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    const hand = g.hands[pid];
    const card = hand[d.cardIndex];
    if (!card) return;
    const top = g.discard[g.discard.length - 1];
    if (!canPlay(card, top, g.chosenColor, g.stackKind)) return socket.emit("errorMsg", "Bu kart oynanamaz.");
    if ((card.type === "wild" || card.type === "wild4") && COLORS.indexOf(d.chosenColor) < 0)
      return socket.emit("errorMsg", "Renk sec.");
    hand.splice(d.cardIndex, 1);
    g.discard.push(card);
    if (card.color === "black") g.chosenColor = d.chosenColor;
    else g.chosenColor = card.color;
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
      g.plusStack = (g.stackKind === "draw2" ? (g.plusStack || 0) : 0) + 2;
      g.stackKind = "draw2";
      g.currentId = nextSeat(room, pid, false);
      g.lastAction = nameOf(room, pid) + " +2 atti. Yigin " + g.plusStack + ". Renk: " + (COLOR_TR[g.chosenColor] || "");
      emitRoom(room);
      return;
    }
    if (card.type === "wild4") {
      g.plusStack = 4;
      g.stackKind = "wild4";
      g.currentId = nextSeat(room, pid, false);
      g.lastAction = nameOf(room, pid) + " +4 atti. Sıradaki 4 kart cekecek.";
      emitRoom(room);
      return;
    }
    g.plusStack = 0;
    g.stackKind = null;
    if (card.type === "wild") g.lastAction = nameOf(room, pid) + " Joker atti.";
    else if (card.type === "skip") g.lastAction = nameOf(room, pid) + " Atla atti.";
    else if (card.type === "reverse") g.lastAction = nameOf(room, pid) + " yon degisti.";
    else g.lastAction = nameOf(room, pid) + " " + cardLabel(card) + " atti.";
    g.currentId = nextSeat(room, pid, skip);
    emitRoom(room);
  });
  socket.on("draw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    if (anyoneOffline(room)) return socket.emit("errorMsg", "Kopan oyuncu donene kadar oyun bekliyor.");
    const g = room.game;
    const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    if (g.plusStack && g.plusStack > 0) {
      drawCards(g, pid, 1);
      g.plusStack -= 1;
      g.lastAction = nameOf(room, pid) + " ceza cekti. Kalan " + g.plusStack;
      if (g.plusStack <= 0) {
        g.plusStack = 0;
        g.stackKind = null;
        g.currentId = nextSeat(room, pid, false);
        g.lastAction += " Ceza bitti.";
      }
      emitRoom(room);
      return;
    }
    const top = g.discard[g.discard.length - 1];
    const taken = drawCards(g, pid, 1);
    const drawn = taken[0];
    if (drawn && canPlay(drawn, top, g.chosenColor, null)) {
      g.pendingDrawn = { playerId: pid, card: drawn };
      g.lastAction = nameOf(room, pid) + " kart cekti, oynayabilir.";
      emitRoom(room);
      socket.emit("drawnPlayable");
      return;
    }
    g.lastAction = nameOf(room, pid) + " kart cekti.";
    g.currentId = nextSeat(room, pid, false);
    emitRoom(room);
  });
  socket.on("passAfterDraw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const g = room.game;
    const pid = socket.data.playerId;
    if (!g.pendingDrawn || g.pendingDrawn.playerId !== pid) return;
    delete g.pendingDrawn;
    g.lastAction = nameOf(room, pid) + " cektigi karti oynamadi.";
    g.currentId = nextSeat(room, pid, false);
    emitRoom(room);
  });
  socket.on("uno", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const pid = socket.data.playerId;
    if (room.game.hands[pid] && room.game.hands[pid].length <= 2) {
      room.game.saidUno[pid] = true;
      room.game.lastAction = nameOf(room, pid) + ": UNO!";
      emitRoom(room);
    }
  });
  socket.on("again", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    room.status = "lobby";
    room.game = null;
    emitRoom(room);
  });
  socket.on("disconnect", function () {
    const code = socket.data.roomCode;
    const pid = socket.data.playerId;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.find(function (x) { return x.id === pid; });
    if (p) { p.connected = false; p.socketId = null; }
    if (room.game && room.status === "playing") {
      room.game.lastAction = (p ? p.name : "Oyuncu") + " koptu. Kod ile geri katilsin, oyun bekliyor.";
    }
    emitRoom(room);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () { console.log("Uno " + VERSION + " port " + PORT); });
