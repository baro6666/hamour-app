import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold } from '@expo-google-fonts/tajawal';
import { Jost_400Regular, Jost_500Medium, Jost_500Medium_Italic, Jost_700Bold, useFonts } from '@expo-google-fonts/jost';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { PlayfairDisplay_500Medium_Italic, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DilSaglayici, useDil } from '../dil/DilSaglayici';
import { renk, yazi } from '../tema';
import { useBildirimYonlendirme } from '../veri/bildirim';
import { VeriSaglayici } from '../veri/VeriSaglayici';

function BildirimYonlendirici() {
  useBildirimYonlendirme();
  return null;
}

// Arapçada tüm yerleşim sağdan sola (yeniden başlatma gerektirmeyen Yoga 'direction')
function Yon({ children }: { children: React.ReactNode }) {
  const { rtl, dil } = useDil();
  return <View key={dil} style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr' }}>{children}</View>;
}

export default function KokDuzen() {
  const [yuklendi] = useFonts({ Jost_400Regular, Jost_500Medium, Jost_500Medium_Italic, Jost_700Bold, Montserrat_700Bold, PlayfairDisplay_700Bold, PlayfairDisplay_500Medium_Italic,
    Amiri_400Regular, Amiri_700Bold, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold });
  if (!yuklendi) {
    return <View style={{ flex: 1, backgroundColor: renk.ana, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={renk.krem} /></View>;
  }
  return (
    <SafeAreaProvider>
      <DilSaglayici>
      <Yon>
      <VeriSaglayici>
        <StatusBar style="auto" />
        {/* expo-notifications web'de bildirim yanıtını desteklemez; web önizlemesi çökmesin */}
        {Platform.OS !== 'web' ? <BildirimYonlendirici /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: renk.kagit },
            headerTintColor: renk.ana,
            headerTitleStyle: { fontFamily: yazi.baslik },
          }}
        >
          <Stack.Screen name="(sekmeler)" />
          <Stack.Screen name="urun/[id]" />
          <Stack.Screen name="rezervasyon" options={{ presentation: 'modal' }} />
          <Stack.Screen name="giris" options={{ presentation: 'modal' }} />
          <Stack.Screen name="kvkk" />
        </Stack>
      </VeriSaglayici>
      </Yon>
      </DilSaglayici>
    </SafeAreaProvider>
  );
}
