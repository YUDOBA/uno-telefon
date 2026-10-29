"use strict";
// Oyun motoru: tur başlatma, kart atma, çekme, pas, YUDOBA, tur sonu.
// Socket'ten bağımsızdır; yayınlanacak olayları fx.events listesine ekler.

const R = require("./rules");

function nameOf(room, id) {
  const p = room.players.find((x) => x.id === id);
  return p ? p.name : "Oyuncu";
}

function seatIds(room) {
  return room.seats && room.seats.length ? room.seats : room.players.map((p) => p.id);
}

// fromId'den sonraki koltuk (steps kadar ilerler, oyun yönüne göre)
function nextSeat(room, fromId, steps) {
  const ids = seatIds(room);
  if (!ids.length) return fromId;
  const dir = room.game ? room.game.direction : 1;
  let i = ids.indexOf(fromId);
  if (i < 0) i = 0;
  const n = ids.length;
  return ids[(((i + (steps || 1) * dir) % n) + n) % n];
}

// Şu an hamle yapması beklenen oyuncu (ceza sırası öncelikli)
function actorOf(g) {
  if (!g) return null;
  if (g.drawQueue && g.drawQueue.length) return g.drawQueue[0].playerId;
  return g.currentId;
}

function isPenalty(g) {
  return !!(g && ((g.plusStack || 0) > 0 || (g.drawQueue && g.drawQueue.length)));
}

function activeStack(g) {
  return isPenalty(g) ? g.stackKind : null;
}

function setNotice(g, general, perPlayer) {
  g.notice = general;
  g.noticeYou = perPlayer || {};
}

function drawCards(g, pid, n, fx) {
  const taken = [];
  if (!g.hands[pid]) g.hands[pid] = [];
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) {
      const top = g.discard.pop();
      g.deck = R.shuffle(g.discard).map((c) => { delete c.fresh; return c; });
      g.discard = top ? [top] : [];
      if (fx) fx.reshuffled = true;
      if (!g.deck.length) break;
    }
    const c = g.deck.pop();
    c.fresh = true;
    g.hands[pid].push(c);
    taken.push(c);
  }
  g.saidUno[pid] = false;
  if (fx && taken.length) fx.events.push(["cardDraw", { toId: pid, n: taken.length }]);
  return taken;
}

function startRound(room) {
  const deck = R.makeDeck();
  const ids = room.players.map((p) => p.id);
  room.seats = (room.seats || []).filter((id) => ids.includes(id));
  ids.forEach((id) => { if (!room.seats.includes(id)) room.seats.push(id); });

  const hands = {};
  ids.forEach((id) => { hands[id] = []; });
  for (let i = 0; i < 7; i++) ids.forEach((id) => hands[id].push(deck.pop()));
  // İlk kart sayı kartı olmalı
  let first = deck.pop();
  while (first.type !== "number") { deck.unshift(first); first = deck.pop(); }

  ids.forEach((id) => {
    if (room.scores[id] == null) room.scores[id] = 0;
    if (room.timeScores[id] == null) room.timeScores[id] = 0;
  });
  room.readyNext = {};
  room.sawScores = {};
  room.gameOver = false;
  room.game = {
    deck, discard: [first], hands,
    currentId: room.seats[0], direction: 1, chosenColor: first.color,
    saidUno: {}, winnerId: null, plusStack: 0, stackKind: null,
    drawQueue: [], afterDrawTo: null, pendingDrawn: null,
    notice: "Tur " + room.roundNow + "/" + room.roundsTotal + " başladı. Üstte: " + R.cardLabel(first),
    noticeYou: {}
  };
  room.status = "playing";
  room.moveSeq = (room.moveSeq || 0) + 1;
  room.roundId = (room.roundId || 0) + 1;
}

