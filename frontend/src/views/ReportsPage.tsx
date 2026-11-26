'use client';

import React, { useEffect, useState } from 'react';
import { Download, Printer, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';

interface ReportSummary {
  kpis: {
    vehiclesSoldMonth: number;
    sellThroughRate: number;
    avgFinalVsAiPct: number;
    p99BidLatencyMs: number;
  };
  monthlyInspections: { month: string; inspected: number; sold: number }[];
  damageBreakdown: { type: string; percentage: number; count: number }[];
  latencyBuckets: { range: string; pct: number }[];
}

export const ReportsPage: React.FC = () => {
  const { token, pushToast } = useApp();
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<ReportSummary>('/api/reports/summary', { token })
      .then(setData)
      .catch(() => {});
  }, [token]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Month', 'Vehicles Inspected', 'Vehicles Sold'],
      ...data.monthlyInspections.map((m) => [m.month, String(m.inspected), String(m.sold)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drivehub-analytics-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    pushToast('CSV Exported', 'drivehub-analytics-report.csv downloaded (REQ-8.4)', 'success');
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--ink-muted)]">
        Loading analytics &amp; TimescaleDB metrics…
      </div>
    );
  }

  const maxInspected = Math.max(...data.monthlyInspections.map((m) => m.inspected));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--ink-primary)] sm:text-3xl">
            Reports &amp; Analytics (UC12)
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Sell-through performance, AI valuation accuracy, exterior defect distribution, and WebSocket p99 telemetry.
          </p>
        </div>

        <div className="no-print flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-xs font-bold text-white hover:opacity-95"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* 4 KPI Cards (Upgraded w4) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Vehicles sold (Nov)', value: String(data.kpis.vehiclesSoldMonth), sub: '+24% vs Oct' },
          { label: 'Auction sell-through rate', value: `${data.kpis.sellThroughRate}%`, sub: 'reserve met' },
          { label: 'Avg. final / AI price', value: `${data.kpis.avgFinalVsAiPct}%`, sub: 'valuation accuracy' },
          { label: 'Avg. bid latency (p99)', value: `${data.kpis.p99BidLatencyMs} ms`, sub: 'target < 15 ms (NFR-P1)' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]"
          >
            <div className="text-xs font-medium text-[var(--ink-muted)]">{k.label}</div>
            <div className="mt-2 font-mono-num text-3xl font-extrabold text-[var(--ink-primary)]">
              {k.value}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly Bar Chart */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)] lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              Vehicles Inspected vs. Sold per Month
            </h2>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#142542] dark:bg-slate-400" />
                Inspected
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#ea6a12]" />
                Sold
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-56 items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
            {data.monthlyInspections.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-44 w-full items-end justify-center gap-1.5">
                  <div
                    style={{ height: `${(m.inspected / maxInspected) * 100}%` }}
                    className="w-5 rounded-t-md bg-[#142542] transition-all dark:bg-slate-400 sm:w-7"
                    title={`${m.month}: ${m.inspected} inspected`}
                  />
                  <div
                    style={{ height: `${(m.sold / maxInspected) * 100}%` }}
                    className="w-5 rounded-t-md bg-[#ea6a12] transition-all sm:w-7"
                    title={`${m.month}: ${m.sold} sold`}
                  />
                </div>
                <span className="font-mono-num text-xs font-semibold text-[var(--ink-muted)]">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Damage Distribution + Latency Histogram */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              Most Common AI Damage Types
            </h2>
            <div className="mt-4 space-y-3">
              {data.damageBreakdown.map((d) => (
                <div key={d.type}>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--ink-primary)]">{d.type}</span>
                    <span className="font-mono-num text-[var(--ink-secondary)]">
                      {d.percentage}% ({d.count})
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
                    <div
                      style={{ width: `${d.percentage}%` }}
                      className="h-full rounded-full bg-[#ea6a12]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              WebSocket Atomic Bid Latency (LOG-2)
            </h2>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {data.latencyBuckets.map((b) => (
                <div
                  key={b.range}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3"
                >
                  <div className="font-mono-num text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {b.pct}%
                  </div>
                  <div className="mt-0.5 font-mono-num text-[10px] text-[var(--ink-muted)]">
                    {b.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

