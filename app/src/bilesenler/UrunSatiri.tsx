import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { renk, tl } from '../tema';
import type { Urun } from '../veri/tipler';
import { Ikon, Rozet, Yazi } from './ortak';

export function vitrinYazisi(u: Urun): string | null {
  if (u.vitrin_durumu === 'tukendi') return 'Tükendi';
  if (u.vitrin_durumu === 'firin') return u.vitrin_notu || 'Fırından yeni çıktı';
  if (u.vitrin_durumu === 'son') return u.vitrin_notu || 'Son birkaç';
  return null;
}

export function UrunSatiri({ urun, favori, foto = true }: { urun: Urun; favori?: boolean; foto?: boolean }) {
  const vitrin = vitrinYazisi(urun);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/urun/[id]', params: { id: urun.id } })}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: renk.cizgi }, pressed && { opacity: 0.7 }]}
    >
      {foto ? (
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: renk.krem, alignItems: 'center', justifyContent: 'center' }}>
          <Ikon ad="image" renkKodu={renk.soluk} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Yazi tur="kalin">{urun.ad}</Yazi>
        {urun.ad_en && urun.ad_en !== urun.ad ? <Yazi tur="italik">{urun.ad_en}</Yazi> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {urun.fiyat != null ? <Yazi tur="fiyat">{tl(urun.fiyat)}</Yazi> : null}
          {vitrin ? <Rozet metin={vitrin} /> : null}
        </View>
      </View>
      {favori ? <Ikon ad="heart" boy={18} /> : null}
      <Ikon ad="chevron-right" boy={18} renkKodu={renk.soluk} />
    </Pressable>
  );
}
