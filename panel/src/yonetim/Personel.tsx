import { useState } from 'react';
import { useOturum } from '../Oturum';
import { al, hataMetni, sb } from '../supabase';
import { Durum, useYukle } from './ortak';

interface P { kullanici_id: string; ad: string; rol: 'kasiyer' | 'yonetici'; aktif: boolean; olusturma: string }

export function Personel() {
  const { personel: ben } = useOturum();
  const { veri, hata, yukleniyor, yenile } = useYukle(async () =>
    al(await sb.from('personel').select('kullanici_id, ad, rol, aktif, olusturma').order('olusturma')) as P[]);
  const [ad, setAd] = useState('');
  const [eposta, setEposta] = useState('');
  const [rol, setRol] = useState<'kasiyer' | 'yonetici'>('kasiyer');
  const [bekliyor, setBekliyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: 'tamam' | 'hata'; metin: string } | null>(null);

  const ekle = async () => {
    setBekliyor(true); setMesaj(null);
    try {
      const r = await sb.functions.invoke('personel-ekle', { body: { ad: ad.trim(), eposta: eposta.trim(), rol } });
      if (r.error) throw new Error((await r.error.context?.json?.().catch(() => null))?.hata ?? r.error.message);
      const { gecici_sifre } = r.data as { gecici_sifre: string };
      setMesaj({ tur: 'tamam', metin: `${ad.trim()} eklendi. Geçici şifre: ${gecici_sifre} — yalnız şimdi gösteriliyor; kişiye kendiniz iletin.` });
      setAd(''); setEposta(''); yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); } finally { setBekliyor(false); }
  };
  const durumDegis = async (p: P) => {
    try { al(await sb.from('personel').update({ aktif: !p.aktif }).eq('kullanici_id', p.kullanici_id).select('kullanici_id')); yenile(); }
    catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };
  const rolDegis = async (p: P, r: P['rol']) => {
    try { al(await sb.from('personel').update({ rol: r }).eq('kullanici_id', p.kullanici_id).select('kullanici_id')); yenile(); }
    catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };

  return (
    <>
      <h1>Personel</h1>
      <div className="satir" style={{ alignItems: 'flex-start' }}>
        <div className="kart" style={{ flex: '1 1 340px' }}>
          <h2>Personel ekle</h2>
          <label className="alan">Ad soyad<input value={ad} onChange={(e) => setAd(e.target.value)} /></label>
          <label className="alan">E-posta (giriş için)<input type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} /></label>
          <div className="secim" role="group" aria-label="Rol">
            <button aria-pressed={rol === 'kasiyer'} onClick={() => setRol('kasiyer')}>Kasiyer</button>
            <button aria-pressed={rol === 'yonetici'} onClick={() => setRol('yonetici')}>Yönetici</button>
          </div>
          <p className="soluk">Kasiyer yalnız “Damga ver” ekranını görür. Yönetici tüm paneli görür ve 10 dakika kuralını onaylayabilir.</p>
          {mesaj ? <p className={`mesaj ${mesaj.tur}`} role="status">{mesaj.metin}</p> : null}
          <button className="dugme" disabled={bekliyor || !ad.trim() || !/\S+@\S+\.\S+/.test(eposta)} onClick={ekle}>{bekliyor ? 'Ekleniyor…' : 'Ekle'}</button>
        </div>
        <div className="kart tablo-kutu" style={{ flex: '1 1 460px' }}>
          <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
          <table>
            <thead><tr><th>Ad</th><th>Rol</th><th>Durum</th></tr></thead>
            <tbody>
              {veri?.map((p) => {
                const kendim = p.kullanici_id === ben?.kullanici_id;
                return (
                  <tr key={p.kullanici_id}>
                    <td><b>{p.ad}</b>{kendim ? ' (siz)' : ''}</td>
                    <td>
                      <select aria-label={`${p.ad} rolü`} value={p.rol} disabled={kendim} onChange={(e) => rolDegis(p, e.target.value as P['rol'])}>
                        <option value="kasiyer">Kasiyer</option><option value="yonetici">Yönetici</option>
                      </select>
                    </td>
                    <td>
                      {kendim ? <span className="rozet yesil">Aktif</span>
                        : <button className={`dugme kucuk ${p.aktif ? 'cizgi' : ''}`} onClick={() => durumDegis(p)}>{p.aktif ? 'Pasif yap' : 'Aktif yap'}</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
