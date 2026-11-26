'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VehicleStage } from '@/components/vehicles/VehicleStage';
import { Wordmark } from '@/components/layout/AppShell';
import { LanguageMenu } from '@/components/ui/LanguageMenu';
import { Field, buttonClass, inputClass } from '@/components/ui/primitives';

const HERO_DAMAGES = [
  {
    id: 'hero-1',
    angle: 'right' as const,
    panel: 'Front door, right side',
    type: 'DENT' as const,
    confidence: 0.91,
    bbox: { x: 54, y: 46, width: 18, height: 17 },
    source: 'AI' as const,
    confirmedByInspector: true,
    estimatedDeductionGbp: 350,
  },
  {
    id: 'hero-2',
    angle: 'rear' as const,
    panel: 'Rear bumper',
    type: 'SCRATCH' as const,
    confidence: 0.84,
    bbox: { x: 15, y: 52, width: 15, height: 13 },
    source: 'AI' as const,
    confirmedByInspector: true,
    estimatedDeductionGbp: 200,
  },
];

const ROLES = [
  {
    id: 'user-ayse',
    role: { en: 'Gallery manager', tr: 'Galeri yöneticisi' },
    name: 'Ayşe Kaya',
    tenant: 'Lefkoşa Auto Gallery',
    desc: {
      en: 'Stock, AI valuations, price overrides, auction scheduling and reports.',
      tr: 'Stok, AI değerlemeleri, fiyat düzeltme, ihale planlama ve raporlar.',
    },
  },
  {
    id: 'user-mehmet',
    role: { en: 'Wholesale dealer', tr: 'Toptan alıcı' },
    name: 'Mehmet Demir',
    tenant: 'Girne Motors',
    desc: {
      en: 'Joins live rooms, reads damage reports, bids and receives hand-over papers.',
      tr: 'Canlı odalara katılır, hasar raporlarını okur, teklif verir, teslim belgesini alır.',
    },
  },
  {
    id: 'user-kemal',
    role: { en: 'Field inspector', tr: 'Saha eksperi' },
    name: 'Kemal Arslan',
    tenant: 'Lefkoşa Auto Gallery',
    desc: {
      en: 'Scans the VIN, shoots 8 angles offline and confirms detected damage.',
      tr: 'VIN okutur, çevrimdışı 8 açı çeker ve tespit edilen hasarları onaylar.',
    },
  },
  {
    id: 'user-admin',
    role: { en: 'Platform admin', tr: 'Platform yöneticisi' },
    name: 'Tolga O. Falay',
    tenant: 'DriveHub Platform Ops',
    desc: {
      en: 'Onboards galleries, verifies dealers and reviews the audit log.',
      tr: 'Galerileri ekler, alıcıları doğrular ve denetim kaydını inceler.',
    },
  },
];

const METRICS = [
  { value: '9.4 ms', label: { en: 'p99 bid latency', tr: 'p99 teklif gecikmesi' }, target: '< 15 ms' },
  { value: '2.8 s', label: { en: 'Damage scan per car', tr: 'Araç başı hasar taraması' }, target: '≤ 4 s' },
  { value: '0', label: { en: 'Duplicate bids accepted', tr: 'Kabul edilen mükerrer teklif' }, target: 'REQ-7.3' },
];

const STEPS = [
  {
    n: '01',
    title: { en: 'Register', tr: 'Kayıt' },
    body: {
      en: 'VIN is decoded (ISO 3779) and the car enters the gallery’s stock.',
      tr: 'VIN çözülür (ISO 3779), araç galerinin stoğuna girer.',
    },
  },
  {
    n: '02',
    title: { en: 'Inspect', tr: 'Ekspertiz' },
    body: {
      en: 'Inspector shoots 8 angles; YOLOv8 marks dents and scratches for review.',
      tr: 'Eksper 8 açı çeker; YOLOv8 göçük ve çizikleri onaya sunar.',
    },
  },
  {
    n: '03',
    title: { en: 'Value', tr: 'Değerleme' },
    body: {
      en: 'Market price minus confirmed damage gives a range the manager can override.',
      tr: 'Piyasa fiyatından onaylı hasar düşülür; yönetici aralığı düzeltebilir.',
    },
  },
  {
    n: '04',
    title: { en: 'Auction', tr: 'İhale' },
    body: {
      en: 'Verified dealers bid live with a hidden reserve and anti-sniping extensions.',
      tr: 'Doğrulanmış alıcılar gizli rezerv ve uzatma kuralıyla canlı teklif verir.',
    },
  },
];

