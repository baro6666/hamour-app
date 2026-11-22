import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renk, yazi } from '../../tema';

export default function SekmeDuzeni() {
  const ic = useSafeAreaInsets();
  const ikon = (ad: React.ComponentProps<typeof Feather>['name']) =>
    function SekmeIkonu({ color }: { color: ColorValue }) { return <Feather name={ad} size={21} color={color as string} />; };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renk.krem,
        tabBarInactiveTintColor: renk.anaUstuSoluk,
        tabBarStyle: { backgroundColor: renk.kahve, borderTopWidth: 0, height: 62 + ic.bottom, paddingTop: 6, paddingBottom: ic.bottom + 6 },
        tabBarLabelStyle: { fontFamily: yazi.orta, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet', tabBarIcon: ikon('compass') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menü', tabBarIcon: ikon('book-open') }} />
      <Tabs.Screen name="kart" options={{ title: 'Kart', tabBarIcon: ikon('credit-card') }} />
      <Tabs.Screen name="hamour" options={{ title: 'Hamour', tabBarIcon: ikon('feather') }} />
      <Tabs.Screen name="iletisim" options={{ title: 'İletişim', tabBarIcon: ikon('map-pin') }} />
    </Tabs>
  );
}