function endRound(room, winnerId) {
  const g = room.game;
  const last = {};
  room.players.forEach((p) => {
    const pts = (g.hands[p.id] || []).reduce((s, c) => s + R.cardPoints(c), 0);
    last[p.id] = pts;
    room.scores[p.id] = (room.scores[p.id] || 0) + pts;
  });
  if (winnerId) room.scores[winnerId] = (room.scores[winnerId] || 0) - 10;
  room.lastRoundPts = last;
  room.lastWinnerId = winnerId;
  room.readyNext = {};
  room.sawScores = {};
  room.gameOver = room.roundNow >= room.roundsTotal;
  room.status = "winnerShow";
  g.winnerId = winnerId;
  setNotice(g, room.gameOver ? "Oyun bitti." : "Tur " + room.roundNow + " bitti.");
}

function totalOf(room, id) {
  return (room.scores[id] || 0) + (room.timeScores[id] || 0);
}

// opts: { cardIndex, chosenColor, targetId, assign: [{playerId, n}] }
function play(room, pid, opts, fx) {
  const g = room.game;
  if (!g || room.status !== "playing" || g.winnerId) return "Tur bitti.";
  if (g.drawQueue.length) return "Önce ceza çekilmeli.";
  if (g.currentId !== pid) return "Sıra sende değil.";
  const hand = g.hands[pid];
  const idx = opts.cardIndex;
  const card = hand[idx];
  if (!card) return "Kart bulunamadı.";
  const top = g.discard[g.discard.length - 1];
  if (!R.canPlay(card, top, g.chosenColor, activeStack(g))) return "Bu kart oynanamaz.";
  if (R.NEEDS_COLOR.has(card.type) && !R.COLORS.includes(opts.chosenColor)) return "Renk seç.";
  const others = room.players.filter((p) => p.id !== pid);
  if (R.NEEDS_TARGET.has(card.type) && !others.some((p) => p.id === opts.targetId)) return "Oyuncu seç.";

  let queue = null;
  if (card.type === "custom") {
    const want = {};
    let sum = 0;
    (opts.assign || []).forEach((a) => {
      const n = Math.max(0, parseInt(a && a.n, 10) || 0);
      if (!n || !others.some((o) => o.id === a.playerId)) return;
      want[a.playerId] = (want[a.playerId] || 0) + n;
      sum += n;
    });
    if (sum !== 8) return "Özel Jokerde toplam 8 olmalı.";
    // Cezalar oynama yönünde sırayla çekilir
    queue = [];
    let x = pid;
    for (let i = 0; i < seatIds(room).length; i++) {
      x = nextSeat(room, x, 1);
      if (want[x]) queue.push({ playerId: x, left: want[x] });
    }
  }

  // Kartı at
  const by = nameOf(room, pid);
  g.pendingDrawn = null;
  hand.splice(idx, 1);
  delete card.fresh;
  g.discard.push(card);
  g.chosenColor = card.color === "black" ? opts.chosenColor : card.color;
  g.plusStack = card.type === "draw2" ? g.plusStack : 0;
  if (card.type !== "draw2") g.stackKind = null;
  fx.events.push(["cardFly", { card: { color: card.color, type: card.type, value: card.value }, fromId: pid }]);
  room.moveSeq++;

  // YUDOBA demeden tek kart kaldıysa 2 ceza
  let unoMiss = false;
  if (hand.length === 1 && !g.saidUno[pid]) { drawCards(g, pid, 2, fx); unoMiss = true; }
  if (hand.length === 0) { endRound(room, pid); return null; }
  const missTxt = unoMiss ? " YUDOBA demediği için 2 ceza çekti." : "";
  const nxt = nextSeat(room, pid, 1);
  const map = {};
  const colTxt = card.color === "black" ? " Renk: " + R.COLOR_TR[g.chosenColor] + "." : "";

  switch (card.type) {
    case "draw2":
      g.plusStack = (g.stackKind === "draw2" ? g.plusStack : 0) + 2;
      g.stackKind = "draw2"; g.afterDrawTo = nxt; g.currentId = nxt;
      map[nxt] = "+2 yığını " + g.plusStack + ". +2 at ya da cezayı çek.";
      setNotice(g, by + " +2 attı. Yığın " + g.plusStack + "." + missTxt, map);
      break;
    case "wild4":
      g.plusStack = 4; g.stackKind = "wild4"; g.afterDrawTo = nxt; g.currentId = nxt;
      map[nxt] = "+4 yedin. Cezayı çek.";
      setNotice(g, by + " Joker +4 attı." + colTxt + missTxt, map);
      break;
    case "wdraw2":
      g.plusStack = 2; g.stackKind = "wdraw2"; g.afterDrawTo = nxt; g.currentId = nxt;
      map[nxt] = "Joker +2 yedin. Cezayı çek.";
      setNotice(g, by + " Joker +2 attı." + colTxt + missTxt, map);
      break;
    case "custom": {
      g.drawQueue = queue; g.stackKind = "custom"; g.afterDrawTo = nxt; g.currentId = queue[0].playerId;
      const parts = queue.map((q) => nameOf(room, q.playerId) + " " + q.left).join(", ");
      queue.forEach((q) => { map[q.playerId] = "Sana " + q.left + " kart ceza. Cezayı çek."; });
      setNotice(g, by + " Özel Joker attı: " + parts + "." + colTxt + missTxt, map);
      break;
    }
    case "wtarget2":
      g.drawQueue = [{ playerId: opts.targetId, left: 2 }]; g.stackKind = "wtarget2";
      g.afterDrawTo = nxt; g.currentId = opts.targetId;
      map[opts.targetId] = "Hedef +2 sana geldi. Cezayı çek.";
      setNotice(g, by + " Hedef +2: " + nameOf(room, opts.targetId) + "." + colTxt + missTxt, map);
      break;
    case "wskip2":
      g.currentId = nextSeat(room, pid, 3);
      setNotice(g, by + " Çift Atla attı, 2 oyuncu atlandı." + colTxt + missTxt, map);
      break;
    case "swap": {
      const t = opts.targetId;
      const tmp = g.hands[pid]; g.hands[pid] = g.hands[t] || []; g.hands[t] = tmp;
      g.saidUno[pid] = false; g.saidUno[t] = false;
      g.currentId = nxt;
      setNotice(g, by + " elini " + nameOf(room, t) + " ile değişti." + colTxt + missTxt, map);
      break;
    }
    case "shuffle": {
      const all = [];
      room.players.forEach((p) => (g.hands[p.id] || []).forEach((c) => { delete c.fresh; all.push(c); }));
      const mixed = R.shuffle(all);
      room.players.forEach((p) => {
        const n = (g.hands[p.id] || []).length;
        g.hands[p.id] = mixed.splice(0, n);
        g.saidUno[p.id] = false;
      });
      g.currentId = nxt;
      setNotice(g, by + " bütün elleri karıştırdı." + colTxt + missTxt, map);
      break;
    }
    case "skipall":
      g.currentId = pid;
      map[pid] = "Herkesi atladın. Tekrar oyna.";
      setNotice(g, by + " herkesi atladı, tekrar oynuyor." + colTxt + missTxt, map);
      break;
    case "skip":
      g.currentId = nextSeat(room, pid, 2);
      map[nxt] = "Atlandın.";
      setNotice(g, by + " Atla attı. " + nameOf(room, nxt) + " atlandı." + missTxt, map);
      break;
    case "reverse":
      if (room.players.length === 2) g.currentId = nextSeat(room, pid, 2);
      else { g.direction *= -1; g.currentId = nextSeat(room, pid, 1); }
      setNotice(g, by + " Ters attı. Yön: " + (g.direction === 1 ? "saat yönü" : "ters yön") + "." + missTxt, map);
      break;
    case "wild":
      g.currentId = nxt;
      setNotice(g, by + " Joker attı." + colTxt + missTxt, map);
      break;
    default:
      g.currentId = nxt;
      setNotice(g, by + " " + R.cardLabel(card) + " attı." + missTxt, map);
  }
  if (fx.reshuffled) noteReshuffle(g);
  return null;
}

