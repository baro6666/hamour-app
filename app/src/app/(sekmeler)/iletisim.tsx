import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto } from '../../bilesenler/Foto';
import { Dugme, Ikon, Yazi } from '../../bilesenler/ortak';
import { ara, Perde, rezervasyonAc } from '../../bilesenler/vitrin';
import { renk, yazi } from '../../tema';
import { GORSEL, ILETISIM } from '../../veri/icerik';
import { useDil } from '../../dil/DilSaglayici';
import type { ComponentProps } from 'react';

function Satir({ ikon, baslik, deger, onPress }: { ikon: ComponentProps<typeof Ikon>['ad']; baslik: string; deger: string; onPress?: () => void }) {
  const { rtl } = useDil();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
        <Ikon ad={ikon} renkKodu={renk.ana} boy={19} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Yazi tur="kucuk">{baslik}</Yazi>
        <Yazi style={{ color: renk.kahve, fontFamily: yazi.orta, fontSize: 15.5 }}>{deger}</Yazi>
      </View>
      {onPress ? <Ikon ad={rtl ? 'chevron-left' : 'chevron-right'} renkKodu={renk.soluk} boy={18} /> : null}
    </Pressable>
  );
}

export default function Iletisim() {
  const ic = useSafeAreaInsets();
  const harita = () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent('Hamour ' + ILETISIM.adres)}`);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ paddingBottom: 44, gap: 22 }}>
      <View style={{ height: 300 + ic.top, backgroundColor: renk.kahve }}>
        <Foto kaynak={GORSEL.salon} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <Perde guc={0.9} />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, gap: 6 }}>
          <Yazi tur="ust" style={{ color: renk.anaUstuSoluk }}>Keyif dolu anlar sizi bekliyor</Yazi>
          <Yazi tur="buyukBaslik" style={{ color: renk.krem, fontSize: 32, lineHeight: 38 }}>{ILETISIM.sube}</Yazi>
        </View>
      </View>

      <View style={{ marginHorizontal: 20, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, paddingHorizontal: 16 }}>
        <Satir ikon="message-circle" baslik="WhatsApp ile rezervasyon" deger="Masa ayırtın" onPress={rezervasyonAc} />
        <Satir ikon="map-pin" baslik="Adres" deger={ILETISIM.adres} onPress={harita} />
        {ILETISIM.calismaSaatleri ? <Satir ikon="clock" baslik="Çalışma saatleri" deger={ILETISIM.calismaSaatleri} /> : null}
        {ILETISIM.telefonlar.map((t) => <Satir key={t.numara} ikon="phone" baslik={t.etiket} deger={t.numara} onPress={() => ara(t.numara)} />)}
        <Satir ikon="mail" baslik="E-posta" deger={ILETISIM.eposta} onPress={() => Linking.openURL(`mailto:${ILETISIM.eposta}`)} />
        <Satir ikon="instagram" baslik="Instagram" deger={`@${ILETISIM.instagram}`} onPress={() => Linking.openURL(`https://www.instagram.com/${ILETISIM.instagram}/`)} />
        <Satir ikon="globe" baslik="Web" deger={ILETISIM.web} onPress={() => Linking.openURL(`https://${ILETISIM.web}`)} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
        <Dugme yazi="Rezervasyon" onPress={rezervasyonAc} style={{ flex: 1 }} />
        <Dugme yazi="Hemen ara" tur="cizgi" onPress={() => ara(ILETISIM.telefonlar[0].numara)} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
