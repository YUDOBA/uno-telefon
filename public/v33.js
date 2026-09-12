VERSION = "V33";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V33</p>"; }
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
var _doStart33 = doStart;
doStart = function(){
  socket.emit("setTurnSeconds", { turnSeconds: readTurnSec() });
  _doStart33();
};
create = function(){
  app.innerHTML = "<h1>Oyun kur</h1><div class='panel'><label>Adin</label><input id='name' maxlength='16' value='"+esc(me.name)+"' /><label>Toplam oyuncu</label><select id='max'><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div>" +
    sureHtml() +
    "<div class='panel'><button class='btn btn-main' onclick='doCreate()'>Kur ve kod al</button><button class='btn btn-ghost' onclick='goHome()'>Geri</button><p class='err'>"+esc(err)+"</p></div>" + ver();
};
var _lobby33 = lobby;
lobby = function(){
  _lobby33();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var r=document.getElementById("rounds");
  if (r && r.parentNode) r.parentNode.insertAdjacentHTML("beforeend", sureHtml());
};
var _score33 = scoreTable;
scoreTable = function(){
  var rows = (state.players || []).slice().sort(function(a,b){ return ((a.totalScore!=null?a.totalScore:a.score)||0)-((b.totalScore!=null?b.totalScore:b.score)||0); });
  var h = "<div class='panel'><h2>Skor</h2><p>Tur "+(state.roundNow||1)+" / "+(state.roundsTotal||1)+"</p>";
  h += "<div class='row'><span><b>Oyuncu</b></span><span><b>Kart</b> / <b>Sure</b> / <b>Toplam</b></span></div>";
  rows.forEach(function(p){
    var k=p.score||0, t=p.timeScore||0, tot=(p.totalScore!=null?p.totalScore:k+t);
    h += "<div class='row'><span>"+esc(p.name)+"</span><span>"+k+" / "+t+" / "+tot+"</span></div>";
  });
  if (state.status==="playing") h += "<button class='btn btn-ghost' onclick='showScores=false;render()'>Oyuna don</button>";
  return h+"</div>";
};
var _render33 = render;
render = function(){
  _render33();
  var g=state&&state.game;
  var sec=g&&(g.turnSeconds||state.turnSeconds||0);
  if(g&&sec&&!document.getElementById("turn-clock")){
    var bar=document.querySelector(".hud");
    if(bar&&!bar.querySelector(".hud-mid")){
      var left=g.turnEndsAt?Math.max(0,Math.ceil((g.turnEndsAt-Date.now())/1000)):sec;
      var mid=document.createElement("div"); mid.className="hud-mid";
      mid.innerHTML="<div class='turn-clock' id='turn-clock'>"+left+"</div>";
      var right=bar.querySelector(".hud-right");
      if(right) bar.insertBefore(mid,right); else bar.appendChild(mid);
    }
  }
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
  var g=state.game, sec=g.turnSeconds||state.turnSeconds||0;
  if(!sec) return;
  var left=g.turnEndsAt?Math.max(0,Math.ceil((g.turnEndsAt-Date.now())/1000)):sec;
  var el=document.getElementById("turn-clock");
  if(el){ el.textContent=String(left); el.className="turn-clock"+(left<=3?" warn":""); }
  if(left>0&&left<=3&&tickN!==left){ tickN=left; beep(880,0.05,"square",0.07); setTimeout(function(){ beep(620,0.05,"square",0.06); },70); }
  if(left<=0 && g.currentId===me.playerId && !g.winnerId){ if(tickN!==-1){ tickN=-1; socket.emit("turnTimeout"); } }
},250);
try { if (screen==="home") render(); } catch(e) {}
