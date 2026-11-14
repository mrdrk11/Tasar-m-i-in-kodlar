# Tanrıverdi 48 Restaurant — web sitesi

Tek sayfalık tanıtım sitesi: 3D döner, madalyon, yemekler, taş fırın ve 7/24 sahneleri.
Menü için ayrı sayfa ayrılmıştır (`menu.html`, şimdilik "hazırlanıyor").

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://127.0.0.1:5173
npm run build      # yayına hazır dosyalar: dist/
npm run preview    # dist/ klasörünü dener
```

Yayınlamak için `dist/` klasörünün içindekileri herhangi bir sunucuya koymak yeterlidir
(adresler görelidir, alt klasörde de çalışır).

## Nerede ne var

| Yer | İçerik |
| --- | --- |
| `index.html` | Sayfanın tüm metni ve yapısı |
| `menu.html` | Menü sayfası (yer tutucu) |
| `src/styles/` | Renkler, yazı tipleri (`temel.css`), bölümler (`bolumler.css`) |
| `src/app/sayfa.js` | Kaydırma ve hareket |
| `src/gl/` | 3D sahneler (`scenes/`), ortak araçlar (`kit.js`, `host.js`), yemek modelleri (`food.js`) |
| `public/` | Logo, fotoğraflar, sahnelerin yedek görselleri (`posters/`) |
| `tools/` | Ekran görüntüsü ve kontrol araçları (geliştirme için) |

3D sahnelerde değişiklik yapınca yedek görselleri yenileyin: `node tools/posters.mjs`
(geliştirme sunucusu açıkken).

## Yayından önce teyit edilecekler

- Adres (`index.html` içinde `data-dogrulanacak` ile işaretli).
- "Mutfaktan ayrıca" satırındaki yemekler.
- Yayın adresi belli olunca `og:image` ve `og:url` tam adresle yazılmalı.
- Daha yüksek çözünürlüklü logo ve fotoğraflar gelirse `public/` altındakilerle değiştirin.
