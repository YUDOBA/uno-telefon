function ver(){ return "<p class='ver-tag'>V82</p>"; }
(function(){
  if (document.getElementById("yd-splash-css")) return;
  var s=document.createElement("style");
  s.id="yd-splash-css";
  s.textContent="#yd-splash{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:#0b1220}#yd-splash.out{animation:ydfade .35s ease forwards}#yd-splash .box{width:220px;height:220px;border-radius:28px;overflow:hidden;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.45)}#yd-splash .q{position:absolute;width:50%;height:50%}#yd-splash .q1{left:0;top:0;background:#E31C23}#yd-splash .q2{right:0;top:0;background:#F5C400}#yd-splash .q3{left:0;bottom:0;background:#2E9B3E}#yd-splash .q4{right:0;bottom:0;background:#1C6DD0}#yd-splash .panel{position:absolute;inset:16%;background:#fff;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(.6);opacity:0;animation:ydpop .45s ease .25s forwards}#yd-splash .panel b{font-size:1.55rem;line-height:1;color:#111}#yd-splash .panel span{font-size:2.1rem;line-height:.9;font-weight:900;color:#111}@keyframes ydpop{to{transform:scale(1);opacity:1}}@keyframes ydfade{to{opacity:0;visibility:hidden}}";
  document.head.appendChild(s);
})();
function showYudobaSplash(done){
  var old=document.getElementById("yd-splash");
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var el=document.createElement("div");
  el.id="yd-splash";
  el.innerHTML="<div class='box'><div class='q q1'></div><div class='q q2'></div><div class='q q3'></div><div class='q q4'></div><div class='panel'><b>YUDO</b><span>BA</span></div></div>";
  document.body.appendChild(el);
  setTimeout(function(){ el.classList.add("out"); }, 1650);
  setTimeout(function(){
    if(el.parentNode) el.parentNode.removeChild(el);
    if(typeof done==="function") done();
  }, 2100);
}
(function(){
  var prev=null;
  if(typeof socket==="undefined") return;
  socket.on("state", function(st){
    var now=st && st.status;
    if(prev && prev!=="playing" && now==="playing") showYudobaSplash();
    prev=now;
  });
})();
