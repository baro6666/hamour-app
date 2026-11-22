import { Image, type ImageProps } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { yerelFotolar } from '../veri/fotolar';

// foto_url → görsel kaynağı: 'yerel:<anahtar>' uygulamanın içindeki fotoğraf, diğerleri adres.
export function fotoKaynak(url: string | null | undefined): ImageSourcePropType | { uri: string } | null {
  if (!url) return null;
  if (url.startsWith('yerel:')) return yerelFotolar[url.slice(6)] ?? null;
  return { uri: url };
}

export function Foto({ kaynak, ...p }: { kaynak: ImageSourcePropType | { uri: string } | null } & Omit<ImageProps, 'source'>) {
  if (!kaynak) return null;
  return <Image source={kaynak as ImageProps['source']} contentFit="cover" transition={200} {...p} />;
}
