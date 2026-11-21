// Supabase bağlanmadan uygulamanın açılabilmesi için örnek veri.
// Menü hamour.com.tr'den (menuVerisi.ts, araclar/menu_aktar.py üretir). Sitede fiyat yok: fiyatlar boş.
import { siteKategoriler, siteUrunler } from './menuVerisi';
import type { Duyuru, Kategori, Sube, Urun } from './tipler';

export const ornekKategoriler: Kategori[] = siteKategoriler;

export const ornekUrunler: Urun[] = siteUrunler.map((u) => ({
  ...u, ad_en: null, fiyat: null, alerjenler: null, kalori: null, eslik_urun_id: null,
  vitrin_durumu: 'normal', vitrin_notu: null, on_siparis: false,
}));

const simdi = Date.now();
const once = (dk: number) => new Date(simdi - dk * 60000).toISOString();

export const ornekDuyurular: Duyuru[] = [
  { id: 'd1', tur: 'firin', baslik: 'Kruvasanlar fırından çıktı', metin: 'Günün taze kruvasanları vitrinde.', urun_id: 'croissant-roll', yayin_zamani: once(10) },
  { id: 'd2', tur: 'kampanya', baslik: 'Kahvaltı Hamour’da güzel', metin: 'Royal Breakfast menüsü [saat aralığı] arasında.', urun_id: 'classic-eggs-benedict', yayin_zamani: once(120) },
  { id: 'd3', tur: 'etkinlik', baslik: 'Günü Hamour’da kutlayalım', metin: 'Doğum günü ve kutlama pastaları için şubeyi arayın.', urun_id: null, yayin_zamani: once(1500) },
];

export const ornekSube: Sube = {
  id: 'beykoz', ad: 'Hamour Beykoz', adres: 'Acarlar Mah. 9. Cad., Beykoz / İstanbul', telefon: '0216 525 50 50', calisma_saatleri: null, enlem: null, boylam: null,
};
