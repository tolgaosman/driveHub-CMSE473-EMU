import type { VehicleStatus } from '@shared/contracts';
import type { Tone } from '@/components/ui/primitives';
import type { Lang } from './i18n';

export const VEHICLE_STATUS: Record<VehicleStatus, { tone: Tone; en: string; tr: string }> = {
  REGISTERED: { tone: 'neutral', en: 'Registered', tr: 'Kayıtlı' },
  ANALYZING: { tone: 'info', en: 'Analyzing', tr: 'Analiz ediliyor' },
  AWAITING_REVIEW: { tone: 'warning', en: 'Awaiting review', tr: 'Onay bekliyor' },
  INSPECTED: { tone: 'info', en: 'Inspected', tr: 'Ekspertiz tamam' },
  IN_STOCK: { tone: 'neutral', en: 'In stock', tr: 'Stokta' },
  IN_AUCTION: { tone: 'success', en: 'In auction', tr: 'İhalede' },
  SOLD: { tone: 'brand', en: 'Sold', tr: 'Satıldı' },
  ARCHIVED: { tone: 'neutral', en: 'Archived', tr: 'Arşiv' },
};

export function statusLabel(status: VehicleStatus, lang: Lang): string {
  return VEHICLE_STATUS[status][lang];
}
