function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V60</p>"; }
function goHow(){ screen = "how"; err = ""; render(); }
home = function () {
  app.innerHTML =
    "<div class='yd-hero'><img src='/icon.svg' alt='YUDOBA' /><div class='logo'>YUDOBA</div>" +
    "<p class='sub' style='text-align:center;margin:6px 0 0'>Telefonlardan kodla katil</p></div>" +
    "<button class='btn btn-main' onclick='goCreate()'>Oyun kur</button>" +
    "<div class='yd-sqgrid'>" +
    "<button class='btn btn-ghost yd-sq' onclick='goJoin()'>Koda<br>katil</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goHow()'>Nasil<br>kullanilir</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goCards()'>Ozel<br>kartlar</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goCounts()'>Kart<br>sayilari</button>" +
    "<button class='btn btn-ghost yd-sq' onclick='goRules()'>Kurallar</button>" +
    "</div><p class='err'>" + esc(err) + "</p>" + ver();
};
rulesHelp = function () {
  var html = "<h1>Kurallar</h1>";
  html += "<div class='panel'><b>1. Amac</b><p class='sub'>Elini bitiren turi alir. Secilen tur sayisi bitince en dusuk toplam puan oyunu kazanir.</p></div>";
  html += "<div class='panel'><b>2. Kurulum</b><p class='sub'>2-8 koltuk (insan + bot). Herkese 7 kart. Ortaya yalniz sayi karti acilir. Ilk yon saat yonudur.</p></div>";
  html += "<div class='panel'><b>3. Sira</b><p class='sub'>Ustteki kartla ayni renk, ayni sayi veya ayni tur atilir. Atilacak kart varken de cekilebilir. Ceza yoksa turda en fazla 1 kart cekilir; sonra at veya Pas. Cekince sira kendiliginden gecmez.</p></div>";
  html += "<div class='panel'><b>4. +2 yigini</b><p class='sub'>Siradaki 2 ceker veya elindeki herhangi renk +2 ile yigar. Son atilan +2 renginden devam.</p></div>";
  html += "<div class='panel'><b>5. Joker +4</b><p class='sub'>Ustte sayi veya joker varken atilir. Atla / Ters / +2 ustune atilmaz. Siradaki 4 ceker.</p></div>";
  html += "<div class='panel'><b>6. YUDOBA</b><p class='sub'>2 kart kalinca, sira sende ve ceza yemeden YUDOBA butonuna bas. Ceza yedigin anda 2'den fazla kart olursa basilemez. Denmeden son karti atarsan 2 ceza karti.</p></div>";
  html += "<div class='panel'><b>7. Puan</b><p class='sub'>Sayi karti yuzu kadar, ozel kart 10. Turu bitirene -10. Sure dolunca siradaki kisiye +1 sure puani, sayac basa doner. En dusuk toplam kazanir.</p></div>";
  html += "<div class='panel'><b>8. Bot</b><p class='sub'>Bos koltuk Bot 1, Bot 2 olur. Kopan insan Ad (Bot) olur. Ayni adla donus kendi yeri; yeni gelen rastgele dogustan bot alir. Insan kalmazsa oda yaklasik 45 sn sonra kapanir.</p></div>";
  html += "<div class='panel'><b>9. Ozel kartlar</b><p class='sub'>Ayrintilar Ozel kartlar sayfasinda.</p></div>";
  html += "<button class='btn btn-main' onclick='goHome()'>Geri</button>" + ver();
  app.innerHTML = html;
};
function howHelp() {
  var html = "<h1>Nasil kullanilir</h1>";
  html += "<div class='panel'><b>1. Ana ekran</b><p class='sub'>Oyun kur masa acar. Koda katil 4 haneli kod ister. Diger kareler bilgi sayfalaridir.</p></div>";
  html += "<div class='panel'><b>2. Kurma</b><p class='sub'>Ad, kisi sayisi, sureli/suresiz. Kur ve kod al. Lobide tur, bot zorluk, masa sirasi. Oyunu baslat deyince bos koltuklar bot olur. Tek insan yeter.</p></div>";
  html += "<div class='panel'><b>3. Katilma</b><p class='sub'>Safari veya Chrome ile ac (WhatsApp ici tarayici degil). Ad + kod. Kopduysan ayni adi yaz.</p></div>";
  html += "<div class='panel'><b>4. Ana ekrana ekle</b><p class='sub'>iPhone: Safari Paylas, Ana Ekrana Ekle. Android: Chrome menu. Guncelleme icin uygulamayi kapatip ikondan ac.</p></div>";
  html += "<div class='panel'><b>5. Oyun ekrani</b><p class='sub'>Kart: bir bas gorunur, ikinci bas atilir. Cekmek icin desteye bas. El asagi cekilince gizlenir, yukari acilir. YUDOBA butonu 2 kartta basilir.</p></div>";
  html += "<div class='panel'><b>6. Skor ve mesaj</b><p class='sub'>Skor kendiliginden oyuna donmez. Oyuna don ile don. Yeni mesajda Mesaj butonu yesil olur.</p></div>";
  html += "<div class='panel'><b>7. Oda yok</b><p class='sub'>Kurucu lobi acik kalsin, kod 4 rakam olsun. Sunucu uyanirken 30-60 sn bekleyin.</p></div>";
  html += "<button class='btn btn-main' onclick='goHome()'>Geri</button>" + ver();
  app.innerHTML = html;
}
var _cards60 = cardsHelp;
cardsHelp = function () {
  _cards60();
  if (!document.getElementById("btn-to-counts")) {
    var b = document.createElement("button");
    b.id = "btn-to-counts";
    b.className = "btn btn-ghost";
    b.textContent = "Kart sayilari";
    b.onclick = function () { goCounts(); };
    var back = app.querySelector("button.btn-main");
    if (back) back.parentNode.insertBefore(b, back);
    else app.appendChild(b);
  }
};
var _counts60 = countsHelp;
countsHelp = function () {
  _counts60();
  var html = "<h1>Kart sayilari</h1><div class='panel'>";
  html += "<p>Toplam deste: <b>130</b></p>";
  html += "<div class='row'><span>0 (her renkten 1)</span><span>4</span></div>";
  html += "<div class='row'><span>1-9 (her sayi, her renkten 2)</span><span>72</span></div>";
  html += "<div class='row'><span>Atla / Ters / +2 (her biri 8)</span><span>24</span></div>";
  html += "<div class='row'><span>Joker / Joker +4</span><span>4 + 4</span></div>";
  html += "<div class='row'><span>Ozel Joker 8 / El Degis / El Karistir</span><span>2 + 2 + 2</span></div>";
  html += "<div class='row'><span>Joker +2 / Hedef +2 / Cift Atla / Herkesi Atla</span><span>4 + 4 + 4 + 4</span></div>";
  html += "</div><button class='btn btn-ghost' onclick='goCards()'>Ozel kartlara don</button>";
  html += "<button class='btn btn-main' onclick='goHome()'>Ana ekran</button>" + ver();
  app.innerHTML = html;
};
var _render60 = render;
render = function () {
  if (screen === "how") { try { howHelp(); return; } catch (e) { app.innerHTML = "<p class='err'>" + esc(e.message) + "</p>"; return; } }
  _render60();
  var tiles = document.querySelectorAll("button");
  for (var i = 0; i < tiles.length; i++) {
    if ((tiles[i].textContent || "").trim() === "UNO!") {
      tiles[i].innerHTML = "<img src='/icon.svg' alt='' style='width:22px;height:22px;border-radius:6px;vertical-align:middle;margin-right:6px'>YUDOBA";
    }
  }
  var tags = document.querySelectorAll(".seat-uno");
  for (var j = 0; j < tags.length; j++) tags[j].textContent = "YUDOBA";
};
try {
  if (typeof SpeechSynthesisUtterance !== "undefined") {
    var _U = SpeechSynthesisUtterance;
    /* shout text patched in v47 wrapper if present */
  }
} catch (e) {}
var _unoShout60 = null;
socket.on("unoShout", function (d) {
  try {
    if (window.speechSynthesis) {
      var u = new SpeechSynthesisUtterance("YUDOBA");
      u.lang = "tr-TR"; u.rate = 1; window.speechSynthesis.speak(u);
    }
  } catch (e) {}
});
