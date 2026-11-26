'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileText, Printer, ShieldCheck, X } from 'lucide-react';
import { Auction, Vehicle } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { formatMoney } from '@/lib/i18n';

interface HandoverModalProps {
  open: boolean;
  auction: Auction | null;
  vehicle: Vehicle | null;
  onClose: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  open,
  auction,
  vehicle,
  onClose,
}) => {
  const { currency, exchangeRate } = useApp();

  return (
    <AnimatePresence>
      {open && auction && vehicle && auction.sale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 text-[var(--ink-primary)] shadow-[var(--shadow-lg)] sm:p-8"
          >
            <div className="no-print mb-4 flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                <FileText className="h-4 w-4 text-[var(--brand)]" />
                UC18 · Official Vehicle Hand-Over Agreement (REQ-6.7)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-secondary)]"
                  aria-label="Close certificate"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Document */}
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b-2 border-[var(--ink-primary)] pb-4">
                <div>
                  <div className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
                    Drive<span className="text-[var(--brand)]">Hub</span>
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    B2B Wholesale Vehicle Settlement &amp; Inspection Hand-Over Record
                  </div>
                </div>
                <div className="text-right font-mono-num text-xs">
                  <div className="font-semibold text-[var(--ink-primary)]">SALE ID: {auction.sale.id}</div>
                  <div className="text-[var(--ink-muted)]">
                    Settled: {new Date(auction.sale.soldAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4 text-xs">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Seller Gallery (Tenant)
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
                    {auction.tenantName}
                  </div>
                  <div className="text-[var(--ink-muted)]">North Cyprus Verified Tenant</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Winning Wholesale Buyer
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
                    {auction.sale.winningTenantName}
                  </div>
                  <div className="text-[var(--ink-muted)]">Verified B2B Dealer</div>
                </div>
              </div>

              <div className="rounded-md border border-[var(--border-subtle)] p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Vehicle &amp; AI Inspection Summary
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-[var(--ink-muted)]">Vehicle:</span>{' '}
                    <strong>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)]">VIN:</span>{' '}
                    <strong className="font-mono-num">{vehicle.vin}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)]">Mileage:</span>{' '}
                    <strong className="font-mono-num">
                      {vehicle.mileageKm.toLocaleString('en-GB')} km
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)]">AI Model:</span>{' '}
                    <strong className="font-mono-num">
                      {vehicle.inspection?.modelVersion ?? 'yolov8s-drivehub-v1.4'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)]">Confirmed Damages:</span>{' '}
                    <strong>
                      {vehicle.inspection?.damages.filter((d) => d.confirmedByInspector !== false)
                        .length ?? 0}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)]">AI Valuation:</span>{' '}
                    <strong className="font-mono-num">
                      {vehicle.valuation
                        ? formatMoney(vehicle.valuation.suggestedPrice, currency, exchangeRate)
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-[var(--ink-primary)] px-5 py-4 text-white">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Final Settled Auction Price (BR-7)
                  </div>
                  <div className="mt-0.5 text-xs text-[#c9c6be]">
                    Atomic Sequence #{auction.sequenceNo} · Reserve Met ✓
                  </div>
                </div>
                <div className="font-mono-num text-3xl font-semibold text-[var(--brand)]">
                  {formatMoney(auction.sale.finalPrice, currency, exchangeRate)}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--ink-muted)]">
                <div className="flex items-center gap-1.5 text-[var(--success)]">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-mono-num font-semibold">
                    Audit Digest: {auction.sale.certificateHash}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[var(--ink-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                  TRNC Law 89/2007 Compliant Record
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

