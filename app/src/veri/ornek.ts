// Supabase bağlanmadan uygulamanın açılabilmesi için örnek veri (yalnız geliştirme).
// Fiyatlar boştur; canlıda yönetim panelinden / Kerzz'den gelir.
import type { Duyuru, Kategori, Sube, Urun } from './tipler';

export const ornekKategoriler: Kategori[] = [
  { id: 'kahvalti', ad: 'Royal Breakfast', sira: 1, damga_verir: false },
  { id: 'patiseri', ad: 'Patiseri', sira: 2, damga_verir: false },
  { id: 'kahve', ad: 'Kahveler', sira: 3, damga_verir: true },
  { id: 'cay', ad: 'Çay & matcha', sira: 4, damga_verir: true },
  { id: 'baslangic', ad: 'Başlangıçlar', sira: 5, damga_verir: false },
  { id: 'bowl', ad: 'Bowl & salata', sira: 6, damga_verir: false },
  { id: 'pizza', ad: 'Pizzalar', sira: 7, damga_verir: false },
  { id: 'burger', ad: 'Burger & sandviç', sira: 8, damga_verir: false },
  { id: 'makarna', ad: 'Makarna & risotto', sira: 9, damga_verir: false },
  { id: 'ana', ad: 'Et, balık, tavuk', sira: 10, damga_verir: false },
  { id: 'icecek', ad: 'Smoothie & içecekler', sira: 11, damga_verir: false },
  { id: 'onsiparis', ad: 'Kutlama & ön sipariş', sira: 12, damga_verir: false },
];

let sira = 0;
function u(id: string, kategori_id: string, ad: string, ad_en: string, fiyat: number | null, ek: Partial<Urun> = {}): Urun {
  return {
    id, kategori_id, ad, ad_en, fiyat, aciklama: null, alerjenler: null, kalori: null, foto_url: null,
    eslik_urun_id: null, vitrin_durumu: 'normal', vitrin_notu: null, on_siparis: kategori_id === 'onsiparis', sira: sira++, ...ek,
  };
}

