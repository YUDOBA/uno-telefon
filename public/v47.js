function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V47</p>"; }
var SFXU={
 draw:"/sfx-draw.mp3",
 play:"/sfx-play.mp3",
 pen:"/sfx-pen.mp3"
};
var sfxA={};
function unlockSfx(){
 ["draw","play","pen"].forEach(function(k){
  if(!sfxA[k]){ sfxA[k]=new Audio(SFXU[k]); sfxA[k].preload="auto"; }
  try{ sfxA[k].muted=true; var p=sfxA[k].play(); if(p&&p.then) p.then(function(){ sfxA[k].pause(); sfxA[k].currentTime=0; sfxA[k].muted=false; }).catch(function(){}); }catch(e){}
 });
}
function playSfx(k){
 try{
  var a=new Audio(SFXU[k]);
  a.play().catch(function(){});
 }catch(e){}
}
document.addEventListener("touchstart", unlockSfx, true);
document.addEventListener("click", unlockSfx, true);
socket.on("cardDraw", function(){ playSfx("draw"); });
socket.on("cardFly", function(d){
 var t=d&&d.card&&d.card.type;
 if(t==="draw2"||t==="wild4"||t==="custom"||t==="wdraw2"||t==="wtarget2"||t==="wskip2"||t==="skipall") playSfx("pen");
 else playSfx("play");
});
