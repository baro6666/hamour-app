// Hamour marka renkleri (hamour_pantoneler.pdf, Kasım 2026). Oran: %60 krem, %30 kiremit, %10 koyu kahve.
//   krem    #F6DCAF  C2 M13 Y36 K0   → zemin
//   kiremit #B45A3C  C20 M75 Y86 K8  → dolu kartlar, düğmeler, vurgular (renk.ana)
//   kahve   #3D1D0E  C48 M76 Y82 K70 → yazı, logo
// Diğer tonlar bu üç rengin açık/koyu karışımlarıdır; yeni renk uydurmayın.
export const renk = {
  ana: '#B45A3C',
  anaKoyu: '#963F24',
  kahve: '#3D1D0E',
  krem: '#F6DCAF',
  kremAcik: '#EFCB90',
  kagit: '#F6DCAF',
  kart: '#FBEBD1',
  kremKutu: '#F1D09A',
  cizgi: '#E6C38C',
  murekkep: '#3D1D0E',
  soluk: '#6A4632',
  sekmeSoluk: '#7A5641',
  fiyat: '#3D1D0E',
  anaUstuSoluk: '#F8E3C1',
  turuncu: '#B45A3C',
  rozetZemin: '#3D1D0E',
  rozetYazi: '#F6DCAF',
  kapali: '#D9B98A',
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

export function tl(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
}
