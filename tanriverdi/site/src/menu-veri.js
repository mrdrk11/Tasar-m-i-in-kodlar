// Menu content. Everything the menu page shows comes from this file.
// Names, prices and the "served with" lines are copied word for word from the
// restaurant's Yemeksepeti menu (screenshots, November 2026). Nothing here is
// written from imagination: change it only from the restaurant's own list.
// Where Yemeksepeti showed a campaign price, the regular price is used.
//
// Each category: id, ad (name), renk (zemin = ground, on = text on it,
// vurgu = accent) and urunler (items).
// Each item: ad, aciklama, fiyat and foto (file name inside public/menu/,
// or null until the photograph arrives).
export const TELEFON = '+905522135333';
export const WHATSAPP = 'https://api.whatsapp.com/send/?phone=905522135333';

const pide = 'Köz biber, mevsim salata, limon ile';
const kutu = 'Kutu içecek';

export const KATEGORILER = [
  {
    id: 'corbalar', ad: 'Çorbalar',
    renk: { zemin: '#ffac06', on: '#141413', vurgu: '#a51c10' },
    urunler: [
      { ad: 'Mercimek Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '210 TL', foto: 'mercimek-corbasi.webp' },
      { ad: 'Ezogelin Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '210 TL', foto: 'ezogelin-corbasi.webp' },
      { ad: 'Kelle Paça Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '310 TL', foto: 'kelle-paca-corbasi.webp' },
      { ad: 'Kremalı Tavuk Suyu Çorbası', aciklama: 'salata, limon, pide ekmeği ile', fiyat: '230 TL', foto: 'kremali-tavuk-suyu-corbasi.webp' },
      { ad: 'Muğla Kebabı Çorbası', aciklama: 'Salata, limon, pide ekmek ile', fiyat: '430 TL', foto: 'mugla-kebabi-corbasi.webp' },
      { ad: 'İşkembe Çorbası', aciklama: 'Salata, limon, pide ekmek ile', fiyat: '270 TL', foto: 'iskembe-corbasi.webp' },
    ],
  },
  {
    id: 'firin', ad: 'Fırın Ürünleri',
    renk: { zemin: '#26611d', on: '#fff3dc', vurgu: '#ffac06' },
    urunler: [
      { ad: 'Kıymalı Pide', aciklama: pide, fiyat: '350 TL', foto: 'kiymali-pide.webp' },
      { ad: 'Kıymalı Yumurtalı Pide', aciklama: pide, fiyat: '400 TL', foto: 'kiymali-yumurtali-pide.webp' },
      { ad: 'Kıymalı Kaşarlı Pide', aciklama: pide, fiyat: '400 TL', foto: 'kiymali-kasarli-pide.webp' },
      { ad: 'Kuşbaşılı Pide', aciklama: pide, fiyat: '500 TL', foto: 'kusbasili-pide.webp' },
      { ad: 'Kuşbaşılı Kaşarlı Pide', aciklama: pide, fiyat: '550 TL', foto: 'kusbasili-kasarli-pide.webp' },
      { ad: 'Kuşbaşılı Yumurtalı Pide', aciklama: pide, fiyat: '550 TL', foto: 'kusbasili-yumurtali-pide.webp' },
      { ad: 'Kaşarlı Pide', aciklama: pide, fiyat: '350 TL', foto: 'kasarli-pide.webp' },
      { ad: 'Sebzeli Kaşarlı Pide', aciklama: pide, fiyat: '400 TL', foto: 'sebzeli-kasarli-pide.webp' },
      { ad: 'Kaşarlı Yumurtalı Pide', aciklama: pide, fiyat: '400 TL', foto: 'kasarli-yumurtali-pide.webp' },
      { ad: 'Kaşarlı Sucuklu Pide', aciklama: pide, fiyat: '400 TL', foto: 'kasarli-sucuklu-pide.webp' },
      { ad: 'Lahmacun', aciklama: pide, fiyat: '230 TL', foto: 'lahmacun.webp' },
      { ad: 'Kavurmalı Yumurtalı Pide', aciklama: pide, fiyat: '550 TL', foto: null },
      { ad: 'Kavurmalı Pide', aciklama: pide, fiyat: '500 TL', foto: 'kavurmali-pide.webp' },
      { ad: 'Kavurmalı Kaşarlı Pide', aciklama: pide, fiyat: '550 TL', foto: 'kavurmali-kasarli-pide.webp' },
    ],
  },
  {
    id: 'et-donerler', ad: 'Et Dönerler',
    renk: { zemin: '#c8241a', on: '#fff3dc', vurgu: '#ffd36b' },
    urunler: [
      { ad: 'İskender (Et Dönerden)', aciklama: 'Süzme yoğurt ile', fiyat: '650 TL', foto: 'iskender-et-donerden.webp' },
      { ad: 'Pilav Üstü Et Döner', aciklama: 'Söğüş soğan, közlenmiş domates, közlenmiş biber, lavaş ile', fiyat: '650 TL', foto: 'pilav-ustu-et-doner.webp' },
      { ad: 'Et Döner', aciklama: 'Söğüş soğan, közlenmiş domates, közlenmiş biber, lavaş ile', fiyat: '650 TL', foto: 'et-doner.webp' },
      { ad: 'Tombik Ekmek Arası Et Döner', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: 'tombik-ekmek-arasi-et-doner.webp' },
      { ad: 'Et Döner Dürüm', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: 'et-doner-durum.webp' },
      { ad: 'Ekmek Arası Et Döner', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: 'ekmek-arasi-et-doner.webp' },
      { ad: '3/4 Ekmek Arası Et Döner', aciklama: '(100 gr.) Soğan, domates', fiyat: '550 TL', foto: '3-4-ekmek-arasi-et-doner.webp' },
    ],
  },
  {
    id: 'pizzalar', ad: 'Pizzalar',
    renk: { zemin: '#141413', on: '#fff3dc', vurgu: '#ff6a1f' },
    urunler: [
      { ad: 'Vejeteryan Pizza', aciklama: 'Pizza sosu, pizza peyniri, mantar, domates, biber, mısır, zeytin', fiyat: '450 TL', foto: 'vejeteryan-pizza.webp' },
      { ad: 'Etli Special Pizza', aciklama: 'Pizza sosu, pizza peyniri, sucuk, salam, sosis', fiyat: '600 TL', foto: 'etli-special-pizza.webp' },
    ],
  },
  {
    id: 'tatlilar', ad: 'Tatlılar',
    renk: { zemin: '#7a1c4a', on: '#fff3dc', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Fırın Sütlaç', aciklama: '1 kişilik', fiyat: '200 TL', foto: 'firin-sutlac.webp' },
    ],
  },
  {
    id: 'icecekler', ad: 'İçecekler',
    renk: { zemin: '#0e56b8', on: '#ffffff', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Coca-Cola (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: 'coca-cola-33-cl.webp' },
      { ad: 'Coca-Cola Zero Sugar (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: 'coca-cola-zero-sugar-33-cl.webp' },
      { ad: 'Fanta (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: 'fanta-33-cl.webp' },
      { ad: 'Sprite (33 cl.)', aciklama: kutu, fiyat: '100 TL', foto: 'sprite-33-cl.webp' },
      { ad: 'Fuse Tea (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: 'fuse-tea-33-cl.webp' },
      { ad: 'Şalgam Suyu (30 cl.)', aciklama: kutu, fiyat: '70 TL', foto: 'salgam-suyu-30-cl.webp' },
      { ad: 'Ayran (30 cl.)', aciklama: 'Büyük', fiyat: '70 TL', foto: 'ayran-30-cl.webp' },
      { ad: 'Yayık Ayran (30 cl.)', aciklama: 'Küçük boy', fiyat: '70 TL', foto: null },
      { ad: 'Meyveli Soda (20 cl.)', aciklama: 'Cam şişe', fiyat: '85 TL', foto: null },
      { ad: 'Soda (20 cl.)', aciklama: 'Cam şişe', fiyat: '60 TL', foto: null },
    ],
  },
];
