function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V55</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".color-name{position:relative;z-index:96;margin-top:10px}@keyframes unoburst{0%{left:var(--sx);top:var(--sy);transform:translate(-50%,-50%) scale(1)}35%{left:50%;top:28%;transform:translate(-50%,-50%) scale(1.7)}65%{left:50%;top:28%;transform:translate(-50%,-50%) scale(1.7)}100%{left:var(--sx);top:var(--sy);transform:translate(-50%,-50%) scale(1)}}.unoburst{z-index:90}";
  document.head.appendChild(s);
})();
function goNewGame(){ try{ closeRoom(); }catch(e){} goCreate(); }
var _render55=render;
render=function(){
  _render55();
  if(!state || state.status!=="winnerShow") return;
  if(document.getElementById("btn-newgame")) return;
  var b=document.createElement("button");
  b.id="btn-newgame";
  b.className="btn btn-main";
  b.textContent="Oyun kurma ekrani";
  b.onclick=goNewGame;
  app.appendChild(b);
};
