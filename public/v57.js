function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V57</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent="#yd-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#0b1220;animation:ydfade .35s ease 1.65s forwards}#yd-splash .box{width:220px;height:220px;border-radius:28px;overflow:hidden;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.45)}#yd-splash .q{position:absolute;width:50%;height:50%}#yd-splash .q1{left:0;top:0;background:#E31C23}#yd-splash .q2{right:0;top:0;background:#F5C400}#yd-splash .q3{left:0;bottom:0;background:#2E9B3E}#yd-splash .q4{right:0;bottom:0;background:#1C6DD0}#yd-splash .panel{position:absolute;inset:16%;background:#fff;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(.6);opacity:0;animation:ydpop .45s ease .25s forwards}#yd-splash .panel b{font-size:1.55rem;line-height:1;color:#111}#yd-splash .panel span{font-size:2.1rem;line-height:.9;font-weight:900;color:#111}@keyframes ydpow{to{transform:scale(1);opacity:1}}@keyframes ydpow{}@keyframes ydpop{to{transform:scale(1);opacity:1}}@keyframes ydfade{to{opacity:0;visibility:hidden}}";
  document.head.appendChild(s);
})();
function showYudobaSplash(){
  if(document.getElementById("yd-splash")) return;
  var el=document.createElement("div");
  el.id="yd-splash";
  el.innerHTML="<div class='box'><div class='q q1'></div><div class='q q2'></div><div class='q q3'></div><div class='q q4'></div><div class='panel'><b>YUDO</b><span>BA</span></div></div>";
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 2100);
}
var _prevStatus57 = null;
var _onState57 = socket && socket._callbacks && socket._callbacks.$state;
socket.on("state", function(st){
  var prev = _prevStatus57;
  _prevStatus57 = st && st.status;
  if(prev === "waiting" && st && st.status === "playing") showYudobaSplash();
});
if(!sessionStorage.getItem("yd_boot")){
  sessionStorage.setItem("yd_boot","1");
  showYudobaSplash();
} else if(window.navigator && window.navigator.standalone){
  if(!sessionStorage.getItem("yd_icon")){
    sessionStorage.setItem("yd_icon","1");
    showYudobaSplash();
  }
}
