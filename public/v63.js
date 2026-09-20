function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V63</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent="#yd-back{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;width:56px;height:56px;z-index:200;background:#F5C400;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.25)}#yd-back svg{width:26px;height:26px}.yd-hero .logo{display:none}";
  document.head.appendChild(s);
})();
function ydBackTarget(){
  if(screen==="counts") return function(){ goCards(); };
  if(screen==="cards") return function(){ backFromCards(); };
  return function(){ goHome(); };
}
function ydMountBack(){
  var old=document.getElementById("yd-back");
  if(old) old.parentNode.removeChild(old);
  var pages={create:1,join:1,how:1,rules:1,cards:1,counts:1};
  if(!pages[screen]) return;
  if(state && (state.status==="playing"||state.status==="winnerShow") && screen==="cards") return;
  var b=document.createElement("button");
  b.id="yd-back";
  b.setAttribute("aria-label","Geri");
  b.innerHTML="<svg viewBox='0 0 48 48'><path d='M30 8 L14 24 L30 40' fill='none' stroke='#111' stroke-width='6' stroke-linecap='square' stroke-linejoin='miter'/></svg>";
  b.onclick=ydBackTarget();
  document.body.appendChild(b);
  var kill=/^(geri|ana ekran|ozel kartlara don|oyuna don|oyun[aı] don)$/i;
  var btns=app.querySelectorAll("button");
  for(var i=0;i<btns.length;i++){
    var t=(btns[i].textContent||"").replace(/\s+/g," ").trim();
    if(kill.test(t)) btns[i].style.display="none";
  }
}
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
var _r63 = render;
render = function () {
  var old=document.getElementById("yd-back");
  if(old) old.parentNode.removeChild(old);
  _r63();
  try { ydMountBack(); } catch (e) {}
};
