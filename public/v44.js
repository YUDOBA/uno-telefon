function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V44</p>"; }
var stayScores = false, stayChat = false;
function turnWho(){
  var who="-", mine=false;
  if(state&&state.game){
    var id=state.game.currentId;
    if(state.game.drawQueue&&state.game.drawQueue.length) id=state.game.drawQueue[0].playerId;
    mine = id===me.playerId;
    (state.players||[]).forEach(function(p){ if(p.id===id) who=p.name; });
  }
  return {who:who, mine:mine};
}
function lamp(){
  var t=turnWho();
  return "<div style='text-align:center;padding:8px;margin:8px 0;border-radius:10px;font-weight:800;background:"+(t.mine?"#3a2a00":"#152033")+";border:2px solid "+(t.mine?"#ffd000":"#3d5a80")+"'>" +
    (t.mine?"SIRRA SENDE — oyuna don":"Sira: "+esc(t.who)) + "</div>";
}
function goScores(){ stayScores=true; stayChat=false; showScores=true; render(); }
function goChat(){ stayChat=true; stayScores=false; render(); }
function backPlay(){ stayChat=false; stayScores=false; showScores=false; screen="game"; render(); }
function sendChat(){
  var el=document.getElementById("chat-in"); var t=el?el.value.trim():"";
  if(!t) return; socket.emit("chat",{text:t}); if(el) el.value="";
}
function chatScreen(){
  var msgs=(state&&state.chat)||[];
  var html="<h1>Mesajlar</h1>"+lamp();
  html+="<div id='chat-box' style='max-height:45vh;overflow:auto;background:#0b1220;border-radius:12px;padding:10px;margin:8px 0'>";
  if(!msgs.length) html+="<p class='sub'>Henuz mesaj yok.</p>";
  msgs.forEach(function(m){ html+="<div style='margin:6px 0'><b>"+esc(m.name)+":</b> "+esc(m.text)+"</div>"; });
  html+="</div><input id='chat-in' maxlength='160' placeholder='Mesaj yaz' onkeydown=\"if(event.key==='Enter')sendChat()\" />";
  html+="<button class='btn btn-main' onclick='sendChat()'>Gonder</button>";
  html+="<button class='btn btn-ghost' onclick='backPlay()'>Oyuna don</button>"+ver();
  app.innerHTML=html;
  var box=document.getElementById("chat-box"); if(box) box.scrollTop=box.scrollHeight;
}
function scoresHold(){
  app.innerHTML="<h1>Skor</h1>"+lamp()+scoreTable()+"<button class='btn btn-main' onclick='backPlay()'>Oyuna don</button>"+ver();
}
var _render44=render;
render=function(){
  if(stayChat && state && (state.status==="playing"||state.status==="lobby")) return chatScreen();
  if(stayScores && state && state.status==="playing") return scoresHold();
  _render44();
  var hud=document.querySelector(".hud-left");
  if(hud && !document.getElementById("btn-msg")){
    var sk=document.createElement("button");
    sk.className="btn btn-ghost"; sk.style.cssText="min-width:48px;height:32px;font-size:12px;margin-top:4px";
    sk.textContent="Skor"; sk.onclick=goScores;
    var ms=document.createElement("button");
    ms.id="btn-msg"; ms.className="btn btn-ghost"; ms.style.cssText="min-width:48px;height:32px;font-size:12px;margin-top:4px;margin-left:4px";
    ms.textContent="Mesaj"; ms.onclick=goChat;
    hud.appendChild(sk); hud.appendChild(ms);
  }
};
