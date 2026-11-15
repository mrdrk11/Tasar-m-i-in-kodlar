// Menu content. Everything the menu page shows comes from this file.
//
// Each category: id, ad (name), soz (one line), renk (zemin = ground,
// on = text on it, vurgu = accent) and urunler (items).
// Each item: ad, aciklama, fiyat (text such as "270 TL", or null) and
// foto (file name inside public/menu/, or null while the photo is missing).
export const TELEFON = '+905522135333';
export const WHATSAPP = 'https://api.whatsapp.com/send/?phone=905522135333';

export const KATEGORILER = [
  {
    id: 'doner', ad: 'Döner', soz: 'Şişten kesilir, sıcak gelir.',
    renk: { zemin: '#c8241a', on: '#fff3dc', vurgu: '#ffd36b' },
    urunler: [
      { ad: 'Et Döner Dürüm', aciklama: 'Lavaşa sarılı et döner.', fiyat: null, foto: null },
      { ad: 'Tavuk Döner Dürüm', aciklama: 'Odun ateşinde tavuk döner, lavaşta.', fiyat: null, foto: null },
      { ad: 'Pilav Üstü Et Döner', aciklama: 'Tereyağlı pilavın üstünde et döner.', fiyat: null, foto: null },
      { ad: 'İskender', aciklama: 'Pide üstünde et döner, sos ve yoğurt.', fiyat: null, foto: null },
    ],
  },
  {
    id: 'kebap', ad: 'Kebap', soz: 'Ateşin üstünden tabağa.',
    renk: { zemin: '#141413', on: '#fff3dc', vurgu: '#ff6a1f' },
    urunler: [
      { ad: 'Muğla Kebabı', aciklama: 'Kendi suyunda pişen parça kuzu eti.', fiyat: null, foto: null },
      { ad: 'Adana Kebap', aciklama: 'Zırh kıyması, közde.', fiyat: null, foto: null },
      { ad: 'Adana Dürüm', aciklama: 'Adana kebap, lavaşa sarılı.', fiyat: null, foto: null },
    ],
  },
  {
    id: 'firin', ad: 'Pide & Lahmacun', soz: 'Taş fırından.',
    renk: { zemin: '#26611d', on: '#fff3dc', vurgu: '#ffac06' },
    urunler: [
      { ad: 'Kıymalı Pide', aciklama: 'Taş fırında, kıymalı.', fiyat: null, foto: null },
      { ad: 'Lahmacun', aciklama: 'İnce açılır, taş fırında pişer.', fiyat: null, foto: null },
    ],
  },
  {
    id: 'corba', ad: 'Çorba', soz: 'Günün her saatinde sıcak.',
    renk: { zemin: '#ffac06', on: '#141413', vurgu: '#a51c10' },
    urunler: [
      { ad: 'Muğla Kebabı Çorbası', aciklama: 'Muğla kebabının etiyle.', fiyat: null, foto: null },
    ],
  },
  {
    id: 'menuler', ad: 'Menüler', soz: 'Yanında içeceğiyle.',
    renk: { zemin: '#0e56b8', on: '#ffffff', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Efsane Et Döner Menü', aciklama: null, fiyat: null, foto: null },
      { ad: 'Efsane İskender Menü', aciklama: null, fiyat: null, foto: null },
      { ad: 'Efsane Pilav Üstü Et Döner Menü', aciklama: null, fiyat: null, foto: null },
      { ad: '2 Kişilik İskender Menü', aciklama: null, fiyat: null, foto: null },
      { ad: 'Adana Dürüm Menü', aciklama: null, fiyat: null, foto: null },
      { ad: 'Tavuk Güveç Menü', aciklama: null, fiyat: null, foto: null },
      { ad: "2'li Tanrıverdi Dürüm ve Ayran Menü", aciklama: null, fiyat: null, foto: null },
    ],
  },
  {
    id: 'yaninda', ad: 'Yanında', soz: 'Sofrayı tamamlar.',
    renk: { zemin: '#fff3d6', on: '#141413', vurgu: '#c8241a' },
    urunler: [
      { ad: 'Ayran', aciklama: null, fiyat: null, foto: null },
      { ad: 'Acılı Ezme', aciklama: null, fiyat: null, foto: null },
      { ad: 'Salata', aciklama: null, fiyat: null, foto: null },
    ],
  },
  {
    id: 'tatli', ad: 'Tatlı', soz: 'Sofranın sonu.',
    renk: { zemin: '#7a1c4a', on: '#fff3dc', vurgu: '#fbd46b' },
    urunler: [
      { ad: 'Kemalpaşa', aciklama: 'Şerbetli peynir tatlısı.', fiyat: null, foto: null },
    ],
  },
];
