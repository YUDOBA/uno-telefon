function ver(){ return "<p class='ver-tag'>V80</p>"; }
(function () {
  var boot = document.getElementById("boot");
  var sub = document.getElementById("bootSub");
  var retry = document.getElementById("bootRetry");
  var ready = false;
  var t0 = Date.now();
  var hideTimer = null;
  function hideBoot() {
    if (ready) return;
    var left = 5000 - (Date.now() - t0);
    if (left > 40) {
      if (!hideTimer) hideTimer = setTimeout(hideBootNow, left);
      return;
    }
    hideBootNow();
  }
  function hideBootNow() {
    ready = true;
    if (boot) boot.classList.add("off");
  }
  window.__hideBoot = hideBoot;
  if (retry) retry.onclick = function () { location.reload(); };
  setTimeout(function () {
    if (ready) return;
    if (sub) sub.textContent = "Baglanti kuruluyor…";
  }, 9000);
  setTimeout(function () {
    if (ready) return;
    if (sub) sub.textContent = "Simdi acilamadi.";
    if (retry) retry.style.display = "block";
  }, 55000);
  if (typeof socket !== "undefined") {
    socket.on("connect", hideBoot);
    socket.on("state", hideBoot);
    socket.on("created", hideBoot);
    socket.on("joined", hideBoot);
    if (socket.connected) hideBoot();
  }
  var _r79 = render;
  render = function () {
    _r79();
    var nodes = document.querySelectorAll("p.ver-tag, p.sub");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").trim();
      if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
        nodes[i].className = "ver-tag";
        nodes[i].textContent = "V80";
      }
    }
  };
})();
