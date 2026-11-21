import { View } from 'react-native';
import { renk } from '../tema';
import type { KartDurumu } from '../veri/tipler';
import { Ikon, Kutu, Yazi } from './ortak';

export function DamgaKarti({ kart, children }: { kart: KartDurumu; children?: React.ReactNode }) {
  const kalan = kart.hedef - kart.damga;
  return (
    <Kutu tur="ana" style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Yazi tur="ust" style={{ color: renk.krem }}>Kahve kartı</Yazi>
        <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>{kart.damga} / {kart.hedef}</Yazi>
      </View>
      <Yazi tur="baslik" style={{ color: renk.krem, fontSize: 23 }}>
        {kart.hak > 0 ? `${kart.hak} bedava kahve hakkınız var` : `${kalan} kahve sonra bir kahve bizden`}
      </Yazi>
      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`${kart.damga} damga, hedef ${kart.hedef}`}>
        {Array.from({ length: kart.hedef }, (_, i) => (
          <View key={i} style={{
            flex: 1, aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: renk.krem,
            backgroundColor: i < kart.damga ? renk.krem : 'transparent', alignItems: 'center', justifyContent: 'center',
          }}>
            {i < kart.damga ? <Ikon ad="coffee" boy={14} renkKodu={renk.ana} /> : null}
          </View>
        ))}
      </View>
      {children}
    </Kutu>
  );
}
