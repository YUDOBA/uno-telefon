function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V37</p>"; }
function secNow(){
  var a=0,b=0;
  try { a=parseInt(localStorage.getItem("uno_tsec")||"0",10)||0; } catch(e){}
  if (state && state.turnSeconds) b=state.turnSeconds;
  return a>b?a:b;
}
function sureOzet(){
  var sec=secNow();
  return sec ? ("Sureli  " + sec + " sn") : "Suresiz";
}
function applySure(sec){
  sec=parseInt(sec,10)||0;
  if(sec&&sec<5)sec=5;
  if(sec>180)sec=180;
  try { localStorage.setItem("uno_tsec", String(sec)); } catch(e){}
  if (state && state.status==="lobby") socket.emit("setTurnSeconds", { turnSeconds: sec });
  if (typeof lobby==="function") lobby();
}
var _lobby36 = lobby;
lobby = function () {
  _lobby36();
  if (!state) return;
  var old=document.getElementById("sure-box");
  if(old) old.remove();
  var old2=document.getElementById("tmode");
  if(old2 && old2.closest) { var p=old2.closest(".panel"); if(p) p.remove(); }
  var sec=secNow();
  var isHost=state.hostId===me.playerId;
  var box="<div id='sure-box' class='panel' style='border:2px solid #ffd000'>";
  box+="<p style='text-align:center;font-weight:800;margin:0 0 8px'>Sira suresi: "+sureOzet()+"</p>";
  if(isHost){
    box+="<div style='display:flex;gap:8px;justify-content:center;margin-bottom:8px'>";
    box+="<button class='btn "+(sec?"btn-ghost":"btn-main")+"' onclick='applySure(0)'>Suresiz</button>";
    box+="<button class='btn "+(sec?"btn-main":"btn-ghost")+"' onclick='applySure(document.getElementById(\"tsec2\").value||20)'>Sureli</button>";
    box+="</div><label>Saniye</label><input id='tsec2' inputmode='numeric' value='"+(sec||20)+"' onchange='if("+sec+")applySure(this.value)' />";
  }
  box+="</div>";
  var startBtn=app.querySelector(".btn-main");
  if(startBtn) startBtn.insertAdjacentHTML("beforebegin", box);
  else app.insertAdjacentHTML("beforeend", box);
  if(!document.getElementById("btn-kapat")){
    var k="<button id='btn-kapat' class='btn btn-ghost' onclick='closeRoom()'>Oyunu kapat</button>";
    var last=app.querySelector(".btn-ghost");
    if(startBtn) startBtn.insertAdjacentHTML("afterend", k);
    else app.insertAdjacentHTML("beforeend", k);
  }
};
try { if (screen==="lobby") lobby(); } catch(e){}
