'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Vehicle } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/i18n';
import { VehicleStage } from '@/components/vehicles/VehicleStage';

interface VehicleDetailDrawerProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const VehicleDetailDrawer: React.FC<VehicleDetailDrawerProps> = ({
  vehicle,
  onClose,
  onUpdated,
}) => {
  const { token, user, currency, exchangeRate, setRoute, setScheduleVehicleId, pushToast } = useApp();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overridePrice, setOverridePrice] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const canOverride = user?.role === 'GALLERY_MANAGER' || user?.role === 'PLATFORM_ADMIN';

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !token) return;
    setSaving(true);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}/price-override`, {
        method: 'PUT',
        token,
        body: {
          overriddenPrice: Number(overridePrice),
          reason: overrideReason,
        },
      });
      pushToast('Valuation Overridden', `Logged to audit trail for ${vehicle.vin}`, 'success');
      setOverrideOpen(false);
      setOverrideReason('');
      onUpdated();
    } catch (err) {
      pushToast('Override Rejected', (err as Error).message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {vehicle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-6 py-4 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <span className="rounded-full bg-[var(--brand-subtle)] px-2.5 py-0.5 font-mono-num text-[10px] font-bold text-[var(--brand)]">
                    {vehicle.status}
                  </span>
                </div>
                <div className="mt-0.5 font-mono-num text-xs text-[var(--ink-muted)]">
                  VIN: {vehicle.vin} · {vehicle.mileageKm.toLocaleString('en-GB')} km · {vehicle.engine}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
                aria-label="Close vehicle details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 p-6">
              <VehicleStage
                make={vehicle.make}
                model={vehicle.model}
                year={vehicle.year}
                bodyType={vehicle.bodyType}
                accentColor={vehicle.imageAccent}
                damages={vehicle.inspection?.damages ?? []}
                plateBlur={vehicle.inspection?.plateBlurEnabled ?? true}
                modelVersion={vehicle.inspection?.modelVersion ?? 'yolov8s-drivehub-v1.4'}
              />

              {/* Valuation Waterfall (REQ-5.1, REQ-5.2, ETH-3) */}
              {vehicle.valuation ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                        Explainable Valuation ({vehicle.valuation.modelVersion})
                      </div>
                      <div className="mt-1 flex items-baseline gap-2.5">
                        <span className="font-mono-num text-2xl font-extrabold text-[var(--ink-primary)]">
                          {formatMoney(
                            vehicle.valuation.overriddenPrice ?? vehicle.valuation.suggestedPrice,
                            currency,
                            exchangeRate
                          )}
                        </span>
                        <span className="font-mono-num text-xs text-[var(--ink-muted)]">
                          Range: {formatMoney(vehicle.valuation.minPrice, currency, exchangeRate)} –{' '}
                          {formatMoney(vehicle.valuation.maxPrice, currency, exchangeRate)}
                        </span>
                      </div>
                    </div>

                    {canOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          setOverridePrice(
                            String(vehicle.valuation?.overriddenPrice ?? vehicle.valuation?.suggestedPrice ?? '')
                          );
                          setOverrideOpen((o) => !o);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Override Price
                      </button>
                    )}
                  </div>

                  {vehicle.valuation.overriddenPrice && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-semibold">Manager Override Active:</span> AI suggested{' '}
                        {formatMoney(vehicle.valuation.suggestedPrice, currency, exchangeRate)} →{' '}
                        {formatMoney(vehicle.valuation.overriddenPrice, currency, exchangeRate)} by{' '}
                        {vehicle.valuation.overriddenBy}. Reason: “{vehicle.valuation.overrideReason}”
                      </div>
                    </div>
                  )}

                  {overrideOpen && (
                    <form
                      onSubmit={handleOverrideSubmit}
                      className="mt-3 space-y-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5"
                    >
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--ink-muted)]">
                            New Price (£ GBP)
                          </label>
                          <input
                            type="number"
                            min={500}
                            step={50}
                            required
                            value={overridePrice}
                            onChange={(e) => setOverridePrice(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 font-mono-num text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--ink-muted)]">
                            Mandatory Audit Reason (REQ-5.3)
                          </label>
                          <input
                            type="text"
                            required
                            minLength={5}
                            placeholder="e.g., Fresh full service & new tyres"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOverrideOpen(false)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-[var(--brand)] px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          {saving ? 'Saving...' : 'Save Override'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Factor Waterfall */}
                  <div className="mt-4 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
                    {vehicle.valuation.factors.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--ink-secondary)]">{f.label}</span>
                        <span
                          className={`font-mono-num font-semibold ${
                            f.category === 'BASE'
                              ? 'text-[var(--ink-primary)]'
                              : f.deltaGbp >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
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
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-4 text-xs text-[var(--ink-muted)]">
                  AI inspection is still running on GPU node — valuation will populate automatically upon completion.
                </div>
              )}

              {/* AI vs Human Inspection Summary */}
              {vehicle.inspection && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Inspection Findings ({vehicle.inspection.damages.length})
                    </div>
                    <span className="font-mono-num text-[11px] text-emerald-600 dark:text-emerald-400">
                      Analysed in {vehicle.inspection.inferenceTimeSec} s · Inspector: {vehicle.inspection.inspectorName}
                    </span>
                  </div>
                  {vehicle.inspection.damages.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Zero exterior panel damages detected across all 8 angles.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {vehicle.inspection.damages.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono-num text-[10px] font-bold ${
                                d.type === 'DENT'
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {d.type}
                            </span>
                            <span className="font-medium text-[var(--ink-primary)]">{d.panel}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono-num">
                            <span className="text-[var(--ink-muted)]">{Math.round(d.confidence * 100)}%</span>
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Confirmed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-6 py-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                <ShieldAlert className="h-4 w-4" />
                <span>BR-2: Finalized inspection required to auction</span>
              </div>
              {canOverride && vehicle.status !== 'SOLD' && vehicle.status !== 'IN_AUCTION' && vehicle.inspection?.status === 'FINALIZED' && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleVehicleId(vehicle.id);
                    onClose();
                    setRoute('schedule');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition-transform hover:bg-[var(--brand-hover)] active:scale-[0.97]"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Auction
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

