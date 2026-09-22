function ver(){ return "<p class='ver-tag'>V84</p>"; }
(function(){
  var boot=document.getElementById("boot");
  var started=false;
  var fromBoot=false;
  try { fromBoot = sessionStorage.getItem("yd_from_boot") === "1"; sessionStorage.removeItem("yd_from_boot"); } catch(e) {}
  function hideWait(){
    if(!boot) return;
    boot.classList.add("can-off");
    boot.classList.add("off");
  }
  function playThenOpen(){
    if(started) return;
    started=true;
    hideWait();
    if(typeof showYudobaSplash==="function") showYudobaSplash();
  }
  window.__bootMarkReady=function(){
    if(fromBoot){ playThenOpen(); return; }
    var t0=window.__bootT0||Date.now();
    var left=5000-(Date.now()-t0);
    if(left<0) left=0;
    setTimeout(playThenOpen, left);
  };
  if(typeof socket!=="undefined"){
    socket.on("connect", window.__bootMarkReady);
    if(socket.connected) window.__bootMarkReady();
  }
  if("serviceWorker" in navigator){
    try { navigator.serviceWorker.register("/sw.js?v=84"); } catch(e) {}
  }
  var _r=render;
  render=function(){
    _r();
    var nodes=document.querySelectorAll("p.ver-tag, p.sub");
    for(var i=0;i<nodes.length;i++){
      var t=(nodes[i].textContent||"").trim();
      if(/^V\d+$/.test(t)||/^YUDOBA\s*V\d+$/i.test(t)||/^Uno Telefon V\d+$/i.test(t)){
        nodes[i].className="ver-tag";
        nodes[i].textContent="V84";
      }
    }
  };
})();
