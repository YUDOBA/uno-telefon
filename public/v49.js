function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V49</p>"; }
var _score49 = scoreTable;
scoreTable = function () {
  var h = _score49();
  h = h.replace(/<button class='btn btn-ghost' onclick='showScores=false;render\(\)'>Oyuna don<\/button>/g, "");
  h = h.replace(/<button class="btn btn-ghost" onclick="showScores=false;render\(\)">Oyuna don<\/button>/g, "");
  return h;
};
var _render49 = render;
render = function () {
  _render49();
  var extras = document.querySelectorAll(".hud-left .btn-ghost");
  for (var i = 0; i < extras.length; i++) {
    var tx = (extras[i].textContent || "").trim();
    if (tx === "Skor" || tx === "Mesaj") extras[i].remove();
  }
  var minis = document.querySelectorAll(".mini-btn");
  var skor = null;
  for (var j = 0; j < minis.length; j++) {
    if ((minis[j].textContent || "").trim() === "Skor") skor = minis[j];
  }
  var msg = document.getElementById("btn-msg");
  if (skor) {
    if (!msg) {
      msg = document.createElement("button");
      msg.id = "btn-msg";
      msg.className = "mini-btn";
      msg.textContent = "Mesaj";
      msg.setAttribute("onclick", "goChat()");
    }
    if (msg.parentNode !== skor.parentNode || msg.previousSibling !== skor) {
      skor.insertAdjacentElement("afterend", msg);
    }
  }
  var dons = document.querySelectorAll("button");
  var kept = false;
  for (var k = dons.length - 1; k >= 0; k--) {
    if ((dons[k].textContent || "").trim() !== "Oyuna don") continue;
    if (!kept && dons[k].className.indexOf("btn-main") >= 0) { kept = true; continue; }
    if (!kept) { kept = true; continue; }
    dons[k].remove();
  }
};
