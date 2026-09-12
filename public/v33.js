VERSION = "V33";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V33</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".turn-clock{display:inline-block;min-width:48px;padding:4px 10px;margin-left:8px;border-radius:10px;background:#1a1408;border:2px solid #ffd000;color:#ffd000;font-weight:800;font-size:18px;vertical-align:middle}.turn-clock.warn{border-color:#ff4d4d;color:#ffb0b0;background:#4a1008}.score-head span{font-size:12px;opacity:.85}";
  document.head.appendChild(s);
})();
function savedSec(){
  var n=0;
  try { n=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if (state && state.turnSeconds) n=state.turnSeconds;
  if (state && state.game && state.game.turnSeconds) n=state.game.turnSeconds;
  return n;
}
function readTurnSec(){
  var mode=document.getElementById("tmode");
  var secEl=document.getElementById("tsec");
  if(mode && mode.value==="0") return 0;
  if(mode && mode.value==="1"){
    var n=parseInt(secEl&&secEl.value,10)||20;
    if(n<5)n=5; if(n>180)n=180; return n;
  }
  return savedSec();
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
  var sec=savedSec();
  if(sec) socket.emit("setTurnSeconds", { turnSeconds: sec });
});
var _doStart33 = doStart;
doStart = function(){
  var sec=readTurnSec() || savedSec();
  socket.emit("setTurnSeconds", { turnSeconds: sec });
  _doStart33();
};
var _lobby33 = lobby;
lobby = function(){
  _lobby33();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var saved=savedSec();
  var box="<div class='panel' style='border:2px solid #ffd000'><label>SIRA SURESI</label><select id='tmode' onchange='onTurnMode()'><option value='0'"+(saved?"":" selected")+">Suresiz</option><option value='1'"+(saved?" selected":"")+">Sureli</option></select><div id='tsecwrap' style='display:"+(saved?"block":"none")+"'><label>Saniye</label><input id='tsec' inputmode='numeric' value='"+(saved||20)+"' onchange='onTurnMode()'></div></div>";
  var r=document.getElementById("rounds");
  if (r && r.parentNode) r.parentNode.insertAdjacentHTML("beforeend", box);
};
scoreTable = function(){
  var rows=(state.players||[]).slice().sort(function(a,b){
    var ta=(a.totalScore!=null?a.totalScore:(a.score||0)+(a.timeScore||0));
    var tb=(b.totalScore!=null?b.totalScore:(b.score||0)+(b.timeScore||0));
    return ta-tb;
  });
  var h="<div class='panel'><h2>Skor</h2><p>Tur "+(state.roundNow||1)+" / "+(state.roundsTotal||1)+"</p>";
  h+="<div class='row score-head'><span>Oyuncu</span><span>Kart + Sure = Toplam</span></div>";
  rows.forEach(function(p){
    var k=p.score||0;
    var t=p.timeScore||((state.timeScores&&state.timeScores[p.id])||0);
    var tot=(p.totalScore!=null?p.totalScore:k+t);
    h+="<div class='row'><span>"+esc(p.name)+"</span><span>"+k+" + "+t+" = "+tot+"</span></div>";
  });
  if (state.status==="playing") h+="<button class='btn btn-ghost' onclick='showScores=false;render()'>Oyuna don</button>";
  return h+"</div>";
};
function clockLeft(){
  var g=state&&state.game;
  var sec=savedSec();
  if(!g||!sec) return 0;
  if(!g.turnEndsAt) g.turnEndsAt=Date.now()+sec*1000;
  return Math.max(0, Math.ceil((g.turnEndsAt-Date.now())/1000));
}
function paintClock(){
  if(!state||!state.game||state.status!=="playing") return;
  var sec=savedSec();
  if(!sec) return;
  var left=clockLeft();
  var el=document.getElementById("turn-clock");
  if(!el){
    var row=document.querySelector("#game-root .row") || document.querySelector(".row");
    if(!row) return;
    el=document.createElement("span");
    el.id="turn-clock";
    el.className="turn-clock";
    row.appendChild(el);
  }
  el.textContent=String(left);
  el.className="turn-clock"+(left<=3?" warn":"");
}
var _render33=render;
render=function(){
  _render33();
  paintClock();
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
  if(!state||!state.game||state.status!=="playing") return;
  var sec=savedSec();
  if(!sec) return;
  paintClock();
  var left=clockLeft();
  if(left>0&&left<=3&&tickN!==left){ tickN=left; beep(880,0.05,"square",0.07); setTimeout(function(){ beep(620,0.05,"square",0.06); },70); }
  if(left<=0 && state.game.currentId===me.playerId && !state.game.winnerId){
    if(tickN!==-1){
      tickN=-1;
      socket.emit("turnTimeout");
      state.game.turnEndsAt=Date.now()+sec*1000;
    }
  }
},250);
