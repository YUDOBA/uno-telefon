function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V58</p>"; }
doStart = function () {
  var rounds = 3;
  try { var el = document.getElementById("rounds"); if (el) rounds = parseInt(el.value, 10) || 3; } catch (e) {}
  var lv = "mid";
  try { var b = document.getElementById("botlv"); if (b) lv = b.value || "mid"; } catch (e) {}
  socket.emit("start", { rounds: rounds, botLevel: lv });
};
var _lobby58 = lobby;
lobby = function () {
  _lobby58();
  if (!state || !me) return;
  if (state.hostId !== me.playerId) return;
  var startBtn = null;
  var buttons = document.querySelectorAll("button");
  for (var i = 0; i < buttons.length; i++) {
    if (/Oyunu baslat|Oyuna devam/i.test(buttons[i].textContent || "")) startBtn = buttons[i];
  }
  if (startBtn && state.players && state.players.length >= 1) startBtn.disabled = false;
  if (startBtn && !document.getElementById("botlv")) {
    var wrap = document.createElement("div");
    wrap.className = "panel";
    wrap.innerHTML = "<label>Bot zorluk</label><select id='botlv'><option value='easy'>Kolay</option><option value='mid' selected>Orta</option><option value='hard'>Zor</option></select><p class='sub'>Bos koltuklar Bot 1, Bot 2 olur.</p>";
    startBtn.parentNode.insertBefore(wrap, startBtn);
  }
};
