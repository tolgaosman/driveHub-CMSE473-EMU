'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { AuditLogEntry, Tenant } from '@shared/contracts';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { Badge, Button, PageHeader, Panel, inputClass } from '@/components/ui/primitives';

export const AdminConsolePage: React.FC = () => {
  const { token, user, lang, dataVersion, pushToast } = useApp();
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

  const tr = lang === 'tr';

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr ? 'Yönetim ve denetim' : 'Admin & audit'}
        description={
          tr
            ? 'Galeriler, alıcı doğrulaması, değiştirilemez denetim kaydı ve API sözleşmesi.'
            : 'Galleries, dealer verification, the append-only audit log and the API contract.'
        }
        actions={<Badge>{user?.role}</Badge>}
      />

      <Panel
        title={tr ? 'Kayıtlı galeriler' : 'Registered galleries'}
        meta={`${tenants.length} tenants`}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-5 py-2.5 font-medium">{tr ? 'Galeri' : 'Gallery'}</th>
                <th className="px-5 py-2.5 font-medium">{tr ? 'Şehir' : 'City'}</th>
                <th className="px-5 py-2.5 font-medium">{tr ? 'Vergi no' : 'Tax no.'}</th>
                <th className="px-5 py-2.5 font-medium">Plan</th>
                <th className="px-5 py-2.5 font-medium">KYC</th>
                <th className="px-5 py-2.5 font-medium">{tr ? 'Durum' : 'Status'}</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-[var(--ink-secondary)]">{t.city}</td>
                  <td className="px-5 py-3 font-mono-num text-xs text-[var(--ink-secondary)]">{t.taxNo}</td>
                  <td className="px-5 py-3 text-xs text-[var(--ink-secondary)]">{t.plan}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.verifiedDealer ? 'success' : 'warning'}>
                      {t.verifiedDealer ? (tr ? 'Doğrulandı' : 'Verified') : tr ? 'Bekliyor' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={t.isActive ? 'success' : 'danger'} dot>
                      {t.isActive ? (tr ? 'Aktif' : 'Active') : tr ? 'Askıda' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user?.role === 'PLATFORM_ADMIN' && t.id !== 'tenant-platform' && (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => toggleTenantField(t.id, 'verifiedDealer')}>
                          KYC
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => toggleTenantField(t.id, 'isActive')}>
                          {t.isActive ? (tr ? 'Askıya al' : 'Suspend') : tr ? 'Etkinleştir' : 'Activate'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7"
          title={tr ? 'Denetim kaydı' : 'Audit log'}
          meta="NFR-SEC7 · append-only"
          actions={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="search"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder={tr ? 'İşlem veya kişi ara' : 'Filter action or actor'}
                aria-label={tr ? 'Denetim kaydını filtrele' : 'Filter audit log'}
                className={`${inputClass} h-8 w-52 pl-8 text-xs`}
              />
            </div>
          }
          bodyClassName="max-h-96 overflow-y-auto"
        >
          {filteredLogs.length === 0 ? (
            <p className="px-5 py-10 text-center text-xs text-[var(--ink-muted)]">
              {tr ? 'Eşleşen kayıt yok.' : 'No matching entries.'}
            </p>
          ) : (
            <ol className="divide-y divide-[var(--border-subtle)]">
              {filteredLogs.map((log) => (
                <li key={log.id} className="grid grid-cols-[64px_1fr] gap-3 px-5 py-3 text-xs">
                  <time className="pt-0.5 font-mono-num text-[11px] text-[var(--ink-muted)]">
                    {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                  </time>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={log.severity === 'SECURITY' ? 'danger' : log.severity === 'WARNING' ? 'warning' : 'neutral'}
                        className="font-mono-num"
                      >
                        {log.severity === 'SECURITY' && <ShieldAlert className="h-3 w-3" />}
                        {log.action}
                      </Badge>
                      <span className="font-medium">{log.actorName}</span>
                    </div>
                    <p className="mt-1 text-[var(--ink-secondary)]">{log.details}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          className="lg:col-span-5"
          title="OpenAPI 3.1"
          meta="/api/openapi.json · STD-5"
          bodyClassName="p-0"
        >
          <pre className="max-h-96 overflow-auto bg-[var(--bg-surface-subtle)] p-4 font-mono-num text-[11px] leading-relaxed text-[var(--ink-secondary)]">
            {openApi ? JSON.stringify(openApi, null, 2) : tr ? 'Şema yükleniyor…' : 'Loading schema…'}
          </pre>
        </Panel>
      </div>
    </div>
  );
};
