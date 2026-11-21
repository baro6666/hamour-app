import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Dugme, Ekran, s, Yazi } from '../../bilesenler/ortak';
import { renk, yazi } from '../../tema';
import type { Duyuru, DuyuruTuru } from '../../veri/tipler';
import { useVeri } from '../../veri/VeriSaglayici';

const TUR: Record<DuyuruTuru, { ad: string; kisa: string }> = {
  firin: { ad: 'Fırından yeni çıktı', kisa: 'F' },
  vitrin: { ad: 'Vitrin', kisa: 'V' },
  kampanya: { ad: 'Kampanya', kisa: '%' },
  yeni: { ad: 'Yeni ürün', kisa: 'Y' },
  etkinlik: { ad: 'Etkinlik', kisa: 'E' },
  kart: { ad: 'Kahve kartı', kisa: '★' },
};
const FILTRE: { id: string; ad: string; turler: DuyuruTuru[] | null }[] = [
  { id: 'tumu', ad: 'Tümü', turler: null },
  { id: 'firin', ad: 'Fırın ve vitrin', turler: ['firin', 'vitrin'] },
  { id: 'kampanya', ad: 'Kampanya', turler: ['kampanya'] },
  { id: 'yeni', ad: 'Yeni ürün', turler: ['yeni'] },
  { id: 'etkinlik', ad: 'Etkinlik', turler: ['etkinlik'] },
];

function neZaman(iso: string): string {
  const dk = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (dk < 1) return 'şimdi';
  if (dk < 60) return `${dk} dk önce`;
  if (dk < 24 * 60) return `${Math.round(dk / 60)} sa önce`;
  if (dk < 48 * 60) return 'dün';
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default function Duyurular() {
  const v = useVeri();
  const [filtre, setFiltre] = useState('tumu');
  const f = FILTRE.find((x) => x.id === filtre)!;
  const liste = v.duyurular.filter((d) => !f.turler || f.turler.includes(d.tur));
  const { yenile } = v;
  useFocusEffect(useCallback(() => { yenile(); }, [yenile]));

  const ac = (d: Duyuru) => {
    v.okunduYap([d.id]);
    if (d.urun_id) router.push({ pathname: '/urun/[id]', params: { id: d.urun_id } });
    else if (d.tur === 'kart') router.navigate('/kart');
  };

  return (
    <Ekran>
      <View style={[s.kenar, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Yazi tur="buyukBaslik">Duyurular</Yazi>
        {v.okunmamis > 0 ? <Dugme yazi="Tümünü okundu yap" tur="metin" onPress={() => v.okunduYap(v.duyurular.map((d) => d.id))} /> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {FILTRE.map((x) => {
          const on = x.id === filtre;
          return (
            <Pressable key={x.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setFiltre(x.id)}
              style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2, borderColor: renk.ana, backgroundColor: on ? renk.ana : 'transparent', justifyContent: 'center' }}>
              <Text style={{ fontFamily: yazi.kalin, fontSize: 14, color: on ? renk.krem : renk.ana }}>{x.ad}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[s.kenar, { gap: 12 }]}>
        {liste.map((d) => {
          const yeni = !!v.uye && !v.okunan.has(d.id);
          return (
            <Pressable key={d.id} accessibilityRole="button" onPress={() => ac(d)}
              style={{ flexDirection: 'row', gap: 14, backgroundColor: yeni ? renk.kart : '#F4EFDD', borderWidth: 1, borderColor: renk.cizgi, borderRadius: 18, padding: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: renk.ana, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: renk.krem, fontFamily: yazi.kalin }}>{TUR[d.tur].kisa}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Yazi tur="ust" style={{ letterSpacing: 1.5 }}>{TUR[d.tur].ad}</Yazi>
                  <Yazi tur="kucuk">{neZaman(d.yayin_zamani)}</Yazi>
                </View>
                <Yazi tur="kalin">{d.baslik}</Yazi>
                {d.metin ? <Yazi tur="kucuk" style={{ fontSize: 14 }}>{d.metin}</Yazi> : null}
              </View>
              {yeni ? <View accessibilityLabel="Okunmadı" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: renk.turuncu, marginTop: 4 }} /> : null}
            </Pressable>
          );
        })}
        {!liste.length && v.hazir ? <Yazi>Şimdilik duyuru yok.</Yazi> : null}
      </View>
    </Ekran>
  );
}
