/* YUDOBA istemcisi — tek dosya */
(function () {
  "use strict";
  var CLIENT_V = "V86";

  // ---------- Yardımcılar ----------
  var $ = function (q, el) { return (el || document).querySelector(q); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var SS = {
    take: function (k) { try { var v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  };
  var COLOR_TR = { red: "Kırmızı", yellow: "Sarı", green: "Yeşil", blue: "Mavi" };
  var NEEDS_COLOR = { wild: 1, wild4: 1, custom: 1, wdraw2: 1, wtarget2: 1, wskip2: 1, swap: 1, shuffle: 1, skipall: 1 };
  var HARD_STACKS = { wild4: 1, custom: 1, wdraw2: 1, wtarget2: 1 };

  // ---------- Durum ----------
  var S = {
    screen: "home", from: null, state: null,
    me: { id: null, token: LS.get("yd_token", ""), name: LS.get("yd_name", LS.get("uno_name", "")) },
    view: "table", endView: null, picked: null, pick: null, stowed: false,
    seenChat: 0, clockEnd: 0, roundId: 0, fx: [], burst: null
  };
  var app = document.getElementById("app");

  // ---------- Simgeler ----------
  var SV = function (inner, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2.6) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  };
  var IC = {
    skip: SV('<circle cx="12" cy="12" r="8.5"/><path d="M6 18L18 6"/>', 3),
    reverse: SV('<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>'),
    target: SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>', 2.3),
    skip2: SV('<circle cx="8" cy="12" r="6"/><path d="M3.8 16.2l8.4-8.4"/><circle cx="16" cy="12" r="6"/><path d="M11.8 16.2l8.4-8.4"/>', 2.3),
    swap: SV('<path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>'),
    shuffle: SV('<path d="M2 18h2.5c4 0 6-12 11-12H22"/><path d="M2 6h2.5c4 0 6 12 11 12H22"/><path d="M19 3l3 3-3 3"/><path d="M19 15l3 3-3 3"/>', 2.3),
    again: SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
    back: '<svg viewBox="0 0 48 48"><path d="M30 8L14 24l16 16" fill="none" stroke="#111" stroke-width="6" stroke-linecap="square"/></svg>',
    dir: SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>', 3),
    hash: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M19 8l-4 32M33 8l-4 32M9 18h32M7 30h32"/></svg>',
    help: '<svg viewBox="0 0 48 48" fill="none" stroke="#111" stroke-width="4.5" stroke-linecap="round"><path d="M16 17c0-6 4-9 8.5-9S33 11 33 16c0 6-8.5 7-8.5 13"/><circle cx="24.5" cy="38" r="1.5" fill="#111"/></svg>',
    cards: '<svg viewBox="0 0 48 48"><rect x="7" y="12" width="18" height="26" rx="3" fill="#fff" transform="rotate(-16 16 25)"/><rect x="15" y="9" width="18" height="27" rx="3" fill="#e6f5e6"/><rect x="23" y="12" width="18" height="26" rx="3" fill="#fff" transform="rotate(14 32 25)"/></svg>',
    book: '<svg viewBox="0 0 48 48"><path d="M6 10h14c3 0 4 2 4 2s1-2 4-2h14v28H28c-2 0-4 2-4 2s-2-2-4-2H6z" fill="#fff"/><path d="M24 12v26" stroke="#1C6DD0" stroke-width="2"/></svg>',
    yd: '<svg viewBox="0 0 64 64"><rect width="32" height="32" fill="#E31C23"/><rect x="32" width="32" height="32" fill="#F5C400"/><rect y="32" width="32" height="32" fill="#2E9B3E"/><rect x="32" y="32" width="32" height="32" fill="#1C6DD0"/><rect x="9" y="9" width="46" height="46" rx="8" fill="#fff"/><text x="32" y="30" text-anchor="middle" font-family="Arial Black,Helvetica,sans-serif" font-size="11.5" font-weight="900" fill="#111">YUDO</text><text x="32" y="47" text-anchor="middle" font-family="Arial Black,Helvetica,sans-serif" font-size="15" font-weight="900" fill="#111">BA</text></svg>'
  };
  var WHEEL = function (sm) { return '<div class="wheel' + (sm ? " sm" : "") + '"><i></i><i></i><i></i><i></i></div>'; };

  // ---------- Kartlar ----------
  // Kart bilgileri: adet ve tur sonu puanı (sunucudaki src/rules.js ile aynı tutulmalı)
  var CARD_INFO = {
    number: { name: "Sayı kartları", text: "Aynı renk ya da aynı sayı üstüne atılır.", count: "Her renkte 0 bir adet, 1–9 ikişer · toplam 76", pts: 5 },
    skip: { name: "Atla", text: "Sıradaki oyuncu atlanır. Aynı renk ya da başka Atla üstüne atılır.", count: "Her renkten 2 · toplam 8", pts: 10 },
    reverse: { name: "Ters", text: "Oyun yönü döner. İki kişide Atla gibi çalışır.", count: "Her renkten 2 · toplam 8", pts: 10 },
    draw2: { name: "+2", text: "Sıradaki 2 kart çeker ya da elindeki herhangi renk +2 ile yığını büyütür. Cezayı çeken, çektikten sonra oynar.", count: "Her renkten 2 · toplam 8", pts: 10 },
    wild: { name: "Joker", text: "Her zaman atılır, atan yeni rengi seçer.", count: "3 adet", pts: 20 },
    wild4: { name: "Joker +4", text: "Üstte sayı kartı ya da joker varken atılır. Sıradaki 4 kart çeker, sonra kendisi oynar.", count: "3 adet", pts: 20 },
    custom: { name: "Özel Joker 8", text: "Atan, 8 ceza kartını istediği oyunculara dağıtır. Seçilenler sırayla çeker, sonra oyun normal akışla sürer.", count: "2 adet", pts: 30 },
    wdraw2: { name: "Joker +2", text: "Her zaman atılır. Renk seçilir, sıradaki 2 kart çeker, sonra kendisi oynar.", count: "2 adet", pts: 10 },
    wtarget2: { name: "Hedef +2", text: "Her zaman atılır. Renk ve hedef oyuncu seçilir, hedef 2 kart çeker.", count: "2 adet", pts: 10 },
    wskip2: { name: "Çift Atla", text: "Her zaman atılır. Renk seçilir, sonraki 2 oyuncu atlanır.", count: "2 adet", pts: 10 },
    swap: { name: "El Değiş", text: "Her zaman atılır. Renk seçilir, seçtiğin oyuncuyla elleriniz yer değiştirir.", count: "1 adet", pts: 20 },
    shuffle: { name: "El Karıştır", text: "Her zaman atılır. Renk seçilir, bütün eller toplanıp karıştırılır, herkese eski sayısı kadar dağıtılır.", count: "1 adet", pts: 20 },
    skipall: { name: "Herkesi Atla", text: "Her zaman atılır. Renk seçilir, diğer herkes atlanır ve atan tekrar oynar.", count: "2 adet", pts: 30 }
  };
  var WIN_BONUS = 20;


  function cardFace(c) {
    var t = c.type, corner = "", mid = "";
    if (t === "number") { corner = String(c.value); mid = '<span class="n">' + c.value + "</span>"; }
    else if (t === "skip") { corner = IC.skip; mid = IC.skip; }
    else if (t === "reverse") { corner = IC.reverse; mid = IC.reverse; }
    else if (t === "draw2") { corner = "+2"; mid = '<span class="t">+2</span>'; }
    else if (t === "wild") { mid = WHEEL(); }
    else if (t === "wild4") { corner = "+4"; mid = '<div class="stk">' + WHEEL(1) + '<span class="t">+4</span></div>'; }
    else if (t === "custom") { corner = "8"; mid = '<span class="n">8</span>'; }
    else if (t === "wdraw2") { corner = "+2"; mid = '<div class="stk">' + WHEEL(1) + '<span class="t">+2</span></div>'; }
    else if (t === "wtarget2") { corner = IC.target; mid = '<div class="stk">' + IC.target + '<span class="t">+2</span></div>'; }
    else if (t === "wskip2") { corner = IC.skip2; mid = IC.skip2; }
    else if (t === "swap") { corner = IC.swap; mid = IC.swap; }
    else if (t === "shuffle") { corner = IC.shuffle; mid = IC.shuffle; }
    else if (t === "skipall") { corner = IC.again; mid = IC.again; }
    var cr = corner ? '<span class="c tl">' + corner + '</span><span class="c br">' + corner + "</span>" : "";
    return cr + '<div class="oval">' + mid + "</div>";
  }
  function cardHtml(c, cls, attrs) {
    return '<div class="ucard ' + c.color + " " + (cls || "") + '"' + (attrs || "") + ">" + cardFace(c) + (c.fresh ? '<span class="fresh-dot"></span>' : "") + "</div>";
  }
  function cardName(c) {
    if (c.type === "number") return COLOR_TR[c.color] + " " + c.value;
    var n = CARD_INFO[c.type] ? CARD_INFO[c.type].name : "?";
    return c.color === "black" ? n : COLOR_TR[c.color] + " " + n;
  }

  function canPlay(card, top, chosen, stack) {
    if (!card) return false;
    if (!top) return true;
    if (stack === "draw2") return card.type === "draw2";
    if (stack && HARD_STACKS[stack]) return false;
    if (card.type === "wild4") return ["number", "wild", "wild4", "custom"].indexOf(top.type) >= 0;
    if (card.color === "black") return true;
    var color = top.color === "black" ? chosen : top.color;
    if (card.color === color) return true;
    if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
    return card.type !== "number" && card.type === top.type;
  }

  // ---------- Bağlantı ----------
  var socket = io({ reconnectionDelay: 700, reconnectionDelayMax: 3000 });
  var everConnected = false;

  socket.on("connect", function () {
    everConnected = true;
    bootReady();
    var code = LS.get("yd_code", ""), token = LS.get("yd_token", "");
    if (code && token) socket.emit("join", { code: code, token: token, name: S.me.name, silent: true });
  });
  socket.on("session", function (d) {
    S.me.id = d.playerId; S.me.token = d.token;
    LS.set("yd_token", d.token); LS.set("yd_code", d.code); LS.set("yd_name", S.me.name);
    checkVersion(d.v);
  });
  socket.on("state", function (s) {
    var prev = S.state;
    S.state = s;
    checkVersion(s.v);
    S.clockEnd = s.clockLeftMs ? Date.now() + s.clockLeftMs : 0;
    // Yeni tur başlayınca logo animasyonu
    if (s.roundId && s.roundId !== S.roundId) {
      if (S.roundId && s.status === "playing") splash();
      resetRoundUi();
      S.roundId = s.roundId;
    }
    if (s.status !== "winnerShow") S.endView = null;
    if (prev && prev.status !== s.status && s.status === "playing") S.view = "table";
    if (!s.game || s.status !== "playing") { S.pick = null; S.picked = null; }
    if (S.view === "chat") S.seenChat = (s.chat || []).length;
    var info = { how: 1, rules: 1, cards: 1 };
    if (!info[S.screen]) S.screen = s.status === "lobby" ? "lobby" : "game";
    render();
  });
  socket.on("errorMsg", function (m) { toast(m); });
  socket.on("roomLost", function () {
    var was = S.screen === "lobby" || S.screen === "game";
    leaveLocal();
    if (was) toast("Oda artık yok. Yeni oyun kurabilirsin.", true);
  });
  socket.on("roomClosed", function (m) { leaveLocal(); toast(m || "Oda kapatıldı.", true); });
  socket.on("cardFly", function (d) {
    if (!d || !d.card) return;
    addFx({ kind: "play", pid: d.fromId, card: d.card, dur: 1600 });
  });
  socket.on("cardDraw", function (d) { addFx({ kind: "draw", pid: d && d.toId, dur: 800 }); });
  socket.on("unoShout", function (d) {
    S.burst = { pid: d.playerId, name: d.name, start: Date.now() };
    if (d.playerId !== S.me.id) { try { if (navigator.vibrate) navigator.vibrate([400, 120, 400, 120, 400]); } catch (e) {} }
    render();
    setTimeout(function () { S.burst = null; render(); }, 1000);
  });

  function leaveLocal() {
    LS.del("yd_code");
    S.state = null; S.pick = null; S.picked = null; S.view = "table"; S.roundId = 0;
    S.screen = "home";
    render();
  }
  function resetRoundUi() { S.picked = null; S.pick = null; S.stowed = false; }

  // Sunucu yeni sürüme geçtiyse uygulama kendini yeniler
  function checkVersion(v) {
    if (!v || v === CLIENT_V) return;
    var last = parseInt(SS.get("yd_reload_at") || "0", 10);
    if (Date.now() - last < 60000) return;
    SS.set("yd_reload_at", String(Date.now()));
    SS.set("yd_from_boot", "1");
    location.replace("/?live=1&u=" + Date.now());
  }

  // ---------- Animasyonlar ----------
  function addFx(f) {
    f.start = Date.now();
    S.fx.push(f);
    paintFx();
    setTimeout(function () { S.fx = S.fx.filter(function (x) { return x !== f; }); paintFx(); }, f.dur + 50);
  }
  function seatPos(pid) {
    var st = S.state; if (!st) return { x: 50, y: 50 };
    var seats = st.seats || [], n = seats.length || 1;
    var self = seats.indexOf(S.me.id); if (self < 0) self = 0;
    var i = seats.indexOf(pid); if (i < 0) i = 0;
    var a = Math.PI / 2 + ((i - self) / n) * 2 * Math.PI;
    return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 40 };
  }
  function paintFx() {
    var table = $(".table");
    if (!table) return;
    var layer = $(".fx-layer", table);
    if (!layer) { layer = document.createElement("div"); layer.className = "fx-layer"; table.appendChild(layer); }
    var now = Date.now(), h = "";
    S.fx.forEach(function (f) {
      var p = seatPos(f.pid), delay = -(now - f.start);
      var inner = f.kind === "play" ? cardHtml(f.card) : '<div class="cback"></div>';
      h += '<div class="fly ' + f.kind + '" style="--sx:' + p.x + "%;--sy:" + p.y + "%;animation-delay:" + delay + 'ms">' + inner + "</div>";
    });
    if (S.burst) {
      var bp = seatPos(S.burst.pid);
      h += '<div class="burst" style="--sx:' + bp.x + "%;--sy:" + bp.y + "%;animation-delay:" + -(now - S.burst.start) + 'ms"><div class="seat turn"><div class="nm">' + esc(S.burst.name) + '</div><div class="ydtag">YUDOBA</div></div></div>';
    }
    layer.innerHTML = h;
  }

  function splash(done) {
    var old = document.getElementById("splash");
    if (old) old.remove();
    var el = document.createElement("div");
    el.id = "splash";
    el.innerHTML = '<div class="box"><div class="q q1"></div><div class="q q2"></div><div class="q q3"></div><div class="q q4"></div><div class="in"><b>YUDO</b><span>BA</span></div></div>';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("out"); }, 1650);
    setTimeout(function () { el.remove(); if (done) done(); }, 2050);
  }

  var toastTimer = null;
  function toast(msg, info) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "show" + (info ? " info" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ""; }, 2600);
  }

  // ---------- Açılış (uyanma ekranı) ----------
  var booted = false;
  var fromBoot = SS.take("yd_from_boot") === "1";
  function bootReady() {
    if (booted) return;
    booted = true;
    var wait = fromBoot ? 0 : Math.max(0, 5000 - (Date.now() - (window.__bootT0 || Date.now())));
    setTimeout(function () {
      var b = document.getElementById("boot");
      if (b) b.remove();
      if (!fromBoot) splash();
    }, wait);
  }
  setTimeout(function () { var s = document.getElementById("bootSub"); if (s && !everConnected) s.textContent = "Sunucu uyanıyor, biraz sürebilir…"; }, 8000);

  // ---------- Ekranlar ----------
  function verTag() { return '<p class="ver-tag">' + CLIENT_V + "</p>"; }
  // Yudoba logosu yalnızca ayar ve bilgi ekranlarında görünür
  var BRAND_SCREENS = { home: 1, create: 1, join: 1, how: 1, rules: 1, cards: 1, lobby: 1 };
  function brand() { return '<img class="yd-brand" src="/yudoba-logo.svg" alt="yudoba">'; }
  function backBtn() { return '<button class="back-btn" data-act="back" aria-label="Geri">' + IC.back + "</button>"; }

  function render() {
    var fn = { home: home, create: create, join: join, how: how, rules: rules, cards: cards, lobby: lobby, game: game }[S.screen] || home;
    var focus = document.activeElement && document.activeElement.id;
    var keep = {};
    ["name", "code", "chatIn"].forEach(function (id) { var el = document.getElementById(id); if (el) keep[id] = el.value; });
    var branded = !!BRAND_SCREENS[S.screen] && !(S.screen === "game");
    app.classList.toggle("branded", branded);
    app.innerHTML = fn() + verTag() + (branded ? brand() : "");
    Object.keys(keep).forEach(function (id) { var el = document.getElementById(id); if (el && keep[id] != null) el.value = keep[id]; });
    if (focus) { var f = document.getElementById(focus); if (f) f.focus(); }
    if (S.screen === "game") { layoutHand(); paintFx(); paintClock(); }
    var box = $(".chat-box"); if (box) box.scrollTop = box.scrollHeight;
  }

  function home() {
    return '<div class="page home">' +
      '<div class="hero"><img src="/icon.svg" alt="YUDOBA"></div>' +
      '<button class="btn btn-main" data-act="go" data-arg="create">Oyun kur</button>' +
      '<div class="tiles">' +
      '<button class="tile t-red" data-act="go" data-arg="join">' + IC.hash + "<span>Kodla oyuna<br>katıl</span></button>" +
      '<button class="tile t-yellow" data-act="go" data-arg="how">' + IC.help + "<span>Nasıl<br>kullanılır</span></button>" +
      '<button class="tile t-green" data-act="go" data-arg="cards">' + IC.cards + "<span>Özel<br>kartlar</span></button>" +
      '<button class="tile t-blue" data-act="go" data-arg="rules">' + IC.book + "<span>Kurallar</span></button>" +
      "</div></div>";
  }

  var SECS = [0, 10, 15, 20, 30, 45, 60, 90];
  function secOptions(cur) {
    var h = "", found = false;
    SECS.forEach(function (s) { if (s === cur) found = true; h += '<option value="' + s + '"' + (s === cur ? " selected" : "") + ">" + (s ? s + " saniye" : "Süresiz") + "</option>"; });
    if (!found && cur) h += '<option value="' + cur + '" selected>' + cur + " saniye</option>";
    return h;
  }

  function create() {
    var n = parseInt(LS.get("yd_max", "4"), 10) || 4, sec = parseInt(LS.get("yd_tsec", "0"), 10) || 0;
    var seg = "";
    for (var i = 2; i <= 8; i++) seg += '<button data-act="setMax" data-arg="' + i + '"' + (i === n ? ' class="on"' : "") + ">" + i + "</button>";
    return backBtn() + '<div class="page"><h1>Oyun kur</h1><div class="panel">' +
      '<label for="name">Adın</label><input id="name" maxlength="16" autocomplete="off" value="' + esc(S.me.name) + '">' +
      "<label>Kaç kişilik masa (boş koltuklar bot olur)</label><div class=\"seg\" id=\"maxSeg\">" + seg + "</div>" +
      '<label for="tsec">Sıra süresi</label><select id="tsec">' + secOptions(sec) + "</select>" +
      '<button class="btn btn-main" data-act="create">Kur ve kod al</button></div></div>';
  }

  function join() {
    return backBtn() + '<div class="page"><h1>Kodla oyuna katıl</h1><div class="panel">' +
      '<label for="name">Adın</label><input id="name" maxlength="16" autocomplete="off" value="' + esc(S.me.name) + '">' +
      '<label for="code">Oyun kodu</label><input id="code" class="big" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="' + esc(LS.get("yd_last_code", "")) + '">' +
      '<button class="btn btn-main" data-act="join">Katıl</button>' +
      '<p class="sub" style="margin-top:12px">Koptuysan aynı adla tekrar katıl, kendi yerine dönersin.</p></div></div>';
  }

  function lobby() {
    var st = S.state;
    if (!st) return '<div class="page"><p class="sub">Bağlanıyor…</p></div>';
    var isHost = st.hostId === S.me.id, held = st.held;
    var h = '<div class="page lobby"><h1>' + (held ? "Oyun duraklatıldı" : "Lobi") + "</h1>";
    h += '<div class="panel code-box"><div class="code">' + esc(st.code) + '</div><p class="sub" style="margin:4px 0 0">Bu kodu arkadaşlarına söyle · ' +
      st.players.length + " / " + st.maxPlayers + " oyuncu</p></div>";
    h += '<div class="panel players"><label>Masa sırası (ilk sıradaki başlar)</label>';
    st.seats.forEach(function (id, i) {
      var p = player(id); if (!p) return;
      var tags = [];
      if (p.id === S.me.id) tags.push("sen");
      if (p.id === st.hostId) tags.push("kurucu");
      if (!p.connected && !p.isBot) tags.push("koptu");
      h += '<div class="row"><span class="p-name">' + (i + 1) + ". " + esc(p.name) + (tags.length ? " <small>(" + tags.join(", ") + ")</small>" : "") + "</span>";
      if (isHost && !held) h += '<span class="mv"><button data-act="seat" data-arg="' + i + ',-1"' + (i === 0 ? " disabled" : "") + '>▲</button><button data-act="seat" data-arg="' + i + ',1"' + (i === st.seats.length - 1 ? " disabled" : "") + ">▼</button></span>";
      h += "</div>";
    });
    var empty = st.maxPlayers - st.players.length;
    if (empty > 0 && !held) h += '<p class="sub" style="margin:8px 0 0">' + empty + " boş koltuk oyun başlayınca bot olur.</p>";
    h += "</div>";

    var lv = { easy: "Kolay", mid: "Orta", hard: "Zor" };
    var lock = !isHost || held;
    h += '<div class="panel"><div class="set-grid">';
    h += "<span>Kişi</span>" + (lock ? '<span class="ro-val">' + st.maxPlayers + "</span>" :
      '<div class="stepper"><button data-act="set" data-arg="maxPlayers,-1">−</button><b>' + st.maxPlayers + '</b><button data-act="set" data-arg="maxPlayers,1">+</button></div>');
    h += "<span>Tur</span>" + (lock ? '<span class="ro-val">' + st.roundsTotal + "</span>" :
      '<div class="stepper"><button data-act="set" data-arg="rounds,-1">−</button><b>' + st.roundsTotal + '</b><button data-act="set" data-arg="rounds,1">+</button></div>');
    h += "<span>Süre</span>" + (lock ? '<span class="ro-val">' + (st.turnSeconds ? st.turnSeconds + " saniye" : "Süresiz") + "</span>" :
      '<select id="lobbySec" data-change="sec">' + secOptions(st.turnSeconds) + "</select>");
    h += '<span>Bot</span><div class="seg' + (isHost ? "" : " ro") + '">';
    ["easy", "mid", "hard"].forEach(function (k) { h += '<button data-act="bot" data-arg="' + k + '"' + (st.botLevel === k ? ' class="on"' : "") + ">" + lv[k] + "</button>"; });
    h += "</div></div></div>";

    h += '<div class="actions">';
    if (isHost) {
      h += '<button class="btn btn-main" data-act="' + (held ? "resume" : "start") + '">' + (held ? "Oyuna devam" : "Oyunu başlat") + "</button>";
      h += '<button class="btn btn-danger" data-act="close">Oyunu kapat</button>';
    } else {
      h += '<div class="sub" style="align-self:center">' + (held ? "Kurucu oyunu duraklattı." : "Kurucu başlatınca oyun açılır.") + "</div>";
      h += '<button class="btn btn-ghost" data-act="close">Ayrıl</button>';
    }
    return h + "</div></div>";
  }

  function player(id) {
    var ps = (S.state && S.state.players) || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
    return null;
  }
  function myHand() { return (S.state && S.state.game && S.state.game.hand) || []; }
  function isMyTurn() { var st = S.state; return !!(st && st.game && st.status === "playing" && st.game.actorId === S.me.id && !st.paused); }
  function canStack() {
    var g = S.state.game;
    return myHand().some(function (c) { return canPlay(c, g.top, g.chosenColor, g.stackKind); });
  }

  function game() {
    var st = S.state;
    if (!st || !st.game) return lobby();
    if (st.status === "winnerShow") return endScreen();
    if (S.view === "scores") return scoresScreen();
    if (S.view === "chat") return chatScreen();
    var g = st.game, mine = isMyTurn(), pen = g.isPenalty;
    var meP = player(S.me.id) || {};
    var unread = (st.chat || []).length > S.seenChat;
    var note = st.paused ? "Sıradaki oyuncu koptu. Aynı adla dönmesi bekleniyor." : (g.noticeYou || g.notice);

    var h = '<div class="page game">';
    h += '<div class="topbar"><strong>Oda ' + esc(st.code) + "</strong>" + (st.turnSeconds ? '<span class="clock" id="clock">' + st.turnSeconds + "</span>" : "") +
      '<span class="sp"></span><span class="badge">Tur ' + st.roundNow + "/" + st.roundsTotal + "</span></div>";
    h += '<div class="notice' + (g.noticeYou ? " me" : "") + '">' + esc(note) + "</div>";

    var ydOn = myHand().length === 2 && !meP.saidUno && !(pen && mine);
    var passOn = mine && g.drewOnce && !pen;
    var drawOn = mine && (pen || !g.drewOnce);
    h += '<div class="hud"><div class="hud-left">' +
      '<button class="hbtn yd" data-act="uno" aria-label="YUDOBA"' + (ydOn ? "" : " disabled") + ">" + IC.yd + "</button>" +
      '<button class="hbtn" data-act="pass"' + (passOn ? "" : " disabled") + ">Pas</button>" +
      '<button class="hbtn sm" data-act="view" data-arg="scores">Skor</button>' +
      '<button class="hbtn sm' + (unread ? " unread" : "") + '" data-act="view" data-arg="chat">Mesaj</button></div>';
    h += '<div class="hud-mid">' + (mine ? (pen ? "Ceza sende" : g.drewOnce ? "At ya da Pas" : "Sıra sende") : "") + "</div>";
    h += '<div class="pile"><button data-act="draw"' + (drawOn ? "" : " disabled") + (pen && mine ? ' class="pen">Ceza<br>çek<br>+' + g.penaltyLeft : ">Kart<br>çek") + "</button><small>" + g.deckCount + " kart</small></div></div>";

    // Masa
    h += '<div class="table">';
    var dirRev = g.direction !== 1;
    h += '<div class="felt"><div class="dir' + (dirRev ? " rev" : "") + '">' + IC.dir + (dirRev ? "Ters" : "Saat") + "</div>" + cardHtml(g.top) +
      '<div class="colname col-' + g.chosenColor + '">' + (COLOR_TR[g.chosenColor] || "") + "</div></div>";
    st.seats.forEach(function (id) {
      var p = player(id); if (!p) return;
      var pos = seatPos(id), on = g.actorId === id;
      var cls = "seat" + (on ? (pen ? " pen" : " turn") : "") + (!p.connected && !p.isBot ? " off" : "");
      var backs = ""; for (var k = 0; k < Math.min(p.cardCount, 8); k++) backs += "<i></i>";
      h += '<div class="' + cls + '" style="left:' + pos.x + "%;top:" + pos.y + '%"><div class="nm">' + esc(p.name) + (id === S.me.id ? " (sen)" : "") + "</div>" +
        '<div class="bk">' + backs + '</div><div class="ct">' + p.cardCount + " kart</div>" + (p.saidUno ? '<div class="ydtag">YUDOBA</div>' : "") + "</div>";
    });
    h += "</div>";

    // El
    var top = g.top, stack = g.stackKind;
    var hand = myHand().map(function (c, i) { return { c: c, i: i }; }).sort(handSort);
    h += '<div class="hand-wrap"><div class="hand' + (S.stowed ? " stowed" : "") + '">';
    hand.forEach(function (it) {
      var ok = mine && canPlay(it.c, top, g.chosenColor, stack);
      var cls = (mine ? (ok ? "ok" : "dim") : "") + (S.picked === it.i ? " picked" : "");
      h += cardHtml(it.c, cls, ' data-card="' + it.i + '"');
    });
    h += "</div></div>";

    // Katmanlar
    if (S.pick) h += pickOverlay();
    else if (mine && pen && !canStack()) h += penaltyOverlay();
    return h + "</div>";
  }

  var RANK = { yellow: 0, green: 1, red: 2, blue: 3, black: 4 };
  function handSort(a, b) {
    var d = RANK[a.c.color] - RANK[b.c.color]; if (d) return d;
    var na = a.c.type === "number" ? Number(a.c.value) : 100, nb = b.c.type === "number" ? Number(b.c.value) : 100;
    if (na !== nb) return na - nb;
    return String(a.c.type).localeCompare(String(b.c.type));
  }

  // Kartları ekrana sığacak şekilde dizer; çok kart varsa iki sıra yapar
  function layoutHand() {
    var wrap = $(".hand-wrap"), hand = $(".hand");
    if (!wrap || !hand) return;
    var cards = hand.children, n = cards.length, W = wrap.clientWidth, cw = 66, ch = 100, gap = 46;
    var rows = 1, per = n;
    var step = n > 1 ? Math.min(cw + 4, (W - cw) / (n - 1)) : 0;
    if (n > 1 && step < 24) { rows = 2; per = Math.ceil(n / 2); step = per > 1 ? Math.min(cw + 4, (W - cw) / (per - 1)) : 0; }
    hand.style.width = (cw + Math.max(0, per - 1) * step) + "px";
    hand.style.height = (ch + (rows - 1) * gap) + "px";
    for (var i = 0; i < n; i++) {
      var r = i < per ? 0 : 1, k = r ? i - per : i, el = cards[i];
      el.style.left = (k * step) + "px";
      el.style.top = (r * gap - (el.classList.contains("picked") ? 14 : 0)) + "px";
      el.style.zIndex = el.classList.contains("picked") ? 60 : i + 1;
    }
  }

  function pickOverlay() {
    var p = S.pick, c = p.card, st = S.state;
    var others = st.seats.map(player).filter(function (x) { return x && x.id !== S.me.id; });
    var needTarget = c.type === "wtarget2" || c.type === "swap", custom = c.type === "custom";
    var h = '<div class="overlay"><div class="body">';
    h += "<h2>" + esc(cardName(c)) + '</h2><div class="play-card">' + cardHtml(c) + "</div>";
    h += '<p class="sub">Yeni rengi seç</p><div class="colors">';
    ["yellow", "green", "red", "blue"].forEach(function (k) {
      h += '<button class="c-' + k + (p.color === k ? " on" : "") + '" style="background:var(--' + k + ')" data-act="pickColor" data-arg="' + k + '">' + COLOR_TR[k] + "</button>";
    });
    h += "</div>";
    var ready = !!p.color;
    if (needTarget) {
      h += '<p class="sub">' + (c.type === "swap" ? "Elini kiminle değiştireceksin?" : "Kim 2 kart çeksin?") + '</p><div class="targets">';
      others.forEach(function (o) {
        h += '<button class="' + (p.target === o.id ? "on" : "") + '" data-act="pickTarget" data-arg="' + o.id + '"><span>' + esc(o.name) + "</span><span>" + o.cardCount + " kart</span></button>";
      });
      h += "</div>";
      ready = ready && !!p.target;
    }
    if (custom) {
      var sum = 0; Object.keys(p.assign).forEach(function (k) { sum += p.assign[k]; });
      h += '<p class="sub">8 ceza kartını dağıt: <b style="color:var(--accent)">' + sum + " / 8</b></p><div class=\"targets\">";
      others.forEach(function (o) {
        var v = p.assign[o.id] || 0;
        h += '<div class="arow"><span class="p-name">' + esc(o.name) + ' <small>(' + o.cardCount + ' kart)</small></span><div class="stepper"><button data-act="assign" data-arg="' + o.id + ',-1">−</button><b>' + v + '</b><button data-act="assign" data-arg="' + o.id + ',1">+</button></div></div>';
      });
      h += "</div>";
      ready = ready && sum === 8;
    }
    h += "</div>";
    var simple = !needTarget && !custom;
    h += '<div class="foot"><button class="btn btn-ghost" data-act="pickCancel">Vazgeç</button>' +
      (simple ? '<div class="sub" style="align-self:center;text-align:center">Renge dokununca atılır</div>' : '<button class="btn btn-main" data-act="pickOk"' + (ready ? "" : " disabled") + ">Tamam</button>") + "</div>";
    return h + "</div>";
  }

  function penaltyOverlay() {
    var g = S.state.game;
    return '<div class="overlay"><div class="body"><h2>Ceza</h2><div class="pen-big">+' + g.penaltyLeft + "</div>" +
      '<p class="sub">' + esc(g.noticeYou || g.notice) + "</p>" +
      '<button class="btn btn-main" data-act="draw">Cezayı çek (' + g.penaltyLeft + " kart)</button>" +
      '<button class="btn btn-ghost" data-act="view" data-arg="scores">Skor</button></div></div>';
  }

  function lamp() {
    var st = S.state, g = st.game;
    if (!g || st.status !== "playing") return "";
    var p = player(g.actorId), mine = g.actorId === S.me.id;
    return '<div class="lamp' + (mine ? " mine" : "") + '">' + (mine ? "SIRA SENDE — oyuna dön" : "Sıra: " + esc(p ? p.name : "-")) + "</div>";
  }

  function scoreTable() {
    var st = S.state;
    var rows = st.players.slice().sort(function (a, b) { return (a.score + a.timeScore) - (b.score + b.timeScore); });
    var showRound = st.status === "winnerShow";
    var h = '<table class="score-table"><tr><th>Oyuncu</th>' + (showRound ? "<th>Bu tur</th>" : "") + "<th>Kart</th><th>Süre</th><th>Toplam</th></tr>";
    rows.forEach(function (p) {
      var ready = showRound && !st.gameOver && st.readyNext[p.id] ? ' <span class="ok">✓</span>' : "";
      var rp = st.lastRoundPts[p.id] != null ? st.lastRoundPts[p.id] - (p.id === st.lastWinnerId ? (st.winBonus || WIN_BONUS) : 0) : 0;
      h += '<tr class="' + (p.id === S.me.id ? "me" : "") + '"><td>' + esc(p.name) + ready + "</td>" + (showRound ? "<td>" + (rp > 0 ? "+" : "") + rp + "</td>" : "") +
        "<td>" + p.score + "</td><td>" + p.timeScore + "</td><td>" + (p.score + p.timeScore) + "</td></tr>";
    });
    return h + "</table>";
  }

  function scoresScreen() {
    var st = S.state, isHost = st.hostId === S.me.id;
    return '<div class="page"><h1>Skor</h1>' + lamp() + '<div class="scroll"><div class="panel"><p class="sub">Tur ' + st.roundNow + " / " + st.roundsTotal +
      " · Az puan iyidir</p>" + scoreTable() + "</div>" +
      (isHost ? '<button class="btn btn-ghost" data-act="toLobby">Oyunu duraklat (lobiye dön)</button>' : "") + "</div>" +
      '<button class="btn btn-main" data-act="view" data-arg="table">Oyuna dön</button></div>';
  }

  function chatScreen() {
    var st = S.state, msgs = st.chat || [];
    var h = '<div class="page"><h1>Mesajlar</h1>' + lamp() + '<div class="chat-box">';
    if (!msgs.length) h += '<p class="sub">Henüz mesaj yok.</p>';
    msgs.forEach(function (m) { h += '<div style="color:' + chatColor(m.name) + '"><b>' + esc(m.name) + ":</b> " + esc(m.text) + "</div>"; });
    h += '</div><div class="chat-in"><input id="chatIn" maxlength="160" placeholder="Mesaj yaz" autocomplete="off" enterkeyhint="send"><button class="btn btn-main" data-act="chat">Gönder</button></div>';
    return h + '<button class="btn btn-ghost" data-act="view" data-arg="table">Oyuna dön</button></div>';
  }
  var CHAT_COLS = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#c4b5fd", "#4ade80", "#fb923c", "#38bdf8", "#f472b6"];
  function chatColor(name) {
    var s = String(name || ""), h = 0;
    for (var i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return CHAT_COLS[Math.abs(h) % CHAT_COLS.length];
  }

  function endScreen() {
    var st = S.state, isHost = st.hostId === S.me.id;
    var saw = st.sawScores[S.me.id];
    var view = S.endView || (saw ? "scores" : "win");
    var title;
    if (st.gameOver) {
      var best = st.players.slice().sort(function (a, b) { return (a.score + a.timeScore) - (b.score + b.timeScore); })[0];
      title = (best ? esc(best.name) : "?") + " oyunu kazandı";
    } else {
      var w = player(st.lastWinnerId);
      title = (w ? esc(w.name) : "?") + " turu kazandı";
    }
    if (view === "win") {
      return '<div class="page" style="justify-content:center"><div class="panel" style="text-align:center"><p class="sub">Tur ' + st.roundNow + " / " + st.roundsTotal +
        (st.gameOver ? " · Oyun bitti" : " bitti") + '</p><div class="win-title">' + title + "</div>" +
        (st.gameOver ? '<p class="sub">En düşük toplam puan kazanır.</p>' : "") +
        '<button class="btn btn-main" data-act="seeScores">Skor tabelası</button></div></div>';
    }
    var nReady = st.players.filter(function (p) { return st.readyNext[p.id]; }).length;
    var h = '<div class="page"><h1>Skor</h1><div class="scroll"><div class="panel"><p class="sub">' + title + " · Tur " + st.roundNow + " / " + st.roundsTotal + "</p>" + scoreTable() + "</div></div>";
    if (!st.gameOver) {
      if (!st.readyNext[S.me.id]) h += '<button class="btn btn-main" data-act="ready">Sonraki tur</button><p class="sub" style="text-align:center;margin-top:6px">Herkes basınca tur başlar (' + nReady + "/" + st.players.length + ")</p>";
      else h += '<p class="sub" style="text-align:center">Hazırsın. Diğerleri bekleniyor (' + nReady + "/" + st.players.length + ")</p>";
    } else {
      if (isHost) h += '<button class="btn btn-main" data-act="again">Aynı odayla yeni oyun</button>';
      h += '<button class="btn btn-ghost" data-act="exit">Ana ekran</button>';
    }
    return h + '<button class="btn btn-ghost" data-act="endWin">Geri</button></div>';
  }

  // ---------- Bilgi sayfaları ----------
  function infoPage(title, body) { return backBtn() + '<div class="page"><h1>' + title + '</h1><div class="scroll">' + body + "</div></div>"; }
  function P(t, s) { return '<div class="panel"><b>' + t + '</b><p class="sub" style="margin:6px 0 0">' + s + "</p></div>"; }

  function how() {
    return infoPage("Nasıl kullanılır",
      P("1. Oyun kur", "Adını, masadaki kişi sayısını ve sıra süresini seç. 4 haneli kodu arkadaşlarına söyle. Boş koltuklar oyun başlayınca bot olur; tek başına da oynayabilirsin.") +
      P("2. Katıl", "Safari ya da Chrome ile aç (WhatsApp içindeki tarayıcı değil). Adını ve kodu yaz. Koptuysan aynı adla katıl, kendi yerine dönersin.") +
      P("3. Lobi", "Kurucu masa sırasını, tur sayısını, süreyi ve bot zorluğunu ayarlar, sonra Oyunu başlat der.") +
      P("4. Kart atmak", "Karta bir kez dokun, kart kalkar. İkinci dokunuşta atılır. Sarı çerçeveli kartlar atılabilir.") +
      P("5. Kart çekmek", "Desteye dokun. Cezasız sırada 1 kart çekersin, sonra at ya da Pas. Ceza gelince ekranda Cezayı çek butonu çıkar.") +
      P("6. Elini gizle", "Kartlarını aşağı kaydırırsan gizlenir, yukarı kaydırınca açılır.") +
      P("7. YUDOBA", "2 kartın kalınca YUDOBA butonuna bas. Basmadan tek karta düşersen 2 ceza kartı çekersin.") +
      P("8. Skor ve mesaj", "Skor ve Mesaj butonları oyundan çıkarmaz, Oyuna dön ile geri dönersin. Yeni mesaj gelince Mesaj butonu yeşil olur.") +
      P("9. Ana ekrana ekle", "iPhone: Safari'de Paylaş → Ana Ekrana Ekle. Android: Chrome menüsü → Ana ekrana ekle. Güncellemeler kendiliğinden gelir."));
  }

  // Küçük kart görseli ve işaret
  function mini(c, mark) {
    return '<span class="mini' + (mark === "no" ? " no" : "") + '">' + cardHtml(c) + (mark ? '<i class="mk ' + mark + '">' + (mark === "ok" ? "✓" : "✕") + "</i>" : "") + "</span>";
  }
  function N(color, v) { return { color: color, type: "number", value: v }; }
  function K(color, t) { return { color: color, type: t, value: t }; }
  function RS(num, title, body) {
    return '<section class="rule"><div class="rh"><span class="rn">' + num + "</span><h2>" + title + "</h2></div>" + body + "</section>";
  }
  function arrow() { return '<span class="ar">→</span>'; }

  function rules() {
    var h = "";
    h += RS(1, "Amaç",
      '<div class="flow">' + mini(N("red", 4)) + mini(N("blue", 7)) + mini(K("green", "skip")) + arrow() + '<span class="pill ok">Elini ilk bitiren turu kazanır</span></div>' +
      '<p class="sub">Seçilen tur sayısı bitince <b>en düşük toplam puanı</b> olan oyunu kazanır.</p>');
    h += RS(2, "Başlangıç",
      '<div class="flow"><span class="fan">' + mini(N("yellow", 2)) + mini(N("red", 6)) + mini(N("blue", 1)) + mini(K("green", "draw2")) + mini(N("green", 8)) + mini(K("black", "wild")) + mini(N("blue", 5)) + '</span><span class="pill">7 kart</span></div>' +
      '<p class="sub">2–8 koltuk; boş koltuklar bot olur. Ortaya her zaman bir <b>sayı kartı</b> açılır. İlk yön saat yönüdür.</p>');
    h += RS(3, "Hangi kart atılır?",
      '<div class="match"><div class="top">' + mini(N("red", 5)) + '<span class="cap">Üstteki kart</span></div><div class="opts">' +
      '<div>' + mini(N("red", 8), "ok") + '<span class="cap">Aynı renk</span></div>' +
      '<div>' + mini(N("blue", 5), "ok") + '<span class="cap">Aynı sayı</span></div>' +
      '<div>' + mini(K("black", "wild"), "ok") + '<span class="cap">Siyah kart</span></div>' +
      '<div>' + mini(N("green", 2), "no") + '<span class="cap">Uymuyor</span></div></div></div>' +
      '<p class="sub">Atla, Ters ve +2 ise aynı renge ya da aynı türdeki karta atılır.</p>');
    h += RS(4, "Kart çekmek ve Pas",
      '<div class="flow"><span class="pill">Desteye dokun</span>' + arrow() + '<span class="pill">1 kart çek</span>' + arrow() + '<span class="pill ok">At ya da Pas</span></div>' +
      '<p class="sub">Atacak kartın olsa bile çekebilirsin. Cezasız sırada en fazla <b>1 kart</b> çekilir; sıra kendiliğinden geçmez.</p>');
    h += RS(5, "Ceza kartları",
      '<div class="flow">' + mini(K("blue", "draw2")) + '<span class="cap">gelince sıradaki oyuncu ya:</span></div>' +
      '<div class="choice"><span class="cl">A</span>' + mini(K("red", "draw2"), "ok") + '<span class="cap">Elindeki herhangi renk +2\'yi atar, yığın büyür, ceza bir sonrakine geçer</span></div>' +
      '<div class="choice"><span class="cl">B</span><span class="pill pen">Cezayı çeker</span>' + arrow() + '<span class="pill ok">Sonra oynar</span></div>' +
      '<p class="sub"><b>Cezayı çeken sırasını kaybetmez.</b> Yalnızca +2 üstüne +2 atılabilir; Joker +4, Joker +2, Hedef +2 ve Özel Joker 8 cezası çekilmek zorundadır. Hedef +2 ve Özel Joker 8 cezası bitince sıra, kartı atanın yanındakine geçer.</p>' +
      '<div class="match"><div class="top">' + mini(K("black", "wild4")) + '<span class="cap">Joker +4 nereye?</span></div><div class="opts">' +
      '<div>' + mini(N("green", 3), "ok") + '<span class="cap">Sayı</span></div>' +
      '<div>' + mini(K("black", "wild"), "ok") + '<span class="cap">Joker</span></div>' +
      '<div>' + mini(K("red", "skip"), "no") + '<span class="cap">Atla</span></div>' +
      '<div>' + mini(K("blue", "draw2"), "no") + '<span class="cap">+2</span></div></div></div>');
    h += RS(6, "YUDOBA",
      '<div class="flow">' + mini(N("red", 3)) + mini(N("blue", 9)) + arrow() + '<span class="ydb">' + IC.yd + '</span><span class="pill ok">Bas</span></div>' +
      '<p class="sub">2 kartın kaldığında, cezan yokken YUDOBA butonuna bas. Basmadan tek karta düşersen <b>2 ceza kartı</b> çekersin.</p>');
    var groups = [
      [5, [N("yellow", 7)], "Sayı kartları"],
      [10, [K("green", "skip"), K("red", "reverse"), K("blue", "draw2"), K("black", "wdraw2"), K("black", "wtarget2"), K("black", "wskip2")], "Atla, Ters, +2, Joker +2, Hedef +2, Çift Atla"],
      [20, [K("black", "wild"), K("black", "wild4"), K("black", "swap"), K("black", "shuffle")], "Joker, Joker +4, El Değiş, El Karıştır"],
      [30, [K("black", "skipall"), K("black", "custom")], "Herkesi Atla, Özel Joker 8"]
    ];
    var pt = '<div class="pts">';
    groups.forEach(function (g) {
      pt += '<div class="pr"><b class="pv">' + g[0] + '</b><div><div class="pc">' + g[1].map(function (c) { return mini(c); }).join("") + '</div><span class="cap">' + g[2] + "</span></div></div>";
    });
    pt += '<div class="pr win"><b class="pv">−' + WIN_BONUS + '</b><div><span class="cap">Turu bitiren oyuncunun puanından düşülür</span></div></div></div>';
    h += RS(7, "Puanlar", pt + '<p class="sub">Tur bitince elinde kalan her kart için yukarıdaki puan yazılır. <b>Az puan iyidir.</b> Süreli oyunda süre dolunca sıradaki oyuncu +1 süre puanı alır.</p>');
    h += RS(8, "Diğer",
      '<ul class="ls"><li><b>Deste biterse:</b> yere atılan kartlar karıştırılıp yeni deste olur.</li>' +
      '<li><b>Botlar:</b> kopan oyuncunun yerine bot geçer; aynı adla dönen kendi yerini alır. Oyun sürerken gelen yeni kişi bir botun yerini alır.</li>' +
      '<li><b>Boş oda:</b> odada insan kalmazsa oda yaklaşık 45 saniye sonra kapanır.</li>' +
      '<li><b>Özel kartlar:</b> her kartın ayrıntısı Özel kartlar sayfasında.</li></ul>');
    return infoPage("Kurallar", h);
  }

  function cards() {
    var order = ["skip", "reverse", "draw2", "wild", "wild4", "custom", "wdraw2", "wtarget2", "wskip2", "swap", "shuffle", "skipall", "number"];
    var sample = { number: "yellow", skip: "green", reverse: "red", draw2: "blue" };
    var h = "";
    order.forEach(function (t) {
      var info = CARD_INFO[t];
      var c = { color: sample[t] || "black", type: t, value: t === "number" ? 7 : t };
      h += '<div class="panel guide">' + cardHtml(c) + "<div><b>" + info.name + '</b><p class="sub" style="margin:0">' + info.text + '</p><div class="cnt">' + info.count + " · elde kalırsa " + info.pts + " puan</div></div></div>";
    });
    h += '<div class="panel"><b>Deste toplamı: 118 kart</b><p class="sub" style="margin:6px 0 0">100 renkli kart (sayı, Atla, Ters, +2) ve 18 siyah kart.</p></div>';
    return infoPage("Özel kartlar", h);
  }

  // ---------- Saat ----------
  function paintClock() {
    var el = document.getElementById("clock");
    if (!el || !S.state || !S.state.turnSeconds) return;
    var left = S.clockEnd ? Math.max(0, Math.ceil((S.clockEnd - Date.now()) / 1000)) : S.state.turnSeconds;
    el.textContent = String(left);
    el.className = "clock" + (left <= 3 ? " warn" : "");
  }
  setInterval(paintClock, 250);

  // ---------- Etkileşim ----------
  function go(screen) {
    S.from = S.screen;
    S.screen = screen;
    render();
    if (screen === "create" || screen === "join") holdScreen();
  }
  function back() {
    var st = S.state;
    if (st && (S.screen === "how" || S.screen === "rules" || S.screen === "cards")) S.screen = st.status === "lobby" ? "lobby" : "game";
    else S.screen = "home";
    render();
  }

  function readName() {
    var el = document.getElementById("name");
    var n = el ? el.value.replace(/\s+/g, " ").trim().slice(0, 16) : "";
    return n;
  }

  var ACTIONS = {
    go: go,
    back: back,
    setMax: function (n) { LS.set("yd_max", n); var seg = $("#maxSeg"); if (seg) Array.prototype.forEach.call(seg.children, function (b) { b.classList.toggle("on", b.getAttribute("data-arg") === n); }); },
    create: function () {
      var name = readName();
      if (!name) return toast("Adını yaz.");
      S.me.name = name; LS.set("yd_name", name);
      var sec = ($("#tsec") || {}).value || "0";
      LS.set("yd_tsec", sec);
      socket.emit("create", { name: name, maxPlayers: LS.get("yd_max", "4"), turnSeconds: sec });
    },
    join: function () {
      var name = readName(), code = (($("#code") || {}).value || "").replace(/\D/g, "");
      if (!name) return toast("Adını yaz.");
      if (code.length !== 4) return toast("4 haneli oyun kodunu yaz.");
      S.me.name = name; LS.set("yd_name", name); LS.set("yd_last_code", code);
      socket.emit("join", { name: name, code: code, token: S.me.token });
    },
    seat: function (arg) {
      var a = arg.split(","), i = +a[0], j = i + +a[1], seats = S.state.seats.slice();
      if (j < 0 || j >= seats.length) return;
      var t = seats[i]; seats[i] = seats[j]; seats[j] = t;
      socket.emit("setSeats", { seats: seats });
    },
    set: function (arg) {
      var a = arg.split(","), st = S.state, d = {};
      if (a[0] === "rounds") d.rounds = Math.max(1, Math.min(15, st.roundsTotal + +a[1]));
      if (a[0] === "maxPlayers") d.maxPlayers = Math.max(2, Math.min(8, st.maxPlayers + +a[1]));
      socket.emit("settings", d);
    },
    bot: function (k) { if (S.state.hostId === S.me.id) socket.emit("settings", { botLevel: k }); },
    start: function () { socket.emit("start"); },
    resume: function () { socket.emit("resumeGame"); },
    close: function () {
      var host = S.state && S.state.hostId === S.me.id;
      if (host && !confirm("Oyunu herkes için kapatmak istiyor musun?")) return;
      socket.emit("leave"); leaveLocal();
    },
    exit: function () {
      var st = S.state, host = st && st.hostId === S.me.id;
      if (host && !confirm("Oda herkes için kapanacak. Emin misin?")) return;
      socket.emit("leave"); leaveLocal();
    },
    uno: function () { socket.emit("uno"); },
    pass: function () { S.picked = null; socket.emit("pass"); },
    draw: function () { S.picked = null; socket.emit("draw"); },
    view: function (v) { S.view = v; if (v === "chat") S.seenChat = (S.state.chat || []).length; render(); },
    chat: function () {
      var el = $("#chatIn"), t = el ? el.value.trim() : "";
      if (!t) return;
      socket.emit("chat", { text: t }); el.value = "";
    },
    toLobby: function () { if (confirm("Oyunu duraklatıp lobiye dönmek istiyor musun?")) socket.emit("toLobby"); },
    seeScores: function () { S.endView = "scores"; socket.emit("sawScores"); render(); },
    endWin: function () { S.endView = "win"; render(); },
    ready: function () { socket.emit("readyNext"); },
    again: function () { socket.emit("again"); },
    pickColor: function (k) {
      S.pick.color = k;
      var t = S.pick.card.type;
      if (t !== "wtarget2" && t !== "swap" && t !== "custom") return sendPick();
      render();
    },
    pickTarget: function (id) { S.pick.target = id; render(); },
    assign: function (arg) {
      var a = arg.split(","), id = a[0], as = S.pick.assign, sum = 0;
      Object.keys(as).forEach(function (k) { if (k !== id) sum += as[k]; });
      as[id] = Math.max(0, Math.min(8 - sum, (as[id] || 0) + +a[1]));
      render();
    },
    pickCancel: function () { S.pick = null; render(); },
    pickOk: sendPick
  };

  function sendPick() {
    var p = S.pick; if (!p) return;
    var assign = Object.keys(p.assign).filter(function (k) { return p.assign[k] > 0; }).map(function (k) { return { playerId: k, n: p.assign[k] }; });
    socket.emit("play", { cardIndex: p.i, chosenColor: p.color, targetId: p.target, assign: assign });
    S.pick = null; S.picked = null;
    render();
  }

  function tapCard(i) {
    var st = S.state; if (!st || !st.game) return;
    if (S.stowed) { S.stowed = false; render(); return; }
    if (S.picked !== i) { S.picked = i; render(); return; }
    var g = st.game, c = myHand()[i];
    if (!c) return;
    if (!isMyTurn()) return toast("Sıra sende değil.");
    if (!canPlay(c, g.top, g.chosenColor, g.stackKind)) return toast("Bu kart oynanamaz.");
    if (NEEDS_COLOR[c.type]) { S.pick = { i: i, card: c, color: null, target: null, assign: {} }; render(); return; }
    S.picked = null;
    socket.emit("play", { cardIndex: i });
  }

  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-card]");
    if (card) return tapCard(+card.getAttribute("data-card"));
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    var fn = ACTIONS[el.getAttribute("data-act")];
    if (fn) fn(el.getAttribute("data-arg"));
  });
  document.addEventListener("change", function (e) {
    if (e.target.getAttribute("data-change") === "sec") socket.emit("settings", { turnSeconds: e.target.value });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (e.target.id === "chatIn") ACTIONS.chat();
    else if (e.target.id === "code") ACTIONS.join();
    else if (e.target.id === "name" && S.screen === "join") { var c = $("#code"); if (c) c.focus(); }
  });

  // El kaydırma: aşağı gizler, yukarı açar
  var sw = null;
  document.addEventListener("touchstart", function (e) {
    if (!e.target.closest(".hand-wrap") || !e.touches[0]) { sw = null; return; }
    sw = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!sw) return;
    var t = e.changedTouches && e.changedTouches[0]; if (!t) return;
    var dy = t.clientY - sw.y, dx = t.clientX - sw.x; sw = null;
    if (Math.abs(dy) < 40 || Math.abs(dy) < Math.abs(dx) + 10) return;
    var want = dy > 0;
    if (want !== S.stowed) { S.stowed = want; S.picked = null; var h = $(".hand"); if (h) h.classList.toggle("stowed", want); if (!want) render(); }
  }, { passive: true });
  // Sayfa kaymasını engelle (kaydırılabilir alanlar hariç)
  document.addEventListener("touchmove", function (e) {
    if (e.target.closest(".scroll, .chat-box, .players, .targets")) return;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  window.addEventListener("resize", function () { if (S.screen === "game") layoutHand(); });

  // ---------- Ekran açık kalsın ----------
  var wake = null;
  function holdScreen() {
    try {
      if (wake || !navigator.wakeLock) return;
      navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {});
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) holdScreen(); });
  document.addEventListener("pointerdown", holdScreen, true);

  if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("/sw.js"); } catch (e) {} }

  render();
})();
