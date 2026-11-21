import { useState } from 'react';
import { al, hataMetni, sb } from '../supabase';
import { Durum, useYukle } from './ortak';

interface Ayar { hedef_damga: number; dogum_gunu: boolean; mevsim_karti: boolean; davet: boolean; gizli_menu: boolean; tekrar_dakika: number }
interface Kategori { id: string; ad: string; damga_verir: boolean }

const ANAHTARLAR: [keyof Ayar, string, string][] = [
  ['davet', 'Arkadaşını getir', 'Davet edilenin ilk damgasında ikisine de 1 damga'],
  ['gizli_menu', 'Gizli menü', 'Kartı bir kez dolduranlara uygulamada açılır'],
  ['dogum_gunu', 'Doğum günü tatlısı', 'Uygulamada duyurulur; kasada üyelikten kontrol edilir'],
  ['mevsim_karti', 'Mevsim kartı', 'Sonraki sürümde'],
];

export function Kural() {
  const { veri, hata, yukleniyor, yenile } = useYukle(async () => {
    const [a, k] = await Promise.all([
      sb.from('kart_ayar').select('hedef_damga, dogum_gunu, mevsim_karti, davet, gizli_menu, tekrar_dakika').single().then(al),
      sb.from('kategoriler').select('id, ad, damga_verir').order('sira').then(al),
    ]);
    return { ayar: a as Ayar, kategoriler: k as Kategori[] };
  });
  const [ayar, setAyar] = useState<Ayar | null>(null);
  const [kat, setKat] = useState<Record<string, boolean>>({});
  const [mesaj, setMesaj] = useState<{ tur: 'tamam' | 'hata'; metin: string } | null>(null);
  if (!veri) return <Durum hata={hata} yukleniyor={yukleniyor} />;
  const a = ayar ?? veri.ayar;
  const degis = (d: Partial<Ayar>) => setAyar({ ...a, ...d });

  const kaydet = async () => {
    try {
      al(await sb.from('kart_ayar').update({ ...a, guncelleme: new Date().toISOString() }).eq('id', 1).select('id'));
      for (const [id, v] of Object.entries(kat)) al(await sb.from('kategoriler').update({ damga_verir: v }).eq('id', id).select('id'));
      setAyar(null); setKat({}); setMesaj({ tur: 'tamam', metin: 'Kaydedildi. Uygulamada hemen geçerli.' }); yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };

  return (
    <>
      <h1>Kahve kartı kuralı</h1>
      <div className="satir" style={{ alignItems: 'flex-start' }}>
        <div className="kart" style={{ flex: '1 1 420px' }}>
          <div className="satir">
            <span className="ara">Kaç damgada bir bedava kahve?</span>
            <div className="adet" style={{ gap: 12 }}>
              <button aria-label="Azalt" onClick={() => degis({ hedef_damga: Math.max(3, a.hedef_damga - 1) })}>−</button>
              <b>{a.hedef_damga}</b>
              <button className="dolu" aria-label="Artır" onClick={() => degis({ hedef_damga: Math.min(15, a.hedef_damga + 1) })}>+</button>
            </div>
          </div>
          <label className="alan">Aynı üyeye tekrar damga için yönetici onayı gereken süre (dakika)
            <input type="number" min={0} max={240} value={a.tekrar_dakika} onChange={(e) => degis({ tekrar_dakika: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <div>
            <p style={{ marginBottom: 6 }}>Damga veren kategoriler</p>
            <div className="secim" role="group" aria-label="Damga veren kategoriler">
              {veri.kategoriler.map((k) => {
                const on = kat[k.id] ?? k.damga_verir;
                return <button key={k.id} aria-pressed={on} onClick={() => setKat({ ...kat, [k.id]: !on })}>{k.ad}</button>;
              })}
            </div>
          </div>
          {ANAHTARLAR.map(([alan, ad, alt]) => (
            <label key={alan} className="satir" style={{ borderTop: '1px solid var(--cizgi)', paddingTop: 10 }}>
              <span className="ara"><b>{ad}</b><br /><span className="soluk">{alt}</span></span>
              <input type="checkbox" checked={a[alan] as boolean} onChange={(e) => degis({ [alan]: e.target.checked })} style={{ minHeight: 0, width: 22, height: 22 }} />
            </label>
          ))}
          {mesaj ? <p className={`mesaj ${mesaj.tur}`} role="status">{mesaj.metin}</p> : null}
          <button className="dugme" onClick={kaydet} disabled={!ayar && !Object.keys(kat).length}>Kaydet</button>
        </div>
        <div className="kart" style={{ flex: '1 1 280px', background: 'var(--ana)', color: 'var(--krem)' }}>
          <h2 style={{ color: 'var(--krem)' }}>Müşteri böyle görür</h2>
          <p>“Her kahve 1 damga. {a.hedef_damga} damga dolunca bir kahve bizden.”</p>
          <p style={{ color: '#C9D3BE', fontSize: 14 }}>Kural değişince mevcut damgalar korunur; yeni hedef sonraki damgadan itibaren geçerli olur.</p>
        </div>
      </div>
    </>
  );
}
