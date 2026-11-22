import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto, fotoKaynak } from '../../bilesenler/Foto';
import { Logo } from '../../bilesenler/Logo';
import { Dugme, Ikon, Yazi } from '../../bilesenler/ortak';
import { ara, BolumBaslik, FotoKart, menuyeGit, Perde, rezervasyonAc, Sus } from '../../bilesenler/vitrin';
import { renk, yazi } from '../../tema';
import { BOLUMLER, GORSEL, HIKAYE, ILETISIM } from '../../veri/icerik';
import { useVeri } from '../../veri/VeriSaglayici';

// Ana sayfada yatay şeritte gösterilecek tabaklar (fotoğrafı olan ürünlerden; sıra elle seçildi)
const SERIT = ['avocado-toast', 'classic-eggs-benedict', 'speculoos-pancake', 'burrata', 'cafe-de-paris', 'hamour-burger', 'somon-bowl', 'french-toast'];

export default function Kesfet() {
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const [yenileniyor, setYenileniyor] = useState(false);
  const serit = SERIT.map((id) => v.menu.urunler.find((u) => u.id === id || u.foto_url === `yerel:${id}`)).filter((u) => u && u.foto_url);
  const haberler = v.duyurular.slice(0, 3);
  const bolumler = BOLUMLER.filter((b) => b.urunsuz || v.menu.kategoriler.some((k) => k.bolum === b.id));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.kagit }}
      contentContainerStyle={{ paddingBottom: 40, gap: 34 }}
      refreshControl={<RefreshControl refreshing={yenileniyor} tintColor={renk.krem} onRefresh={async () => { setYenileniyor(true); await v.yenile(); setYenileniyor(false); }} />}
    >
      {/* Kapak */}
      <View style={{ height: 560 + ic.top, backgroundColor: renk.kahve }}>
        <Foto kaynak={GORSEL.giris} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <Perde guc={0.92} />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 30, gap: 14 }}>
          <Logo boy={210} renkKodu={renk.krem} />
          <Yazi style={{ color: renk.krem, letterSpacing: 4, fontSize: 12, fontFamily: yazi.orta }}>PÂTISSERIE · BRASSERIE · BISTRO</Yazi>
          <Yazi style={{ color: renk.krem, fontFamily: yazi.baslikItalik, fontSize: 23, lineHeight: 31 }}>Paris’in büyülü bir caddesindeymiş gibi.</Yazi>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Dugme yazi="Menüyü keşfet" ters onPress={() => menuyeGit()} style={{ flex: 1 }} />
            <Dugme yazi="Rezervasyon" tur="cizgi" yaziRengi={renk.krem} onPress={rezervasyonAc} style={{ flex: 1 }} />
          </View>
        </View>
      </View>

      {/* Hamour Kartı: hoş geldin indirimi */}
      {!v.uye || v.kampanyalar.some((k) => k.tur === 'hosgeldin' && !k.kullanildi) ? (
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/kart')}
          style={{ marginHorizontal: 20, marginTop: -6, borderRadius: 20, backgroundColor: renk.ana, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Yazi style={{ fontFamily: yazi.baslik, fontSize: 34, color: renk.krem }}>%5</Yazi>
          <View style={{ flex: 1, gap: 2 }}>
            <Yazi style={{ fontFamily: yazi.kalin, fontSize: 16, color: renk.krem }}>{v.uye ? 'Hoş geldin indiriminiz hazır' : 'Uygulamaya özel hoş geldin indirimi'}</Yazi>
            <Yazi tur="kucuk" style={{ color: renk.anaUstuSoluk }}>{v.uye ? 'Kasada Hamour Kartı’nızı gösterin.' : 'İlk ziyaretinizde %5 · alkollü içecekler hariç'}</Yazi>
          </View>
          <Ikon ad="chevron-right" renkKodu={renk.krem} />
        </Pressable>
      ) : null}

      {/* Menü bölümleri */}
      <View style={{ gap: 16 }}>
        <BolumBaslik ust="Menü" baslik="Gün boyu Hamour" sag="Tümü" onSag={() => menuyeGit()} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {bolumler.map((b) => (
            <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={b.ad} onPress={() => menuyeGit(b.id)}
              style={({ pressed }) => ({ width: 150, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, padding: 14, gap: 10, opacity: pressed ? 0.7 : 1 })}>
              <Foto kaynak={b.gorsel} contentFit="contain" transition={0} style={{ height: 104 }} />
              <Yazi style={{ fontFamily: yazi.baslik, fontSize: 17, color: renk.kahve }}>{b.ad}</Yazi>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tabaklar */}
      {serit.length ? (
        <View style={{ gap: 16 }}>
          <BolumBaslik ust="Hamour mutfağından" baslik="Zarif tabaklar" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {serit.map((u) => (
              <Pressable key={u!.id} accessibilityRole="button" accessibilityLabel={u!.ad}
                onPress={() => router.push({ pathname: '/urun/[id]', params: { id: u!.id } })}
                style={{ width: 210, height: 290, borderRadius: 20, overflow: 'hidden', backgroundColor: renk.kahve }}>
                <Foto kaynak={fotoKaynak(u!.foto_url)} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
                <Perde />
                <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16, gap: 4 }}>
                  <Yazi style={{ color: renk.krem, fontFamily: yazi.kalin, fontSize: 15, letterSpacing: 0.8 }}>{u!.ad}</Yazi>
                  {u!.aciklama ? <Yazi numberOfLines={2} style={{ color: renk.anaUstuSoluk, fontSize: 13, lineHeight: 18 }}>{u!.aciklama}</Yazi> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Sus />

      {/* Hikaye */}
      <FotoKart gorsel={GORSEL.hikaye[1]} yukseklik={300} ust="Hikâyemiz" baslik="Taze ekmek kokusu, Paris’in büyüsü" metin={HIKAYE[0]}>
        <Dugme yazi="Hamour’u tanıyın" ters onPress={() => router.navigate('/hamour')} style={{ marginTop: 6 }} />
      </FotoKart>

      {/* Kutlama */}
      <View style={{ marginHorizontal: 20, borderRadius: 22, backgroundColor: renk.ana, padding: 22, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Yazi tur="ust" style={{ color: renk.anaUstuSoluk }}>Pasta siparişi</Yazi>
            <Yazi tur="buyukBaslik" style={{ color: renk.krem, fontSize: 23, lineHeight: 29 }}>Günü Hamour’da kutlayalım</Yazi>
            <Yazi style={{ color: renk.anaUstuSoluk, fontSize: 14, lineHeight: 20 }}>Özel günleriniz için kutlama pastaları.</Yazi>
          </View>
          <Foto kaynak={BOLUMLER.find((b) => b.id === 'pasta')!.gorsel} contentFit="contain" style={{ width: 112, height: 112 }} />
        </View>
        <Dugme yazi="Pasta siparişi için arayın" ters onPress={() => ara(ILETISIM.telefonlar[0].numara)} />
      </View>

      {/* Haberler */}
      {haberler.length ? (
        <View style={{ gap: 12 }}>
          <BolumBaslik ust="Duyurular" baslik="Hamour’dan haberler" />
          <View style={{ marginHorizontal: 20, borderRadius: 20, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, paddingHorizontal: 18 }}>
            {haberler.map((d, i) => (
              <Pressable key={d.id} accessibilityRole="button" disabled={!d.urun_id}
                onPress={() => d.urun_id && router.push({ pathname: '/urun/[id]', params: { id: d.urun_id } })}
                style={{ paddingVertical: 16, gap: 4, borderTopWidth: i ? 1 : 0, borderTopColor: renk.cizgi }}>
                <Yazi style={{ fontFamily: yazi.baslik, fontSize: 17, color: renk.kahve }}>{d.baslik}</Yazi>
                {d.metin ? <Yazi tur="kucuk">{d.metin}</Yazi> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Ziyaret */}
      <FotoKart gorsel={GORSEL.salonGenis} yukseklik={190} ust="Bizi ziyaret edin" baslik={ILETISIM.sube} metin={ILETISIM.adres}>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Dugme yazi="Rezervasyon" ters style={{ flex: 1, height: 44 }} onPress={rezervasyonAc} />
          <Dugme yazi="Yol tarifi" tur="cizgi" yaziRengi={renk.krem} style={{ flex: 1, height: 44 }}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent('Hamour ' + ILETISIM.adres)}`)} />
        </View>
      </FotoKart>

      {v.hata ? <Yazi tur="kucuk" style={{ paddingHorizontal: 20, color: renk.tehlike }}>Bağlantı sorunu: {v.hata}</Yazi> : null}
    </ScrollView>
  );
}
