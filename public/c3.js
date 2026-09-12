VERSION = "V31";
function ver(){ return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V31</p>"; }
var _cardHtml = cardHtml;
cardHtml = function (c, extra, idx) {
  extra = extra || "";
  var html = _cardHtml(c, extra, idx);
  if (extra.indexOf("nofresh") >= 0) html = html.replace(/<span class="fresh-dot"><\/span>/g, "");
  return html;
};
var _tableHtml = tableHtml;
tableHtml = function () {
  var g0 = (state && state.game) || {};
  if (g0.top) g0.top = Object.assign({}, g0.top, { fresh: false });
  if (typeof flying !== "undefined" && flying && flying.card) flying.card = Object.assign({}, flying.card, { fresh: false });
  return _tableHtml();
};
var _create = create;
create = function () {
  _create();
  var panel = app.querySelector(".panel");
  if (!panel || app.innerHTML.indexOf("tmode") >= 0) return;
  var box = document.createElement("div");
  box.innerHTML = "<label>Sure</label><select id=\"tmode\" onchange=\"document.getElementById('tsecwrap').style.display=this.value==='0'?'none':'block'\"><option value=\"0\" selected>Suresiz</option><option value=\"1\">Sureli</option></select><div id=\"tsecwrap\" style=\"display:none\"><label>Sira suresi (sn)</label><input id=\"tsec\" inputmode=\"numeric\" value=\"20\" /></div>";
  var btn = panel.querySelector(".btn-main");
  if (btn) panel.insertBefore(box, btn);
};
var _lobby = lobby;
lobby = function () {
  _lobby();
  if (!state || state.hostId !== me.playerId) return;
  if (app.innerHTML.indexOf("id=\"tmode\"") >= 0) return;
  var ts = state.turnSeconds || 0;
  var extra = "<label>Sure</label><select id=\"tmode\" onchange=\"setTurnSeconds()\"><option value=\"0\""+(ts?"":" selected")+">Suresiz</option><option value=\"1\""+(ts?" selected":"")+">Sureli</option></select>";
  if (ts) extra += "<label>Sira suresi (sn)</label><input id=\"tsec\" inputmode=\"numeric\" value=\""+ts+"\" onchange=\"setTurnSeconds()\" />";
  var sel = app.querySelector("#rounds");
  if (sel && sel.parentNode) {
    var hold = document.createElement("div");
    hold.innerHTML = extra;
    while (hold.firstChild) sel.parentNode.insertBefore(hold.firstChild, sel.nextSibling);
  }
};
function setTurnSeconds() {
  var mode = document.getElementById("tmode");
  var secEl = document.getElementById("tsec");
  var sec = 0;
  if (mode && mode.value !== "0") sec = Math.max(5, Math.min(180, parseInt(secEl && secEl.value, 10) || 20));
  socket.emit("setTurnSeconds", { turnSeconds: sec });
}
var _doCreate = doCreate;
doCreate = function () {
  var name = (document.getElementById("name") && document.getElementById("name").value.trim()) || "Kurucu";
  me.name = name;
  var mode = document.getElementById("tmode");
  var secEl = document.getElementById("tsec");
  var sec = 0;
  if (mode && mode.value !== "0") sec = Math.max(5, Math.min(180, parseInt(secEl && secEl.value, 10) || 20));
  socket.emit("create", { name: name, maxPlayers: document.getElementById("max").value, turnSeconds: sec });
};
var _pressUno = pressUno;
pressUno = function () {
  var g = state && state.game;
  var n = g && g.hand ? g.hand.length : 0;
  var penal = !!(g && (g.isPenalty || g.plusStack || (g.drawQueue && g.drawQueue.length)));
  if (penal || n !== 2 || !isActor()) { err = "Uno denilemez."; render(); return; }
  _pressUno();
};
var _scoreTable = scoreTable;
scoreTable = function () {
  var html = _scoreTable();
  return html;
};
var _winnerName = winnerName;
winnerName = function () {
  if (state && state.gameOver) {
    var best=null, bestS=1e9;
    (state.players||[]).forEach(function(p){
      var tot = p.totalScore != null ? p.totalScore : (p.score||0);
      if (tot < bestS) { bestS = tot; best = p; }
    });
    return best ? best.name : "Oyuncu";
  }
  return _winnerName();
};
var _game = game;
game = function () {
  keepAwake();
  _game();
  if (!state || !state.game || showScores || state.status === "winnerShow") return;
  var hud = app.querySelector(".hud");
  if (!hud || hud.querySelector(".hud-mid")) return;
  var g = state.game;
  var mid = document.createElement("div");
  mid.className = "hud-mid";
  if (g.turnSeconds) {
    var left = Math.max(0, Math.ceil(((g.turnEndsAt||0) - Date.now()) / 1000));
    mid.innerHTML = "<div class=\"turn-clock\" id=\"turn-clock\">"+left+"</div>";
  }
  var right = hud.querySelector(".hud-right");
  if (right) hud.insertBefore(mid, right);
  else hud.appendChild(mid);
  var st = app.querySelector(".panel h2");
};
var _wake = null;
function keepAwake() {
  try {
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request("screen").then(function (l) { _wake = l; }).catch(function () {});
    }
  } catch (e) {}
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(); });
var _actx = null, _lastTick = 0;
function audioCtx() {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === "suspended") _actx.resume();
  } catch (e) {}
  return _actx;
}
function tone(freq, dur, type, vol) {
  var ctx = audioCtx(); if (!ctx) return;
  var o = ctx.createOscillator(); var g = ctx.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.07, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}
function sfxPlay() { tone(520, 0.12, "triangle", 0.08); }
function sfxDraw() { tone(240, 0.1, "sine", 0.07); }
function sfxPenalty() { tone(180, 0.18, "sawtooth", 0.1); setTimeout(function(){ tone(140, 0.22, "sawtooth", 0.1); }, 140); }
function sfxTick() { tone(880, 0.06, "square", 0.06); setTimeout(function(){ tone(620, 0.06, "square", 0.05); }, 80); }
document.addEventListener("click", function () { try { audioCtx(); } catch (e) {} }, true);
var _cf = socket._callbacks && socket._callbacks["$cardFly"];
socket.on("cardFly", function (d) {
  if (!d || !d.card) return;
  var t = d.card.type;
  if (t === "draw2" || t === "wild4" || t === "custom" || t === "wdraw2" || t === "wtarget2") sfxPenalty();
  else sfxPlay();
});
socket.on("cardDraw", function () { sfxDraw(); });
setInterval(function () {
  if (!state || !state.game || screen !== "game") return;
  var g = state.game;
  if (!g.turnSeconds || !g.turnEndsAt) return;
  var left = Math.max(0, Math.ceil((g.turnEndsAt - Date.now()) / 1000));
  var el = document.getElementById("turn-clock");
  if (el) { el.textContent = String(left); el.className = "turn-clock" + (left <= 3 ? " warn" : ""); }
  if (left > 0 && left <= 3 && _lastTick !== left) { _lastTick = left; sfxTick(); }
  if (left <= 0 && isActor() && !g.winnerId) {
    if (_lastTick !== -1) { _lastTick = -1; socket.emit("turnTimeout"); }
  }
}, 250);
