function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V53</p>"; }
var hideHand = false, swipeY0 = 0, swipeX0 = 0, swipeOn = false;
(function(){
  var s=document.createElement("style");
  s.textContent=".hand{transition:transform .28s ease,opacity .28s ease}.hand.stowed{transform:translateY(130px);opacity:.18}.hand-slot{min-height:28px}";
  document.head.appendChild(s);
})();
function bindHandSwipe(){
  var h=document.querySelector(".hand");
  if(!h) return;
  h.classList.toggle("stowed", hideHand);
  if(h._sw) return;
  h._sw=true;
  h.addEventListener("touchstart", function(e){
    if(!e.touches||!e.touches[0]) return;
    swipeOn=true; swipeY0=e.touches[0].clientY; swipeX0=e.touches[0].clientX;
  }, {passive:true});
  h.addEventListener("touchend", function(e){
    if(!swipeOn) return; swipeOn=false;
    var t=e.changedTouches&&e.changedTouches[0]; if(!t) return;
    var dy=t.clientY-swipeY0, dx=t.clientX-swipeX0;
    if(Math.abs(dy)<50 || Math.abs(dy)<Math.abs(dx)+10) return;
    if(dy>0) hideHand=true; else hideHand=false;
    var hh=document.querySelector(".hand"); if(hh) hh.classList.toggle("stowed", hideHand);
  }, {passive:true});
}
var _render53=render;
render=function(){
  _render53();
  bindHandSwipe();
};
