// Ürün adı / açıklaması seçili dilde. İngilizce: hamour.com.tr/en/menu/, Arapça: araclar/ceviri-ar.json (menuCeviri.ts).
// Sitede yeni çıkan ve henüz çevrilmemiş ürün: Arapçada İngilizcesi, o da yoksa Türkçesi gösterilir.
import { menuAr, menuEn } from '../veri/menuCeviri';
import type { Urun } from '../veri/tipler';
import type { Dil } from './DilSaglayici';

// Canlı veritabanında kimlik uuid olabilir; uygulama içi fotoğraf anahtarı (yerel:<kimlik>) site kimliğidir.
const anahtar = (u: Pick<Urun, 'id' | 'foto_url'>) => (u.foto_url?.startsWith('yerel:') ? u.foto_url.slice(6) : u.id);

export function urunMetni(u: Pick<Urun, 'id' | 'foto_url' | 'ad' | 'aciklama'>, dil: Dil): { ad: string; aciklama: string | null } {
  if (dil === 'tr') return { ad: u.ad, aciklama: u.aciklama };
  const k = anahtar(u);
  const c = (dil === 'ar' ? menuAr[k] : undefined) ?? menuEn[k] ?? menuEn[u.id];
  return c ? { ad: c.ad, aciklama: c.aciklama } : { ad: u.ad, aciklama: u.aciklama };
}
