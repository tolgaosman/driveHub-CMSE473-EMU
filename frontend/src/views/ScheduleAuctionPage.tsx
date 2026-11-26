'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarPlus, CheckCircle2, Radio } from 'lucide-react';
import { Vehicle } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/i18n';
import { VehicleStage } from '@/components/vehicles/VehicleStage';

export const ScheduleAuctionPage: React.FC = () => {
  const {
    token,
    currency,
    exchangeRate,
    scheduleVehicleId,
    setActiveAuctionId,
    setRoute,
    bumpDataVersion,
    pushToast,
  } = useApp();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string>(scheduleVehicleId ?? 'veh-qashqai');
  const [startPrice, setStartPrice] = useState<number>(9500);
  const [reservePrice, setReservePrice] = useState<number>(10900);
  const [minIncrement, setMinIncrement] = useState<number>(100);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [visibility, setVisibility] = useState<'ALL_VERIFIED' | 'INVITED_ONLY'>('ALL_VERIFIED');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ vehicles: Vehicle[] }>('/api/vehicles', { token })
      .then((res) => {
        const eligible = res.vehicles.filter(
          (v) => v.inspection?.status === 'FINALIZED' && v.status !== 'SOLD' && v.status !== 'IN_AUCTION'
        );
        setVehicles(eligible);
        const match = eligible.find((v) => v.id === (scheduleVehicleId ?? 'veh-qashqai')) ?? eligible[0];
        if (match) {
          setSelectedId(match.id);
          const suggested = match.valuation?.overriddenPrice ?? match.valuation?.suggestedPrice ?? 10000;
          setStartPrice(Math.round((suggested * 0.85) / 100) * 100);
          setReservePrice(Math.round((suggested * 0.97) / 100) * 100);
        }
      })
      .catch(() => {});
  }, [token, scheduleVehicleId]);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === selectedId) ?? null, [vehicles, selectedId]);
  const aiSuggested = vehicle?.valuation?.overriddenPrice ?? vehicle?.valuation?.suggestedPrice ?? 11200;
  const reserveDeltaPct = (((reservePrice - aiSuggested) / aiSuggested) * 100).toFixed(1);

  const handlePublish = async (launchImmediately: boolean) => {
    if (!token || !vehicle) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ auction: { id: string } }>('/api/auctions', {
        method: 'POST',
        token,
        body: {
          vehicleId: vehicle.id,
          startPrice,
          reservePrice,
          minIncrement,
          durationMinutes,
          visibility,
          launchImmediately,
        },
      });
      bumpDataVersion();
      pushToast(
        launchImmediately ? 'Live Auction Opened' : 'Auction Scheduled',
        `${vehicle.year} ${vehicle.make} ${vehicle.model} published to verified dealers.`,
        'success'
      );
      if (launchImmediately) {
        setActiveAuctionId(res.auction.id);
        setRoute('live-room');
      } else {
        setRoute('inventory');
      }
    } catch (err) {
      pushToast('Cannot publish auction', (err as Error).message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--ink-primary)] sm:text-3xl">
            Schedule &amp; Launch Auction (UC10)
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Configure hidden reserve price, minimum increment, and anti-sniping parameters against AI valuation.
          </p>
        </div>

        <select
          value={selectedId}
          onChange={(e) => {
            const v = vehicles.find((item) => item.id === e.target.value);
            setSelectedId(e.target.value);
            if (v?.valuation) {
              const s = v.valuation.overriddenPrice ?? v.valuation.suggestedPrice;
              setStartPrice(Math.round((s * 0.85) / 100) * 100);
              setReservePrice(Math.round((s * 0.97) / 100) * 100);
            }
          }}
          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)]"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model} ({v.vin.slice(-6)})
            </option>
          ))}
        </select>
      </div>

      {!vehicle ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--ink-muted)]">
          No eligible inspected vehicles available. Complete a field inspection first (BR-2).
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Vehicle Preview Card (Upgraded w3) */}
          <div className="space-y-4 lg:col-span-6">
            <VehicleStage
              make={vehicle.make}
              model={vehicle.model}
              year={vehicle.year}
              bodyType={vehicle.bodyType}
              accentColor={vehicle.imageAccent}
              damages={vehicle.inspection?.damages ?? []}
              compact
            />

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--ink-muted)]">Vehicle</span>
                  <strong className="text-[var(--ink-primary)]">
                    {vehicle.make} {vehicle.model} {vehicle.year} · {vehicle.mileageKm.toLocaleString('en-GB')} km
                  </strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--ink-muted)]">Inspection</span>
                  <strong className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Finalized · {vehicle.inspection?.damages.length ?? 0} damage(s)
                  </strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--ink-muted)]">AI Suggested Price</span>
                  <strong className="font-mono-num text-[var(--ink-primary)]">
                    {formatMoney(aiSuggested, currency, exchangeRate)}{' '}
                    {vehicle.valuation && (
                      <span className="text-xs font-normal text-[var(--ink-muted)]">
                        (range {formatMoney(vehicle.valuation.minPrice, currency, exchangeRate)} –{' '}
                        {formatMoney(vehicle.valuation.maxPrice, currency, exchangeRate)})
                      </span>
                    )}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Model Version</span>
                  <strong className="font-mono-num text-xs text-[var(--ink-primary)]">
                    {vehicle.valuation?.modelVersion ?? 'valuation-v1.3'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Auction Settings Form */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)] lg:col-span-6">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              Auction Parameters
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  Starting Price (£ GBP)
                </label>
                <input
                  type="number"
                  step={100}
                  value={startPrice}
                  onChange={(e) => setStartPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 font-mono-num text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  Reserve Price — Hidden from Bidders (BR-5, £ GBP)
                </label>
                <input
                  type="number"
                  step={100}
                  value={reservePrice}
                  onChange={(e) => setReservePrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 font-mono-num text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Min. Bid Increment (£)
                  </label>
                  <input
                    type="number"
                    step={50}
                    value={minIncrement}
                    onChange={(e) => setMinIncrement(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 font-mono-num text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm font-semibold"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  Room Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'ALL_VERIFIED' | 'INVITED_ONLY')}
                  className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="ALL_VERIFIED">All verified dealers on DriveHub</option>
                  <option value="INVITED_ONLY">Invited partner galleries only</option>
                </select>
              </div>

              {reservePrice < startPrice ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Reserve price must be greater than or equal to starting price.
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Reserve is {Math.abs(Number(reserveDeltaPct))}%{' '}
                  {Number(reserveDeltaPct) < 0 ? 'below' : 'above'} the AI suggested price ({formatMoney(aiSuggested, currency, exchangeRate)}).
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting || reservePrice < startPrice}
                  onClick={() => handlePublish(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-xs font-bold text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)] disabled:opacity-45"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Save Scheduled
                </button>
                <button
                  type="button"
                  disabled={submitting || reservePrice < startPrice}
                  onClick={() => handlePublish(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-xs font-bold text-white shadow-sm transition-transform hover:bg-[var(--brand-hover)] active:scale-[0.97] disabled:opacity-45"
                >
                  <Radio className="h-4 w-4" />
                  Publish &amp; Open Live Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

