function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V35</p>"; }
paintClock = function(){
  var el=document.getElementById("turn-clock");
  if(!el) return;
  el.style.display="block";
  var playing=state && state.status==="playing" && state.game;
  var sec=0;
  try { sec=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if(state && state.turnSeconds) sec=state.turnSeconds;
  if(state && state.game && state.game.turnSeconds) sec=state.game.turnSeconds;
  if(!playing){ el.textContent="-"; return; }
  if(!sec){ el.textContent="Suresiz"; return; }
  var g=state.game;
  if(!g.turnEndsAt) g.turnEndsAt=Date.now()+sec*1000;
  var left=Math.max(0, Math.ceil((g.turnEndsAt-Date.now())/1000));
  el.textContent=String(left);
};
try { if (typeof paintClock==="function") paintClock(); } catch(e) {}
