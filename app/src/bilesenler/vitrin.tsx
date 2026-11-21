// Tanıtım ekranlarının ortak parçaları
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { renk, yazi } from '../tema';
import { Foto } from './Foto';
import { Simge } from './Logo';
import { Yazi } from './ortak';

export const ara = (numara: string) => Linking.openURL(`tel:${numara.replace(/\s/g, '')}`);

/** Bölüm başlığı: küçük üst yazı + Playfair başlık + isteğe bağlı sağ bağlantı */
export function BolumBaslik({ ust, baslik, sag, onSag, koyu = false }: { ust?: string; baslik: string; sag?: string; onSag?: () => void; koyu?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        {ust ? <Yazi tur="ust" style={koyu ? { color: renk.anaUstuSoluk } : null}>{ust}</Yazi> : null}
        <Yazi tur="buyukBaslik" style={[{ fontSize: 26, lineHeight: 32 }, koyu && { color: renk.krem }]}>{baslik}</Yazi>
      </View>
      {sag ? (
        <Pressable accessibilityRole="button" onPress={onSag} hitSlop={10}>
          <Yazi style={{ fontFamily: yazi.orta, color: koyu ? renk.krem : renk.ana, textDecorationLine: 'underline' }}>{sag}</Yazi>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Fotoğraf üstünde aşağı doğru koyulaşan perde */
export function Perde({ style, guc = 0.85 }: { style?: StyleProp<ViewStyle>; guc?: number }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(61,29,14,0)', `rgba(61,29,14,${guc * 0.55})`, `rgba(61,29,14,${guc})`]}
      locations={[0.35, 0.65, 1]}
      style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, style]}
    />
  );
}

/** Altın kural çizgisi + simge: bölümler arası süs */
export function Sus() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 40 }} accessibilityElementsHidden>
      <View style={{ flex: 1, height: 1, backgroundColor: renk.cizgi }} />
      <Simge boy={26} renkKodu={renk.ana} />
      <View style={{ flex: 1, height: 1, backgroundColor: renk.cizgi }} />
    </View>
  );
}

/** Üstte büyük fotoğraf, altta yazı: hikaye / kutlama kartları */
export function FotoKart({ gorsel, ust, baslik, metin, children, yukseklik = 240 }: {
  gorsel: ImageSourcePropType; ust?: string; baslik: string; metin?: string; children?: ReactNode; yukseklik?: number;
}) {
  return (
    <View style={{ marginHorizontal: 20, borderRadius: 22, overflow: 'hidden', backgroundColor: renk.kahve }}>
      <Foto kaynak={gorsel} style={{ height: yukseklik }} />
      <View style={{ padding: 22, gap: 10 }}>
        {ust ? <Yazi tur="ust" style={{ color: renk.anaUstuSoluk }}>{ust}</Yazi> : null}
        <Yazi tur="buyukBaslik" style={{ color: renk.krem, fontSize: 25, lineHeight: 31 }}>{baslik}</Yazi>
        {metin ? <Yazi style={{ color: renk.anaUstuSoluk, fontSize: 15, lineHeight: 23 }}>{metin}</Yazi> : null}
        {children}
      </View>
    </View>
  );
}

export const menuyeGit = (bolum?: string) => router.navigate(bolum ? { pathname: '/menu', params: { bolum } } : '/menu');
