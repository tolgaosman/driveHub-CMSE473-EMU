'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Plus, ScanLine, Search, X } from 'lucide-react';
import { Vehicle, VehicleStatus, decodeVinDeterministic, validateIso3779Vin } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney, t } from '@/lib/i18n';
import { VEHICLE_STATUS } from '@/lib/status';
import { VehicleDetailDrawer } from '@/components/vehicles/VehicleDetailDrawer';
import { Select } from '@/components/ui/Select';
import { Badge, Button, Field, PageHeader, buttonClass, inputClass } from '@/components/ui/primitives';

const FILTER_STATUSES: VehicleStatus[] = ['IN_STOCK', 'IN_AUCTION', 'AWAITING_REVIEW', 'ANALYZING', 'SOLD'];

export const InventoryPage: React.FC = () => {
  const { token, lang, currency, exchangeRate, dataVersion, bumpDataVersion, setRoute, pushToast } = useApp();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [makeFilter, setMakeFilter] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const tr = lang === 'tr';

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
      pushToast('Vehicle registered', `${decodedPreview.year} ${decodedPreview.make} ${decodedPreview.model}`, 'success');
      setRegisterOpen(false);
      bumpDataVersion();
    } catch (err) {
      pushToast('Registration failed', (err as Error).message, 'danger');
    }
  };

  const kpis = [
    {
      label: tr ? 'Stoktaki araçlar' : 'Vehicles in stock',
      value: String(57 + vehicles.length),
      note: tr ? 'bu hafta +5' : '+5 this week',
      tone: 'text-[var(--success)]',
    },
    {
      label: tr ? 'Ekspertiz onayı bekleyen' : 'Awaiting inspection review',
      value: String(6 + vehicles.filter((v) => v.status === 'AWAITING_REVIEW').length),
      note: tr ? '2 tanesi 24 saatten eski' : '2 older than 24 h',
      tone: 'text-[var(--warning)]',
    },
    {
      label: tr ? 'Canlı / planlı ihale' : 'Live / scheduled auctions',
      value: '3 / 5',
      note: tr ? 'sıradaki 14:00' : 'next starts 14:00',
      tone: 'text-[var(--ink-muted)]',
    },
    {
      label: tr ? 'Ort. hasar tespiti' : 'Avg. damage detection',
      value: '2.8 s',
      note: tr ? 'hedef ≤ 4.0 s' : 'target ≤ 4.0 s',
      tone: 'text-[var(--ink-muted)]',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr ? 'Araç envanteri' : 'Inventory'}
        description={
          tr
            ? 'Galerinizdeki araçlar, hasar bulguları ve önerilen fiyatlar.'
            : 'Every car in your gallery with its damage findings and suggested price.'
        }
        actions={
          <>
            <Button onClick={() => setRoute('inspector')}>
              <ScanLine className="h-4 w-4 text-[var(--ink-muted)]" />
              {tr ? 'Ekspertiz başlat' : 'Start inspection'}
            </Button>
            <Button variant="primary" onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(lang, 'registerVehicle')}
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`px-5 py-4 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t xl:border-t-0' : ''} ${
              i === 2 ? 'xl:border-l' : ''
            } border-[var(--border-subtle)]`}
          >
            <dt className="text-xs text-[var(--ink-secondary)]">{kpi.label}</dt>
            <dd className="mt-1.5 font-mono-num text-[26px] font-medium leading-none tracking-tight">{kpi.value}</dd>
            <div className={`mt-2 text-xs ${kpi.tone}`}>{kpi.note}</div>
          </div>
        ))}
      </dl>

      {/* Table with filter toolbar */}
      <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'searchPlaceholder')}
              aria-label={t(lang, 'searchPlaceholder')}
              className={`${inputClass} pl-9`}
            />
          </div>
          <Select<string>
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter by status"
            align="end"
            className="w-44"
            options={[
              { value: 'ALL', label: t(lang, 'allStatuses') },
              ...FILTER_STATUSES.map((s) => ({ value: s, label: VEHICLE_STATUS[s][lang] })),
            ]}
          />
          <Select<string>
            value={makeFilter}
            onChange={setMakeFilter}
            ariaLabel="Filter by make"
            align="end"
            className="w-40"
            options={[
              { value: 'ALL', label: t(lang, 'allMakes') },
              ...makes.map((m) => ({ value: m, label: m })),
            ]}
          />
          <span className="ml-auto hidden font-mono-num text-xs text-[var(--ink-muted)] sm:inline">
            {filtered.length} / {vehicles.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-4 py-2.5 font-medium">{tr ? 'Araç' : 'Vehicle'}</th>
                <th className="px-4 py-2.5 font-medium">VIN</th>
                <th className="px-4 py-2.5 text-right font-medium">{tr ? 'Yıl' : 'Year'}</th>
                <th className="px-4 py-2.5 text-right font-medium">Km</th>
                <th className="px-4 py-2.5 font-medium">{tr ? 'Hasar' : 'Damage'}</th>
                <th className="px-4 py-2.5 text-right font-medium">{tr ? 'Önerilen fiyat' : 'Suggested price'}</th>
                <th className="px-4 py-2.5 font-medium">{tr ? 'Durum' : 'Status'}</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                    {tr ? 'Araçlar yükleniyor…' : 'Loading vehicles…'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[var(--ink-muted)]">
                    {tr ? 'Filtrelere uyan araç yok.' : 'No vehicles match these filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const damages = v.inspection?.damages.filter((d) => d.confirmedByInspector !== false) ?? [];
                  const price = v.valuation?.overriddenPrice ?? v.valuation?.suggestedPrice;
                  const st = VEHICLE_STATUS[v.status];
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className="group cursor-pointer transition-colors duration-100 hover:bg-[var(--bg-hover)]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--ink-primary)]">
                          {v.make} {v.model}
                        </div>
                        <div className="text-xs text-[var(--ink-muted)]">
                          {v.bodyType} · {v.fuel} · {v.transmission}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono-num text-xs text-[var(--ink-secondary)]">{v.vin}</td>
                      <td className="px-4 py-3 text-right font-mono-num text-xs text-[var(--ink-secondary)]">{v.year}</td>
                      <td className="px-4 py-3 text-right font-mono-num text-xs text-[var(--ink-secondary)]">
                        {v.mileageKm.toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {v.status === 'ANALYZING' ? (
                          <span className="inline-flex items-center gap-1.5 text-[var(--info)]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {tr ? 'Analiz' : 'Running'}
                          </span>
                        ) : damages.length === 0 ? (
                          <span className="text-[var(--ink-muted)]">{tr ? 'Temiz' : 'Clean'}</span>
                        ) : (
                          <span className="text-[var(--ink-primary)]">
                            <span className="font-mono-num font-medium">{damages.length}</span>{' '}
                            <span className="text-[var(--ink-muted)]">
                              {damages.map((d) => d.type.toLowerCase()).join(', ')}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-medium text-[var(--ink-primary)]">
                        {price ? formatMoney(price, currency, exchangeRate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st[lang]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="h-4 w-4 text-[var(--ink-muted)] transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--ink-primary)]" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdated={() => {
          bumpDataVersion();
          setSelectedVehicle(null);
        }}
      />

      {/* Register vehicle modal */}
      <AnimatePresence>
        {registerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
            onClick={() => setRegisterOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-pop)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
                <h2 id="register-title" className="text-[15px] font-semibold">
                  {tr ? 'VIN ile araç kaydet' : 'Register vehicle by VIN'}
                </h2>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="rounded-[var(--r-sm)] p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-hover)]"
                  aria-label={t(lang, 'close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterVehicle} className="space-y-4 p-5">
                <Field
                  label={tr ? '17 karakterlik VIN' : '17-character VIN'}
                  htmlFor="reg-vin"
                  hint={!vinValidation.valid ? <span className="text-[var(--danger)]">{vinValidation.error}</span> : 'ISO 3779'}
                >
                  <input
                    id="reg-vin"
                    type="text"
                    maxLength={17}
                    value={newVin}
                    onChange={(e) => setNewVin(e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono-num uppercase tracking-wide`}
                    required
                  />
                </Field>

                {decodedPreview && (
                  <div className="rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
                      <span className="font-medium text-[var(--success)]">{tr ? 'VIN çözüldü' : 'VIN decoded'}</span>
                      <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">
                        {decodedPreview.fromCache ? 'vin_cache hit' : 'NHTSA vPIC'}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2.5">
                      {[
                        [tr ? 'Marka' : 'Make', decodedPreview.make],
                        ['Model', decodedPreview.model],
                        [tr ? 'Yıl' : 'Year', decodedPreview.year],
                        [tr ? 'Motor' : 'Engine', decodedPreview.engine],
                      ].map(([k, val]) => (
                        <div key={String(k)} className="flex justify-between gap-2">
                          <dt className="text-[var(--ink-muted)]">{k}</dt>
                          <dd className="font-medium text-[var(--ink-primary)]">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <Field label={tr ? 'Kilometre' : 'Mileage (km)'} htmlFor="reg-km">
                  <input
                    id="reg-km"
                    type="number"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className={`${inputClass} font-mono-num`}
                    required
                  />
                </Field>

                <Field label={tr ? 'Notlar' : 'Yard notes'} htmlFor="reg-notes">
                  <textarea
                    id="reg-notes"
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className={`${inputClass} h-auto py-2`}
                  />
                </Field>

                <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                  <button type="button" onClick={() => setRegisterOpen(false)} className={buttonClass('ghost')}>
                    {tr ? 'Vazgeç' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={!decodedPreview} className={buttonClass('primary')}>
                    {tr ? 'Aracı kaydet' : 'Create vehicle'}
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
