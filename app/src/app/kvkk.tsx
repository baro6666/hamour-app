import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ikon, Yazi } from '../bilesenler/ortak';
import { renk } from '../tema';
import { KVKK_ADRESI } from '../ayar';
import { useDil } from '../dil/DilSaglayici';

// Hamour Kartı aydınlatma metni (TASLAK; avukat kontrolü ve şirket unvanı bekliyor — docs/hukuk/kvkk-aydinlatma.md)
const BOLUMLER: [string, string][] = [
  ['Veri sorumlusu', '[Hamour şirket unvanı], Acarlar Mah. 9. Cad., Beykoz / İstanbul. İletişim: info@hamour.com.tr'],
  ['Hangi veriler', 'Hamour Kartı üyeliğinde adınız ve e-posta adresiniz; indirim ve kampanya kullanımlarınızın tarihi; bildirim izni verdiyseniz bildirim anahtarı. Telefon numarası, konum ve ödeme bilgisi toplanmaz. WhatsApp rezervasyon mesajı uygulamada saklanmaz.'],
  ['Amaç ve hukuki sebep', 'Üyeliğin kurulması ve hoş geldin indiriminin bir kez uygulanması (sözleşmenin ifası); onay verdiyseniz kampanya ve etkinlik bildirimleri (açık rıza).'],
  ['Aktarım', 'Veriler, barındırma hizmeti için Avrupa Birliği\'ndeki (Frankfurt) sunucularda tutulur. Üçüncü kişilerle pazarlama amacıyla paylaşılmaz.'],
  ['Saklama süresi', 'Hesabınızı sildiğiniz anda üyelik ve indirim kayıtlarınız silinir.'],
  ['Haklarınız', 'KVKK 11. madde kapsamındaki başvurularınız için info@hamour.com.tr adresine yazabilirsiniz. Bildirimleri Hamour Kartı ekranından kapatabilir, hesabınızı silebilirsiniz.'],
];

export default function Kvkk() {
  const ic = useSafeAreaInsets();
  const { t, rtl } = useDil();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ padding: 22, paddingTop: ic.top + 16, paddingBottom: ic.bottom + 30, gap: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('Geri')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/kart'))}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
        <Ikon ad={rtl ? 'arrow-right' : 'arrow-left'} renkKodu={renk.kahve} />
      </Pressable>
      <Yazi tur="buyukBaslik">Aydınlatma metni</Yazi>
      {BOLUMLER.map(([b, m]) => (
        <View key={b} style={{ gap: 4 }}>
          <Yazi tur="ust">{b}</Yazi>
          <Yazi style={{ color: renk.kahve }}>{m}</Yazi>
        </View>
      ))}
      {KVKK_ADRESI ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(KVKK_ADRESI!)}>
          <Yazi style={{ color: renk.ana, textDecorationLine: 'underline' }}>Metnin tamamı</Yazi>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
