VERSION = "V36";
var stayChat = false;
function ver(){ return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V36</p>"; }
function readTurnSec() {
  var mode = document.getElementById("tmode");
  var secEl = document.getElementById("tsec");
  if (!mode || mode.value === "0") return 0;
  var n = parseInt(secEl && secEl.value, 10) || 20;
  if (n < 5) n = 5; if (n > 180) n = 180; return n;
}
function onTurnMode() {
  var w = document.getElementById("tsecwrap");
  var mode = document.getElementById("tmode");
  if (w) w.style.display = (mode && mode.value !== "0") ? "block" : "none";
  socket.emit("setTurnSeconds", { turnSeconds: readTurnSec() });
}
function setTurnSeconds() { socket.emit("setTurnSeconds", { turnSeconds: readTurnSec() }); }
doCreate = function () {
  var name = ((document.getElementById("name")||{}).value || "").trim() || "Kurucu";
  me.name = name;
  socket.emit("create", { name: name, maxPlayers: (document.getElementById("max")||{}).value || 4, turnSeconds: readTurnSec() });
};
create = function () {
  app.innerHTML = "<h1>Oyun kur</h1><div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" /><label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div><div class=\"panel\"><label>Sira suresi</label><select id=\"tmode\" onchange=\"onTurnMode()\"><option value=\"0\">Suresiz</option><option value=\"1\">Sureli</option></select><div id=\"tsecwrap\" style=\"display:none\"><label>Saniye</label><input id=\"tsec\" inputmode=\"numeric\" value=\"20\" /></div></div><div class=\"panel\"><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button><button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>" + ver();
};
var _lobbyP = lobby;
lobby = function () {
  _lobbyP();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var hostPanel = document.getElementById("rounds") && document.getElementById("rounds").parentNode;
  if (!hostPanel) return;
  var box = document.createElement("div");
  box.innerHTML = "<label>Sira suresi</label><select id=\"tmode\" onchange=\"onTurnMode()\"><option value=\"0\">Suresiz</option><option value=\"1\">Sureli</option></select><div id=\"tsecwrap\" style=\"display:none\"><label>Saniye</label><input id=\"tsec\" inputmode=\"numeric\" value=\"20\" /></div>";
  hostPanel.appendChild(box);
};
function goChat(){ stayChat = true; screen = "chat"; render(); }
function backPlay(){ stayChat = false; showScores = false; screen = "game"; render(); }
function askAbort(){ if (confirm("Oyunu bitirmek istediginize emin misiniz?")) socket.emit("abortGame"); }
function sendChat(){
  var el = document.getElementById("chat-in"); var t = el ? el.value.trim() : "";
  if (!t) return; socket.emit("chat", { text: t }); if (el) el.value = "";
}
function chatScreen(){
  var msgs = (state && state.chat) || [];
  var who = "", mine = false;
  if (state && state.game) {
    mine = state.game.currentId === me.playerId;
    (state.players||[]).forEach(function(p){ if (p.id === state.game.currentId) who = p.name; });
  }
  var html = "<h1>Mesajlar</h1><div class=\"turn-lamp "+(mine?"on":"")+"\">"+(mine?"Sira sende":("Sira: "+esc(who||"-")))+"</div>";
  html += "<div class=\"chat-box\" id=\"chat-box\">";
  msgs.forEach(function(m){ html += "<div class=\"chat-line\"><b>"+esc(m.name)+":</b> "+esc(m.text)+"</div>"; });
  if (!msgs.length) html += "<p class=\"sub\">Henuz mesaj yok.</p>";
  html += "</div><input id=\"chat-in\" maxlength=\"160\" placeholder=\"Mesaj yaz\" onkeydown=\"if(event.key===\'Enter\')sendChat()\" />";
  html += "<button class=\"btn btn-main\" onclick=\"sendChat()\">Gonder</button>";
  html += "<button class=\"btn btn-ghost\" onclick=\"backPlay()\">Oyuna don</button>" + ver();
  app.innerHTML = html;
  var box = document.getElementById("chat-box"); if (box) box.scrollTop = box.scrollHeight;
}
var _renderP = render;
render = function () {
  if (stayChat && state && state.status === "playing") return chatScreen();
  if (screen === "chat") return chatScreen();
  if (showScores && state) {
    var who="", mine=false;
    if (state.game) {
      mine = state.game.currentId === me.playerId;
      (state.players||[]).forEach(function(p){ if (p.id===state.game.currentId) who=p.name; });
    }
    var html = "<div class=\"row\" style=\"border:0\"><strong>Oda "+esc(state.code)+"</strong><span class=\"badge\">Tur "+(state.roundNow||1)+"/"+(state.roundsTotal||1)+"</span></div>";
    html += "<div class=\"turn-lamp "+(mine?"on":"")+"\">"+(mine?"Sira sende — oyuna don":("Sira: "+esc(who||"-")))+"</div>";
    html += scoreTable();
    if (state.hostId === me.playerId) html += "<button class=\"btn btn-ghost\" onclick=\"askAbort()\">Oyunu bitir</button>";
    html += "<button class=\"btn btn-main\" onclick=\"backPlay()\">Oyuna don</button>" + ver();
    app.innerHTML = html;
    return;
  }
  _renderP();
  paintHud();
};
function paintHud(){
  var hud = document.querySelector(".hud-left");
  if (!hud) return;
  if (!hud.querySelector(".btn-tiny")) {
    hud.insertAdjacentHTML("beforeend", "<button class=\"btn btn-ghost btn-tiny\" onclick=\"showScores=true;stayChat=false;render()\">Skor</button><button class=\"btn btn-ghost btn-tiny\" onclick=\"goChat()\">Mesaj</button>");
  }
  var mini = document.querySelector(".mini-btn");
  if (mini && /Skor/.test(mini.textContent||"")) mini.style.display = "none";
  var g = state && state.game;
  var sec = g && (g.turnSeconds || (state && state.turnSeconds) || 0);
  if (g && sec && !document.getElementById("turn-clock")) {
    var bar = document.querySelector(".hud");
    if (bar && !bar.querySelector(".hud-mid")) {
      var mid = document.createElement("div"); mid.className = "hud-mid";
      var left = g.turnEndsAt ? Math.max(0, Math.ceil((g.turnEndsAt - Date.now())/1000)) : sec;
      mid.innerHTML = "<div class=\"turn-clock\" id=\"turn-clock\">"+left+"</div>";
      var right = bar.querySelector(".hud-right");
      if (right) bar.insertBefore(mid, right); else bar.appendChild(mid);
    }
  }
}
var _ac = null;
function getAC(){ try{ if(!_ac) _ac=new (window.AudioContext||window.webkitAudioContext)(); if(_ac.state==="suspended") _ac.resume(); }catch(e){} return _ac; }
function beep(freq,dur,type,vol){
  var ctx=getAC(); if(!ctx) return;
  try{
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||"square"; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
  }catch(e){}
}
document.addEventListener("touchstart", function(){ getAC(); }, true);
document.addEventListener("click", function(){ getAC(); }, true);
socket.on("cardFly", function(d){
  var t=d&&d.card&&d.card.type;
  if(t==="draw2"||t==="wild4"||t==="custom"||t==="wdraw2"||t==="wtarget2"){ beep(160,0.2,"sawtooth",0.11); setTimeout(function(){ beep(120,0.22,"sawtooth",0.11); },150); }
  else beep(540,0.12,"triangle",0.09);
});
socket.on("cardDraw", function(){ beep(230,0.11,"sine",0.08); });
var _tickN=0;
setInterval(function(){
  if(!state||!state.game) return;
  var g=state.game, sec=g.turnSeconds||state.turnSeconds||0;
  if(!sec) return;
  var left=g.turnEndsAt?Math.max(0,Math.ceil((g.turnEndsAt-Date.now())/1000)):sec;
  var el=document.getElementById("turn-clock");
  if(el){ el.textContent=String(left); el.className="turn-clock"+(left<=3?" warn":""); }
  if(left>0&&left<=3&&_tickN!==left){ _tickN=left; beep(880,0.05,"square",0.07); setTimeout(function(){ beep(620,0.05,"square",0.06); },70); }
  if(left<=0 && g.currentId===me.playerId && !g.winnerId){ if(_tickN!==-1){ _tickN=-1; socket.emit("turnTimeout"); } }
},250);
