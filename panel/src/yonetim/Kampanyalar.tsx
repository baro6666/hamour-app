import { useState } from 'react';
import { useOturum } from '../Oturum';
import { al, hataMetni, sb, tarihSaat } from '../supabase';
import { Durum, useYukle } from './ortak';

// Kampanyalar: Hamour Kartı indirimleri. "Bildirim gönder" işaretliyse aynı anda kampanya duyurusu açılır;
// bildirim yalnız kampanya bildirimine izin veren üyelere gider (bildirim_alicilari kuralı).
interface Kampanya {
  id: string; tur: 'hosgeldin' | 'kampanya'; baslik: string; metin: string | null; oran: number; kapsam: string | null;
  baslangic: string; bitis: string | null; tek_kullanim: boolean; aktif: boolean;
}

export function Kampanyalar() {
  const { oturum } = useOturum();
  const { veri, hata, yukleniyor, yenile } = useYukle(async () => {
    const [k, x] = await Promise.all([
      sb.from('kampanyalar').select('*').order('olusturma', { ascending: false }).then(al),
      sb.from('kampanya_kullanimlari').select('kampanya_id').then(al),
    ]);
    const sayim: Record<string, number> = {};
    for (const s of x as { kampanya_id: string }[]) sayim[s.kampanya_id] = (sayim[s.kampanya_id] ?? 0) + 1;
    return { kampanyalar: k as Kampanya[], sayim };
  });
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [oran, setOran] = useState(5);
  const [kapsam, setKapsam] = useState('');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');
  const [tek, setTek] = useState(true);
  const [bildirim, setBildirim] = useState(true);
  const [mesaj, setMesaj] = useState<{ tur: 'tamam' | 'hata'; metin: string } | null>(null);

  const olustur = async () => {
    try {
      const bas = baslangic ? new Date(baslangic).toISOString() : new Date().toISOString();
      al(await sb.from('kampanyalar').insert({
        baslik: baslik.trim(), metin: metin.trim() || null, oran, kapsam: kapsam.trim() || null,
        baslangic: bas, bitis: bitis ? new Date(bitis).toISOString() : null, tek_kullanim: tek, olusturan: oturum?.user.id,
      }).select('id'));
      if (bildirim) {
        al(await sb.from('duyurular').insert({
          tur: 'kampanya', baslik: baslik.trim(), metin: [metin.trim(), kapsam.trim()].filter(Boolean).join(' · ') || 'Hamour Kartı’nızı kasada gösterin.',
          yayin_zamani: bas, bitis: bitis ? new Date(bitis).toISOString() : null, bildirim: true, olusturan: oturum?.user.id,
        }).select('id'));
        if (!baslangic) sb.functions.invoke('bildirim-gonder', { body: {} }).catch(() => {});
      }
      setBaslik(''); setMetin(''); setKapsam(''); setBaslangic(''); setBitis('');
      setMesaj({ tur: 'tamam', metin: bildirim ? 'Kampanya açıldı, bildirim gönderiliyor.' : 'Kampanya açıldı.' });
      yenile();
    } catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };
  const durdur = async (k: Kampanya) => {
    if (!confirm(`"${k.baslik}" kampanyası ${k.aktif ? 'durdurulsun' : 'yeniden açılsın'} mı?`)) return;
    try { al(await sb.from('kampanyalar').update({ aktif: !k.aktif }).eq('id', k.id).select('id')); yenile(); }
    catch (e) { setMesaj({ tur: 'hata', metin: hataMetni(e) }); }
  };
  const simdi = Date.now();

  return (
    <>
      <h1>Kampanyalar</h1>
      <div className="satir" style={{ alignItems: 'flex-start' }}>
        <div className="kart" style={{ flex: '1 1 380px' }}>
          <h2>Yeni kampanya</h2>
          <label className="alan">Başlık<input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Bugün Patisserie’de %5 sizi bekliyor" maxLength={80} /></label>
          <label className="alan">Açıklama (isteğe bağlı)<textarea rows={2} value={metin} onChange={(e) => setMetin(e.target.value)} maxLength={200} /></label>
          <div className="satir">
            <label className="alan" style={{ width: 120 }}>İndirim %<input type="number" min={1} max={50} value={oran} onChange={(e) => setOran(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} /></label>
            <label className="alan ara">Kapsam (boş: tüm menü)<input value={kapsam} onChange={(e) => setKapsam(e.target.value)} placeholder="Yalnız Patisserie ürünleri" maxLength={80} /></label>
          </div>
          <div className="satir">
            <label className="alan ara">Başlangıç (boş: hemen)<input type="datetime-local" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} /></label>
            <label className="alan ara">Bitiş (boş: süresiz)<input type="datetime-local" value={bitis} onChange={(e) => setBitis(e.target.value)} /></label>
          </div>
          <label className="satir" style={{ fontSize: 15 }}>
            <input type="checkbox" checked={tek} onChange={(e) => setTek(e.target.checked)} style={{ minHeight: 0, width: 20, height: 20 }} />
            Kişi başı bir kez kullanılabilir
          </label>
          <label className="satir" style={{ fontSize: 15 }}>
            <input type="checkbox" checked={bildirim} onChange={(e) => setBildirim(e.target.checked)} style={{ minHeight: 0, width: 20, height: 20 }} />
            Üyelere anlık bildirim gönder
          </label>
          <p className="soluk">Bildirim yalnız kampanya bildirimine izin veren üyelere gider.</p>
          {mesaj ? <p className={`mesaj ${mesaj.tur}`} role="status">{mesaj.metin}</p> : null}
          <button className="dugme" disabled={!baslik.trim()} onClick={olustur}>Kampanyayı aç</button>
        </div>
        <div className="kart" style={{ flex: '1 1 420px' }}>
          <h2>Kampanyalar</h2>
          <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
          {veri?.kampanyalar.map((k) => {
            const durum = !k.aktif ? 'Durduruldu' : new Date(k.baslangic).getTime() > simdi ? 'Planlı'
              : k.bitis && new Date(k.bitis).getTime() < simdi ? 'Bitti' : 'Geçerli';
            return (
              <div key={k.id} className="satir" style={{ borderTop: '1px solid var(--cizgi)', paddingTop: 10 }}>
                <span className={`rozet ${durum === 'Geçerli' ? 'yesil' : ''}`}>{durum}</span>
                <div className="ara">
                  <b>%{k.oran} · {k.baslik}</b>
                  <p className="soluk">
                    {k.kapsam ?? 'Tüm menü'} · {k.tek_kullanim ? 'kişi başı bir kez' : 'sınırsız'} · {tarihSaat(k.baslangic)}
                    {k.bitis ? ` – ${tarihSaat(k.bitis)}` : ''} · <b>{veri.sayim[k.id] ?? 0}</b> kullanım
                  </p>
                </div>
                <button className={`dugme kucuk ${k.aktif ? 'tehlike' : 'cizgi'}`} onClick={() => durdur(k)}>{k.aktif ? 'Durdur' : 'Aç'}</button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
