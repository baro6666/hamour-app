import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { bildirimKaydet } from './bildirim';
import { kaynak, supabase, type BildirimAyari, type Menu } from './kaynak';
import type { Duyuru, KartDurumu, Urun, Uye } from './tipler';

interface Veri {
  hazir: boolean;
  hata: string | null;
  menu: Menu;
  duyurular: Duyuru[];
  okunan: Set<string>;
  okunmamis: number;
  favoriler: Set<string>;
  uye: Uye | null;
  kart: KartDurumu | null;
  urun(id: string | null | undefined): Urun | undefined;
  yenile(): Promise<void>;
  favoriDegistir(id: string): Promise<void>;
  okunduYap(ids: string[]): Promise<void>;
  bildirimAyari(a: Partial<BildirimAyari>): Promise<void>;
  oturumYenile(): Promise<void>;
}

const bos: Menu = { kategoriler: [], urunler: [], sube: null };
const Baglam = createContext<Veri | null>(null);

export function VeriSaglayici({ children }: { children: ReactNode }) {
  const [hazir, setHazir] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu>(bos);
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [okunan, setOkunan] = useState<Set<string>>(new Set());
  const [favoriler, setFavoriler] = useState<Set<string>>(new Set());
  const [uye, setUye] = useState<Uye | null>(null);
  const [kart, setKart] = useState<KartDurumu | null>(null);

  const oturumYenile = useCallback(async () => {
    const [u, k, f, o] = await Promise.all([kaynak.uye(), kaynak.kart(), kaynak.favoriler(), kaynak.okunanlar()]);
    setUye(u); setKart(k); setFavoriler(new Set(f)); setOkunan(new Set(o));
    if (u) bildirimKaydet();
  }, []);

  const yenile = useCallback(async () => {
    try {
      const [m, d] = await Promise.all([kaynak.menu(), kaynak.duyurular()]);
      setMenu(m); setDuyurular(d);
      await oturumYenile();
      setHata(null);
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setHazir(true);
    }
  }, [oturumYenile]);

  useEffect(() => {
    // İlk yükleme: setState'ler promise içinde (efekt gövdesinde eşzamanlı değil)
    Promise.resolve().then(yenile);
    const abone = supabase?.auth.onAuthStateChange(() => { oturumYenile().catch(() => {}); });
    return () => abone?.data.subscription.unsubscribe();
  }, [yenile, oturumYenile]);

  const deger = useMemo<Veri>(() => {
    const harita = new Map(menu.urunler.map((u) => [u.id, u]));
    return {
      hazir, hata, menu, duyurular, okunan, favoriler, uye, kart,
      okunmamis: uye ? duyurular.filter((d) => !okunan.has(d.id)).length : 0,
      urun: (id) => (id ? harita.get(id) : undefined),
      yenile,
      oturumYenile,
      async favoriDegistir(id) {
        const ekle = !favoriler.has(id);
        const yeni = new Set(favoriler);
        if (ekle) yeni.add(id); else yeni.delete(id);
        setFavoriler(yeni);
        try { await kaynak.favori(id, ekle); } catch (e) { setFavoriler(favoriler); throw e; }
      },
      async okunduYap(ids) {
        const yeni = ids.filter((i) => !okunan.has(i));
        if (!yeni.length || !uye) return;
        setOkunan(new Set([...okunan, ...yeni]));
        await kaynak.okundu(yeni).catch(() => {});
      },
      async bildirimAyari(a) {
        if (uye) setUye({ ...uye, ...a });
        await kaynak.bildirimAyari(a);
      },
    };
  }, [hazir, hata, menu, duyurular, okunan, favoriler, uye, kart, yenile, oturumYenile]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useVeri(): Veri {
  const v = useContext(Baglam);
  if (!v) throw new Error('VeriSaglayici eksik');
  return v;
}
