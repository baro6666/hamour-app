// Uygulama dili: Türkçe (asıl), İngilizce, Arapça (sağdan sola).
// İlk açılışta telefonun dili (İngilizce / Arapça değilse Türkçe); kullanıcı seçerse cihazda saklanır.
// Metinler Türkçe yazılır ve t('Türkçe metin') ile çevrilir; karşılıklar ceviriler.ts'de (araclar/ceviri_test.js denetler).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ceviriler } from './ceviriler';

export type Dil = 'tr' | 'en' | 'ar';
export const DILLER: { kod: Dil; ad: string }[] = [
  { kod: 'tr', ad: 'Türkçe' }, { kod: 'en', ad: 'English' }, { kod: 'ar', ad: 'العربية' },
];
const ANAHTAR = 'hamour_dil';
const YEREL: Record<Dil, string> = { tr: 'tr-TR', en: 'en-GB', ar: 'ar' };

function telefonDili(): Dil {
  try {
    const k = getLocales()[0]?.languageCode;
    return k === 'en' || k === 'ar' ? k : 'tr';
  } catch {
    return 'tr';
  }
}

/** Saf çeviri (bağlam dışında da kullanılabilir): '{n} kişi' gibi yer tutucular değerle doldurulur */
export function cevir(dil: Dil, metin: string, degerler?: Record<string, string | number>): string {
  const sonuc = dil === 'tr' ? metin : ceviriler[dil][metin] ?? metin;
  return degerler ? sonuc.replace(/\{(\w+)\}/g, (_, k) => String(degerler[k] ?? `{${k}}`)) : sonuc;
}

interface DilBaglami {
  dil: Dil;
  setDil(d: Dil): void;
  t(metin: string, degerler?: Record<string, string | number>): string;
  rtl: boolean;
  yerel: string; // tarih / sayı biçimi
  buyukHarf(s: string): string; // Türkçede i→İ, İngilizcede i→I
  yuzde(n: number): string; // Türkçe %5, İngilizce / Arapça 5%
}

const Baglam = createContext<DilBaglami | null>(null);

export function DilSaglayici({ children }: { children: ReactNode }) {
  const [dil, setDilDurum] = useState<Dil>(telefonDili);
  useEffect(() => {
    AsyncStorage.getItem(ANAHTAR).then((d) => { if (d === 'tr' || d === 'en' || d === 'ar') setDilDurum(d); }).catch(() => {});
  }, []);
  const setDil = useCallback((d: Dil) => {
    setDilDurum(d);
    AsyncStorage.setItem(ANAHTAR, d).catch(() => {});
  }, []);
  const deger = useMemo<DilBaglami>(() => ({
    dil, setDil, rtl: dil === 'ar', yerel: YEREL[dil],
    t: (m, d) => cevir(dil, m, d),
    yuzde: (n) => (dil === 'tr' ? `%${n}` : `${n}%`),
    buyukHarf: (s) => s.toLocaleUpperCase(dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : 'ar'),
  }), [dil, setDil]);
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useDil(): DilBaglami {
  const b = useContext(Baglam);
  if (!b) throw new Error('DilSaglayici eksik');
  return b;
}
