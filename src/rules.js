"use strict";
// Dapai kart kuralları: deste, oynanabilirlik, etiket ve puan.

const COLORS = ["red", "yellow", "green", "blue"];
// İç anahtarlar eski kalır; Dapai renkleri: Turuncu, Pembe, Turkuaz, Mor
const COLOR_TR = { red: "Turuncu", yellow: "Pembe", green: "Turkuaz", blue: "Mor" };

// Siyah kartlar ve destedeki adetleri
const BLACK_COUNTS = {
  wild: 3,      // Joker
  wild4: 3,     // Joker +4
  wdraw2: 2,    // Joker +2
  wtarget2: 2,  // Hedef +2
  wskip2: 2,    // Çift Atla
  skipall: 2,   // Herkesi Atla
  custom: 2,    // Özel Joker 8
  swap: 1,      // El Değiş
  shuffle: 1,   // El Karıştır
  mirror: 2,    // Ayna
  bomb: 2       // Bomba
};
// Her renkten birer tane olan Dapai kartları
const COLOR_SPECIALS = ["shield", "eye", "gift"]; // Kalkan, Göz, Hediye

// Tur sonunda elde kalan kartın puanı (az puan iyidir)
const NUMBER_POINTS = 5;
const CARD_POINTS = {
  skip: 10, reverse: 10, draw2: 10,
  wild: 20, wild4: 20, wdraw2: 10, wtarget2: 10, wskip2: 10,
  skipall: 30, custom: 30, swap: 20, shuffle: 20,
  shield: 20, mirror: 20, eye: 10, bomb: 20, gift: 10
};
// Turu bitiren oyuncunun puanından düşülen miktar
const WIN_BONUS = 20;

// Renk seçimi gereken kartlar (tüm siyahlar)
const NEEDS_COLOR = new Set(Object.keys(BLACK_COUNTS));
// Hedef oyuncu seçimi gereken kartlar
const NEEDS_TARGET = new Set(["wtarget2", "swap", "eye", "gift"]);
// Ceza gelince atılabilen savunma kartları
const DEFENSE = new Set(["shield", "mirror"]);
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
    for (const type of COLOR_SPECIALS) deck.push({ color, type, value: type });
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
    case "shield": return col + " Kalkan";
    case "eye": return col + " Göz";
    case "gift": return col + " Hediye";
    case "mirror": return "Ayna";
    case "bomb": return "Bomba";
    default: return "?";
  }
}

function cardPoints(c) {
  if (c.type === "number") return NUMBER_POINTS;
  return CARD_POINTS[c.type] != null ? CARD_POINTS[c.type] : 10;
}

// stackKind: aktif ceza yığını (yoksa null)
function canPlay(card, top, chosenColor, stackKind) {
  if (!card) return false;
  if (!top) return true;
  // Ceza varken: Kalkan ve Ayna her zaman, +2 yığınında ayrıca +2 atılır
  if (stackKind) return DEFENSE.has(card.type) || (stackKind === "draw2" && card.type === "draw2");
  if (card.type === "wild4") return ["number", "wild", "wild4", "custom", "mirror", "bomb"].includes(top.type);
  if (card.color === "black") return true;
  const color = top.color === "black" ? chosenColor : top.color;
  if (card.color === color) return true;
  if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
  if (card.type !== "number" && card.type === top.type) return true;
  return false;
}

module.exports = {
  COLORS, COLOR_TR, BLACK_COUNTS, COLOR_SPECIALS, DEFENSE, CARD_POINTS, NUMBER_POINTS, WIN_BONUS, NEEDS_COLOR, NEEDS_TARGET,
  shuffle, makeDeck, cardLabel, cardPoints, canPlay
};
