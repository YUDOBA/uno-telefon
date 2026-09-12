function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V38</p>"; }
(function(){
  var el=document.getElementById("turn-clock");
  if(el && el.parentNode===document.body) el.remove();
})();
function secNow(){
  var a=0,b=0,c=0;
  try { a=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if(state && state.turnSeconds) b=state.turnSeconds;
  if(state && state.game && state.game.turnSeconds) c=state.game.turnSeconds;
  return Math.max(a,b,c);
}
function ensureTurnEnd(){
  var g=state && state.game;
  var sec=secNow();
  if(!g || !sec) return 0;
  if(!g.turnEndsAt || g._clockFor !== g.currentId){
    g.turnEndsAt = Date.now() + sec*1000;
    g._clockFor = g.currentId;
  }
  return Math.max(0, Math.ceil((g.turnEndsAt-Date.now())/1000));
}
paintClock = function(){
  var fixed=document.getElementById("turn-clock");
  if(fixed && fixed.parentNode===document.body) fixed.style.display="none";
  var hud=document.querySelector(".hud-left");
  if(!hud) return;
  var el=document.getElementById("hud-clock");
  var sec=secNow();
  var playing=state && state.status==="playing" && state.game;
  if(!playing || !sec){
    if(el) el.remove();
    return;
  }
  var left=ensureTurnEnd();
  if(!el){
    el=document.createElement("div");
    el.id="hud-clock";
    el.style.cssText="min-width:48px;height:40px;margin-left:6px;border-radius:10px;border:2px solid #ffd000;color:#ffd000;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;background:#1a1408";
    hud.appendChild(el);
  }
  el.textContent=String(left);
  el.style.borderColor=left<=3?"#ff4d4d":"#ffd000";
  el.style.color=left<=3?"#ffb0b0":"#ffd000";
};
scoreTable = function(){
  var rows=(state.players||[]).slice().sort(function(a,b){
    var ta=(a.score||0)+(a.timeScore||0);
    var tb=(b.score||0)+(b.timeScore||0);
    return ta-tb;
  });
  var ts=state.timeScores||{};
  var h="<div class='panel'><h2>Skor</h2><p>Tur "+(state.roundNow||1)+" / "+(state.roundsTotal||1)+"</p>";
  h+="<div class='row'><span>Oyuncu</span><span>Kart</span><span>Sure</span><span>Toplam</span></div>";
  rows.forEach(function(p){
    var k=p.score||0;
    var t=p.timeScore||ts[p.id]||0;
    h+="<div class='row'><span>"+esc(p.name)+"</span><span>"+k+"</span><span>"+t+"</span><span>"+(k+t)+"</span></div>";
  });
  if(state.status==="playing") h+="<button class='btn btn-ghost' onclick='showScores=false;render()'>Oyuna don</button>";
  return h+"</div>";
};
var _render38=render;
render=function(){
  _render38();
  paintClock();
};
socket.on("state", function(){
  if(state && state.game && secNow() && !state.game.turnEndsAt){
    state.game.turnEndsAt=Date.now()+secNow()*1000;
    state.game._clockFor=state.game.currentId;
  }
});
var tickN=0;
setInterval(function(){
  paintClock();
  if(!state||!state.game||state.status!=="playing") return;
  var sec=secNow();
  if(!sec) return;
  var left=ensureTurnEnd();
  if(left>0&&left<=3&&tickN!==left){
    tickN=left;
    try{
      var ctx=window._ac||(window._ac=new (window.AudioContext||window.webkitAudioContext)());
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
      g.gain.value=0.07; o.start(); o.stop(ctx.currentTime+0.05);
    }catch(e){}
  }
  if(left===0 && state.game.currentId===me.playerId){
    if(tickN!==-1){
      tickN=-1;
      socket.emit("turnTimeout");
      state.game.turnEndsAt=Date.now()+sec*1000;
    }
  }
},200);