function noteReshuffle(g) {
  g.notice = "Çekme destesi bitti, yere atılanlar karıştırılıp yeni deste oldu. " + (g.notice || "");
}

function finishPenalty(room, pid) {
  const g = room.game;
  g.plusStack = 0;
  g.stackKind = null;
  g.currentId = g.afterDrawTo || nextSeat(room, pid, 1);
  g.afterDrawTo = null;
  room.moveSeq++;
  const map = {};
  map[g.currentId] = "Ceza bitti. Sıra sende.";
  setNotice(g, nameOf(room, pid) + " cezayı çekti. Sıra " + nameOf(room, g.currentId) + " oyuncusunda.", map);
}

// Ceza varsa kalan cezanın tamamını çeker; yoksa 1 kart çeker.
function draw(room, pid, fx) {
  const g = room.game;
  if (!g || room.status !== "playing" || g.winnerId) return "Tur bitti.";
  if (g.drawQueue.length) {
    const q = g.drawQueue[0];
    if (q.playerId !== pid) return "Ceza sırası sende değil.";
    drawCards(g, pid, q.left, fx);
    g.drawQueue.shift();
    if (g.drawQueue.length) {
      g.currentId = g.drawQueue[0].playerId;
      room.moveSeq++;
      const m = {};
      m[g.currentId] = "Sana " + g.drawQueue[0].left + " kart ceza. Cezayı çek.";
      setNotice(g, nameOf(room, pid) + " cezayı çekti. Sıra " + nameOf(room, g.currentId) + " oyuncusunun cezasında.", m);
    } else finishPenalty(room, pid);
    if (fx.reshuffled) noteReshuffle(g);
    return null;
  }
  if (g.currentId !== pid) return "Sıra sende değil.";
  if (g.plusStack > 0) {
    drawCards(g, pid, g.plusStack, fx);
    finishPenalty(room, pid);
    if (fx.reshuffled) noteReshuffle(g);
    return null;
  }
  if (g.pendingDrawn && g.pendingDrawn.playerId === pid) return "Zaten 1 kart çektin. At ya da Pas.";
  const top = g.discard[g.discard.length - 1];
  const drawn = drawCards(g, pid, 1, fx)[0];
  g.pendingDrawn = { playerId: pid };
  const map = {};
  map[pid] = drawn && R.canPlay(drawn, top, g.chosenColor, null)
    ? "Çektiğin kartı atabilirsin ya da Pas."
    : "Uygun kartın yoksa Pas.";
  setNotice(g, nameOf(room, pid) + " kart çekti.", map);
  if (fx.reshuffled) noteReshuffle(g);
  return null;
}

