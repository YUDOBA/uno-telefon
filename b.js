function setNotice(g, general, map) {
  g.notice = general; g.noticeYou = map || {}; g.lastAction = general;
}
io.on("connection", function (socket) {
  socket.data.playerId = null; socket.data.roomCode = null;
  socket.on("create", function (d) {
    d = d || {};
    const n = Math.max(2, Math.min(8, parseInt(d.maxPlayers, 10) || 2));
    const code = codeGen(); const playerId = uid(); const token = uid();
    const room = {
      code: code, hostId: playerId, maxPlayers: n, status: "lobby", game: null,
      seats: [playerId], roundsTotal: 3, roundNow: 1, scores: {}, lastRoundPts: {},
      players: [{ id: playerId, token: token, name: String(d.name || "Kurucu").slice(0, 16), socketId: socket.id, connected: true }]
    };
    rooms.set(code, room);
    socket.data.playerId = playerId; socket.data.roomCode = code; socket.join(code);
    socket.emit("created", { code: code, playerId: playerId, token: token, version: VERSION });
    emitRoom(room);
  });
  socket.on("join", function (d) {
    d = d || {};
    let room = rooms.get(normCode(d.code));
    if (!room) { loadRooms(); room = rooms.get(normCode(d.code)); }
    if (!room) return socket.emit("errorMsg", "Oda yok. Kurucu sayfayi acik tutsun ve oyunu tekrar kursun. Yeni kodu paylasin.");
    const nm = String(d.name || "Oyuncu").slice(0, 16);
    let existing = room.players.find(function (p) { return d.token && p.token === d.token; });
    if (!existing) existing = room.players.find(function (p) { return !p.connected && p.name === nm; });
    if (existing) {
      existing.socketId = socket.id; existing.connected = true; if (nm) existing.name = nm;
      socket.data.playerId = existing.id; socket.data.roomCode = room.code; socket.join(room.code);
      socket.emit("joined", { code: room.code, playerId: existing.id, token: existing.token, version: VERSION });
      emitRoom(room); return;
    }
    if (room.status !== "lobby") return socket.emit("errorMsg", "Oyun devam ediyor. Kopan ayni ad ile donebilir.");
    if (room.players.length >= room.maxPlayers) return socket.emit("errorMsg", "Oda dolu.");
    const playerId = uid(); const tok = uid();
    room.players.push({ id: playerId, token: tok, name: nm, socketId: socket.id, connected: true });
    if (!room.seats) room.seats = [];
    if (room.seats.indexOf(playerId) < 0) room.seats.push(playerId);
    socket.data.playerId = playerId; socket.data.roomCode = room.code; socket.join(room.code);
    socket.emit("joined", { code: room.code, playerId: playerId, token: tok, version: VERSION });
    emitRoom(room);
  });
  socket.on("setSeats", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || room.status !== "lobby") return;
    const ids = (d && d.seats) || [];
    const ok = ids.every(function (id) { return room.players.some(function (p) { return p.id === id; }); });
    if (!ok || ids.length !== room.players.length) return;
    room.seats = ids.slice();
    emitRoom(room);
  });
  socket.on("setRounds", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || room.status !== "lobby") return;
    room.roundsTotal = Math.max(1, Math.min(15, parseInt(d && d.rounds, 10) || 3));
    emitRoom(room);
  });
  socket.on("start", function (d) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return socket.emit("errorMsg", "Sadece kurucu baslatabilir.");
    if (room.status !== "lobby") return;
    if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
    room.roundsTotal = Math.max(1, Math.min(15, parseInt((d && d.rounds) || room.roundsTotal, 10) || 3));
    room.roundNow = 1;
    room.scores = {};
    room.players.forEach(function (p) { room.scores[p.id] = 0; });
    startGame(room); emitRoom(room);
  });
  socket.on("sawScores", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "winnerShow") return;
    if (!room.sawScores) room.sawScores = {};
    room.sawScores[socket.data.playerId] = true;
    emitRoom(room);
  });
  socket.on("readyNext", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "winnerShow" || room.gameOver) return;
    if (!room.readyNext) room.readyNext = {};
    room.readyNext[socket.data.playerId] = true;
    const all = room.players.every(function (p) { return room.readyNext[p.id]; });
    if (all) {
      room.roundNow += 1;
      startGame(room);
    }
    emitRoom(room);
  });
  socket.on("play", function (d) {
    d = d || {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    const g = room.game; const pid = socket.data.playerId;
    const actorP = room.players.find(function (x) { return x.id === g.currentId; });
    if (actorP && !actorP.connected) return socket.emit("errorMsg", "Siradaki oyuncu kopuk.");
    if (g.winnerId) return socket.emit("errorMsg", "Tur bitti.");
    if (g.drawQueue && g.drawQueue.length) return socket.emit("errorMsg", "Once ceza cekilmeli.");
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    const hand = g.hands[pid]; const card = hand[d.cardIndex]; if (!card) return;
    const top = g.discard[g.discard.length - 1];
    if (!canPlay(card, top, g.chosenColor, g.plusStack > 0 ? g.stackKind : null)) return socket.emit("errorMsg", "Bu kart oynanamaz.");
    const needColor = { wild:1, wild4:1, custom:1, wdraw2:1, wtarget2:1, wskip2:1, swap:1, shuffle:1, skipall:1 };
    if (needColor[card.type] && COLORS.indexOf(d.chosenColor) < 0) return socket.emit("errorMsg", "Renk sec.");
    if ((card.type === "wtarget2" || card.type === "swap") && !room.players.some(function (p) { return p.id === d.targetId && p.id !== pid; }))
      return socket.emit("errorMsg", "Oyuncu sec.");
    if (card.type === "custom") {
      const others = room.players.filter(function (p) { return p.id !== pid; });
      const queue = []; let sum = 0;
      (d.assign || []).forEach(function (a) {
        const n = Math.max(0, parseInt(a.n, 10) || 0); if (!n) return;
        if (!others.some(function (o) { return o.id === a.playerId; })) return;
        queue.push({ playerId: a.playerId, left: n }); sum += n;
      });
      if (sum !== 8) return socket.emit("errorMsg", "Ozel Jokerde toplam 8 olmali.");
      delete g.pendingDrawn;
      hand.splice(d.cardIndex, 1); g.discard.push(card); g.chosenColor = d.chosenColor;
      io.to(room.code).emit("cardFly", { card: card, fromId: pid });
      if (hand.length === 1 && !g.saidUno[pid]) drawCards(g, pid, 2);
      if (hand.length === 0) { endRound(room, pid); emitRoom(room); return; }
      g.drawQueue = queue; g.stackKind = "custom"; g.afterDrawTo = nextSeat(room, pid, false);
      const parts = queue.map(function (q) { return nameOf(room, q.playerId) + " " + q.left; }).join(", ");
      const map = {}; map[pid] = "Ozel Joker attin. 8 ceza: " + parts;
      queue.forEach(function (q) { map[q.playerId] = "Sana " + q.left + " kart ceza. Desteye bas."; });
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Ozel Joker atti. " + parts; });
      setNotice(g, nameOf(room, pid) + " Ozel Joker atti. " + parts, map);
      g.currentId = queue[0].playerId; emitRoom(room); return;
    }
    if (card.type === "wdraw2" || card.type === "wtarget2" || card.type === "wskip2" || card.type === "swap" || card.type === "shuffle" || card.type === "skipall" || card.type === "flip") {
      delete g.pendingDrawn;
      hand.splice(d.cardIndex, 1); g.discard.push(card);
      io.to(room.code).emit("cardFly", { card: card, fromId: pid });
      g.chosenColor = card.color === "black" ? d.chosenColor : card.color;
      if (hand.length === 1 && !g.saidUno[pid]) drawCards(g, pid, 2);
      if (hand.length === 0) { endRound(room, pid); emitRoom(room); return; }
      const map = {};
      if (card.type === "wdraw2") {
        const nxt = nextSeat(room, pid, false);
        g.plusStack = 2; g.stackKind = "wdraw2"; g.afterDrawTo = nxt; g.currentId = nxt;
        setNotice(g, nameOf(room, pid) + " Joker +2 atti.", map);
        emitRoom(room); return;
      }
      if (card.type === "wtarget2") {
        g.drawQueue = [{ playerId: d.targetId, left: 2 }]; g.stackKind = "wtarget2"; g.afterDrawTo = nextSeat(room, pid, false); g.currentId = d.targetId;
        setNotice(g, nameOf(room, pid) + " Hedef +2: " + nameOf(room, d.targetId), map);
        emitRoom(room); return;
      }
      if (card.type === "wskip2") {
        let x = nextSeat(room, pid, false);
        x = nextSeat(room, x, false);
        x = nextSeat(room, x, false);
        g.currentId = x;
        setNotice(g, nameOf(room, pid) + " Cift Atla atti.", map);
        emitRoom(room); return;
      }
      if (card.type === "swap") {
        const tmp = g.hands[pid]; g.hands[pid] = g.hands[d.targetId] || []; g.hands[d.targetId] = tmp;
        g.saidUno[pid] = false; g.saidUno[d.targetId] = false;
        g.currentId = nextSeat(room, pid, false);
        setNotice(g, nameOf(room, pid) + " el degistirdi: " + nameOf(room, d.targetId), map);
        emitRoom(room); return;
      }
      if (card.type === "shuffle") {
        const bags = [];
        room.players.forEach(function (p) { (g.hands[p.id] || []).forEach(function (c) { bags.push(c); }); });
        const mixed = shuffle(bags);
        room.players.forEach(function (p) {
          const n = (g.hands[p.id] || []).length;
          g.hands[p.id] = mixed.splice(0, n);
          g.saidUno[p.id] = false;
        });
        g.currentId = nextSeat(room, pid, false);
        setNotice(g, nameOf(room, pid) + " elleri karistirdi.", map);
        emitRoom(room); return;
      }
      if (card.type === "flip") {
        g.direction *= -1;
        g.currentId = nextSeat(room, pid, false);
        setNotice(g, nameOf(room, pid) + " Cevir atti. Yon dondu.", map);
        emitRoom(room); return;
      }
      if (card.type === "skipall") {
        g.currentId = pid;
        setNotice(g, nameOf(room, pid) + " herkesi atladi. Tekrar oynar.", map);
        emitRoom(room); return;
      }
    }
    delete g.pendingDrawn;
    hand.splice(d.cardIndex, 1); g.discard.push(card);
    io.to(room.code).emit("cardFly", { card: card, fromId: pid });
    g.chosenColor = card.color === "black" ? d.chosenColor : card.color;
    if (hand.length === 1 && !g.saidUno[pid]) drawCards(g, pid, 2);
    if (hand.length === 0) { endRound(room, pid); emitRoom(room); return; }
    const two = room.players.length === 2;
    let skip = false;
    if (card.type === "skip") skip = true;
    if (card.type === "reverse") { if (two) skip = true; else g.direction *= -1; }
    const nxt = nextSeat(room, pid, false);
    const map = {};
    if (card.type === "draw2") {
      g.plusStack = (g.stackKind === "draw2" ? (g.plusStack || 0) : 0) + 2;
      g.stackKind = "draw2"; g.afterDrawTo = nxt; g.currentId = nxt;
      map[pid] = "+2 attin. Yigin " + g.plusStack;
      map[nxt] = "+2 yigini " + g.plusStack + ". +2 at veya desteye bas.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " +2 atti. Yigin " + g.plusStack; });
      setNotice(g, nameOf(room, pid) + " +2 atti. Yigin " + g.plusStack, map);
      emitRoom(room); return;
    }
    if (card.type === "wild4") {
      g.plusStack = 4; g.stackKind = "wild4"; g.afterDrawTo = nxt; g.currentId = nxt;
      map[pid] = "+4 attin. " + nameOf(room, nxt) + " cekecek.";
      map[nxt] = "+4 yedin. Desteye bas.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " +4 atti."; });
      setNotice(g, nameOf(room, pid) + " Joker +4 atti.", map);
      emitRoom(room); return;
    }
    g.plusStack = 0; g.stackKind = null;
    if (card.type === "skip") {
      const after = nextSeat(room, pid, true);
      map[pid] = "Atla attin."; map[nxt] = "Atlandin.";
      room.players.forEach(function (p) { if (!map[p.id]) map[p.id] = nameOf(room, pid) + " Atla atti."; });
      setNotice(g, nameOf(room, pid) + " Atla atti. " + nameOf(room, nxt) + " atlandi.", map);
      g.currentId = after; emitRoom(room); return;
    }
    if (card.type === "reverse") {
      room.players.forEach(function (p) { map[p.id] = nameOf(room, pid) + " Ters atti. Yon: " + (g.direction === 1 ? "saat" : "ters"); });
      setNotice(g, nameOf(room, pid) + " Ters atti.", map);
      g.currentId = nextSeat(room, pid, skip); emitRoom(room); return;
    }
    if (card.type === "wild") {
      room.players.forEach(function (p) { map[p.id] = nameOf(room, pid) + " Joker. Renk: " + COLOR_TR[g.chosenColor]; });
      setNotice(g, nameOf(room, pid) + " Joker atti.", map);
      g.currentId = nextSeat(room, pid, false); emitRoom(room); return;
    }
    setNotice(g, nameOf(room, pid) + " " + cardLabel(card) + " atti.", {});
    g.currentId = nextSeat(room, pid, false);
    emitRoom(room);
  });
  socket.on("draw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    const g = room.game; const pid = socket.data.playerId;
    if (g.winnerId) return socket.emit("errorMsg", "Tur bitti.");
    if (g.drawQueue && g.drawQueue.length) {
      const q = g.drawQueue[0];
      if (q.playerId !== pid) return socket.emit("errorMsg", "Ceza sirasi sende degil.");
      drawCards(g, pid, 1); q.left -= 1; io.to(room.code).emit("cardDraw", { toId: pid });
      g.lastAction = nameOf(room, pid) + " ceza cekti. Kalan " + q.left;
      if (q.left <= 0) g.drawQueue.shift();
      if (!g.drawQueue.length) {
        g.stackKind = null;
        g.currentId = g.afterDrawTo || nextSeat(room, pid, false);
        delete g.afterDrawTo;
        g.notice = nameOf(room, pid) + " cezayi bitirdi. Sira " + nameOf(room, g.currentId) + " oyuncusunda.";
        g.lastAction = g.notice;
        g.noticeYou = {};
        g.noticeYou[g.currentId] = "Ceza bitti. Sira sende.";
      } else g.currentId = g.drawQueue[0].playerId;
      emitRoom(room); return;
    }
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    if (g.plusStack && g.plusStack > 0) {
      drawCards(g, pid, 1); g.plusStack -= 1; io.to(room.code).emit("cardDraw", { toId: pid });
      g.lastAction = nameOf(room, pid) + " ceza cekti. Kalan " + g.plusStack;
      if (g.plusStack <= 0) {
        g.plusStack = 0; g.stackKind = null;
        g.currentId = g.afterDrawTo || nextSeat(room, pid, false);
        delete g.afterDrawTo;
        g.lastAction = nameOf(room, pid) + " cezayi bitirdi. Sira " + nameOf(room, g.currentId) + " oyuncusunda.";
        g.notice = g.lastAction;
        g.noticeYou = {};
        g.noticeYou[g.currentId] = "Ceza bitti. Sira sende.";
      }
      emitRoom(room); return;
    }
    if (g.pendingDrawn && g.pendingDrawn.playerId === pid) {
      return socket.emit("errorMsg", "Zaten 1 kart cektin. At veya Pas.");
    }
    const top = g.discard[g.discard.length - 1];
    const taken = drawCards(g, pid, 1);
    io.to(room.code).emit("cardDraw", { toId: pid });
    const drawn = taken[0];
    g.pendingDrawn = { playerId: pid, card: drawn };
    g.lastAction = nameOf(room, pid) + " kart cekti. At veya Pas.";
    g.notice = g.lastAction;
    g.noticeYou = {};
    g.noticeYou[pid] = drawn && canPlay(drawn, top, g.chosenColor, null) ? "Cektigin karti atabilirsin veya Pas." : "Cektin. Uygun kartin yoksa Pas.";
    emitRoom(room); socket.emit("drawnPlayable");
  });
  socket.on("passAfterDraw", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game || room.status !== "playing") return;
    const g = room.game; const pid = socket.data.playerId;
    if (g.winnerId) return;
    if (g.currentId !== pid) return socket.emit("errorMsg", "Sira sende degil.");
    if (g.plusStack > 0 || (g.drawQueue && g.drawQueue.length)) return socket.emit("errorMsg", "Once cezayi cek.");
    delete g.pendingDrawn;
    g.lastAction = nameOf(room, pid) + " pas gecti.";
    g.currentId = nextSeat(room, pid, false);
    emitRoom(room);
  });
  socket.on("uno", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    const pid = socket.data.playerId;
    if (room.game.hands[pid] && room.game.hands[pid].length === 2) {
      room.game.saidUno[pid] = true; room.game.lastAction = nameOf(room, pid) + ": UNO!";
      io.to(room.code).emit("unoShout", { playerId: pid, name: nameOf(room, pid) });
      emitRoom(room);
    }
  });
  socket.on("again", function () {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    room.status = "lobby"; room.game = null; room.roundNow = 1; room.scores = {}; emitRoom(room);
  });
  socket.on("ping", function () {});
  socket.on("disconnect", function () {
    const room = rooms.get(socket.data.roomCode); if (!room) return;
    const deadId = socket.id;
    const pid = socket.data.playerId;
    setTimeout(function () {
      const r = rooms.get(socket.data.roomCode); if (!r) return;
      const p = r.players.find(function (x) { return x.id === pid; });
      if (!p) return;
      if (p.socketId && p.socketId !== deadId) return;
      p.connected = false; p.socketId = null;
      if (r.game && r.status === "playing") r.game.lastAction = (p.name || "Oyuncu") + " koptu.";
      emitRoom(r);
    }, 1500);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () { console.log("Uno " + VERSION + " port " + PORT); });
