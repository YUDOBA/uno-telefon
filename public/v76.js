function ver(){ return "<p class='ver-tag'>V76</p>"; }
(function(){
  var unlocked = false;
  function unlock(){
    if (unlocked) return;
    unlocked = true;
    try {
      ["draw","play","pass","pen","yd"].forEach(function(k){
        var a = new Audio("/sfx-"+k+".mp3?v=76");
        a.preload = "auto";
        a.volume = 0;
        var p = a.play();
        if (p && p.then) p.then(function(){ a.pause(); a.currentTime = 0; a.volume = 1; }).catch(function(){});
      });
    } catch(e) {}
  }
  document.addEventListener("touchstart", unlock, {capture:true, once:false});
  document.addEventListener("click", unlock, {capture:true, once:false});
})();
playSfx = function (k) {
  try {
    var map = { draw: "/sfx-draw.mp3", play: "/sfx-play.mp3", pass: "/sfx-pass.mp3", pen: "/sfx-pen.mp3", yd: "/sfx-yd.mp3" };
    var src = map[k]; if (!src) return;
    var a = new Audio(src + "?v=76");
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
function isPenCard(c){
  if (!c) return false;
  var t = c.type || "";
  return t === "draw2" || t === "wild4" || t === "wdraw2" || t === "wtarget2" || t === "custom" || t === "skip" || t === "reverse" || t === "wskip2" || t === "skipall";
}
var _tap76 = typeof tapDeck === "function" ? tapDeck : function(){};
tapDeck = function () { playSfx("draw"); return _tap76.apply(this, arguments); };
var _try76 = typeof tryPlay === "function" ? tryPlay : function(){};
tryPlay = function (i) {
  try {
    var c = state && state.game && state.game.hand ? state.game.hand[i] : null;
    playSfx(isPenCard(c) ? "pen" : "play");
  } catch (e) {}
  return _try76.apply(this, arguments);
};
var _pass76 = typeof passDrawn === "function" ? passDrawn : function(){};
passDrawn = function () { playSfx("pass"); return _pass76.apply(this, arguments); };
var _uno76 = typeof pressUno === "function" ? pressUno : function(){};
pressUno = function () {
  var n = state && state.game && state.game.hand ? state.game.hand.length : 0;
  if (n === 2) playSfx("yd");
  return _uno76.apply(this, arguments);
};
if (typeof socket !== "undefined" && socket && socket.on) {
  socket.on("cardFly", function (d) {
    try {
      if (d && d.kind === "draw") playSfx("draw");
      else if (d && isPenCard(d.card)) playSfx("pen");
      else playSfx("play");
    } catch (e) {}
  });
  socket.on("cardDraw", function () { try { playSfx("draw"); } catch (e) {} });
}
var _r76 = render;
render = function () {
  _r76();
  var nodes = app.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V76";
    }
  }
};
