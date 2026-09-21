function ver(){ return "<p class='ver-tag'>V71</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=[
    "html,body{overflow:hidden;overscroll-behavior:none;touch-action:manipulation}",
    "#app{overscroll-behavior:none}",
    "body.page-lock #app{overflow:hidden !important;height:100dvh}",
    "body.page-scroll #app{overflow:auto;-webkit-overflow-scrolling:touch}",
    "body.home-lock #app{display:flex;flex-direction:column;overflow:hidden !important;padding-bottom:4px}",
    "body.home-lock .yd-hero{margin:6px 0 4px;flex:0 0 auto}",
    "body.home-lock .yd-hero img{width:84px !important;height:84px !important;border-radius:20px !important}",
    "body.home-lock .yd-hero .logo,body.home-lock .yd-hero .sub{display:none}",
    "body.home-lock > #app > .btn-main{margin:6px 0 8px;flex:0 0 auto}",
    "body.home-lock .yd-sqgrid{display:grid !important;grid-template-columns:1fr 1fr !important;grid-template-rows:1fr 1fr !important;gap:8px !important;flex:1 1 auto;min-height:0;margin:0 !important;align-content:stretch !important}",
    "body.home-lock .yd-sq,body.home-lock .yd-sq.ic{aspect-ratio:auto !important;height:auto !important;min-height:0 !important;max-height:none !important;width:100% !important;overflow:hidden;flex:none !important;align-self:stretch !important}",
    "body.home-lock .yd-sq.ic svg{width:34px !important;height:34px !important;flex-shrink:0}",
    "body.home-lock .yd-sq.ic span{font-size:.78rem !important}",
    "body.home-lock .err{min-height:0;margin:4px 0 0}",
    "body.home-lock .ver-tag,body.game-lock .ver-tag{position:fixed;right:28px;bottom:calc(8px + env(safe-area-inset-bottom,0px))}",
    "body.game-lock #app{overflow:hidden !important}",
    "body.game-lock #game-root{overflow:hidden;max-height:100%;touch-action:manipulation}",
    "body.game-lock .hand{overflow-x:hidden}",
    ".yd-sq,.yd-sq.ic,.btn-tile,.btn-yd{transform:none !important}",
    ".btn-yd svg{width:86%;height:86%;max-width:56px;max-height:56px}"
  ].join("");
  document.head.appendChild(s);
})();

home = function () {
  var hash = "<svg viewBox='0 0 48 48'><text x='24' y='34' text-anchor='middle' font-size='32' font-weight='800' fill='#fff'>#</text></svg>";
  var how = "<svg viewBox='0 0 48 48'><path d='M14 18c0-6 9-10 14-4 3 4-1 7-4 9-1 1-2 2-2 4' stroke='#111' stroke-width='3' fill='none' stroke-linecap='round'/><circle cx='24' cy='38' r='2.4' fill='#111'/></svg>";
  var cards = "<svg viewBox='0 0 48 48'><rect x='8' y='12' width='18' height='26' rx='3' fill='#fff' transform='rotate(-18 17 25)'/><rect x='16' y='10' width='18' height='26' rx='3' fill='#e8ffe8'/><rect x='22' y='12' width='18' height='26' rx='3' fill='#fff' transform='rotate(16 31 25)'/></svg>";
  var book = "<svg viewBox='0 0 48 48'><path d='M8 10h14c4 0 6 2 6 2s2-2 6-2h14v28H28s-2 2-4 2-4-2-4-2H8z' fill='#fff'/><path d='M24 12v26' stroke='#1C6DD0' stroke-width='2'/></svg>";
  app.innerHTML =
    "<div class='yd-hero'><img src='/icon.svg' alt='YUDOBA' /></div>" +
    "<button class='btn btn-main' onclick='goCreate()'>Oyun kur</button>" +
    "<div class='yd-sqgrid'>" +
    "<button class='btn yd-sq ic ic-red' onclick='goJoin()'>" + hash + "<span>Kodla oyuna<br>katil</span></button>" +
    "<button class='btn yd-sq ic ic-yel' onclick='goHow()'>" + how + "<span>Nasil<br>kullanilir</span></button>" +
    "<button class='btn yd-sq ic ic-grn' onclick='goCards()'>" + cards + "<span>Ozel<br>kartlar</span></button>" +
    "<button class='btn yd-sq ic ic-blu' onclick='goRules()'>" + book + "<span>Kurallar</span></button>" +
    "</div><p class='err'>" + esc(err) + "</p>" + ver();
};

var _r71 = render;
render = function () {
  var lockHome = (screen === "home" || !screen);
  var lockGame = (screen === "game" && state && (state.status === "playing" || state.status === "paused"));
  document.body.classList.toggle("home-lock", lockHome);
  document.body.classList.toggle("game-lock", !!lockGame);
  document.body.classList.toggle("page-lock", lockHome || !!lockGame);
  document.body.classList.toggle("page-scroll", !(lockHome || lockGame));
  _r71();
  var tiles = app.querySelectorAll("button.btn-tile, button.btn-yd");
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i].classList.contains("yd-sq")) continue;
    var t = (tiles[i].textContent || "").replace(/\s+/g, " ").trim();
    if (t === "UNO!" || t === "YUDOBA") {
      if (!tiles[i].classList.contains("btn-yd")) {
        tiles[i].classList.add("btn-yd");
        tiles[i].innerHTML = (typeof YD_ICON === "string" ? YD_ICON : "YUDOBA");
        tiles[i].setAttribute("aria-label", "YUDOBA");
      }
    }
  }
  var tags = app.querySelectorAll("p.ver-tag, p.sub");
  var seen = false;
  for (var j = 0; j < tags.length; j++) {
    var tx = (tags[j].textContent || "").trim();
    if (/^YUDOBA\s*V\d+$/i.test(tx) || /^Uno Telefon V\d+$/i.test(tx) || /^V\d+$/.test(tx)) {
      if (seen) { tags[j].parentNode && tags[j].parentNode.removeChild(tags[j]); continue; }
      tags[j].className = "ver-tag";
      tags[j].textContent = "V71";
      seen = true;
    }
  }
  if (!seen && app) {
    var p = document.createElement("p");
    p.className = "ver-tag";
    p.textContent = "V71";
    app.appendChild(p);
  }
};
