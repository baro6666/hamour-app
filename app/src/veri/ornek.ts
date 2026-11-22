// Supabase bağlanmadan uygulamanın açılabilmesi için örnek veri.
// Menü hamour.com.tr/tr/menu/'den (menuVerisi.ts, araclar/menu_aktar.py üretir). Uygulama açılışta siteden günceller.
import { siteKategoriler, siteUrunler } from './menuVerisi';
import type { Duyuru, Kampanya, Kategori, Sube, Urun } from './tipler';

export const ornekKategoriler: Kategori[] = siteKategoriler;

export const ornekUrunler: Urun[] = siteUrunler.map((u) => ({
  ...u, ad_en: null, alerjenler: null, kalori: null, eslik_urun_id: null,
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

// Örnek modda kampanyalar: hoş geldin (Hamour'un kararı) ve Hamour'un verdiği örnek "Bugün patiseride %5".
const aksam = new Date(); aksam.setHours(19, 0, 0, 0);
export const ornekKampanyalar: Omit<Kampanya, 'kullanildi'>[] = [
  { id: 'hosgeldin', tur: 'hosgeldin', baslik: 'Hoş geldin indirimi', metin: 'Uygulamayı indirdiğiniz için ilk ziyaretinizde %5 indirim.', oran: 5, kapsam: 'Alkollü içecekler hariç', bitis: null, tek_kullanim: true },
  { id: 'patiseri', tur: 'kampanya', baslik: 'Bugün patiseride %5 sizi bekliyor', metin: null, oran: 5, kapsam: 'Yalnız patiseri ürünleri', bitis: aksam.toISOString(), tek_kullanim: false },
];
