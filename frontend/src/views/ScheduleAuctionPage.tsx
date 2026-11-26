'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarPlus, CheckCircle2, Radio } from 'lucide-react';
import { Vehicle } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney, t } from '@/lib/i18n';
import { VehicleStage } from '@/components/vehicles/VehicleStage';
import { Select } from '@/components/ui/Select';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Button, Callout, Field, PageHeader, Panel, inputClass } from '@/components/ui/primitives';

/** Next quarter hour, one hour from now. */
function defaultStart(): Date {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return d;
}

export const ScheduleAuctionPage: React.FC = () => {
  const {
    token,
    lang,
    currency,
    exchangeRate,
    scheduleVehicleId,
    setActiveAuctionId,
    setRoute,
    bumpDataVersion,
    pushToast,
  } = useApp();
  const tr = lang === 'tr';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string>(scheduleVehicleId ?? 'veh-qashqai');
  const [startPrice, setStartPrice] = useState<number>(9500);
  const [reservePrice, setReservePrice] = useState<number>(10900);
  const [minIncrement, setMinIncrement] = useState<number>(100);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [visibility, setVisibility] = useState<'ALL_VERIFIED' | 'INVITED_ONLY'>('ALL_VERIFIED');
  const [startsAt, setStartsAt] = useState<Date>(defaultStart);
  const [submitting, setSubmitting] = useState(false);

  const applySuggested = (v: Vehicle | undefined) => {
    if (!v?.valuation) return;
    const s = v.valuation.overriddenPrice ?? v.valuation.suggestedPrice;
    setStartPrice(Math.round((s * 0.85) / 100) * 100);
    setReservePrice(Math.round((s * 0.97) / 100) * 100);
  };

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
          applySuggested(match);
        }
      })
      .catch(() => {});
  }, [token, scheduleVehicleId]);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === selectedId) ?? null, [vehicles, selectedId]);
  const aiSuggested = vehicle?.valuation?.overriddenPrice ?? vehicle?.valuation?.suggestedPrice ?? 11200;
  const reserveDeltaPct = (((reservePrice - aiSuggested) / aiSuggested) * 100).toFixed(1);
  const startInPast = startsAt.getTime() <= Date.now();

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
          ...(launchImmediately ? {} : { startsAt: startsAt.toISOString() }),
        },
      });
      bumpDataVersion();
      pushToast(
        launchImmediately ? 'Live auction opened' : 'Auction scheduled',
        launchImmediately
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model} published to verified dealers.`
          : `${vehicle.year} ${vehicle.make} ${vehicle.model} · ${startsAt.toLocaleString(tr ? 'tr-TR' : 'en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}`,
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

  const money = (n: number) => formatMoney(n, currency, exchangeRate);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr ? 'İhale planla' : 'Schedule auction'}
        description={
          tr
            ? 'Başlangıç fiyatı, gizli rezerv ve artış adımını AI değerlemesine göre ayarlayın.'
            : 'Set the starting price, hidden reserve and bid step against the AI valuation.'
        }
        actions={
          vehicles.length > 0 && (
            <Select<string>
              value={selectedId}
              ariaLabel={tr ? 'Araç seç' : 'Choose vehicle'}
              align="end"
              className="w-72"
              onChange={(id) => {
                setSelectedId(id);
                applySuggested(vehicles.find((item) => item.id === id));
              }}
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.year} ${v.make} ${v.model}`,
                hint: `…${v.vin.slice(-6)}`,
              }))}
            />
          )
        }
      />

      {!vehicle ? (
        <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[13px] text-[var(--ink-muted)]">
          {tr
            ? 'Ekspertizi tamamlanmış uygun araç yok. Önce saha ekspertizini bitirin (BR-2).'
            : 'No inspected vehicles are eligible. Finish a field inspection first (BR-2).'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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

            <Panel bodyClassName="p-0">
              <dl className="divide-y divide-[var(--border-subtle)] text-[13px]">
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-[var(--ink-muted)]">{tr ? 'Araç' : 'Vehicle'}</dt>
                  <dd className="text-right font-medium">
                    {vehicle.make} {vehicle.model} {vehicle.year} ·{' '}
                    <span className="font-mono-num">{vehicle.mileageKm.toLocaleString('en-GB')} km</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-[var(--ink-muted)]">{tr ? 'Ekspertiz' : 'Inspection'}</dt>
                  <dd className="inline-flex items-center gap-1.5 font-medium text-[var(--success)]">
                    <CheckCircle2 className="h-4 w-4" />
                    {tr ? 'Tamamlandı' : 'Finalized'} · {vehicle.inspection?.damages.length ?? 0}{' '}
                    {tr ? 'hasar' : 'damage(s)'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-[var(--ink-muted)]">{tr ? 'AI önerilen fiyat' : 'AI suggested price'}</dt>
                  <dd className="text-right">
                    <span className="font-mono-num font-medium">{money(aiSuggested)}</span>
                    {vehicle.valuation && (
                      <div className="font-mono-num text-xs text-[var(--ink-muted)]">
                        {money(vehicle.valuation.minPrice)} – {money(vehicle.valuation.maxPrice)}
                      </div>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-[var(--ink-muted)]">{tr ? 'Model sürümü' : 'Model version'}</dt>
                  <dd className="font-mono-num text-xs">{vehicle.valuation?.modelVersion ?? 'valuation-v1.3'}</dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title={tr ? 'İhale parametreleri' : 'Auction parameters'} className="lg:col-span-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={tr ? 'Başlangıç fiyatı (£)' : 'Starting price (£)'} htmlFor="start-price">
                  <input
                    id="start-price"
                    type="number"
                    step={100}
                    value={startPrice}
                    onChange={(e) => setStartPrice(Number(e.target.value))}
                    className={`${inputClass} font-mono-num`}
                  />
                </Field>
                <Field
                  label={tr ? 'Rezerv fiyat (£)' : 'Reserve price (£)'}
                  htmlFor="reserve-price"
                  hint={tr ? 'Alıcılardan gizlenir (BR-5)' : 'Hidden from bidders (BR-5)'}
                >
                  <input
                    id="reserve-price"
                    type="number"
                    step={100}
                    value={reservePrice}
                    onChange={(e) => setReservePrice(Number(e.target.value))}
                    className={`${inputClass} font-mono-num`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={tr ? 'Min. artış (£)' : 'Min. bid step (£)'} htmlFor="min-inc">
                  <input
                    id="min-inc"
                    type="number"
                    step={50}
                    value={minIncrement}
                    onChange={(e) => setMinIncrement(Number(e.target.value))}
                    className={`${inputClass} font-mono-num`}
                  />
                </Field>
                <Field label={tr ? 'Süre' : 'Duration'} htmlFor="duration">
                  <Select<number>
                    id="duration"
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                    options={[10, 20, 30, 60].map((m) => ({
                      value: m,
                      label: `${m} ${tr ? 'dakika' : 'minutes'}`,
                    }))}
                  />
                </Field>
              </div>

              <Field label={tr ? 'Oda görünürlüğü' : 'Room visibility'} htmlFor="visibility">
                <Select<'ALL_VERIFIED' | 'INVITED_ONLY'>
                  id="visibility"
                  value={visibility}
                  onChange={setVisibility}
                  options={[
                    {
                      value: 'ALL_VERIFIED',
                      label: tr ? 'DriveHub’daki tüm doğrulanmış alıcılar' : 'All verified dealers on DriveHub',
                    },
                    {
                      value: 'INVITED_ONLY',
                      label: tr ? 'Yalnızca davetli galeriler' : 'Invited partner galleries only',
                    },
                  ]}
                />
              </Field>

              <Field
                label={t(lang, 'startTime')}
                htmlFor="starts-at"
                hint={
                  startInPast ? (
                    <span className="text-[var(--danger)]">
                      {tr ? 'Başlangıç zamanı gelecekte olmalı.' : 'Start time must be in the future.'}
                    </span>
                  ) : (
                    t(lang, 'startTimeHint')
                  )
                }
              >
                <DateTimePicker id="starts-at" value={startsAt} onChange={setStartsAt} lang={lang} min={new Date()} />
              </Field>

              {reservePrice < startPrice ? (
                <Callout tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
                  {tr
                    ? 'Rezerv fiyat başlangıç fiyatından düşük olamaz.'
                    : 'Reserve price must be greater than or equal to the starting price.'}
                </Callout>
              ) : (
                <Callout tone="info">
                  {tr ? (
                    <>
                      Rezerv, AI önerisinin ({money(aiSuggested)}) %{Math.abs(Number(reserveDeltaPct))}{' '}
                      {Number(reserveDeltaPct) < 0 ? 'altında' : 'üstünde'}.
                    </>
                  ) : (
                    <>
                      Reserve is {Math.abs(Number(reserveDeltaPct))}%{' '}
                      {Number(reserveDeltaPct) < 0 ? 'below' : 'above'} the AI suggestion ({money(aiSuggested)}).
                    </>
                  )}
                </Callout>
              )}

              <div className="grid grid-cols-1 gap-2 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
                <Button
                  disabled={submitting || reservePrice < startPrice || startInPast}
                  onClick={() => handlePublish(false)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  {tr ? 'Planlı kaydet' : 'Save as scheduled'}
                </Button>
                <Button
                  variant="primary"
                  disabled={submitting || reservePrice < startPrice}
                  onClick={() => handlePublish(true)}
                >
                  <Radio className="h-4 w-4" />
                  {tr ? 'Yayınla ve odayı aç' : 'Publish & open room'}
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};
