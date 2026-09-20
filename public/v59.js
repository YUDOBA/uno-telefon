function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V59</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".yd-hero{display:flex;flex-direction:column;align-items:center;margin:8px 0 16px}.yd-hero img{width:112px;height:112px;border-radius:24px;box-shadow:0 8px 24px rgba(0,0,0,.35)}.yd-hero .logo{margin:10px 0 0;font-size:1.6rem}.yd-sqgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.yd-sq{aspect-ratio:1;min-height:0;height:auto;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px;border-radius:16px;font-weight:800;line-height:1.15;white-space:normal}";
  document.head.appendChild(s);
})();
var _home59 = home;
home = function () {
  app.innerHTML =
    "<div class='yd-hero'><img src='/icon.svg' alt='YUDOBA' /><div class='logo'>YUDOBA</div>" +
    "<p class='sub' style='text-align:center;margin:6px 0 0'>Telefonlardan kodla katil</p></div>" +
    "<button class='btn btn-main' onclick='goCreate()'>Oyun kur</button>" +
    "<div class='yd-sqgrid'>" +
    "<button class='btn btn-ghost yd-sq' onclick='goJoin()'>Koda<br>katil</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goCards()'>Ozel<br>kartlar</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goCounts()'>Kart<br>sayilari</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goRules()'>Kurallar</button>" +
    "</div><p class='err'>" + esc(err) + "</p>" + ver();
};