// Ürün adları hamour.com.tr menüsünden. Sitede fiyat yok: fiyatlar boş, yönetim panelinden girilir.
export const ornekUrunler: Urun[] = [
  u('avokadotost', 'kahvalti', 'Avocado Toast', 'Avocado Toast', null, { aciklama: 'Ekşi mayalı ekmek, avokado, poşe yumurta, lime, Buffa mozzarella, bernez sos.', eslik_urun_id: 'latte' }),
  u('scrambled', 'kahvalti', 'Scrambled Eggs', 'Scrambled Eggs', null, { aciklama: 'Organik yumurta, istiridye mantarı, trüf yağı.', eslik_urun_id: 'americano' }),
  u('benedict', 'kahvalti', 'Classic Eggs Benedict', 'Classic Eggs Benedict', null, { eslik_urun_id: 'latte' }),
  u('omlet', 'kahvalti', 'Hamour Omlet', 'Hamour Omelette', null),
  u('frenchtoast', 'kahvalti', 'French Toast', 'French Toast', null, { eslik_urun_id: 'latte' }),
  u('speculoos', 'kahvalti', 'Speculoos Pancake', 'Speculoos Pancake', null),
  u('acai', 'kahvalti', 'Acai Bowl', 'Acai Bowl', null),
  u('cilbir', 'kahvalti', 'Çılbır', 'Turkish Poached Eggs', null),
  u('menemen', 'kahvalti', 'Menemen', 'Menemen', null),
  u('english', 'kahvalti', 'English Breakfast', 'English Breakfast', null),
  u('kruvasan', 'patiseri', 'Kruvasan', 'Croissant', null, { vitrin_durumu: 'firin', eslik_urun_id: 'latte' }),
  u('espresso', 'kahve', 'Espresso', 'Espresso', null, { eslik_urun_id: 'kruvasan' }),
  u('americano', 'kahve', 'Americano', 'Americano', null, { eslik_urun_id: 'kruvasan' }),
  u('latte', 'kahve', 'Latte', 'Caffè Latte', null, { eslik_urun_id: 'kruvasan' }),
  u('filtre', 'kahve', 'Filtre Kahve', 'Filter Coffee', null, { eslik_urun_id: 'kruvasan' }),
  u('turkkahvesi', 'kahve', 'Türk Kahvesi', 'Turkish Coffee', null),
  u('matcha', 'cay', 'Matcha Latte', 'Matcha Latte', null, { eslik_urun_id: 'kruvasan' }),
  u('burrata', 'baslangic', 'Burrata', 'Burrata', null),
  u('tempura', 'baslangic', 'Shrimp Tempura', 'Shrimp Tempura', null),
  u('arancini', 'baslangic', 'Arancini', 'Arancini', null),
  u('salmonbowl', 'bowl', 'Salmon Bowl', 'Salmon Bowl', null),
  u('caesar', 'bowl', 'Caesar Salad', 'Caesar Salad', null),
  u('quinoa', 'bowl', 'Quinoa & Beetroot', 'Quinoa & Beetroot', null),
  u('margarita', 'pizza', 'Margarita', 'Margherita', null),
  u('dortpeynir', 'pizza', '4 Peynirli', 'Four Cheese', null),
  u('fumesomon', 'pizza', 'Füme Somonlu', 'Smoked Salmon', null),
  u('hamourburger', 'burger', 'Hamour Burger', 'Hamour Burger', null),
  u('katsu', 'burger', 'Chicken Katsu Sando', 'Chicken Katsu Sando', null),
  u('club', 'burger', 'Hamour Club Sandwich', 'Hamour Club Sandwich', null),
  u('paccheri', 'makarna', 'Burrata Paccheri', 'Burrata Paccheri', null),
  u('risotto', 'makarna', 'Trüflü Mantar Risotto', 'Truffle Mushroom Risotto', null),
  u('cafedeparis', 'ana', 'Café de Paris', 'Café de Paris', null),
  u('somon', 'ana', 'Somon Izgara', 'Grilled Salmon', null),
  u('schnitzel', 'ana', 'Chicken Schnitzel', 'Chicken Schnitzel', null),
  u('greenjuice', 'icecek', 'Green Juice', 'Green Juice', null),
  u('avokadosmoothie', 'icecek', 'Avokado Smoothie', 'Avocado Smoothie', null),
  u('kutlamapasta', 'onsiparis', 'Kutlama Pastası', 'Celebration Cake · isim yazılır', null),
  u('kruvasankutu', 'onsiparis', 'Kruvasan Kutusu', 'Croissant Box · [adet]', null),
];

const simdi = Date.now();
const once = (dk: number) => new Date(simdi - dk * 60000).toISOString();

export const ornekDuyurular: Duyuru[] = [
  { id: 'd1', tur: 'firin', baslik: 'Kruvasanlar fırından çıktı', metin: 'Günün taze kruvasanları vitrinde.', urun_id: 'kruvasan', yayin_zamani: once(10) },
  { id: 'd2', tur: 'kampanya', baslik: 'Kahvaltı Hamour’da güzel', metin: 'Royal Breakfast menüsü [saat aralığı] arasında.', urun_id: 'benedict', yayin_zamani: once(120) },
  { id: 'd3', tur: 'etkinlik', baslik: 'Günü Hamour’da kutlayalım', metin: 'Doğum günü ve kutlama pastaları için uygulamadan ön sipariş talebi bırakın.', urun_id: 'kutlamapasta', yayin_zamani: once(1500) },
];

export const ornekSube: Sube = {
  id: 'beykoz', ad: 'Hamour Beykoz', adres: 'Acarlar Mah. 9. Cad., Beykoz / İstanbul', telefon: '0216 525 50 50', calisma_saatleri: null, enlem: null, boylam: null,
};
