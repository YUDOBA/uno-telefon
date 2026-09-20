function humanCount(room) {
  return room.players.filter(function (p) { return p.connected && !p.isBot; }).length;
}
function bornBots(room) {
  return room.players.filter(function (p) { return p.bornBot && p.isBot; });
}
function stripBotTag(n) {
  return String(n || "").replace(/\s*\(Bot\)\s*$/i, "");
}
function fillBots(room) {
  var n = 1;
  room.players.forEach(function (p) {
    var m = /^Bot (\d+)$/.exec(p.name);
    if (m) n = Math.max(n, parseInt(m[1], 10) + 1);
  });
  while (room.players.length < room.maxPlayers) {
    var id = uid();
    var p = { id: id, token: uid(), name: "Bot " + n, socketId: null, connected: true, isBot: true, bornBot: true };
    n += 1;
    room.players.push(p);
    if (!room.seats) room.seats = [];
    room.seats.push(id);
    if (!room.scores) room.scores = {};
    room.scores[id] = room.scores[id] || 0;
  }
}
function markTakeover(p) {
  if (!p) return;
  if (p.bornBot && !p.humanName) { p.isBot = true; return; }
  p.humanName = p.humanName || stripBotTag(p.name);
  p.name = p.humanName + " (Bot)";
  p.isBot = true;
  p.botTakeover = true;
  p.connected = true;
}
function restoreHuman(p, nm) {
  p.isBot = false;
  p.botTakeover = false;
  p.bornBot = false;
  p.name = stripBotTag(nm || p.humanName || p.name);
  p.humanName = p.name;
  p.connected = true;
}
function colorCount(hand) {
  var c = { red: 0, yellow: 0, green: 0, blue: 0 };
  (hand || []).forEach(function (x) { if (x && c[x.color] != null) c[x.color]++; });
  var best = "red", n = -1;
  COLORS.forEach(function (k) { if (c[k] > n) { n = c[k]; best = k; } });
  return best;
}
function cardScore(c) {
  if (!c) return 0;
  if (c.type === "number") return Number(c.value) || 0;
  return 10;
}
function pickBotCard(hand, top, chosenColor, stackKind, level, room, pid) {
  var playable = [];
  (hand || []).forEach(function (c, i) {
    if (canPlay(c, top, chosenColor, stackKind)) playable.push({ c: c, i: i });
  });
  if (!playable.length) return null;
  level = level || "mid";
  if (level === "easy") return playable[0];
  playable.sort(function (a, b) { return cardScore(b.c) - cardScore(a.c); });
  return playable[0];
}
function splitEight(room, pid, level) {
  var others = room.players.filter(function (p) { return p.id !== pid; });
  var humans = others.filter(function (p) { return !p.isBot; });
  var targets = level === "hard" && humans.length ? humans : others;
  var left = 8;
  var assign = targets.map(function (p) { return { playerId: p.id, n: 0 }; });
  var i = 0;
  while (left > 0 && assign.length) {
    assign[i % assign.length].n += 1;
    left -= 1; i += 1;
  }
  return assign.filter(function (a) { return a.n > 0; });
}
function pickTarget(room, pid) {
  var others = room.players.filter(function (p) { return p.id !== pid; });
  var humans = others.filter(function (p) { return !p.isBot; });
  var pool = humans.length ? humans : others;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
function botApplyPlay(room, pid, idx, extra) {
  extra = extra || {};
  var g = room.game;
  var hand = g.hands[pid];
  var card = hand[idx];
  if (!card) return;
  var top = g.discard[g.discard.length - 1];
  var stackKind = g.plusStack > 0 ? g.stackKind : null;
  if (!canPlay(card, top, g.chosenColor, stackKind)) return;
  var needColor = { wild:1, wild4:1, custom:1, wdraw2:1, wtarget2:1, wskip2:1, swap:1, shuffle:1, skipall:1 };
  var col = extra.chosenColor || colorCount(hand);
  if (needColor[card.type] && COLORS.indexOf(col) < 0) col = "red";
  if (card.type === "custom") {
    var queue = [];
    (extra.assign || splitEight(room, pid, room.botLevel)).forEach(function (a) {
      var n = Math.max(0, parseInt(a.n, 10) || 0); if (!n) return;
      if (!room.players.some(function (o) { return o.id === a.playerId && o.id !== pid; })) return;
      queue.push({ playerId: a.playerId, left: n });
    });
    var sum = 0; queue.forEach(function (q) { sum += q.left; });
    if (sum !== 8) return;
    delete g.pendingDrawn; hand.splice(idx, 1); g.discard.push(card); g.chosenColor = col;
    try { io.to(room.code).emit("cardFly", { card: card, fromId: pid }); } catch (e) {}
    if (hand.length === 1) g.saidUno[pid] = true;
    if (hand.length === 0) { endRound(room, pid); return; }
    g.drawQueue = queue; g.stackKind = "custom"; g.afterDrawTo = nextSeat(room, pid, false);
    g.currentId = queue[0].playerId;
    setNotice(g, nameOf(room, pid) + " Ozel Joker atti.", {});
    return;
  }
  delete g.pendingDrawn; hand.splice(idx, 1); g.discard.push(card);
  try { io.to(room.code).emit("cardFly", { card: card, fromId: pid }); } catch (e) {}
  g.chosenColor = card.color === "black" ? col : card.color;
  if (hand.length === 1) g.saidUno[pid] = true;
  if (hand.length === 0) { endRound(room, pid); return; }
  var nxt = nextSeat(room, pid, false);
  if (card.type === "wdraw2") { g.plusStack = 2; g.stackKind = "wdraw2"; g.afterDrawTo = nxt; g.currentId = nxt; return; }
  if (card.type === "wtarget2") {
    var tid = extra.targetId || pickTarget(room, pid);
    g.drawQueue = [{ playerId: tid, left: 2 }]; g.stackKind = "wtarget2"; g.afterDrawTo = nxt; g.currentId = tid; return;
  }
  if (card.type === "wskip2") {
    var x = nextSeat(room, pid, false); x = nextSeat(room, x, false); x = nextSeat(room, x, false); g.currentId = x; return;
  }
  if (card.type === "swap") {
    var sid = extra.targetId || pickTarget(room, pid);
    var tmp = g.hands[pid]; g.hands[pid] = g.hands[sid] || []; g.hands[sid] = tmp;
    g.saidUno[pid] = false; g.saidUno[sid] = false; g.currentId = nxt; return;
  }
  if (card.type === "shuffle") {
    var bags = [];
    room.players.forEach(function (pl) { (g.hands[pl.id] || []).forEach(function (c) { bags.push(c); }); });
    var mixed = shuffle(bags);
    room.players.forEach(function (pl) {
      var n = (g.hands[pl.id] || []).length;
      g.hands[pl.id] = mixed.splice(0, n);
      g.saidUno[pl.id] = false;
    });
    g.currentId = nxt; return;
  }
  if (card.type === "skipall") { g.currentId = pid; return; }
  if (card.type === "draw2") {
    g.plusStack = (g.stackKind === "draw2" ? (g.plusStack || 0) : 0) + 2;
    g.stackKind = "draw2"; g.afterDrawTo = nxt; g.currentId = nxt; return;
  }
  if (card.type === "wild4") { g.plusStack = 4; g.stackKind = "wild4"; g.afterDrawTo = nxt; g.currentId = nxt; return; }
  g.plusStack = 0; g.stackKind = null;
  if (card.type === "skip") { g.currentId = nextSeat(room, pid, true); return; }
  if (card.type === "reverse") {
    if (room.players.length === 2) g.currentId = nextSeat(room, pid, true);
    else { g.direction *= -1; g.currentId = nextSeat(room, pid, false); }
    return;
  }
  g.currentId = nxt;
}
function botDrawOnce(room, pid) {
  drawCards(room.game, pid, 1);
  try { io.to(room.code).emit("cardDraw", { toId: pid }); } catch (e) {}
}
function botStep(room) {
  if (!room || room.status !== "playing" || !room.game || room.game.winnerId) return;
  var g = room.game;
  var actor = g.currentId;
  if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
  var p = room.players.find(function (x) { return x.id === actor; });
  if (!p || !p.isBot) return;
  if (g.drawQueue && g.drawQueue.length) {
    var q = g.drawQueue[0];
    if (q.playerId !== p.id) return;
    botDrawOnce(room, p.id); q.left -= 1;
    if (q.left <= 0) g.drawQueue.shift();
    if (!g.drawQueue.length) {
      g.stackKind = null; g.currentId = g.afterDrawTo || nextSeat(room, p.id, false); delete g.afterDrawTo;
    } else g.currentId = g.drawQueue[0].playerId;
    emitRoom(room); return;
  }
  if (g.plusStack && g.plusStack > 0) {
    botDrawOnce(room, p.id); g.plusStack -= 1;
    if (g.plusStack <= 0) {
      g.plusStack = 0; g.stackKind = null; g.currentId = g.afterDrawTo || nextSeat(room, p.id, false); delete g.afterDrawTo;
    }
    emitRoom(room); return;
  }
  var hand = g.hands[p.id] || [];
  if (hand.length === 2) g.saidUno[p.id] = true;
  var top = g.discard[g.discard.length - 1];
  var pick = pickBotCard(hand, top, g.chosenColor, g.plusStack > 0 ? g.stackKind : null, room.botLevel, room, p.id);
  if (g.pendingDrawn && g.pendingDrawn.playerId === p.id) {
    if (pick) botApplyPlay(room, p.id, pick.i, {});
    else { delete g.pendingDrawn; g.currentId = nextSeat(room, p.id, false); }
    emitRoom(room); return;
  }
  if (pick) {
    botApplyPlay(room, p.id, pick.i, { chosenColor: colorCount(hand), targetId: pickTarget(room, p.id), assign: splitEight(room, p.id, room.botLevel) });
    emitRoom(room); return;
  }
  var taken = drawCards(g, p.id, 1);
  try { io.to(room.code).emit("cardDraw", { toId: p.id }); } catch (e) {}
  var drawn = taken[0];
  if (drawn && canPlay(drawn, top, g.chosenColor, null)) {
    botApplyPlay(room, p.id, g.hands[p.id].length - 1, { chosenColor: colorCount(g.hands[p.id]) });
  } else g.currentId = nextSeat(room, p.id, false);
  emitRoom(room);
}
function scheduleBot(room) {
  if (!room || room.status !== "playing" || !room.game || room.game.winnerId) return;
  var g = room.game;
  var actor = g.currentId;
  if (g.drawQueue && g.drawQueue.length) actor = g.drawQueue[0].playerId;
  var p = room.players.find(function (x) { return x.id === actor; });
  if (!p || !p.isBot) return;
  if (room._botTimer) clearTimeout(room._botTimer);
  room._botTimer = setTimeout(function () { botStep(room); }, 2000 + Math.floor(Math.random() * 1000));
}
function scheduleEmptyClose(room) {
  if (humanCount(room) > 0) {
    if (room._emptyTimer) { clearTimeout(room._emptyTimer); room._emptyTimer = null; }
    return;
  }
  if (room._emptyTimer) return;
  room._emptyTimer = setTimeout(function () {
    if (!rooms.get(room.code)) return;
    if (humanCount(room) > 0) return;
    rooms.delete(room.code); saveRooms();
  }, 45000);
}
function botsAck(room) {
  if (room.status !== "winnerShow") return;
  if (!room.sawScores) room.sawScores = {};
  if (!room.readyNext) room.readyNext = {};
  room.players.forEach(function (p) {
    if (p.isBot) {
      room.sawScores[p.id] = true;
      if (!room.gameOver) room.readyNext[p.id] = true;
    }
  });
  if (!room.gameOver && room.players.every(function (p) { return room.readyNext[p.id]; })) {
    room.roundNow += 1; startGame(room);
  }
}
const _start58 = startGame;
startGame = function (room) { fillBots(room); _start58(room); scheduleBot(room); };
const _pr58 = publicRoom;
publicRoom = function (room, viewerId) {
  var o = _pr58(room, viewerId);
  o.botLevel = room.botLevel || "mid";
  var cur = o.game && o.game.currentId;
  var actor = room.players.find(function (p) { return p.id === cur; });
  o.paused = !!(room.status === "playing" && actor && !actor.isBot && !actor.connected);
  if (o.players) o.players.forEach(function (rp) {
    var raw = room.players.find(function (x) { return x.id === rp.id; });
    if (raw) rp.isBot = !!raw.isBot;
  });
  return o;
};
const _em58 = emitRoom;
emitRoom = function (room) { botsAck(room); _em58(room); scheduleEmptyClose(room); scheduleBot(room); };
io.on("connection", function (socket) {
  process.nextTick(function () {
    socket.removeAllListeners("join");
    socket.removeAllListeners("start");
    socket.on("start", function (d) {
      d = d || {};
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.hostId !== socket.data.playerId) return socket.emit("errorMsg", "Sadece kurucu baslatabilir.");
      if (room.status !== "lobby") return;
      var lv = d.botLevel || d.level || room.botLevel || "mid";
      if (["easy", "mid", "hard"].indexOf(lv) < 0) lv = "mid";
      room.botLevel = lv;
      fillBots(room);
      if (room.players.length < 2) return socket.emit("errorMsg", "En az 2 oyuncu gerekir.");
      room.roundsTotal = Math.max(1, Math.min(15, parseInt(d.rounds || room.roundsTotal, 10) || 3));
      room.roundNow = 1; room.scores = {};
      room.players.forEach(function (p) { room.scores[p.id] = 0; });
      startGame(room); emitRoom(room);
    });
    socket.on("join", function (d) {
      d = d || {};
      const codeIn = normCode(d.code);
      if (!codeIn || codeIn.length !== 4) return socket.emit("errorMsg", "4 haneli oyun kodunu yaz.");
      let room = rooms.get(codeIn);
      if (!room) { loadRooms(); room = rooms.get(codeIn); }
      if (!room) return socket.emit("errorMsg", "Oda yok (" + codeIn + ").");
      const nm = String(d.name || "Oyuncu").slice(0, 16);
      let existing = room.players.find(function (p) { return d.token && p.token === d.token; });
      if (!existing) existing = room.players.find(function (p) {
        return !p.bornBot && (p.botTakeover || !p.connected) && stripBotTag(p.name) === nm;
      });
      if (existing) {
        restoreHuman(existing, nm);
        existing.socketId = socket.id; existing.connected = true;
        socket.data.playerId = existing.id; socket.data.roomCode = room.code; socket.join(room.code);
        socket.emit("joined", { code: room.code, playerId: existing.id, token: existing.token, version: VERSION });
        emitRoom(room); return;
      }
      if (room.status === "playing" || room.status === "winnerShow") {
        var bots = bornBots(room);
        if (!bots.length) return socket.emit("errorMsg", "Oyun devam ediyor. Kopan ayni ad ile donebilir.");
        var take = bots[Math.floor(Math.random() * bots.length)];
        take.bornBot = false; restoreHuman(take, nm); take.token = uid(); take.socketId = socket.id;
        socket.data.playerId = take.id; socket.data.roomCode = room.code; socket.join(room.code);
        socket.emit("joined", { code: room.code, playerId: take.id, token: take.token, version: VERSION });
        emitRoom(room); return;
      }
      if (room.status !== "lobby") return socket.emit("errorMsg", "Oyun devam ediyor.");
      if (room.players.length >= room.maxPlayers) return socket.emit("errorMsg", "Oda dolu.");
      const playerId = uid(); const tok = uid();
      room.players.push({ id: playerId, token: tok, name: nm, socketId: socket.id, connected: true, isBot: false });
      if (!room.seats) room.seats = [];
      if (room.seats.indexOf(playerId) < 0) room.seats.push(playerId);
      socket.data.playerId = playerId; socket.data.roomCode = room.code; socket.join(room.code);
      socket.emit("joined", { code: room.code, playerId: playerId, token: tok, version: VERSION });
      emitRoom(room);
    });
  });
  socket.on("disconnect", function () {
    var code = socket.data.roomCode, pid = socket.data.playerId, deadId = socket.id;
    setTimeout(function () {
      var r = rooms.get(code); if (!r) return;
      var p = r.players.find(function (x) { return x.id === pid; });
      if (!p) return;
      if (p.socketId && p.socketId !== deadId) return;
      if (p.bornBot) return;
      if (r.status === "lobby") return;
      p.connected = false; p.socketId = null;
      markTakeover(p); emitRoom(r);
    }, 1600);
  });
});
