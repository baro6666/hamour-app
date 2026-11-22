import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto } from '../../bilesenler/Foto';
import { Logo, Simge } from '../../bilesenler/Logo';
import { Dugme, Ikon, Yazi } from '../../bilesenler/ortak';
import { BolumBaslik, Perde, Sus } from '../../bilesenler/vitrin';
import { renk, yazi } from '../../tema';
import { GORSEL, HIKAYE, ILETISIM, ISBIRLIKLERI, KURUMSAL, SOSYAL_GORSELLER } from '../../veri/icerik';

const instagram = () => Linking.openURL(`https://www.instagram.com/${ILETISIM.instagram}/`);

export default function Hamour() {
  const ic = useSafeAreaInsets();
  const kurumsal = KURUMSAL.filter((k) => k.deger);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ paddingBottom: 44, gap: 34 }}>
      {/* Kapak */}
      <View style={{ height: 360 + ic.top, backgroundColor: renk.kahve }}>
        <Foto kaynak={GORSEL.patiseriTezgah} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <Perde guc={0.9} />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, gap: 10 }}>
          <Logo boy={170} renkKodu={renk.krem} />
          <Yazi style={{ color: renk.krem, fontFamily: yazi.baslikItalik, fontSize: 20, lineHeight: 27 }}>
            Patiseri, brasserie ve bistro kültürü bir arada.
          </Yazi>
        </View>
      </View>

      {/* Hikâye */}
      <View style={{ gap: 16 }}>
        <BolumBaslik ust="Hikâyemiz" baslik="Uzaklara gitmeden Paris" />
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {HIKAYE.map((p, i) => <Yazi key={i} style={{ fontSize: 15.5, lineHeight: 24 }}>{p}</Yazi>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
          <View style={{ flex: 1, gap: 10 }}>
            <Foto kaynak={GORSEL.hikaye[0]} style={{ height: 220, borderRadius: 18 }} />
            <Foto kaynak={GORSEL.hikaye[2]} style={{ height: 160, borderRadius: 18 }} />
          </View>
          <View style={{ flex: 1, gap: 10, marginTop: 34 }}>
            <Foto kaynak={GORSEL.hikaye[1]} style={{ height: 160, borderRadius: 18 }} />
            <Foto kaynak={GORSEL.hikaye[3]} style={{ height: 220, borderRadius: 18 }} />
          </View>
        </View>
        <Yazi style={{ paddingHorizontal: 20, fontFamily: yazi.baslikItalik, fontSize: 19, lineHeight: 27, color: renk.ana, textAlign: 'center' }}>
          “Tüm misafirlerimizle Hamour lezzetlerinde buluşmak dileğiyle.”
        </Yazi>
      </View>

      <Sus />

      {/* Kurumsal yapı */}
      <View style={{ gap: 16 }}>
        <BolumBaslik ust="Kurumsal" baslik="Kurumsal yapı" />
        <View style={{ marginHorizontal: 20, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, paddingHorizontal: 18 }}>
          {kurumsal.map((k, i) => (
            <View key={k.baslik} style={{ flexDirection: 'row', paddingVertical: 14, gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: renk.cizgi }}>
              <Yazi style={{ width: 130, fontFamily: yazi.orta, color: renk.soluk, fontSize: 14 }}>{k.baslik}</Yazi>
              <Yazi style={{ flex: 1, color: renk.kahve, fontSize: 14.5 }}>{k.deger}</Yazi>
            </View>
          ))}
        </View>
      </View>

      {/* İşbirlikleri */}
      <View style={{ gap: 16 }}>
        <BolumBaslik ust="Birlikte" baslik="İşbirlikleri" />
        {ISBIRLIKLERI.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {ISBIRLIKLERI.map((b) => (
              <View key={b.ad} style={{ width: 230, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, overflow: 'hidden' }}>
                {b.gorsel ? <Foto kaynak={b.gorsel} style={{ height: 140 }} /> : null}
                <View style={{ padding: 16, gap: 6 }}>
                  <Yazi style={{ fontFamily: yazi.baslik, fontSize: 18, color: renk.kahve }}>{b.ad}</Yazi>
                  {b.aciklama ? <Yazi tur="kucuk">{b.aciklama}</Yazi> : null}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={{ marginHorizontal: 20, borderRadius: 22, backgroundColor: renk.ana, padding: 22, gap: 10, overflow: 'hidden' }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -40, bottom: -36 }}>
            <Simge boy={190} renkKodu={renk.krem} opaklik={0.1} />
          </View>
          <Yazi tur="buyukBaslik" style={{ color: renk.krem, fontSize: 23, lineHeight: 29 }}>Hamour ile birlikte</Yazi>
          <Yazi style={{ color: renk.anaUstuSoluk, fontSize: 14.5, lineHeight: 21 }}>
            Marka işbirlikleri, etkinlikler ve kurumsal projeler için bize yazın.
          </Yazi>
          <Dugme yazi="İşbirliği teklifi gönder" ters style={{ marginTop: 6 }}
            onPress={() => Linking.openURL(`mailto:${ILETISIM.eposta}?subject=${encodeURIComponent('İşbirliği')}`)} />
        </View>
      </View>

      {/* Sosyal medya */}
      <View style={{ gap: 16 }}>
        <BolumBaslik ust="Sosyal medya" baslik={`@${ILETISIM.instagram}`} sag="Instagram’da aç" onSag={instagram} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 20 }}>
          {SOSYAL_GORSELLER.map((g, i) => (
            <Pressable key={i} accessibilityRole="link" accessibilityLabel="Instagram" onPress={instagram} style={{ width: '32.4%', aspectRatio: 4 / 5 }}>
              <Foto kaynak={g} style={{ flex: 1, borderRadius: 6 }} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
          <Pressable accessibilityRole="link" onPress={instagram}
            style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: renk.kahve, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ikon ad="instagram" renkKodu={renk.krem} boy={19} />
            <Yazi style={{ color: renk.krem, fontFamily: yazi.kalin }}>Instagram</Yazi>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`https://www.facebook.com/${ILETISIM.facebook}`)}
            style={{ flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: renk.kahve, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ikon ad="facebook" renkKodu={renk.kahve} boy={19} />
            <Yazi style={{ color: renk.kahve, fontFamily: yazi.kalin }}>Facebook</Yazi>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
