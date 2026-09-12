function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V46</p>"; }
var CHAT_COLS = ["#ff6b6b","#4ecdc4","#ffe66d","#c4b5fd","#4ade80","#fb923c","#38bdf8","#f472b6"];
function chatColor(name){
  var s=String(name||""); var h=0;
  for(var i=0;i<s.length;i++) h = s.charCodeAt(i) + ((h<<5)-h);
  return CHAT_COLS[Math.abs(h)%CHAT_COLS.length];
}
var seenChat = 0;
function chatLen(){ return (state && state.chat && state.chat.length) || 0; }
function paintMsgBtn(){
  var btn = document.getElementById("btn-msg");
  if(!btn) return;
  var unread = !stayChat && chatLen() > seenChat;
  btn.style.background = unread ? "#16a34a" : "";
  btn.style.color = unread ? "#fff" : "";
  btn.style.borderColor = unread ? "#16a34a" : "";
}
var _chat46 = chatScreen;
chatScreen = function(){
  seenChat = chatLen();
  var msgs=(state&&state.chat)||[];
  var html="<h1>Mesajlar</h1>"+lamp();
  html+="<div id='chat-box' style='max-height:45vh;overflow:auto;background:#0b1220;border-radius:12px;padding:10px;margin:8px 0'>";
  if(!msgs.length) html+="<p class='sub'>Henuz mesaj yok.</p>";
  msgs.forEach(function(m){
    var c=m.color||chatColor(m.name);
    html+="<div style='margin:6px 0;color:"+c+"'><b>"+esc(m.name)+":</b> "+esc(m.text)+"</div>";
  });
  html+="</div><input id='chat-in' maxlength='160' placeholder='Mesaj yaz' onkeydown=\"if(event.key==='Enter')sendChat()\" />";
  html+="<button class='btn btn-main' onclick='sendChat()'>Gonder</button>";
  html+="<button class='btn btn-ghost' onclick='seenChat=chatLen();stayChat=false;backPlay()'>Oyuna don</button>"+ver();
  app.innerHTML=html;
  var box=document.getElementById("chat-box"); if(box) box.scrollTop=box.scrollHeight;
};
var _render46=render;
render=function(){
  _render46();
  if(stayChat) seenChat=chatLen();
  paintMsgBtn();
};
setInterval(paintMsgBtn, 800);
