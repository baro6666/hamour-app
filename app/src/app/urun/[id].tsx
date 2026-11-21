import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto, fotoKaynak } from '../../bilesenler/Foto';
import { Simge } from '../../bilesenler/Logo';
import { Dugme, Ikon, Yazi } from '../../bilesenler/ortak';
import { ara, Perde } from '../../bilesenler/vitrin';
import { renk, tl, yazi } from '../../tema';
import { BOLUMLER, ILETISIM } from '../../veri/icerik';
import { useVeri } from '../../veri/VeriSaglayici';

export default function UrunSayfasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const urun = v.urun(id);
  const kategori = v.menu.kategoriler.find((k) => k.id === urun?.kategori_id);
  const bolum = BOLUMLER.find((b) => b.id === kategori?.bolum);
  const geri = () => (router.canGoBack() ? router.back() : router.replace('/menu'));
  const foto = fotoKaynak(urun?.foto_url);
  const ayni = urun ? v.menu.urunler.filter((u) => u.kategori_id === urun.kategori_id && u.id !== urun.id && u.foto_url).slice(0, 6) : [];

  return (
    <View style={{ flex: 1, backgroundColor: renk.kagit }}>
      <ScrollView contentContainerStyle={{ paddingBottom: ic.bottom + 32 }}>
        <View style={{ height: 480 + ic.top, backgroundColor: renk.kahve, alignItems: 'center', justifyContent: 'center' }}>
          {foto ? (
            <>
              <Foto kaynak={foto} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <Perde guc={0.55} />
            </>
          ) : bolum ? (
            <Foto kaynak={bolum.gorsel} contentFit="contain" style={{ width: 240, height: 240, marginTop: ic.top }} />
          ) : (
            <Simge boy={120} renkKodu={renk.krem} opaklik={0.5} />
          )}
        </View>

        <View style={{ marginTop: -36, marginHorizontal: 16, borderRadius: 24, backgroundColor: renk.kart, padding: 22, gap: 12, borderWidth: 1, borderColor: renk.cizgi }}>
          {kategori ? <Yazi tur="ust">{bolum && bolum.ad !== kategori.ad ? `${bolum.ad} · ${kategori.ad}` : kategori.ad}</Yazi> : null}
          <Yazi tur="buyukBaslik" style={{ fontSize: 27, lineHeight: 33 }}>{urun?.ad ?? 'Ürün bulunamadı'}</Yazi>
          {urun?.ad_en && urun.ad_en !== urun.ad ? <Yazi tur="italik" style={{ fontSize: 15 }}>{urun.ad_en}</Yazi> : null}
          {urun?.aciklama ? <Yazi style={{ fontSize: 16, lineHeight: 25 }}>{urun.aciklama}</Yazi> : null}
          {urun?.fiyat != null ? <Yazi tur="fiyat" style={{ fontSize: 18 }}>{tl(urun.fiyat)}</Yazi> : null}
          {urun?.alerjenler ? <Yazi tur="kucuk">Alerjen: {urun.alerjenler}</Yazi> : null}
          {urun?.kalori != null ? <Yazi tur="kucuk">{urun.kalori} kcal</Yazi> : null}
          <Dugme yazi="Sipariş ve bilgi için arayın" onPress={() => ara(ILETISIM.telefonlar[0].numara)} style={{ marginTop: 8 }} />
        </View>

        {ayni.length ? (
          <View style={{ gap: 14, marginTop: 30 }}>
            <Yazi style={{ paddingHorizontal: 20, fontFamily: yazi.baslik, fontSize: 21, color: renk.kahve }}>{kategori?.ad} menüsünden</Yazi>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {ayni.map((u) => (
                <Pressable key={u.id} accessibilityRole="button" accessibilityLabel={u.ad}
                  onPress={() => router.replace({ pathname: '/urun/[id]', params: { id: u.id } })} style={{ width: 140, gap: 8 }}>
                  <Foto kaynak={fotoKaynak(u.foto_url)} style={{ width: 140, height: 175, borderRadius: 16 }} />
                  <Yazi numberOfLines={2} style={{ fontFamily: yazi.kalin, fontSize: 13, letterSpacing: 0.6, color: renk.kahve }}>{u.ad}</Yazi>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={geri}
        style={{ position: 'absolute', top: ic.top + 10, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(61,29,14,0.55)', alignItems: 'center', justifyContent: 'center' }}>
        <Ikon ad="arrow-left" renkKodu={renk.krem} />
      </Pressable>
    </View>
  );
}
