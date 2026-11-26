'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Radio,
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
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--ink-muted)]">
        Connecting to DriveHub Laravel Live Auction Engine…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Room Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <Radio className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
              {auction.status}
            </span>
            <span className="font-mono-num text-xs text-[var(--ink-muted)]">
              Seller: {auction.tenantName}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-[var(--ink-primary)]">
            {lang === 'tr' ? 'Canlı İhale' : 'Live Auction'} · {vehicle.make} {vehicle.model} {vehicle.year}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {auctionList.map((item) => {
            const active = item.auction.id === auction.id;
            return (
              <button
                key={item.auction.id}
                type="button"
                onClick={() => setActiveAuctionId(item.auction.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--ink-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                {item.vehicle.make} {item.vehicle.model}{' '}
                <span className="font-mono-num text-[10px] opacity-75">· {item.auction.status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Trading Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Vehicle Stage + Append-Only Bid Tape */}
        <div className="space-y-5 lg:col-span-7">
          <VehicleStage
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            bodyType={vehicle.bodyType}
            accentColor={vehicle.imageAccent}
            damages={vehicle.inspection?.damages ?? []}
            plateBlur={vehicle.inspection?.plateBlurEnabled ?? true}
          />

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono-num text-xs font-semibold text-[var(--ink-primary)]">
              {vehicle.mileageKm.toLocaleString('en-GB')} km
            </span>
            <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)]">
              {vehicle.fuel} · {vehicle.transmission}
            </span>
            <span className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
              {vehicle.inspection?.damages.filter((d) => d.confirmedByInspector !== false).length ?? 0} damages (AI verified)
            </span>
            {vehicle.valuation && (
              <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono-num text-xs font-semibold text-[var(--ink-primary)]">
                {t(lang, 'aiValuation')}: {formatMoney(vehicle.valuation.suggestedPrice, currency, exchangeRate)}
              </span>
            )}
          </div>

          {/* Append-Only Bid History Table */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <h2 className="font-display text-sm font-bold text-[var(--ink-primary)]">
                {t(lang, 'bidHistory')}
              </h2>
              <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">
                Laravel DB::transaction · {auction.bids.length} events
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-[var(--bg-surface-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Bidder</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Server Time</th>
                    <th className="px-4 py-2.5">Proc.</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
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
                          initial={{ opacity: 0, backgroundColor: 'rgba(234,106,18,0.16)' }}
                          animate={{ opacity: 1, backgroundColor: 'rgba(234,106,18,0)' }}
                          transition={{ duration: 0.45 }}
                        >
                          <td className="px-4 py-2.5 font-mono-num text-[var(--ink-muted)]">
                            {b.sequenceNo !== null ? `#${b.sequenceNo}` : '#—'}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-[var(--ink-primary)]">
                            {b.bidderAlias} {isMe && <span className="text-[var(--brand)]">(you)</span>}
                          </td>
                          <td className="px-4 py-2.5 font-mono-num font-bold text-[var(--ink-primary)]">
                            {formatMoney(b.amount, currency, exchangeRate)}
                          </td>
                          <td className="px-4 py-2.5 font-mono-num text-[var(--ink-secondary)]">
                            {b.serverTimestamp}
                          </td>
                          <td className="px-4 py-2.5 font-mono-num text-[11px] text-emerald-600 dark:text-emerald-400">
                            {Number(b.processingMs).toFixed(1)} ms
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {b.status === 'ACCEPTED' ? (
                              <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono-num text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                Highest
                              </span>
                            ) : rejected ? (
                              <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 font-mono-num text-[10px] font-bold text-red-700 dark:text-red-300">
                                Rejected: {b.status === 'REJECTED_DUPLICATE' ? 'duplicate' : b.rejectionReason?.toLowerCase()}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-500/12 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-[var(--ink-muted)]">
                                Outbid
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Live Trading Console */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              {auction.status === 'SOLD' ? 'Final Settled Price' : 'Current Highest Bid'}
            </div>

            <motion.div
              key={auction.highestBid}
              initial={{ scale: 0.96, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mt-2 font-mono-num text-5xl font-extrabold tracking-tight text-[var(--ink-primary)]"
            >
              {formatMoney(auction.highestBid, currency, exchangeRate)}
            </motion.div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              {isHighestBidder && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  You are the highest bidder
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${
                  auction.reserveMet
                    ? 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                {auction.reserveMet ? `${t(lang, 'reserveMet')} ✓` : t(lang, 'reserveNotMet')}
              </span>
            </div>

            {auction.reservePrice !== undefined && (
              <div className="mt-2 font-mono-num text-[11px] text-[var(--ink-muted)]">
                Manager-Only Hidden Reserve: {formatMoney(auction.reservePrice, currency, exchangeRate)} (BR-5 hidden from dealers)
              </div>
            )}

            <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
              <div className="text-xs font-medium text-[var(--ink-muted)]">Time Left</div>
              <div
                className={`mt-1 font-mono-num text-4xl font-extrabold ${
                  !isLive
                    ? 'text-[var(--ink-muted)]'
                    : secondsLeft <= 30
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[var(--brand)]'
                }`}
              >
                {isLive ? formatCountdown(secondsLeft) : '00:00'}
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
                {t(lang, 'antiSnipingHint')}
              </p>

              <AnimatePresence>
                {extendedBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    AUCTION EXTENDED +30 s (Anti-Sniping #{auction.extensionsCount})
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isLive ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="bid-input" className="font-semibold text-[var(--ink-secondary)]">
                  Your Bid (min. increment {formatMoney(auction.minIncrement, currency, exchangeRate)})
                </label>
                <span className="font-mono-num text-[var(--ink-muted)]">
                  Min: {formatMoney(minNextBid, currency, exchangeRate)}
                </span>
              </div>

              {isOwnGallery ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <strong>Observer Mode (BR-3):</strong> You are signed in as the selling gallery ({auction.tenantName}). Switch to <strong>Mehmet Demir · Girne Motors</strong> in the Demo Director dock to place bids.
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-2.5 flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-num text-sm font-bold text-[var(--ink-muted)]">
                        £
                      </span>
                      <input
                        id="bid-input"
                        type="number"
                        step={auction.minIncrement}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] py-3 pl-8 pr-3 font-mono-num text-base font-bold text-[var(--ink-primary)]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={placing}
                      onClick={handleBidClick}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:bg-[var(--brand-hover)] active:scale-[0.97] disabled:opacity-50"
                    >
                      <Gavel className="h-4 w-4" />
                      {t(lang, 'placeBid')}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[100, 250, 500].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setBidAmount(auction.highestBid + inc)}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 font-mono-num text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      >
                        +£{inc}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5">
              <div className="flex items-center gap-2 font-display text-base font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                {auction.status === 'SOLD'
                  ? `Sold to ${auction.sale?.winningTenantName}`
                  : 'Auction Closed — Reserve Not Met'}
              </div>
              {auction.sale && (
                <button
                  type="button"
                  onClick={() => setHandoverOpen(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#142542] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1f3a5f]"
                >
                  <FileText className="h-4 w-4" />
                  Open Official Hand-Over PDF (UC18)
                </button>
              )}
            </div>
          )}

          {/* Live Sync Health + Presentation Controls */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                <Wifi className="h-4 w-4" />
                <span>
                  {connected ? t(lang, 'connected') : 'Reconnecting…'} · Laravel RTT{' '}
                  <strong className="font-mono-num">{rttMs} ms</strong> · {auction.connectedBidders}{' '}
                  {t(lang, 'biddersInRoom')}
                </span>
              </div>
            </div>

            {isLive && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!token) return;
                    await apiFetch('/api/demo/race-condition', {
                      method: 'POST',
                      token,
                      body: { auctionId: auction.id },
                    });
                    await syncAuctions(true);
                    pushToast('3x Simultaneous Bids Fired', '1 accepted, 2 rejected as duplicate', 'info');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Test 3x Race Collision
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!token) return;
                    await apiFetch('/api/demo/close-now', {
                      method: 'POST',
                      token,
                      body: { auctionId: auction.id },
                    });
                    await syncAuctions(true);
                  }}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                >
                  Settle &amp; Generate PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ETH-6 High-Jump Confirmation Modal */}
      <AnimatePresence>
        {confirmJumpAmount !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4.5 w-4.5" />
                Confirm High Bid Jump (ETH-6)
              </div>
              <p className="mt-2 text-xs text-[var(--ink-secondary)]">
                You are placing{' '}
                <strong className="font-mono-num">
                  {formatMoney(confirmJumpAmount, currency, exchangeRate)}
                </strong>
                , which is more than 20% above the current highest bid. Bids cannot be withdrawn once accepted (BR-4).
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmJumpAmount(null)}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submitBidConfirmed(confirmJumpAmount)}
                  className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white"
                >
                  Confirm &amp; Place Bid
                </button>
              </div>
            </div>
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
