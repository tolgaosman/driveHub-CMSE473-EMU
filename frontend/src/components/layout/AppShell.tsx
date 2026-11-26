'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Car,
  LayoutTemplate,
  LogOut,
  Menu,
  PlusCircle,
  Radio,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { Role } from '@shared/contracts';
import { RouteId, useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { LanguageMenu } from '@/components/ui/LanguageMenu';
import { useDismiss } from '@/components/ui/useDismiss';

interface NavItem {
  id: RouteId;
  labelKey: Parameters<typeof t>[1];
  icon: React.FC<{ className?: string }>;
  roles: Role[];
  live?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inventory', labelKey: 'navInventory', icon: Car, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'inspector', labelKey: 'navInspector', icon: Smartphone, roles: ['INSPECTOR', 'GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'schedule', labelKey: 'navSchedule', icon: PlusCircle, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'live-room', labelKey: 'navLiveRoom', icon: Radio, roles: ['DEALER', 'GALLERY_MANAGER', 'PLATFORM_ADMIN'], live: true },
  { id: 'reports', labelKey: 'navReports', icon: BarChart3, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'admin', labelKey: 'navAdmin', icon: Shield, roles: ['PLATFORM_ADMIN', 'GALLERY_MANAGER'] },
];

const ROLE_LABEL: Record<Role, { en: string; tr: string }> = {
  GALLERY_MANAGER: { en: 'Gallery manager', tr: 'Galeri yöneticisi' },
  INSPECTOR: { en: 'Field inspector', tr: 'Saha eksperi' },
  DEALER: { en: 'Wholesale dealer', tr: 'Toptan alıcı' },
  PLATFORM_ADMIN: { en: 'Platform admin', tr: 'Platform yöneticisi' },
};

const NOTIFICATIONS = [
  { title: 'AI report ready · Nissan Qashqai', detail: '2.6 s · 1 scratch (87%) · £11,200', time: '2m' },
  { title: 'Reserve met · BMW 320d 2016', detail: '£12,900 with 14 bidders in room', time: '9m' },
  { title: 'Hand-over certificate ready', detail: 'Mazda CX-5 2018 settled at £15,200', time: '1h' },
];

