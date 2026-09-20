function ver(){ return "<p class='ver-tag'>V66</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".btn-yd{padding:4px !important;display:flex;align-items:center;justify-content:center}.btn-yd svg{width:86%;height:86%;display:block}";
  document.head.appendChild(s);
})();
var YD_ICON = "<svg viewBox='0 0 64 64'><rect width='32' height='32' fill='#E31C23'/><rect x='32' width='32' height='32' fill='#F5C400'/><rect y='32' width='32' height='32' fill='#2E9B3E'/><rect x='32' y='32' width='32' height='32' fill='#1C6DD0'/><rect x='10' y='10' width='44' height='44' rx='8' fill='#fff'/><text x='32' y='30' text-anchor='middle' font-size='11' font-weight='900' fill='#111'>YUDO</text><text x='32' y='46' text-anchor='middle' font-size='14' font-weight='900' fill='#111'>BA</text></svg>";
var _r66 = render;
render = function () {
  _r66();
  var tiles = app.querySelectorAll("button");
  for (var i = 0; i < tiles.length; i++) {
    var t = (tiles[i].textContent || "").replace(/\s+/g," ").trim();
    if (t === "UNO!" || t === "YUDOBA" || (tiles[i].className && tiles[i].className.indexOf("btn-tile") >= 0 && /UNO|YUDOBA/i.test(t))) {
      if (!tiles[i].classList.contains("btn-yd")) {
        tiles[i].classList.add("btn-yd");
        tiles[i].innerHTML = YD_ICON;
        tiles[i].setAttribute("aria-label","YUDOBA");
      }
    }
  }
};
