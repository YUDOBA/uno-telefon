function ver(){ return "<p class='ver-tag'>V81</p>"; }
var _r81 = render;
render = function () {
  _r81();
  var nodes = document.querySelectorAll("p.ver-tag, p.sub");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V81";
    }
  }
};
