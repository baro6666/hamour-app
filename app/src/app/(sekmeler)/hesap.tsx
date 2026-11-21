import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { Anahtar, Dugme, Ekran, Ikon, Kutu, s, Satir, Yazi } from '../../bilesenler/ortak';
import { KVKK_ADRESI } from '../../ayar';
import { renk } from '../../tema';
import { kaynak, ornekMod } from '../../veri/kaynak';
import { useVeri } from '../../veri/VeriSaglayici';

function onayla(baslik: string, metin: string, evet: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${baslik}\n\n${metin}`));
  return new Promise((r) => Alert.alert(baslik, metin, [
    { text: 'Vazgeç', style: 'cancel', onPress: () => r(false) },
    { text: evet, style: 'destructive', onPress: () => r(true) },
  ]));
}

export default function Hesap() {
  const v = useVeri();
  const [siliniyor, setSiliniyor] = useState(false);
  const sube = v.menu.sube;
  const favoriler = v.menu.urunler.filter((u) => v.favoriler.has(u.id));

  if (!v.uye) {
    return (
      <Ekran>
        <View style={[s.kenar, { gap: 16 }]}>
          <Yazi tur="buyukBaslik">Hesap</Yazi>
          <Kutu tur="krem" style={{ gap: 12 }}>
            <Yazi tur="kalin" style={{ fontSize: 19 }}>Telefon numaranızla giriş yapın</Yazi>
            <Yazi>Kahve kartı, favoriler ve bildirimler için üyelik gerekir. Şifre yok; SMS ile gelen kodu yazmanız yeterli.</Yazi>
            <Dugme yazi="Üye ol / giriş yap" onPress={() => router.push('/giris')} />
          </Kutu>
          {ornekMod ? <Yazi tur="kucuk">Örnek veri modu: sunucu bağlı değil.</Yazi> : null}
        </View>
      </Ekran>
    );
  }
  const u = v.uye;

  return (
    <Ekran>
      <Yazi tur="buyukBaslik" style={s.kenar}>Hesabım</Yazi>
      <View style={[s.kenar, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: renk.ana, alignItems: 'center', justifyContent: 'center' }}>
          <Yazi tur="baslik" style={{ color: renk.krem }}>{(u.ad ?? '?').slice(0, 1).toLocaleUpperCase('tr-TR')}</Yazi>
        </View>
        <View style={{ gap: 2 }}>
          <Yazi tur="kalin" style={{ fontSize: 18 }}>{u.ad ?? 'Üye'}</Yazi>
          <Yazi tur="kucuk">{[u.telefon ? '+' + u.telefon.replace(/^\+/, '') : null, 'üye: ' + new Date(u.olusturma).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })].filter(Boolean).join(' · ')}</Yazi>
        </View>
      </View>

      <View style={[s.kenar, { gap: 8 }]}>
        <Yazi tur="kalin" style={{ fontSize: 18 }}>Favorilerim</Yazi>
        {favoriler.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {favoriler.map((f) => (
              <Pressable key={f.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/urun/[id]', params: { id: f.id } })}
                style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2, borderColor: renk.ana, backgroundColor: renk.kart, justifyContent: 'center' }}>
                <Yazi tur="kalin" style={{ fontSize: 14 }}>{f.ad}</Yazi>
              </Pressable>
            ))}
          </View>
        ) : <Yazi tur="kucuk">Ürün sayfasındaki kalple favori ekleyin; vitrine gelince haber verelim.</Yazi>}
      </View>

      {sube ? (
        <View style={s.kenar}>
          <Kutu tur="krem" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ikon ad="map-pin" />
            <View style={{ flex: 1 }}>
              <Yazi tur="kalin">{sube.ad}</Yazi>
              <Yazi tur="kucuk">{[sube.calisma_saatleri, sube.telefon].filter(Boolean).join(' · ')}</Yazi>
            </View>
            {sube.telefon ? <Dugme yazi="Ara" tur="metin" onPress={() => Linking.openURL('tel:' + sube.telefon)} /> : null}
          </Kutu>
        </View>
      ) : null}

      <View style={s.kenar}>
        <Kutu style={{ gap: 0 }}>
          <Yazi tur="ust" style={{ marginBottom: 4 }}>Bildirimler</Yazi>
          {([
            ['bildirim_firin', 'Fırından yeni çıktı', 'Kruvasan ve tatlılar fırından çıkınca'],
            ['bildirim_favori', 'Favorilerim vitrinde', 'Favori ürününüz gelince ya da azalınca'],
            ['kampanya_izni', 'Kampanyalar', 'Ticari ileti izni (İYS); istediğiniz an kapatabilirsiniz'],
          ] as const).map(([alan, ad, alt], i, dizi) => (
            <Satir key={alan} son={i === dizi.length - 1}>
              <View style={{ flex: 1 }}>
                <Yazi tur="kalin" style={{ fontSize: 15 }}>{ad}</Yazi>
                <Yazi tur="kucuk">{alt}</Yazi>
              </View>
              <Anahtar etiket={ad} acik={u[alan]} onChange={(d) => v.bildirimAyari({ [alan]: d })} />
            </Satir>
          ))}
        </Kutu>
      </View>

      <View style={s.kenar}>
        <Kutu style={{ gap: 0, paddingVertical: 4 }}>
          {KVKK_ADRESI ? <Satir onPress={() => Linking.openURL(KVKK_ADRESI!)}><Yazi style={{ flex: 1, color: renk.murekkep }}>KVKK aydınlatma metni</Yazi><Ikon ad="chevron-right" renkKodu={renk.soluk} /></Satir> : null}
          <Satir son onPress={() => sube?.telefon && Linking.openURL('tel:' + sube.telefon)}><Yazi style={{ flex: 1, color: renk.murekkep }}>Yardım ve iletişim</Yazi><Ikon ad="chevron-right" renkKodu={renk.soluk} /></Satir>
        </Kutu>
      </View>

      <View style={[s.kenar, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Dugme yazi="Çıkış yap" tur="metin" onPress={async () => { await kaynak.cikis(); await v.oturumYenile(); }} />
        <Dugme yazi="Hesabımı sil" tur="metin" yaziRengi={renk.tehlike} bekliyor={siliniyor}
          onPress={async () => {
            if (!(await onayla('Hesabınız silinsin mi?', 'Kahve kartınız, damgalarınız ve favorileriniz kalıcı olarak silinir.', 'Sil'))) return;
            setSiliniyor(true);
            try { await kaynak.hesabiSil(); await v.oturumYenile(); } finally { setSiliniyor(false); }
          }} />
      </View>
    </Ekran>
  );
}
