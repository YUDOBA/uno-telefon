makeDeck = function () {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color: color, type: "number", value: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color: color, type: "number", value: n });
      deck.push({ color: color, type: "number", value: n });
    }
    for (const type of ["skip", "reverse", "draw2"]) {
      deck.push({ color: color, type: type, value: type });
      deck.push({ color: color, type: type, value: type });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "black", type: "wild", value: "wild" });
    deck.push({ color: "black", type: "wild4", value: "wild4" });
    deck.push({ color: "black", type: "wdraw2", value: "wdraw2" });
    deck.push({ color: "black", type: "wtarget2", value: "wtarget2" });
    deck.push({ color: "black", type: "wskip2", value: "wskip2" });
    deck.push({ color: "black", type: "skipall", value: "skipall" });
  }
  for (let i = 0; i < 2; i++) {
    deck.push({ color: "black", type: "custom", value: "custom" });
    deck.push({ color: "black", type: "swap", value: "swap" });
    deck.push({ color: "black", type: "shuffle", value: "shuffle" });
  }
  return shuffle(deck);
};
