'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Cpu,
  Gavel,
  Lock,
  Radio,
  ScanLine,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VehicleStage } from '@/components/vehicles/VehicleStage';

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

export const ShowcaseLanding: React.FC = () => {
  const { switchPersona, loginWithCredentials, lang, setLang } = useApp();
  const [email, setEmail] = useState('ayse.kaya@gallery-lefkosa.com');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

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
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      setLoginError((err as Error).message);
    }
  };

  return (
    <div className="min-h-dvh bg-[#070c16] text-slate-100">
      {/* Top Editorial Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070c16]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea6a12] to-[#c2410c] text-white">
              <Gavel className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-display text-lg font-extrabold tracking-tight text-white">
                Drive<span className="text-[#f28c28]">Hub</span>
              </div>
              <div className="font-mono-num text-[10px] uppercase tracking-wider text-slate-400">
                EMU CMSE473 · Group 17 · Project #15
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 font-mono-num text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              {lang === 'en' ? 'EN / TR' : 'TR / EN'}
            </button>
            <button
              type="button"
              onClick={() => handleRoleLaunch('user-mehmet')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ea6a12] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[#d45b0a] active:scale-[0.97]"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              {lang === 'tr' ? 'Canlı İhaleye Katıl' : 'Enter Live Auction'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'radial-gradient(circle at 75% 24%, rgba(234,106,18,0.22), transparent 50%), radial-gradient(circle at 18% 82%, rgba(30,58,95,0.45), transparent 55%)',
          }}
        />
        <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 font-mono-num text-[11px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              North Cyprus B2B Automotive Network · 4 Galleries Online
            </div>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
              {lang === 'tr'
                ? 'Araç Yaşam Döngüsü, AI Ekspertiz ve Canlı B2B İhale Tek Platformda.'
                : 'Vehicle Lifecycle, AI Vision Inspection & Sub-15ms Live Auctions.'}
            </h1>

            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-slate-300">
              {lang === 'tr'
                ? 'KKTC otomobil galerileri için geliştirilen çok kiracılı platform: ISO 3779 VIN çözme, 8 açılı çevrimdışı saha ekspertizi, YOLOv8 hasar tespiti, açıklanabilir değerleme ve atomik WebSocket ihale odaları.'
                : 'Multi-tenant infrastructure built for North Cyprus vehicle galleries: ISO 3779 VIN decoding, offline-resilient 8-angle mobile capture, YOLOv8 panel damage detection, transparent market valuation, and zero-collision WebSocket bidding.'}
            </p>

            {/* Concrete Performance Metrics Strip from SRS */}
            <div className="mt-7 grid grid-cols-3 gap-3 border-y border-white/10 py-4">
              <div>
                <div className="font-mono-num text-2xl font-bold text-white">9.4 ms</div>
                <div className="text-[11px] text-slate-400">p99 Bid Latency (&lt;15 ms)</div>
              </div>
              <div>
                <div className="font-mono-num text-2xl font-bold text-[#f28c28]">2.8 s</div>
                <div className="text-[11px] text-slate-400">YOLOv8 Inference (≤4 s)</div>
              </div>
              <div>
                <div className="font-mono-num text-2xl font-bold text-emerald-400">0</div>
                <div className="text-[11px] text-slate-400">Duplicate Bids Accepted</div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRoleLaunch('user-ayse')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ea6a12] px-5 py-3 text-sm font-semibold text-white transition-transform hover:bg-[#d45b0a] active:scale-[0.97]"
              >
                {lang === 'tr' ? 'Galeri Yöneticisi Olarak Aç' : 'Launch Gallery Manager'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRoleLaunch('user-kemal')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12"
              >
                <Smartphone className="h-4 w-4 text-[#f28c28]" />
                {lang === 'tr' ? 'Mobil Ekspertiz Uygulaması' : 'Open Inspector Mobile App'}
              </button>
            </div>
          </motion.div>

          {/* Right Live Interactive VehicleStage Preview */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="lg:col-span-6"
          >
            <VehicleStage
              make="BMW"
              model="320d M-Sport"
              year={2016}
              bodyType="Saloon"
              accentColor="#334155"
              damages={HERO_DAMAGES}
              scanning
              plateBlur
            />
            <div className="mt-3 grid grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">AI Valuation</div>
                <div className="mt-0.5 font-mono-num text-base font-bold text-white">£12,600</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Live Highest Bid</div>
                <div className="mt-0.5 font-mono-num text-base font-bold text-emerald-400">£12,900</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Active Room</div>
                <div className="mt-0.5 font-mono-num text-base font-bold text-[#f28c28]">14 Bidders</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role-Based 1-Click Demo Launchers + Real JWT Login */}
      <section className="mx-auto max-w-[1360px] px-5 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="font-display text-xl font-bold text-white">
              {lang === 'tr' ? 'Rol Bazlı Hızlı Demo Girişi (Multi-Tenant RBAC)' : 'Instant Role Launchers (Multi-Tenant RBAC)'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {lang === 'tr'
                ? 'Her kart gerçek bir HS256 JWT (tenant_id + role) üretir ve ilgili ekranı açar.'
                : 'Each card issues a signed RFC 7519 JWT carrying tenant_id and role claims and opens that workspace.'}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {[
                {
                  id: 'user-ayse',
                  role: 'GALLERY MANAGER',
                  name: 'Ayşe Kaya',
                  tenant: 'Lefkoşa Auto Gallery',
                  desc: 'Manage fleet inventory, review AI valuations, override prices, schedule auctions & export reports.',
                  icon: Building2,
                },
                {
                  id: 'user-mehmet',
                  role: 'WHOLESALE DEALER',
                  name: 'Mehmet Demir',
                  tenant: 'Girne Motors',
                  desc: 'Join live WebSocket auction rooms, inspect AI damage reports, place atomic bids & win hand-over PDFs.',
                  icon: Gavel,
                },
                {
                  id: 'user-kemal',
                  role: 'FIELD INSPECTOR (MOBILE)',
                  name: 'Kemal Arslan',
                  tenant: 'Lefkoşa Auto Gallery',
                  desc: '3-step mobile wizard: ISO 3779 VIN scan, 8-angle offline chunked upload & YOLOv8 human-in-the-loop review.',
                  icon: ScanLine,
                },
                {
                  id: 'user-admin',
                  role: 'PLATFORM ADMIN',
                  name: 'Tolga O. Falay',
                  tenant: 'DriveHub Platform Ops',
                  desc: 'Govern galleries, verify wholesale dealers, inspect append-only audit logs & OpenAPI 3.1 contracts.',
                  icon: ShieldCheck,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={loadingRole === card.id}
                    onClick={() => handleRoleLaunch(card.id)}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-[#f28c28]/50 hover:bg-white/[0.06] active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ea6a12]/15 px-2.5 py-1 font-mono-num text-[10px] font-bold text-[#f28c28]">
                          <Icon className="h-3.5 w-3.5" />
                          {card.role}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#f28c28]" />
                      </div>
                      <div className="mt-3 font-display text-base font-bold text-white">
                        {card.name}{' '}
                        <span className="font-sans text-xs font-normal text-slate-400">
                          · {card.tenant}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard JWT Login Card (UC1) */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Lock className="h-4 w-4 text-[#f28c28]" />
                Multi-Tenant Sign In (UC1)
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Or authenticate directly with email &amp; password (lockout after 5 failed attempts · REQ-1.4).
              </p>

              <form onSubmit={handleManualLogin} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-medium text-slate-300">
                    Work Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/12 bg-[#0b1220] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#f28c28] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-[11px] font-medium text-slate-300">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/12 bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#f28c28] focus:outline-none"
                    required
                  />
                </div>

                {loginError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#0b1220] transition-colors hover:bg-slate-200"
                >
                  Sign In with JWT
                </button>
              </form>

              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-mono-num text-[10px] text-slate-300">
                  <Cpu className="h-3.5 w-3.5 text-[#f28c28]" />
                  Team · Tolga Osman Falay · Davut İnanlar · Safa Burak Şenbahar · Eren Manavoğlu
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

