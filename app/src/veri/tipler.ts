export type VitrinDurumu = 'normal' | 'son' | 'firin' | 'tukendi';
export type DuyuruTuru = 'firin' | 'vitrin' | 'kampanya' | 'yeni' | 'etkinlik' | 'kart';

export interface Kategori { id: string; ad: string; sira: number; damga_verir: boolean }

export interface Urun {
  id: string;
  kategori_id: string;
  ad: string;
  ad_en: string | null;
  aciklama: string | null;
  fiyat: number | null;
  alerjenler: string | null;
  kalori: number | null;
  foto_url: string | null;
  eslik_urun_id: string | null;
  vitrin_durumu: VitrinDurumu;
  vitrin_notu: string | null;
  on_siparis: boolean;
  sira: number;
}

export interface Duyuru {
  id: string;
  tur: DuyuruTuru;
  baslik: string;
  metin: string | null;
  urun_id: string | null;
  yayin_zamani: string;
}

export interface Sube { id: string; ad: string; adres: string | null; telefon: string | null; calisma_saatleri: string | null; enlem: number | null; boylam: number | null }

export interface Uye {
  id: string;
  ad: string | null;
  telefon: string | null;
  dogum_gunu: string | null;
  davet_kodu: string;
  bildirim_firin: boolean;
  bildirim_favori: boolean;
  kampanya_izni: boolean;
  olusturma: string;
}

export interface KartDurumu { damga: number; hak: number; kart_doldu: number; hedef: number }

export interface SonZiyaret { hareket_id: number; zaman: string; adet: number; puan: number | null }
