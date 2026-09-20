function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V62</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".yd-sq.ic{flex-direction:column;gap:8px;color:#fff;border:0}.yd-sq.ic svg{width:42px;height:42px;display:block}.yd-sq.ic span{font-size:.82rem;font-weight:800;line-height:1.15}.ic-red{background:#E31C23}.ic-yel{background:#F5C400;color:#111}.ic-grn{background:#2E9B3E}.ic-blu{background:#1C6DD0}";
  document.head.appendChild(s);
})();
home = function () {
  var hash = "<svg viewBox='0 0 48 48'><text x='24' y='34' text-anchor='middle' font-size='32' font-weight='800' fill='#fff'>#</text></svg>";
  var how = "<svg viewBox='0 0 48 48'><path d='M14 18c0-6 9-10 14-4 3 4-1 7-4 9-1 1-2 2-2 4' stroke='#111' stroke-width='3' fill='none' stroke-linecap='round'/><circle cx='24' cy='38' r='2.4' fill='#111'/></svg>";
  var cards = "<svg viewBox='0 0 48 48'><rect x='8' y='12' width='18' height='26' rx='3' fill='#fff' transform='rotate(-18 17 25)'/><rect x='16' y='10' width='18' height='26' rx='3' fill='#e8ffe8'/><rect x='22' y='12' width='18' height='26' rx='3' fill='#fff' transform='rotate(16 31 25)'/></svg>";
  var book = "<svg viewBox='0 0 48 48'><path d='M8 10h14c4 0 6 2 6 2s2-2 6-2h14v28H28s-2 2-4 2-4-2-4-2H8z' fill='#fff'/><path d='M24 12v26' stroke='#1C6DD0' stroke-width='2'/></svg>";
  app.innerHTML =
    "<div class='yd-hero'><img src='/icon.svg' alt='YUDOBA' /><div class='logo'>YUDOBA</div>" +
    "<p class='sub' style='text-align:center;margin:6px 0 0'>Telefonlardan kodla katil</p></div>" +
    "<button class='btn btn-main' onclick='goCreate()'>Oyun kur</button>" +
    "<div class='yd-sqgrid'>" +
    "<button class='btn yd-sq ic ic-red' onclick='goJoin()'>" + hash + "<span>Kodla oyuna<br>katil</span></button>" +
    "<button class='btn yd-sq ic ic-yel' onclick='goHow()'>" + how + "<span>Nasil<br>kullanilir</span></button>" +
    "<button class='btn yd-sq ic ic-grn' onclick='goCards()'>" + cards + "<span>Ozel<br>kartlar</span></button>" +
    "<button class='btn yd-sq ic ic-blu' onclick='goRules()'>" + book + "<span>Kurallar</span></button>" +
    "</div><p class='err'>" + esc(err) + "</p>" + ver();
};
