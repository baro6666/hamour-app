import { Pressable, View } from 'react-native';
import { DILLER, useDil, type Dil } from '../dil/DilSaglayici';
import { renk, yazi } from '../tema';
import { Yazi } from './ortak';

const KISA: Record<Dil, string> = { tr: 'TR', en: 'EN', ar: 'ع' };

/** Küçük: kapak fotoğrafı üstünde (krem / yarı saydam). Büyük: ayar kartı. */
export function DilSecici({ buyuk = false }: { buyuk?: boolean }) {
  const { dil, setDil } = useDil();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: buyuk ? 8 : 4, padding: buyuk ? 0 : 3, borderRadius: 20, backgroundColor: buyuk ? 'transparent' : 'rgba(61,29,14,0.45)' }}>
      {DILLER.map((d) => {
        const secili = d.kod === dil;
        return (
          <Pressable key={d.kod} accessibilityRole="radio" accessibilityState={{ selected: secili }} accessibilityLabel={d.ad}
            onPress={() => setDil(d.kod)} hitSlop={6}
            style={{
              minWidth: buyuk ? 0 : 38, flex: buyuk ? 1 : undefined, height: buyuk ? 46 : 32, paddingHorizontal: 10, borderRadius: buyuk ? 23 : 16,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: secili ? (buyuk ? renk.kahve : renk.krem) : (buyuk ? renk.kart : 'transparent'),
              borderWidth: buyuk ? 1 : 0, borderColor: secili ? renk.kahve : renk.cizgi,
            }}>
            <Yazi cevirme style={{ fontFamily: yazi.kalin, fontSize: buyuk ? 15 : 13, color: secili ? (buyuk ? renk.krem : renk.kahve) : (buyuk ? renk.kahve : renk.krem) }}>
              {buyuk ? d.ad : KISA[d.kod]}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}