function pass(room, pid) {
  const g = room.game;
  if (!g || room.status !== "playing" || g.winnerId) return "Tur bitti.";
  if (g.currentId !== pid || g.drawQueue.length) return "Sıra sende değil.";
  if (g.plusStack > 0) return "Önce cezayı çek.";
  if (!g.pendingDrawn || g.pendingDrawn.playerId !== pid) return "Pas için önce 1 kart çek.";
  g.pendingDrawn = null;
  g.currentId = nextSeat(room, pid, 1);
  room.moveSeq++;
  setNotice(g, nameOf(room, pid) + " pas geçti.");
  return null;
}

function sayUno(room, pid, fx) {
  const g = room.game;
  if (!g || room.status !== "playing") return "YUDOBA denilemez.";
  const hand = g.hands[pid] || [];
  if (hand.length !== 2) return "YUDOBA sadece 2 kart kalınca denir.";
  if (isPenalty(g) && actorOf(g) === pid) return "Ceza varken YUDOBA denilemez.";
  if (g.saidUno[pid]) return null;
  g.saidUno[pid] = true;
  fx.events.push(["unoShout", { playerId: pid, name: nameOf(room, pid) }]);
  return null;
}

module.exports = {
  nameOf, seatIds, nextSeat, actorOf, isPenalty, activeStack, totalOf,
  startRound, endRound, play, draw, pass, sayUno
};
