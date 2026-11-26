'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  ShieldAlert,
  Wifi,
  Zap,
} from 'lucide-react';
import { Auction, Vehicle } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { formatMoney, t } from '@/lib/i18n';
import { VehicleStage } from '@/components/vehicles/VehicleStage';
import { HandoverModal } from '@/components/auctions/HandoverModal';
import { Badge, Button, Callout, Panel, inputClass } from '@/components/ui/primitives';

interface EnrichedAuction {
  auction: Auction;
  vehicle: Vehicle;
}

export const LiveAuctionRoomPage: React.FC = () => {
  const {
    user,
    token,
    lang,
    currency,
    exchangeRate,
    activeAuctionId,
    setActiveAuctionId,
    dataVersion,
    bumpDataVersion,
    pushToast,
  } = useApp();

  const [auctionList, setAuctionList] = useState<EnrichedAuction[]>([]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(13000);
  const [connected, setConnected] = useState(false);
  const [rttMs, setRttMs] = useState<number>(9);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [extendedBanner, setExtendedBanner] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [confirmJumpAmount, setConfirmJumpAmount] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);

  const prevExtensionsRef = useRef<number>(0);
  const prevStatusRef = useRef<string | null>(null);

  const syncAuctions = useCallback(
    async (silent = false) => {
      if (!token) return;
      const start = performance.now();
      try {
        const res = await apiFetch<{ auctions: EnrichedAuction[] }>('/api/auctions', { token });
        const elapsed = Math.max(1, Math.round(performance.now() - start));
        setRttMs(elapsed);
        setConnected(true);
        setAuctionList(res.auctions);

        const current = res.auctions.find((a) => a.auction.id === activeAuctionId) ?? res.auctions[0];
        if (current) {
          setAuction((prev) => {
            if (prev && prev.id === current.auction.id) {
              if (current.auction.extensionsCount > prevExtensionsRef.current) {
                setExtendedBanner(true);
                pushToast(
                  'Anti-Sniping Triggered (+30 s)',
                  `Extension #${current.auction.extensionsCount} applied`,
                  'info'
                );
                setTimeout(() => setExtendedBanner(false), 4500);
              }
              if (
                prevStatusRef.current &&
                prevStatusRef.current !== current.auction.status &&
                (current.auction.status === 'SOLD' || current.auction.status === 'NOT_SOLD')
              ) {
                pushToast(
                  current.auction.status === 'SOLD'
                    ? 'Auction Settled: SOLD'
                    : 'Auction Closed: NOT SOLD',
                  current.auction.status === 'SOLD'
                    ? 'Hand-over certificate generated (UC18)'
                    : 'Reserve not reached',
                  current.auction.status === 'SOLD' ? 'success' : 'warning'
                );
              }
            }
            prevExtensionsRef.current = current.auction.extensionsCount;
            prevStatusRef.current = current.auction.status;
            return current.auction;
          });
          setVehicle(current.vehicle);

          const minNext =
            current.auction.sequenceNo === 0
              ? current.auction.startPrice
              : current.auction.highestBid + current.auction.minIncrement;
          setBidAmount((prev) => (prev < minNext || !silent ? minNext : prev));
        }
      } catch (err) {
        setConnected(false);
        if (!silent) {
          pushToast('Auction sync failed', (err as Error).message, 'danger');
        }
      }
    },
    [token, activeAuctionId, pushToast]
  );

  useEffect(() => {
    syncAuctions(false);
  }, [syncAuctions, dataVersion]);

  // Sub-second live sync with Laravel backend across tabs
  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      syncAuctions(true);
    }, 900);
    return () => window.clearInterval(id);
  }, [token, syncAuctions]);

  // Countdown tick
  useEffect(() => {
    if (!auction) return;
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(auction.endsAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 500);
    return () => window.clearInterval(id);
  }, [auction]);

  const minNextBid = useMemo(() => {
    if (!auction) return 0;
    return auction.sequenceNo === 0
      ? auction.startPrice
      : auction.highestBid + auction.minIncrement;
  }, [auction]);

  const isOwnGallery = user && auction ? user.tenantId === auction.tenantId : false;
  const isHighestBidder = user && auction ? auction.highestBidderTenantId === user.tenantId : false;
  const isLive = auction?.status === 'LIVE' || auction?.status === 'EXTENDED';

  const submitBidConfirmed = async (amountToSubmit: number) => {
    if (!auction || !token) return;
    setConfirmJumpAmount(null);
    setPlacing(true);
    const clientRequestId = `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const res = await apiFetch<{
        accepted: boolean;
        extended?: boolean;
        bid: { sequenceNo: number | null; processingMs: number };
      }>(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        token,
        body: { amount: amountToSubmit, clientRequestId },
      });
      if (res.accepted) {
        pushToast(
          `Bid #${res.bid.sequenceNo} Accepted (${res.bid.processingMs} ms)`,
          `Atomic Laravel transaction committed`,
          'success'
        );
      }
      await syncAuctions(true);
      bumpDataVersion();
    } catch (err) {
      pushToast('Bid Rejected Atomically', (err as Error).message, 'warning');
      await syncAuctions(true);
    } finally {
      setPlacing(false);
    }
  };

  const handleBidClick = () => {
    if (!auction) return;
    if (bidAmount > auction.highestBid * 1.2) {
      setConfirmJumpAmount(bidAmount);
      return;
    }
    submitBidConfirmed(bidAmount);
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!auction || !vehicle) {
    return (
      <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[13px] text-[var(--ink-muted)]">
        {lang === 'tr' ? 'Canlı ihale odasına bağlanılıyor…' : 'Connecting to the live auction room…'}
      </div>
    );
  }

  const tr = lang === 'tr';
  const confirmedDamages = vehicle.inspection?.damages.filter((d) => d.confirmedByInspector !== false).length ?? 0;
  const money = (n: number) => formatMoney(n, currency, exchangeRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Badge tone={isLive ? 'danger' : auction.status === 'SOLD' ? 'brand' : 'neutral'} dot>
              {auction.status}
            </Badge>
            <span className="text-xs text-[var(--ink-muted)]">
              {tr ? 'Satıcı' : 'Seller'}: {auction.tenantName}
            </span>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
        </div>

        {auctionList.length > 1 && (
          <div role="tablist" className="flex flex-wrap gap-1 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-0.5">
            {auctionList.map((item) => {
              const active = item.auction.id === auction.id;
              return (
                <button
                  key={item.auction.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveAuctionId(item.auction.id)}
                  className={`flex h-7 items-center gap-1.5 rounded-[3px] px-2.5 text-xs transition-colors duration-100 ${
                    active
                      ? 'bg-[var(--bg-surface-subtle)] font-medium text-[var(--ink-primary)]'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {(item.auction.status === 'LIVE' || item.auction.status === 'EXTENDED') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                  )}
                  {item.vehicle.make} {item.vehicle.model}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: vehicle + bid tape */}
        <div className="space-y-4 lg:col-span-7">
          <VehicleStage
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            bodyType={vehicle.bodyType}
            accentColor={vehicle.imageAccent}
            damages={vehicle.inspection?.damages ?? []}
            plateBlur={vehicle.inspection?.plateBlurEnabled ?? true}
          />

          <dl className="grid grid-cols-2 divide-x divide-[var(--border-subtle)] rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:grid-cols-4">
            <div className="px-4 py-3">
              <dt className="text-[var(--ink-muted)]">{tr ? 'Kilometre' : 'Mileage'}</dt>
              <dd className="mt-0.5 font-mono-num text-[13px] font-medium">{vehicle.mileageKm.toLocaleString('en-GB')} km</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-[var(--ink-muted)]">{tr ? 'Yakıt / vites' : 'Fuel / gearbox'}</dt>
              <dd className="mt-0.5 text-[13px] font-medium">{vehicle.fuel} · {vehicle.transmission}</dd>
            </div>
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 sm:border-t-0">
              <dt className="text-[var(--ink-muted)]">{tr ? 'Onaylı hasar' : 'Confirmed damage'}</dt>
              <dd className={`mt-0.5 font-mono-num text-[13px] font-medium ${confirmedDamages ? 'text-[var(--danger)]' : ''}`}>
                {confirmedDamages}
              </dd>
            </div>
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 sm:border-t-0">
              <dt className="text-[var(--ink-muted)]">{t(lang, 'aiValuation')}</dt>
              <dd className="mt-0.5 font-mono-num text-[13px] font-medium">
                {vehicle.valuation ? money(vehicle.valuation.suggestedPrice) : '—'}
              </dd>
            </div>
          </dl>

          <Panel
            title={t(lang, 'bidHistory')}
            actions={
              <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">
                {auction.bids.length} {tr ? 'kayıt' : 'events'}
              </span>
            }
            bodyClassName="max-h-72 overflow-y-auto"
          >
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[var(--bg-surface)] text-[11px] uppercase tracking-wide text-[var(--ink-muted)] shadow-[inset_0_-1px_0_var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">{tr ? 'Alıcı' : 'Bidder'}</th>
                  <th className="px-4 py-2 text-right font-medium">{tr ? 'Tutar' : 'Amount'}</th>
                  <th className="px-4 py-2 font-medium">{tr ? 'Sunucu zamanı' : 'Server time'}</th>
                  <th className="px-4 py-2 text-right font-medium">{tr ? 'İşlem' : 'Proc.'}</th>
                  <th className="px-4 py-2 text-right font-medium">{tr ? 'Durum' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                <AnimatePresence initial={false}>
                  {auction.bids.map((b) => {
                    const isMe = user && b.bidderTenantId === user.tenantId;
                    const rejected = b.status.startsWith('REJECTED');
                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0, backgroundColor: 'rgba(229,96,10,0.12)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(229,96,10,0)' }}
                        transition={{ duration: 0.6 }}
                      >
                        <td className="px-4 py-2 font-mono-num text-[var(--ink-muted)]">
                          {b.sequenceNo !== null ? b.sequenceNo : '—'}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {b.bidderAlias}{' '}
                          {isMe && <span className="font-normal text-[var(--brand)]">({tr ? 'siz' : 'you'})</span>}
                        </td>
                        <td className={`px-4 py-2 text-right font-mono-num font-medium ${rejected ? 'text-[var(--ink-muted)] line-through' : ''}`}>
                          {money(b.amount)}
                        </td>
                        <td className="px-4 py-2 font-mono-num text-[var(--ink-secondary)]">{b.serverTimestamp}</td>
                        <td className="px-4 py-2 text-right font-mono-num text-[11px] text-[var(--ink-muted)]">
                          {Number(b.processingMs).toFixed(1)} ms
                        </td>
                        <td className="px-4 py-2 text-right">
                          {b.status === 'ACCEPTED' ? (
                            <Badge tone="success">{tr ? 'En yüksek' : 'Highest'}</Badge>
                          ) : rejected ? (
                            <Badge tone="danger">
                              {b.status === 'REJECTED_DUPLICATE'
                                ? tr ? 'Mükerrer' : 'Duplicate'
                                : b.rejectionReason?.toLowerCase() ?? (tr ? 'Reddedildi' : 'Rejected')}
                            </Badge>
                          ) : (
                            <Badge>{tr ? 'Geçildi' : 'Outbid'}</Badge>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Right: trading console */}
        <div className="space-y-4 lg:col-span-5">
          <section className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-5 pb-5 pt-4">
              <div>
                <div className="eyebrow">
                  {auction.status === 'SOLD'
                    ? tr ? 'Satış fiyatı' : 'Final price'
                    : tr ? 'En yüksek teklif' : 'Highest bid'}
                </div>
                <motion.div
                  key={auction.highestBid}
                  initial={{ opacity: 0.4, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="mt-1.5 font-mono-num text-[40px] font-medium leading-none tracking-tight"
                >
                  {money(auction.highestBid)}
                </motion.div>
              </div>
              <div className="text-right">
                <div className="eyebrow">{tr ? 'Kalan' : 'Time left'}</div>
                <div
                  className={`mt-1.5 font-mono-num text-[28px] font-medium leading-none ${
                    !isLive ? 'text-[var(--ink-muted)]' : secondsLeft <= 30 ? 'text-[var(--danger)]' : 'text-[var(--ink-primary)]'
                  }`}
                >
                  {isLive ? formatCountdown(secondsLeft) : '00:00'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] px-5 py-3 text-xs">
              <Badge tone={auction.reserveMet ? 'success' : 'warning'}>
                {auction.reserveMet ? t(lang, 'reserveMet') : t(lang, 'reserveNotMet')}
              </Badge>
              {isHighestBidder && (
                <span className="inline-flex items-center gap-1 font-medium text-[var(--success)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tr ? 'En yüksek teklif sizde' : 'You are the highest bidder'}
                </span>
              )}
              {auction.reservePrice !== undefined && (
                <span className="ml-auto font-mono-num text-[11px] text-[var(--ink-muted)]">
                  {tr ? 'Gizli rezerv' : 'Hidden reserve'}: {money(auction.reservePrice)}
                </span>
              )}
            </div>

            <AnimatePresence>
              {extendedBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 border-t border-[var(--border-subtle)] bg-[var(--warning-bg)] px-5 py-2 text-xs font-medium text-[var(--warning)]">
                    <Clock className="h-3.5 w-3.5" />
                    {tr ? 'Süre +30 sn uzatıldı' : 'Extended by 30 s'} · #{auction.extensionsCount}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-[var(--border-subtle)] px-5 py-4">
              {isLive ? (
                isOwnGallery ? (
                  <Callout tone="warning" icon={<ShieldAlert className="h-4 w-4" />}>
                    {tr ? (
                      <>
                        <strong>İzleyici modu (BR-3):</strong> satıcı galeri ({auction.tenantName}) olarak giriş
                        yaptınız. Teklif vermek için Demo Director’dan <strong>Mehmet Demir</strong> rolüne geçin.
                      </>
                    ) : (
                      <>
                        <strong>Observer mode (BR-3):</strong> you are signed in as the selling gallery (
                        {auction.tenantName}). Switch to <strong>Mehmet Demir</strong> in Demo Director to bid.
                      </>
                    )}
                  </Callout>
                ) : (
                  <>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <label htmlFor="bid-input" className="font-medium text-[var(--ink-secondary)]">
                        {tr ? 'Teklifiniz' : 'Your bid'}
                      </label>
                      <span className="font-mono-num text-[var(--ink-muted)]">
                        min {money(minNextBid)} · {tr ? 'adım' : 'step'} {money(auction.minIncrement)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-[var(--ink-muted)]">
                          £
                        </span>
                        <input
                          id="bid-input"
                          type="number"
                          step={auction.minIncrement}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          className={`${inputClass} h-11 pl-7 font-mono-num text-base font-medium`}
                        />
                      </div>
                      <Button variant="primary" size="lg" disabled={placing} onClick={handleBidClick}>
                        <Gavel className="h-4 w-4" />
                        {t(lang, 'placeBid')}
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {[100, 250, 500].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setBidAmount(auction.highestBid + inc)}
                          className="h-7 rounded-[var(--r-sm)] border border-[var(--border-strong)] px-2.5 font-mono-num text-xs text-[var(--ink-secondary)] transition-colors duration-100 hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)]"
                        >
                          +£{inc}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-[var(--ink-muted)]">{t(lang, 'antiSnipingHint')}</p>
                  </>
                )
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <CheckCircle2 className={`h-4 w-4 ${auction.status === 'SOLD' ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'}`} />
                    {auction.status === 'SOLD'
                      ? `${tr ? 'Satıldı' : 'Sold to'} ${auction.sale?.winningTenantName ?? ''}`
                      : tr ? 'İhale kapandı, rezerv karşılanmadı' : 'Closed, reserve not met'}
                  </div>
                  {auction.sale && (
                    <Button variant="dark" className="mt-3 w-full" onClick={() => setHandoverOpen(true)}>
                      <FileText className="h-4 w-4" />
                      {tr ? 'Teslim belgesini aç' : 'Open hand-over certificate'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Connection + demo controls */}
          <section className="rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
            <div className="flex items-center gap-2 px-4 py-3">
              <Wifi className={`h-4 w-4 ${connected ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`} />
              <span className="text-[var(--ink-secondary)]">
                {connected ? t(lang, 'connected') : tr ? 'Yeniden bağlanıyor…' : 'Reconnecting…'}
              </span>
              <span className="ml-auto font-mono-num text-[var(--ink-muted)]">
                RTT {rttMs} ms · {auction.connectedBidders} {t(lang, 'biddersInRoom')}
              </span>
            </div>

            {isLive && (
              <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (!token) return;
                    await apiFetch('/api/demo/race-condition', {
                      method: 'POST',
                      token,
                      body: { auctionId: auction.id },
                    });
                    await syncAuctions(true);
                    pushToast('3 simultaneous bids fired', '1 accepted, 2 rejected as duplicate', 'info');
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {tr ? '3× çakışma testi' : 'Test 3× collision'}
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!token) return;
                    await apiFetch('/api/demo/close-now', {
                      method: 'POST',
                      token,
                      body: { auctionId: auction.id },
                    });
                    await syncAuctions(true);
                  }}
                >
                  {tr ? 'Kapat ve belge üret' : 'Settle & generate PDF'}
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ETH-6 high-jump confirmation */}
      <AnimatePresence>
        {confirmJumpAmount !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-sm rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-pop)]"
            >
              <div className="p-5">
                <div className="flex items-center gap-2 text-[15px] font-semibold">
                  <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
                  {tr ? 'Yüksek teklifi onayla' : 'Confirm large bid'}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                  {tr ? (
                    <>
                      <strong className="font-mono-num text-[var(--ink-primary)]">{money(confirmJumpAmount)}</strong>{' '}
                      mevcut en yüksek teklifin %20’sinden fazla üstünde. Kabul edilen teklif geri alınamaz (BR-4).
                    </>
                  ) : (
                    <>
                      <strong className="font-mono-num text-[var(--ink-primary)]">{money(confirmJumpAmount)}</strong> is
                      more than 20% above the current highest bid. Accepted bids cannot be withdrawn (BR-4).
                    </>
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3">
                <Button variant="ghost" onClick={() => setConfirmJumpAmount(null)}>
                  {tr ? 'Vazgeç' : 'Cancel'}
                </Button>
                <Button variant="primary" onClick={() => submitBidConfirmed(confirmJumpAmount)}>
                  {tr ? 'Teklifi ver' : 'Place bid'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HandoverModal
        open={handoverOpen}
        auction={auction}
        vehicle={vehicle}
        onClose={() => setHandoverOpen(false)}
      />
    </div>
  );
};
