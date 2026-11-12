// Single place for every business fact shown on the site.
// Change a value here and it changes everywhere it is used.
export const SITE = {
  name: 'Tanrıverdi 48 Restaurant',
  shortName: 'Tanrıverdi 48',
  slogan: 'Etin lezzet ile buluştuğu adres',
  founded: 1988,
  phoneDisplay: '0552 213 53 33',
  phoneHref: 'tel:+905522135333',
  whatsappHref: 'https://api.whatsapp.com/send/?phone=905522135333',
  instagramHandle: '@tanriverdi_restaurant_48',
  instagramHref: 'https://www.instagram.com/tanriverdi_restaurant_48/',
  hours: '7 gün 24 saat açık',
  // Address as it appears in public listings. Confirm with the restaurant
  // before launch; `addressConfirmed` only controls a hidden data attribute.
  addressLines: ['Muslihittin Mah., Atatürk Bulvarı 31/B', 'Menteşe / Muğla'],
  addressConfirmed: false,
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=Tanr%C4%B1verdi+48+Restaurant+Mu%C4%9Fla',
  menuHref: './menu.html',
};

export function yearsOpen(now = new Date()) {
  return now.getFullYear() - SITE.founded;
}
