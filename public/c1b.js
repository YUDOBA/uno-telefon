VERSION = "V34";
function ver(){ return "<p class=\"sub\" style=\"text-align:center;margin-top:18px\">Uno Telefon V34</p>"; }
function create() {
  app.innerHTML = "<h1>Oyun kur</h1>" +
    "<div class=\"panel\"><label>Adin</label><input id=\"name\" maxlength=\"16\" value=\"" + esc(me.name) + "\" />" +
    "<label>Toplam oyuncu</label><select id=\"max\"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div>" +
    "<div class=\"panel\"><label>Sira suresi</label>" +
    "<select id=\"tmode\" onchange=\"var w=document.getElementById('tsecwrap');if(w)w.style.display=this.value==='0'?'none':'block'\"><option value=\"0\">Suresiz</option><option value=\"1\">Sureli</option></select>" +
    "<div id=\"tsecwrap\" style=\"display:none\"><label>Saniye</label><input id=\"tsec\" inputmode=\"numeric\" value=\"20\" /></div></div>" +
    "<div class=\"panel\"><button class=\"btn btn-main\" onclick=\"doCreate()\">Kur ve kod al</button>" +
    "<button class=\"btn btn-ghost\" onclick=\"goHome()\">Geri</button><p class=\"err\">" + esc(err) + "</p></div>" + ver();
}
var _lobbyBase = lobby;
lobby = function () {
  _lobbyBase();
  if (!state || state.hostId !== me.playerId) return;
  if (document.getElementById("tmode")) return;
  var hostPanel = app.querySelector("#rounds") && app.querySelector("#rounds").parentNode;
  if (!hostPanel) return;
  var ts = state.turnSeconds || 0;
  var box = document.createElement("div");
  box.innerHTML = "<label>Sira suresi</label><select id=\"tmode\" onchange=\"onTurnMode()\"><option value=\"0\"" + (ts?"":" selected") + ">Suresiz</option><option value=\"1\"" + (ts?" selected":"") + ">Sureli</option></select>" +
    "<div id=\"tsecwrap\" style=\"display:" + (ts?"block":"none") + "\"><label>Saniye</label><input id=\"tsec\" inputmode=\"numeric\" value=\"" + (ts||20) + "\" onchange=\"setTurnSeconds()\" /></div>";
  hostPanel.appendChild(box);
};
function onTurnMode() {
  var mode = document.getElementById("tmode");
  var wrap = document.getElementById("tsecwrap");
  if (wrap) wrap.style.display = (mode && mode.value !== "0") ? "block" : "none";
  setTurnSeconds();
}
