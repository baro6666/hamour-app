import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dugme, Ikon, Kutu, Rozet, s, Satir, Yazi } from '../../bilesenler/ortak';
import { vitrinYazisi } from '../../bilesenler/UrunSatiri';
import { renk, tl } from '../../tema';
import { kaynak } from '../../veri/kaynak';
import { useVeri } from '../../veri/VeriSaglayici';

export default function UrunSayfasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const urun = v.urun(id);
  const [talep, setTalep] = useState<'yok' | 'gonderiliyor' | 'tamam'>('yok');
  const [hata, setHata] = useState<string | null>(null);

  if (!urun) {
    return <View style={{ flex: 1, padding: 24, paddingTop: ic.top + 24, gap: 16 }}><Yazi>Ürün bulunamadı.</Yazi><Dugme yazi="Geri" onPress={() => router.back()} /></View>;
  }
  const eslik = v.urun(urun.eslik_urun_id);
  const kategori = v.menu.kategoriler.find((k) => k.id === urun.kategori_id);
  const favori = v.favoriler.has(urun.id);
  const vitrin = vitrinYazisi(urun);
  const yuvarlak = { width: 44, height: 44, borderRadius: 22, backgroundColor: renk.kart, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: renk.kagit }} contentContainerStyle={{ paddingBottom: ic.bottom + 32 }}>
      <View style={{ height: 280 + ic.top, backgroundColor: renk.kremKutu, alignItems: 'center', justifyContent: 'center' }}>
        <Ikon ad="image" boy={40} renkKodu={renk.soluk} />
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => (router.canGoBack() ? router.back() : router.replace('/menu'))}
          style={[yuvarlak, { position: 'absolute', left: 16, top: ic.top + 12 }]}>
          <Ikon ad="arrow-left" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={favori ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          onPress={() => (v.uye ? v.favoriDegistir(urun.id).catch(() => {}) : router.push('/giris'))}
          style={[yuvarlak, { position: 'absolute', right: 16, top: ic.top + 12, backgroundColor: favori ? renk.ana : renk.kart }]}>
          <Ikon ad="heart" renkKodu={favori ? renk.krem : renk.ana} />
        </Pressable>
      </View>

      <View style={[s.kenar, { gap: 18, paddingTop: 22 }]}>
        <View style={{ gap: 4 }}>
          {vitrin ? <Rozet metin={vitrin} /> : null}
          <Yazi tur="buyukBaslik" style={{ fontSize: 26 }}>{urun.ad}</Yazi>
          {urun.ad_en && urun.ad_en !== urun.ad ? <Yazi tur="italik" style={{ fontSize: 15 }}>{urun.ad_en}</Yazi> : null}
          {urun.fiyat != null ? <Yazi tur="fiyat" style={{ fontSize: 22, marginTop: 6 }}>{tl(urun.fiyat)}</Yazi> : null}
        </View>
        {urun.aciklama ? <Yazi>{urun.aciklama}</Yazi> : null}

        <Kutu style={{ gap: 0, paddingVertical: 4 }}>
          <Satir><Yazi style={{ flex: 1 }}>Alerjenler</Yazi><Yazi tur="kalin" style={{ fontSize: 14, textAlign: 'right', flexShrink: 1 }}>{urun.alerjenler ?? 'Kasadan sorabilirsiniz'}</Yazi></Satir>
          <Satir><Yazi style={{ flex: 1 }}>Kalori</Yazi><Yazi tur="kalin" style={{ fontSize: 14 }}>{urun.kalori != null ? `≈ ${urun.kalori} kcal` : '—'}</Yazi></Satir>
          <Satir son><Yazi style={{ flex: 1 }}>Kahve kartı</Yazi><Yazi tur="kalin" style={{ fontSize: 14 }}>{kategori?.damga_verir ? '+1 damga' : 'Damga yok'}</Yazi></Satir>
        </Kutu>

        {eslik ? (
          <View style={{ gap: 8 }}>
            <Yazi tur="kalin" style={{ fontSize: 14 }}>Yanına ne gider?</Yazi>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/urun/[id]', params: { id: eslik.id } })}>
              <Kutu tur="krem" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Yazi tur="kalin">{eslik.ad}</Yazi>
                  {eslik.fiyat != null ? <Yazi tur="fiyat" style={{ fontSize: 14 }}>{tl(eslik.fiyat)}</Yazi> : null}
                </View>
                <Ikon ad="chevron-right" />
              </Kutu>
            </Pressable>
          </View>
        ) : null}

        {urun.on_siparis ? (
          talep === 'tamam' ? (
            <Kutu tur="ana">
              <Yazi tur="kalin" style={{ color: renk.krem }}>Talebiniz alındı</Yazi>
              <Yazi style={{ color: renk.anaUstuSoluk }}>{v.menu.sube?.ad ?? 'Şubemiz'} sizi arayıp tarihi ve ayrıntıları netleştirecek. Ödeme teslimde.</Yazi>
            </Kutu>
          ) : (
            <View style={{ gap: 8 }}>
              <Dugme yazi="Ön sipariş talebi bırak" bekliyor={talep === 'gonderiliyor'}
                onPress={async () => {
                  if (!v.uye) { router.push('/giris'); return; }
                  setTalep('gonderiliyor'); setHata(null);
                  try { await kaynak.onSiparisTalebi(urun.id, null); setTalep('tamam'); }
                  catch (e) { setTalep('yok'); setHata(e instanceof Error ? e.message : String(e)); }
                }} />
              <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Şubemiz sizi arar; tarihi ve pasta üstü yazıyı birlikte netleştiririz. Ödeme teslimde.</Yazi>
              {hata ? <Yazi tur="kucuk" style={{ color: renk.tehlike, textAlign: 'center' }}>Gönderilemedi: {hata}</Yazi> : null}
            </View>
          )
        ) : null}
      </View>
    </ScrollView>
  );
}
