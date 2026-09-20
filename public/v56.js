function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V56</p>"; }
var _home56 = home;
home = function () {
  _home56();
  var logo = document.querySelector(".logo");
  if (logo) logo.textContent = "YUDOBA";
  var subs = document.querySelectorAll(".sub");
  for (var i = 0; i < subs.length; i++) {
    if (/Uno Telefon/i.test(subs[i].textContent || "")) subs[i].textContent = "YUDOBA V56";
  }
  if (!document.getElementById("pwa-help")) {
    var p = document.createElement("div");
    p.id = "pwa-help";
    p.className = "panel";
    p.innerHTML = "<b>Ana ekrana ekle</b><br>iPhone: Safari ile ac, Paylas, Ana Ekrana Ekle.<br>Android: Chrome menuden Ana ekrana ekle.";
    var last = app.querySelector(".btn-ghost") || app.lastElementChild;
    if (last) last.insertAdjacentElement("beforebegin", p);
    else app.appendChild(p);
  }
};
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js?v=56").catch(function () {});
}
