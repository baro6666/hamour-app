// Menü canlı olarak hamour.com.tr/tr/menu/ sayfasından okunur: sitede değişen ürün, açıklama, fiyat ve fotoğraf
// uygulamaya yeni sürüm gerekmeden gelir. Başarılı son menü cihazda saklanır; site açılmazsa o, o da yoksa
// uygulamanın içindeki kopya (menuVerisi.ts) gösterilir.
// Kimlikler araclar/menu_aktar.py ile AYNI kuralla üretilir (kisa): uygulama içi fotoğraflar kimlikle eşleşir.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { yerelFotolar } from './fotolar';
import type { BolumId, Kategori, Urun } from './tipler';

export const SITE = 'https://www.hamour.com.tr';
export const MENU_ADRESI = `${SITE}/tr/menu/`;
const SAKLAMA_ANAHTARI = 'hamour_site_menu_v1';

// Sitedeki sekme sırası (Patiseri ve Pasta sekmelerinin ürün listesi yok)
const BOLUM_SIRASI: BolumId[] = ['kahvalti', 'ana', 'alkol', 'icecek', 'patiseri', 'pasta'];
const GRUP_AD: Record<string, string> = {
  PIZZAS: 'Pizzalar', 'BOWL & SALAD': 'Bowl & salata', STARTER: 'Başlangıçlar', 'BURGER & BRIOCHE': 'Burger & brioche',
  SANDWICHES: 'Sandviçler', 'PASTA & RISOTTO': 'Makarna & risotto', BEEF: 'Et, tavuk, balık', MATCHAS: 'Matcha',
  'SMOOTHIE • DETOKS • FRUIT JUICE': 'Smoothie · detoks · meyve suyu', COFFEES: 'Kahveler', TEAS: 'Çaylar',
  'SOFT DRINKS': 'Meşrubat & su',
};

const TR_HARF: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U', â: 'a', é: 'e', É: 'E' };

/** araclar/menu_aktar.py → kisa() ile aynı */
export function kisa(s: string): string {
  return s.normalize('NFC').replace(/[çğıöşüÇĞİÖŞÜâéÉ]/g, (h) => TR_HARF[h]).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const VARLIK: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à',
  acirc: 'â', ccedil: 'ç', Ccedil: 'Ç', ouml: 'ö', Ouml: 'Ö', uuml: 'ü', Uuml: 'Ü', icirc: 'î', ocirc: 'ô', ucirc: 'û',
};

function temiz(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/\s*<br\s*\/?>\s*/gi, ', ').replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (t, a) => VARLIK[a] ?? t)
    .replace(/\s+/g, ' ').trim().replace(/^,+|,+$/g, '').trim();
}

function grupAd(g: string): string {
  return GRUP_AD[g] ?? g.toLowerCase().replace(/(^|\s)(\S)/g, (_, b, h) => b + h.toLocaleUpperCase('tr-TR')).replace(/ • /g, ' · ');
}

/** '745' → 745; '750 / 3570' → 750 + '750 ₺ / 3.570 ₺'; '770 / 770' → 770 */
export function fiyatCoz(metin: string): { fiyat: number | null; fiyat_metni: string | null } {
  const sayilar = (metin.replace(/\./g, '').match(/\d+/g) ?? []).map(Number);
  if (!sayilar.length) return { fiyat: null, fiyat_metni: null };
  if (new Set(sayilar).size === 1) return { fiyat: sayilar[0], fiyat_metni: null }; // '770 / 770' → tek fiyat
  const bicim = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
  return { fiyat: sayilar[0], fiyat_metni: sayilar.map(bicim).join(' / ') };
}

export interface SiteMenusu { kategoriler: Kategori[]; urunler: Urun[] }

export function menuyuAyristir(html: string): SiteMenusu {
  const panes = html.split('class="tab-content-pane"').slice(1, BOLUM_SIRASI.length + 1);
  const kategoriler: Kategori[] = [];
  const urunler: Urun[] = [];
  const kullanilan = new Set<string>();
  const desen = /<h2>([\s\S]*?)<\/h2>|<div class="item[^"]*"(?: data-src="([^"]*)")?>\s*(?:<span class="fiyat">([\s\S]*?)<\/span>\s*)?<h3>([\s\S]*?)<\/h3>\s*(?:<p>([\s\S]*?)<\/p>)?/g;
  let ksira = 0;
  let usira = 0;
  panes.forEach((pane, i) => {
    const bolum = BOLUM_SIRASI[i];
    const gorunur = bolum !== 'alkol'; // alkollü içecekler uygulamada gizli
    let grup: Kategori | null = null;
    for (const m of pane.split('section-4')[0].matchAll(desen)) {
      if (m[1] !== undefined) {
        const ad = temiz(m[1]);
        grup = { id: kisa(ad), ad: grupAd(ad), bolum, sira: ++ksira, damga_verir: false };
        if (gorunur) kategoriler.push(grup);
        continue;
      }
      if (!grup) {
        grup = { id: 'kahvalti', ad: 'Royal Breakfast', bolum, sira: ++ksira, damga_verir: false };
        if (gorunur) kategoriler.push(grup);
      }
      const ad = temiz(m[4]);
      let id = kisa(ad);
      while (kullanilan.has(id)) id += '-2';
      kullanilan.add(id);
      usira++;
      if (!gorunur) continue;
      const src = m[2];
      const foto = yerelFotolar[id] ? `yerel:${id}` : src && !src.includes('avatar') ? SITE + src : null;
      urunler.push({
        id, kategori_id: grup.id, ad, ad_en: null, aciklama: temiz(m[5]) || null, ...fiyatCoz(temiz(m[3])),
        alerjenler: null, kalori: null, foto_url: foto, eslik_urun_id: null, vitrin_durumu: 'normal', vitrin_notu: null,
        on_siparis: false, sira: usira,
      });
    }
  });
  if (urunler.length < 20) throw new Error('MENU_YAPISI_DEGISMIS');
  return { kategoriler, urunler };
}

/** Siteden güncel menü; olmazsa cihazda saklanan son menü; o da yoksa null (uygulama içi kopya kullanılır). */
export async function siteMenusuGetir(zamanAsimi = 10000): Promise<SiteMenusu | null> {
  try {
    const iptal = new AbortController();
    const sayac = setTimeout(() => iptal.abort(), zamanAsimi);
    const yanit = await fetch(MENU_ADRESI, { signal: iptal.signal, headers: { Accept: 'text/html' } });
    clearTimeout(sayac);
    if (!yanit.ok) throw new Error(`HTTP ${yanit.status}`);
    const menu = menuyuAyristir(await yanit.text());
    AsyncStorage.setItem(SAKLAMA_ANAHTARI, JSON.stringify(menu)).catch(() => {});
    return menu;
  } catch {
    return saklananMenu();
  }
}

export async function saklananMenu(): Promise<SiteMenusu | null> {
  try {
    const s = await AsyncStorage.getItem(SAKLAMA_ANAHTARI);
    return s ? (JSON.parse(s) as SiteMenusu) : null;
  } catch {
    return null;
  }
}
