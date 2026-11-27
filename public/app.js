/* Dapai istemcisi — tek dosya */
(function () {
  "use strict";
  var CLIENT_V = "V97";

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
  // İç anahtarlar eski kalır (red/yellow/green/blue); Dapai renkleri: Turuncu, Pembe, Turkuaz, Mor
  var COLOR_TR = { red: "Turuncu", yellow: "Pembe", green: "Turkuaz", blue: "Mor" };
  var SYM = {
    red: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 1.5V3.8M10 16.2v2.3M1.5 10h2.3M16.2 10h2.3M4 4l1.6 1.6M14.4 14.4 16 16M16 4l-1.6 1.6M4 16l1.6-1.6"/></g></svg>',
    yellow: '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.6z" fill="currentColor"/></svg>',
    green: '<svg viewBox="0 0 20 20"><path d="M1.5 7.5q4.25-4.5 8.5 0t8.5 0M1.5 13.5q4.25-4.5 8.5 0t8.5 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
    blue: '<svg viewBox="0 0 20 20"><path d="M12.6 2a8 8 0 1 0 5.4 13.4A6.6 6.6 0 0 1 12.6 2z" fill="currentColor"/></svg>'
  };
  var NEEDS_COLOR = { wild: 1, wild4: 1, custom: 1, wdraw2: 1, wtarget2: 1, wskip2: 1, swap: 1, shuffle: 1, skipall: 1, mirror: 1, bomb: 1 };
  var DEFENSE = { shield: 1, mirror: 1 }; // ceza gelince atılabilir

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
    shield: SV('<path d="M12 2.8l7.5 3v5.6c0 4.9-3.3 8.4-7.5 9.8-4.2-1.4-7.5-4.9-7.5-9.8V5.8z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', 2.3),
    mirror: SV('<ellipse cx="12" cy="9" rx="6.2" ry="7"/><path d="M12 16v6.2"/><path d="M9.2 7.8l2.6-2.6M9.4 11.4l5-5"/>', 2.3),
    eye: SV('<path d="M1.8 12s3.7-7 10.2-7 10.2 7 10.2 7-3.7 7-10.2 7S1.8 12 1.8 12z"/><circle cx="12" cy="12" r="3.2"/>', 2.3),
    bomb: SV('<circle cx="10" cy="14.5" r="7.2" fill="currentColor" stroke="none"/><rect x="12.6" y="6.4" width="4.6" height="3.4" rx="1" transform="rotate(45 14.9 8.1)" fill="currentColor" stroke="none"/><path d="M16.6 6.2c.7-1.9 2.2-2.8 3.7-2.3"/><path d="M21.2 1.6v1.2M22.6 3.2h-1.2M20.2 2.2l-.6-.6" stroke-width="1.6"/><circle cx="7.4" cy="12" r="1.6" fill="#fff" stroke="none" opacity=".55"/>', 2),
    gift: SV('<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M12 9v12M3 13.5h18"/><path d="M12 9C10 5 6 4.5 6 7s4 2 6 2zM12 9c2-4 6-4.5 6-2s-4 2-6 2z"/>', 2.1),
    again: SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
    back: '<svg viewBox="0 0 48 48"><path d="M30 8L14 24l16 16" fill="none" stroke="#111" stroke-width="6" stroke-linecap="square"/></svg>',
    dir: SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>', 3),
    hash: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M19 8l-4 32M33 8l-4 32M9 18h32M7 30h32"/></svg>',
    help: '<svg viewBox="0 0 48 48" fill="none" stroke="#111" stroke-width="4.5" stroke-linecap="round"><path d="M16 17c0-6 4-9 8.5-9S33 11 33 16c0 6-8.5 7-8.5 13"/><circle cx="24.5" cy="38" r="1.5" fill="#111"/></svg>',
    cards: '<svg viewBox="0 0 48 48"><rect x="7" y="12" width="18" height="26" rx="3" fill="#fff" transform="rotate(-16 16 25)"/><rect x="15" y="9" width="18" height="27" rx="3" fill="#e6f5e6"/><rect x="23" y="12" width="18" height="26" rx="3" fill="#fff" transform="rotate(14 32 25)"/></svg>',
    book: '<svg viewBox="0 0 48 48"><path d="M6 10h14c3 0 4 2 4 2s1-2 4-2h14v28H28c-2 0-4 2-4 2s-2-2-4-2H6z" fill="#fff"/><path d="M24 12v26" stroke="#1C6DD0" stroke-width="2"/></svg>',
    yd: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#161B2E"/><g transform="rotate(-8 32 24)"><rect x="19" y="5" width="26" height="37" rx="4.5" fill="#F79A2E" stroke="#FFFFFF" stroke-width="2.2"/><path fill="#FFFFFF" d="M26.874 31.255Q25.84 31.255 25.301000000000002 30.716Q24.762 30.177 24.762 29.165V17.835Q24.762 16.823 25.301000000000002 16.284Q25.84 15.745 26.874 15.745H31.186Q35.233999999999995 15.745 37.44499999999999 17.769Q39.656 19.793 39.656 23.489Q39.656 25.337 39.084 26.778Q38.512 28.218999999999998 37.434 29.22Q36.355999999999995 30.221 34.783 30.738Q33.21 31.255 31.186 31.255ZM28.81 27.977H30.921999999999997Q32.088 27.977 32.935 27.691000000000003Q33.782 27.405 34.342999999999996 26.855Q34.903999999999996 26.305 35.179 25.469Q35.454 24.633 35.454 23.489Q35.454 21.201 34.332 20.112000000000002Q33.21 19.023 30.921999999999997 19.023H28.81Z"/></g><path fill="#FFFFFF" d="M17.959250000000004 57.1485Q17.108750000000004 57.1485 16.454000000000004 56.730000000000004Q15.799250000000004 56.3115 15.428000000000004 55.5285Q15.056750000000005 54.7455 15.056750000000005 53.679Q15.056750000000005 52.585499999999996 15.428000000000004 51.816Q15.799250000000004 51.0465 16.454000000000004 50.628Q17.108750000000004 50.2095 17.959250000000004 50.2095Q18.701750000000004 50.2095 19.295750000000005 50.5605Q19.714250000000003 50.817 19.943750000000005 51.168V48.576Q19.943750000000005 47.982 20.254250000000006 47.6715Q20.564750000000004 47.361000000000004 21.145250000000004 47.361000000000004Q21.712250000000004 47.361000000000004 22.029500000000006 47.6715Q22.346750000000004 47.982 22.346750000000004 48.576V55.9065Q22.346750000000004 56.5005 22.043000000000006 56.811Q21.739250000000006 57.1215 21.158750000000005 57.1215Q20.591750000000005 57.1215 20.281250000000004 56.811Q20.024750000000004 56.5545 19.984250000000003 56.1225Q19.768250000000002 56.514 19.336250000000003 56.7705Q18.728750000000005 57.1485 17.959250000000004 57.1485ZM18.728750000000005 55.38Q19.093250000000005 55.38 19.376750000000005 55.19775Q19.660250000000005 55.0155 19.815500000000004 54.64425Q19.970750000000002 54.273 19.970750000000002 53.679Q19.970750000000002 52.7745 19.619750000000003 52.37625Q19.268750000000004 51.978 18.728750000000005 51.978Q18.364250000000006 51.978 18.080750000000005 52.1535Q17.797250000000005 52.329 17.635250000000006 52.70025Q17.473250000000004 53.0715 17.473250000000004 53.679Q17.473250000000004 54.57 17.824250000000006 54.975Q18.175250000000005 55.38 18.728750000000005 55.38Z M25.74575 57.1485Q24.97625 57.1485 24.389000000000003 56.864999999999995Q23.801750000000002 56.5815 23.471000000000004 56.088750000000005Q23.14025 55.596000000000004 23.14025 54.9615Q23.14025 54.2325 23.518250000000002 53.814Q23.896250000000002 53.3955 24.73325 53.21325Q25.57025 53.031 26.96075 53.031H27.473750000000003V52.842Q27.473750000000003 52.356 27.224000000000004 52.1535Q26.97425 51.951 26.36675 51.951Q26.04275 51.951 25.63775 52.02525Q25.23275 52.0995 24.73325 52.2885Q24.368750000000002 52.4235 24.112250000000003 52.32899999999999Q23.85575 52.2345 23.714 52.004999999999995Q23.57225 51.7755 23.579 51.5055Q23.58575 51.2355 23.7545 50.9925Q23.92325 50.7495 24.274250000000002 50.6145Q24.922250000000002 50.3715 25.469 50.290499999999994Q26.01575 50.2095 26.47475 50.2095Q27.58175 50.2095 28.304000000000002 50.52675Q29.02625 50.844 29.384 51.49875Q29.74175 52.1535 29.74175 53.1795V55.9065Q29.74175 56.5005 29.45825 56.811Q29.17475 57.1215 28.63475 57.1215Q28.08125 57.1215 27.79775 56.811Q27.54125 56.541 27.50075 56.055Q27.41975 56.298 27.271250000000002 56.487Q27.02825 56.7975 26.63675 56.973Q26.24525 57.1485 25.74575 57.1485ZM27.473750000000003 54.165H26.96075Q26.43425 54.165 26.09 54.23925Q25.74575 54.3135 25.583750000000002 54.46875Q25.42175 54.624 25.42175 54.867Q25.42175 55.1775 25.6445 55.38Q25.867250000000002 55.5825 26.28575 55.5825Q26.62325 55.5825 26.886499999999998 55.434Q27.14975 55.2855 27.311750000000004 55.02225Q27.473750000000003 54.759 27.473750000000003 54.408Z M31.993250000000003 59.5515Q31.426250000000003 59.5515 31.115750000000002 59.241Q30.80525 58.9305 30.80525 58.3365V51.438Q30.80525 50.8575 31.109 50.547Q31.412750000000003 50.2365 31.979750000000003 50.2365Q32.56025 50.2365 32.87075 50.547Q33.11375 50.8035 33.154250000000005 51.2355Q33.370250000000006 50.844 33.81575 50.574Q34.40975 50.2095 35.17925 50.2095Q36.04325 50.2095 36.698 50.628Q37.35275 51.0465 37.71725 51.816Q38.08175 52.585499999999996 38.08175 53.679Q38.08175 54.7455 37.71725 55.5285Q37.35275 56.3115 36.698 56.730000000000004Q36.04325 57.1485 35.17925 57.1485Q34.43675 57.1485 33.84275 56.7975Q33.43775 56.5545 33.20825 56.2035V58.3365Q33.20825 58.9305 32.891000000000005 59.241Q32.573750000000004 59.5515 31.993250000000003 59.5515ZM34.42325 55.38Q34.78775 55.38 35.0645 55.19775Q35.34125 55.0155 35.50325 54.64425Q35.66525 54.273 35.66525 53.679Q35.66525 52.7745 35.31425 52.37625Q34.96325 51.978 34.42325 51.978Q34.05875 51.978 33.77525 52.1535Q33.49175 52.329 33.329750000000004 52.70025Q33.167750000000005 53.0715 33.167750000000005 53.679Q33.167750000000005 54.57 33.518750000000004 54.975Q33.86975 55.38 34.42325 55.38Z M41.18375 57.1485Q40.41425 57.1485 39.827 56.864999999999995Q39.23975 56.5815 38.909000000000006 56.088750000000005Q38.578250000000004 55.596000000000004 38.578250000000004 54.9615Q38.578250000000004 54.2325 38.956250000000004 53.814Q39.334250000000004 53.3955 40.17125 53.21325Q41.008250000000004 53.031 42.39875000000001 53.031H42.911750000000005V52.842Q42.911750000000005 52.356 42.662000000000006 52.1535Q42.41225 51.951 41.804750000000006 51.951Q41.48075 51.951 41.07575 52.02525Q40.670750000000005 52.0995 40.17125 52.2885Q39.80675 52.4235 39.550250000000005 52.32899999999999Q39.29375 52.2345 39.152 52.004999999999995Q39.010250000000006 51.7755 39.017 51.5055Q39.02375 51.2355 39.1925 50.9925Q39.361250000000005 50.7495 39.712250000000004 50.6145Q40.36025 50.3715 40.907 50.290499999999994Q41.45375 50.2095 41.91275 50.2095Q43.01975 50.2095 43.742000000000004 50.52675Q44.46425000000001 50.844 44.822 51.49875Q45.179750000000006 52.1535 45.179750000000006 53.1795V55.9065Q45.179750000000006 56.5005 44.89625000000001 56.811Q44.612750000000005 57.1215 44.07275 57.1215Q43.51925 57.1215 43.23575 56.811Q42.97925 56.541 42.938750000000006 56.055Q42.85775 56.298 42.709250000000004 56.487Q42.46625 56.7975 42.07475 56.973Q41.68325 57.1485 41.18375 57.1485ZM42.911750000000005 54.165H42.39875000000001Q41.87225 54.165 41.528000000000006 54.23925Q41.18375 54.3135 41.021750000000004 54.46875Q40.859750000000005 54.624 40.859750000000005 54.867Q40.859750000000005 55.1775 41.0825 55.38Q41.30525 55.5825 41.72375 55.5825Q42.06125 55.5825 42.3245 55.434Q42.58775 55.2855 42.749750000000006 55.02225Q42.911750000000005 54.759 42.911750000000005 54.408Z M47.431250000000006 57.1215Q46.864250000000006 57.1215 46.55375000000001 56.784Q46.24325 56.4465 46.24325 55.812V51.546Q46.24325 50.911500000000004 46.55375000000001 50.574Q46.864250000000006 50.2365 47.431250000000006 50.2365Q48.011750000000006 50.2365 48.32900000000001 50.574Q48.64625 50.911500000000004 48.64625 51.546V55.812Q48.64625 56.4465 48.335750000000004 56.784Q48.02525000000001 57.1215 47.431250000000006 57.1215ZM47.431250000000006 49.278Q46.79675 49.278 46.4525 48.980999999999995Q46.108250000000005 48.684 46.108250000000005 48.117000000000004Q46.108250000000005 47.5635 46.4525 47.26649999999999Q46.79675 46.9695 47.431250000000006 46.9695Q48.09275 46.9695 48.43025 47.26649999999999Q48.76775000000001 47.5635 48.76775000000001 48.117000000000004Q48.76775000000001 48.684 48.43025 48.980999999999995Q48.09275 49.278 47.431250000000006 49.278Z"/></svg>'
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
    skipall: { name: "Herkesi Atla", text: "Her zaman atılır. Renk seçilir, diğer herkes atlanır ve atan tekrar oynar.", count: "2 adet", pts: 30 },
    shield: { name: "Kalkan", text: "Sana ceza gelince hangi renk olursa olsun atılır ve cezanın tamamını siler. Cezasız sırada aynı renge ya da başka Kalkana atılır.", count: "Her renkten 1 · toplam 4", pts: 20, isNew: 1 },
    mirror: { name: "Ayna", text: "Sana ceza gelince atılır, cezanın tamamı cezayı atana geri döner. Cezasız sırada Joker gibi atılır, renk seçilir.", count: "2 adet", pts: 20, isNew: 1 },
    eye: { name: "Göz", text: "Bir oyuncu seçersin, elindeki kartları 5 saniye yalnızca sen görürsün.", count: "Her renkten 1 · toplam 4", pts: 10, isNew: 1 },
    bomb: { name: "Bomba", text: "Her zaman atılır, renk seçilir. 3 hamle sonra o an sırası gelen oyuncu 3 kart çeker.", count: "2 adet", pts: 20, isNew: 1 },
    gift: { name: "Hediye", text: "Elinden bir kart seçip istediğin oyuncuya verirsin.", count: "Her renkten 1 · toplam 4", pts: 10, isNew: 1 }
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
    else if (IC[t] && CARD_INFO[t] && CARD_INFO[t].isNew) { corner = IC[t]; mid = IC[t]; }
    var cr = corner ? '<span class="c tl">' + corner + '</span><span class="c br">' + corner + "</span>" : "";
    var sy = SYM[c.color] ? '<span class="sy tr">' + SYM[c.color] + '</span><span class="sy bl">' + SYM[c.color] + "</span>" : "";
    return cr + sy + '<div class="oval">' + mid + "</div>";
  }
  function cardHtml(c, cls, attrs) {
    return '<div class="ucard ' + c.color + " " + (cls || "") + '" data-t="' + c.type + '"' + (attrs || "") + ">" + cardFace(c) + (c.fresh ? '<span class="fresh-tag">YENİ</span>' : "") + "</div>";
  }
  function cardName(c) {
    if (c.type === "number") return COLOR_TR[c.color] + " " + c.value;
    var n = CARD_INFO[c.type] ? CARD_INFO[c.type].name : "?";
    return c.color === "black" ? n : COLOR_TR[c.color] + " " + n;
  }

  function canPlay(card, top, chosen, stack) {
    if (!card) return false;
    if (!top) return true;
    if (stack) return !!DEFENSE[card.type] || (stack === "draw2" && card.type === "draw2");
    if (card.type === "wild4") return ["number", "wild", "wild4", "custom", "mirror", "bomb"].indexOf(top.type) >= 0;
    if (card.color === "black") return true;
    var color = top.color === "black" ? chosen : top.color;
    if (card.color === color) return true;
    if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
    return card.type !== "number" && card.type === top.type;
  }

  // ---------- Bağlantı ----------
  // Gerçek bağlantı; uygulamalı eğitim açıkken oyun olayları telefondaki alıştırmaya gider
  var io_ = io({ reconnectionDelay: 700, reconnectionDelayMax: 3000 });
  var H = {};
  var T = null; // uygulamalı eğitim durumu
  var socket = {
    on: function (ev, fn) { H[ev] = fn; io_.on(ev, function (d) { if (T && TUT_BLOCK[ev]) return; fn(d); }); },
    emit: function (ev, d) { if (T && tutTake(ev, d)) return; io_.emit(ev, d); }
  };
  var TUT_BLOCK = { session: 1, state: 1, cardFly: 1, cardDraw: 1, dapaiShout: 1, roomLost: 1, roomClosed: 1, errorMsg: 1 };
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
    // Sürükleyerek attığımız kartın animasyonu zaten bizde başladı
    if (d.fromId === S.me.id && S.skipFlyUntil && Date.now() < S.skipFlyUntil) { S.skipFlyUntil = 0; return; }
    addFx({ kind: "play", pid: d.fromId, card: d.card, dur: 1600 });
  });
  socket.on("cardDraw", function (d) { addFx({ kind: "draw", pid: d && d.toId, dur: 800 }); });
  // Göz: seçilen oyuncunun eli 5 saniye görünür
  socket.on("peek", function (d) {
    S.peek = d;
    var mine = d;
    render();
    setTimeout(function () { if (S.peek === mine) { S.peek = null; render(); } }, 5000);
  });
  socket.on("bombBoom", function (d) {
    toast("Bomba patladı! " + (d.playerId === S.me.id ? "Sana" : d.name + " oyuncusuna") + " 3 kart ceza.", true);
    try { if (navigator.vibrate) navigator.vibrate([200, 80, 200]); } catch (e) {}
  });
  socket.on("dapaiShout", function (d) {
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
      var p = f.from || seatPos(f.pid), delay = -(now - f.start);
      var inner = f.kind.indexOf("play") === 0 ? cardHtml(f.card) : '<div class="cback"></div>';
      if (f.mid) { h += '<div class="fly ' + f.kind + '" data-fx="' + f.start + '" style="' + dropStyle(f, now) + '">' + inner + "</div>"; return; }
      h += '<div class="fly ' + f.kind + '" style="--sx:' + p.x + "%;--sy:" + p.y + "%;animation-delay:" + delay + 'ms">' + inner + "</div>";
    });
    if (S.burst) {
      var bp = seatPos(S.burst.pid);
      h += '<div class="burst" style="--sx:' + bp.x + "%;--sy:" + bp.y + "%;animation-delay:" + -(now - S.burst.start) + 'ms"><div class="seat turn"><div class="nm">' + esc(S.burst.name) + '</div><div class="ydtag">DAPAI!</div></div></div>';
    }
    layer.innerHTML = h;
    if (S.fx.some(function (f) { return f.mid; })) startDropLoop();
  }

  // Sürükleyerek atılan kart: tek bir yumuşak eğri (bırakılan yer → kaydırma yönü → masanın ortası)
  function dropStyle(f, now) {
    var MOVE = 1120, t = Math.min(1, Math.max(0, (now - f.start) / MOVE));
    var e = 1 - Math.pow(1 - t, 3);                     // hızlı çıkış, yumuşak iniş; arada duraksama yok
    var a = f.from, c = f.mid, b = { x: 50, y: 50 }, u = 1 - e;
    var x = u * u * a.x + 2 * u * e * c.x + e * e * b.x, y = u * u * a.y + 2 * u * e * c.y + e * e * b.y;
    var rot = f.rot * e, sc = 1.08 - 0.08 * e;
    var fade = now - f.start > MOVE ? Math.max(0, 1 - (now - f.start - MOVE) / (f.dur - MOVE)) : 1;
    return "left:" + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + rot + "deg) scale(" + sc + ");opacity:" + fade;
  }
  var dropLoopOn = false;
  function startDropLoop() {
    if (dropLoopOn) return;
    dropLoopOn = true;
    (function step() {
      var live = S.fx.filter(function (f) { return f.mid; });
      if (!live.length) { dropLoopOn = false; return; }
      var now = Date.now();
      live.forEach(function (f) { var el = document.querySelector('.fly[data-fx="' + f.start + '"]'); if (el) el.setAttribute("style", dropStyle(f, now)); });
      requestAnimationFrame(step);
    })();
  }

  function splash(done) {
    var old = document.getElementById("splash");
    if (old) old.remove();
    var el = document.createElement("div");
    el.id = "splash";
    el.innerHTML = '<img class="lg" src="/dapai-logo.svg" alt="Dapai">';
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
    if (T && S.screen === "game") {
      if (!$(".coach")) { var pg = $(".page"); if (pg) pg.insertAdjacentHTML("afterbegin", coachHtml()); }
      tutDecorate();
    }
    if (S.screen === "game") { layoutHand(); paintFx(); paintClock(); }
    var box = $(".chat-box"); if (box) box.scrollTop = box.scrollHeight;
  }

  function home() {
    return '<div class="page home">' +
      '<div class="hero"><img src="/dapai-logo.svg" alt="Dapai"></div>' +
      '<button class="btn btn-main" data-act="go" data-arg="create">Oyun kur</button>' +
      '<button class="btn btn-tut" data-act="tut">Nasıl oynanır?' + (LS.get("yd_tut_done", "") ? "" : '<span class="new">YENİ</span>') + "<small>2 botla uygulamalı alıştırma</small></button>" +
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
    h += '<div class="panel players"><label>Masa sırası (ilk turu 1. sıradaki başlar, sonra sırayla)</label>';
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
    h += '<div class="topbar"><img class="tb-logo" src="/dapai-logo.svg" alt="Dapai"><strong>' + (T ? "Alıştırma" : "Oda " + esc(st.code)) + "</strong>" + (st.turnSeconds ? '<span class="clock" id="clock">' + st.turnSeconds + "</span>" : "") +
      '<span class="sp"></span>' + (T ? "" : '<span class="badge">Tur ' + st.roundNow + "/" + st.roundsTotal + "</span>") + "</div>";
    if (T) h += coachHtml();
    else h += '<div class="notice' + (g.noticeYou ? " me" : "") + '">' + esc(note) + "</div>";

    var ydOn = myHand().length === 2 && !meP.saidUno && !(pen && mine);
    var passOn = mine && g.drewOnce && !pen;
    var drawOn = mine && (pen || !g.drewOnce);
    h += '<div class="hud"><div class="hud-left">' +
      '<button class="hbtn yd" data-act="dapai" aria-label="Dapai"' + (ydOn ? "" : " disabled") + ">" + IC.yd + "</button>" +
      '<button class="hbtn" data-act="pass"' + (passOn ? "" : " disabled") + ">Pas</button>" +
      '<button class="hbtn sm" data-act="view" data-arg="scores">Skor</button>' +
      '<button class="hbtn sm' + (unread ? " unread" : "") + '" data-act="view" data-arg="chat">Mesaj</button></div>';
    h += '<div class="hud-mid">' + (mine ? (pen ? "Ceza sende" : g.drewOnce ? "At ya da Pas" : "Sıra sende") : "") + "</div>";
    var pileTxt = !drawOn ? "" : (pen ? "Ceza<br>çek<br>+" + g.penaltyLeft : "Kart<br>çek");
    var pileCls = drawOn ? (pen ? "go pen" : "go") : "";
    h += '<div class="pile"><button data-act="draw" class="' + pileCls + '" aria-label="' + (pen && mine ? "Ceza çek" : "Kart çek") + '"' + (drawOn ? "" : " disabled") + ">" + pileTxt + "</button><small>" + g.deckCount + " kart</small></div></div>";

    // Masa
    h += '<div class="table">';
    var dirRev = g.direction !== 1;
    h += '<div class="felt"><div class="dir' + (dirRev ? " rev" : "") + '">' + IC.dir + (dirRev ? "Ters" : "Saat") + "</div>" + cardHtml(g.top) +
      '<div class="colname col-' + g.chosenColor + '">' + (SYM[g.chosenColor] ? '<span class="sy">' + SYM[g.chosenColor] + "</span>" : "") + (COLOR_TR[g.chosenColor] || "") + "</div>" + (g.bomb ? '<div class="bomb-tag" title="Bomba">' + IC.bomb + "<b>" + g.bomb + "</b></div>" : "") + "</div>";
    st.seats.forEach(function (id) {
      var p = player(id); if (!p) return;
      var pos = seatPos(id), on = g.actorId === id;
      var cls = "seat" + (on ? (pen ? " pen" : " turn") : "") + (!p.connected && !p.isBot ? " off" : "");
      var backs = ""; for (var k = 0; k < Math.min(p.cardCount, 8); k++) backs += "<i></i>";
      h += '<div class="' + cls + '" style="left:' + pos.x + "%;top:" + pos.y + '%"><div class="nm">' + esc(p.name) + (id === S.me.id ? " (sen)" : "") + "</div>" +
        '<div class="bk">' + backs + '</div><div class="ct">' + p.cardCount + " kart</div>" + (p.saidUno ? '<div class="ydtag">DAPAI!</div>' : "") + "</div>";
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
    else if (S.peek) h += peekOverlay();
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

  function peekOverlay() {
    var d = S.peek, h = '<div class="overlay peek" data-act="peekClose"><div class="body">';
    h += '<div class="ov-head"><span class="peek-ic">' + IC.eye + "</span><h2>" + esc(d.name) + " oyuncusunun eli</h2></div>";
    h += '<p class="sub">' + d.cards.length + " kart · 5 saniye sonra kapanır</p><div class=\"peek-row\">";
    d.cards.forEach(function (c) { h += mini(c); });
    return h + '</div><p class="sub">Kapatmak için dokun</p></div></div>';
  }
  function pickOverlay() {
    var p = S.pick, c = p.card, st = S.state;
    var others = st.seats.map(player).filter(function (x) { return x && x.id !== S.me.id; });
    var needTarget = c.type === "wtarget2" || c.type === "swap" || c.type === "eye" || c.type === "gift", custom = c.type === "custom";
    var needColor = !!NEEDS_COLOR[c.type], isGift = c.type === "gift";
    var h = '<div class="overlay"><div class="body">';
    h += '<div class="ov-head">' + mini(c) + "<h2>" + esc(cardName(c)) + "</h2></div>";
    var ready = true;
    if (needColor) {
      h += '<p class="sub">Yeni rengi seç</p><div class="colors">';
      ["yellow", "green", "red", "blue"].forEach(function (k) {
        h += '<button class="c-' + k + (p.color === k ? " on" : "") + '" style="background:var(--' + k + ')" data-act="pickColor" data-arg="' + k + '"><span class="sy">' + SYM[k] + "</span>" + COLOR_TR[k] + "</button>";
      });
      h += "</div>";
      ready = !!p.color;
    }
    if (needTarget) {
      var ask = { swap: "Elini kiminle değiştireceksin?", wtarget2: "Kim 2 kart çeksin?", eye: "Kimin eline bakacaksın?", gift: "Hediyeyi kime vereceksin?" };
      h += '<p class="sub">' + ask[c.type] + '</p><div class="targets">';
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
    var rest = myHand().map(function (x, i) { return { c: x, i: i }; }).filter(function (it) { return it.i !== p.i; }).sort(handSort);
    var avail = Math.min(440, window.innerWidth - 32), stepW = rest.length > 1 ? Math.min(50, (avail - 46) / (rest.length - 1)) : 50;
    h += '<div class="ov-hand' + (isGift ? " gift" : "") + '"><p class="sub">' + (isGift ? "Hediye edeceğin kartı seç" : "Elindeki kartlar (" + rest.length + ")") + "</p><div class=\"row\">";
    rest.forEach(function (it, k) {
      var ml = 'style="margin-left:' + (k ? Math.round(stepW - 46) : 0) + 'px"';
      if (isGift) h += '<button class="ovc gsel' + (p.gift === it.i ? " on" : "") + '" ' + ml + ' data-act="pickGift" data-arg="' + it.i + '">' + mini(it.c) + "</button>";
      else h += '<span class="ovc" ' + ml + ">" + mini(it.c) + "</span>";
    });
    h += "</div></div>";
    if (isGift) ready = ready && p.gift != null;
    var simple = needColor && !needTarget && !custom;
    h += '<div class="foot"><button class="btn btn-ghost" data-act="pickCancel">Vazgeç</button>' +
      (simple ? '<div class="sub" style="align-self:center;text-align:center">Renge dokununca atılır</div>' : '<button class="btn btn-main" data-act="pickOk"' + (ready ? "" : " disabled") + ">Tamam</button>") + "</div>";
    return h + "</div>";
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
    var left = showRound ? (st.leftHands || {}) : null;
    var h = '<table class="score-table"><tr><th>Oyuncu</th>' + (showRound ? "<th>Elde</th><th>Bu tur</th>" : "") + "<th>Kart<br>puanı</th><th>Süre</th><th>Toplam</th></tr>";
    rows.forEach(function (p) {
      var ready = showRound && !st.gameOver && st.readyNext[p.id] ? ' <span class="ok">✓</span>' : "";
      var rp = st.lastRoundPts[p.id] != null ? st.lastRoundPts[p.id] - (p.id === st.lastWinnerId ? (st.winBonus || WIN_BONUS) : 0) : 0;
      h += '<tr class="' + (p.id === S.me.id ? "me" : "") + '"><td>' + esc(p.name) + ready + "</td>" + (showRound ? "<td>" + (left[p.id] ? left[p.id].length : 0) + "</td><td>" + (rp > 0 ? "+" : "") + rp + "</td>" : "") +
        "<td>" + p.score + "</td><td>" + p.timeScore + "</td><td>" + (p.score + p.timeScore) + "</td></tr>";
    });
    return h + "</table>";
  }

  // Tur sonunda her oyuncunun elinde kalan kartlar
  function leftCards() {
    var st = S.state, left = st.leftHands; if (!left) return "";
    var rows = st.players.filter(function (p) { return left[p.id] && left[p.id].length; })
      .sort(function (a, b) { return (st.lastRoundPts[b.id] || 0) - (st.lastRoundPts[a.id] || 0); });
    if (!rows.length) return "";
    var h = '<div class="panel left-cards"><p class="sub">Elde kalan kartlar</p>';
    rows.forEach(function (p) {
      h += '<div class="lc-row"><div class="lc-name"><b>' + esc(p.name) + "</b><small>" + left[p.id].length + " kart · " + (st.lastRoundPts[p.id] || 0) + " puan</small></div><div class=\"lc-cards\">";
      left[p.id].map(function (c) { return { c: c }; }).sort(handSort).forEach(function (it) { h += mini(it.c); });
      h += "</div></div>";
    });
    return h + "</div>";
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
    var h = '<div class="page"><h1>Skor</h1><div class="scroll"><div class="panel"><p class="sub">' + title + " · Tur " + st.roundNow + " / " + st.roundsTotal + "</p>" + scoreTable() + "</div>" + leftCards() + "</div>";
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
    var sh = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/></svg>';
    var h = '<button class="btn btn-tut" data-act="tut">Uygulamalı alıştırmayı başlat<small>2 botla, adım adım</small></button>';
    h += RS(1, "Oyun kur",
      '<div class="flow"><div class="mock"><div class="mf">Adın <span class="mv">Fatih</span></div>' +
      '<div class="mseg"><i>2</i><i>3</i><i class="on">4</i><i>5</i><i>6</i></div><div class="mf">Süre <span class="mv">30 sn</span></div></div>' +
      arrow() + '<div class="bigcode">3795</div></div>' +
      '<p class="sub">Adını, kaç kişilik masa kuracağını ve sıra süresini seç. Çıkan <b>4 haneli kodu</b> arkadaşlarına söyle. Boş koltuklar oyun başlayınca bot olur; tek başına da oynayabilirsin.</p>');
    h += RS(2, "Kodla katıl",
      '<div class="flow"><div class="codebox"><i>3</i><i>7</i><i>9</i><i>5</i></div>' + arrow() + '<span class="pill ok">Katıl</span></div>' +
      '<div class="flow" style="margin-top:8px"><span class="pill ok">✓ Safari / Chrome</span><span class="pill bad">✕ WhatsApp içinde</span></div>' +
      '<p class="sub">Bağlantıyı Safari ya da Chrome ile aç. Adını ve kodu yaz. <b>Koptuysan aynı adla</b> katıl, kendi yerine ve kartlarına dönersin.</p>');
    h += RS(3, "Lobi",
      '<div class="mock wide"><div class="srow"><span>1. Fatih <small>(kurucu)</small></span><span class="arw">▲▼</span></div>' +
      '<div class="srow"><span>2. Ali</span><span class="arw">▲▼</span></div><div class="srow bot"><span>3. Bot 1</span><span class="arw">boş koltuk</span></div>' +
      '<div class="flow" style="margin-top:6px"><span class="pill">Tur 3</span><span class="pill">Süresiz</span><span class="pill">Bot: Orta</span></div></div>' +
      '<p class="sub">Kurucu ▲▼ ile masa sırasını, tur sayısını, süreyi ve bot zorluğunu ayarlar, sonra <b>Oyunu başlat</b> der. Her yeni turu masadaki bir sonraki oyuncu başlatır.</p>');
    h += RS(4, "Kart atmak",
      '<div class="steps"><div><span class="frame">' + mini(N("red", 7)) + '</span><span class="cap">Sarı çerçeve: atılabilir</span></div>' + arrow() +
      '<div><span class="lift">' + mini(N("red", 7)) + '</span><span class="cap">1. dokunuş: kart kalkar</span></div>' + arrow() +
      '<div><span class="tocenter">' + mini(N("red", 7)) + '</span><span class="cap">2. dokunuş: atılır</span></div></div>' +
      '<p class="sub">Sarı çerçeveli kartlar o an atılabilir, soluk kartlar atılamaz. İstersen kartı parmağınla <b>yukarı, masaya doğru kaydırarak</b> da atabilirsin. Siyah kartlarda renk seçme ekranı açılır. Yeni çektiğin kartların köşesinde sarı <b>YENİ</b> etiketi olur.</p>');
    h += RS(5, "Kart çekmek ve ceza",
      '<div class="flow"><span class="pilecard">Kart<br>çek</span>' + arrow() + '<span class="pill">1 kart</span>' + arrow() + '<span class="pill ok">At</span><span class="or">ya da</span><span class="pill">Pas</span></div>' +
      '<div class="flow" style="margin-top:8px"><span class="pilecard pen">Ceza<br>çek<br>+4</span><span class="cap" style="flex:1;min-width:150px">Ceza gelince deste maviye döner ve yanıp söner. <b>Desteye dokununca</b> cezanın tamamı çekilir.</span></div>' +
      '<p class="sub">Cezasız sırada 1 kart çekersin; sıra kendiliğinden geçmez, ya atarsın ya da Pas dersin.</p>');
    h += RS(6, "Elini gizle",
      '<div class="steps loose"><div><span class="fan">' + mini(N("blue", 2)) + mini(N("red", 6)) + mini(K("black", "wild")) + '</span><span class="cap">Açık</span></div>' +
      '<span class="swipe">↓</span><div><span class="fan hid">' + mini(N("blue", 2)) + mini(N("red", 6)) + mini(K("black", "wild")) + '</span><span class="cap">Gizli</span></div><span class="swipe">↑</span></div>' +
      '<p class="sub">Kartlarını aşağı kaydırırsan gizlenir, yukarı kaydırınca ya da dokununca açılır. Yanındakiler elini göremez.</p>');
    h += RS(7, "Dapai!",
      '<div class="flow">' + mini(N("green", 3)) + mini(N("yellow", 9)) + '<span class="cap">2 kart kaldı</span>' + arrow() + '<span class="ydb">' + IC.yd + '</span>' + arrow() +
      '<span class="seatmini"><b>Fatih</b><i>DAPAI!</i></span></div>' +
      '<p class="sub">2 kartın kalınca Dapai kartı sarı çerçeveyle yanıp söner, ona bas; adının altında DAPAI! yazar, diğer telefonlar titrer. <b>Basmadan tek karta düşersen 2 ceza kartı</b> çekersin.</p>');
    h += RS(8, "Skor ve mesaj",
      '<div class="flow"><span class="hb">Skor</span><span class="hb">Mesaj</span>' + arrow() + '<span class="hb new">Mesaj</span><span class="cap">yeni mesaj var</span></div>' +
      '<p class="sub">Skor ve Mesaj oyundan çıkarmaz; <b>Oyuna dön</b> ile geri gelirsin. Sıra sana gelince üstte "SIRA SENDE" yazar.</p>');
    h += RS(9, "Ana ekrana ekle",
      '<div class="add"><div><b>iPhone</b><div class="flow"><span class="pill ic">' + sh + '</span>' + arrow() + '<span class="pill">Ana Ekrana Ekle</span></div><span class="cap">Safari\'de Paylaş düğmesi</span></div>' +
      '<div><b>Android</b><div class="flow"><span class="pill ic">⋮</span>' + arrow() + '<span class="pill">Ana ekrana ekle</span></div><span class="cap">Chrome menüsü</span></div></div>' +
      '<p class="sub">Uygulama gibi açılır; güncellemeler kendiliğinden gelir.</p>');
    return infoPage("Nasıl kullanılır", h);
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
      '<div class="choice"><span class="cl">C</span>' + mini(K("green", "shield"), "ok") + mini(K("black", "mirror"), "ok") + '<span class="cap">Kalkan cezayı siler, Ayna cezayı atana geri yollar</span></div>' +
      '<p class="sub"><b>Cezayı çeken sırasını kaybetmez.</b> Kalkan ve Ayna her cezaya karşı atılabilir. Bunların dışında yalnızca +2 üstüne +2 atılabilir; Joker +4, Joker +2, Hedef +2 ve Özel Joker 8 cezası çekilmek zorundadır. Hedef +2 ve Özel Joker 8 cezası bitince sıra, kartı atanın yanındakine geçer.</p>' +
      '<div class="match"><div class="top">' + mini(K("black", "wild4")) + '<span class="cap">Joker +4 nereye?</span></div><div class="opts">' +
      '<div>' + mini(N("green", 3), "ok") + '<span class="cap">Sayı</span></div>' +
      '<div>' + mini(K("black", "wild"), "ok") + '<span class="cap">Joker</span></div>' +
      '<div>' + mini(K("red", "skip"), "no") + '<span class="cap">Atla</span></div>' +
      '<div>' + mini(K("blue", "draw2"), "no") + '<span class="cap">+2</span></div></div></div>');
    h += RS(6, "Dapai!",
      '<div class="flow">' + mini(N("red", 3)) + mini(N("blue", 9)) + arrow() + '<span class="ydb">' + IC.yd + '</span><span class="pill ok">Bas</span></div>' +
      '<p class="sub">2 kartın kaldığında, cezan yokken Dapai butonuna bas. Basmadan tek karta düşersen <b>2 ceza kartı</b> çekersin.</p>');
    var groups = [
      [5, [N("yellow", 7)], "Sayı kartları"],
      [10, [K("green", "skip"), K("red", "reverse"), K("blue", "draw2"), K("black", "wdraw2"), K("black", "wtarget2"), K("black", "wskip2"), K("red", "eye"), K("yellow", "gift")], "Atla, Ters, +2, Joker +2, Hedef +2, Çift Atla, Göz, Hediye"],
      [20, [K("black", "wild"), K("black", "wild4"), K("black", "swap"), K("black", "shuffle"), K("green", "shield"), K("black", "mirror"), K("black", "bomb")], "Joker, Joker +4, El Değiş, El Karıştır, Kalkan, Ayna, Bomba"],
      [30, [K("black", "custom")], "Özel Joker 8"]
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
    var order = ["shield", "mirror", "eye", "bomb", "gift", "skip", "reverse", "draw2", "wild", "wild4", "custom", "wdraw2", "wtarget2", "wskip2", "swap", "shuffle", "number"];
    var sample = { number: "yellow", skip: "green", reverse: "red", draw2: "blue", shield: "green", eye: "red", gift: "yellow" };
    var h = "";
    order.forEach(function (t) {
      var info = CARD_INFO[t];
      var c = { color: sample[t] || "black", type: t, value: t === "number" ? 7 : t };
      h += '<div class="panel guide">' + cardHtml(c) + "<div><b>" + info.name + (info.isNew ? ' <span class="newb">YENİ</span>' : "") + '</b><p class="sub" style="margin:0">' + info.text + '</p><div class="cnt">' + info.count + " · elde kalırsa " + info.pts + " puan</div></div></div>";
    });
    h += '<div class="panel"><b>Deste toplamı: 132 kart</b><p class="sub" style="margin:6px 0 0">112 renkli kart (sayı, Atla, Ters, +2, Kalkan, Göz, Hediye) ve 20 lacivert joker kart.</p></div>';
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

  // ---------- Uygulamalı eğitim (Nasıl oynanır) ----------
  // Gerçek oyun motoru telefonda çalışır; kartlar önceden dizilidir, botlar senaryoya göre oynar.
  function tn(color, v) { return { color: color, type: "number", value: v }; }
  function tk(color, t) { return { color: color, type: t, value: t }; }
  function same(a, b) { return a && b && a.color === b.color && a.type === b.type && String(a.value) === String(b.value); }
  var TK = {
    r7: tn("red", 7), joker: tk("black", "wild"), b2: tk("blue", "draw2"), b1: tn("blue", 1)
  };
  var TUT_STEPS = [
    { say: "Dapai'ye hoş geldin! Ece ve Can adlı iki botla kısa bir el oynayacağız. Her adımda ne yapacağını burada yazacağım.", next: true },
    { say: "Alttakiler senin kartların. Amaç, elindeki kartları herkesten önce bitirmek.", hl: ".hand", next: true },
    { say: "Ortadaki kart Turuncu 5. Üstüne aynı renk ya da aynı sayı atılır. Elinde uyan kart yok.", hl: ".felt .ucard", next: true },
    { say: "Uyan kartın yoksa yanıp sönen desteye dokun ve 1 kart çek.", hl: ".pile button", want: "draw", hint: "Yanıp sönen desteye dokun." },
    { say: "Yeni gelen kart YENİ yazısıyla görünür. Turuncu 7 uyuyor! Kartı masaya doğru yukarı kaydır ya da iki kez dokun. (Uymasaydı Pas'a basardın.)", want: "play", card: TK.r7, hint: "Turuncu 7'yi at." },
    { say: "Can, Hedef +2 ile seni seçti! Ceza varken kart atılmaz. Yanıp sönen \"Ceza çek\" destesine dokun.", hl: ".pile button", want: "draw", hint: "Önce cezayı çek: desteye dokun." },
    { say: "Cezayı çektin; ceza çeken sonra kendisi oynar. Renk Turkuaz ve elinde turkuaz yok. Ama Joker her zaman atılır: Jokeri at, Mor'u seç.", want: "play", card: TK.joker, color: "blue", hint: "Jokeri at." },
    { say: "Can +2 attı. Elinde +2 varsa üstüne atabilirsin; ceza büyür ve sıradakine geçer. Mor +2'ni at!", want: "play", card: TK.b2, hint: "Mor +2'yi at, cezayı Ece'ye geçir." },
    { say: "Ece 4 kart çekti! Üstte Pembe 6 var. Pembe kartlarından birini at.", want: "play", colorOf: "yellow", hint: "Pembe bir kart at." },
    { say: "2 kartın kaldı! Son karttan önce Dapai demelisin: yanıp sönen Dapai kartına bas. Demezsen 2 ceza kartı çekersin.", hl: ".hbtn.yd", want: "dapai", hint: "Önce Dapai kartına bas." },
    { say: "Harika! Şimdi pembe kartını at.", want: "play", colorOf: "yellow", hint: "Pembe kartını at." },
    { say: "Son kartın Mor 1, üstte Turkuaz 1: aynı sayı! At ve turu bitir.", want: "play", card: TK.b1, hint: "Mor 1'i at." },
    { say: "Turu kazandın! Skor tabelasına bak.", hl: "[data-act=seeScores]", want: "seeScores" },
    { say: "Tabloda herkesin elinde kalan kart sayısı ve puanı var. Az puan iyidir, turu bitiren 20 puan kazanır. Aşağıda kimin elinde hangi kartın kaldığı görünür.", hl: ".score-table", next: true },
    { say: "Alıştırma bitti! Gerçek oyunda \"Oyun kur\" ile oda açar, kodu arkadaşlarına verirsin. Diğer özel kartları da öğrenmek ister misin?", end: true }
  ];
  // Botların sırayla atacağı kartlar
  function tutPlan() {
    return {
      ece: [tn("red", 3), tn("blue", 9), tn("blue", 6), tn("yellow", 2), tn("yellow", 1)],
      can: [{ c: tk("black", "wtarget2"), color: "green", target: "me" }, tk("blue", "draw2"), tn("yellow", 6), tn("yellow", 5), tn("green", 1)]
    };
  }
  function tutRoom() {
    var filler = [];
    ["red", "yellow", "green", "blue"].forEach(function (c) { for (var v = 2; v <= 9; v++) filler.push(tn(c, v)); });
    // Desteden çekilecekler (sondan başa): Turuncu 7, ceza: Joker + Pembe 4, Ece'nin 4 cezası
    var deck = filler.concat([tn("yellow", 9), tn("blue", 7), tn("red", 8), tn("green", 2), tn("yellow", 4), tk("black", "wild"), tn("red", 7)]);
    var me = { id: "me", name: S.me.name || "Sen", connected: true, isBot: false };
    return {
      code: "Alıştırma", hostId: "-", status: "playing", roundNow: 1, roundsTotal: 1, roundId: 1, moveSeq: 1,
      players: [me, { id: "ece", name: "Ece", connected: true, isBot: true }, { id: "can", name: "Can", connected: true, isBot: true }],
      seats: ["me", "ece", "can"], scores: {}, timeScores: {}, readyNext: {}, sawScores: {}, chat: [],
      game: {
        deck: deck, discard: [tn("red", 5)],
        hands: {
          me: [tk("blue", "draw2"), tn("blue", 1), tn("yellow", 8)],
          ece: [tn("red", 3), tn("blue", 9), tn("blue", 6), tn("yellow", 2), tn("yellow", 1), tn("green", 5)],
          can: [tk("black", "wtarget2"), tk("blue", "draw2"), tn("yellow", 6), tn("yellow", 5), tn("green", 1), tn("red", 9)]
        },
        currentId: "me", direction: 1, chosenColor: "red", saidUno: {}, winnerId: null, plusStack: 0, stackKind: null,
        drawQueue: [], afterDrawTo: null, pendingDrawn: null, notice: "", noticeYou: {}
      }
    };
  }
  function tutView() {
    var EN = window.DapaiEngine.E, room = T.room, g = room.game;
    var actor = EN.actorOf(g), penal = EN.isPenalty(g), top = g.discard[g.discard.length - 1];
    if (actor !== room._fa) { room._ft = (room._ft || 0) + 1; room._fa = actor; }
    Object.keys(g.hands).forEach(function (id) { g.hands[id].forEach(function (c) { if (c.fresh === true) c.fresh = room._ft; }); });
    var plain = function (c) { return { color: c.color, type: c.type, value: c.value }; };
    var left = null;
    if (room.status === "winnerShow") { left = {}; room.players.forEach(function (p) { left[p.id] = (g.hands[p.id] || []).map(plain); }); }
    return {
      v: CLIENT_V, code: room.code, hostId: room.hostId, maxPlayers: 3, status: room.status, held: false,
      seats: room.seats, roundsTotal: 1, roundNow: 1, roundId: 1, turnSeconds: 0, botLevel: "mid", clockLeftMs: 0, paused: false,
      lastRoundPts: room.lastRoundPts || {}, lastWinnerId: room.lastWinnerId || null, winBonus: WIN_BONUS,
      gameOver: !!room.gameOver, readyNext: {}, sawScores: room.sawScores, chat: [], leftHands: left,
      players: room.players.map(function (p) {
        return { id: p.id, name: p.name, connected: true, isBot: p.isBot, cardCount: (g.hands[p.id] || []).length,
          saidUno: !!g.saidUno[p.id], score: room.scores[p.id] || 0, timeScore: 0 };
      }),
      game: {
        top: plain(top), chosenColor: g.chosenColor, direction: g.direction, actorId: actor,
        notice: g.notice || "", noticeYou: (g.noticeYou && g.noticeYou.me) || "",
        hand: g.hands.me.map(function (c) { return { color: c.color, type: c.type, value: c.value, fresh: !!c.fresh }; }),
        deckCount: g.deck.length, plusStack: g.plusStack || 0, stackKind: penal ? g.stackKind : null, isPenalty: penal,
        penaltyLeft: g.drawQueue.length ? g.drawQueue[0].left : (g.plusStack || 0),
        drewOnce: !!(g.pendingDrawn && g.pendingDrawn.playerId === "me"), winnerId: g.winnerId, bomb: g.bomb ? g.bomb.left : 0
      }
    };
  }
  function tutFlush(fx) {
    (fx && fx.events || []).forEach(function (e) { if (H[e[0]]) H[e[0]](e[1]); });
    H.state(tutView());
  }
  function tutStep() { return T ? TUT_STEPS[T.i] : null; }
  function tutStart() {
    if (!window.DapaiEngine) {
      var sc = document.createElement("script");
      sc.src = "/engine.js?v=" + CLIENT_V.slice(1);
      sc.onload = tutStart;
      sc.onerror = function () { toast("Alıştırma yüklenemedi. Bağlantını kontrol et."); };
      document.head.appendChild(sc);
      return;
    }
    T = { i: 0, busy: false, room: null, plan: tutPlan(), savedId: S.me.id, timer: null };
    T.room = tutRoom();
    S.me.id = "me"; S.state = null; S.roundId = 0; S.view = "table"; S.endView = null; S.fx = [];
    resetRoundUi();
    S.screen = "game";
    H.state(tutView());
    holdScreen();
  }
  function tutStop(screen) {
    if (!T) return;
    if (T.timer) clearTimeout(T.timer);
    S.me.id = T.savedId;
    T = null;
    LS.set("yd_tut_done", "1");
    S.state = null; S.roundId = 0; S.view = "table"; S.endView = null; S.fx = []; resetRoundUi();
    S.screen = screen || "home";
    render();
    // Açık bir oda varsa yeniden bağlan
    var code = LS.get("yd_code", ""), token = LS.get("yd_token", "");
    if (code && token) io_.emit("join", { code: code, token: token, name: S.me.name, silent: true });
  }
  // Seçilen kart bu adımda atılabilir mi
  function tutCardOk(c) {
    var st = tutStep();
    if (!st || st.want !== "play") return false;
    if (st.card) return same(c, st.card);
    if (st.colorOf) return c.color === st.colorOf;
    return true;
  }
  function tutHint() { var st = tutStep(); toast(st && st.hint ? st.hint : "Önce yukarıdaki yönergeyi izle.", true); }
  // Alıştırmadayken oyun olaylarını yakalar
  function tutTake(ev, d) {
    var EN = window.DapaiEngine.E, room = T.room, st = tutStep(), fx = { events: [] }, err = null;
    if (ev === "leave") { tutStop(); return true; }
    if (ev === "sawScores") { room.sawScores.me = true; if (st && st.want === "seeScores") { T.i++; H.state(tutView()); } return true; }
    if (ev === "readyNext" || ev === "again" || ev === "toLobby" || ev === "chat" || ev === "settings") { toast("Alıştırmada bu kullanılmaz.", true); return true; }
    if (ev !== "play" && ev !== "draw" && ev !== "pass" && ev !== "dapai") return false;
    if (T.busy || !st || st.want !== ev) { tutHint(); return true; }
    var hand = room.game.hands.me;
    // Önceki sıralardan kalan YENİ işaretleri silinir
    if (EN.actorOf(room.game) === "me") hand.forEach(function (c) { if (c.fresh && c.fresh !== room._ft) delete c.fresh; });
    if (ev === "play") {
      var c = hand[d.cardIndex];
      if (!c || !tutCardOk(c)) { tutHint(); return true; }
      if (st.color && d.chosenColor !== st.color) { toast("Bu alıştırmada " + COLOR_TR[st.color] + " rengini seç.", true); return true; }
      err = EN.play(room, "me", d, fx);
    } else if (ev === "draw") err = EN.draw(room, "me", fx);
    else if (ev === "dapai") err = EN.sayUno(room, "me", fx);
    else err = EN.pass(room, "me");
    if (err) { toast(err); return true; }
    T.i++;
    tutFlush(fx);
    tutBots();
    return true;
  }
  // Sıra botlardaysa senaryodaki hamleleri yapar
  function tutBots() {
    if (!T) return;
    var EN = window.DapaiEngine.E, room = T.room, g = room.game;
    var actor = room.status === "playing" ? EN.actorOf(g) : null;
    if (!actor || actor === "me") { T.busy = false; render(); return; }
    T.busy = true; render();
    T.timer = setTimeout(function () {
      if (!T) return;
      var fx = { events: [] }, hand = g.hands[actor];
      if (EN.isPenalty(g)) EN.draw(room, actor, fx);
      else {
        var spec = T.plan[actor].shift(), want = spec && (spec.c || spec);
        var i = -1; hand.forEach(function (c, k) { if (i < 0 && same(c, want)) i = k; });
        if (hand.length === 2 && !g.saidUno[actor]) EN.sayUno(room, actor, fx);
        var err = i < 0 ? "yok" : EN.play(room, actor, { cardIndex: i, chosenColor: spec.color, targetId: spec.target }, fx);
        if (err) { EN.draw(room, actor, fx); EN.pass(room, actor); }
      }
      tutFlush(fx);
      tutBots();
    }, 1400);
  }
  function coachHtml() {
    var st = tutStep(); if (!st) return "";
    var who = null;
    if (T.busy && S.state && S.state.game) { var p = player(S.state.game.actorId); who = p ? p.name : null; }
    var h = '<div class="coach' + (T.busy ? " wait" : "") + '"><div class="coach-tx">';
    if (T.busy) h += "<b>" + esc(who || "Botlar") + "</b> oynuyor…" + (S.state && S.state.game && S.state.game.notice ? '<small>' + esc(S.state.game.notice) + "</small>" : "");
    else h += esc(st.say);
    h += "</div>";
    if (!T.busy && st.next) h += '<button class="coach-btn" data-act="tutNext">Devam</button>';
    if (!T.busy && st.end) h += '<div class="coach-end"><button class="coach-btn" data-act="tutEnd" data-arg="cards">Özel kartlar</button><button class="coach-btn" data-act="tutEnd" data-arg="rules">Kurallar</button><button class="coach-btn ghost" data-act="tutEnd" data-arg="home">Ana ekran</button></div>';
    if (!st.end) h += '<button class="coach-x" data-act="tutEnd" data-arg="home" aria-label="Alıştırmadan çık">Çık</button>';
    return h + "</div>";
  }
  // Ekranda vurgulanacak yer
  function tutDecorate() {
    var st = tutStep(); if (!st || T.busy) return;
    var sel = st.hl;
    if (!sel && st.want === "play" && S.state && S.state.game) {
      var hand = myHand(), idx = -1;
      hand.forEach(function (c, k) { if (idx < 0 && tutCardOk(c)) idx = k; });
      if (st.colorOf) { Array.prototype.forEach.call(document.querySelectorAll(".hand .ucard[data-card]"), function (el) { var c = hand[+el.getAttribute("data-card")]; if (c && tutCardOk(c)) el.classList.add("tut-hl"); }); return; }
      if (idx >= 0) sel = '.hand .ucard[data-card="' + idx + '"]';
    }
    if (sel) Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.classList.add("tut-hl"); });
  }

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
      if (T) return tutStop();
      var st = S.state, host = st && st.hostId === S.me.id;
      if (host && !confirm("Oda herkes için kapanacak. Emin misin?")) return;
      socket.emit("leave"); leaveLocal();
    },
    dapai: function () { socket.emit("dapai"); },
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
      var ts = tutStep();
      if (ts && ts.color && k !== ts.color) return toast("Bu alıştırmada " + COLOR_TR[ts.color] + " rengini seç.", true);
      S.pick.color = k;
      var t = S.pick.card.type;
      if (t !== "wtarget2" && t !== "swap" && t !== "custom") return sendPick();
      render();
    },
    pickTarget: function (id) { S.pick.target = id; render(); },
    pickGift: function (i) { S.pick.gift = +i; render(); },
    peekClose: function () { S.peek = null; render(); },
    assign: function (arg) {
      var a = arg.split(","), id = a[0], as = S.pick.assign, sum = 0;
      Object.keys(as).forEach(function (k) { if (k !== id) sum += as[k]; });
      as[id] = Math.max(0, Math.min(8 - sum, (as[id] || 0) + +a[1]));
      render();
    },
    pickCancel: function () { S.pick = null; S.dropFly = null; render(); },
    pickOk: sendPick,
    tut: function () { tutStart(); },
    tutNext: function () { if (T) { T.i++; render(); } },
    tutEnd: function (to) { tutStop(to === "home" ? "home" : to); }
  };

  function sendPick() {
    var p = S.pick; if (!p) return;
    var assign = Object.keys(p.assign).filter(function (k) { return p.assign[k] > 0; }).map(function (k) { return { playerId: k, n: p.assign[k] }; });
    socket.emit("play", { cardIndex: p.i, chosenColor: p.color, targetId: p.target, assign: assign, giftIndex: p.gift });
    if (S.dropFly) { launchDrop(p.card, S.dropFly); S.dropFly = null; }
    S.pick = null; S.picked = null;
    render();
  }

  function tapCard(i) {
    var st = S.state; if (!st || !st.game) return;
    if (S.stowed) { S.stowed = false; render(); return; }
    if (S.picked !== i) { S.picked = i; render(); return; }
    tryPlay(i);
  }
  // Kartı atmayı dener; renk gereken kartta seçim ekranını açar. Atıldıysa ya da ekran açıldıysa true
  // Atmadan önce seçim ekranı gereken kartlar (renk, oyuncu ya da hediye kartı)
  function needsPick(c) { return !!(NEEDS_COLOR[c.type] || c.type === "eye" || (c.type === "gift" && myHand().length > 1)); }
  function tryPlay(i) {
    var st = S.state; if (!st || !st.game) return false;
    var g = st.game, c = myHand()[i];
    if (!c) return false;
    if (!isMyTurn()) { toast("Sıra sende değil."); return false; }
    if (!canPlay(c, g.top, g.chosenColor, g.stackKind)) { toast("Bu kart oynanamaz."); return false; }
    if (T && !tutCardOk(c)) { tutHint(); return false; }
    S.picked = null;
    if (needsPick(c)) { S.pick = { i: i, card: c, color: null, target: null, assign: {}, gift: null }; render(); return true; }
    socket.emit("play", { cardIndex: i });
    return true;
  }

  // Kartı yukarı, masaya doğru sürükleyip bırakınca atılır
  var drag = null, dragEndAt = 0;
  function dragBack(el) {
    el.classList.remove("dragging");
    el.style.transition = "transform .2s ease";
    el.style.transform = "";
    setTimeout(function () { el.style.transition = ""; }, 220);
  }
  document.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(".hand .ucard[data-card]");
    if (!el || S.stowed || S.pick) { drag = null; return; }
    drag = { el: el, i: +el.getAttribute("data-card"), x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
  });
  document.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (dy < -14 && Math.abs(dy) > Math.abs(dx)) { drag.on = true; drag.el.classList.add("dragging"); }
      else return;
    }
    drag.el.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.08)";
  });
  function dragEnd(e, cancel) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (!d.on) return;
    dragEndAt = Date.now();
    var wrap = $(".hand-wrap"), top = wrap ? wrap.getBoundingClientRect().top : 0;
    var c = myHand()[d.i], ok = false;
    var drop = null;
    if (!cancel && (e.clientY < top - 10 || e.clientY - d.y < -110)) {
      drop = dropInfo(d.el, e.clientX - d.x, e.clientY - d.y);
      ok = tryPlay(d.i);
    }
    if (ok && c && !needsPick(c)) { if (d.el.isConnected) d.el.style.opacity = "0"; launchDrop(c, drop); }
    else if (ok && c) S.dropFly = drop; // renk ekranı kapanınca uçacak
    else if (d.el.isConnected) dragBack(d.el);
  }
  // Bırakılan kartın masaya göre konumu ve kaydırma yönü
  function dropInfo(el, dx, dy) {
    var t = $(".table"); if (!t) return null;
    var r = t.getBoundingClientRect(), b = el.getBoundingClientRect();
    var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    var len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, push = Math.min(r.width, r.height) * 0.35;
    return {
      from: { x: (cx - r.left) / r.width * 100, y: (cy - r.top) / r.height * 100 },
      mid: { x: (cx + ux * push - r.left) / r.width * 100, y: (cy + uy * push - r.top) / r.height * 100 },
      rot: ux < -0.05 ? -360 : 360
    };
  }
  function launchDrop(card, drop) {
    if (!drop) return;
    S.skipFlyUntil = Date.now() + 4000;
    addFx({ kind: "play drop", card: { color: card.color, type: card.type, value: card.value }, from: drop.from, mid: drop.mid, rot: drop.rot, dur: 1600 });
  }
  document.addEventListener("pointerup", function (e) { dragEnd(e, false); });
  document.addEventListener("pointercancel", function (e) { dragEnd(e, true); });

  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-card]");
    if (card) { if (Date.now() - dragEndAt < 400) return; return tapCard(+card.getAttribute("data-card")); }
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
