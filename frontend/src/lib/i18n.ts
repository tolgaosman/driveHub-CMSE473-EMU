export type Lang = 'en' | 'tr';
export type Currency = 'GBP' | 'TRY';

const dict = {
  en: {
    brandSub: 'Omni-Channel Automotive Hub',
    navDashboard: 'Overview',
    navInventory: 'Inventory',
    navInspector: 'Field Inspector',
    navAuctions: 'Auctions',
    navLiveRoom: 'Live Room',
    navSchedule: 'Schedule Auction',
    navReports: 'Reports & Analytics',
    navAdmin: 'Admin & Audit',
    navLanding: 'Showcase',
    tenantLabel: 'Active Tenant',
    registerVehicle: 'Register Vehicle',
    searchPlaceholder: 'Search VIN, make, model...',
    allStatuses: 'All Statuses',
    allMakes: 'All Makes',
    liveRoomBadge: 'LIVE ROOM',
    reserveMet: 'Reserve met',
    reserveNotMet: 'Reserve not yet met',
    antiSnipingHint: 'Bids in the final 30 s extend the auction by +30 s (max 10)',
    placeBid: 'Place Bid',
    connected: 'Connected',
    biddersInRoom: 'bidders in room',
    bidHistory: 'Append-Only Bid Tape',
    aiValuation: 'AI Valuation',
    demoDirector: 'Demo Director',
    signOut: 'Sign out',
    language: 'Language',
    startTime: 'Start time',
    startTimeHint: 'Used when saving as scheduled. Publishing opens the room immediately.',
    pickDate: 'Pick date & time',
    today: 'Today',
    time: 'Time',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    switchRole: 'Switch role',
    liveTriggers: 'Live auction triggers',
    simulateCollision: 'Simulate 3 simultaneous bids',
    rivalBid: 'Rival bid',
    jumpTo22: 'Jump to 00:22',
    reset: 'Reset',
    notifications: 'Notifications',
    close: 'Close',
  },
  tr: {
    brandSub: 'Çok Kanallı Otomotiv Platformu',
    navDashboard: 'Genel Bakış',
    navInventory: 'Araç Envanteri',
    navInspector: 'Saha Ekspertiz',
    navAuctions: 'İhaleler',
    navLiveRoom: 'Canlı Oda',
    navSchedule: 'İhale Planla',
    navReports: 'Raporlar & Analitik',
    navAdmin: 'Yönetim & Denetim',
    navLanding: 'Vitrin',
    tenantLabel: 'Aktif Galeri (Tenant)',
    registerVehicle: 'Araç Kaydet',
    searchPlaceholder: 'VIN, marka, model ara...',
    allStatuses: 'Tüm Durumlar',
    allMakes: 'Tüm Markalar',
    liveRoomBadge: 'CANLI ODA',
    reserveMet: 'Rezerv aşıldı',
    reserveNotMet: 'Rezerv henüz aşılmadı',
    antiSnipingHint: 'Son 30 sn içindeki teklifler süreyi +30 sn uzatır (maks. 10)',
    placeBid: 'Teklif Ver',
    connected: 'Bağlı',
    biddersInRoom: 'alıcı odada',
    bidHistory: 'Sıralı Teklif Akışı',
    aiValuation: 'AI Değerleme',
    demoDirector: 'Sunum Kontrolü',
    signOut: 'Çıkış yap',
    language: 'Dil',
    startTime: 'Başlangıç zamanı',
    startTimeHint: 'Planlı kayıtta kullanılır. Yayınla seçeneği odayı hemen açar.',
    pickDate: 'Tarih ve saat seç',
    today: 'Bugün',
    time: 'Saat',
    prevMonth: 'Önceki ay',
    nextMonth: 'Sonraki ay',
    switchRole: 'Rol değiştir',
    liveTriggers: 'Canlı ihale tetikleyicileri',
    simulateCollision: '3 eşzamanlı teklif simüle et',
    rivalBid: 'Rakip teklif',
    jumpTo22: "00:22'ye atla",
    reset: 'Sıfırla',
    notifications: 'Bildirimler',
    close: 'Kapat',
  },
} as const;

export type DictKey = keyof typeof dict.en;

export const LANGUAGES: { value: Lang; label: string; code: string }[] = [
  { value: 'en', label: 'English', code: 'EN' },
  { value: 'tr', label: 'Türkçe', code: 'TR' },
];

export function localeOf(lang: Lang): string {
  return lang === 'tr' ? 'tr-TR' : 'en-GB';
}

export function t(lang: Lang, key: DictKey): string {
  return dict[lang][key];
}

export function formatMoney(amountGbp: number, currency: Currency, rateGbpToTry = 44.2): string {
  if (currency === 'TRY') {
    const converted = Math.round((amountGbp * rateGbpToTry) / 100) * 100;
    return `₺${converted.toLocaleString('tr-TR')}`;
  }
  return `£${amountGbp.toLocaleString('en-GB')}`;
}

