// Anlık bildirimler: izin, Expo bildirim anahtarı (push token) ve dokununca açılacak ekran.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { kaynak } from './kaynak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Üye giriş yapınca bir kez: izin iste, anahtarı al, sunucuya yaz. Hata olursa sessizce geçer
// (ör. simülatör, Android'de Expo Go uzak bildirimi desteklemez).
export async function bildirimKaydet(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    if (Platform.OS === 'android') {
      // eslint-disable-next-line import/namespace -- AndroidImportance yeniden dışa aktarılıyor; tsc doğruluyor
      await Notifications.setNotificationChannelAsync('default', { name: 'Hamour', importance: Notifications.AndroidImportance.DEFAULT });
    }
    let izin = (await Notifications.getPermissionsAsync()).status;
    if (izin !== 'granted') izin = (await Notifications.requestPermissionsAsync()).status;
    if (izin !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await kaynak.pushToken(data);
  } catch {
    // bildirim olmadan da uygulama çalışır
  }
}

// Bildirime dokunulunca ilgili ürünü ya da duyuruları aç
export function useBildirimYonlendirme() {
  const yanit = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const veri = yanit?.notification.request.content.data as { urun_id?: string | null; tur?: string } | undefined;
    if (!veri) return;
    if (veri.urun_id) router.push({ pathname: '/urun/[id]', params: { id: veri.urun_id } });
    else if (veri.tur === 'kart') router.navigate('/kart');
    else router.navigate('/duyurular');
  }, [yanit]);
}
