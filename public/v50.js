function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>Uno Telefon V50</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=".hud-left{display:grid!important;grid-template-columns:66px 66px;grid-template-rows:auto auto;gap:6px;width:auto}.hud-left .btn-tile{width:66px;height:56px}.mini-btn{width:66px;margin:0;text-align:center}";
  document.head.appendChild(s);
})();
var _card50 = cardHtml;
cardHtml = function (c, extra, idx) {
  if (c && idx == null) c = { color: c.color, type: c.type, value: c.value, fresh: false };
  return _card50(c, extra, idx);
};
var _render50 = render;
render = function () {
  _render50();
  var left = document.querySelector(".hud-left");
  if (!left) return;
  var skor = null, msg = document.getElementById("btn-msg");
  var minis = document.querySelectorAll(".mini-btn");
  for (var i = 0; i < minis.length; i++) {
    if ((minis[i].textContent || "").trim() === "Skor") skor = minis[i];
  }
  if (skor && skor.parentNode !== left) left.appendChild(skor);
  if (!msg) {
    msg = document.createElement("button");
    msg.id = "btn-msg";
    msg.className = "mini-btn";
    msg.textContent = "Mesaj";
    msg.setAttribute("onclick", "goChat()");
  }
  if (msg.parentNode !== left) left.appendChild(msg);
  if (skor && msg) {
    left.appendChild(skor);
    left.appendChild(msg);
  }
};
