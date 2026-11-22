import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Simge } from '../../bilesenler/Logo';
import { Anahtar, Dugme, Ikon, Yazi } from '../../bilesenler/ortak';
import { renk, yazi } from '../../tema';
import { kaynak } from '../../veri/kaynak';
import type { Kampanya } from '../../veri/tipler';
import { useVeri } from '../../veri/VeriSaglayici';

// QR sunucuda imzalanır, her dakika değişir: ekran görüntüsüyle indirim alınamaz.
function useQr(etkin: boolean) {
  const [kod, setKod] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  useFocusEffect(useCallback(() => {
    if (!etkin) return;
    let iptal = false;
    const al = () => kaynak.qrKodu().then((k) => { if (!iptal) { setKod(k); setHata(false); } }).catch(() => !iptal && setHata(true));
    al();
    const t = setInterval(al, 30000);
    return () => { iptal = true; clearInterval(t); };
  }, [etkin]));
  return { kod, hata };
}

function onayla(baslik: string, metin: string, evet: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${baslik}\n\n${metin}`) ?? false);
  return new Promise((coz) => Alert.alert(baslik, metin, [
    { text: 'Vazgeç', style: 'cancel', onPress: () => coz(false) },
    { text: evet, style: 'destructive', onPress: () => coz(true) },
  ]));
}

const saat = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function KampanyaSatiri({ k, uye }: { k: Kampanya; uye: boolean }) {
  const kullanildi = k.tek_kullanim && !!k.kullanildi;
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: kullanildi ? renk.kremKutu : renk.kart, borderWidth: 1, borderColor: renk.cizgi, opacity: kullanildi ? 0.75 : 1 }}>
      <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: kullanildi ? renk.kapali : renk.ana, alignItems: 'center', justifyContent: 'center' }}>
        <Yazi style={{ fontFamily: yazi.baslik, fontSize: 21, color: renk.krem }}>%{k.oran}</Yazi>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Yazi style={{ fontFamily: yazi.baslik, fontSize: 17, color: renk.kahve }}>{k.baslik}</Yazi>
        {k.kapsam ? <Yazi tur="kucuk">{k.kapsam}</Yazi> : null}
        <Yazi tur="kucuk" style={{ color: kullanildi ? renk.soluk : renk.ana, fontFamily: yazi.orta }}>
          {kullanildi ? `Kullanıldı · ${saat(k.kullanildi!)}`
            : k.tur === 'hosgeldin' ? (uye ? 'Kullanılabilir · ilk ziyaretinizde bir kez' : 'Üye olunca ilk ziyaretinizde')
            : k.bitis ? `${saat(k.bitis)}'e kadar` : 'Geçerli'}
        </Yazi>
      </View>
    </View>
  );
}

export default function HamourKarti() {
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const { kod, hata } = useQr(!!v.uye);
  const { oturumYenile } = v;
  const uyeId = v.uye?.id;
  useFocusEffect(useCallback(() => { if (uyeId) oturumYenile(); }, [uyeId, oturumYenile]));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ paddingTop: ic.top + 14, paddingBottom: 44, gap: 20 }}>
      <View style={{ paddingHorizontal: 20, gap: 4 }}>
        <Yazi tur="ust">Uygulamaya özel</Yazi>
        <Yazi tur="buyukBaslik">Hamour Kartı</Yazi>
      </View>

      {/* Kart: üye değilse davet, üyeyse QR */}
      <View style={{ marginHorizontal: 20, borderRadius: 26, backgroundColor: renk.kahve, padding: 24, alignItems: 'center', gap: 16, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -40 }}>
          <Simge boy={240} renkKodu={renk.krem} opaklik={0.07} />
        </View>
        {v.uye ? (
          <>
            <Yazi style={{ color: renk.krem, fontFamily: yazi.baslik, fontSize: 22 }}>{v.uye.ad ?? 'Hamour Kartı'}</Yazi>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, width: 228, height: 228, alignItems: 'center', justifyContent: 'center' }}>
              {kod ? <QRCode value={kod} size={198} color={renk.kahve} backgroundColor="#FFFFFF" ecl="M" />
                : <Yazi>{hata ? 'Kod alınamadı. İnternetinizi kontrol edin.' : 'Hazırlanıyor…'}</Yazi>}
            </View>
            <Yazi style={{ color: renk.krem, textAlign: 'center' }}>Kasada gösterin; indiriminiz anında uygulanır.</Yazi>
            <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>Kod her dakika yenilenir</Yazi>
          </>
        ) : (
          <>
            <Yazi style={{ color: renk.krem, fontFamily: yazi.baslik, fontSize: 54, lineHeight: 60 }}>%5</Yazi>
            <Yazi style={{ color: renk.krem, fontFamily: yazi.baslik, fontSize: 23, textAlign: 'center' }}>Hoş geldin indirimi</Yazi>
            <Yazi style={{ color: renk.anaUstuSoluk, textAlign: 'center' }}>
              Uygulamayı indirdiğiniz için ilk ziyaretinizde %5 indirim. Alkollü içecekler hariç.
            </Yazi>
            <Dugme yazi="E-postayla üye olun" ters onPress={() => router.push('/giris')} style={{ alignSelf: 'stretch' }} />
            <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>Şifre yok, SMS yok; bir dakika sürer.</Yazi>
          </>
        )}
      </View>

      {v.kampanyalar.length ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Yazi tur="baslik">İndirimleriniz</Yazi>
          {v.kampanyalar.map((k) => <KampanyaSatiri key={k.id} k={k} uye={!!v.uye} />)}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Yazi tur="baslik">Nasıl çalışır</Yazi>
        {[
          'E-posta adresinizle bir kez üye olun.',
          'Kasada Hamour Kartı’nızı gösterin; kasiyerimiz okutur.',
          'Hoş geldin indiriminiz ilk ziyaretinizde, kampanyalar geçerli oldukları sürece uygulanır.',
        ].map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: renk.cizgi }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
              <Yazi style={{ fontFamily: yazi.kalin, color: renk.kahve }}>{i + 1}</Yazi>
            </View>
            <Yazi style={{ flex: 1, color: renk.kahve }}>{m}</Yazi>
          </View>
        ))}
      </View>

      {v.uye ? (
        <View style={{ marginHorizontal: 20, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, padding: 18, gap: 14 }}>
          <Yazi tur="ust">Hesap</Yazi>
          {v.uye.eposta ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ikon ad="mail" boy={18} renkKodu={renk.soluk} />
              <Yazi style={{ color: renk.kahve }}>{v.uye.eposta}</Yazi>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Yazi style={{ flex: 1, color: renk.kahve }}>Kampanya ve etkinlik bildirimleri</Yazi>
            <Anahtar etiket="Kampanya bildirimleri" acik={v.uye.kampanya_izni} onChange={(acik) => v.bildirimAyari({ kampanya_izni: acik })} />
          </View>
          <Dugme yazi="Çıkış yap" tur="cizgi" onPress={async () => { await kaynak.cikis(); await v.oturumYenile(); }} />
          <Dugme yazi="Hesabımı sil" tur="metin" yaziRengi={renk.tehlike}
            onPress={async () => {
              if (!(await onayla('Hesabınız silinsin mi?', 'Hamour Kartı, indirim geçmişiniz ve e-posta adresiniz kalıcı olarak silinir.', 'Sil'))) return;
              await kaynak.hesabiSil(); await v.oturumYenile();
            }} />
        </View>
      ) : null}
    </ScrollView>
  );
}
