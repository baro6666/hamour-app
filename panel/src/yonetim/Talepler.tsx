import { al, hataMetni, sb, tarihSaat } from '../supabase';
import { Durum, useYukle } from './ortak';

const DURUMLAR = [['yeni', 'Yeni'], ['arandi', 'Arandı'], ['onaylandi', 'Onaylandı'], ['teslim', 'Teslim edildi'], ['iptal', 'İptal']] as const;
interface Talep {
  id: number; adet: number; istenen_tarih: string | null; notu: string | null; durum: string; olusturma: string;
  uyeler: { ad: string | null; telefon: string | null } | null; urunler: { ad: string } | null;
}

export function Talepler() {
  const { veri, hata, yukleniyor, yenile, setVeri } = useYukle(async () =>
    al(await sb.from('on_siparis_talepleri').select('id, adet, istenen_tarih, notu, durum, olusturma, uyeler(ad, telefon), urunler(ad)')
      .order('olusturma', { ascending: false }).limit(200)) as unknown as Talep[]);
  const degis = async (t: Talep, durum: string) => {
    setVeri((v) => v?.map((x) => (x.id === t.id ? { ...x, durum } : x)) ?? v);
    try { al(await sb.from('on_siparis_talepleri').update({ durum }).eq('id', t.id).select('id')); } catch (e) { alert(hataMetni(e)); yenile(); }
  };
  return (
    <>
      <h1>Ön sipariş talepleri</h1>
      <p className="soluk">Müşteri uygulamadan talep bırakır; şubeden aranıp tarih ve ayrıntı netleştirilir, ödeme teslimde alınır.</p>
      <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
      <div className="kart tablo-kutu">
        <table>
          <thead><tr><th>Tarih</th><th>Ürün</th><th>Üye</th><th>Telefon</th><th>İstenen gün</th><th>Not</th><th>Durum</th></tr></thead>
          <tbody>
            {veri?.map((t) => (
              <tr key={t.id}>
                <td>{tarihSaat(t.olusturma)}</td>
                <td><b>{t.urunler?.ad}</b>{t.adet > 1 ? ` ×${t.adet}` : ''}</td>
                <td>{t.uyeler?.ad ?? '—'}</td>
                <td>{t.uyeler?.telefon ? <a href={`tel:+${t.uyeler.telefon.replace(/^\+/, '')}`}>+{t.uyeler.telefon.replace(/^\+/, '')}</a> : '—'}</td>
                <td>{t.istenen_tarih ?? '—'}</td>
                <td>{t.notu ?? ''}</td>
                <td>
                  <select aria-label="Talep durumu" value={t.durum} onChange={(e) => degis(t, e.target.value)}>
                    {DURUMLAR.map(([k, ad]) => <option key={k} value={k}>{ad}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {veri && !veri.length ? <p className="soluk">Henüz talep yok.</p> : null}
      </div>
    </>
  );
}
