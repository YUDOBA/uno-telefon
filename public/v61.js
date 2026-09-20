function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V61</p>"; }
home = function () {
  app.innerHTML =
    "<div class='yd-hero'><img src='/icon.svg' alt='YUDOBA' /><div class='logo'>YUDOBA</div>" +
    "<p class='sub' style='text-align:center;margin:6px 0 0'>Telefonlardan kodla katil</p></div>" +
    "<button class='btn btn-main' onclick='goCreate()'>Oyun kur</button>" +
    "<div class='yd-sqgrid'>" +
    "<button class='btn btn-ghost yd-sq' onclick='goJoin()'>Kodla oyuna<br>katil</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goHow()'>Nasil<br>kullanilir</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goCards()'>Ozel<br>kartlar</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goRules()'>Kurallar</button>" +
    "</div><p class='err'>" + esc(err) + "</p>" + ver();
};
