import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo, Simge } from '../bilesenler/Logo';
import { Dugme, Ikon, Kutu, s, Yazi } from '../bilesenler/ortak';
import { renk, yazi } from '../tema';

// Metinler hamour.com.tr "Hikayemiz" sayfasından özetlendi (Kasım 2026); Hamour onaylayınca kesinleşir
export default function Marka() {
  const ic = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ paddingBottom: ic.bottom + 32 }}>
      <View style={{ backgroundColor: renk.ana, paddingTop: ic.top + 16, paddingHorizontal: 24, paddingBottom: 32, gap: 18, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -70, bottom: -60 }}>
          <Simge boy={300} renkKodu={renk.krem} opaklik={0.08} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: renk.anaKoyu, alignItems: 'center', justifyContent: 'center' }}>
          <Ikon ad="arrow-left" renkKodu={renk.krem} />
        </Pressable>
        <View style={{ gap: 6 }}>
          <Logo boy={230} renkKodu={renk.krem} />
          <Yazi style={{ color: renk.krem, letterSpacing: 4, fontSize: 13 }}>pâtisserie · brasserie · bistro</Yazi>
        </View>
        <Yazi tur="baslik" style={{ color: renk.krem, fontFamily: yazi.baslikItalik, fontSize: 24, lineHeight: 32 }}>Paris’in büyülü bir caddesindeymiş gibi.</Yazi>
      </View>
      <View style={[s.kenar, { gap: 18, paddingTop: 24 }]}>
        <Yazi style={{ fontSize: 16, lineHeight: 25 }}>
          Hamour, taze ekmek kokusunu ve Paris pastanelerinin lezzetini yurt dışına gitmeden yaşatmak için doğdu. Patiseri, brasserie ve bistro kültürünü bir araya getirir; kahvaltıdan akşam yemeğine, günlük kahveden kutlamalara kadar.
        </Yazi>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            ['Royal Breakfast', 'Eggs Benedict’ten pişiye'],
            ['Patiseri', 'Her gün taze kruvasan'],
            ['Pasta', 'Günlük taze, kutlamalara özel'],
            ['Bistro', 'Pizza, bowl, makarna, Café de Paris'],
          ].map(([b, a]) => (
            <Kutu key={b} tur="krem" style={{ flexBasis: '47%', flexGrow: 1, padding: 16, gap: 4 }}>
              <Yazi tur="kalin" style={{ fontSize: 18 }}>{b}</Yazi>
              <Yazi tur="kucuk">{a}</Yazi>
            </Kutu>
          ))}
        </View>
        <View style={{ borderTopWidth: 2, borderTopColor: renk.ana, paddingTop: 16, gap: 6 }}>
          <Yazi tur="ust">Markanın sesi</Yazi>
          <Yazi tur="buyukBaslik" style={{ fontSize: 26 }}>Zarif. Taze. Özenli.</Yazi>
          <Yazi>Doğal ve kaliteli malzeme, organik ve taze ürünler. Her ürünün içeriği ve alerjen bilgisi ürün sayfasında.</Yazi>
        </View>
        <Kutu>
          <Yazi tur="kalin">Hamour Beykoz</Yazi>
          <Yazi>Kahvaltı, öğle ve akşam; kutlama pastaları için ön sipariş.</Yazi>
        </Kutu>
        <Dugme yazi="Menüyü keşfet" onPress={() => router.navigate('/menu')} />
      </View>
    </ScrollView>
  );
}
