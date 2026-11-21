import { Fragment, useState } from 'react';
import { useOturum } from '../Oturum';
import { al, hataMetni, sb } from '../supabase';
import { Durum, useYukle } from './ortak';

interface Urun {
  id: string; kerzz_kodu: string | null; kategori_id: string; ad: string; ad_en: string | null; aciklama: string | null;
  fiyat: number | null; alerjenler: string | null; kalori: number | null; foto_url: string | null; eslik_urun_id: string | null;
  vitrin_durumu: 'normal' | 'son' | 'firin' | 'tukendi'; vitrin_notu: string | null; on_siparis: boolean; gorunur: boolean; sira: number;
}
interface Kategori { id: string; ad: string }

const VITRIN = [['normal', 'Normal'], ['son', 'Son birkaç'], ['firin', 'Fırından çıktı'], ['tukendi', 'Tükendi']] as const;
const bosUrun = (kat: string): Partial<Urun> => ({ kategori_id: kat, ad: '', gorunur: true, vitrin_durumu: 'normal', on_siparis: false, sira: 0 });

function Ayrinti({ u, urunler, onDegis }: { u: Partial<Urun>; urunler: Urun[]; onDegis: (d: Partial<Urun>) => void }) {
  const metin = (alan: keyof Urun, etiket: string, uzun = false) => (
    <label className="alan" style={{ flex: uzun ? '1 1 100%' : '1 1 220px' }}>{etiket}
      {uzun ? <textarea rows={2} value={(u[alan] as string) ?? ''} onChange={(e) => onDegis({ [alan]: e.target.value || null })} />
        : <input value={(u[alan] as string) ?? ''} onChange={(e) => onDegis({ [alan]: e.target.value || null })} />}
    </label>
  );
  return (
    <div className="satir" style={{ alignItems: 'flex-start' }}>
      {metin('ad_en', 'İngilizce ad')}
      {metin('alerjenler', 'Alerjenler')}
      <label className="alan" style={{ flex: '0 1 120px' }}>Kalori (kcal)
        <input type="number" min={0} value={u.kalori ?? ''} onChange={(e) => onDegis({ kalori: e.target.value === '' ? null : Number(e.target.value) })} />
      </label>
      <label className="alan" style={{ flex: '1 1 220px' }}>Yanına ne gider
        <select value={u.eslik_urun_id ?? ''} onChange={(e) => onDegis({ eslik_urun_id: e.target.value || null })}>
          <option value="">—</option>
          {urunler.filter((x) => x.id !== u.id).map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}
        </select>
      </label>
      {metin('foto_url', 'Fotoğraf adresi')}
      {metin('aciklama', 'Açıklama', true)}
      <label className="satir" style={{ fontSize: 14 }}><input type="checkbox" checked={!!u.on_siparis} onChange={(e) => onDegis({ on_siparis: e.target.checked })} style={{ minHeight: 0 }} /> Ön sipariş ürünü (talep bırakılabilir)</label>
      <label className="alan" style={{ flex: '0 1 100px' }}>Sıra
        <input type="number" value={u.sira ?? 0} onChange={(e) => onDegis({ sira: Number(e.target.value) || 0 })} />
      </label>
    </div>
  );
}

