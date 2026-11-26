'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Clock, RotateCcw, SlidersHorizontal, UserPlus, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useDismiss } from '@/components/ui/useDismiss';

const ROLE_SHORT: Record<string, { en: string; tr: string }> = {
  GALLERY_MANAGER: { en: 'Gallery manager', tr: 'Galeri yöneticisi' },
  INSPECTOR: { en: 'Inspector', tr: 'Eksper' },
  DEALER: { en: 'Dealer', tr: 'Alıcı' },
  PLATFORM_ADMIN: { en: 'Platform admin', tr: 'Platform yöneticisi' },
};

export const DemoDirectorDock: React.FC = () => {
  const {
    user,
    token,
    lang,
    accounts,
    activeAuctionId,
    switchPersona,
    pushToast,
    bumpDataVersion,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

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

  const actionRow =
    'flex h-9 w-full items-center gap-2.5 rounded-[var(--r-md)] px-2.5 text-left text-[13px] text-[var(--ink-primary)] transition-colors duration-100 hover:bg-[var(--bg-hover)] disabled:opacity-45';

  return (
    // flex-col + items-end keeps the toggle anchored to the right edge when the panel mounts
    <div ref={rootRef} className="no-print fixed bottom-4 right-4 z-40 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="mb-2 w-80 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-2.5">
              <span className="text-[13px] font-semibold text-[var(--ink-primary)]">
                {t(lang, 'demoDirector')}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await apiFetch('/api/demo/reset', { method: 'POST' });
                  bumpDataVersion();
                  pushToast('Demo reset', 'Seeded KKTC data restored', 'info');
                }}
                className="inline-flex items-center gap-1 rounded-[var(--r-sm)] px-1.5 py-1 text-xs text-[var(--ink-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)]"
              >
                <RotateCcw className="h-3 w-3" />
                {t(lang, 'reset')}
              </button>
            </div>

            <div className="p-2">
              <div className="eyebrow px-2.5 pb-1 pt-1.5">{t(lang, 'switchRole')}</div>
              <ul>
                {accounts.slice(0, 5).map((acc) => {
                  const isCurrent = user?.id === acc.id;
                  return (
                    <li key={acc.id}>
                      <button
                        type="button"
                        onClick={() => switchPersona(acc.id)}
                        aria-current={isCurrent}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-[var(--r-md)] px-2.5 text-left text-[13px] transition-colors duration-100 ${
                          isCurrent ? 'bg-[var(--brand-subtle)]' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isCurrent ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
                          }`}
                        />
                        <span className="flex-1 truncate font-medium text-[var(--ink-primary)]">{acc.fullName}</span>
                        <span className="truncate text-[11px] text-[var(--ink-muted)]">
                          {ROLE_SHORT[acc.role]?.[lang] ?? acc.role}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-[var(--border-subtle)] p-2">
              <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                <span className="eyebrow">{t(lang, 'liveTriggers')}</span>
                <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">{activeAuctionId}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runDemoAction('Race condition tested', '/api/demo/race-condition', {
                    auctionId: activeAuctionId,
                  })
                }
                className={actionRow}
              >
                <Zap className="h-4 w-4 text-[var(--danger)]" />
                <span className="flex-1">{t(lang, 'simulateCollision')}</span>
                <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">REQ-7.3</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runDemoAction('Rival dealer bid placed', '/api/demo/rival-bid', {
                    auctionId: activeAuctionId,
                  })
                }
                className={actionRow}
              >
                <UserPlus className="h-4 w-4 text-[var(--ink-muted)]" />
                <span className="flex-1">{t(lang, 'rivalBid')}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runDemoAction('Timer set to 00:22', '/api/demo/fast-forward', {
                    auctionId: activeAuctionId,
                    secondsLeft: 22,
                  })
                }
                className={actionRow}
              >
                <Clock className="h-4 w-4 text-[var(--warning)]" />
                <span className="flex-1">{t(lang, 'jumpTo22')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-[var(--r-md)] border border-[var(--ink-primary)] bg-[var(--ink-primary)] px-3.5 text-[13px] font-medium text-white shadow-[var(--shadow-md)] transition-[background-color,transform] duration-150 hover:bg-[#333] active:translate-y-px"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-[#f59a5c]" />
        <span>{t(lang, 'demoDirector')}</span>
        <ChevronUp className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
