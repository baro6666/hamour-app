import { useState } from 'react';
import { useOturum } from '../Oturum';
import { al, hataMetni, sb, tarihSaat } from '../supabase';
import { Durum, useYukle } from './ortak';

const TURLER = [['firin', 'Fırından çıktı'], ['vitrin', 'Vitrin'], ['kampanya', 'Kampanya'], ['yeni', 'Yeni ürün'], ['etkinlik', 'Etkinlik'], ['kart', 'Kahve kartı']] as const;
type Tur = (typeof TURLER)[number][0];
// Kime gider (veritabanındaki bildirim_alicilari ile aynı kural)
const BILDIRIM_KIME: Record<Tur, string> = {
  firin: 'Bildirim, "Fırından yeni çıktı" bildirimini açık tutan üyelere gider.',
  vitrin: 'Bildirim, ürünü favorisine eklemiş ve "Favorilerim vitrinde" açık üyelere gider.',
  kampanya: 'Bildirim yalnız ticari ileti (İYS) onayı veren üyelere gider.',
  yeni: 'Bildirim yalnız ticari ileti (İYS) onayı veren üyelere gider.',
  etkinlik: 'Bildirim yalnız ticari ileti (İYS) onayı veren üyelere gider.',
  kart: 'Bildirim, bildirimlere izin veren tüm üyelere gider.',
};
interface Duyuru { id: string; tur: Tur; baslik: string; metin: string | null; urun_id: string | null; yayin_zamani: string; bitis: string | null; bildirim: boolean; bildirim_gonderildi: string | null }

export function Duyurular() {
  const { oturum } = useOturum();
  const { veri, hata, yukleniyor, yenile } = useYukle(async () => {
    const [d, u] = await Promise.all([
      sb.from('duyurular').select('*').order('yayin_zamani', { ascending: false }).limit(100).then(al),
      sb.from('urunler').select('id, ad').order('ad').then(al),
    ]);
    return { duyurular: d as Duyuru[], urunler: u as { id: string; ad: string }[] };
  });
  const [tur, setTur] = useState<Tur>('kampanya');
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [urun, setUrun] = useState('');
  const [yayin, setYayin] = useState('');
  const [bitis, setBitis] = useState('');
  const [bildirim, setBildirim] = useState(true);
  const [mesaj, setMesaj] = useState<{ tur: 'tamam' | 'hata'; metin: string } | null>(null);

  const yayinla = async () => {
    try {
      al(await sb.from('duyurular').insert({
        tur, baslik: baslik.trim(), metin: metin.trim() || null, urun_id: urun || null, olusturan: oturum?.user.id,
        yayin_zamani: yayin ? new Date(yayin).toISOString() : new Date().toISOString(), bitis: bitis ? new Date(bitis).toISOString() : null,
        bildirim,
      }).select('id'));
      // Hemen yayınlananın bildirimi beklemeden gitsin (planlılar zamanı gelince her dakikalık görevle gider)
      if (bildirim && !yayin) sb.functions.invoke('bildirim-gonder', { body: {} }).catch(() => {});
      setBaslik(''); setMetin(''); setUrun(''); setYayin(''); setBitis('');
      setMesaj({ tur: 'tamam', metin: yayin ? 'Duyuru planlandı.' : 'Yayınlandı: uygulamada Duyurular’da görünüyor.' });
      yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };
  const kaldir = async (d: Duyuru) => {
    if (!confirm(`"${d.baslik}" duyurusu kaldırılsın mı?`)) return;
    try { al(await sb.from('duyurular').delete().eq('id', d.id).select('id')); yenile(); } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };
  const simdi = Date.now();

  return (
    <>
      <h1>Duyurular</h1>
      <div className="satir" style={{ alignItems: 'flex-start' }}>
        <div className="kart" style={{ flex: '1 1 380px' }}>
          <h2>Yeni duyuru</h2>
          <div className="secim" role="group" aria-label="Duyuru türü">
            {TURLER.map(([k, ad]) => <button key={k} aria-pressed={tur === k} onClick={() => setTur(k)}>{ad}</button>)}
          </div>
          <label className="alan">Başlık<input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Kısa ve net" maxLength={80} /></label>
          <label className="alan">Metin<textarea rows={3} value={metin} onChange={(e) => setMetin(e.target.value)} maxLength={300} /></label>
          <label className="alan">Ürün (dokununca açılır, isteğe bağlı)
            <select value={urun} onChange={(e) => setUrun(e.target.value)}>
              <option value="">—</option>
              {veri?.urunler.map((u) => <option key={u.id} value={u.id}>{u.ad}</option>)}
            </select>
          </label>
          <div className="satir">
            <label className="alan ara">Yayın zamanı (boş: hemen)<input type="datetime-local" value={yayin} onChange={(e) => setYayin(e.target.value)} /></label>
            <label className="alan ara">Bitiş (isteğe bağlı)<input type="datetime-local" value={bitis} onChange={(e) => setBitis(e.target.value)} /></label>
          </div>
          <label className="satir" style={{ fontSize: 15 }}>
            <input type="checkbox" checked={bildirim} onChange={(e) => setBildirim(e.target.checked)} style={{ minHeight: 0, width: 20, height: 20 }} />
            Anlık bildirim olarak da gönder
          </label>
          <p className="soluk">{BILDIRIM_KIME[tur]}</p>
          {mesaj ? <p className={`mesaj ${mesaj.tur}`} role="status">{mesaj.metin}</p> : null}
          <button className="dugme" disabled={!baslik.trim()} onClick={yayinla}>{yayin ? 'Planla' : 'Şimdi yayınla'}</button>
        </div>
        <div className="kart" style={{ flex: '1 1 420px' }}>
          <h2>Duyurular</h2>
          <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
          {veri?.duyurular.map((d) => {
            const durum = new Date(d.yayin_zamani).getTime() > simdi ? 'Planlı' : d.bitis && new Date(d.bitis).getTime() < simdi ? 'Bitti' : 'Yayında';
            return (
              <div key={d.id} className="satir" style={{ borderTop: '1px solid var(--cizgi)', paddingTop: 10 }}>
                <span className={`rozet ${durum === 'Yayında' ? 'yesil' : ''}`}>{durum}</span>
                <div className="ara"><b>{d.baslik}</b><p className="soluk">{TURLER.find((t) => t[0] === d.tur)?.[1]} · {tarihSaat(d.yayin_zamani)}{d.bildirim ? (d.bildirim_gonderildi ? ' · bildirim gönderildi' : ' · bildirim bekliyor') : ''}</p></div>
                <button className="dugme tehlike kucuk" onClick={() => kaldir(d)}>Kaldır</button>
              </div>
            );
          })}
          {veri && !veri.duyurular.length ? <p className="soluk">Henüz duyuru yok.</p> : null}
        </div>
      </div>
    </>
  );
}
