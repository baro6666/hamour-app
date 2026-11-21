// Veri kaynağı: Supabase ayarlıysa canlı, değilse cihaz içi örnek veri (geliştirme / tasarım için).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ornekDuyurular, ornekKategoriler, ornekSube, ornekUrunler } from './ornek';
import type { Duyuru, KartDurumu, Kategori, SonZiyaret, Sube, Urun, Uye } from './tipler';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANAHTAR = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  URL && ANAHTAR
    ? createClient(URL, ANAHTAR, {
        auth: {
          storage: Platform.OS === 'web' ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const ornekMod = !supabase;

export interface Menu { kategoriler: Kategori[]; urunler: Urun[]; sube: Sube | null }
export interface UyeOlBilgisi { ad: string; dogumGunu: string | null; davetKodu: string | null; kampanyaIzni: boolean }
export type BildirimAyari = Pick<Uye, 'bildirim_firin' | 'bildirim_favori' | 'kampanya_izni'>;

export interface Kaynak {
  menu(): Promise<Menu>;
  duyurular(): Promise<Duyuru[]>;
  okunanlar(): Promise<string[]>;
  okundu(ids: string[]): Promise<void>;
  favoriler(): Promise<string[]>;
  favori(urunId: string, ekle: boolean): Promise<void>;
  kart(): Promise<KartDurumu | null>;
  qrKodu(): Promise<string>;
  sonZiyaret(): Promise<SonZiyaret | null>;
  puanla(hareketId: number, puan: number): Promise<void>;
  onSiparisTalebi(urunId: string, not: string | null): Promise<void>;
  // Oturum
  uye(): Promise<Uye | null>;
  smsGonder(telefon: string): Promise<void>;
  smsDogrula(telefon: string, kod: string): Promise<boolean>; // true: kayıtlı üye
  uyeOl(b: UyeOlBilgisi): Promise<Uye>;
  bildirimAyari(a: Partial<BildirimAyari>): Promise<void>;
  pushToken(token: string): Promise<void>;
  cikis(): Promise<void>;
  hesabiSil(): Promise<void>;
}

function hata(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

// Türkiye cep numarası → E.164 (905xxxxxxxxx)
export function telefonDuzelt(giris: string): string | null {
  const r = giris.replace(/\D/g, '').replace(/^0+/, '');
  const yerel = r.startsWith('90') ? r.slice(2) : r;
  return /^5\d{9}$/.test(yerel) ? '+90' + yerel : null;
}

// ─────────────────────────── Supabase ───────────────────────────
function supabaseKaynak(sb: SupabaseClient): Kaynak {
  const kim = async () => (await sb.auth.getUser()).data.user?.id ?? null;
  return {
    async menu() {
      const [k, u, s] = await Promise.all([
        sb.from('kategoriler').select('id, ad, sira, damga_verir').order('sira'),
        sb.from('urunler').select('id, kategori_id, ad, ad_en, aciklama, fiyat, alerjenler, kalori, foto_url, eslik_urun_id, vitrin_durumu, vitrin_notu, on_siparis, sira').order('sira'),
        sb.from('subeler').select('id, ad, adres, telefon, calisma_saatleri, enlem, boylam').limit(1).maybeSingle(),
      ]);
      hata(k.error); hata(u.error); hata(s.error);
      return { kategoriler: k.data as Kategori[], urunler: u.data as Urun[], sube: s.data as Sube | null };
    },
    async duyurular() {
      const r = await sb.from('duyurular').select('id, tur, baslik, metin, urun_id, yayin_zamani').order('yayin_zamani', { ascending: false }).limit(50);
      hata(r.error);
      return r.data as Duyuru[];
    },
    async okunanlar() {
      if (!(await kim())) return [];
      const r = await sb.from('duyuru_okundu').select('duyuru_id');
      hata(r.error);
      return (r.data ?? []).map((x) => x.duyuru_id as string);
    },
    async okundu(ids) {
      const id = await kim();
      if (!id || !ids.length) return;
      const r = await sb.from('duyuru_okundu').upsert(ids.map((d) => ({ uye_id: id, duyuru_id: d })), { ignoreDuplicates: true });
      hata(r.error);
    },
    async favoriler() {
      if (!(await kim())) return [];
      const r = await sb.from('favoriler').select('urun_id');
      hata(r.error);
      return (r.data ?? []).map((x) => x.urun_id as string);
    },
    async favori(urunId, ekle) {
      const id = await kim();
      if (!id) throw new Error('GIRIS_GEREKLI');
      const r = ekle
        ? await sb.from('favoriler').upsert({ uye_id: id, urun_id: urunId }, { ignoreDuplicates: true })
        : await sb.from('favoriler').delete().eq('urun_id', urunId);
      hata(r.error);
    },
    async kart() {
      if (!(await kim())) return null;
      const [k, a] = await Promise.all([
        sb.from('kartlar').select('damga, hak, kart_doldu').maybeSingle(),
        sb.from('kart_ayar').select('hedef_damga').single(),
      ]);
      hata(k.error); hata(a.error);
      return k.data ? { ...(k.data as Omit<KartDurumu, 'hedef'>), hedef: a.data!.hedef_damga as number } : null;
    },
    async qrKodu() {
      const r = await sb.rpc('benim_qr_kodum');
      hata(r.error);
      return r.data as string;
    },
    async sonZiyaret() {
      if (!(await kim())) return null;
      const r = await sb.from('damga_hareketleri').select('id, olusturma, adet, puanlamalar(puan)')
        .eq('tur', 'damga').order('olusturma', { ascending: false }).limit(1).maybeSingle();
      hata(r.error);
      if (!r.data) return null;
      const p = (r.data as { puanlamalar: { puan: number }[] | { puan: number } | null }).puanlamalar;
      const puan = Array.isArray(p) ? p[0]?.puan ?? null : p?.puan ?? null;
      return { hareket_id: r.data.id as number, zaman: r.data.olusturma as string, adet: r.data.adet as number, puan };
    },
    async puanla(hareketId, puan) {
      hata((await sb.rpc('ziyaret_puanla', { p_hareket: hareketId, p_puan: puan })).error);
    },
    async onSiparisTalebi(urunId, not) {
      const id = await kim();
      if (!id) throw new Error('GIRIS_GEREKLI');
      hata((await sb.from('on_siparis_talepleri').insert({ uye_id: id, urun_id: urunId, notu: not })).error);
    },
    async uye() {
      if (!(await kim())) return null;
      const r = await sb.from('uyeler').select('id, ad, telefon, dogum_gunu, davet_kodu, bildirim_firin, bildirim_favori, kampanya_izni, olusturma').maybeSingle();
      hata(r.error);
      return r.data as Uye | null;
    },
    async smsGonder(telefon) {
      hata((await sb.auth.signInWithOtp({ phone: telefon })).error);
    },
    async smsDogrula(telefon, kod) {
      hata((await sb.auth.verifyOtp({ phone: telefon, token: kod, type: 'sms' })).error);
      return !!(await this.uye());
    },
    async uyeOl(b) {
      const r = await sb.rpc('uye_ol', { p_ad: b.ad, p_dogum_gunu: b.dogumGunu, p_davet_kodu: b.davetKodu, p_kampanya_izni: b.kampanyaIzni });
      hata(r.error);
      return r.data as Uye;
    },
    async bildirimAyari(a) {
      const id = await kim();
      if (!id) return;
      const ek = a.kampanya_izni !== undefined ? { kampanya_izni_tarih: new Date().toISOString() } : {};
      hata((await sb.from('uyeler').update({ ...a, ...ek }).eq('id', id)).error);
    },
    async pushToken(token) {
      const id = await kim();
      if (!id) return;
      hata((await sb.from('uyeler').update({ push_token: token }).eq('id', id)).error);
    },
    async cikis() {
      // Çıkışta bu telefona bildirim gitmesin
      const id = await kim();
      if (id) await sb.from('uyeler').update({ push_token: null }).eq('id', id);
      await sb.auth.signOut();
    },
    async hesabiSil() {
      hata((await sb.rpc('hesabimi_sil')).error);
      await sb.auth.signOut();
    },
  };
}

// ─────────────────────────── Örnek (cihaz içi) ───────────────────────────
function ornekKaynak(): Kaynak {
  const durum = {
    uye: null as Uye | null,
    kart: { damga: 5, hak: 0, kart_doldu: 0, hedef: 8 } as KartDurumu,
    favoriler: new Set<string>(['pistachio', 'sansebastian']),
    okunan: new Set<string>(),
    puan: null as number | null,
  };
  const bekle = <T,>(x: T) => new Promise<T>((r) => setTimeout(() => r(x), 150));
  return {
    menu: () => bekle({ kategoriler: ornekKategoriler, urunler: ornekUrunler, sube: ornekSube }),
    duyurular: () => bekle(ornekDuyurular),
    okunanlar: () => bekle([...durum.okunan]),
    okundu: async (ids) => { ids.forEach((i) => durum.okunan.add(i)); },
    favoriler: () => bekle([...durum.favoriler]),
    favori: async (id, ekle) => { if (ekle) durum.favoriler.add(id); else durum.favoriler.delete(id); },
    kart: () => bekle(durum.uye ? durum.kart : null),
    qrKodu: () => bekle(`ornek.${Math.floor(Date.now() / 60000)}.${Math.random().toString(16).slice(2, 18)}`),
    sonZiyaret: () => bekle(durum.uye ? { hareket_id: 1, zaman: new Date(Date.now() - 86400000).toISOString(), adet: 1, puan: durum.puan } : null),
    puanla: async (_h, p) => { durum.puan = p; },
    onSiparisTalebi: () => bekle(undefined),
    uye: () => bekle(durum.uye),
    smsGonder: () => bekle(undefined),
    smsDogrula: async (_t, kod) => { if (kod !== '123456') throw new Error('Kod hatalı (örnek modda 123456)'); return !!durum.uye; },
    uyeOl: async (b) => {
      durum.uye = {
        id: 'ornek', ad: b.ad, telefon: null, dogum_gunu: b.dogumGunu, davet_kodu: 'ORNEK1',
        bildirim_firin: true, bildirim_favori: true, kampanya_izni: b.kampanyaIzni, olusturma: new Date().toISOString(),
      };
      return durum.uye;
    },
    bildirimAyari: async (a) => { if (durum.uye) durum.uye = { ...durum.uye, ...a }; },
    pushToken: async () => {},
    cikis: async () => { durum.uye = null; },
    hesabiSil: async () => { durum.uye = null; },
  };
}

export const kaynak: Kaynak = supabase ? supabaseKaynak(supabase) : ornekKaynak();
