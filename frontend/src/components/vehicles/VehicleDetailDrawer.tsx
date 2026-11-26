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
import { VEHICLE_STATUS } from '@/lib/status';
import { Badge, Callout, Field, buttonClass, inputClass } from '@/components/ui/primitives';
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
  const { token, user, lang, currency, exchangeRate, setRoute, setScheduleVehicleId, pushToast } = useApp();
  const tr = lang === 'tr';
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
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex justify-end bg-[var(--scrim)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-pop)]"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-semibold text-[var(--ink-primary)]">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <Badge tone={VEHICLE_STATUS[vehicle.status].tone}>{VEHICLE_STATUS[vehicle.status][lang]}</Badge>
                </div>
                <div className="mt-0.5 font-mono-num text-xs text-[var(--ink-muted)]">
                  {vehicle.vin} · {vehicle.mileageKm.toLocaleString('en-GB')} km · {vehicle.engine}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--r-sm)] p-1.5 text-[var(--ink-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)]"
                aria-label="Close vehicle details"
              >
                <X className="h-4 w-4" />
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
                <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="eyebrow">
                        {tr ? 'Değerleme' : 'Valuation'} · {vehicle.valuation.modelVersion}
                      </div>
                      <div className="mt-1 flex items-baseline gap-2.5">
                        <span className="font-mono-num text-2xl font-medium tracking-tight text-[var(--ink-primary)]">
                          {formatMoney(
                            vehicle.valuation.overriddenPrice ?? vehicle.valuation.suggestedPrice,
                            currency,
                            exchangeRate
                          )}
                        </span>
                        <span className="font-mono-num text-xs text-[var(--ink-muted)]">
                          {formatMoney(vehicle.valuation.minPrice, currency, exchangeRate)} –{' '}
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
                        className={buttonClass('secondary', 'sm')}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {tr ? 'Fiyatı düzelt' : 'Override price'}
                      </button>
                    )}
                  </div>

                  {vehicle.valuation.overriddenPrice && (
                    <Callout tone="warning" icon={<AlertTriangle className="h-4 w-4" />} className="mt-3">
                      <div>
                        <span className="font-semibold">{tr ? 'Yönetici düzeltmesi:' : 'Manager override:'}</span> AI{' '}
                        {formatMoney(vehicle.valuation.suggestedPrice, currency, exchangeRate)} →{' '}
                        {formatMoney(vehicle.valuation.overriddenPrice, currency, exchangeRate)} by{' '}
                        {vehicle.valuation.overriddenBy}. “{vehicle.valuation.overrideReason}”
                      </div>
                    </Callout>
                  )}

                  {overrideOpen && (
                    <form
                      onSubmit={handleOverrideSubmit}
                      className="mt-3 space-y-3 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label={tr ? 'Yeni fiyat (£)' : 'New price (£)'} htmlFor="ovr-price">
                          <input
                            id="ovr-price"
                            type="number"
                            min={500}
                            step={50}
                            required
                            value={overridePrice}
                            onChange={(e) => setOverridePrice(e.target.value)}
                            className={`${inputClass} font-mono-num`}
                          />
                        </Field>
                        <Field label={tr ? 'Gerekçe (zorunlu, REQ-5.3)' : 'Reason (required, REQ-5.3)'} htmlFor="ovr-reason">
                          <input
                            id="ovr-reason"
                            type="text"
                            required
                            minLength={5}
                            placeholder={tr ? 'ör. yeni bakım ve lastikler' : 'e.g. fresh service and new tyres'}
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOverrideOpen(false)}
                          className={buttonClass('ghost', 'sm')}
                        >
                          {tr ? 'Vazgeç' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className={buttonClass('primary', 'sm')}
                        >
                          {saving ? (tr ? 'Kaydediliyor…' : 'Saving…') : tr ? 'Kaydet' : 'Save override'}
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
                          className={`font-mono-num font-medium ${
                            f.category === 'BASE'
                              ? 'text-[var(--ink-primary)]'
                              : f.deltaGbp >= 0
                              ? 'text-[var(--success)]'
                              : 'text-[var(--danger)]'
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
                <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-4 text-xs text-[var(--ink-muted)]">
                  {tr
                    ? 'Hasar analizi sürüyor; değerleme tamamlandığında burada görünecek.'
                    : 'Damage analysis is still running. The valuation appears here when it finishes.'}
                </div>
              )}

              {/* AI vs Human Inspection Summary */}
              {vehicle.inspection && (
                <div className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="eyebrow">
                      {tr ? 'Ekspertiz bulguları' : 'Inspection findings'} · {vehicle.inspection.damages.length}
                    </div>
                    <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">
                      {vehicle.inspection.inferenceTimeSec} s · {vehicle.inspection.inspectorName}
                    </span>
                  </div>
                  {vehicle.inspection.damages.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--success)]">
                      <CheckCircle2 className="h-4 w-4" />
                      {tr ? '8 açının hiçbirinde hasar bulunmadı.' : 'No damage found on any of the 8 angles.'}
                    </div>
                  ) : (
                    <ul className="mt-3 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
                      {vehicle.inspection.damages.map((d) => (
                        <li key={d.id} className="flex items-center justify-between py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge tone={d.type === 'DENT' ? 'danger' : 'warning'} className="font-mono-num">
                              {d.type}
                            </Badge>
                            <span className="font-medium text-[var(--ink-primary)]">{d.panel}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono-num">
                            <span className="text-[var(--ink-muted)]">{Math.round(d.confidence * 100)}%</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" aria-label="Confirmed" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3.5">
              <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                <ShieldAlert className="h-4 w-4" />
                <span>{tr ? 'İhale için tamamlanmış ekspertiz gerekir (BR-2)' : 'Auction requires a finalized inspection (BR-2)'}</span>
              </div>
              {canOverride && vehicle.status !== 'SOLD' && vehicle.status !== 'IN_AUCTION' && vehicle.inspection?.status === 'FINALIZED' && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleVehicleId(vehicle.id);
                    onClose();
                    setRoute('schedule');
                  }}
                  className={buttonClass('primary')}
                >
                  <CalendarPlus className="h-4 w-4" />
                  {tr ? 'İhale planla' : 'Schedule auction'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

