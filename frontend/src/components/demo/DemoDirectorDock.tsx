'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  Clock,
  Cpu,
  RotateCcw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';

export const DemoDirectorDock: React.FC = () => {
  const {
    user,
    token,
    accounts,
    activeAuctionId,
    switchPersona,
    pushToast,
    bumpDataVersion,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const runDemoAction = async (
    label: string,
    path: string,
    body?: Record<string, unknown>
  ) => {
    if (!token) {
      pushToast('Sign in first', 'Pick any persona below to run live actions.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(path, { method: 'POST', token, body });
      bumpDataVersion();
      pushToast(label, 'Live state broadcast over WebSocket', 'success');
    } catch (err) {
      pushToast('Action failed', (err as Error).message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="mb-2 w-88 origin-bottom-right rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--brand)]" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  Presentation Demo Director
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await apiFetch('/api/demo/reset', { method: 'POST' });
                  bumpDataVersion();
                  pushToast('Demo Reset', 'Seeded KKTC data restored', 'info');
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            {/* Instant Persona Switcher */}
            <div className="mb-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <Users className="h-3.5 w-3.5" />
                Switch Role (Issues Real JWT)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {accounts.slice(0, 4).map((acc) => {
                  const isCurrent = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => switchPersona(acc.id)}
                      className={`rounded-xl border px-2.5 py-2 text-left text-[11px] transition-colors ${
                        isCurrent
                          ? 'border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--ink-primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="truncate font-semibold">{acc.fullName}</div>
                      <div className="truncate font-mono-num text-[10px] text-[var(--ink-muted)]">
                        {acc.role.replace('_', ' ')}
                      </div>
                    </button>
                  );
                })}
                {accounts[4] && (
                  <button
                    type="button"
                    onClick={() => switchPersona(accounts[4].id)}
                    className={`col-span-2 rounded-xl border px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                      user?.id === accounts[4].id
                        ? 'border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--ink-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span className="font-semibold">{accounts[4].fullName}</span>{' '}
                    <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">
                      · PLATFORM ADMIN (Audit &amp; Tenants)
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Auction Triggers */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <Cpu className="h-3.5 w-3.5" />
                Live Auction Stress Triggers ({activeAuctionId})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runDemoAction('Race Condition Tested', '/api/demo/race-condition', {
                      auctionId: activeAuctionId,
                    })
                  }
                  className="flex items-center justify-between rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-300"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Simulate 3x Simultaneous Bid Collision
                  </span>
                  <span className="font-mono-num text-[10px]">REQ-7.3</span>
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      runDemoAction('Rival Dealer Bid Placed', '/api/demo/rival-bid', {
                        auctionId: activeAuctionId,
                      })
                    }
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-2 text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]"
                  >
                    + Rival Bid
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      runDemoAction('Timer Set to 00:22', '/api/demo/fast-forward', {
                        auctionId: activeAuctionId,
                        secondsLeft: 22,
                      })
                    }
                    className="flex items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-medium text-amber-800 dark:text-amber-300"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Jump to 00:22
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--navy)] px-4 py-2.5 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition-transform active:scale-[0.97]"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#f28c28]" />
        <span>Demo Director</span>
        <ChevronUp className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

