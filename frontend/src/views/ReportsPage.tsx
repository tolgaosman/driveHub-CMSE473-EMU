'use client';

import React, { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { Button, PageHeader, Panel } from '@/components/ui/primitives';

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
  const { token, lang, pushToast } = useApp();
  const tr = lang === 'tr';
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
      <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[13px] text-[var(--ink-muted)]">
        {tr ? 'Raporlar yükleniyor…' : 'Loading reports…'}
      </div>
    );
  }

  const maxInspected = Math.max(...data.monthlyInspections.map((m) => m.inspected));
  const kpis = [
    { label: tr ? 'Satılan araç (Kasım)' : 'Vehicles sold (Nov)', value: String(data.kpis.vehiclesSoldMonth), sub: tr ? 'Ekim’e göre +%24' : '+24% vs Oct' },
    { label: tr ? 'İhale satış oranı' : 'Auction sell-through', value: `${data.kpis.sellThroughRate}%`, sub: tr ? 'rezervi karşılayan' : 'reserve met' },
    { label: tr ? 'Satış / AI fiyatı' : 'Final vs AI price', value: `${data.kpis.avgFinalVsAiPct}%`, sub: tr ? 'değerleme isabeti' : 'valuation accuracy' },
    { label: tr ? 'Teklif gecikmesi (p99)' : 'Bid latency (p99)', value: `${data.kpis.p99BidLatencyMs} ms`, sub: tr ? 'hedef < 15 ms' : 'target < 15 ms' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr ? 'Raporlar' : 'Reports'}
        description={
          tr
            ? 'Satış performansı, değerleme isabeti, hasar dağılımı ve teklif gecikmesi.'
            : 'Sales performance, valuation accuracy, damage mix and bid latency.'
        }
        actions={
          <div className="no-print flex gap-2">
            <Button onClick={exportCsv}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="dark" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              PDF
            </Button>
          </div>
        }
      />

      <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={`border-[var(--border-subtle)] px-5 py-4 ${i % 2 === 1 ? 'border-l' : ''} ${
              i >= 2 ? 'border-t xl:border-t-0' : ''
            } ${i === 2 ? 'xl:border-l' : ''}`}
          >
            <dt className="text-xs text-[var(--ink-secondary)]">{k.label}</dt>
            <dd className="mt-1.5 font-mono-num text-[26px] font-medium leading-none tracking-tight">{k.value}</dd>
            <div className="mt-2 text-xs text-[var(--ink-muted)]">{k.sub}</div>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7"
          title={tr ? 'Aylık ekspertiz ve satış' : 'Inspected vs sold per month'}
          actions={
            <div className="flex items-center gap-3 text-[11px] text-[var(--ink-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-[#c9c6be]" />
                {tr ? 'Ekspertiz' : 'Inspected'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-[var(--brand)]" />
                {tr ? 'Satış' : 'Sold'}
              </span>
            </div>
          }
        >
          <div className="flex h-56 items-end justify-between gap-3 border-b border-[var(--border-strong)]">
            {data.monthlyInspections.map((m) => (
              <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    style={{ height: `${(m.inspected / maxInspected) * 100}%` }}
                    className="relative w-4 rounded-t-[2px] bg-[#c9c6be] sm:w-6"
                    title={`${m.month}: ${m.inspected}`}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono-num text-[10px] text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                      {m.inspected}
                    </span>
                  </div>
                  <div
                    style={{ height: `${(m.sold / maxInspected) * 100}%` }}
                    className="relative w-4 rounded-t-[2px] bg-[var(--brand)] sm:w-6"
                    title={`${m.month}: ${m.sold}`}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono-num text-[10px] text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
                      {m.sold}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-3">
            {data.monthlyInspections.map((m) => (
              <span key={m.month} className="flex-1 text-center font-mono-num text-[11px] text-[var(--ink-muted)]">
                {m.month}
              </span>
            ))}
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-5">
          <Panel title={tr ? 'En sık hasar türleri' : 'Most common damage types'}>
            <ul className="space-y-3">
              {data.damageBreakdown.map((d) => (
                <li key={d.type}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium capitalize">{d.type.toLowerCase()}</span>
                    <span className="font-mono-num text-[var(--ink-secondary)]">
                      {d.percentage}% <span className="text-[var(--ink-muted)]">· {d.count}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
                    <div style={{ width: `${d.percentage}%` }} className="h-full rounded-full bg-[var(--ink-primary)]" />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={tr ? 'Teklif gecikmesi dağılımı' : 'Bid latency distribution'} meta="LOG-2" bodyClassName="p-0">
            <dl className="grid grid-cols-4 divide-x divide-[var(--border-subtle)] text-center">
              {data.latencyBuckets.map((b) => (
                <div key={b.range} className="px-2 py-4">
                  <dd className="font-mono-num text-lg font-medium">{b.pct}%</dd>
                  <dt className="mt-0.5 font-mono-num text-[10px] text-[var(--ink-muted)]">{b.range}</dt>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
};
