function ver(){ return "<p class='ver-tag'>V69</p>"; }
playSfx = function (k) {
  try {
    var map = { draw: "/sfx-draw.mp3", play: "/sfx-play.mp3", pass: "/sfx-pass.mp3", pen: "/sfx-pen.mp3", yd: "/sfx-yd.mp3" };
    var src = map[k]; if (!src) return;
    var a = new Audio(src + "?v=69");
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
var _pass69 = passDrawn;
passDrawn = function () { playSfx("pass"); if (_pass69) _pass69(); };
var _uno69 = pressUno;
pressUno = function () {
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n === 2) playSfx("yd");
  if (_uno69) _uno69();
};
