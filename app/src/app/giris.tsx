import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../bilesenler/Logo';
import { Anahtar, Dugme, Yazi } from '../bilesenler/ortak';
import { renk, yazi } from '../tema';
import { kaynak, ornekMod, telefonDuzelt } from '../veri/kaynak';
import { useVeri } from '../veri/VeriSaglayici';

type Adim = 'telefon' | 'kod' | 'profil';

const girdi = {
  height: 52, borderRadius: 12, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.kart,
  paddingHorizontal: 14, fontSize: 17, fontFamily: yazi.normal, color: renk.murekkep,
} as const;

function Alan({ etiket, ...p }: { etiket: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Yazi tur="kucuk" style={{ fontFamily: yazi.orta }}>{etiket}</Yazi>
      <TextInput accessibilityLabel={etiket} placeholderTextColor="#8C9488" style={girdi} {...p} />
    </View>
  );
}

// GG.AA.YYYY → YYYY-AA-GG
function tarihCevir(g: string): string | null {
  const m = g.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;
  const [, gun, ay, yil] = m;
  const t = new Date(Number(yil), Number(ay) - 1, Number(gun));
  return t.getDate() === Number(gun) ? `${yil}-${ay.padStart(2, '0')}-${gun.padStart(2, '0')}` : null;
}

export default function Giris() {
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const [adim, setAdim] = useState<Adim>('telefon');
  const [telefon, setTelefon] = useState('');
  const [kod, setKod] = useState('');
  const [ad, setAd] = useState('');
  const [dogum, setDogum] = useState('');
  const [davet, setDavet] = useState('');
  const [kampanya, setKampanya] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const e164 = telefonDuzelt(telefon);

  async function calistir(is: () => Promise<void>) {
    setBekliyor(true); setHata(null);
    try { await is(); } catch (e) { setHata(e instanceof Error ? e.message : String(e)); } finally { setBekliyor(false); }
  }
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const bitir = async () => { await v.oturumYenile(); kapat(); };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: renk.kagit }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: ic.top + 24, paddingBottom: ic.bottom + 24, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo boy={44} />
          <Dugme yazi="Kapat" tur="metin" onPress={kapat} />
        </View>

        {adim === 'telefon' ? (
          <>
            <Yazi tur="buyukBaslik">Telefon numaranız</Yazi>
            <Yazi>Size bir doğrulama kodu göndereceğiz. Şifre yok.</Yazi>
            <Alan etiket="Cep telefonu" value={telefon} onChangeText={setTelefon} placeholder="05xx xxx xx xx" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
            <Dugme yazi="Kod gönder" devreDisi={!e164} bekliyor={bekliyor}
              onPress={() => calistir(async () => { await kaynak.smsGonder(e164!); setAdim('kod'); })} />
            {ornekMod ? <Yazi tur="kucuk">Örnek veri modu: SMS gitmez, kod 123456.</Yazi> : null}
          </>
        ) : null}

        {adim === 'kod' ? (
          <>
            <Yazi tur="buyukBaslik">Kodu yazın</Yazi>
            <Yazi>{e164} numarasına gelen 6 haneli kod.</Yazi>
            <Alan etiket="Doğrulama kodu" value={kod} onChangeText={(t) => setKod(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" placeholder="••••••" />
            <Dugme yazi="Devam" devreDisi={kod.length !== 6} bekliyor={bekliyor}
              onPress={() => calistir(async () => { const kayitli = await kaynak.smsDogrula(e164!, kod); if (kayitli) await bitir(); else setAdim('profil'); })} />
            <Dugme yazi="Numarayı değiştir" tur="metin" onPress={() => { setKod(''); setAdim('telefon'); }} />
          </>
        ) : null}

        {adim === 'profil' ? (
          <>
            <Yazi tur="buyukBaslik">Sizi tanıyalım</Yazi>
            <Alan etiket="Adınız" value={ad} onChangeText={setAd} autoComplete="name" textContentType="name" placeholder="Ad Soyad" />
            <Alan etiket="Doğum gününüz (isteğe bağlı)" value={dogum} onChangeText={setDogum} placeholder="GG.AA.YYYY" keyboardType="numbers-and-punctuation" />
            <Alan etiket="Davet kodu (varsa)" value={davet} onChangeText={(t) => setDavet(t.toUpperCase())} autoCapitalize="characters" placeholder="ör. 4F2A9C" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Yazi style={{ flex: 1 }}>Kampanya ve fırsatlardan SMS ve bildirimle haberdar olmak istiyorum (ticari ileti onayı).</Yazi>
              <Anahtar etiket="Ticari ileti onayı" acik={kampanya} onChange={setKampanya} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Yazi style={{ flex: 1 }}>KVKK aydınlatma metnini okudum; üyelik için telefon numaramın işlenmesini kabul ediyorum.</Yazi>
              <Anahtar etiket="KVKK onayı" acik={kvkk} onChange={setKvkk} />
            </View>
            <Dugme yazi="Üyeliği tamamla" devreDisi={!ad.trim() || !kvkk || (!!dogum.trim() && !tarihCevir(dogum))} bekliyor={bekliyor}
              onPress={() => calistir(async () => {
                await kaynak.uyeOl({ ad: ad.trim(), dogumGunu: dogum.trim() ? tarihCevir(dogum) : null, davetKodu: davet.trim() || null, kampanyaIzni: kampanya });
                await bitir();
              })} />
            {dogum.trim() && !tarihCevir(dogum) ? <Yazi tur="kucuk" style={{ color: renk.tehlike }}>Tarihi GG.AA.YYYY biçiminde yazın.</Yazi> : null}
          </>
        ) : null}

        {hata ? <Yazi style={{ color: renk.tehlike }}>{hata}</Yazi> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
