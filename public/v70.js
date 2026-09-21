function ver(){ return "<p class='ver-tag'>V70</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".ver-tag{position:fixed;right:28px;bottom:calc(10px + env(safe-area-inset-bottom,0px));left:auto;margin:0;padding:0 6px;z-index:80;text-align:right;font-size:12px;font-weight:800;letter-spacing:0;line-height:1.2;color:#9aa8bf;opacity:.9;pointer-events:none;white-space:nowrap}";
  document.head.appendChild(s);
})();
var _r70 = render;
render = function () {
  _r70();
  var nodes = app.querySelectorAll("p.sub, p.ver-tag");
  var found = false;
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || "").trim();
    if (/^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t) || /^V\d+$/.test(t)) {
      nodes[i].className = "ver-tag";
      nodes[i].textContent = "V70";
      found = true;
    }
  }
  if (!found && app) {
    var p = document.createElement("p");
    p.className = "ver-tag";
    p.textContent = "V70";
    app.appendChild(p);
  }
};
