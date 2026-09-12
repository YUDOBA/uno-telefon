VERSION = "V32";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V32</p>"; }
function isPenaltyTurn(){
  var g = state && state.game;
  if (!g) return false;
  return !!(g.isPenalty || g.plusStack || (g.drawQueue && g.drawQueue.length));
}
var _pressUno = pressUno;
pressUno = function () {
  if (isPenaltyTurn()) { err = "UNO denilemez."; render(); return; }
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n !== 2) { err = "UNO denilemez."; render(); return; }
  _pressUno();
};
try { render(); } catch (e) {}
