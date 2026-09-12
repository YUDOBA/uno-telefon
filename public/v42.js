function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V42</p>"; }
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
    if (t === "Oyuna devam" && /sure|Suresiz|Sureli/i.test((btns[i].getAttribute("onclick") || "") + (btns[i].parentNode && btns[i].parentNode.textContent || ""))) {
      /* leave */
    }
    if (t === "Oyunu baslat" && held && state.hostId === me.playerId) {
      btns[i].textContent = "Oyuna devam";
      btns[i].setAttribute("onclick", "socket.emit('resumeGame')");
    }
    if (t === "Oyuna devam" && !held) {
      btns[i].textContent = "Oyunu baslat";
      btns[i].setAttribute("onclick", "doStart()");
    }
    if (t === "Sureli" && /devam/i.test(t)) {}
  }
  if (box) {
    var wrong = box.querySelectorAll("button");
    for (var j = 0; j < wrong.length; j++) {
      if (/devam|baslat/i.test(wrong[j].textContent || "")) wrong[j].remove();
    }
  }
};
applySure = function (sec) {
  if (state && (state.game || state.holdGame || state.status === "playing")) return;
  sec = parseInt(sec, 10) || 0;
  if (sec && sec < 5) sec = 5;
  if (sec > 180) sec = 180;
  try { localStorage.setItem("uno_tsec", String(sec)); } catch (e) {}
  if (state && state.status === "lobby") socket.emit("setTurnSeconds", { turnSeconds: sec });
  lobby();
};
try { if (screen === "lobby") lobby(); } catch (e) {}