export const ShowcaseLanding: React.FC = () => {
  const { switchPersona, loginWithCredentials, lang } = useApp();
  const [email, setEmail] = useState('ayse.kaya@gallery-lefkosa.com');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const tr = lang === 'tr';

  const handleRoleLaunch = async (userId: string) => {
    setLoadingRole(userId);
    try {
      await switchPersona(userId);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSigningIn(true);
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Wordmark sub="KKTC" />
          <div className="flex items-center gap-2">
            <LanguageMenu />
            <button
              type="button"
              onClick={() => handleRoleLaunch('user-mehmet')}
              className={buttonClass('dark', 'sm', 'h-8')}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b4a]" />
              {tr ? 'Canlı ihaleye katıl' : 'Join live auction'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pt-16">
          <div className="lg:col-span-5">
            <div className="eyebrow">
              {tr ? 'Kuzey Kıbrıs galerileri için' : 'For North Cyprus vehicle galleries'}
            </div>
            <h1 className="mt-4 text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
              {tr
                ? 'Ekspertizden ihaleye, bir aracın tüm yolu.'
                : 'From inspection to auction, one record per car.'}
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              {tr
                ? 'Galeriler aracı VIN ile kaydeder, eksper sahada 8 açıdan çeker, yapay zekâ hasarı işaretler ve araç doğrulanmış alıcılara canlı ihaleyle satılır.'
                : 'Galleries register a car by VIN, an inspector photographs it on site, the model flags damage, and verified dealers buy it in a live auction.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRoleLaunch('user-ayse')}
                className={buttonClass('primary', 'lg')}
              >
                {tr ? 'Galeri panelini aç' : 'Open gallery workspace'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRoleLaunch('user-kemal')}
                className={buttonClass('secondary', 'lg')}
              >
                {tr ? 'Eksper uygulaması' : 'Inspector app'}
              </button>
            </div>

            <dl className="mt-10 grid grid-cols-3 border-t border-[var(--border-strong)]">
              {METRICS.map((m, i) => (
                <div
                  key={m.value}
                  className={`pt-4 ${i > 0 ? 'border-l border-[var(--border-subtle)] pl-4' : 'pr-4'}`}
                >
                  <dd className="font-mono-num text-2xl font-medium tracking-tight">{m.value}</dd>
                  <dt className="mt-1 text-xs leading-snug text-[var(--ink-secondary)]">{m.label[lang]}</dt>
                  <div className="mt-1 font-mono-num text-[10px] text-[var(--ink-muted)]">{m.target}</div>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-7">
            <VehicleStage
              make="BMW"
              model="320d M-Sport"
              year={2016}
              bodyType="Saloon"
              accentColor="#4b5563"
              damages={HERO_DAMAGES}
              scanning
              plateBlur
            />
            <div className="mt-2 grid grid-cols-3 divide-x divide-[var(--border-subtle)] rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
              <div className="px-4 py-3">
                <div className="text-[var(--ink-muted)]">{tr ? 'AI değerleme' : 'AI valuation'}</div>
                <div className="mt-0.5 font-mono-num text-[15px] font-medium">£12,600</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[var(--ink-muted)]">{tr ? 'En yüksek teklif' : 'Highest bid'}</div>
                <div className="mt-0.5 font-mono-num text-[15px] font-medium text-[var(--success)]">£12,900</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[var(--ink-muted)]">{tr ? 'Odada' : 'In room'}</div>
                <div className="mt-0.5 font-mono-num text-[15px] font-medium">
                  14 {tr ? 'alıcı' : 'dealers'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <ol className="mx-auto grid max-w-[1240px] grid-cols-1 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className={`py-7 lg:pr-6 ${i > 0 ? 'lg:border-l lg:border-[var(--border-subtle)] lg:pl-6' : ''}`}
            >
              <div className="font-mono-num text-xs text-[var(--brand)]">{s.n}</div>
              <div className="mt-2 text-[15px] font-semibold">{s.title[lang]}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-secondary)]">{s.body[lang]}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles + sign in */}
      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="text-xl font-semibold">{tr ? 'Bir rolle giriş yap' : 'Sign in as a role'}</h2>
            <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
              {tr
                ? 'Her satır, kiracı ve rol bilgisini taşıyan gerçek bir JWT üretir.'
                : 'Each row issues a real JWT carrying the tenant and role claims.'}
            </p>

            <ul className="mt-5 divide-y divide-[var(--border-subtle)] rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {ROLES.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={loadingRole !== null}
                    onClick={() => handleRoleLaunch(r.id)}
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors duration-100 hover:bg-[var(--bg-hover)] disabled:opacity-60 sm:grid-cols-[180px_1fr_auto]"
                  >
                    <div>
                      <div className="text-[13px] font-semibold">{r.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--ink-muted)]">{r.role[lang]}</div>
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <div className="text-[13px] text-[var(--ink-secondary)]">{r.desc[lang]}</div>
                      <div className="mt-0.5 font-mono-num text-[11px] text-[var(--ink-muted)]">{r.tenant}</div>
                    </div>
                    {loadingRole === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--ink-muted)]" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-[var(--ink-muted)] transition-[color,transform] duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-[var(--brand)]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-xl font-semibold">{tr ? 'E-posta ile giriş' : 'Sign in with email'}</h2>
            <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
              {tr ? '5 hatalı denemeden sonra hesap kilitlenir.' : 'Accounts lock after 5 failed attempts.'}
            </p>

            <form
              onSubmit={handleManualLogin}
              className="mt-5 space-y-4 rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <Field label={tr ? 'İş e-postası' : 'Work email'} htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={tr ? 'Parola' : 'Password'} htmlFor="login-password">
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              {loginError && (
                <p role="alert" className="text-xs text-[var(--danger)]">
                  {loginError}
                </p>
              )}

              <button type="submit" disabled={signingIn} className={buttonClass('dark', 'md', 'w-full')}>
                {signingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                {tr ? 'Giriş yap' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-[var(--ink-muted)] sm:px-8">
          <span>EMU CMSE473 · Group 17 · Project #15</span>
          <span>Tolga Osman Falay · Davut İnanlar · Safa Burak Şenbahar · Eren Manavoğlu</span>
        </div>
      </footer>
    </div>
  );
};
