import { Jost_400Regular, Jost_500Medium, Jost_500Medium_Italic, Jost_700Bold, useFonts } from '@expo-google-fonts/jost';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { renk, yazi } from '../tema';
import { useBildirimYonlendirme } from '../veri/bildirim';
import { VeriSaglayici } from '../veri/VeriSaglayici';

function BildirimYonlendirici() {
  useBildirimYonlendirme();
  return null;
}

export default function KokDuzen() {
  const [yuklendi] = useFonts({ Jost_400Regular, Jost_500Medium, Jost_500Medium_Italic, Jost_700Bold, Montserrat_700Bold });
  if (!yuklendi) {
    return <View style={{ flex: 1, backgroundColor: renk.ana, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={renk.krem} /></View>;
  }
  return (
    <SafeAreaProvider>
      <VeriSaglayici>
        <StatusBar style="dark" />
        {/* expo-notifications web'de bildirim yanıtını desteklemez; web önizlemesi çökmesin */}
        {Platform.OS !== 'web' ? <BildirimYonlendirici /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: renk.kagit },
            headerTintColor: renk.ana,
            headerTitleStyle: { fontFamily: yazi.kalin },
          }}
        >
          <Stack.Screen name="(sekmeler)" />
          <Stack.Screen name="urun/[id]" />
          <Stack.Screen name="marka" />
          <Stack.Screen name="giris" options={{ presentation: 'modal' }} />
        </Stack>
      </VeriSaglayici>
    </SafeAreaProvider>
  );
}
