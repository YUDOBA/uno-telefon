function ver(){ return "<p class='ver-tag'>V79</p>"; }
(function () {
  var boot = document.getElementById("boot");
  var sub = document.getElementById("bootSub");
  var retry = document.getElementById("bootRetry");
  var ready = false;
  var started = Date.now();
  function hideBoot() {
    ready = true;
    if (boot) boot.classList.add("off");
  }
  function showBoot(msg) {
    if (!boot) return;
    boot.classList.remove("off");
    if (sub && msg) sub.textContent = msg;
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
    socket.on("connect", function () { hideBoot(); });
    socket.on("state", function () { hideBoot(); });
    socket.on("created", function () { hideBoot(); });
    socket.on("joined", function () { hideBoot(); });
  }
  var _r79 = render;
  render = function () {
    try { hideBoot(); } catch (e) {}
    _r79();
    var nodes = document.querySelectorAll("p.ver-tag, p.sub");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").trim();
      if (/^V\d+$/.test(t) || /^YUDOBA\s*V\d+$/i.test(t) || /^Uno Telefon V\d+$/i.test(t)) {
        nodes[i].className = "ver-tag";
        nodes[i].textContent = "V79";
      }
    }
  };
  if (typeof socket !== "undefined" && socket.connected) hideBoot();
  else if (Date.now() - started > 0 && typeof socket !== "undefined") {
    setTimeout(function () { if (socket.connected) hideBoot(); }, 200);
  }
})();
