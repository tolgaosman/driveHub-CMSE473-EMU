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
    signOut: 'Sign Out',
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
    signOut: 'Çıkış Yap',
  },
} as const;

export type DictKey = keyof typeof dict.en;

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

