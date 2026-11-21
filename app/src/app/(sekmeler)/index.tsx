import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { DamgaKarti } from '../../bilesenler/DamgaKarti';
import { Logo, Simge } from '../../bilesenler/Logo';
import { Dugme, Ekran, Ikon, Kutu, s, Yazi } from '../../bilesenler/ortak';
import { UrunSatiri } from '../../bilesenler/UrunSatiri';
import { renk } from '../../tema';
import { useVeri } from '../../veri/VeriSaglayici';

function selam(): string {
  const saat = new Date().getHours();
  if (saat < 11) return 'Günaydın';
  if (saat < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function AnaSayfa() {
  const v = useVeri();
  const [yenileniyor, setYenileniyor] = useState(false);
  const firin = v.menu.urunler.find((u) => u.vitrin_durumu === 'firin');
  const onecikan = v.menu.urunler.filter((u) => u.vitrin_durumu !== 'normal' && u.vitrin_durumu !== 'tukendi').slice(0, 4);
  const kampanyalar = v.duyurular.filter((d) => d.tur === 'kampanya' || d.tur === 'yeni').slice(0, 5);
  const sube = v.menu.sube;

  return (
    <Ekran yenile={<RefreshControl refreshing={yenileniyor} tintColor={renk.ana} onRefresh={async () => { setYenileniyor(true); await v.yenile(); setYenileniyor(false); }} />}>
      <View style={[s.kenar, { gap: 14 }]}>
        <Logo boy={128} />
        <View>
          <Yazi>{selam()},</Yazi>
          <Yazi tur="buyukBaslik">{v.uye?.ad?.split(' ')[0] ?? 'hoş geldiniz'}</Yazi>
        </View>
      </View>

      <View style={s.kenar}>
        {v.kart ? (
          <DamgaKarti kart={v.kart}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Dugme yazi="Kasada okut" ters onPress={() => router.navigate('/kart')} style={{ flex: 1 }} />
              <Dugme yazi="Menüye bak" tur="cizgi" ters onPress={() => router.navigate('/menu')} style={{ flex: 1 }} />
            </View>
          </DamgaKarti>
        ) : (
          <Kutu tur="ana" style={{ gap: 12 }}>
            <Yazi tur="ust" style={{ color: renk.krem }}>Kahve kartı</Yazi>
            <Yazi tur="baslik" style={{ color: renk.krem, fontSize: 23 }}>Üye olun, her kahvede damga toplayın</Yazi>
            <Yazi style={{ color: renk.anaUstuSoluk }}>Kart dolunca bir kahve bizden.</Yazi>
            <Dugme yazi="Telefonla üye ol" ters onPress={() => router.push('/giris')} />
          </Kutu>
        )}
      </View>

      {firin ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/urun/[id]', params: { id: firin.id } })} style={s.kenar}>
          <Kutu tur="krem" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Ikon ad="sun" boy={28} />
            <View style={{ flex: 1, gap: 2 }}>
              <Yazi tur="ust">Fırından yeni çıktı</Yazi>
              <Yazi tur="kalin" style={{ fontSize: 17 }}>{firin.ad}</Yazi>
              <Yazi tur="kucuk">Sıcakken gelin, vitrinde sizi bekliyor.</Yazi>
            </View>
          </Kutu>
        </Pressable>
      ) : null}

      {kampanyalar.length ? (
        <View style={{ gap: 12 }}>
          <View style={[s.kenar, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Yazi tur="baslik">Kampanyalar</Yazi>
            <Dugme yazi="Tümü" tur="metin" onPress={() => router.navigate('/duyurular')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {kampanyalar.map((d, i) => (
              <Pressable key={d.id} accessibilityRole="button" onPress={() => d.urun_id && router.push({ pathname: '/urun/[id]', params: { id: d.urun_id } })}>
                <Kutu tur={i % 2 ? 'ana' : 'krem'} style={{ width: 240, minHeight: 130 }}>
                  <Yazi tur="ust" style={i % 2 ? { color: renk.krem } : undefined}>{d.tur === 'yeni' ? 'Yeni' : 'Kampanya'}</Yazi>
                  <Yazi tur="kalin" style={[{ fontSize: 19 }, i % 2 ? { color: renk.krem } : null]}>{d.baslik}</Yazi>
                  {d.metin ? <Yazi tur="kucuk" style={i % 2 ? { color: renk.anaUstuSoluk } : undefined}>{d.metin}</Yazi> : null}
                </Kutu>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/marka')} style={s.kenar}>
        <Kutu tur="ana" style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Simge boy={52} renkKodu={renk.krem} />
          <View style={{ flex: 1, gap: 2 }}>
            <Yazi tur="kalin" style={{ color: renk.krem, fontSize: 17 }}>Hamour’u tanıyın</Yazi>
            <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>Paris esintili patiseri, brasserie ve bistro</Yazi>
          </View>
          <Ikon ad="chevron-right" renkKodu={renk.krem} />
        </Kutu>
      </Pressable>

      {onecikan.length ? (
        <View style={s.kenar}>
          <Yazi tur="baslik">Vitrinde öne çıkanlar</Yazi>
          {onecikan.map((u) => <UrunSatiri key={u.id} urun={u} foto={false} favori={v.favoriler.has(u.id)} />)}
        </View>
      ) : null}

      {sube ? (
        <View style={s.kenar}>
          <Kutu style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Ikon ad="map-pin" boy={24} />
            <View style={{ flex: 1, gap: 2 }}>
              <Yazi tur="kalin">{sube.ad}</Yazi>
              {sube.calisma_saatleri ? <Yazi tur="kucuk">{sube.calisma_saatleri}</Yazi> : null}
            </View>
            {sube.telefon ? (
              <Dugme yazi="Ara" tur="metin" onPress={() => Linking.openURL(`tel:${sube.telefon!.replace(/\s/g, '')}`)} />
            ) : null}
            {sube.enlem != null && sube.boylam != null ? (
              <Dugme yazi="Yol tarifi" tur="metin" onPress={() => Linking.openURL(`https://maps.google.com/?q=${sube.enlem},${sube.boylam}`)} />
            ) : null}
          </Kutu>
        </View>
      ) : null}

      {v.hata ? <Yazi tur="kucuk" style={[s.kenar, { color: renk.tehlike }]}>Bağlantı sorunu: {v.hata}</Yazi> : null}
    </Ekran>
  );
}
