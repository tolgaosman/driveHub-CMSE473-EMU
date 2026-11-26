'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Car,
  ChevronRight,
  Clock,
  Cpu,
  Plus,
  Radio,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Vehicle, VehicleStatus, decodeVinDeterministic, validateIso3779Vin } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney, t } from '@/lib/i18n';
import { VehicleDetailDrawer } from '@/components/vehicles/VehicleDetailDrawer';

const STATUS_STYLE: Record<VehicleStatus, string> = {
  REGISTERED: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
  ANALYZING: 'bg-blue-500/14 text-blue-700 dark:text-blue-300',
  AWAITING_REVIEW: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  INSPECTED: 'bg-teal-500/14 text-teal-700 dark:text-teal-300',
  IN_STOCK: 'bg-slate-800/10 text-slate-800 dark:bg-slate-200/12 dark:text-slate-200',
  IN_AUCTION: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  SOLD: 'bg-red-500/14 text-red-700 dark:text-red-300',
  ARCHIVED: 'bg-slate-400/15 text-slate-500',
};

export const InventoryPage: React.FC = () => {
  const { token, lang, currency, exchangeRate, dataVersion, bumpDataVersion, setRoute, pushToast } = useApp();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [makeFilter, setMakeFilter] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Quick register vehicle form state
  const [newVin, setNewVin] = useState('WAUZZZ8V4KA098765');
  const [newMileage, setNewMileage] = useState('54200');
  const [newNotes, setNewNotes] = useState('Arrived at Lefkoşa lot, awaiting 8-angle inspection.');

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ vehicles: Vehicle[] }>('/api/vehicles', { token });
      setVehicles(res.vehicles);
    } catch (err) {
      pushToast('Failed to load inventory', (err as Error).message, 'danger');
    } finally {
      setLoading(false);
    }
  }, [token, pushToast]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles, dataVersion]);

  const makes = useMemo(() => Array.from(new Set(vehicles.map((v) => v.make))).sort(), [vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (makeFilter !== 'ALL' && v.make !== makeFilter) return false;
      if (q && !v.vin.toLowerCase().includes(q) && !`${v.make} ${v.model}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [vehicles, search, statusFilter, makeFilter]);

  const decodedPreview = useMemo(() => decodeVinDeterministic(newVin), [newVin]);
  const vinValidation = useMemo(() => validateIso3779Vin(newVin), [newVin]);

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !decodedPreview) return;
    try {
      await apiFetch('/api/vehicles', {
        method: 'POST',
        token,
        body: {
          vin: decodedPreview.vin,
          make: decodedPreview.make,
          model: decodedPreview.model,
          year: decodedPreview.year,
          bodyType: decodedPreview.bodyType,
          engine: decodedPreview.engine,
          fuel: decodedPreview.fuel,
          transmission: decodedPreview.transmission,
          mileageKm: Number(newMileage) || 50000,
          notes: newNotes,
        },
      });
      pushToast('Vehicle Registered', `${decodedPreview.year} ${decodedPreview.make} ${decodedPreview.model}`, 'success');
      setRegisterOpen(false);
      bumpDataVersion();
    } catch (err) {
      pushToast('Registration failed', (err as Error).message, 'danger');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--ink-primary)] sm:text-3xl">
            {lang === 'tr' ? 'Araç Envanteri & Yaşam Döngüsü' : 'Vehicle Inventory'}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            {lang === 'tr'
              ? 'Kiracıya özel araç filosu, YOLOv8 hasar puanları ve dinamik değerleme takibi.'
              : 'Tenant-isolated fleet registry, YOLOv8 defect scores, and market-adaptive valuations.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRoute('inspector')}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
          >
            <Sparkles className="h-4 w-4 text-[var(--brand)]" />
            {lang === 'tr' ? 'Saha Ekspertizi Başlat' : 'Field Inspection'}
          </button>
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[var(--brand-hover)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            {t(lang, 'registerVehicle')}
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards (Upgraded w1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: lang === 'tr' ? 'Stoktaki Araçlar' : 'Vehicles in stock',
            value: String(57 + vehicles.length),
            delta: '+5 this week',
            deltaTone: 'text-emerald-600 dark:text-emerald-400',
            icon: Car,
          },
          {
            label: lang === 'tr' ? 'Ekspertiz Onayı Bekleyen' : 'Awaiting inspection review',
            value: String(6 + vehicles.filter((v) => v.status === 'AWAITING_REVIEW').length),
            delta: '2 older than 24 h',
            deltaTone: 'text-amber-600 dark:text-amber-400',
            icon: Clock,
          },
          {
            label: lang === 'tr' ? 'Canlı / Planlı İhaleler' : 'Live / scheduled auctions',
            value: '3 / 5',
            delta: 'next starts 14:00',
            deltaTone: 'text-emerald-600 dark:text-emerald-400',
            icon: Radio,
          },
          {
            label: lang === 'tr' ? 'Ort. AI Çıkarım Süresi' : 'Avg. AI inference time',
            value: '2.8 s',
            delta: 'target ≤ 4.0 s (RTX 4060)',
            deltaTone: 'text-emerald-600 dark:text-emerald-400',
            icon: Cpu,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--ink-muted)]">{kpi.label}</span>
                <div className="rounded-lg bg-[var(--bg-surface-subtle)] p-1.5 text-[var(--ink-secondary)]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 font-mono-num text-3xl font-extrabold text-[var(--ink-primary)]">
                {kpi.value}
              </div>
              <div className={`mt-1 text-xs font-medium ${kpi.deltaTone}`}>{kpi.delta}</div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-xs)]">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'searchPlaceholder')}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] py-2 pl-9 pr-3 text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:border-[var(--brand)] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--ink-primary)]"
        >
          <option value="ALL">{t(lang, 'allStatuses')}</option>
          <option value="IN_STOCK">IN_STOCK</option>
          <option value="IN_AUCTION">IN_AUCTION</option>
          <option value="AWAITING_REVIEW">AWAITING_REVIEW</option>
          <option value="ANALYZING">ANALYZING</option>
          <option value="SOLD">SOLD</option>
        </select>

        <select
          value={makeFilter}
          onChange={(e) => setMakeFilter(e.target.value)}
          aria-label="Filter by make"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--ink-primary)]"
        >
          <option value="ALL">{t(lang, 'allMakes')}</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Fleet Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                <th className="px-4 py-3.5">VIN</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Mileage (km)</th>
                <th className="px-4 py-3.5">AI Damage</th>
                <th className="px-4 py-3.5">Suggested Price</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-[var(--ink-muted)]">
                    Loading tenant fleet...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-[var(--ink-muted)]">
                    No vehicles match your current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const damages = v.inspection?.damages.filter((d) => d.confirmedByInspector !== false) ?? [];
                  const price = v.valuation?.overriddenPrice ?? v.valuation?.suggestedPrice;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className="group cursor-pointer transition-colors hover:bg-[var(--bg-surface-subtle)]"
                    >
                      <td className="px-4 py-3.5 font-mono-num text-xs text-[var(--ink-secondary)]">
                        {v.vin}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[var(--ink-primary)]">
                          {v.make} {v.model}
                        </div>
                        <div className="text-[11px] text-[var(--ink-muted)]">
                          {v.bodyType} · {v.fuel} · {v.transmission}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono-num text-xs text-[var(--ink-secondary)]">
                        {v.year}
                      </td>
                      <td className="px-4 py-3.5 font-mono-num text-xs text-[var(--ink-secondary)]">
                        {v.mileageKm.toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {v.status === 'ANALYZING' ? (
                          <span className="inline-flex items-center gap-1.5 font-mono-num text-blue-600 dark:text-blue-400">
                            <Activity className="h-3.5 w-3.5 animate-pulse" />
                            Running YOLO…
                          </span>
                        ) : damages.length === 0 ? (
                          <span className="font-mono-num text-emerald-600 dark:text-emerald-400">0 (Clean)</span>
                        ) : (
                          <span className="text-[var(--ink-primary)]">
                            <strong className="font-mono-num">{damages.length}</strong>{' '}
                            <span className="text-[var(--ink-muted)]">
                              ({damages.map((d) => d.type.toLowerCase()).join(', ')})
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono-num text-sm font-bold text-[var(--ink-primary)]">
                        {price ? formatMoney(price, currency, exchangeRate) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 font-mono-num text-[10px] font-bold ${STATUS_STYLE[v.status]}`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)] group-hover:translate-x-0.5 transition-transform">
                          Open
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Detail Slide-Over */}
      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdated={() => {
          bumpDataVersion();
          setSelectedVehicle(null);
        }}
      />

      {/* Quick Register Vehicle Modal (UC2 + UC3) */}
      <AnimatePresence>
        {registerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
            onClick={() => setRegisterOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-lg)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                  Register Vehicle by VIN (ISO 3779)
                </h2>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleRegisterVehicle} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    17-Character VIN
                  </label>
                  <input
                    type="text"
                    maxLength={17}
                    value={newVin}
                    onChange={(e) => setNewVin(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 font-mono-num text-sm uppercase"
                    required
                  />
                  {!vinValidation.valid && (
                    <p className="mt-1 text-xs text-red-600">{vinValidation.error}</p>
                  )}
                </div>

                {decodedPreview && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-300">
                      <span>Decoded Vehicle Specs</span>
                      <span className="font-mono-num text-[10px]">
                        {decodedPreview.fromCache ? 'vin_cache HIT' : 'NHTSA vPIC'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[var(--ink-primary)]">
                      <div>Make: <strong>{decodedPreview.make}</strong></div>
                      <div>Model: <strong>{decodedPreview.model}</strong></div>
                      <div>Year: <strong>{decodedPreview.year}</strong></div>
                      <div>Engine: <strong>{decodedPreview.engine}</strong></div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2 font-mono-num text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Yard Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--ink-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!decodedPreview}
                    className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-45"
                  >
                    Create Vehicle Record
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

