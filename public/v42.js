function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V42</p>"; }
lastTo = 1e15;
var _lobby42 = lobby;
lobby = function () {
  _lobby42();
  if (!state) return;
  var held = !!(state.game || state.holdGame);
  var box = document.getElementById("sure-box");
  if (box && held) {
    var sec = 0;
    try { sec = parseInt(localStorage.getItem("uno_tsec") || "0", 10) || 0; } catch (e) {}
    if (state.turnSeconds) sec = state.turnSeconds;
    box.innerHTML = "<p style='text-align:center;font-weight:800;margin:0'>Sira suresi kilitli: " + (sec ? ("Sureli " + sec + " sn") : "Suresiz") + "</p>";
  }
  var btns = app.querySelectorAll("button");
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].textContent || "").trim();
    if (t === "Oyunu baslat" && held && state.hostId === me.playerId) {
      btns[i].textContent = "Oyuna devam";
      btns[i].setAttribute("onclick", "socket.emit('resumeGame')");
    }
  }
};
applySure = function (sec) {
  if (state && (state.game || state.holdGame || state.status === "playing")) return;
  sec = parseInt(sec, 10) || 0;
  if (sec && sec < 5) sec = 5;
  if (sec > 180) sec = 180;
  try { localStorage.setItem("uno_tsec", String(sec)); } catch (e) {}
  if (state && state.status === "lobby" && !heldGame()) socket.emit("setTurnSeconds", { turnSeconds: sec });
  lobby();
};
function heldGame(){ return !!(state && (state.game || state.holdGame)); }
try { if (screen === "lobby") lobby(); } catch (e) {}
