'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Check,
  CheckCircle2,
  CloudOff,
  Plus,
  ScanLine,
  ShieldCheck,
  Signal,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  DamageDetection,
  MANDATORY_ANGLES,
  PhotoAngle,
  calculateDynamicValuation,
  decodeVinDeterministic,
  validateIso3779Vin,
} from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/i18n';
import { VehicleStage } from '@/components/vehicles/VehicleStage';

type NetMode = '5G' | 'WEAK_3G' | 'OFFLINE';

const INITIAL_AI_DAMAGES: DamageDetection[] = [
  {
    id: 'mob-dmg-1',
    angle: 'right',
    panel: 'Front door, right side',
    type: 'DENT',
    confidence: 0.91,
    bbox: { x: 54, y: 46, width: 18, height: 17 },
    source: 'AI',
    confirmedByInspector: true,
    estimatedDeductionGbp: 280,
  },
  {
    id: 'mob-dmg-2',
    angle: 'rear',
    panel: 'Rear bumper',
    type: 'SCRATCH',
    confidence: 0.84,
    bbox: { x: 15, y: 52, width: 15, height: 13 },
    source: 'AI',
    confirmedByInspector: true,
    estimatedDeductionGbp: 170,
  },
];

export const InspectorMobileStudioPage: React.FC = () => {
  const { token, currency, exchangeRate, setRoute, bumpDataVersion, pushToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [netMode, setNetMode] = useState<NetMode>('5G');
  const [vin, setVin] = useState('WAUZZZ8V4KA098765');
  const [mileage, setMileage] = useState('54200');
  const [notes, setNotes] = useState('Clean interior. Left rear door repainted previously.');
  const [capturedAngles, setCapturedAngles] = useState<PhotoAngle[]>([
    'front',
    'rear',
    'left',
    'right',
    'front-left',
    'front-right',
  ]);
  const [uploadedMb, setUploadedMb] = useState<number>(14.2);
  const totalMb = 19.8;
  const [analyzing, setAnalyzing] = useState(false);
  const [plateBlur, setPlateBlur] = useState(true);
  const [damages, setDamages] = useState<DamageDetection[]>(INITIAL_AI_DAMAGES);
  const [finalizing, setFinalizing] = useState(false);

  const vinCheck = useMemo(() => validateIso3779Vin(vin), [vin]);
  const decoded = useMemo(() => decodeVinDeterministic(vin), [vin]);

  const liveValuation = useMemo(() => {
    return calculateDynamicValuation({
      make: decoded?.make ?? 'Audi',
      year: decoded?.year ?? 2020,
      mileageKm: Number(mileage) || 54200,
      damages,
    });
  }, [decoded, mileage, damages]);

  // Simulate resumable chunked upload (REQ-3.2, REQ-3.3)
  useEffect(() => {
    if (step !== 2) return;
    if (netMode === 'OFFLINE') return;
    const targetMb = Number(((capturedAngles.length / 8) * totalMb).toFixed(1));
    if (uploadedMb >= targetMb) return;

    const stepSize = netMode === '5G' ? 1.4 : 0.4;
    const timer = window.setInterval(() => {
      setUploadedMb((prev) => {
        const next = Number(Math.min(targetMb, prev + stepSize).toFixed(1));
        return next;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [step, netMode, capturedAngles.length, uploadedMb]);

  const toggleAngle = (angle: PhotoAngle) => {
    setCapturedAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle]
    );
  };

  const captureAllRemaining = () => {
    setCapturedAngles(MANDATORY_ANGLES.map((a) => a.id));
  };

  const handleSubmitForAi = () => {
    if (capturedAngles.length < 8) {
      pushToast('8 Mandatory Angles Required (REQ-3.1)', 'Capture the remaining corners first.', 'warning');
      return;
    }
    if (netMode === 'OFFLINE') {
      pushToast('Queued Locally (Offline Mode)', 'Switch back to 5G to resume chunk upload.', 'warning');
      return;
    }
    setAnalyzing(true);
    setStep(3);
    setTimeout(() => {
      setAnalyzing(false);
    }, 1500);
  };

  const toggleDamageConfirmation = (id: string, confirm: boolean) => {
    setDamages((prev) =>
      prev.map((d) => (d.id === id ? { ...d, confirmedByInspector: confirm } : d))
    );
  };

  const addManualDamage = () => {
    const newItem: DamageDetection = {
      id: `man-${Date.now()}`,
      angle: 'front-left',
      panel: 'Front-left alloy / fender',
      type: 'SCRATCH',
      confidence: 1.0,
      bbox: { x: 68, y: 54, width: 12, height: 11 },
      source: 'MANUAL',
      confirmedByInspector: true,
      estimatedDeductionGbp: 180,
    };
    setDamages((prev) => [...prev, newItem]);
  };

  const handleFinalize = async () => {
    if (!token || !decoded) return;
    setFinalizing(true);
    try {
      const regRes = await apiFetch<{ vehicle: { id: string } }>('/api/vehicles', {
        method: 'POST',
        token,
        body: {
          vin: decoded.vin,
          make: decoded.make,
          model: decoded.model,
          year: decoded.year,
          bodyType: decoded.bodyType,
          engine: decoded.engine,
          fuel: decoded.fuel,
          transmission: decoded.transmission,
          mileageKm: Number(mileage) || 54200,
          notes,
        },
      });
      await apiFetch('/api/inspections/complete', {
        method: 'POST',
        token,
        body: {
          vehicleId: regRes.vehicle.id,
          notes,
          plateBlurEnabled: plateBlur,
          inferenceTimeSec: 3.1,
          checklist: { tyres: 'OK', lights: 'OK', interior: 'OK', engineBay: 'OK' },
          damages,
        },
      });
      bumpDataVersion();
      pushToast(
        'Inspection Finalized & Synced',
        `${decoded.year} ${decoded.make} ${decoded.model} added to Inventory with AI Valuation ${formatMoney(liveValuation.suggestedPrice, currency, exchangeRate)}`,
        'success'
      );
      setRoute('inventory');
    } catch (err) {
      pushToast('Finalization failed', (err as Error).message, 'danger');
    } finally {
      setFinalizing(false);
    }
  };

  const progressPct = Math.min(100, Math.round((uploadedMb / totalMb) * 100));

  return (
    <div className="space-y-6">
      {/* Header + Network Simulator Toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--ink-primary)] sm:text-3xl">
            Field Inspector Mobile Studio (UC2–UC7)
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Interactive 3-step React Native field workflow with ISO 3779 VIN scan, offline resumable chunk upload, and YOLOv8 review.
          </p>
        </div>

        {/* Network Condition Simulator */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 text-xs font-semibold">
          {(
            [
              { id: '5G', label: '5G Online', icon: Wifi },
              { id: 'WEAK_3G', label: 'Weak 3G', icon: Signal },
              { id: 'OFFLINE', label: 'Offline Yard', icon: WifiOff },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = netMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNetMode(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                  active
                    ? item.id === 'OFFLINE'
                      ? 'bg-red-600 text-white'
                      : item.id === 'WEAK_3G'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Interactive Phone Frame + Live Pipeline Telemetry */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Realistic Mobile Device Frame (Upgraded m1 & m2) */}
        <div className="flex justify-center lg:col-span-5">
          <div className="w-full max-w-[390px] overflow-hidden rounded-[40px] border-[10px] border-[#0f172a] bg-[#f8fafc] text-slate-900 shadow-[var(--shadow-lg)]">
            {/* Phone Status Bar */}
            <div className="flex items-center justify-between bg-[#142542] px-6 py-2.5 text-[11px] font-semibold text-white">
              <span className="font-mono-num">09:41</span>
              <span className="flex items-center gap-1.5 font-mono-num">
                {netMode === 'OFFLINE' ? (
                  <span className="text-red-300">OFFLINE</span>
                ) : netMode === 'WEAK_3G' ? (
                  <span className="text-amber-300">3G · 1 bar</span>
                ) : (
                  <span className="text-emerald-300">5G · 82%</span>
                )}
              </span>
            </div>

            {/* Mobile App Bar */}
            <div className="bg-[#142542] px-5 pb-4 pt-1 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-bold">
                    {step === 1
                      ? 'New Inspection'
                      : step === 2
                      ? 'Capture 8 Angles'
                      : 'AI Damage Report'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Step {step} of 3 · {decoded ? `${decoded.make} ${decoded.model} ${decoded.year}` : 'VIN Scan'}
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStep(s as 1 | 2 | 3)}
                      className={`h-2 w-6 rounded-full transition-colors ${
                        step === s ? 'bg-[#f28c28]' : 'bg-white/25'
                      }`}
                      aria-label={`Step ${s}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Screen Content */}
            <div className="min-h-[540px] space-y-3.5 p-4">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      VIN (17 characters · ISO 3779)
                    </label>
                    <div className="mt-1 flex gap-1.5">
                      <input
                        type="text"
                        maxLength={17}
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono-num text-xs font-bold uppercase text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setVin('WAUZZZ8V4KA098765')}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-3 text-xs font-bold text-[#ea6a12]"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                        Scan
                      </button>
                    </div>
                    {!vinCheck.valid && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">{vinCheck.error}</p>
                    )}
                  </div>

                  {/* Quick sample VIN chips */}
                  <div className="flex flex-wrap gap-1">
                    {['WAUZZZ8V4KA098765', 'WVWZZZ1KZ8W123456', 'WDD2050041R456789'].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setVin(sample)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono-num text-[10px] text-slate-600 hover:border-[#ea6a12]"
                      >
                        {sample.slice(0, 6)}…{sample.slice(-4)}
                      </button>
                    ))}
                  </div>

                  {decoded && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-display text-xs font-bold text-slate-900">
                          Decoded Vehicle
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono-num text-[10px] font-bold text-emerald-700">
                          VIN valid
                        </span>
                      </div>
                      <div className="divide-y divide-dashed divide-slate-200 text-xs">
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Make</span>
                          <strong>{decoded.make}</strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Model</span>
                          <strong>{decoded.model}</strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Year</span>
                          <strong className="font-mono-num">{decoded.year}</strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Engine</span>
                          <strong>{decoded.engine}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Mileage (km)</label>
                    <input
                      type="number"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono-num text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Inspector Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!decoded}
                    onClick={() => setStep(2)}
                    className="w-full rounded-xl bg-[#ea6a12] py-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-45"
                  >
                    Continue to 8-Angle Photos →
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {MANDATORY_ANGLES.map((ang) => {
                      const done = capturedAngles.includes(ang.id);
                      return (
                        <button
                          key={ang.id}
                          type="button"
                          onClick={() => toggleAngle(ang.id)}
                          className={`flex h-16 flex-col items-center justify-center rounded-xl border-2 text-xs font-semibold transition-all active:scale-[0.97] ${
                            done
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-dashed border-slate-300 bg-white text-slate-600 hover:border-[#ea6a12]'
                          }`}
                        >
                          {done ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              {ang.labelEn}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Camera className="h-3.5 w-3.5" />+ {ang.labelEn}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumable Chunk Progress Card (REQ-3.2, REQ-3.3) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Uploading {capturedAngles.length} / 8</span>
                      <span className="font-mono-num text-slate-500">
                        {uploadedMb.toFixed(1)} / {totalMb} MB
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full transition-all duration-300 ${
                          netMode === 'OFFLINE' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                      />
                    </div>
                    {netMode !== '5G' && (
                      <div className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-amber-800">
                        <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {netMode === 'OFFLINE'
                          ? 'Offline — 5 MB chunks queued locally and will auto-resume when signal returns.'
                          : 'Weak 3G — multipart resumable chunks throttled safely.'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {capturedAngles.length < 8 && (
                      <button
                        type="button"
                        onClick={captureAllRemaining}
                        className="w-full rounded-xl border border-[#142542] bg-white py-2.5 text-xs font-bold text-[#142542]"
                      >
                        Capture Remaining {8 - capturedAngles.length} Angles (1920×1080)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmitForAi}
                      className="w-full rounded-xl bg-[#ea6a12] py-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
                    >
                      Submit for YOLOv8 AI Analysis →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <VehicleStage
                    make={decoded?.make ?? 'Audi'}
                    model={decoded?.model ?? 'A3 Sportback'}
                    year={decoded?.year ?? 2020}
                    bodyType={decoded?.bodyType ?? 'Hatchback'}
                    damages={damages}
                    scanning={analyzing}
                    plateBlur={plateBlur}
                    compact
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-slate-900">
                        Detected Damage ({damages.filter((d) => d.confirmedByInspector !== false).length})
                      </span>
                      <span className="font-mono-num text-[10px] font-semibold text-emerald-700">
                        {analyzing ? 'Scanning GPU…' : 'Analysed in 3.1 s'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {damages.map((d) => {
                        const rejected = d.confirmedByInspector === false;
                        return (
                          <div
                            key={d.id}
                            className={`flex items-center justify-between rounded-xl border px-2.5 py-2 text-xs ${
                              rejected
                                ? 'border-slate-200 bg-slate-50 opacity-50 line-through'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <span
                                className={`mr-1.5 rounded px-1.5 py-0.5 font-mono-num text-[10px] font-bold ${
                                  d.type === 'DENT'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {d.type}
                              </span>
                              <span className="font-medium text-slate-800">{d.panel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono-num text-[11px] font-bold text-slate-600">
                                {Math.round(d.confidence * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDamageConfirmation(d.id, !rejected ? false : true)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                                title={rejected ? 'Restore detection' : 'Mark false positive'}
                              >
                                {rejected ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={addManualDamage}
                        className="inline-flex items-center gap-1 font-semibold text-[#142542] hover:text-[#ea6a12]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add manual damage
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlateBlur((p) => !p)}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Plate Blur: {plateBlur ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Live Recalculated Price Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Suggested Price (Updates Live)
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="font-mono-num text-2xl font-extrabold text-slate-900">
                        {formatMoney(liveValuation.suggestedPrice, currency, exchangeRate)}
                      </span>
                      <span className="font-mono-num text-[11px] text-slate-500">
                        range {formatMoney(liveValuation.minPrice, currency, exchangeRate)} –{' '}
                        {formatMoney(liveValuation.maxPrice, currency, exchangeRate)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={finalizing || analyzing}
                    onClick={handleFinalize}
                    className="w-full rounded-xl bg-[#ea6a12] py-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {finalizing ? 'Finalizing & Syncing…' : 'Confirm & Finalize Report ✓'}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Bottom Mobile Tab Bar */}
            <div className="grid grid-cols-4 border-t border-slate-200 bg-white py-2.5 text-center text-[10px] font-semibold text-slate-400">
              <span>Home</span>
              <span>Vehicles</span>
              <span className="text-[#ea6a12]">● Inspect</span>
              <span>Profile</span>
            </div>
          </div>
        </div>

        {/* Right Side: Real-Time Engineering Pipeline Telemetry */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              Live Mobile-to-Cloud Pipeline Telemetry
            </h2>
            <p className="mt-1 text-xs text-[var(--ink-secondary)]">
              Demonstrates SRS requirements REQ-2.1 (ISO 3779), REQ-3.2/3.3 (5 MB chunked offline resume), REQ-4.3 (≤4 s YOLO inference), and NFR-S1 (Human-in-the-loop confirmation).
            </p>

            <div className="mt-4 space-y-3 text-xs">
              {[
                {
                  title: '1. VIN Decoder Adapter (ISO 3779)',
                  status: decoded ? 'VALIDATED & DECODED' : 'AWAITING VALID VIN',
                  ok: Boolean(decoded),
                  detail: decoded
                    ? `${decoded.vin} → ${decoded.year} ${decoded.make} ${decoded.model} (${decoded.fromCache ? 'vin_cache hit' : 'NHTSA vPIC'})`
                    : 'Enter a 17-character VIN without I, O, or Q.',
                },
                {
                  title: '2. Multipart S3/R2 Chunk Queue (5 MB chunks)',
                  status:
                    netMode === 'OFFLINE'
                      ? 'PAUSED · LOCAL QUEUE'
                      : `${capturedAngles.length}/8 ANGLES · ${progressPct}%`,
                  ok: capturedAngles.length === 8 && netMode !== 'OFFLINE',
                  detail:
                    netMode === 'OFFLINE'
                      ? 'Network dropped! Toggle back to 5G Online to watch upload auto-resume from last confirmed byte.'
                      : 'Pre-signed URLs expire in 15 min (NFR-SEC6).',
                },
                {
                  title: '3. YOLOv8 GPU Inference & Privacy Blur',
                  status: step === 3 ? (analyzing ? 'RUNNING ON RTX 4060' : 'COMPLETED IN 3.1 s') : 'IDLE',
                  ok: step === 3 && !analyzing,
                  detail: `Plate/face blur ${plateBlur ? 'enabled' : 'disabled'} (REQ-4.7 · TRNC Law 89/2007). Human inspector confirmation required before auction (NFR-S1).`,
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--ink-primary)]">{row.title}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono-num text-[10px] font-bold ${
                        row.ok
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {row.ok && <CheckCircle2 className="h-3 w-3" />}
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--ink-secondary)]">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Explainable Valuation Preview */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[var(--ink-primary)]">
                Real-Time Valuation Breakdown ({liveValuation.modelVersion})
              </h3>
              <span className="font-mono-num text-lg font-extrabold text-[var(--brand)]">
                {formatMoney(liveValuation.suggestedPrice, currency, exchangeRate)}
              </span>
            </div>
            <div className="mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-3 text-xs">
              {liveValuation.factors.map((f, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[var(--ink-secondary)]">{f.label}</span>
                  <span
                    className={`font-mono-num font-bold ${
                      f.category === 'BASE'
                        ? 'text-[var(--ink-primary)]'
                        : f.deltaGbp >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {f.category === 'BASE'
                      ? formatMoney(f.deltaGbp, currency, exchangeRate)
                      : `${f.deltaGbp > 0 ? '+' : '−'}${formatMoney(Math.abs(f.deltaGbp), currency, exchangeRate)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

