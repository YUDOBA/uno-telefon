function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V39</p>"; }
function askClose(){
  if (confirm("Oyunu kapatmak istediginize emin misiniz?")) closeRoom();
}
function askLobby(){
  if (confirm("Lobiye donmek istediginize emin misiniz? Oyun durur.")) socket.emit("toLobby");
}
var _lobby39 = lobby;
lobby = function(){
  _lobby39();
  if (!state) return;
  var isHost = state.hostId === me.playerId;
  var kapat = document.getElementById("btn-kapat");
  if (kapat) {
    if (!isHost) kapat.remove();
    else kapat.setAttribute("onclick", "askClose()");
  }
  var start = app.querySelector(".btn-main");
  if (isHost && start && (state.game || state.holdGame)) {
    start.textContent = "Oyuna devam";
    start.setAttribute("onclick", "socket.emit('resumeGame')");
  }
};
var _score39 = scoreTable;
scoreTable = function(){
  var h = _score39();
  if (state && state.hostId === me.playerId && state.status === "playing") {
    h += "<button class='btn btn-ghost' onclick='askLobby()'>Lobiye don</button>";
  }
  return h;
};
try { if (screen==="lobby") lobby(); } catch(e) {}
