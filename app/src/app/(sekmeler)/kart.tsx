import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Dugme, Ekran, Ikon, Kutu, s, Yazi } from '../../bilesenler/ortak';
import { renk } from '../../tema';
import { kaynak } from '../../veri/kaynak';
import type { SonZiyaret } from '../../veri/tipler';
import { useVeri } from '../../veri/VeriSaglayici';

// QR kodu sunucuda imzalanır, dakikada bir değişir (ekran görüntüsüyle damga alınamaz)
function useQr(etkin: boolean) {
  const [kod, setKod] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    if (!etkin) return;
    let iptal = false;
    const al = () => kaynak.qrKodu().then((k) => { if (!iptal) { setKod(k); setHata(null); } }).catch((e) => !iptal && setHata(String(e.message ?? e)));
    al();
    const t = setInterval(al, 30000);
    return () => { iptal = true; clearInterval(t); };
  }, [etkin]));
  return { kod, hata };
}

export default function KahveKarti() {
  const v = useVeri();
  const { kod, hata } = useQr(!!v.uye);
  const [sonZiyaret, setZiyaret] = useState<SonZiyaret | null>(null);
  const uyeId = v.uye?.id;
  const { oturumYenile } = v;
  const ziyaret = uyeId ? sonZiyaret : null;

  useFocusEffect(useCallback(() => {
    if (!uyeId) return;
    oturumYenile();
    kaynak.sonZiyaret().then(setZiyaret).catch(() => {});
  }, [uyeId, oturumYenile]));

  if (!v.uye || !v.kart) {
    return (
      <Ekran>
        <View style={[s.kenar, { gap: 16 }]}>
          <Yazi tur="buyukBaslik">Kahve kartı</Yazi>
          <Kutu tur="krem" style={{ gap: 12 }}>
            <Yazi tur="kalin" style={{ fontSize: 19 }}>Her kahve bir damga</Yazi>
            <Yazi>Kart dolunca bir kahve bizden. Telefon numaranızla bir dakikada üye olun.</Yazi>
            <Dugme yazi="Üye ol / giriş yap" onPress={() => router.push('/giris')} />
          </Kutu>
        </View>
      </Ekran>
    );
  }
  const k = v.kart;

  return (
    <Ekran>
      <Yazi tur="buyukBaslik" style={s.kenar}>Kahve kartı</Yazi>
      <View style={s.kenar}>
        <Kutu tur="ana" style={{ alignItems: 'center', gap: 16, padding: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, minWidth: 218, minHeight: 218, alignItems: 'center', justifyContent: 'center' }}>
            {kod ? <QRCode value={kod} size={190} color="#141414" backgroundColor="#FFFFFF" ecl="M" /> : <Yazi>{hata ? 'QR alınamadı' : 'Hazırlanıyor…'}</Yazi>}
          </View>
          <Yazi style={{ color: renk.krem, textAlign: 'center' }}>Kasada gösterin; kasiyerimiz okutur, damganız anında işlenir.</Yazi>
          <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>Kod her dakika yenilenir</Yazi>
        </Kutu>
      </View>

      <View style={s.kenar}>
        <Kutu tur="krem" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Yazi tur="kucuk">Damgalarınız</Yazi>
            <Yazi tur="buyukBaslik">{k.damga} / {k.hedef}</Yazi>
          </View>
          <Yazi style={{ color: renk.ana, textAlign: 'right' }}>
            {k.hak > 0 ? `${k.hak} bedava kahve\nhakkınız var` : `Bedava kahveye\n${k.hedef - k.damga} kahve`}
          </Yazi>
        </Kutu>
      </View>

      {ziyaret ? (
        <View style={s.kenar}>
          <Kutu style={{ alignItems: 'center' }}>
            <Yazi tur="kucuk">Son ziyaret · {new Date(ziyaret.zaman).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })} · +{ziyaret.adet} damga</Yazi>
            <Yazi tur="kalin">Son ziyaretiniz nasıldı?</Yazi>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} yıldız`} hitSlop={4}
                  onPress={async () => { setZiyaret({ ...ziyaret, puan: n }); await kaynak.puanla(ziyaret.hareket_id, n).catch(() => {}); }}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Ikon ad="star" boy={28} renkKodu={ziyaret.puan != null && n <= ziyaret.puan ? renk.ana : renk.kapali} />
                </Pressable>
              ))}
            </View>
            {ziyaret.puan != null ? (
              <Yazi tur="kucuk" style={{ textAlign: 'center' }}>
                {ziyaret.puan >= 4 ? 'Teşekkürler! Yine bekleriz.' : 'Üzgünüz. Notunuz şube müdürüne iletildi; size dönüş yapacağız.'}
              </Yazi>
            ) : null}
          </Kutu>
        </View>
      ) : null}

      <View style={s.kenar}>
        <Yazi tur="baslik" style={{ marginBottom: 4 }}>Nasıl çalışır</Yazi>
        {[
          'Kasada QR’ınızı gösterin; kasiyerimiz okutur.',
          'Aldığınız her kahve kartınıza 1 damga ekler.',
          `${k.hedef} damga dolunca bir kahve bizden; istediğiniz boy ve çeşit.`,
        ].map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: renk.cizgi }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
              <Yazi tur="kalin">{i + 1}</Yazi>
            </View>
            <Yazi style={{ flex: 1, color: renk.murekkep }}>{m}</Yazi>
          </View>
        ))}
      </View>

      <View style={s.kenar}>
        <Kutu style={{ backgroundColor: renk.fiyat, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Ikon ad={k.kart_doldu > 0 ? 'unlock' : 'lock'} boy={26} renkKodu={renk.krem} />
          <View style={{ flex: 1, gap: 2 }}>
            <Yazi tur="kalin" style={{ color: renk.krem, fontSize: 17 }}>Gizli menü</Yazi>
            <Yazi tur="kucuk" style={{ color: '#D8D2C0' }}>
              {k.kart_doldu > 0 ? 'Açıldı! Kasada “gizli menü” deyin.' : 'Kartınızı bir kez doldurduğunuzda açılır: yalnız müdavimlere özel içecekler.'}
            </Yazi>
          </View>
        </Kutu>
      </View>

      <View style={s.kenar}>
        <Kutu tur="krem" style={{ gap: 10 }}>
          <Yazi tur="kalin" style={{ fontSize: 18 }}>Arkadaşını getir</Yazi>
          <Yazi>Davet kodunla üye olan arkadaşın ilk damgasını aldığında ikinize de 1 damga.</Yazi>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ flex: 1, height: 44, borderWidth: 2, borderStyle: 'dashed', borderColor: renk.ana, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Yazi tur="kalin" style={{ letterSpacing: 2 }}>{v.uye.davet_kodu}</Yazi>
            </View>
            <Dugme yazi="Paylaş" onPress={() => Share.share({ message: `Hamour’da kahve kartı: üye olurken ${v.uye!.davet_kodu} kodunu yaz, ilk damganda ikimize de bir damga.` })} />
          </View>
        </Kutu>
      </View>
    </Ekran>
  );
}
