import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { al, hataMetni, sb, tarihSaat } from './supabase';

// Kasa: müşterinin Hamour Kartı QR'ı okutulur, geçerli indirimler listelenir; kasiyer kasada indirimi yapıp "Uygulandı"ya basar.
interface Satir { uye_ad: string; kampanya_id: string; tur: 'hosgeldin' | 'kampanya'; baslik: string; oran: number; kapsam: string | null; tek_kullanim: boolean; kullanildi: string | null }
type Durum =
  | { adim: 'tara' }
  | { adim: 'uye'; kod: string; ad: string; satirlar: Satir[] }
  | { adim: 'sonuc'; baslik: string; metin: string };

// Kamera ile QR okuma (arka kamera). Kamera yoksa ya da izin verilmezse elle / barkod okuyucuyla giriş kalır.
function KameraOkuyucu({ onKod }: { onKod: (k: string) => void }) {
  const [hata, setHata] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);
  const geri = useRef(onKod);
  useEffect(() => { geri.current = onKod; }, [onKod]);
  useEffect(() => {
    if (!acik) return;
    const okuyucu = new Html5Qrcode('kamera-alani', { verbose: false });
    let bitti = false;
    okuyucu.start({ facingMode: 'environment' }, { fps: 10, qrbox: 230 }, (metin) => {
      if (bitti) return;
      bitti = true;
      okuyucu.stop().catch(() => {}).finally(() => geri.current(metin));
    }, () => {}).catch(() => setHata('Kamera açılamadı. Tarayıcıya kamera izni verin ya da kodu aşağıdan girin.'));
    return () => { bitti = true; if (okuyucu.isScanning) okuyucu.stop().catch(() => {}); };
  }, [acik]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {acik ? <div id="kamera-alani" className="kamera" /> : (
        <button className="dugme buyuk" onClick={() => { setHata(null); setAcik(true); }}>Kamerayı aç ve Hamour Kartı okut</button>
      )}
      {hata ? <p className="mesaj hata" role="alert">{hata}</p> : null}
    </div>
  );
}

export function Kasa() {
  const [durum, setDurum] = useState<Durum>({ adim: 'tara' });
  const [elle, setElle] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tur, setTur] = useState(0); // kamerayı yeniden başlatmak için

  const calistir = async (is: () => Promise<void>) => {
    setBekliyor(true); setHata(null);
    try { await is(); } catch (e) { setHata(hataMetni(e)); } finally { setBekliyor(false); }
  };

  const oku = (kod: string) => calistir(async () => {
    const satirlar = (al(await sb.rpc('kasa_kampanyalar', { p_kod: kod.trim() })) ?? []) as Satir[];
    if (!satirlar.length) throw new Error('Bu müşteri için şu an geçerli indirim yok.');
    setDurum({ adim: 'uye', kod: kod.trim(), ad: satirlar[0].uye_ad, satirlar });
  });

  const uygula = (s: Satir) => calistir(async () => {
    if (durum.adim !== 'uye') return;
    al(await sb.rpc('kampanya_uygula', { p_kod: durum.kod, p_kampanya: s.kampanya_id }));
    setDurum({ adim: 'sonuc', baslik: `%${s.oran} ${s.baslik}`, metin: `${durum.ad} için kaydedildi.${s.kapsam ? ` Kapsam: ${s.kapsam}.` : ''}` });
  });

  const basaDon = () => { setDurum({ adim: 'tara' }); setHata(null); setElle(''); setTur((t) => t + 1); };

  return (
    <div className="sayfa dar">
      <h1>İndirim okut</h1>
      {hata ? <p className="mesaj hata" role="alert">{hata}</p> : null}

      {durum.adim === 'tara' ? (
        <div className="kart">
          <KameraOkuyucu key={tur} onKod={oku} />
          <form className="satir" onSubmit={(e) => { e.preventDefault(); if (elle.trim()) oku(elle); }}>
            <label className="alan ara">Ya da kodu girin (barkod okuyucu da buraya yazar)
              <input value={elle} onChange={(e) => setElle(e.target.value)} placeholder="QR kodu" autoComplete="off" />
            </label>
            <button className="dugme" style={{ alignSelf: 'flex-end' }} disabled={!elle.trim() || bekliyor}>Bul</button>
          </form>
          <p className="soluk">Kod her dakika yenilenir; ekran görüntüsüyle indirim alınamaz.</p>
        </div>
      ) : null}

      {durum.adim === 'uye' ? (
        <>
          <div className="kart">
            <h2>{durum.ad}</h2>
            <p className="soluk">Önce kasada indirimi yapın, sonra “Uygulandı”ya basın.</p>
          </div>
          {durum.satirlar.map((s) => {
            const kullanildi = s.tek_kullanim && !!s.kullanildi;
            return (
              <div key={s.kampanya_id} className="kart">
                <div className="satir">
                  <span className="rozet" style={{ fontSize: 18 }}>%{s.oran}</span>
                  <div className="ara">
                    <b>{s.baslik}</b>
                    <p className="soluk">{s.kapsam ?? 'Tüm menü'}{s.tek_kullanim ? ' · kişi başı bir kez' : ''}</p>
                  </div>
                </div>
                {kullanildi
                  ? <p className="mesaj hata">Daha önce kullanıldı: {tarihSaat(s.kullanildi)}. Tekrar uygulanamaz.</p>
                  : <button className="dugme buyuk" disabled={bekliyor} onClick={() => uygula(s)}>Uygulandı</button>}
              </div>
            );
          })}
          <button className="dugme metin" onClick={basaDon}>Vazgeç</button>
        </>
      ) : null}

      {durum.adim === 'sonuc' ? (
        <div className="kart" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24 }}>{durum.baslik}</h2>
          <p>{durum.metin}</p>
          <button className="dugme buyuk" style={{ alignSelf: 'stretch' }} onClick={basaDon}>Sonraki müşteri</button>
        </div>
      ) : null}
    </div>
  );
}
