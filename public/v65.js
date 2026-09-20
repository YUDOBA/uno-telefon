function ver(){ return "<p class='ver-tag'>V65</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".ver-tag{position:fixed;right:10px;bottom:calc(8px + env(safe-area-inset-bottom,0px));margin:0;z-index:60;text-align:right;font-size:12px;opacity:.75;pointer-events:none}";
  document.head.appendChild(s);
})();
var _r65 = render;
render = function () {
  _r65();
  var nodes = app.querySelectorAll("p.sub, p.ver-tag");
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t) || /^V\d+$/.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V65";
    }
  }
};
