import { Html5Qrcode } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOturum } from './Oturum';
import { al, hataMetni, kod as hataKodu, sb, tarihSaat } from './supabase';

interface Uye { uye_id: string; ad: string; damga: number; hak: number; hedef: number; son_ziyaret: string | null }
type Durum =
  | { adim: 'tara' }
  | { adim: 'uye'; kod: string; uye: Uye }
  | { adim: 'sonuc'; baslik: string; metin: string; doldu: boolean };

function Damgalar({ dolu, hedef }: { dolu: number; hedef: number }) {
  return (
    <div className="damgalar" style={{ gridTemplateColumns: `repeat(${hedef}, minmax(0, 1fr))` }} aria-label={`${dolu} / ${hedef} damga`}>
      {Array.from({ length: hedef }, (_, i) => <span key={i} className={i < dolu ? 'dolu' : ''} />)}
    </div>
  );
}

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
        <button className="dugme buyuk" onClick={() => { setHata(null); setAcik(true); }}>Kamerayı aç ve QR okut</button>
      )}
      {hata ? <p className="mesaj hata" role="alert">{hata}</p> : null}
    </div>
  );
}

export function Kasa() {
  const { personel } = useOturum();
  const yonetici = personel?.rol === 'yonetici';
  const [durum, setDurum] = useState<Durum>({ adim: 'tara' });
  const [adet, setAdet] = useState(1);
  const [elle, setElle] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<{ metin: string; onay: boolean } | null>(null);
  const [bugun, setBugun] = useState<number | null>(null);
  const [tur, setTur] = useState(0); // kamerayı yeniden başlatmak için

  const bugunuYenile = useCallback(() => { sb.rpc('kasa_bugun').then((r) => { if (!r.error) setBugun(r.data as number); }); }, []);
  useEffect(() => { bugunuYenile(); }, [bugunuYenile]);

  const calistir = async (is: () => Promise<void>) => {
    setBekliyor(true); setHata(null);
    try { await is(); } catch (e) { setHata({ metin: hataMetni(e), onay: hataKodu(e) === 'ONAY_GEREKLI' }); } finally { setBekliyor(false); }
  };

  const uyeBul = (kod: string) => calistir(async () => {
    const satir = al(await sb.rpc('kasa_uye_bul', { p_kod: kod.trim() })) as Uye[];
    if (!satir?.length) throw new Error('UYE_YOK');
    setAdet(1);
    setDurum({ adim: 'uye', kod: kod.trim(), uye: satir[0] });
  });

  const damgaVer = (zorla: boolean) => calistir(async () => {
    if (durum.adim !== 'uye') return;
    const r = (al(await sb.rpc('damga_ver', { p_kod: durum.kod, p_adet: adet, p_zorla: zorla })) as { damga: number; hak: number; hedef: number; yeni_hak: number }[])[0];
    setDurum({
      adim: 'sonuc', baslik: `+${adet} damga verildi`, doldu: r.yeni_hak > 0,
      metin: `Yeni durum: ${r.damga}/${r.hedef}` + (r.hak > 0 ? ` · bedava kahve hakkı: ${r.hak}` : ''),
    });
    bugunuYenile();
  });

  const bedava = () => calistir(async () => {
    if (durum.adim !== 'uye') return;
    const r = (al(await sb.rpc('bedava_kullandir', { p_kod: durum.kod })) as { damga: number; hak: number }[])[0];
    setDurum({ adim: 'sonuc', baslik: 'Bedava kahve kullanıldı', metin: `Afiyet olsun! Kalan hak: ${r.hak}`, doldu: false });
  });

  const basaDon = () => { setDurum({ adim: 'tara' }); setHata(null); setElle(''); setTur((t) => t + 1); };

  return (
    <div className="sayfa dar">
      <div className="satir">
        <h1 className="ara">Damga ver</h1>
        {bugun != null ? <span className="rozet yesil">Bugün {bugun} damga</span> : null}
      </div>

      {hata ? <p className="mesaj hata" role="alert">{hata.metin}</p> : null}

      {durum.adim === 'tara' ? (
        <div className="kart">
          <KameraOkuyucu key={tur} onKod={uyeBul} />
          <form className="satir" onSubmit={(e) => { e.preventDefault(); if (elle.trim()) uyeBul(elle); }}>
            <label className="alan ara">Ya da kodu girin (barkod okuyucu da buraya yazar)
              <input value={elle} onChange={(e) => setElle(e.target.value)} placeholder="QR kodu" autoComplete="off" />
            </label>
            <button className="dugme" style={{ alignSelf: 'flex-end' }} disabled={!elle.trim() || bekliyor}>Bul</button>
          </form>
          <p className="soluk">Kod her dakika yenilenir; ekran görüntüsüyle damga verilemez.</p>
        </div>
      ) : null}

      {durum.adim === 'uye' ? (
        <>
          <div className="kart">
            <div className="satir">
              <div className="ara">
                <h2>{durum.uye.ad}</h2>
                <p className="soluk">Son damga: {tarihSaat(durum.uye.son_ziyaret)}</p>
              </div>
              <span className="rozet yesil">{durum.uye.damga} / {durum.uye.hedef}</span>
            </div>
            <Damgalar dolu={durum.uye.damga} hedef={durum.uye.hedef} />
            <p className="soluk">Bedava kahve hakkı: <b>{durum.uye.hak}</b></p>
          </div>
          <div className="kart">
            <h3>Kaç kahve aldı?</h3>
            <div className="adet">
              <button aria-label="Bir azalt" onClick={() => setAdet((a) => Math.max(1, a - 1))}>−</button>
              <b aria-live="polite">{adet}</b>
              <button className="dolu" aria-label="Bir artır" onClick={() => setAdet((a) => Math.min(10, a + 1))}>+</button>
            </div>
            <p className="soluk" style={{ textAlign: 'center' }}>
              {durum.uye.damga + adet >= durum.uye.hedef
                ? `Kart dolacak: ${Math.floor((durum.uye.damga + adet) / durum.uye.hedef)} bedava kahve hakkı`
                : `Yeni durum: ${durum.uye.damga + adet}/${durum.uye.hedef}`}
            </p>
          </div>
          <button className="dugme buyuk" disabled={bekliyor} onClick={() => damgaVer(false)}>+{adet} damga ver</button>
          {durum.uye.hak > 0 ? <button className="dugme buyuk cizgi" disabled={bekliyor} onClick={bedava}>Bedava kahve kullandır ({durum.uye.hak} hak)</button> : null}
          {hata?.onay && yonetici ? <button className="dugme cizgi" disabled={bekliyor} onClick={() => damgaVer(true)}>Yönetici onayıyla yine de ver</button> : null}
          <button className="dugme metin" onClick={basaDon}>Vazgeç</button>
        </>
      ) : null}

      {durum.adim === 'sonuc' ? (
        <div className="kart" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24 }}>{durum.baslik}</h2>
          <p>{durum.metin}</p>
          {durum.doldu ? <p className="mesaj tamam">Kart doldu: müşteriye bedava kahve hakkını söyleyin.</p> : null}
          <button className="dugme buyuk" style={{ alignSelf: 'stretch' }} onClick={basaDon}>Sonraki müşteri</button>
        </div>
      ) : null}

    </div>
  );
}
