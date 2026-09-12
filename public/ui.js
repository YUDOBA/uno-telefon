VERSION = "V39";
function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V39</p>"; }
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
var _doStart = typeof doStart==="function" ? doStart : function(){};
doStart = function(){
  socket.emit("setTurnSeconds", { turnSeconds: readTurnSec() });
  _doStart();
};
create = function(){
  app.innerHTML = "<h1>Oyun kur</h1><div class='panel'><label>Adin</label><input id='name' maxlength='16' value='"+esc(me.name)+"' /><label>Toplam oyuncu</label><select id='max'><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div>" +
    sureHtml() +
    "<div class='panel'><button class='btn btn-main' onclick='doCreate()'>Kur ve kod al</button><button class='btn btn-ghost' onclick='goHome()'>Geri</button><p class='err'>"+esc(err)+"</p></div>" + ver();
};
var _lobby = lobby;
lobby = function(){
  _lobby();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var r=document.getElementById("rounds");
  if (r && r.parentNode) r.parentNode.insertAdjacentHTML("beforeend", sureHtml());
  else app.insertAdjacentHTML("beforeend", sureHtml());
};
var stayChat=false, stayScores=false;
function goChat(){ stayChat=true; stayScores=false; render(); }
function backPlay(){ stayChat=false; stayScores=false; showScores=false; screen="game"; render(); }
function goScores(){ stayScores=true; stayChat=false; showScores=true; render(); }
function askAbort(){ if (confirm("Oyunu bitirmek istediginize emin misiniz?")) socket.emit("abortGame"); }
function sendChat(){
  var el=document.getElementById("chat-in"); var t=el?el.value.trim():"";
  if(!t) return; socket.emit("chat",{text:t}); if(el) el.value="";
}
function turnWho(){
  var who="", mine=false;
  if(state&&state.game){
    mine = state.game.currentId===me.playerId;
    (state.players||[]).forEach(function(p){ if(p.id===state.game.currentId) who=p.name; });
  }
  return {who:who, mine:mine};
}
function chatScreen(){
  var t=turnWho();
  var msgs=(state&&state.chat)||[];
  var html="<h1>Mesajlar</h1><div class='turn-lamp "+(t.mine?"on":"")+"'>"+(t.mine?"Sira sende":("Sira: "+esc(t.who||"-")))+"</div>";
  html+="<div class='chat-box' id='chat-box'>";
  msgs.forEach(function(m){ html+="<div class='chat-line'><b>"+esc(m.name)+":</b> "+esc(m.text)+"</div>"; });
  if(!msgs.length) html+="<p class='sub'>Henuz mesaj yok.</p>";
  html+="</div><input id='chat-in' maxlength='160' placeholder='Mesaj yaz' onkeydown=\"if(event.key==='Enter')sendChat()\" />";
  html+="<button class='btn btn-main' onclick='sendChat()'>Gonder</button>";
  html+="<button class='btn btn-ghost' onclick='backPlay()'>Oyuna don</button>"+ver();
  app.innerHTML=html;
  var box=document.getElementById("chat-box"); if(box) box.scrollTop=box.scrollHeight;
}
function scoresScreen(){
  var t=turnWho();
  var html="<div class='row' style='border:0'><strong>Oda "+esc(state.code)+"</strong><span class='badge'>Tur "+(state.roundNow||1)+"/"+(state.roundsTotal||1)+"</span></div>";
  html+="<div class='turn-lamp "+(t.mine?"on":"")+"'>"+(t.mine?"Sira sende — oyuna don":("Sira: "+esc(t.who||"-")))+"</div>";
  html+=scoreTable();
  if (state.hostId===me.playerId) html+="<button class='btn btn-ghost' onclick='askAbort()'>Oyunu bitir</button>";
  html+="<button class='btn btn-main' onclick='backPlay()'>Oyuna don</button>"+ver();
  app.innerHTML=html;
}
var _render=render;
render=function(){
  if (stayChat && state && state.status==="playing") return chatScreen();
  if (stayScores && state && state.status==="playing") return scoresScreen();
  _render();
  paintExtra();
};
function paintExtra(){
  var hud=document.querySelector(".hud-left");
  if(!hud) return;
  if(!hud.querySelector(".btn-tiny")){
    hud.insertAdjacentHTML("beforeend", "<button class='btn btn-ghost btn-tiny' onclick='goScores()'>Skor</button><button class='btn btn-ghost btn-tiny' onclick='goChat()'>Mesaj</button>");
  }
  var mini=document.querySelector(".mini-btn");
  if(mini && /Skor/.test(mini.textContent||"")) mini.style.display="none";
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
}
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
