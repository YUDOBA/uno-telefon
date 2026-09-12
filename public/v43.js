function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V43</p>"; }
var firedZero = false;
clockLeft = function () {
  var sec = 0;
  try { sec = parseInt(localStorage.getItem("uno_tsec") || "0", 10) || 0; } catch (e) {}
  if (state && state.turnSeconds) sec = state.turnSeconds;
  if (!sec || !state || !state.game || typeof actorId !== "function") return -1;
  var act = actorId();
  if (typeof clk === "undefined") window.clk = { actor: null, ends: 0 };
  if (clk.actor !== act) {
    clk.actor = act;
    clk.ends = Date.now() + sec * 1000;
    firedZero = false;
  }
  var left = Math.ceil((clk.ends - Date.now()) / 1000);
  if (left <= 0) {
    clk.ends = Date.now() + sec * 1000;
    left = sec;
    if (!firedZero && act === me.playerId) {
      firedZero = true;
      socket.emit("turnTimeout", { sec: sec });
      setTimeout(function () { firedZero = false; }, Math.max(1500, sec * 400));
    }
  }
  return left;
};
