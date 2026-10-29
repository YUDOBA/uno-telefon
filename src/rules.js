"use strict";
// YUDOBA kart kuralları: deste, oynanabilirlik, etiket ve puan.

const COLORS = ["red", "yellow", "green", "blue"];
const COLOR_TR = { red: "Kırmızı", yellow: "Sarı", green: "Yeşil", blue: "Mavi" };

// Siyah kartlar ve destedeki adetleri
const BLACK_COUNTS = {
  wild: 4,      // Joker
  wild4: 4,     // Joker +4
  wdraw2: 4,    // Joker +2
  wtarget2: 4,  // Hedef +2
  wskip2: 4,    // Çift Atla
  skipall: 4,   // Herkesi Atla
  custom: 2,    // Özel Joker 8
  swap: 2,      // El Değiş
  shuffle: 2    // El Karıştır
};

// Renk seçimi gereken kartlar (tüm siyahlar)
const NEEDS_COLOR = new Set(Object.keys(BLACK_COUNTS));
// Hedef oyuncu seçimi gereken kartlar
const NEEDS_TARGET = new Set(["wtarget2", "swap"]);
// Bu yığınlar varken hiçbir kart atılamaz, ceza çekilir
const HARD_STACKS = new Set(["wild4", "custom", "wdraw2", "wtarget2"]);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, type: "number", value: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color, type: "number", value: n });
      deck.push({ color, type: "number", value: n });
    }
    for (const type of ["skip", "reverse", "draw2"]) {
      deck.push({ color, type, value: type });
      deck.push({ color, type, value: type });
    }
  }
  for (const type of Object.keys(BLACK_COUNTS)) {
    for (let i = 0; i < BLACK_COUNTS[type]; i++) deck.push({ color: "black", type, value: type });
  }
  return shuffle(deck);
}

function cardLabel(c) {
  const col = COLOR_TR[c.color] || "";
  switch (c.type) {
    case "number": return col + " " + c.value;
    case "skip": return col + " Atla";
    case "reverse": return col + " Ters";
    case "draw2": return col + " +2";
    case "wild": return "Joker";
    case "wild4": return "Joker +4";
    case "custom": return "Özel Joker 8";
    case "wdraw2": return "Joker +2";
    case "wtarget2": return "Hedef +2";
    case "wskip2": return "Çift Atla";
    case "swap": return "El Değiş";
    case "shuffle": return "El Karıştır";
    case "skipall": return "Herkesi Atla";
    default: return "?";
  }
}

function cardPoints(c) {
  return c.type === "number" ? Number(c.value) || 0 : 10;
}

// stackKind: aktif ceza yığını (yoksa null)
function canPlay(card, top, chosenColor, stackKind) {
  if (!card) return false;
  if (!top) return true;
  if (stackKind === "draw2") return card.type === "draw2";
  if (stackKind && HARD_STACKS.has(stackKind)) return false;
  if (card.type === "wild4") return ["number", "wild", "wild4", "custom"].includes(top.type);
  if (card.color === "black") return true;
  const color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type) return true;
  return false;
}

module.exports = {
  COLORS, COLOR_TR, BLACK_COUNTS, NEEDS_COLOR, NEEDS_TARGET,
  shuffle, makeDeck, cardLabel, cardPoints, canPlay
};
