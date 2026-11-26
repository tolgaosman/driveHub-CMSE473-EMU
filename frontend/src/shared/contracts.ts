export type Role = 'PLATFORM_ADMIN' | 'GALLERY_MANAGER' | 'INSPECTOR' | 'DEALER';

export type VehicleStatus =
  | 'REGISTERED'
  | 'ANALYZING'
  | 'AWAITING_REVIEW'
  | 'INSPECTED'
  | 'IN_STOCK'
  | 'IN_AUCTION'
  | 'SOLD'
  | 'ARCHIVED';

export type AuctionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'EXTENDED'
  | 'SOLD'
  | 'NOT_SOLD'
  | 'CANCELLED';

export type BidStatus =
  | 'ACCEPTED'
  | 'OUTBID'
  | 'REJECTED_TOO_LOW'
  | 'REJECTED_DUPLICATE'
  | 'REJECTED_OWN_TENANT'
  | 'REJECTED_CLOSED';

export type DamageType = 'DENT' | 'SCRATCH' | 'BUMPER_CRACK' | 'BROKEN_LIGHT';

export type PhotoAngle =
  | 'front'
  | 'rear'
  | 'left'
  | 'right'
  | 'front-left'
  | 'front-right'
  | 'rear-left'
  | 'rear-right';

export const MANDATORY_ANGLES: { id: PhotoAngle; labelEn: string; labelTr: string }[] = [
  { id: 'front', labelEn: 'Front', labelTr: 'Ön' },
  { id: 'rear', labelEn: 'Rear', labelTr: 'Arka' },
  { id: 'left', labelEn: 'Left Side', labelTr: 'Sol Yan' },
  { id: 'right', labelEn: 'Right Side', labelTr: 'Sağ Yan' },
  { id: 'front-left', labelEn: 'Front-Left', labelTr: 'Ön Sol' },
  { id: 'front-right', labelEn: 'Front-Right', labelTr: 'Ön Sağ' },
  { id: 'rear-left', labelEn: 'Rear-Left', labelTr: 'Arka Sol' },
  { id: 'rear-right', labelEn: 'Rear-Right', labelTr: 'Arka Sağ' },
];

export interface Tenant {
  id: string;
  name: string;
  city: string;
  taxNo: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  verifiedDealer: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  twoFactorEnabled: boolean;
  avatarInitials: string;
}

