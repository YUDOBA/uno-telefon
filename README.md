# YUDOBA

Telefonlardan 4 haneli kodla katılınan, 2–8 kişilik (boş koltuklar bot) kart oyunu. PWA olarak ana ekrana eklenebilir.

Canlı: https://uno-telefon.onrender.com

## Yapı

```
server.js        Express + Socket.io, odalar, sıra süresi, bağlantılar
src/rules.js     Deste, kart adetleri, oynanabilirlik, puan
src/engine.js    Oyun motoru: kart atma, çekme, pas, YUDOBA, tur sonu
src/bots.js      Botlar ve kopan oyuncunun yerine geçme
public/app.js    İstemcinin tamamı (ekranlar, kartlar, animasyonlar)
public/style.css Tüm stiller
public/boot.html Sunucu uyanırken gösterilen bekleme ekranı (service worker ile)
public/sw.js     Service worker (yalnızca bekleme ekranını önbelleğe alır)
public/sfx/      Ses dosyaları (şu an kullanılmıyor)
```

Sunucu otoriterdir: kurallar, botlar ve sıra süresi sunucuda işler; istemci yalnızca gösterir ve istek gönderir.

## Çalıştırma

```
npm install
npm start          # http://localhost:3000
```

## Sürüm

Sürüm numarası üç yerde aynı tutulur: `server.js` (VERSION), `public/app.js` (CLIENT_V) ve `VERSION.txt`.
`public/index.html` içindeki `?v=` ve `public/sw.js` içindeki önbellek adı da aynı numarayla güncellenir.
Sunucu yeni sürüme geçince açık uygulamalar kendini yeniler.

## Render uyku sorunu

Render ücretsiz planında sunucu 15 dakika boşta kalınca uyur. UptimeRobot gibi bir servisle
`https://uno-telefon.onrender.com/health` adresine 10 dakikada bir istek atılırsa sunucu uyumaz.
