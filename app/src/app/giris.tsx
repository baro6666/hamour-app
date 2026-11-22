import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../bilesenler/Logo';
import { Anahtar, Dugme, Ikon, Yazi } from '../bilesenler/ortak';
import { renk, yazi } from '../tema';
import { epostaDuzelt, kaynak, ornekMod } from '../veri/kaynak';
import { useVeri } from '../veri/VeriSaglayici';
import { useDil } from '../dil/DilSaglayici';

// Hamour Kartı üyeliği: e-posta + 6 haneli kod (SMS yok, şifre yok)
type Adim = 'eposta' | 'kod' | 'profil';

function Alan({ etiket, style, ...p }: { etiket: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Yazi tur="ust">{etiket}</Yazi>
      <TextInput accessibilityLabel={useDil().t(etiket)} placeholderTextColor={renk.sekmeSoluk} {...p}
        style={[{ minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.kart, paddingHorizontal: 16, fontFamily: yazi.normal, fontSize: 17, color: renk.kahve }, style]} />
    </View>
  );
}

function Onay({ metin, acik, onChange, etiket }: { metin: string; acik: boolean; onChange: (v: boolean) => void; etiket: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Yazi style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{metin}</Yazi>
      <Anahtar etiket={useDil().t(etiket)} acik={acik} onChange={onChange} />
    </View>
  );
}

// Supabase hata metinlerini Türkçeleştir
function hataMetni(e: unknown, t: (m: string) => string): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/expired|invalid|token/i.test(m)) return t('Kod hatalı ya da süresi dolmuş. Yeni kod isteyin.');
  if (/rate|too many|seconds/i.test(m)) return t('Çok sık kod istendi. Biraz bekleyip tekrar deneyin.');
  if (/network|fetch/i.test(m)) return t('Bağlantı kurulamadı. İnternetinizi kontrol edin.');
  return t(m);
}

export default function Giris() {
  const v = useVeri();
  const { t } = useDil();
  const ic = useSafeAreaInsets();
  const [adim, setAdim] = useState<Adim>('eposta');
  const [eposta, setEposta] = useState('');
  const [kod, setKod] = useState('');
  const [ad, setAd] = useState('');
  const [kampanya, setKampanya] = useState(true);
  const [kvkk, setKvkk] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const temiz = epostaDuzelt(eposta);

  async function calistir(is: () => Promise<void>) {
    setBekliyor(true); setHata(null);
    try { await is(); } catch (e) { setHata(hataMetni(e, t)); } finally { setBekliyor(false); }
  }
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/kart'));
  const bitir = async () => { await v.oturumYenile(); kapat(); };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: renk.kagit }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: ic.top + 20, paddingBottom: ic.bottom + 24, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo boy={112} />
          <Pressable accessibilityRole="button" accessibilityLabel={t('Kapat')} onPress={kapat} hitSlop={10}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
            <Ikon ad="x" renkKodu={renk.kahve} />
          </Pressable>
        </View>

        {adim === 'eposta' ? (
          <>
            <Yazi tur="ust">Hamour Kartı</Yazi>
            <Yazi tur="buyukBaslik">E-posta adresiniz</Yazi>
            <Yazi>Size 6 haneli bir kod göndereceğiz. Şifre yok, SMS yok.</Yazi>
            <Alan etiket="E-posta" value={eposta} onChangeText={setEposta} placeholder={t('ornek@eposta.com')}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
            <Dugme yazi="Kod gönder" devreDisi={!temiz} bekliyor={bekliyor}
              onPress={() => calistir(async () => { await kaynak.kodGonder(temiz!); setAdim('kod'); })} />
            {ornekMod ? <Yazi tur="kucuk">Örnek veri modu: e-posta gitmez, kod 123456.</Yazi> : null}
          </>
        ) : null}

        {adim === 'kod' ? (
          <>
            <Yazi tur="buyukBaslik">Kodu yazın</Yazi>
            <Yazi cevirme>{t('{eposta} adresine gelen 6 haneli kod. Gelen kutusunda yoksa gereksiz (spam) klasörüne bakın.', { eposta: temiz ?? '' })}</Yazi>
            <Alan etiket="Doğrulama kodu" value={kod} onChangeText={(x) => setKod(x.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder="••••••"
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
            <Dugme yazi="Devam" devreDisi={kod.length !== 6} bekliyor={bekliyor}
              onPress={() => calistir(async () => { const kayitli = await kaynak.kodDogrula(temiz!, kod); if (kayitli) await bitir(); else setAdim('profil'); })} />
            <Dugme yazi="E-postayı değiştir" tur="metin" onPress={() => { setKod(''); setAdim('eposta'); }} />
          </>
        ) : null}

        {adim === 'profil' ? (
          <>
            <Yazi tur="buyukBaslik">Sizi tanıyalım</Yazi>
            <Alan etiket="Adınız" value={ad} onChangeText={setAd} autoComplete="name" textContentType="name" placeholder={t('Ad Soyad')} />
            <Onay etiket="Kampanya bildirimleri" acik={kampanya} onChange={setKampanya}
              metin="Hamour kampanya ve etkinliklerinden bildirimle haberdar olmak istiyorum (ticari ileti onayı; istediğiniz zaman kapatabilirsiniz)." />
            <Onay etiket="Aydınlatma metni onayı" acik={kvkk} onChange={setKvkk}
              metin="Aydınlatma metnini okudum; Hamour Kartı için ad ve e-posta adresimin işlenmesini kabul ediyorum." />
            <Pressable accessibilityRole="link" onPress={() => router.push('/kvkk')}>
              <Yazi style={{ color: renk.ana, textDecorationLine: 'underline', fontFamily: yazi.orta }}>Aydınlatma metnini oku</Yazi>
            </Pressable>
            <Dugme yazi="Üyeliği tamamla" devreDisi={!ad.trim() || !kvkk} bekliyor={bekliyor}
              onPress={() => calistir(async () => {
                await kaynak.uyeOl({ ad: ad.trim(), dogumGunu: null, davetKodu: null, kampanyaIzni: kampanya });
                await bitir();
              })} />
          </>
        ) : null}

        {hata ? <Yazi style={{ color: renk.tehlike }}>{hata}</Yazi> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
