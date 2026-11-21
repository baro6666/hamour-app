import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renk, yazi } from '../../tema';
import { useVeri } from '../../veri/VeriSaglayici';

export default function SekmeDuzeni() {
  const { okunmamis } = useVeri();
  const ic = useSafeAreaInsets();
  const ikon = (ad: React.ComponentProps<typeof Feather>['name']) =>
    function SekmeIkonu({ color }: { color: ColorValue }) { return <Feather name={ad} size={22} color={color as string} />; };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renk.ana,
        tabBarInactiveTintColor: renk.sekmeSoluk,
        tabBarStyle: { backgroundColor: renk.kart, borderTopColor: renk.cizgi, height: 62 + ic.bottom, paddingTop: 6, paddingBottom: ic.bottom + 6 },
        tabBarLabelStyle: { fontFamily: yazi.kalin, fontSize: 11, lineHeight: 14 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana sayfa', tabBarIcon: ikon('home') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menü', tabBarIcon: ikon('coffee') }} />
      <Tabs.Screen name="kart" options={{ title: 'Kahve kartı', tabBarIcon: ikon('maximize') }} />
      <Tabs.Screen
        name="duyurular"
        options={{
          title: 'Duyurular', tabBarIcon: ikon('bell'),
          tabBarBadge: okunmamis > 0 ? okunmamis : undefined,
          tabBarBadgeStyle: { backgroundColor: renk.turuncu, fontFamily: yazi.kalin, fontSize: 11 },
        }}
      />
      <Tabs.Screen name="hesap" options={{ title: 'Hesap', tabBarIcon: ikon('user') }} />
    </Tabs>
  );
}
