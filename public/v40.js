function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V40</p>"; }
var clk = { actor: null, ends: 0 };
function secNow(){
  var a=0,b=0,c=0;
  try { a=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if(state && state.turnSeconds) b=state.turnSeconds;
  if(state && state.game && state.game.turnSeconds) c=state.game.turnSeconds;
  return Math.max(a,b,c);
}
function actorId(){
  var g=state && state.game;
  if(!g) return null;
  if(g.drawQueue && g.drawQueue.length) return g.drawQueue[0].playerId;
  return g.currentId;
}
function clockLeft(){
  var sec=secNow();
  if(!sec || !state || !state.game) return -1;
  var act=actorId();
  if(clk.actor !== act){
    clk.actor = act;
    clk.ends = Date.now() + sec*1000;
  }
  return Math.max(0, Math.ceil((clk.ends-Date.now())/1000));
}
paintClock = function(){
  var sec=secNow();
  var playing=state && (state.status==="playing" || pendingWild!=null || pendingCustom) && state.game;
  var el=document.getElementById("hud-clock");
  if(!playing || !sec){ if(el) el.remove(); return; }
  var left=clockLeft();
  var host=document.querySelector(".hud-left") || document.querySelector(".panel") || document.querySelector("#app");
  if(!el){
    el=document.createElement("div");
    el.id="hud-clock";
    el.style.cssText="min-width:48px;height:40px;margin:6px 0 0 6px;border-radius:10px;border:2px solid #ffd000;color:#ffd000;font-weight:800;font-size:18px;display:inline-flex;align-items:center;justify-content:center;background:#1a1408;vertical-align:middle";
    if(host && host.className && host.className.indexOf("hud-left")>=0) host.appendChild(el);
    else if(host) host.insertAdjacentElement("afterbegin", el);
  }
  el.textContent=String(left);
  el.style.borderColor=left<=3?"#ff4d4d":"#ffd000";
};
var _lobby40 = lobby;
lobby = function(){
  _lobby40();
  if(!state || state.hostId!==me.playerId) return;
  var held = !!(state.game || state.holdGame);
  var btns=app.querySelectorAll("button");
  for(var i=0;i<btns.length;i++){
    var t=btns[i].textContent||"";
    if(/Oyunu baslat|Oyuna devam/.test(t)){
      if(held){
        btns[i].textContent="Oyuna devam";
        btns[i].setAttribute("onclick","socket.emit('resumeGame')");
      }
    }
  }
};
var _score40 = scoreTable;
scoreTable = function(){
  var h=_score40();
  if(state && state.hostId===me.playerId && state.status==="playing"){
    if(h.indexOf("askLobby")<0) h += "<button class='btn btn-ghost' onclick='askLobby()'>Lobiye don</button>";
  }
  return h;
};
var _render40=render;
render=function(){
  _render40();
  paintClock();
};
try { if(screen==="lobby") lobby(); } catch(e) {}
