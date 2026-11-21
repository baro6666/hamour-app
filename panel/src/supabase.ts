import { createClient } from '@supabase/supabase-js';

// Yayımlanabilir anahtar gizli değildir; yetkiyi veritabanındaki RLS ve fonksiyonlar belirler.
// Adres ve anahtar panel/.env'den gelir (Hamour'un Supabase projesi; docs/altyapi.md).
const URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const ANAHTAR: string | undefined = import.meta.env.VITE_SUPABASE_KEY;
if (!URL || !ANAHTAR) throw new Error('panel/.env eksik: VITE_SUPABASE_URL ve VITE_SUPABASE_KEY gerekli (docs/altyapi.md).');
export const sb = createClient(URL, ANAHTAR);

const HATALAR: Record<string, string> = {
  YETKI_YOK: 'Bu işlem için yetkiniz yok.',
  QR_GECERSIZ: 'QR kodu geçersiz. Müşteriden uygulamadaki kodu yeniden göstermesini isteyin.',
  QR_SURESI_DOLDU: 'QR kodunun süresi dolmuş (ekran görüntüsü olabilir). Müşteri uygulamayı açıp yeni kodu göstermeli.',
  UYE_YOK: 'Bu koda ait üye bulunamadı.',
  ONAY_GEREKLI: 'Bu üyeye son 10 dakika içinde damga verildi. Tekrar vermek için yönetici onayı gerekir.',
  ADET_GECERSIZ: 'Adet 1 ile 10 arasında olmalı.',
  HAK_YOK: 'Üyenin kullanılabilir bedava kahve hakkı yok.',
  'Invalid login credentials': 'E-posta ya da şifre hatalı.',
};

export function hataMetni(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  for (const k of Object.keys(HATALAR)) if (m.includes(k)) return HATALAR[k];
  return m;
}

export function kod(e: unknown): string | null {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
  return Object.keys(HATALAR).find((k) => m.includes(k)) ?? null;
}

// Supabase yanıtındaki hatayı fırlat
export function al<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function tl(n: number | null | undefined): string {
  return n == null ? '—' : Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
}

export function tarihSaat(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}