export const Wordmark: React.FC<{ sub?: string }> = ({ sub }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
      drive<span className="text-[var(--brand)]">hub</span>
    </span>
    {sub && <span className="hidden font-mono-num text-[10px] sm:inline uppercase tracking-wider text-[var(--ink-muted)]">{sub}</span>}
  </div>
);

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    route,
    setRoute,
    lang,
    currency,
    setCurrency,
    logout,
    toasts,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const closeNotif = useCallback(() => setNotifOpen(false), []);
  useDismiss(notifRef, notifOpen, closeNotif);

  const visibleNav = user
    ? NAV_ITEMS.filter((item) => item.roles.includes(user.role))
    : NAV_ITEMS;

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-5">
        <button type="button" onClick={() => setRoute('landing')} className="text-left">
          <Wordmark sub="KKTC" />
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-[var(--r-sm)] p-1.5 text-[var(--ink-muted)] hover:bg-[var(--bg-hover)] lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label="Primary">
        <div className="eyebrow px-2.5 pb-2">{lang === 'tr' ? 'Çalışma alanı' : 'Workspace'}</div>
        <ul className="space-y-px">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRoute(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-8 w-full items-center gap-2.5 rounded-[var(--r-md)] px-2.5 text-[13px] transition-colors duration-100 ${
                    active
                      ? 'bg-[var(--bg-sidebar-active)] font-medium text-[var(--ink-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {active && (
                    <span className="absolute -left-3 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[var(--brand)]" />
                  )}
                  <Icon className={`h-4 w-4 ${active ? 'text-[var(--brand)]' : 'text-[var(--ink-muted)]'}`} />
                  <span className="flex-1 text-left">{t(lang, item.labelKey)}</span>
                  {item.live && (
                    <span className="flex items-center gap-1 font-mono-num text-[10px] font-medium text-[var(--danger)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                      LIVE
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mx-2.5 my-4 border-t border-[var(--border-subtle)]" />

        <button
          type="button"
          onClick={() => {
            setRoute('landing');
            setMobileMenuOpen(false);
          }}
          className="flex h-8 w-full items-center gap-2.5 rounded-[var(--r-md)] px-2.5 text-[13px] text-[var(--ink-secondary)] transition-colors duration-100 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--ink-primary)]"
        >
          <LayoutTemplate className="h-4 w-4 text-[var(--ink-muted)]" />
          <span>{t(lang, 'navLanding')}</span>
        </button>
      </nav>

      {user && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3.5">
          <div className="eyebrow">{t(lang, 'tenantLabel')}</div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-[var(--ink-primary)]">{user.tenantName}</div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface-subtle)] font-mono-num text-[11px] font-semibold text-[var(--ink-secondary)] ring-1 ring-[var(--border-subtle)]">
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-[var(--ink-primary)]">{user.fullName}</div>
              <div className="truncate text-[11px] text-[var(--ink-muted)]">{ROLE_LABEL[user.role][lang]}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-[var(--r-sm)] p-1.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)]"
              title={t(lang, 'signOut')}
              aria-label={t(lang, 'signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const toastBar: Record<string, string> = {
    info: 'bg-[var(--info)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
  };

  return (
    <div className="flex min-h-dvh bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <aside className="no-print hidden w-60 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">{sidebarContent}</div>
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex bg-[var(--scrim)] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-64"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-[var(--r-md)] border border-[var(--border-subtle)] p-1.5 text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            {user && (
              <div className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
                <span className="truncate text-[var(--ink-muted)]">{user.tenantName}</span>
                <span className="text-[var(--border-strong)]">/</span>
                <span className="truncate font-medium text-[var(--ink-primary)]">
                  {route === 'landing'
                    ? t(lang, 'navLanding')
                    : t(lang, NAV_ITEMS.find((n) => n.id === route)?.labelKey ?? 'navDashboard')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Currency */}
            <div
              role="radiogroup"
              aria-label="Currency"
              className="inline-flex h-8 items-center rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-0.5 text-xs"
            >
              {(['GBP', 'TRY'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  role="radio"
                  aria-checked={currency === cur}
                  onClick={() => setCurrency(cur)}
                  className={`h-full rounded-[3px] px-2 font-mono-num transition-colors duration-100 ${
                    currency === cur
                      ? 'bg-[var(--bg-surface-subtle)] font-semibold text-[var(--ink-primary)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {cur === 'GBP' ? '£ GBP' : '₺ TRY'}
                </button>
              ))}
            </div>

            <LanguageMenu />

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-expanded={notifOpen}
                className="relative flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
                aria-label={t(lang, 'notifications')}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-1 w-80 rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)]"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-2.5">
                      <span className="text-[13px] font-semibold">{t(lang, 'notifications')}</span>
                      <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">{NOTIFICATIONS.length}</span>
                    </div>
                    <ul className="divide-y divide-[var(--border-subtle)]">
                      {NOTIFICATIONS.map((n) => (
                        <li key={n.title} className="flex gap-3 px-4 py-3 text-xs">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[var(--ink-primary)]">{n.title}</div>
                            <div className="mt-0.5 text-[var(--ink-secondary)]">{n.detail}</div>
                          </div>
                          <span className="font-mono-num text-[11px] text-[var(--ink-muted)]">{n.time}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Toasts */}
      <div className="no-print pointer-events-none fixed right-4 top-16 z-50 flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-auto flex overflow-hidden rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]"
            >
              <span className={`w-[3px] shrink-0 ${toastBar[toast.tone]}`} />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0 text-xs">
                  <div className="font-medium text-[var(--ink-primary)]">{toast.title}</div>
                  {toast.detail && <div className="mt-0.5 text-[var(--ink-secondary)]">{toast.detail}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
