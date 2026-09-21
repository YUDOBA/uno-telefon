function ver(){ return "<p class='ver-tag'>V75</p>"; }
(function(){
  var unlocked = false;
  function unlock(){
    if (unlocked) return;
    unlocked = true;
    try {
      ["draw","play","pass","pen","yd"].forEach(function(k){
        var a = new Audio("/sfx-"+k+".mp3?v=75");
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
    var a = new Audio(src + "?v=75");
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
(function wrapActs(){
  function wrap(name, key){
    try {
      var orig = eval(name);
      if (typeof orig !== "function") return;
      eval(name + " = function(){ try { playSfx('"+key+"'); } catch(e){} return orig.apply(this, arguments); };");
    } catch(e) {}
  }
  wrap("passDrawn", "pass");
  wrap("drawCard", "draw");
  wrap("drawFromPile", "draw");
  wrap("takeFromDeck", "draw");
  wrap("playCard", "play");
  wrap("tryPlay", "play");
})();
var _uno75 = typeof pressUno === "function" ? pressUno : function(){};
pressUno = function () {
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n === 2) playSfx("yd");
  if (_uno75) _uno75();
};
var _r75 = render;
render = function () {
  _r75();
  var nodes = app.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V75";
    }
  }
};
