function ver(){ return "<p class='ver-tag'>V73</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=[
    "html,body{overflow-x:hidden !important;max-width:100%;}",
    "#app{max-width:100%;overflow-x:hidden !important;box-sizing:border-box;}",
    "body.home-fit #app{overflow:hidden !important;}",
    ".yd-sqgrid{width:100% !important;max-width:100% !important;min-width:0 !important;display:grid !important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important;gap:8px !important;margin:12px 0 !important;flex:none !important;}",
    ".yd-sqgrid > *{min-width:0 !important;max-width:100% !important;}",
    ".yd-sq,.yd-sq.ic{width:100% !important;max-width:100% !important;margin:0 !important;padding:10px !important;box-sizing:border-box !important;aspect-ratio:1 / 1 !important;height:auto !important;overflow:hidden !important;transform:none !important;flex:none !important;align-self:stretch !important;}",
    ".yd-sq:active,.yd-sq:focus,.yd-sq.ic:active,.yd-sq.ic:focus{transform:none !important;outline:none !important;}",
    ".yd-sq.ic svg{width:52px !important;height:52px !important;max-width:40%;max-height:40%;flex-shrink:0;}",
    ".ver-tag{position:fixed;right:28px;bottom:calc(10px + env(safe-area-inset-bottom,0px));margin:0;padding:0 6px;z-index:80;font-size:12px;font-weight:800;color:#9aa8bf;pointer-events:none;white-space:nowrap}"
  ].join("");
  document.head.appendChild(s);
})();
var _r73 = render;
render = function () {
  document.body.classList.toggle("home-fit", screen === "home" || !screen);
  document.body.classList.remove("home-lock","game-lock","page-lock","page-scroll");
  _r73();
  var sq = app.querySelectorAll("button.yd-sq");
  for (var i = 0; i < sq.length; i++) sq[i].classList.remove("btn-yd");
  var nodes = app.querySelectorAll("p.sub, p.ver-tag");
  var found = false;
  for (var j = 0; j < nodes.length; j++) {
    var t = (nodes[j].textContent || "").trim();
    if (/^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t) || /^V\d+$/.test(t)) {
      if (found) { if (nodes[j].parentNode) nodes[j].parentNode.removeChild(nodes[j]); continue; }
      nodes[j].className = "ver-tag";
      nodes[j].textContent = "V73";
      found = true;
    }
  }
  if (!found && app) {
    var p = document.createElement("p");
    p.className = "ver-tag";
    p.textContent = "V73";
    app.appendChild(p);
  }
};
