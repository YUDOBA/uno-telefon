function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V51</p>"; }
playSfx = function (k) {
  var ctx;
  try {
    if (!window._sfxC) window._sfxC = new (window.AudioContext || window.webkitAudioContext)();
    ctx = window._sfxC;
    if (ctx.state === "suspended") ctx.resume();
  } catch (e) { return; }
  function beep2(freq, dur, type, vol) {
    try {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  if (k === "draw") beep2(240, 0.16, "sine", 0.32);
  else if (k === "pen") {
    beep2(170, 0.22, "sawtooth", 0.36);
    setTimeout(function () { beep2(120, 0.22, "sawtooth", 0.36); }, 170);
    try { if (navigator.vibrate) navigator.vibrate([90, 40, 90]); } catch (e) {}
  } else beep2(620, 0.16, "triangle", 0.32);
};
