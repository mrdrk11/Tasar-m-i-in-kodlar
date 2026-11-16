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
      { ad: 'Mercimek Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '210 TL', foto: null },
      { ad: 'Ezogelin Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '210 TL', foto: null },
      { ad: 'Kelle Paça Çorbası', aciklama: 'Salata, limon, pide ekmeği ile', fiyat: '310 TL', foto: null },
      { ad: 'Kremalı Tavuk Suyu Çorbası', aciklama: 'salata, limon, pide ekmeği ile', fiyat: '230 TL', foto: null },
      { ad: 'Muğla Kebabı Çorbası', aciklama: 'Salata, limon, pide ekmek ile', fiyat: '430 TL', foto: null },
      { ad: 'İşkembe Çorbası', aciklama: 'Salata, limon, pide ekmek ile', fiyat: '270 TL', foto: null },
    ],
  },
  {
    id: 'firin', ad: 'Fırın Ürünleri',
    renk: { zemin: '#26611d', on: '#fff3dc', vurgu: '#ffac06' },
    urunler: [
      { ad: 'Kıymalı Pide', aciklama: pide, fiyat: '350 TL', foto: null },
      { ad: 'Kıymalı Yumurtalı Pide', aciklama: pide, fiyat: '400 TL', foto: null },
      { ad: 'Kıymalı Kaşarlı Pide', aciklama: pide, fiyat: '400 TL', foto: null },
      { ad: 'Kuşbaşılı Pide', aciklama: pide, fiyat: '500 TL', foto: null },
      { ad: 'Kuşbaşılı Kaşarlı Pide', aciklama: pide, fiyat: '550 TL', foto: null },
      { ad: 'Kuşbaşılı Yumurtalı Pide', aciklama: pide, fiyat: '550 TL', foto: null },
      { ad: 'Kaşarlı Pide', aciklama: pide, fiyat: '350 TL', foto: null },
      { ad: 'Sebzeli Kaşarlı Pide', aciklama: pide, fiyat: '400 TL', foto: null },
      { ad: 'Kaşarlı Yumurtalı Pide', aciklama: pide, fiyat: '400 TL', foto: null },
      { ad: 'Kaşarlı Sucuklu Pide', aciklama: pide, fiyat: '400 TL', foto: null },
      { ad: 'Lahmacun', aciklama: pide, fiyat: '230 TL', foto: null },
      { ad: 'Kavurmalı Yumurtalı Pide', aciklama: pide, fiyat: '550 TL', foto: null },
      { ad: 'Kavurmalı Pide', aciklama: pide, fiyat: '500 TL', foto: null },
      { ad: 'Kavurmalı Kaşarlı Pide', aciklama: pide, fiyat: '550 TL', foto: null },
    ],
  },
  {
    id: 'et-donerler', ad: 'Et Dönerler',
    renk: { zemin: '#c8241a', on: '#fff3dc', vurgu: '#ffd36b' },
    urunler: [
      { ad: 'İskender (Et Dönerden)', aciklama: 'Süzme yoğurt ile', fiyat: '650 TL', foto: null },
      { ad: 'Pilav Üstü Et Döner', aciklama: 'Söğüş soğan, közlenmiş domates, közlenmiş biber, lavaş ile', fiyat: '650 TL', foto: null },
      { ad: 'Et Döner', aciklama: 'Söğüş soğan, közlenmiş domates, közlenmiş biber, lavaş ile', fiyat: '650 TL', foto: null },
      { ad: 'Tombik Ekmek Arası Et Döner', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: null },
      { ad: 'Et Döner Dürüm', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: null },
      { ad: 'Ekmek Arası Et Döner', aciklama: '(65 gr.) Soğan, domates', fiyat: '400 TL', foto: null },
    ],
  },
  {
    id: 'pizzalar', ad: 'Pizzalar',
    renk: { zemin: '#141413', on: '#fff3dc', vurgu: '#ff6a1f' },
    urunler: [
      { ad: 'Vejeteryan Pizza', aciklama: 'Pizza sosu, pizza peyniri, mantar, domates, biber, mısır, zeytin', fiyat: '450 TL', foto: null },
      { ad: 'Etli Special Pizza', aciklama: 'Pizza sosu, pizza peyniri, sucuk, salam, sosis', fiyat: '600 TL', foto: null },
    ],
  },
  {
    id: 'tatlilar', ad: 'Tatlılar',
    renk: { zemin: '#7a1c4a', on: '#fff3dc', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Fırın Sütlaç', aciklama: '1 kişilik', fiyat: '200 TL', foto: null },
    ],
  },
  {
    id: 'icecekler', ad: 'İçecekler',
    renk: { zemin: '#0e56b8', on: '#ffffff', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Coca-Cola (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: null },
      { ad: 'Coca-Cola Zero Sugar (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: null },
      { ad: 'Fanta (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: null },
      { ad: 'Sprite (33 cl.)', aciklama: kutu, fiyat: '100 TL', foto: null },
      { ad: 'Fuse Tea (33 cl.)', aciklama: kutu, fiyat: '110 TL', foto: null },
      { ad: 'Şalgam Suyu (30 cl.)', aciklama: kutu, fiyat: '70 TL', foto: null },
      { ad: 'Ayran (30 cl.)', aciklama: 'Büyük', fiyat: '70 TL', foto: null },
      { ad: 'Yayık Ayran (30 cl.)', aciklama: 'Küçük boy', fiyat: '70 TL', foto: null },
      { ad: 'Meyveli Soda (20 cl.)', aciklama: 'Cam şişe', fiyat: '85 TL', foto: null },
      { ad: 'Soda (20 cl.)', aciklama: 'Cam şişe', fiyat: '60 TL', foto: null },
    ],
  },
];
