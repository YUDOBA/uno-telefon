function setNotice(room, g, general, map) {
  g.notice = general;
  g.noticeYou = map || {};
  g.lastAction = general;
}
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
    socket.data.playerId = playerId; socket.data.roomCode = code; socket.join(code);
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
    socket.emit("joined", { code: room.code, playerId: playerId, token: tok, version: VERSION });
    emitRoom(room);
  });
  socket.on("start", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || room.status !== "lobby") return;
    if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
    startGame(room); emitRoom(room);
  });
  socket.on("play", function (d) {
    d = d || {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    if (anyoneOffline(room)) return socket.emit("errorMsg", "Kopan oyuncu donene kadar oyun bekliyor.");
    const g = room.game; const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.drawQueue && g.drawQueue.length) return socket.emit("errorMsg", "Once ceza kartlari cekilmeli.");
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    const hand = g.hands[pid]; const card = hand[d.cardIndex]; if (!card) return;
    const top = g.discard[g.discard.length - 1];
    if (!canPlay(card, top, g.chosenColor, g.stackKind)) return socket.emit("errorMsg", "Bu kart oynanamaz.");
    if ((card.type === "wild" || card.type === "wild4" || card.type === "custom") && COLORS.indexOf(d.chosenColor) < 0)
      return socket.emit("errorMsg", "Renk sec.");
    if (card.type === "custom") {
      const others = room.players.filter(function (p) { return p.id !== pid; });
      const queue = []; let sum = 0;
      (d.assign || []).forEach(function (a) {
        const n = Math.max(0, parseInt(a.n, 10) || 0);
        if (!n) return;
        if (!others.some(function (o) { return o.id === a.playerId; })) return;
        queue.push({ playerId: a.playerId, left: n }); sum += n;
      });
      if (sum !== 8) return socket.emit("errorMsg", "Ozel Jokerde toplam ceza 8 olmali.");
      hand.splice(d.cardIndex, 1); g.discard.push(card); g.chosenColor = d.chosenColor;
      if (hand.length === 1 && !g.saidUno[pid]) { drawCards(g, pid, 2); }
      if (hand.length === 0) { g.winnerId = pid; g.lastAction = nameOf(room, pid) + " kazandi!"; room.status = "finished"; emitRoom(room); return; }
      g.drawQueue = queue; g.stackKind = "custom"; g.afterDrawTo = nextSeat(room, pid, false);
      const parts = queue.map(function (q) { return nameOf(room, q.playerId) + " " + q.left + " kart"; }).join(", ");
      const map = {};
      map[pid] = "Ozel Joker attin. 8 cezayi dagittin: " + parts + ". Renk: " + COLOR_TR[d.chosenColor];
      queue.forEach(function (q) { map[q.playerId] = "Sana " + q.left + " kart ceza geldi. Siran gelince Kart cek'e bas (her basista 1)."; });
      room.players.forEach(function (p) {
        if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Ozel Joker atti. Ceza: " + parts + ". Bekle.";
      });
      setNotice(room, g, nameOf(room, pid) + " Ozel Joker atti. Toplam 8 ceza. " + parts, map);
      g.currentId = queue[0].playerId;
      emitRoom(room); return;
    }
    hand.splice(d.cardIndex, 1); g.discard.push(card);
    g.chosenColor = card.color === "black" ? d.chosenColor : card.color;
    if (hand.length === 1 && !g.saidUno[pid]) { drawCards(g, pid, 2); g.lastAction = nameOf(room, pid) + " UNO demedi, 2 kart cekti."; }
    if (hand.length === 0) { g.winnerId = pid; g.lastAction = nameOf(room, pid) + " kazandi!"; room.status = "finished"; emitRoom(room); return; }
    const two = room.players.length === 2;
    let skip = false;
    if (card.type === "skip") skip = true;
    if (card.type === "reverse") { if (two) skip = true; else g.direction *= -1; }
    const nxt = nextSeat(room, pid, false);
    const map = {};
    if (card.type === "draw2") {
      g.plusStack = (g.stackKind === "draw2" ? (g.plusStack || 0) : 0) + 2;
      g.stackKind = "draw2"; g.currentId = nxt;
      map[pid] = "+2 attin. Yigin " + g.plusStack + ". Renk: " + COLOR_TR[g.chosenColor];
      map[nxt] = "Sana +2 yigini geldi (" + g.plusStack + "). Elinde +2 varsa at, yoksa Kart cek.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " +2 atti. Yigin " + g.plusStack + ". Sira " + nameOf(room, nxt) + " da."; });
      setNotice(room, g, nameOf(room, pid) + " +2 atti. Yigin " + g.plusStack + ". Sira: " + nameOf(room, nxt), map);
      emitRoom(room); return;
    }
    if (card.type === "wild4") {
      g.plusStack = 4; g.stackKind = "wild4"; g.currentId = nxt;
      map[pid] = "Joker +4 attin. " + nameOf(room, nxt) + " 4 kart cekecek.";
      map[nxt] = "Joker +4 yedin. 4 kez Kart cek'e bas.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Joker +4 atti. " + nameOf(room, nxt) + " 4 cekecek."; });
      setNotice(room, g, nameOf(room, pid) + " Joker +4 atti. " + nameOf(room, nxt) + " 4 kart cekecek.", map);
      emitRoom(room); return;
    }
    g.plusStack = 0; g.stackKind = null;
    if (card.type === "skip") {
      const skipped = nxt; const after = nextSeat(room, pid, true);
      map[pid] = "Atla attin. " + nameOf(room, skipped) + " bir tur atlandi.";
      map[skipped] = "Atlandin. Bu tur kart atamazsin.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Atla atti. " + nameOf(room, skipped) + " atlandi. Sira " + nameOf(room, after) + " da."; });
      setNotice(room, g, nameOf(room, pid) + " Atla atti. " + nameOf(room, skipped) + " atlandi.", map);
      g.currentId = after; emitRoom(room); return;
    }
    if (card.type === "reverse") {
      map[pid] = "Ters attin. Yon degisti.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Ters atti. Yeni yon: " + (g.direction === 1 ? "saat yonu" : "ters yon") + "."; });
      setNotice(room, g, nameOf(room, pid) + " Ters atti. Yon degisti.", map);
      g.currentId = nextSeat(room, pid, skip); emitRoom(room); return;
    }
    if (card.type === "wild") {
      map[pid] = "Joker attin. Yeni renk: " + COLOR_TR[g.chosenColor];
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Joker atti. Renk: " + COLOR_TR[g.chosenColor] + "."; });
      setNotice(room, g, nameOf(room, pid) + " Joker atti. Renk: " + COLOR_TR[g.chosenColor], map);
      g.currentId = nextSeat(room, pid, false); emitRoom(room); return;
    }
    setNotice(room, g, nameOf(room, pid) + " " + cardLabel(card) + " atti.", {});
    g.currentId = nextSeat(room, pid, skip);
    emitRoom(room);
  });
  socket.on("draw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    if (anyoneOffline(room)) return socket.emit("errorMsg", "Kopan oyuncu donene kadar oyun bekliyor.");
    const g = room.game; const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.drawQueue && g.drawQueue.length) {
      const q = g.drawQueue[0];
      if (q.playerId !== pid) return socket.emit("errorMsg", "Ceza cekme sirasi sende degil.");
      drawCards(g, pid, 1); q.left -= 1;
      g.noticeYou = g.noticeYou || {};
      g.noticeYou[pid] = "1 ceza cektin. Sana kalan: " + q.left;
      g.lastAction = nameOf(room, pid) + " ceza cekti. Kalan " + q.left;
      if (q.left <= 0) g.drawQueue.shift();
      if (!g.drawQueue.length) {
        g.stackKind = null; g.currentId = g.afterDrawTo || nextSeat(room, pid, false);
        g.notice = "Ozel ceza bitti. Sira devam."; g.lastAction = g.notice;
      } else g.currentId = g.drawQueue[0].playerId;
      emitRoom(room); return;
    }
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    if (g.plusStack && g.plusStack > 0) {
      drawCards(g, pid, 1); g.plusStack -= 1;
      g.lastAction = nameOf(room, pid) + " ceza cekti. Kalan " + g.plusStack;
      if (g.plusStack <= 0) {
        g.plusStack = 0; g.stackKind = null;
        g.currentId = nextSeat(room, pid, false);
        g.lastAction += " Ceza bitti.";
      }
      emitRoom(room); return;
    }
    const top = g.discard[g.discard.length - 1];
    const taken = drawCards(g, pid, 1);
    const drawn = taken[0];
    if (drawn && canPlay(drawn, top, g.chosenColor, null)) {
      g.pendingDrawn = { playerId: pid, card: drawn };
      g.lastAction = nameOf(room, pid) + " kart cekti, oynayabilir.";
      emitRoom(room); socket.emit("drawnPlayable"); return;
    }
    g.lastAction = nameOf(room, pid) + " kart cekti.";
    g.currentId = nextSeat(room, pid, false);
    emitRoom(room);
  });
  socket.on("passAfterDraw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const g = room.game; const pid = socket.data.playerId;
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
    room.status = "lobby"; room.game = null; emitRoom(room);
  });
  socket.on("disconnect", function () {
    const code = socket.data.roomCode; const pid = socket.data.playerId;
    if (!code) return;
    const room = rooms.get(code); if (!room) return;
    const p = room.players.find(function (x) { return x.id === pid; });
    if (p) { p.connected = false; p.socketId = null; }
    if (room.game && room.status === "playing") room.game.lastAction = (p ? p.name : "Oyuncu") + " koptu. Kod ile geri katilsin.";
    emitRoom(room);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () { console.log("Uno " + VERSION + " port " + PORT); });
