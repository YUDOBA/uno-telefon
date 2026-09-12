VERSION = "V33";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V33</p>"; }
var clockStyle = document.createElement("style");
clockStyle.textContent = ".hud{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.hud-mid{flex:1;display:flex;justify-content:center}.turn-clock{min-width:52px;height:40px;border-radius:10px;background:#1a1408;border:2px solid #ffd000;color:#ffd000;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center}.turn-clock.warn{background:#4a1008;border-color:#ff4d4d;color:#ffb0b0}";
document.head.appendChild(clockStyle);
function sureHtml(){
  var saved = 0;
  try { saved = parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if (state && state.turnSeconds) saved = state.turnSeconds;
  return "<div class='panel' style='border:2px solid #ffd000'><label>SIRA SURESI</label>" +
    "<select id='tmode' onchange='onTurnMode()'><option value='0'"+(saved?"":" selected")+">Suresiz</option><option value='1'"+(saved?" selected":"")+">Sureli</option></select>" +
    "<div id='tsecwrap' style='display:"+(saved?"block":"none")+"'><label>Saniye</label><input id='tsec' inputmode='numeric' value='"+(saved||20)+"' onchange='onTurnMode()'></div></div>";
}
function readTurnSec(){
  var mode=document.getElementById("tmode");
  var secEl=document.getElementById("tsec");
  if(!mode||mode.value==="0") return 0;
  var n=parseInt(secEl&&secEl.value,10)||20;
  if(n<5)n=5; if(n>180)n=180; return n;
}
function onTurnMode(){
  var w=document.getElementById("tsecwrap");
  var mode=document.getElementById("tmode");
  if(w) w.style.display=(mode&&mode.value!=="0")?"block":"none";
  var sec=readTurnSec();
  try { localStorage.setItem("uno_tsec", String(sec)); } catch(e){}
  if (state && state.status==="lobby") socket.emit("setTurnSeconds", { turnSeconds: sec });
}
doCreate = function(){
  var name=((document.getElementById("name")||{}).value||"").trim()||"Kurucu";
  me.name=name;
  var sec=readTurnSec();
  try { localStorage.setItem("uno_tsec", String(sec)); } catch(e){}
  socket.emit("create", { name:name, maxPlayers:(document.getElementById("max")||{}).value||4, turnSeconds:sec });
};
socket.on("created", function(){
  var sec=0; try{ sec=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; }catch(e){}
  if(sec) socket.emit("setTurnSeconds", { turnSeconds: sec });
});
var _doStart33 = doStart;
doStart = function(){
  var sec=readTurnSec();
  if(!sec){ try{ sec=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; }catch(e){} }
  socket.emit("setTurnSeconds", { turnSeconds: sec });
  _doStart33();
};
var _lobby33 = lobby;
lobby = function(){
  _lobby33();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var r=document.getElementById("rounds");
  if (r && r.parentNode) r.parentNode.insertAdjacentHTML("beforeend", sureHtml());
};
function ensureClock(){
  var g=state&&state.game;
  var sec=(g&&g.turnSeconds)||(state&&state.turnSeconds)||0;
  if(!sec){ try{ if(state&&state.status==="playing") sec=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; }catch(e){} }
  if(!g||!sec) return;
  if(!g.turnSeconds) g.turnSeconds=sec;
  if(!g.turnEndsAt) g.turnEndsAt=Date.now()+sec*1000;
  var bar=document.querySelector(".hud");
  if(!bar) return;
  if(!document.getElementById("turn-clock")){
    var mid=document.createElement("div"); mid.className="hud-mid";
    mid.innerHTML="<div class='turn-clock' id='turn-clock'>"+sec+"</div>";
    var right=bar.querySelector(".hud-right");
    if(right) bar.insertBefore(mid,right); else bar.appendChild(mid);
  }
}
var _render33 = render;
render = function(){
  _render33();
  ensureClock();
};
var ac=null;
function getAC(){ try{ if(!ac) ac=new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==="suspended") ac.resume(); }catch(e){} return ac; }
function beep(freq,dur,type,vol){
  var ctx=getAC(); if(!ctx) return;
  try{
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||"square"; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
  }catch(e){}
}
document.addEventListener("touchstart", function(){ getAC(); }, true);
document.addEventListener("click", function(){ getAC(); }, true);
socket.on("cardFly", function(d){
  var t=d&&d.card&&d.card.type;
  if(t==="draw2"||t==="wild4"||t==="custom"||t==="wdraw2"||t==="wtarget2"){ beep(160,0.2,"sawtooth",0.11); setTimeout(function(){ beep(120,0.22,"sawtooth",0.11); },150); }
  else beep(540,0.12,"triangle",0.09);
});
socket.on("cardDraw", function(){ beep(230,0.11,"sine",0.08); });
var tickN=0;
setInterval(function(){
  if(!state||!state.game) return;
  var g=state.game;
  var sec=g.turnSeconds||state.turnSeconds||0;
  if(!sec){ try{ sec=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; }catch(e){} }
  if(!sec) return;
  if(!g.turnEndsAt) g.turnEndsAt=Date.now()+sec*1000;
  ensureClock();
  var left=Math.max(0,Math.ceil((g.turnEndsAt-Date.now())/1000));
  var el=document.getElementById("turn-clock");
  if(el){ el.textContent=String(left); el.className="turn-clock"+(left<=3?" warn":""); }
  if(left>0&&left<=3&&tickN!==left){ tickN=left; beep(880,0.05,"square",0.07); setTimeout(function(){ beep(620,0.05,"square",0.06); },70); }
  if(left<=0 && g.currentId===me.playerId && !g.winnerId){
    if(tickN!==-1){ tickN=-1; socket.emit("turnTimeout"); g.turnEndsAt=Date.now()+sec*1000; }
  }
},250);