export function Urunler() {
  const { oturum } = useOturum();
  const { veri, hata, yukleniyor, yenile } = useYukle(async () => {
    const [u, k] = await Promise.all([
      sb.from('urunler').select('*').order('sira').order('ad').then(al),
      sb.from('kategoriler').select('id, ad').order('sira').then(al),
    ]);
    return { urunler: u as Urun[], kategoriler: k as Kategori[] };
  });
  const [degisen, setDegisen] = useState<Record<string, Partial<Urun>>>({});
  const [acik, setAcik] = useState<string | null>(null);
  const [yeni, setYeni] = useState<Partial<Urun> | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: 'tamam' | 'hata'; metin: string } | null>(null);
  const [filtre, setFiltre] = useState('');

  if (!veri) return <Durum hata={hata} yukleniyor={yukleniyor} />;
  const { urunler, kategoriler } = veri;
  const katAd = Object.fromEntries(kategoriler.map((k) => [k.id, k.ad]));
  const gor = (u: Urun) => ({ ...u, ...degisen[u.id] });
  const degis = (id: string, d: Partial<Urun>) => setDegisen((s) => ({ ...s, [id]: { ...s[id], ...d } }));

  const kaydet = async (u: Urun) => {
    const d = degisen[u.id];
    if (!d) return;
    try {
      if (d.vitrin_durumu) (d as Record<string, unknown>).vitrin_guncelleme = new Date().toISOString();
      al(await sb.from('urunler').update(d).eq('id', u.id).select('id'));
      if (d.vitrin_durumu === 'firin' && u.vitrin_durumu !== 'firin' && confirm(`"${u.ad}" için "Fırından yeni çıktı" duyurusu ve bildirimi gönderilsin mi?`)) {
        al(await sb.from('duyurular').insert({ tur: 'firin', baslik: `${u.ad} fırından yeni çıktı`, metin: 'Sıcakken gelin, vitrinde sizi bekliyor.', urun_id: u.id, olusturan: oturum?.user.id, bildirim: true }).select('id'));
        sb.functions.invoke('bildirim-gonder', { body: {} }).catch(() => {});
      }
      setDegisen((s) => { const k = { ...s }; delete k[u.id]; return k; });
      setMesaj({ tur: 'tamam', metin: `${u.ad} kaydedildi.` });
      yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };

  const ekle = async () => {
    if (!yeni?.ad?.trim()) return;
    try {
      al(await sb.from('urunler').insert({ ...yeni, ad: yeni.ad.trim() }).select('id'));
      setYeni(null); setMesaj({ tur: 'tamam', metin: 'Ürün eklendi.' }); yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };

  const liste = urunler.filter((u) => !filtre || u.ad.toLocaleLowerCase('tr').includes(filtre.toLocaleLowerCase('tr')));

  return (
    <>
      <div className="satir">
        <h1 className="ara">Ürünler ve vitrin</h1>
        <input type="search" placeholder="Ürün ara" aria-label="Ürün ara" value={filtre} onChange={(e) => setFiltre(e.target.value)} />
        <button className="dugme" onClick={() => setYeni(bosUrun(kategoriler[0]?.id ?? ''))}>Yeni ürün</button>
      </div>
      <p className="soluk">Vitrin durumu uygulamada anında görünür. Fiyatlar ileride Kerzz'den otomatik gelecek; o zamana kadar buradan girilir.</p>
      {mesaj ? <p className={`mesaj ${mesaj.tur}`} role="status">{mesaj.metin}</p> : null}

      {yeni ? (
        <div className="kart">
          <h2>Yeni ürün</h2>
          <div className="satir">
            <label className="alan ara">Ad<input value={yeni.ad ?? ''} onChange={(e) => setYeni({ ...yeni, ad: e.target.value })} /></label>
            <label className="alan">Kategori
              <select value={yeni.kategori_id} onChange={(e) => setYeni({ ...yeni, kategori_id: e.target.value })}>
                {kategoriler.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </label>
            <label className="alan">Fiyat (₺)<input type="number" min={0} step="0.5" value={yeni.fiyat ?? ''} onChange={(e) => setYeni({ ...yeni, fiyat: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          </div>
          <Ayrinti u={yeni} urunler={urunler} onDegis={(d) => setYeni({ ...yeni, ...d })} />
          <div className="satir"><button className="dugme" onClick={ekle} disabled={!yeni.ad?.trim()}>Ekle</button><button className="dugme metin" onClick={() => setYeni(null)}>Vazgeç</button></div>
        </div>
      ) : null}

      <div className="kart tablo-kutu">
        <table>
          <thead><tr><th>Ürün</th><th>Kategori</th><th>Fiyat (₺)</th><th>Vitrin</th><th>Vitrin notu</th><th>Görünür</th><th /></tr></thead>
          <tbody>
            {liste.map((ham) => {
              const u = gor(ham);
              const kirli = !!degisen[ham.id];
              return (
                <Fragment key={u.id}>
                  <tr>
                    <td style={{ minWidth: 180 }}><b>{u.ad}</b>{u.on_siparis ? <> <span className="rozet">ön sipariş</span></> : null}</td>
                    <td>{katAd[u.kategori_id] ?? u.kategori_id}</td>
                    <td><input type="number" min={0} step="0.5" style={{ width: 100 }} aria-label={`${u.ad} fiyatı`} value={u.fiyat ?? ''} onChange={(e) => degis(u.id, { fiyat: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                    <td>
                      <div className="secim" role="group" aria-label={`${u.ad} vitrin durumu`}>
                        {VITRIN.map(([k, ad]) => <button key={k} aria-pressed={u.vitrin_durumu === k} onClick={() => degis(u.id, { vitrin_durumu: k })}>{ad}</button>)}
                      </div>
                    </td>
                    <td><input style={{ width: 130 }} placeholder="ör. Son 3 dilim" aria-label={`${u.ad} vitrin notu`} value={u.vitrin_notu ?? ''} onChange={(e) => degis(u.id, { vitrin_notu: e.target.value || null })} /></td>
                    <td><input type="checkbox" aria-label={`${u.ad} uygulamada görünsün`} checked={u.gorunur} onChange={(e) => degis(u.id, { gorunur: e.target.checked })} style={{ minHeight: 0 }} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="dugme kucuk cizgi" onClick={() => setAcik(acik === u.id ? null : u.id)}>{acik === u.id ? 'Kapat' : 'Ayrıntı'}</button>{' '}
                      <button className="dugme kucuk" disabled={!kirli} onClick={() => kaydet(ham)}>Kaydet</button>
                    </td>
                  </tr>
                  {acik === u.id ? <tr><td colSpan={7}><Ayrinti u={u} urunler={urunler} onDegis={(d) => degis(u.id, d)} /></td></tr> : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