export interface BoundingBox {
  /** Normalized percentages 0..100 for responsive SVG overlay */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DamageDetection {
  id: string;
  angle: PhotoAngle;
  panel: string;
  type: DamageType;
  confidence: number; // 0..1
  bbox: BoundingBox;
  source: 'AI' | 'MANUAL';
  confirmedByInspector: boolean | null; // null = pending, true = confirmed, false = false positive
  estimatedDeductionGbp: number;
}

export interface ValuationFactor {
  label: string;
  deltaGbp: number;
  category: 'BASE' | 'MILEAGE' | 'DAMAGE' | 'MARKET';
}

export interface Valuation {
  id: string;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  overriddenPrice?: number;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  modelVersion: string;
  factors: ValuationFactor[];
  createdAt: string;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  inspectorId: string;
  inspectorName: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AWAITING_REVIEW' | 'FINALIZED';
  modelVersion: string;
  inferenceTimeSec: number;
  plateBlurEnabled: boolean;
  notes: string;
  checklist: {
    tyres: 'OK' | 'WARN';
    lights: 'OK' | 'WARN';
    interior: 'OK' | 'WARN';
    engineBay: 'OK' | 'WARN';
  };
  damages: DamageDetection[];
  submittedAt: string;
  finalizedAt?: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  tenantName: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  engine: string;
  fuel: 'Diesel' | 'Petrol' | 'Hybrid' | 'Electric';
  transmission: 'Automatic' | 'Manual';
  color: string;
  mileageKm: number;
  status: VehicleStatus;
  notes: string;
  imageAccent: string;
  photoUrl?: string;
  inspection?: Inspection;
  valuation?: Valuation;
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderTenantId: string;
  bidderAlias: string;
  amount: number;
  sequenceNo: number | null; // null for rejected bids
  status: BidStatus;
  rejectionReason?: string;
  clientRequestId: string;
  processingMs: number;
  serverTimestamp: string;
}

export interface Auction {
  id: string;
  tenantId: string;
  tenantName: string;
  vehicleId: string;
  startPrice: number;
  /** Stripped from DEALER payloads per BR-5 */
  reservePrice?: number;
  reserveMet: boolean;
  minIncrement: number;
  highestBid: number;
  highestBidderTenantId?: string;
  highestBidderAlias?: string;
  sequenceNo: number;
  extensionsCount: number;
  maxExtensions: number;
  visibility: 'ALL_VERIFIED' | 'INVITED_ONLY';
  startsAt: string;
  endsAt: string;
  status: AuctionStatus;
  connectedBidders: number;
  bids: Bid[];
  sale?: {
    id: string;
    winningTenantName: string;
    finalPrice: number;
    soldAt: string;
    certificateHash: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  resource: string;
  severity: 'INFO' | 'WARNING' | 'SECURITY';
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'AI_READY' | 'OUTBID' | 'AUCTION_START' | 'AUCTION_SOLD' | 'SYSTEM';
  createdAt: string;
  read: boolean;
}

export type WsClientMessage =
  | { type: 'JOIN_ROOM'; auctionId: string; token: string }
  | { type: 'PLACE_BID'; auctionId: string; amount: number; clientRequestId: string; token: string }
  | { type: 'PING'; ts: number };

export type WsServerMessage =
  | { type: 'AUCTION_STATE'; auction: Auction; vehicle: Vehicle }
  | { type: 'BID_ACCEPTED'; bid: Bid; auction: Auction }
  | { type: 'BID_REJECTED'; bid: Bid; reason: string }
  | { type: 'NEW_HIGHEST_BID'; bid: Bid; auction: Auction }
  | { type: 'AUCTION_EXTENDED'; auctionId: string; newEndsAt: string; extensionsCount: number }
  | { type: 'AUCTION_CLOSED'; auctionId: string; status: 'SOLD' | 'NOT_SOLD'; auction: Auction }
  | { type: 'PONG'; ts: number; serverTs: number };

/** ISO 3779 VIN validator: 17 alphanumeric chars, excluding I, O, Q */
export function validateIso3779Vin(rawVin: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = rawVin.trim().toUpperCase();
  if (normalized.length !== 17) {
    return { valid: false, normalized, error: 'VIN must be exactly 17 characters (ISO 3779).' };
  }
  if (/[IOQ]/.test(normalized)) {
    return { valid: false, normalized, error: 'VIN cannot contain letters I, O, or Q (ISO 3779).' };
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    return { valid: false, normalized, error: 'VIN must contain only alphanumeric characters.' };
  }
  return { valid: true, normalized };
}

export interface DecodedVinInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  engine: string;
  fuel: 'Diesel' | 'Petrol' | 'Hybrid' | 'Electric';
  transmission: 'Automatic' | 'Manual';
  fromCache: boolean;
}

const KNOWN_VINS: Record<string, Omit<DecodedVinInfo, 'vin' | 'fromCache'>> = {
  WVWZZZ1KZ8W123456: {
    make: 'Volkswagen',
    model: 'Golf 1.6 TDI',
    year: 2008,
    bodyType: 'Hatchback',
    engine: '1.6L TDI',
    fuel: 'Diesel',
    transmission: 'Manual',
  },
  JTDKB20U403012345: {
    make: 'Toyota',
    model: 'Prius',
    year: 2015,
    bodyType: 'Liftback',
    engine: '1.8L Hybrid',
    fuel: 'Hybrid',
    transmission: 'Automatic',
  },
  SJNFAAJ10U1234567: {
    make: 'Nissan',
    model: 'Qashqai',
    year: 2017,
    bodyType: 'SUV',
    engine: '1.5L dCi',
    fuel: 'Diesel',
    transmission: 'Automatic',
  },
  KMHCT41BAEU123456: {
    make: 'Hyundai',
    model: 'i20',
    year: 2014,
    bodyType: 'Hatchback',
    engine: '1.4L MPI',
    fuel: 'Petrol',
    transmission: 'Automatic',
  },
  WBA8E9C50GK123456: {
    make: 'BMW',
    model: '320d',
    year: 2016,
    bodyType: 'Saloon',
    engine: '2.0L TwinPower Diesel',
    fuel: 'Diesel',
    transmission: 'Automatic',
  },
  VF1RFB00X56123456: {
    make: 'Renault',
    model: 'Clio',
    year: 2019,
    bodyType: 'Hatchback',
    engine: '1.0L TCe',
    fuel: 'Petrol',
    transmission: 'Manual',
  },
  JMZKF4W7600123456: {
    make: 'Mazda',
    model: 'CX-5',
    year: 2018,
    bodyType: 'SUV',
    engine: '2.2L Skyactiv-D',
    fuel: 'Diesel',
    transmission: 'Automatic',
  },
  WDD2050041R456789: {
    make: 'Mercedes-Benz',
    model: 'C200d AMG Line',
    year: 2019,
    bodyType: 'Saloon',
    engine: '1.6L Diesel',
    fuel: 'Diesel',
    transmission: 'Automatic',
  },
  WAUZZZ8V4KA098765: {
    make: 'Audi',
    model: 'A3 Sportback 35 TFSI',
    year: 2020,
    bodyType: 'Hatchback',
    engine: '1.5L TFSI',
    fuel: 'Petrol',
    transmission: 'Automatic',
  },
};

export function decodeVinDeterministic(rawVin: string): DecodedVinInfo | null {
  const check = validateIso3779Vin(rawVin);
  if (!check.valid) return null;
  const vin = check.normalized;
  if (KNOWN_VINS[vin]) {
    return { vin, ...KNOWN_VINS[vin], fromCache: true };
  }
  const wmi = vin.slice(0, 3);
  const wmiMap: Record<string, Omit<DecodedVinInfo, 'vin' | 'fromCache'>> = {
    WVW: { make: 'Volkswagen', model: 'Polo 1.0 TSI', year: 2020, bodyType: 'Hatchback', engine: '1.0L TSI', fuel: 'Petrol', transmission: 'Automatic' },
    WBA: { make: 'BMW', model: '118i M Sport', year: 2021, bodyType: 'Hatchback', engine: '1.5L TwinPower', fuel: 'Petrol', transmission: 'Automatic' },
    JTD: { make: 'Toyota', model: 'Corolla Hybrid', year: 2020, bodyType: 'Saloon', engine: '1.8L Hybrid', fuel: 'Hybrid', transmission: 'Automatic' },
    SJN: { make: 'Nissan', model: 'Juke Tekna', year: 2019, bodyType: 'Crossover', engine: '1.0L DIG-T', fuel: 'Petrol', transmission: 'Automatic' },
    WDD: { make: 'Mercedes-Benz', model: 'A180d Style', year: 2019, bodyType: 'Hatchback', engine: '1.5L Diesel', fuel: 'Diesel', transmission: 'Automatic' },
    WAU: { make: 'Audi', model: 'A4 35 TDI', year: 2020, bodyType: 'Saloon', engine: '2.0L TDI', fuel: 'Diesel', transmission: 'Automatic' },
  };
  const fallback = wmiMap[wmi] ?? {
    make: 'Honda',
    model: 'Civic 1.5 VTEC',
    year: 2019,
    bodyType: 'Saloon',
    engine: '1.5L Turbo',
    fuel: 'Petrol' as const,
    transmission: 'Automatic' as const,
  };
  return { vin, ...fallback, fromCache: false };
}

export function calculateDynamicValuation(params: {
  make: string;
  year: number;
  mileageKm: number;
  damages: DamageDetection[];
}): Omit<Valuation, 'id' | 'createdAt'> {
  const premiumMakes = new Set(['BMW', 'Mercedes-Benz', 'Audi', 'Mazda']);
  const baseByAge = Math.max(3800, 15500 - (2026 - params.year) * 780);
  const brandBonus = premiumMakes.has(params.make) ? 3400 : 1200;
  const baseMarket = Math.round((baseByAge + brandBonus) / 50) * 50;

  const expectedKm = Math.max(15000, (2026 - params.year) * 14000);
  const kmDelta = params.mileageKm - expectedKm;
  const mileageAdjustment = Math.round((-kmDelta * 0.015) / 50) * 50;

  const factors: ValuationFactor[] = [
    { label: `KKTC market baseline (${params.make} ${params.year})`, deltaGbp: baseMarket, category: 'BASE' },
  ];
  if (mileageAdjustment !== 0) {
    factors.push({
      label: `Mileage index (${params.mileageKm.toLocaleString('en-GB')} km)`,
      deltaGbp: mileageAdjustment,
      category: 'MILEAGE',
    });
  }

  let damageTotal = 0;
  for (const d of params.damages) {
    if (d.confirmedByInspector === false) continue;
    damageTotal -= d.estimatedDeductionGbp;
    factors.push({
      label: `${d.panel} ${d.type.toLowerCase().replace('_', ' ')} (${Math.round(d.confidence * 100)}%)`,
      deltaGbp: -d.estimatedDeductionGbp,
      category: 'DAMAGE',
    });
  }

  const rawSuggested = Math.max(2500, baseMarket + mileageAdjustment + damageTotal);
  const suggestedPrice = Math.round(rawSuggested / 50) * 50;
  const spread = Math.max(250, Math.round((suggestedPrice * 0.045) / 50) * 50);

  return {
    suggestedPrice,
    minPrice: suggestedPrice - spread,
    maxPrice: suggestedPrice + spread,
    modelVersion: 'valuation-v1.3',
    factors,
  };
}

