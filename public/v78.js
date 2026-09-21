function ver(){ return "<p class='ver-tag'>V78</p>"; }
playSfx = function () {};
var _r78 = render;
render = function () {
  _r78();
  var nodes = document.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V78";
    }
  }
};
