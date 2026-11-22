import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto } from '../bilesenler/Foto';
import { Dugme, Ikon, Yazi } from '../bilesenler/ortak';
import { ara, Perde, whatsapp } from '../bilesenler/vitrin';
import { renk, yazi } from '../tema';
import { GORSEL, ILETISIM } from '../veri/icerik';
import { useDil } from '../dil/DilSaglayici';

// WhatsApp ile rezervasyon: bilgiler hiçbir yere kaydedilmez; yalnız WhatsApp'ta hazır mesaj açılır.
const OGUN = ['Kahvaltı', 'Öğle', 'Akşam'] as const;

// uzun: WhatsApp mesajı için Türkçe tarih (Hamour okur); etiket: ekranda seçili dilde
function gunler(yerel: string, t: (m: string) => string): { etiket: string; uzun: string }[] {
  const bugun = new Date();
  return Array.from({ length: 10 }, (_, i) => {
    const g = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + i);
    const uzun = g.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    const etiket = i === 0 ? t('Bugün') : i === 1 ? t('Yarın') : g.toLocaleDateString(yerel, { weekday: 'short', day: 'numeric', month: 'short' });
    return { etiket, uzun };
  });
}
const DIL_ADI: Record<string, string> = { en: 'İngilizce', ar: 'Arapça' };

function Cip({ metin, secili, onPress }: { metin: string; secili: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: secili }} onPress={onPress}
      style={{ height: 40, paddingHorizontal: 15, borderRadius: 20, justifyContent: 'center', backgroundColor: secili ? renk.kahve : renk.kart, borderWidth: 1, borderColor: secili ? renk.kahve : renk.cizgi }}>
      <Yazi style={{ fontFamily: yazi.orta, fontSize: 14, color: secili ? renk.krem : renk.kahve }}>{metin}</Yazi>
    </Pressable>
  );
}

function Alan({ etiket, style, ...p }: { etiket: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Yazi tur="ust">{etiket}</Yazi>
      <TextInput accessibilityLabel={useDil().t(etiket)} placeholderTextColor={renk.sekmeSoluk}
        {...p}
        style={[{ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.kart, paddingHorizontal: 16, paddingVertical: 12, fontFamily: yazi.normal, fontSize: 16, color: renk.kahve }, style]} />
    </View>
  );
}

export default function Rezervasyon() {
  const ic = useSafeAreaInsets();
  const { t, yerel, dil } = useDil();
  const [liste] = useState(() => gunler(yerel, t));
  const [gun, setGun] = useState(0);
  const [ogun, setOgun] = useState<(typeof OGUN)[number] | null>(null);
  const [saat, setSaat] = useState('');
  const [kisi, setKisi] = useState(2);
  const [ad, setAd] = useState('');
  const [not, setNot] = useState('');
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const gonder = () => {
    const satirlar = [
      'Merhaba Hamour, rezervasyon yapmak istiyorum.',
      '',
      ad.trim() ? `Ad: ${ad.trim()}` : null,
      `Tarih: ${liste[gun].uzun}`,
      saat.trim() || ogun ? `Saat: ${[ogun, saat.trim()].filter(Boolean).join(', ')}` : null,
      `Kişi sayısı: ${kisi}`,
      not.trim() ? `Not: ${not.trim()}` : null,
      DIL_ADI[dil] ? `Misafirin dili: ${DIL_ADI[dil]}` : null,
    ].filter((x) => x !== null);
    whatsapp(ILETISIM.whatsapp, satirlar.join('\n'));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: renk.kagit }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: ic.bottom + 28, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 230 + ic.top, backgroundColor: renk.kahve }}>
          <Foto kaynak={GORSEL.salon} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Perde guc={0.9} />
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 22, gap: 6 }}>
            <Yazi tur="ust" style={{ color: renk.anaUstuSoluk }}>WhatsApp ile</Yazi>
            <Yazi tur="buyukBaslik" style={{ color: renk.krem, fontSize: 32, lineHeight: 38 }}>Rezervasyon</Yazi>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Kapat')} onPress={kapat}
          style={{ position: 'absolute', top: ic.top + 10, end: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(61,29,14,0.55)', alignItems: 'center', justifyContent: 'center' }}>
          <Ikon ad="x" renkKodu={renk.krem} />
        </Pressable>

        <View style={{ paddingHorizontal: 20, gap: 22 }}>
          <View style={{ gap: 10 }}>
            <Yazi tur="ust">Gün</Yazi>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {liste.map((g, i) => <Cip key={i} metin={g.etiket} secili={gun === i} onPress={() => setGun(i)} />)}
            </ScrollView>
          </View>

          <View style={{ gap: 10 }}>
            <Yazi tur="ust">Öğün</Yazi>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {OGUN.map((o) => <Cip key={o} metin={o} secili={ogun === o} onPress={() => setOgun(ogun === o ? null : o)} />)}
            </View>
          </View>

          <Alan etiket="Saat (isteğe bağlı)" value={saat} onChangeText={setSaat} placeholder={t('ör. 19:30')} keyboardType="numbers-and-punctuation" maxLength={5} />

          <View style={{ gap: 10 }}>
            <Yazi tur="ust">Kişi sayısı</Yazi>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Azalt')} onPress={() => setKisi(Math.max(1, kisi - 1))}
                style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.kart, alignItems: 'center', justifyContent: 'center' }}>
                <Ikon ad="minus" renkKodu={renk.kahve} />
              </Pressable>
              <Yazi style={{ fontFamily: yazi.baslik, fontSize: 30, color: renk.kahve, minWidth: 40, textAlign: 'center' }}>{kisi}</Yazi>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Artır')} onPress={() => setKisi(Math.min(30, kisi + 1))}
                style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.kart, alignItems: 'center', justifyContent: 'center' }}>
                <Ikon ad="plus" renkKodu={renk.kahve} />
              </Pressable>
            </View>
          </View>

          <Alan etiket="Adınız" value={ad} onChangeText={setAd} placeholder={t('Ad Soyad')} autoComplete="name" textContentType="name" />
          <Alan etiket="Not (isteğe bağlı)" value={not} onChangeText={setNot} placeholder={t('Doğum günü, bebek sandalyesi, alerji…')} multiline style={{ minHeight: 84, textAlignVertical: 'top' }} />

          <Pressable accessibilityRole="button" onPress={gonder}
            style={({ pressed }) => ({ height: 56, borderRadius: 28, backgroundColor: renk.kahve, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: pressed ? 0.75 : 1 })}>
            <Ikon ad="message-circle" renkKodu={renk.krem} />
            <Yazi style={{ fontFamily: yazi.kalin, fontSize: 16, color: renk.krem }}>WhatsApp’ta gönder</Yazi>
          </Pressable>
          <Yazi tur="kucuk" style={{ textAlign: 'center' }}>
            Bilgileriniz uygulamada saklanmaz; WhatsApp’ta hazır bir mesaj açılır. Rezervasyonunuz Hamour’un onayıyla kesinleşir.
          </Yazi>
          <Dugme yazi="Telefonla arayın" tur="metin" onPress={() => ara(ILETISIM.telefonlar[0].numara)} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
