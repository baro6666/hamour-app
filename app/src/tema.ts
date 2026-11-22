// Hamour marka renkleri (hamour_pantoneler.pdf, Kasım 2026): krem #F6DCAF, kiremit #B45A3C, koyu kahve #3D1D0E.
// Ekranda kiremit turuncu durduğu için Hamour'un seçimiyle (C · "baskı tonu") kağıttaki koyu hali kullanılır:
//   ana  #8E4630 → dolu kartlar, düğmeler      kahve #3D1D0E → yazı, logo
//   kagit #F2E2C6 → zemin (yumuşak krem)        krem #F6DCAF → koyu zemin üstünde yazı / logo
// Diğer tonlar bu renklerin açık/koyu karışımlarıdır; yeni renk uydurmayın.
export const renk = {
  ana: '#8E4630',
  anaKoyu: '#6E3422',
  kahve: '#3D1D0E',
  krem: '#F6DCAF',
  kremAcik: '#EAD3AE',
  kagit: '#F2E2C6',
  kart: '#FAF0DF',
  kremKutu: '#EBD6B4',
  cizgi: '#DEC49D',
  murekkep: '#3D1D0E',
  soluk: '#6B4A36',
  sekmeSoluk: '#7D5C47',
  fiyat: '#3D1D0E',
  anaUstuSoluk: '#F3DDBD',
  turuncu: '#B45A3C',
  rozetZemin: '#3D1D0E',
  rozetYazi: '#F6DCAF',
  kapali: '#D6BC96',
  tehlike: '#8E2A1A',
};

// Başlıklar Playfair Display (logonun yüksek kontrastlı serifine yakın), gövde Jost, fiyatlar Montserrat (₺ için)
export const yazi = {
  normal: 'Jost_400Regular',
  orta: 'Jost_500Medium',
  italik: 'Jost_500Medium_Italic',
  kalin: 'Jost_700Bold',
  baslik: 'PlayfairDisplay_700Bold',
  baslikItalik: 'PlayfairDisplay_500Medium_Italic',
  fiyat: 'Montserrat_700Bold',
};

// Arapça: Jost / Playfair / Montserrat Arapça harf içermez → Tajawal (gövde) ve Amiri (başlık)
const ARAPCA_YAZI: Record<string, string> = {
  Jost_400Regular: 'Tajawal_400Regular', Jost_500Medium: 'Tajawal_500Medium', Jost_500Medium_Italic: 'Tajawal_500Medium',
  Jost_700Bold: 'Tajawal_700Bold', PlayfairDisplay_700Bold: 'Amiri_700Bold', PlayfairDisplay_500Medium_Italic: 'Amiri_400Regular',
  Montserrat_700Bold: 'Tajawal_700Bold',
};
export function yaziAilesi(aile: string | undefined, arapca: boolean): string | undefined {
  return arapca && aile ? ARAPCA_YAZI[aile] ?? aile : aile;
}

export function tl(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
}
