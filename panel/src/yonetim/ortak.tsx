import { useCallback, useEffect, useState } from 'react';
import { hataMetni } from '../supabase';

// Basit veri yükleme kancası: { veri, hata, yukleniyor, yenile }
export function useYukle<T>(fn: () => Promise<T>, bagimlilik: unknown[] = []) {
  const [veri, setVeri] = useState<T | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yenile = useCallback(() => {
    setYukleniyor(true);
    return fn().then((v) => { setVeri(v); setHata(null); }).catch((e) => setHata(hataMetni(e))).finally(() => setYukleniyor(false));
  }, bagimlilik);
  useEffect(() => { yenile(); }, [yenile]);
  return { veri, hata, yukleniyor, yenile, setVeri };
}

export function Durum({ hata, yukleniyor }: { hata: string | null; yukleniyor: boolean }) {
  if (hata) return <p className="mesaj hata" role="alert">{hata}</p>;
  if (yukleniyor) return <p className="soluk">Yükleniyor…</p>;
  return null;
}
