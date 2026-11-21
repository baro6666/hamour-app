import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foto, fotoKaynak } from '../../bilesenler/Foto';
import { Dugme, Yazi } from '../../bilesenler/ortak';
import { ara, Sus } from '../../bilesenler/vitrin';
import { renk, tl, yazi } from '../../tema';
import { BOLUMLER, ILETISIM } from '../../veri/icerik';
import type { Urun } from '../../veri/tipler';
import { useVeri } from '../../veri/VeriSaglayici';

export default function Menu() {
  const v = useVeri();
  const ic = useSafeAreaInsets();
  const p = useLocalSearchParams<{ bolum?: string }>();
  const kaydirma = useRef<ComponentRef<typeof ScrollView>>(null);

  const bolumler = useMemo(
    () => BOLUMLER.filter((b) => b.urunsuz || v.menu.kategoriler.some((k) => k.bolum === b.id)),
    [v.menu.kategoriler],
  );
  // Kullanıcının seçimi, seçildiği andaki adres parametresiyle saklanır; başka sayfadan yeni bölümle gelinince o geçer.
  const [secim, setSecim] = useState<{ id: string; param: string | undefined }>({ id: p.bolum ?? 'kahvalti', param: p.bolum });
  const secili = secim.param === p.bolum ? secim.id : (p.bolum ?? secim.id);
  const setSecili = (id: string) => setSecim({ id, param: p.bolum });
  useEffect(() => { kaydirma.current?.scrollTo({ y: 0, animated: false }); }, [p.bolum]);

  const bolum = bolumler.find((b) => b.id === secili) ?? bolumler[0];
  const kategoriler = v.menu.kategoriler.filter((k) => k.bolum === bolum?.id);

  return (
    <View style={{ flex: 1, backgroundColor: renk.kagit }}>
      <View style={{ paddingTop: ic.top + 14, paddingBottom: 12, gap: 12, backgroundColor: renk.kagit, borderBottomWidth: 1, borderBottomColor: renk.cizgi }}>
        <Yazi tur="buyukBaslik" style={{ paddingHorizontal: 20 }}>Menü</Yazi>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {bolumler.map((b) => {
            const aktif = b.id === bolum?.id;
            return (
              <Pressable key={b.id} accessibilityRole="tab" accessibilityState={{ selected: aktif }}
                onPress={() => { setSecili(b.id); kaydirma.current?.scrollTo({ y: 0, animated: false }); }}
                style={{ height: 38, paddingHorizontal: 16, borderRadius: 19, justifyContent: 'center', backgroundColor: aktif ? renk.kahve : 'transparent', borderWidth: 1, borderColor: aktif ? renk.kahve : renk.cizgi }}>
                <Yazi style={{ fontFamily: yazi.orta, fontSize: 14, color: aktif ? renk.krem : renk.kahve }}>{b.ad}</Yazi>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={kaydirma} contentContainerStyle={{ paddingBottom: 48, gap: 26 }}>
        {bolum ? (
          <View style={{ marginHorizontal: 20, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Yazi tur="ust">{bolum.ad}</Yazi>
              <Yazi tur="buyukBaslik" style={{ fontSize: 26, lineHeight: 32 }}>{bolum.baslik}</Yazi>
              <Yazi style={{ fontSize: 14, lineHeight: 21 }}>{bolum.metin}</Yazi>
            </View>
            <Foto kaynak={bolum.gorsel} contentFit="contain" transition={0} style={{ width: 128, height: 128 }} />
          </View>
        ) : null}

        {bolum?.urunsuz ? (
          <View style={{ marginHorizontal: 20, gap: 14 }}>
            <Sus />
            <Yazi style={{ textAlign: 'center' }}>
              {bolum.id === 'pasta' ? 'Kutlama pastası siparişleri telefonla alınır.' : 'Günün kruvasan ve tatlıları şubedeki vitrinde.'}
            </Yazi>
            <Dugme yazi={bolum.id === 'pasta' ? 'Pasta siparişi için arayın' : 'Bugün vitrinde ne var?'} onPress={() => ara(ILETISIM.telefonlar[0].numara)} />
          </View>
        ) : null}

        {kategoriler.map((k) => {
          const urunler = v.menu.urunler.filter((u) => u.kategori_id === k.id);
          if (!urunler.length) return null;
          const fotolu = urunler.filter((u) => u.foto_url);
          const fotosuz = urunler.filter((u) => !u.foto_url);
          return (
            <View key={k.id} style={{ gap: 14 }}>
              {kategoriler.length > 1 ? (
                <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Yazi style={{ fontFamily: yazi.baslik, fontSize: 21, color: renk.kahve }}>{k.ad}</Yazi>
                  <View style={{ flex: 1, height: 1, backgroundColor: renk.cizgi }} />
                </View>
              ) : null}
              {fotolu.map((u) => <FotoluUrun key={u.id} urun={u} />)}
              {fotosuz.length ? (
                <View style={{ marginHorizontal: 20, borderRadius: 18, backgroundColor: renk.kart, borderWidth: 1, borderColor: renk.cizgi, paddingHorizontal: 18 }}>
                  {fotosuz.map((u, i) => <YaziliUrun key={u.id} urun={u} ilk={i === 0} />)}
                </View>
              ) : null}
            </View>
          );
        })}

        <Yazi tur="kucuk" style={{ paddingHorizontal: 20, textAlign: 'center' }}>
          Alerjen ve içerik bilgisi için lütfen servis ekibimize danışın.
        </Yazi>
      </ScrollView>
    </View>
  );
}

function urunAc(u: Urun) {
  router.push({ pathname: '/urun/[id]', params: { id: u.id } });
}

function FotoluUrun({ urun: u }: { urun: Urun }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={u.ad} onPress={() => urunAc(u)}
      style={({ pressed }) => ({ marginHorizontal: 20, flexDirection: 'row', gap: 14, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}>
      <Foto kaynak={fotoKaynak(u.foto_url)} style={{ width: 112, height: 140, borderRadius: 16, backgroundColor: renk.kremKutu }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Yazi style={{ fontFamily: yazi.kalin, fontSize: 15, letterSpacing: 0.8, color: renk.kahve }}>{u.ad}</Yazi>
        {u.aciklama ? <Yazi numberOfLines={4} style={{ fontSize: 13.5, lineHeight: 19 }}>{u.aciklama}</Yazi> : null}
        {u.fiyat != null ? <Yazi tur="fiyat">{tl(u.fiyat)}</Yazi> : null}
      </View>
    </Pressable>
  );
}

function YaziliUrun({ urun: u, ilk }: { urun: Urun; ilk: boolean }) {
  return (
    <View style={{ paddingVertical: 13, gap: 3, borderTopWidth: ilk ? 0 : 1, borderTopColor: renk.cizgi }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Yazi style={{ flex: 1, fontFamily: yazi.orta, fontSize: 14.5, letterSpacing: 0.6, color: renk.kahve }}>{u.ad}</Yazi>
        {u.fiyat != null ? <Yazi tur="fiyat" style={{ fontSize: 14 }}>{tl(u.fiyat)}</Yazi> : null}
      </View>
      {u.aciklama ? <Yazi tur="kucuk">{u.aciklama}</Yazi> : null}
    </View>
  );
}
