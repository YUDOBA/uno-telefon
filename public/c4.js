VERSION = "V33";
function ver(){ return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V33</p>"; }
var confirmAbort = false;
function turnWho() {
  if (!state) return "";
  var id = state.game && state.game.currentId;
  var p = (state.players || []).filter(function (x) { return x.id === id; })[0];
  return p ? p.name : "";
}
function myTurnNow() {
  return !!(state && state.game && state.game.currentId === me.playerId && !state.game.winnerId);
}
function goScores() { showScores = true; screen = "game"; render(); }
function goChat() { screen = "chat"; render(); }
function backPlay() { showScores = false; confirmAbort = false; screen = "game"; render(); }
function sendChat() {
  var el = document.getElementById("chat-in");
  var t = el ? el.value : "";
  if (!t || !t.trim()) return;
  socket.emit("chat", { text: t });
  if (el) el.value = "";
}
function askAbort() { confirmAbort = true; render(); }
function noAbort() { confirmAbort = false; render(); }
function yesAbort() {
  confirmAbort = false;
  showScores = false;
  socket.emit("abortGame");
}
function chatScreen() {
  var msgs = (state && state.chat) || [];
  var who = turnWho();
  var html = "<h1>Mesajlar</h1>";
  html += "<div class=\"turn-lamp " + (myTurnNow() ? "on" : "") + "\">" + (myTurnNow() ? "Sira sende" : ("Sira: " + esc(who || "-"))) + "</div>";
  html += "<div class=\"chat-box\" id=\"chat-box\">";
  msgs.forEach(function (m) {
    html += "<div class=\"chat-line\"><b>" + esc(m.name) + ":</b> " + esc(m.text) + "</div>";
  });
  if (!msgs.length) html += "<p class=\"sub\">Henuz mesaj yok.</p>";
  html += "</div>";
  html += "<input id=\"chat-in\" maxlength=\"160\" placeholder=\"Mesaj yaz\" onkeydown=\"if(event.key==='Enter')sendChat()\" />";
  html += "<button class=\"btn btn-main\" onclick=\"sendChat()\">Gonder</button>";
  html += "<button class=\"btn btn-ghost\" onclick=\"backPlay()\">Oyuna don</button>" + ver();
  app.innerHTML = html;
  var box = document.getElementById("chat-box");
  if (box) box.scrollTop = box.scrollHeight;
}
var _render = render;
render = function () {
  if (screen === "chat") return chatScreen();
  _render();
};
var _scoreTable2 = scoreTable;
scoreTable = function () {
  var h = _scoreTable2();
  var who = turnWho();
  var lamp = "<div class=\"turn-lamp " + (myTurnNow() ? "on" : "") + "\">" + (myTurnNow() ? "Sira sende — oyuna don" : ("Sira: " + esc(who || "-"))) + "</div>";
  if (state && state.hostId === me.playerId && state.status === "playing") {
    if (confirmAbort) {
      h += "<div class=\"panel warn\"><p>Oyunu bitirmek istediginize emin misiniz?</p><button class=\"btn btn-main\" onclick=\"yesAbort()\">Evet</button><button class=\"btn btn-ghost\" onclick=\"noAbort()\">Hayir</button></div>";
    } else {
      h += "<button class=\"btn btn-ghost\" onclick=\"askAbort()\">Oyunu bitir</button>";
    }
  }
  return lamp + h;
};
var _game2 = game;
game = function () {
  if (showScores) {
    keepAwake();
    var top = "<div class=\"row\" style=\"border:0\"><strong>Oda " + esc(state.code) + "</strong><span class=\"badge\">Tur " + (state.roundNow||1) + "/" + (state.roundsTotal||1) + "</span></div>";
    app.innerHTML = top + scoreTable() + "<button class=\"btn btn-ghost\" onclick=\"backPlay()\">Oyuna don</button>" + ver();
    return;
  }
  _game2();
  var hud = app.querySelector(".hud-left");
  if (!hud) return;
  var extra = document.getElementById("hud-under");
  if (extra) return;
  var wrap = document.createElement("div");
  wrap.id = "hud-under";
  wrap.className = "hud-under";
  wrap.innerHTML = "<button class=\"btn btn-ghost btn-tiny\" onclick=\"goScores()\">Skor</button><button class=\"btn btn-ghost btn-tiny\" onclick=\"goChat()\">Mesaj</button>";
  hud.parentNode.insertBefore(wrap, hud.nextSibling);
  var mini = app.querySelector(".mini-btn");
  if (mini && mini.textContent.indexOf("Skor") >= 0) mini.style.display = "none";
};
