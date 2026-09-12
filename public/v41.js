function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V41</p>"; }
var lastTo = 0;
setInterval(function () {
  if (!state || !state.game || state.status !== "playing") return;
  var sec = 0;
  try { sec = parseInt(localStorage.getItem("uno_tsec") || "0", 10) || 0; } catch (e) {}
  if (state.turnSeconds) sec = state.turnSeconds;
  if (!sec || typeof clockLeft !== "function" || typeof actorId !== "function") return;
  var left = clockLeft();
  var act = actorId();
  if (left !== 0 || !act) return;
  if (Date.now() - lastTo < 900) return;
  lastTo = Date.now();
  if (typeof clk !== "undefined") {
    clk.actor = act;
    clk.ends = Date.now() + sec * 1000;
  }
  if (act === me.playerId) {
    if (!state.timeScores) state.timeScores = {};
    state.timeScores[act] = (state.timeScores[act] || 0) + 1;
    var p = (state.players || []).filter(function (x) { return x.id === act; })[0];
    if (p) p.timeScore = state.timeScores[act];
    socket.emit("turnTimeout", { sec: sec });
  }
  if (typeof paintClock === "function") paintClock();
}, 250);
