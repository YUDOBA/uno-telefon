function ver(){ return "<p class='ver-tag'>V72</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=[
    ".ver-tag{position:fixed;right:28px;bottom:calc(10px + env(safe-area-inset-bottom,0px));margin:0;padding:0 6px;z-index:80;font-size:12px;font-weight:800;color:#9aa8bf;opacity:.9;pointer-events:none;white-space:nowrap}",
    "body.home-fit #app{overflow:hidden}",
    ".yd-sq,.yd-sq.ic,.btn-tile,.btn-yd,.btn{transform:none !important}",
    ".yd-sq:active,.yd-sq:focus,.yd-sq.ic:active,.yd-sq.ic:focus{transform:none !important;outline:0}",
    ".yd-sq svg,.yd-sq.ic svg{flex-shrink:0}"
  ].join("");
  document.head.appendChild(s);
})();
var _r72 = render;
render = function () {
  document.body.classList.toggle("home-fit", screen === "home" || !screen);
  document.body.classList.remove("home-lock", "game-lock", "page-lock", "page-scroll");
  _r72();
  var sq = app.querySelectorAll("button.yd-sq, button.yd-sq.ic");
  for (var i = 0; i < sq.length; i++) {
    sq[i].classList.remove("btn-yd");
  }
  var nodes = app.querySelectorAll("p.sub, p.ver-tag");
  var found = false;
  for (var j = 0; j < nodes.length; j++) {
    var t = (nodes[j].textContent || "").trim();
    if (/^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t) || /^V\d+$/.test(t)) {
      if (found) { if (nodes[j].parentNode) nodes[j].parentNode.removeChild(nodes[j]); continue; }
      nodes[j].className = "ver-tag";
      nodes[j].textContent = "V72";
      found = true;
    }
  }
  if (!found && app) {
    var p = document.createElement("p");
    p.className = "ver-tag";
    p.textContent = "V72";
    app.appendChild(p);
  }
};
