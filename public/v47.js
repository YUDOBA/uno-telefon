function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V47</p>"; }
beep = function(){};
var sfxCtx=null;
function sfxAC(){
  try{
    if(!sfxCtx) sfxCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(sfxCtx.state==="suspended") sfxCtx.resume();
  }catch(e){}
  return sfxCtx;
}
function tone(freq,dur,type,vol){
  var ctx=sfxAC(); if(!ctx) return;
  try{
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||"square"; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
  }catch(e){}
}
function playSfx(k){
  sfxAC();
  if(k==="draw") tone(220,0.12,"sine",0.1);
  else if(k==="pen"){ tone(160,0.18,"sawtooth",0.12); setTimeout(function(){ tone(110,0.18,"sawtooth",0.12); },160); try{ if(navigator.vibrate) navigator.vibrate([80,40,80]); }catch(e){} }
  else tone(540,0.14,"triangle",0.1);
  try{ new Audio("/sfx-"+k+".mp3").play().catch(function(){}); }catch(e){}
}
document.addEventListener("touchstart", function(){ sfxAC(); }, true);
document.addEventListener("click", function(){ sfxAC(); }, true);
socket.on("cardDraw", function(){ playSfx("draw"); });
socket.on("cardFly", function(d){
  var t=d&&d.card&&d.card.type;
  if(t==="draw2"||t==="wild4"||t==="custom"||t==="wdraw2"||t==="wtarget2"||t==="wskip2"||t==="skipall") playSfx("pen");
  else playSfx("play");
});
