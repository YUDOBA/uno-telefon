function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V36</p>"; }
function sureOzet(){
  var sec = 0;
  if (state && state.turnSeconds) sec = state.turnSeconds;
  else { try { sec = parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){} }
  if (sec) return "Sira suresi: Sureli — " + sec + " saniye";
  return "Sira suresi: Suresiz";
}
var _lobby36 = lobby;
lobby = function () {
  _lobby36();
  if (!state || document.getElementById("sure-ozet")) return;
  var html = "<div id='sure-ozet' class='panel' style='border:2px solid #ffd000'><b>" + sureOzet() + "</b></div>";
  var startBtn = app.querySelector(".btn-main");
  if (startBtn) startBtn.insertAdjacentHTML("beforebegin", html);
  else app.insertAdjacentHTML("beforeend", html);
};
try { if (screen === "lobby") lobby(); } catch (e) {}
