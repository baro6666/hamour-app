// Hamour geçici marka renkleri (Paris bistrosu: bordo, krem, kağıt).
// Hamour'un resmî renkleri ve logosu gelince yalnız bu dosya ve panel/src/stil.css değişir.
export const renk = {
  ana: '#5E1A2B',
  anaKoyu: '#4A1422',
  krem: '#EFE2CC',
  kremAcik: '#E3D1B4',
  kagit: '#FBF7F1',
  kart: '#FFFDF9',
  cizgi: '#E8DDCC',
  murekkep: '#2A1A1E',
  soluk: '#5C4B4F',
  sekmeSoluk: '#6C5B5F',
  fiyat: '#141414',
  anaUstuSoluk: '#DCC3C8',
  turuncu: '#9A6A1F',
  rozetZemin: '#F4E6CF',
  rozetYazi: '#7A4E0E',
  kapali: '#CDBFB0',
  tehlike: '#8A2F22',
};

// Jost (sade, okunaklı), fiyatlar Montserrat (₺ işareti için)
export const yazi = {
  normal: 'Jost_400Regular',
  orta: 'Jost_500Medium',
  italik: 'Jost_500Medium_Italic',
  kalin: 'Jost_700Bold',
  fiyat: 'Montserrat_700Bold',
};

export function tl(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
}
