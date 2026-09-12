function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V52</p>"; }
var hideEndScores = false;
var _render52 = render;
render = function () {
  _render52();
  if (!state || state.status !== "winnerShow") { hideEndScores = false; return; }
  var saw = (state.sawScores || {})[me.playerId];
  if (saw && !hideEndScores) {
    if (!document.getElementById("btn-end-geri")) {
      var b = document.createElement("button");
      b.id = "btn-end-geri";
      b.className = "btn btn-ghost";
      b.textContent = "Geri";
      b.onclick = function () { hideEndScores = true; render(); };
      app.appendChild(b);
    }
  }
  if (saw && hideEndScores) {
    var top = "<div class='row' style='border:0'><strong>Oda " + esc(state.code) + "</strong><span class='badge'>Tur " + state.roundNow + "/" + state.roundsTotal + "</span></div>";
    app.innerHTML = top + "<div class='panel'><h1>" + esc(winnerName()) + " kazandi</h1><p>" +
      (state.gameOver ? "Oyun bitti. En dusuk toplam puan kazanir." : ("Tur " + state.roundNow + " bitti.")) +
      "</p><button class='btn btn-main' onclick='hideEndScores=false;render()'>Skor tabelasi</button></div>" + ver();
  }
};
