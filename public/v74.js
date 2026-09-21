function ver(){ return "<p class='ver-tag'>V74</p>"; }
(function(){
  var unlocked = false;
  function unlock(){
    if (unlocked) return;
    unlocked = true;
    try {
      ["draw","play","pass","pen","yd"].forEach(function(k){
        var a = new Audio("/sfx-"+k+".mp3?v=74");
        a.preload = "auto";
        a.volume = 0;
        var p = a.play();
        if (p && p.then) p.then(function(){ a.pause(); a.currentTime = 0; a.volume = 1; }).catch(function(){});
      });
    } catch(e) {}
  }
  document.addEventListener("touchstart", unlock, true);
  document.addEventListener("click", unlock, true);
})();
playSfx = function (k) {
  try {
    var map = { draw: "/sfx-draw.mp3", play: "/sfx-play.mp3", pass: "/sfx-pass.mp3", pen: "/sfx-pen.mp3", yd: "/sfx-yd.mp3" };
    var src = map[k]; if (!src) return;
    var a = new Audio(src + "?v=74");
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
var _pass74 = passDrawn;
passDrawn = function () { playSfx("pass"); if (_pass74) _pass74(); };
var _uno74 = pressUno;
pressUno = function () {
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n === 2) playSfx("yd");
  if (_uno74) _uno74();
};
var _r74 = render;
render = function () {
  _r74();
  var nodes = app.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V74";
    }
  }
};
