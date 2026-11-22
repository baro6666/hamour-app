// Uygulamanın sabit marka içeriği. Metinler hamour.com.tr'den (Kasım 2026); bilinmeyenler null (uydurma yok).
import type { ImageSourcePropType } from 'react-native';
import { yerelFotolar } from './fotolar';
import type { BolumId } from './tipler';

export interface Bolum {
  id: BolumId;
  ad: string;
  baslik: string;
  metin: string;
  gorsel: ImageSourcePropType; // beyaz tabakta, arka planı şeffaf
  urunsuz?: boolean; // sitede ürün listesi yok (vitrin günlük değişir)
}

export const BOLUMLER: Bolum[] = [
  {
    id: 'kahvalti', ad: 'Royal Breakfast', baslik: 'Güne Hamour’da başla',
    metin: 'Özenle seçilmiş malzemelerle hazırlanan, sağlıklı, doyurucu ve zarif sunumlu kahvaltı.',
    gorsel: require('../../assets/gorsel/bolum-kahvalti.png'),
  },
  {
    id: 'ana', ad: 'Ana yemekler', baslik: 'Hamour lezzetleriyle tanışın',
    metin: 'Doğallık ve kalite bir arada: organik ve taze ürünlerle hazırlanan ana yemekler.',
    gorsel: require('../../assets/gorsel/bolum-ana.png'),
  },
  {
    id: 'icecek', ad: 'İçecekler', baslik: 'Her an kutlamaya değer',
    metin: 'Zengin çay çeşitleri, smoothie’ler ve kahveler; doğal aromalarla sıcak ve soğuk.',
    gorsel: require('../../assets/gorsel/bolum-icecek.png'),
  },
  {
    id: 'alkol', ad: 'Bar', baslik: 'Her yudumda eşsiz lezzet',
    metin: 'Şaraplar, şampanya, imza kokteyller ve seçkin viskiler.',
    gorsel: require('../../assets/gorsel/bolum-alkol.png'),
  },
  {
    id: 'patiseri', ad: 'Patiseri', baslik: 'Güne anlam katan lezzetler',
    metin: 'Günlük taze kruvasanlar, özenle hazırlanan ekmekler ve Fransız esintili tatlılar. Vitrin her gün değişir.',
    gorsel: require('../../assets/gorsel/bolum-patiseri.png'), urunsuz: true,
  },
  {
    id: 'pasta', ad: 'Pastalar', baslik: 'Özel günlere anlam katan pastalar',
    metin: 'Günlük taze pastalar ve özel günleriniz için hazırlanan Fransız esintili kutlama pastaları.',
    gorsel: require('../../assets/gorsel/bolum-pasta.png'), urunsuz: true,
  },
];

export const GORSEL = {
  giris: require('../../assets/gorsel/giris-servis.jpg'),
  salon: require('../../assets/gorsel/salon.jpg'),
  sofra: require('../../assets/gorsel/sofra.jpg'),
  vitrin: require('../../assets/gorsel/vitrin.jpg'),
  salonGenis: require('../../assets/gorsel/salon-genis.jpg'),
  patiseriTezgah: require('../../assets/gorsel/patiseri-tezgah.jpg'),
  aksam: require('../../assets/gorsel/aksam.jpg'),
  hikaye: [
    require('../../assets/gorsel/hikaye-1.jpg'),
    require('../../assets/gorsel/hikaye-2.jpg'),
    require('../../assets/gorsel/hikaye-3.jpg'),
    require('../../assets/gorsel/hikaye-4.jpg'),
  ],
};

export const HIKAYE = [
  'Hamour, fırından çıkan taptaze ekmek kokusunu, damakta iz bırakan pastaların lezzetini ve bu tatların peşine düşmek için uzak ülkelere gitme gerekliliğini ortadan kaldırma hayaliyle doğdu.',
  'Büyük bir tutkuyla sahiplenilen bu fikir, misafirlerin kendilerini Paris’in büyülü bir caddesinde hissedecekleri eşsiz bir mekâna dönüştü.',
  'Güne zengin kahvaltıyla başlayın, kahve ya da çay eşliğinde çıtır kruvasanların keyfini sürün. Menü yalnız tatlılarla sınırlı değil: burgerler, bistro tabakları ve kokteyl köşesi de sizi bekliyor.',
];

export const ILETISIM = {
  sube: 'Hamour Beykoz',
  adres: 'Acarlar Mah. 9. Cad. C Blok Dış Kapı No: 11/2 İç Kapı No: 259, Beykoz / İstanbul',
  telefonlar: [
    { etiket: 'Sipariş hattı', numara: '0532 050 27 17' },
    { etiket: 'Şube', numara: '0216 525 50 50' },
  ],
  // WhatsApp rezervasyon hattı (uluslararası biçim, + ve boşluk yok). Sitedeki sipariş hattı; Hamour'un WhatsApp'ı
  // farklıysa yalnız bu satır değişir.
  whatsapp: '905320502717',
  eposta: 'info@hamour.com.tr',
  calismaSaatleri: null as string | null, // Hamour'dan alınacak
  instagram: 'hamour.ist',
  facebook: 'hamour.ist',
  web: 'www.hamour.com.tr',
};

// Kurumsal yapı: yalnız bilinen bilgiler. Hamour'dan gelince doldurulur (null olanlar ekranda görünmez).
export const KURUMSAL: { baslik: string; deger: string | null }[] = [
  { baslik: 'Konsept', deger: 'Patiseri · brasserie · bistro' },
  { baslik: 'Şube', deger: 'Beykoz, İstanbul' },
  { baslik: 'Şirket unvanı', deger: null },
  { baslik: 'Kuruluş', deger: null },
  { baslik: 'Kurumsal iletişim', deger: 'info@hamour.com.tr' },
];

// İşbirlikleri: markalar, etkinlikler, kurumsal ikramlar. Liste Hamour'dan gelince eklenir.
export interface Isbirligi { ad: string; aciklama: string | null; gorsel: ImageSourcePropType | null }
export const ISBIRLIKLERI: Isbirligi[] = [];

// Sosyal medya vitrini: Instagram hesabına yönlendirir (gönderiler canlı çekilmez).
export const SOSYAL_GORSELLER: ImageSourcePropType[] = [
  GORSEL.hikaye[0], yerelFotolar['speculoos-pancake'], GORSEL.hikaye[3],
  yerelFotolar['avocado-toast'], GORSEL.hikaye[1], yerelFotolar['purple-basil'],
].filter(Boolean);
