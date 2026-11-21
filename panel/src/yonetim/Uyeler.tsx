import { useState } from 'react';
import { al, sb, tarihSaat } from '../supabase';
import { Durum, useYukle } from './ortak';

interface Uye {
  id: string; ad: string | null; telefon: string | null; dogum_gunu: string | null; kampanya_izni: boolean; olusturma: string;
  kartlar: { damga: number; hak: number; kullanilan_bedava: number; toplam_damga: number } | null;
}

function csv(satirlar: (string | number | null)[][]): string {
  return '﻿' + satirlar.map((s) => s.map((h) => `"${String(h ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
}

export function Uyeler() {
  const [ara, setAra] = useState('');
  const { veri, hata, yukleniyor } = useYukle(async () =>
    al(await sb.from('uyeler').select('id, ad, telefon, dogum_gunu, kampanya_izni, olusturma, kartlar(damga, hak, kullanilan_bedava, toplam_damga)')
      .order('olusturma', { ascending: false }).limit(2000)) as unknown as Uye[]);
  const liste = (veri ?? []).filter((u) => !ara || `${u.ad ?? ''} ${u.telefon ?? ''}`.toLocaleLowerCase('tr').includes(ara.toLocaleLowerCase('tr')));
  const izinli = veri?.filter((u) => u.kampanya_izni).length ?? 0;

  const indir = () => {
    const icerik = csv([['Ad', 'Telefon', 'Üyelik', 'Doğum günü', 'Kart', 'Hak', 'Kullanılan bedava', 'Toplam damga', 'Kampanya izni'],
      ...liste.map((u) => [u.ad, u.telefon, u.olusturma.slice(0, 10), u.dogum_gunu, u.kartlar?.damga ?? 0, u.kartlar?.hak ?? 0, u.kartlar?.kullanilan_bedava ?? 0, u.kartlar?.toplam_damga ?? 0, u.kampanya_izni ? 'Var' : 'Yok'])]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([icerik], { type: 'text/csv;charset=utf-8' }));
    a.download = `hamour-uyeler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <>
      <div className="satir">
        <h1 className="ara">Üyeler</h1>
        <input type="search" placeholder="Ad ya da telefon" aria-label="Üye ara" value={ara} onChange={(e) => setAra(e.target.value)} />
        <button className="dugme cizgi" onClick={indir} disabled={!liste.length}>Excel'e aktar (CSV)</button>
      </div>
      <p className="soluk">{veri ? `${veri.length} üye · kampanya izni veren ${izinli}` : ''}. Telefon numaraları kişisel veridir; dışa aktarılan dosyayı paylaşmayın (KVKK).</p>
      <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
      <div className="kart tablo-kutu">
        <table>
          <thead><tr><th>Ad</th><th>Telefon</th><th>Üyelik</th><th>Kart</th><th>Hak</th><th>Kullanılan bedava</th><th>Toplam damga</th><th>Kampanya izni</th></tr></thead>
          <tbody>
            {liste.map((u) => (
              <tr key={u.id}>
                <td><b>{u.ad ?? '—'}</b></td>
                <td>{u.telefon ? '+' + u.telefon.replace(/^\+/, '') : '—'}</td>
                <td>{tarihSaat(u.olusturma).split(' ').slice(0, 3).join(' ')}</td>
                <td>{u.kartlar?.damga ?? 0}</td>
                <td>{u.kartlar?.hak ?? 0}</td>
                <td>{u.kartlar?.kullanilan_bedava ?? 0}</td>
                <td>{u.kartlar?.toplam_damga ?? 0}</td>
                <td>{u.kampanya_izni ? <span className="rozet yesil">Var</span> : 'Yok'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {veri && !liste.length ? <p className="soluk">Üye yok.</p> : null}
      </div>
    </>
  );
}
