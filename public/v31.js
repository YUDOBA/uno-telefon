VERSION = "V31";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V31</p>"; }
var _cardHtml = cardHtml;
cardHtml = function (c, extra, idx) {
  if (c && (idx == null || (extra && String(extra).indexOf("fly") >= 0))) {
    c = { color: c.color, type: c.type, value: c.value, fresh: false };
  }
  return _cardHtml(c, extra, idx);
};
var _tryPlay = tryPlay;
tryPlay = function (i) {
  if (state && state.game && state.game.hand && state.game.hand[i]) state.game.hand[i].fresh = false;
  _tryPlay(i);
};
socket.on("cardFly", function (d) {
  if (d && d.card) d.card.fresh = false;
  if (flying && flying.card) flying.card.fresh = false;
});
var wake = null;
function holdScreen() {
  try {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    navigator.wakeLock.request("screen").then(function (s) {
      wake = s;
      s.addEventListener("release", function () { wake = null; });
    }).catch(function () {});
  } catch (e) {}
}
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) holdScreen();
});
document.addEventListener("touchstart", holdScreen, { once: true });
document.addEventListener("click", holdScreen, { once: true });
setInterval(function () {
  if (document.hidden) return;
  if (state && (state.status === "playing" || screen === "game")) holdScreen();
}, 20000);
try { render(); } catch (e) {}
