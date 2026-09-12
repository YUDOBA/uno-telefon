function winnerName() {
  var id = state.lastWinnerId;
  if (state.gameOver) {
    var best=null, bestS=1e9;
    (state.players||[]).forEach(function(p){ if((p.score||0)<bestS){bestS=p.score||0;best=p;} });
    return best ? best.name : "Oyuncu";
  }
  for (var i=0;i<(state.players||[]).length;i++) if (state.players[i].id===id) return state.players[i].name;
  return "Oyuncu";
}
function scoreTable() {
  var rows = (state.players || []).slice().sort(function (a, b) { return (a.score || 0) - (b.score || 0); });
  var ready = state.readyNext || {};
  var nReady = 0; (state.players||[]).forEach(function(p){ if(ready[p.id]) nReady++; });
  var h = "<div class=\"panel\"><h2>Skor</h2><p>Tur " + (state.roundNow || 1) + " / " + (state.roundsTotal || 1) + "</p>";
  rows.forEach(function (p, i) {
    var extra = state.lastRoundPts && state.lastRoundPts[p.id] != null ? " (tur +" + state.lastRoundPts[p.id] + ")" : "";
    var tick = ready[p.id] ? " hazir" : "";
    h += "<div class=\"row\"><span>" + (i + 1) + ". " + esc(p.name) + tick + "</span><span>" + (p.score || 0) + extra + "</span></div>";
  });
  if (state.status === "playing") h += "<button class=\"btn btn-ghost\" onclick=\"showScores=false;render()\">Oyuna don</button>";
  if (state.status === "winnerShow" && !state.gameOver) {
    if (!(state.readyNext||{})[me.playerId]) h += "<button class=\"btn btn-main\" onclick=\"socket.emit('readyNext')\">Sonraki tur</button><p class=\"sub\">Herkes basinca tur baslar ("+nReady+"/"+(state.players||[]).length+")</p>";
    else h += "<p class=\"sub\">Hazirsin. Digerleri bekleniyor ("+nReady+"/"+(state.players||[]).length+")</p>";
  }
  if (state.status === "winnerShow" && state.gameOver) {
    h += "<p><b>En dusuk puan kazanir: "+esc(winnerName())+"</b></p>";
    if (state.hostId === me.playerId) h += "<button class=\"btn btn-main\" onclick=\"socket.emit('again')\">Yeni oyun</button>";
  }
  return h + "</div>";
}
function tableHtml() {
  var seats = state.seats || state.players.map(function (p) { return p.id; });
  var selfI = seats.indexOf(me.playerId); if (selfI < 0) selfI = 0;
  var n = seats.length || 1, html = "<div class=\"table\">";
  var g0 = state.game || {};
  var clockwise = !g0.direction || g0.direction === 1;
  var colorName = COLOR_TR[g0.chosenColor] || "";
  html += "<div class=\"felt\">";
  html += clockwise ? "<div class=\"dir-arrow\">&#8635; Saat</div>" : "<div class=\"dir-arrow revd\">&#8634; Ters</div>";
  html += (g0.top ? cardHtml(g0.top, "") : "");
  html += "<div class=\"color-name col-" + (g0.chosenColor||"") + "\">" + (colorName || "Renk") + "</div>";
  html += "</div>";
  var penal = !!(g0.isPenalty || g0.plusStack || (g0.drawQueue && g0.drawQueue.length));
  for (var i = 0; i < n; i++) {
    var pid = seats[i], p = null;
    for (var k = 0; k < state.players.length; k++) if (state.players[k].id === pid) p = state.players[k];
    if (!p) continue;
    var a = Math.PI / 2 + ((i - selfI) / n) * 2 * Math.PI;
    var x = 50 + Math.cos(a) * 38, y = 50 + Math.sin(a) * 36;
    var on = holdTurnId ? (pid === holdTurnId) : p.isTurn;
    var cls = "seat";
    if (on && penal) cls += " seat-penal";
    else if (on) cls += " seat-turn";
    if (p.id === me.playerId) cls += " seat-me";
    html += "<div class=\"" + cls + "\" style=\"left:" + x + "%;top:" + y + "%\">";
    html += "<div class=\"seat-name\">" + esc(p.name) + (p.id === me.playerId ? " (sen)" : "") + "</div>";
    html += "<div class=\"seat-backs\">" + backs(p.cardCount) + "</div><div class=\"seat-count\">" + p.cardCount + " kart</div>";
    if (p.saidUno) html += "<div class=\"seat-uno\">UNO</div>";
    html += "</div>";
  }
  if (unoBurst && unoBurst.playerId) {
    var posu = seatXY(unoBurst.playerId);
    var nm = unoBurst.name || "Oyuncu";
    html += "<div class=\"unoburst\" style=\"--sx:" + posu.x + "%;--sy:" + posu.y + "%\"><div class=\"seat seat-turn\"><div class=\"seat-name\">" + esc(nm) + "</div><div class=\"seat-uno\">UNO</div></div></div>";
  }
  if (flying) {
    var pos = seatXY(flying.fromId);
    var kind = flying.kind === "draw" ? " fly-draw" : " fly-play";
    var inner = flying.kind === "draw" ? "<div class=\"back bigback\"></div>" : cardHtml(flying.card, "", null);
    html += "<div class=\"flywrap\"><div class=\"flycard" + kind + "\" style=\"--sx:" + pos.x + "%;--sy:" + pos.y + "%\">" + inner + "</div></div>";
  }
  return html + "</div>";
}
function game() {
  var g = state && state.game;
  if (state.status === "winnerShow") {
    var saw = (state.sawScores||{})[me.playerId];
    var top = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + state.roundNow + "/" + state.roundsTotal + "</span></div>";
    if (!saw) {
      app.innerHTML = top + "<div class=\"panel\"><h1>" + esc(winnerName()) + " kazandi</h1><p>" + (state.gameOver ? "Oyun bitti. En dusuk toplam puan kazanir." : ("Tur " + state.roundNow + " bitti.")) + "</p><button class=\"btn btn-main\" onclick=\"socket.emit('sawScores')\">Skor tabelasi</button></div>" + ver();
      return;
    }
    app.innerHTML = top + scoreTable() + ver();
    return;
  }
  if (showScores) {
    app.innerHTML = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + state.roundNow + "/" + state.roundsTotal + "</span></div>" + scoreTable() + ver();
    return;
  }
  if (!g) return lobby();
  if (pendingWild !== null || pendingCustom) return pickScreen();
  var myTurn = isActor() && !g.winnerId && !state.paused;
  var penal = !!(g.isPenalty || g.plusStack || (g.drawQueue && g.drawQueue.length));
  var canPass = !!(drawnChoice || g.canPass) && myTurn && !penal;
  var drawOn = myTurn && !state.paused && !g.drewOnce;
  if (penal) drawOn = myTurn && !state.paused;
  if (!penal && (g.canPass || g.drewOnce)) drawOn = false;
  var note = g.noticeYou || g.notice || g.lastAction || "";
  var html = "<div id=\"game-root\">";
  html += "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + (state.roundNow || 1) + "/" + (state.roundsTotal || 1) + "</span></div>";
  if (note) html += "<div class=\"panel warn one\">" + esc(note) + "</div>";
  if (state.paused) html += "<div class=\"panel warn one\">Siradaki oyuncu koptu, ayni ad ile donmeli.</div>";
  html += "<div class=\"hud\"><div class=\"hud-left\">";
  html += "<button class=\"btn btn-main btn-tile\" onclick=\"pressUno()\">UNO!</button>";
  html += "<button class=\"btn btn-ghost btn-tile\" " + (canPass ? "" : "disabled") + " onclick=\"passDrawn()\">Pas</button></div>";
  html += "<div class=\"hud-right\"><div class=\"draw-pile" + (drawOn ? "" : " off") + "\" onclick=\"tapDeck()\"><div class=\"back bigback\"></div>";
  if (drawOn) html += "<div class=\"draw-label\">Kart<br>cek</div>";
  html += "</div><div class=\"deck-left\">" + (g.deckCount != null ? g.deckCount : "0") + "</div></div></div>";
  html += "<button class=\"mini-btn\" onclick=\"showScores=true;render()\">Skor</button>";
  html += tableHtml();
  html += handHtml(g.hand || [], myTurn, g);
  html += "<p class=\"err\">" + esc(err) + "</p></div>" + ver();
  var root = document.getElementById("game-root");
  if (root) {
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    var neu = wrap.querySelector("#game-root");
    if (neu) { root.replaceWith(neu); return; }
  }
  app.innerHTML = html;
}
function tapDeck() {
  if (!state || !state.game) return;
  var g = state.game;
  var myTurn = isActor() && !g.winnerId && !state.paused;
  if (!myTurn) { err = "Sira sende degil."; render(); return; }
  if (g.drewOnce && !g.plusStack && !g.isPenalty) { err = "Zaten cektin. At veya Pas."; render(); return; }
  socket.emit("draw");
}
