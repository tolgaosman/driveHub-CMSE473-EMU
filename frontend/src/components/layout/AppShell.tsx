'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Car,
  Gavel,
  Globe,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Radio,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { Role } from '@shared/contracts';
import { RouteId, useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';

interface NavItem {
  id: RouteId;
  labelKey: Parameters<typeof t>[1];
  icon: React.FC<{ className?: string }>;
  roles: Role[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inventory', labelKey: 'navInventory', icon: Car, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'inspector', labelKey: 'navInspector', icon: Smartphone, roles: ['INSPECTOR', 'GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'schedule', labelKey: 'navSchedule', icon: PlusCircle, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'live-room', labelKey: 'navLiveRoom', icon: Radio, roles: ['DEALER', 'GALLERY_MANAGER', 'PLATFORM_ADMIN'], badge: 'LIVE' },
  { id: 'reports', labelKey: 'navReports', icon: BarChart3, roles: ['GALLERY_MANAGER', 'PLATFORM_ADMIN'] },
  { id: 'admin', labelKey: 'navAdmin', icon: Shield, roles: ['PLATFORM_ADMIN', 'GALLERY_MANAGER'] },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    route,
    setRoute,
    lang,
    setLang,
    currency,
    setCurrency,
    darkMode,
    toggleDarkMode,
    logout,
    toasts,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const visibleNav = user
    ? NAV_ITEMS.filter((item) => item.roles.includes(user.role))
    : NAV_ITEMS;

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--bg-sidebar)] text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <button
          type="button"
          onClick={() => setRoute('landing')}
          className="flex items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea6a12] to-[#c2410c] text-white shadow-sm">
            <Gavel className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold leading-none tracking-tight text-white">
              Drive<span className="text-[#f28c28]">Hub</span>
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              KKTC · CMSE473
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary Navigation">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRoute(item.id);
                setMobileMenuOpen(false);
              }}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-[var(--bg-sidebar-hover)] hover:text-slate-100'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                  className="absolute inset-0 rounded-xl border border-[#f28c28]/30 bg-[var(--bg-sidebar-active)]"
                />
              )}
              <Icon className={`relative z-10 h-4.5 w-4.5 ${active ? 'text-[#f28c28]' : ''}`} />
              <span className="relative z-10 flex-1 text-left">{t(lang, item.labelKey)}</span>
              {item.badge && (
                <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-3 border-t border-white/8" />

        <button
          type="button"
          onClick={() => {
            setRoute('landing');
            setMobileMenuOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
        >
          <Sparkles className="h-4.5 w-4.5 text-[#f28c28]" />
          <span>{t(lang, 'navLanding')}</span>
        </button>
      </nav>

      {/* Tenant & Account Footer */}
      {user && (
        <div className="border-t border-white/8 p-4">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t(lang, 'tenantLabel')}
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-white">
              {user.tenantName}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-slate-200">{user.fullName}</div>
                <div className="truncate font-mono-num text-[10px] text-[#f28c28]">
                  {user.role}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                title={t(lang, 'signOut')}
                aria-label={t(lang, 'signOut')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -270 }}
              animate={{ x: 0 }}
              exit={{ x: -270 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-68"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="no-print sticky top-0 z-30 flex h-15 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/88 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-[var(--ink-muted)] sm:flex">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono-num">WSS RFC 6455 · JWT RBAC</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Switch (£ / ₺) */}
            <div className="inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-0.5 text-xs font-semibold">
              {(['GBP', 'TRY'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    currency === cur
                      ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {cur === 'GBP' ? '£ GBP' : '₺ TRY'}
                </button>
              ))}
            </div>

            {/* Language Switch (EN / TR) */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang.toUpperCase()}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] font-mono-num text-[10px] font-bold text-white">
                  3
                </span>
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-lg)]"
                  >
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                        Live Alerts
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[var(--brand)] hover:underline"
                      >
                        Close
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="rounded-xl bg-[var(--bg-surface-subtle)] p-2.5">
                        <div className="font-semibold text-[var(--ink-primary)]">AI Report Ready · Nissan Qashqai</div>
                        <div className="mt-0.5 text-[var(--ink-secondary)]">Analysed in 2.6 s · 1 scratch (87%) · £11,200</div>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-surface-subtle)] p-2.5">
                        <div className="font-semibold text-[var(--ink-primary)]">Live Auction Reserve Met</div>
                        <div className="mt-0.5 text-[var(--ink-secondary)]">BMW 320d 2016 reached £12,900 (14 bidders)</div>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-surface-subtle)] p-2.5">
                        <div className="font-semibold text-[var(--ink-primary)]">Hand-Over Certificate Ready</div>
                        <div className="mt-0.5 text-[var(--ink-secondary)]">Mazda CX-5 2018 settled at £15,200</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user && (
              <div className="hidden items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 md:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--navy)] font-mono-num text-[11px] font-bold text-white">
                  {user.avatarInitials}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-semibold text-[var(--ink-primary)]">{user.fullName}</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">{user.tenantName}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Toast Stack */}
      <div className="no-print pointer-events-none fixed right-4 top-18 z-50 flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-auto flex items-start justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-md)]"
            >
              <div className="min-w-0 text-xs">
                <div className="font-semibold text-[var(--ink-primary)]">{toast.title}</div>
                {toast.detail && (
                  <div className="mt-0.5 text-[var(--ink-secondary)]">{toast.detail}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

