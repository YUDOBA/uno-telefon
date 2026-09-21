function ver(){ return "<p class='ver-tag'>V77</p>"; }
playSfx = function (k) {
  try {
    var map = { draw: "/sfx-draw.mp3", play: "/sfx-play.mp3", pass: "/sfx-pass.mp3", pen: "/sfx-pen.mp3", yd: "/sfx-yd.mp3" };
    var src = map[k]; if (!src) return;
    var a = new Audio(src + "?v=77&t=" + Date.now());
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
var _r77 = render;
render = function () {
  _r77();
  var nodes = document.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V77";
    }
  }
};
