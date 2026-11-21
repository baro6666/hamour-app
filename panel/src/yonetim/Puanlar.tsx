import { useState } from 'react';
import { al, hataMetni, sb, tarihSaat } from '../supabase';
import { Durum, useYukle } from './ortak';

interface Puan {
  id: number; puan: number; notu: string | null; durum: 'yeni' | 'donuldu'; olusturma: string;
  uyeler: { ad: string | null; telefon: string | null } | null; damga_hareketleri: { olusturma: string } | null;
}

export function Puanlar() {
  const [hepsi, setHepsi] = useState(false);
  const { veri, hata, yukleniyor, yenile } = useYukle(async () => {
    let q = sb.from('puanlamalar').select('id, puan, notu, durum, olusturma, uyeler(ad, telefon), damga_hareketleri(olusturma)').order('olusturma', { ascending: false }).limit(200);
    if (!hepsi) q = q.lte('puan', 3);
    return al(await q) as unknown as Puan[];
  }, [hepsi]);
  const ort = veri?.length ? (veri.reduce((t, p) => t + p.puan, 0) / veri.length).toFixed(1) : null;
  const donuldu = async (p: Puan) => {
    try { al(await sb.from('puanlamalar').update({ durum: 'donuldu' }).eq('id', p.id).select('id')); yenile(); } catch (e) { alert(hataMetni(e)); }
  };
  return (
    <>
      <div className="satir">
        <h1 className="ara">Ziyaret puanları</h1>
        <div className="secim" role="group" aria-label="Gösterilen puanlar">
          <button aria-pressed={!hepsi} onClick={() => setHepsi(false)}>Düşük (1–3)</button>
          <button aria-pressed={hepsi} onClick={() => setHepsi(true)}>Hepsi</button>
        </div>
      </div>
      <p className="soluk">Müşteri, damga aldığı ziyareti uygulamadan 1–5 yıldızla puanlar. Düşük puanlara dönüş yapılıp “Dönüldü” işaretlenir.{ort && hepsi ? ` Ortalama: ${ort}` : ''}</p>
      <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
      <div className="kart tablo-kutu">
        <table>
          <thead><tr><th>Puan</th><th>Ziyaret</th><th>Üye</th><th>Telefon</th><th>Not</th><th>Durum</th></tr></thead>
          <tbody>
            {veri?.map((p) => (
              <tr key={p.id}>
                <td><b>{'★'.repeat(p.puan)}</b><span className="soluk">{'★'.repeat(5 - p.puan)}</span></td>
                <td>{tarihSaat(p.damga_hareketleri?.olusturma)}</td>
                <td>{p.uyeler?.ad ?? '—'}</td>
                <td>{p.uyeler?.telefon ? <a href={`tel:+${p.uyeler.telefon.replace(/^\+/, '')}`}>+{p.uyeler.telefon.replace(/^\+/, '')}</a> : '—'}</td>
                <td>{p.notu ?? ''}</td>
                <td>{p.durum === 'donuldu' ? <span className="rozet yesil">Dönüldü</span> : <button className="dugme kucuk cizgi" onClick={() => donuldu(p)}>Dönüldü</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {veri && !veri.length ? <p className="soluk">Kayıt yok.</p> : null}
      </div>
    </>
  );
}
