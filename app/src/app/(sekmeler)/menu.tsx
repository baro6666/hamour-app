import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ekran, Kutu, s, Yazi } from '../../bilesenler/ortak';
import { UrunSatiri } from '../../bilesenler/UrunSatiri';
import { renk, yazi } from '../../tema';
import { useVeri } from '../../veri/VeriSaglayici';

export default function Menu() {
  const v = useVeri();
  const [kat, setKat] = useState<string | null>(null);
  const secili = kat ?? v.menu.kategoriler[0]?.id ?? null;
  const urunler = useMemo(() => v.menu.urunler.filter((u) => u.kategori_id === secili), [v.menu.urunler, secili]);
  const onSiparis = urunler.some((u) => u.on_siparis);

  return (
    <Ekran>
      <View style={[s.kenar, { gap: 4 }]}>
        <Yazi tur="buyukBaslik">Menü</Yazi>
        <Yazi tur="kucuk">{v.menu.sube?.ad ?? 'Hamour'} · vitrin bilgisi canlı</Yazi>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {v.menu.kategoriler.map((k) => {
          const on = k.id === secili;
          return (
            <Pressable key={k.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setKat(k.id)}
              style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: renk.ana, backgroundColor: on ? renk.ana : 'transparent', justifyContent: 'center' }}>
              <Text style={{ fontFamily: yazi.kalin, fontSize: 14, color: on ? renk.krem : renk.ana }}>{k.ad}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {onSiparis ? (
        <View style={s.kenar}>
          <Kutu tur="krem"><Yazi style={{ color: renk.ana }}>Bütün pasta ve kutular için uygulamadan talep bırakın; şubemiz sizi arayıp onaylar, ödeme teslimde.</Yazi></Kutu>
        </View>
      ) : null}
      <View style={s.kenar}>
        {urunler.map((u) => <UrunSatiri key={u.id} urun={u} favori={v.favoriler.has(u.id)} />)}
        {!urunler.length && v.hazir ? <Yazi>Bu kategoride şu an ürün yok.</Yazi> : null}
      </View>
    </Ekran>
  );
}
