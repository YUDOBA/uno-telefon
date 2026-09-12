function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V45</p>"; }
stayScores = false; stayChat = false;
var _render45 = render;
render = function () {
  if (stayChat && state) return chatScreen();
  if ((stayScores || showScores) && state && state.status === "playing") {
    stayScores = true; showScores = true;
    var html = "<h1>Skor</h1>" + lamp() + scoreTable();
    html += "<button class='btn btn-main' onclick='stayScores=false;showScores=false;backPlay()'>Oyuna don</button>" + ver();
    app.innerHTML = html;
    return;
  }
  _render45();
  var extra = document.getElementById("btn-msg");
  if (extra && extra.previousSibling && /Skor/.test((extra.previousSibling.textContent)||"") && extra.previousSibling.className && extra.previousSibling.className.indexOf("btn-ghost")>=0 && extra.previousSibling.className.indexOf("mini-btn")<0) {
    extra.previousSibling.remove();
  }
  var minis = document.querySelectorAll(".mini-btn");
  var skorBtn = null;
  for (var i = 0; i < minis.length; i++) {
    if (/^Skor$/.test((minis[i].textContent || "").trim())) skorBtn = minis[i];
  }
  if (skorBtn) {
    skorBtn.setAttribute("onclick", "stayScores=true;showScores=true;render()");
    if (!document.getElementById("btn-msg")) {
      var ms = document.createElement("button");
      ms.id = "btn-msg";
      ms.className = "mini-btn";
      ms.textContent = "Mesaj";
      ms.setAttribute("onclick", "goChat()");
      skorBtn.insertAdjacentElement("afterend", ms);
    }
  }
};
