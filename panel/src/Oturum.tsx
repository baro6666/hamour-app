import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { sb } from './supabase';

export interface Personel { kullanici_id: string; ad: string; rol: 'kasiyer' | 'yonetici'; sube_id: string | null; aktif: boolean }
interface O { hazir: boolean; oturum: Session | null; personel: Personel | null; cikis(): Promise<void> }

const B = createContext<O | null>(null);

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [hazir, setHazir] = useState(false);
  const [oturum, setOturum] = useState<Session | null>(null);
  const [personel, setPersonel] = useState<Personel | null>(null);

  useEffect(() => {
    let iptal = false;
    const yukle = async (s: Session | null) => {
      let p: Personel | null = null;
      if (s) {
        const r = await sb.from('personel').select('kullanici_id, ad, rol, sube_id, aktif').eq('kullanici_id', s.user.id).maybeSingle();
        p = r.data && r.data.aktif ? (r.data as Personel) : null;
      }
      if (!iptal) { setOturum(s); setPersonel(p); setHazir(true); }
    };
    sb.auth.getSession().then(({ data }) => yukle(data.session));
    const { data } = sb.auth.onAuthStateChange((_o, s) => { setTimeout(() => yukle(s), 0); });
    return () => { iptal = true; data.subscription.unsubscribe(); };
  }, []);

  return <B.Provider value={{ hazir, oturum, personel, cikis: async () => { await sb.auth.signOut(); } }}>{children}</B.Provider>;
}

export function useOturum(): O {
  const o = useContext(B);
  if (!o) throw new Error('OturumSaglayici eksik');
  return o;
}
