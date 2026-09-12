VERSION = "V35";
function ver(){ return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V35</p>"; }
function readTurnSec() {
  var mode = document.getElementById("tmode");
  var secEl = document.getElementById("tsec");
  if (!mode || mode.value === "0") return 0;
  var n = parseInt(secEl && secEl.value, 10);
  if (!n || n < 5) n = 20;
  if (n > 180) n = 180;
  return n;
}
doCreate = function () {
  var name = (document.getElementById("name") && document.getElementById("name").value.trim()) || "Kurucu";
  me.name = name;
  socket.emit("create", {
    name: name,
    maxPlayers: (document.getElementById("max") || {}).value || 4,
    turnSeconds: readTurnSec()
  });
};
setTurnSeconds = function () {
  socket.emit("setTurnSeconds", { turnSeconds: readTurnSec() });
};
var _actx2 = null;
function audioCtx2() {
  try {
    if (!_actx2) _actx2 = new (window.AudioContext || window.webkitAudioContext)();
    if (_actx2.state === "suspended") _actx2.resume();
  } catch (e) {}
  return _actx2;
}
function beep2(freq, dur, type, vol) {
  var ctx = audioCtx2(); if (!ctx) return;
  try {
    var o = ctx.createOscillator(); var g = ctx.createGain();
    o.type = type || "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) {}
}
function sfxPlay() { beep2(560, 0.13, "triangle", 0.09); }
function sfxDraw() { beep2(220, 0.12, "sine", 0.08); }
function sfxPenalty() { beep2(160, 0.2, "sawtooth", 0.11); setTimeout(function(){ beep2(120, 0.25, "sawtooth", 0.11); }, 160); }
function sfxTick() { beep2(900, 0.05, "square", 0.07); setTimeout(function(){ beep2(640, 0.05, "square", 0.06); }, 70); }
document.addEventListener("touchstart", function () { audioCtx2(); }, true);
document.addEventListener("click", function () { audioCtx2(); }, true);
socket.on("cardFly", function (d) {
  var t = d && d.card && d.card.type;
  if (t === "draw2" || t === "wild4" || t === "custom" || t === "wdraw2" || t === "wtarget2") sfxPenalty();
  else sfxPlay();
});
socket.on("cardDraw", function () { sfxDraw(); });
var lastTickN = 0;
setInterval(function () {
  if (!state || !state.game || screen === "chat" || showScores) return;
  var g = state.game;
  var sec = g.turnSeconds || state.turnSeconds || 0;
  if (!sec) return;
  var left = g.turnEndsAt ? Math.max(0, Math.ceil((g.turnEndsAt - Date.now()) / 1000)) : sec;
  var el = document.getElementById("turn-clock");
  if (!el) {
    var mid = document.querySelector(".hud-mid") || document.querySelector(".hud");
    if (mid) {
      if (!document.querySelector(".hud-mid")) {
        var d = document.createElement("div"); d.className = "hud-mid";
        var hud = document.querySelector(".hud");
        var right = hud && hud.querySelector(".hud-right");
        if (hud && right) hud.insertBefore(d, right); else if (hud) hud.appendChild(d);
        mid = d;
      } else mid = document.querySelector(".hud-mid");
      mid.innerHTML = "<div class=\"turn-clock\" id=\"turn-clock\">"+left+"</div>";
      el = document.getElementById("turn-clock");
    }
  }
  if (el) { el.textContent = String(left); el.className = "turn-clock" + (left <= 3 ? " warn" : ""); }
  if (left > 0 && left <= 3 && lastTickN !== left) { lastTickN = left; sfxTick(); }
  if (left <= 0 && state.game.currentId === me.playerId && !g.winnerId) {
    if (lastTickN !== -1) { lastTickN = -1; socket.emit("turnTimeout"); }
  }
}, 250);
var _gameFix = game;
game = function () {
  if (showScores) {
    var who = "";
    (state.players || []).forEach(function (p) { if (state.game && p.id === state.game.currentId) who = p.name; });
    var mine = !!(state.game && state.game.currentId === me.playerId);
    var html = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + (state.roundNow||1) + "/" + (state.roundsTotal||1) + "</span></div>";
    html += "<div class=\"turn-lamp " + (mine ? "on" : "") + "\">" + (mine ? "Sira sende — oyuna don" : ("Sira: " + esc(who || "-"))) + "</div>";
    html += scoreTable();
    if (state.hostId === me.playerId) {
      if (window.confirmAbort) {
        html += "<div class=\"panel warn\"><p>Oyunu bitirmek istediginize emin misiniz?</p><button class=\"btn btn-main\" onclick=\"yesAbort()\">Evet</button><button class=\"btn btn-ghost\" onclick=\"noAbort()\">Hayir</button></div>";
      } else {
        html += "<button class=\"btn btn-ghost\" onclick=\"askAbort()\">Oyunu bitir</button>";
      }
    }
    html += "<button class=\"btn btn-ghost\" onclick=\"backPlay()\">Oyuna don</button>" + ver();
    app.innerHTML = html;
    return;
  }
  _gameFix();
  var g = state && state.game;
  var sec = g && (g.turnSeconds || state.turnSeconds);
  if (g && sec && !document.getElementById("turn-clock")) {
    var hud = document.querySelector(".hud");
    if (hud && !hud.querySelector(".hud-mid")) {
      var mid = document.createElement("div"); mid.className = "hud-mid";
      mid.innerHTML = "<div class=\"turn-clock\" id=\"turn-clock\">"+sec+"</div>";
      var right = hud.querySelector(".hud-right");
      if (right) hud.insertBefore(mid, right); else hud.appendChild(mid);
    }
  }
};
