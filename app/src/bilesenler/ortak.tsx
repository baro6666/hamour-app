import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useDil } from '../dil/DilSaglayici';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renk, yaziAilesi, yazi } from '../tema';
import { Simge } from './Logo';

type Tur = 'govde' | 'kucuk' | 'ust' | 'baslik' | 'buyukBaslik' | 'kalin' | 'italik' | 'fiyat';

const turler: Record<Tur, TextStyle> = {
  govde: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 22, color: renk.soluk },
  kucuk: { fontFamily: yazi.normal, fontSize: 13, lineHeight: 18, color: renk.soluk },
  ust: { fontFamily: yazi.orta, fontSize: 12, letterSpacing: 2, color: renk.anaKoyu },
  baslik: { fontFamily: yazi.baslik, fontSize: 21, color: renk.kahve },
  buyukBaslik: { fontFamily: yazi.baslik, fontSize: 30, lineHeight: 36, color: renk.kahve },
  kalin: { fontFamily: yazi.kalin, fontSize: 16, color: renk.kahve },
  italik: { fontFamily: yazi.italik, fontSize: 13, color: renk.soluk },
  fiyat: { fontFamily: yazi.fiyat, fontSize: 15, color: renk.fiyat },
};

// Yazi: düz metin çocuğu seçili dile çevrilir (dil/ceviriler.ts; karşılığı yoksa olduğu gibi kalır — ürün adı, üye adı).
// 'ust' türü büyük harf: textTransform 'uppercase' Türkçede i→I yapar (KİŞİ yerine KIŞI); dile göre toLocaleUpperCase.
// Arapçada yazı tipi Tajawal / Amiri'ye döner, metin sağdan sola ve sağa yaslı.
export function Yazi({ tur = 'govde', style, children, cevirme = false, ...p }: { tur?: Tur; style?: StyleProp<TextStyle>; children: ReactNode; cevirme?: boolean } & ComponentProps<typeof Text>) {
  const { t, buyukHarf, rtl } = useDil();
  let icerik = typeof children === 'string' && !cevirme ? t(children) : children;
  if (tur === 'ust' && typeof icerik === 'string') icerik = buyukHarf(icerik);
  const duz: TextStyle = StyleSheet.flatten([turler[tur], style]) ?? {};
  return (
    <Text {...p} style={[rtl && { textAlign: 'right', writingDirection: 'rtl' }, duz,
      rtl && { fontFamily: yaziAilesi(duz.fontFamily, true), letterSpacing: 0, lineHeight: duz.lineHeight ? duz.lineHeight * 1.12 : undefined }]}>{icerik}</Text>
  );
}

// Kaydırılabilir ekran; üstte güvenli alan
export function Ekran({ children, ust = true, yenile }: { children: ReactNode; ust?: boolean; yenile?: ReactNode }) {
  const ic = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.kagit }}
      contentContainerStyle={{ paddingTop: ust ? ic.top + 16 : 0, paddingBottom: 32, gap: 20 }}
      refreshControl={yenile as never}
    >
      {children}
    </ScrollView>
  );
}

export function Dugme({ yazi: metin, onPress, tur = 'dolu', ters = false, bekliyor = false, devreDisi = false, style, yaziRengi }: {
  yazi: string; onPress?: () => void; tur?: 'dolu' | 'cizgi' | 'metin'; ters?: boolean; bekliyor?: boolean; devreDisi?: boolean; style?: StyleProp<ViewStyle>; yaziRengi?: string;
}) {
  const { t, rtl } = useDil();
  const on = yaziRengi ?? (ters ? renk.krem : renk.ana);
  const arka = ters ? renk.ana : renk.krem;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={devreDisi || bekliyor}
      style={({ pressed }) => [
        s.dugme,
        tur === 'dolu' && { backgroundColor: on },
        tur === 'cizgi' && { borderWidth: 2, borderColor: on },
        tur === 'metin' && { height: 44, paddingHorizontal: 0 },
        (pressed || devreDisi) && { opacity: 0.6 },
        style,
      ]}
    >
      {bekliyor ? <ActivityIndicator color={tur === 'dolu' ? arka : on} /> : (
        <Text style={[s.dugmeYazi, rtl && { fontFamily: yaziAilesi(yazi.kalin, true) }, { color: tur === 'dolu' ? arka : on }]}>{t(metin)}</Text>
      )}
    </Pressable>
  );
}

export function Rozet({ metin }: { metin: string }) {
  return <Text style={s.rozet}>{metin}</Text>;
}

export function Ikon({ ad, boy = 22, renkKodu = renk.ana }: { ad: ComponentProps<typeof Feather>['name']; boy?: number; renkKodu?: string }) {
  return <Feather name={ad} size={boy} color={renkKodu} />;
}

export function Anahtar({ acik, onChange, etiket }: { acik: boolean; onChange: (v: boolean) => void; etiket: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={etiket}
      accessibilityState={{ checked: acik }}
      onPress={() => onChange(!acik)}
      hitSlop={8}
      style={[s.anahtar, { backgroundColor: acik ? renk.ana : renk.kapali, alignItems: acik ? 'flex-end' : 'flex-start' }]}
    >
      <View style={s.anahtarTop} />
    </Pressable>
  );
}

export function Satir({ children, onPress, son = false }: { children: ReactNode; onPress?: () => void; son?: boolean }) {
  const ic = <View style={[s.satir, !son && s.satirCizgi]}>{children}</View>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{ic}</Pressable> : ic;
}

export function Kutu({ children, style, tur = 'kart' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tur?: 'kart' | 'krem' | 'ana' | 'cizgi' }) {
  return (
    <View style={[s.kutu, s[tur], style]}>
      {tur === 'ana' ? (
        // Doku: marka simgesi kiremit kartların köşesinde silik filigran
        <View pointerEvents="none" style={s.filigran}><Simge boy={170} renkKodu={renk.krem} opaklik={0.09} /></View>
      ) : null}
      {children}
    </View>
  );
}

export const s = StyleSheet.create({
  dugme: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 16 },
  rozet: { fontFamily: yazi.kalin, fontSize: 12, color: renk.rozetYazi, backgroundColor: renk.rozetZemin, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden', alignSelf: 'flex-start' },
  anahtar: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' },
  anahtarTop: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  satirCizgi: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  kutu: { borderRadius: 18, padding: 18, gap: 8, overflow: 'hidden' },
  filigran: { position: 'absolute', right: -40, bottom: -30 },
  kart: { backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi },
  krem: { backgroundColor: renk.kremKutu },
  ana: { backgroundColor: renk.ana },
  cizgi: { backgroundColor: renk.kart, borderWidth: 2, borderColor: renk.ana },
  kenar: { paddingHorizontal: 20 },
});
