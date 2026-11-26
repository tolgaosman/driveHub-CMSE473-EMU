'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Code2, Shield, ShieldAlert } from 'lucide-react';
import { AuditLogEntry, Tenant } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';

export const AdminConsolePage: React.FC = () => {
  const { token, user, dataVersion, pushToast } = useApp();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [openApi, setOpenApi] = useState<Record<string, unknown> | null>(null);
  const [logFilter, setLogFilter] = useState('');

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [overview, spec] = await Promise.all([
        apiFetch<{ tenants: Tenant[]; auditLogs: AuditLogEntry[] }>('/api/admin/overview', { token }),
        apiFetch<Record<string, unknown>>('/api/openapi.json'),
      ]);
      setTenants(overview.tenants);
      setAuditLogs(overview.auditLogs);
      setOpenApi(spec);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData, dataVersion]);

  const toggleTenantField = async (tenantId: string, field: 'isActive' | 'verifiedDealer') => {
    if (!token) return;
    try {
      await apiFetch(`/api/admin/tenants/${tenantId}/toggle`, {
        method: 'PATCH',
        token,
        body: { field },
      });
      pushToast('Tenant Updated', 'Audit log entry recorded', 'success');
      loadData();
    } catch (err) {
      pushToast('Admin Permission Required', (err as Error).message, 'warning');
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      !logFilter ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.details.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.actorName.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--ink-primary)] sm:text-3xl">
          Tenant Governance, Security Audit &amp; API Contracts (UC19–UC20)
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Multi-tenant isolation controls, verified wholesale dealer KYC, append-only security log, and OpenAPI 3.1 contract.
        </p>
      </div>

      {/* Tenants Grid */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--ink-primary)]">
            <Building2 className="h-4.5 w-4.5 text-[var(--brand)]" />
            Registered Galleries (Tenants)
          </h2>
          <span className="font-mono-num text-xs text-[var(--ink-muted)]">
            Role: {user?.role}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-sm font-bold text-[var(--ink-primary)]">
                    {t.name}
                  </div>
                  <div className="font-mono-num text-[11px] text-[var(--ink-muted)]">
                    {t.city} · {t.taxNo} · {t.plan}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono-num text-[10px] font-bold ${
                    t.isActive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300'
                  }`}
                >
                  {t.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <span className="text-[11px] font-medium text-[var(--ink-secondary)]">
                  Dealer KYC: <strong>{t.verifiedDealer ? 'Verified ✓' : 'Pending'}</strong>
                </span>
                {user?.role === 'PLATFORM_ADMIN' && t.id !== 'tenant-platform' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTenantField(t.id, 'verifiedDealer')}
                      className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-semibold"
                    >
                      Toggle KYC
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTenantField(t.id, 'isActive')}
                      className="rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-700 dark:text-red-300"
                    >
                      {t.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log + OpenAPI Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)] lg:col-span-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--ink-primary)]">
              <Shield className="h-4.5 w-4.5 text-[var(--brand)]" />
              Append-Only Security &amp; Business Audit Log (NFR-SEC7)
            </h2>
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter action or actor..."
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs"
            />
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono-num text-[10px] font-bold ${
                        log.severity === 'SECURITY'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                          : log.severity === 'WARNING'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-500/12 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {log.severity === 'SECURITY' && <ShieldAlert className="h-3 w-3" />}
                      {log.action}
                    </span>
                    <span className="font-semibold text-[var(--ink-primary)]">{log.actorName}</span>
                  </div>
                  <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">
                    {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                  </span>
                </div>
                <p className="mt-1 text-[var(--ink-secondary)]">{log.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OpenAPI 3.1 Contract */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[#0b1220] p-5 text-slate-200 shadow-[var(--shadow-xs)] lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-white">
              <Code2 className="h-4 w-4 text-[#f28c28]" />
              OpenAPI 3.1 Contract (/api/openapi.json)
            </h2>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono-num text-[10px] text-emerald-300">
              STD-5
            </span>
          </div>
          <pre className="max-h-80 overflow-auto rounded-xl bg-black/40 p-3 font-mono-num text-[11px] leading-relaxed text-slate-300">
            {openApi ? JSON.stringify(openApi, null, 2) : 'Loading OpenAPI schema...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

