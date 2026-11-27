"use strict";
// Botlar: boş koltukları doldurur, kopan oyuncunun yerine geçer.
// Hamlelerini insanlarla aynı motor fonksiyonlarıyla yapar.

const R = require("./rules");
const E = require("./engine");

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function stripBotTag(n) { return String(n || "").replace(/\s*\(Bot\)\s*$/i, ""); }

function humanCount(room) {
  return room.players.filter((p) => p.connected && !p.isBot).length;
}

function fillBots(room) {
  let n = 1;
  room.players.forEach((p) => {
    const m = /^Bot (\d+)$/.exec(p.name);
    if (m) n = Math.max(n, parseInt(m[1], 10) + 1);
  });
  while (room.players.length < room.maxPlayers) {
    const id = uid();
    room.players.push({ id, token: uid(), name: "Bot " + n, socketId: null, connected: true, isBot: true, bornBot: true });
    room.seats.push(id);
    n++;
  }
}

// Kopan insanın yerine bot geçer: "Ad (Bot)"
function takeOver(p) {
  if (p.bornBot) { p.isBot = true; return; }
  p.humanName = p.humanName || stripBotTag(p.name);
  p.name = p.humanName + " (Bot)";
  p.isBot = true;
  p.botTakeover = true;
  p.connected = false;
}

function restoreHuman(p, name) {
  p.isBot = false;
  p.botTakeover = false;
  p.bornBot = false;
  p.name = stripBotTag(name || p.humanName || p.name);
  p.humanName = p.name;
  p.connected = true;
}

function bestColor(hand) {
  const c = { red: 0, yellow: 0, green: 0, blue: 0 };
  hand.forEach((x) => { if (c[x.color] != null) c[x.color]++; });
  return R.COLORS.reduce((best, k) => (c[k] > c[best] ? k : best), "red");
}

function pickTarget(room, pid, preferFewest) {
  const others = room.players.filter((p) => p.id !== pid);
  const humans = others.filter((p) => !p.isBot);
  const pool = humans.length ? humans : others;
  if (preferFewest) {
    const g = room.game;
    return pool.slice().sort((a, b) => (g.hands[a.id] || []).length - (g.hands[b.id] || []).length)[0].id;
  }
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function splitEight(room, pid) {
  const others = room.players.filter((p) => p.id !== pid);
  const humans = others.filter((p) => !p.isBot);
  const targets = room.botLevel === "hard" && humans.length ? humans : others;
  const out = targets.map((p) => ({ playerId: p.id, n: 0 }));
  for (let i = 0; i < 8; i++) out[i % out.length].n++;
  return out.filter((a) => a.n > 0);
}

function pickCard(room, pid) {
  const g = room.game;
  const hand = g.hands[pid] || [];
  const top = g.discard[g.discard.length - 1];
  const stack = E.activeStack(g);
  const ok = [];
  hand.forEach((c, i) => { if (R.canPlay(c, top, g.chosenColor, stack)) ok.push({ c, i }); });
  if (!ok.length) return null;
  if ((room.botLevel || "mid") === "easy") return ok[0];
  ok.sort((a, b) => R.cardPoints(b.c) - R.cardPoints(a.c));
  return ok[0];
}

function playPick(room, pid, pick, fx) {
  const hand = room.game.hands[pid];
  const rest = hand.filter((_, i) => i !== pick.i);
  // Hediye: en yüksek puanlı kartı verir
  let giftIndex;
  if (pick.c.type === "gift" && rest.length) {
    let best = -1;
    hand.forEach((c, i) => { if (i !== pick.i && (best < 0 || R.cardPoints(c) > R.cardPoints(hand[best]))) best = i; });
    giftIndex = best;
  }
  return E.play(room, pid, {
    cardIndex: pick.i, giftIndex,
    chosenColor: bestColor(rest.length ? rest : hand),
    targetId: pickTarget(room, pid, (pick.c.type === "swap" || pick.c.type === "gift") && room.botLevel !== "easy"),
    assign: splitEight(room, pid)
  }, fx);
}

// Botun sırasıysa tek hamle yapar. Hamle yaptıysa true döner.
function botStep(room, fx) {
  if (room.status !== "playing" || !room.game || room.game.winnerId) return false;
  const g = room.game;
  const pid = E.actorOf(g);
  const p = room.players.find((x) => x.id === pid);
  if (!p || !p.isBot) return false;

  if (g.drawQueue.length) {
    const pick = room.botLevel !== "easy" ? pickCard(room, pid) : null;
    if (pick) playPick(room, pid, pick, fx);
    else E.draw(room, pid, fx);
    return true;
  }
  if (g.plusStack > 0) {
    const pick = room.botLevel !== "easy" ? pickCard(room, pid) : null;
    if (pick) playPick(room, pid, pick, fx);
    else E.draw(room, pid, fx);
    return true;
  }
  if ((g.hands[pid] || []).length === 2) g.saidUno[pid] = true;
  let pick = pickCard(room, pid);
  if (!pick && !(g.pendingDrawn && g.pendingDrawn.playerId === pid)) {
    E.draw(room, pid, fx);
    if ((g.hands[pid] || []).length === 2) g.saidUno[pid] = true;
    pick = pickCard(room, pid);
  }
  if (pick) playPick(room, pid, pick, fx);
  else E.pass(room, pid, fx);
  return true;
}

module.exports = { uid, stripBotTag, humanCount, fillBots, takeOver, restoreHuman, botStep };
