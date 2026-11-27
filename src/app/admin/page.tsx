'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AdminTab =
  | 'overview'
  | 'users_workspaces'
  | 'providers'
  | 'publishing_ops'
  | 'analytics_ops'
  | 'inquiries'
  | 'audit_log'
  | 'settings';

export default function PlatformAdminConsole() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusToast, setStatusToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideProvider, setSelectedGuideProvider] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.status === 401 || res.status === 403) {
        setError('Platform Administrator authentication is required to access /admin.');
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Failed to load admin console');
      } else {
        setData(json);
        setError('');
      }
    } catch {
      setError('Failed to connect to Admin API');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  async function runAdminAction(payload: Record<string, any>, successMsg: string) {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': data?.csrfToken || '',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatusToast(`Error: ${json.error || 'Operation failed'}`);
        return json;
      }
      setStatusToast(successMsg);
      await fetchAdminData();
      return json;
    } catch {
      setStatusToast('Network error executing action');
      return null;
    }
  }

  // DAOZ360 Warm Ceramic & Sculptural Orange Palette
  const bgPage = '#FFF9F5';
  const bgSidebar = '#FFFFFF';
  const bgCard = '#FFFFFF';
  const bgSoft = '#FFF4EC';
  const borderCol = '#F2E5DC';
  const textMain = '#18181B';
  const textSub = '#52525B';
  const textMuted = '#71717A';
  const brandOrange = '#FF5A00';
  const brandDeep = '#B93D00';

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgPage, color: textMain }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: textMain }}>Loading DAOZ360 Platform Admin Console...</div>
          <div style={{ fontSize: '13px', color: textSub }}>Verifying administrator session and telemetry</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgPage, color: textMain, padding: '24px' }}>
        <div className="card-base" style={{ maxWidth: '480px', width: '100%', background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '20px', padding: '34px', textAlign: 'center', boxShadow: '0 14px 36px rgba(255, 90, 0, 0.08)' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '999px', background: bgSoft, color: brandDeep, fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
            Platform Operations Console
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 10px', color: textMain }}>Administrator Sign-In Required</h1>
          <p style={{ fontSize: '14px', color: textSub, marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>1-Click Admin Sign In</span>
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Customer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ov = data.overview;
  const filteredInquiries = (data.inquiries || []).filter((inq: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inq.reference?.toLowerCase().includes(q) ||
      inq.name?.toLowerCase().includes(q) ||
      inq.email?.toLowerCase().includes(q) ||
      inq.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: bgPage, color: textMain, fontFamily: 'Inter, sans-serif' }}>
      {/* Warm White Ceramic Sidebar Navigation */}
      <aside style={{ width: '272px', background: bgSidebar, borderRight: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px 16px', flexShrink: 0, boxShadow: '4px 0 24px rgba(185, 61, 0, 0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 20px', borderBottom: `1px solid ${borderCol}`, marginBottom: '18px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={140} height={28} />
            </Link>
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 9px', borderRadius: '999px', background: bgSoft, color: brandDeep, border: '1px solid #FFD8BE', textTransform: 'uppercase' }}>
              Admin
            </span>
          </div>

          <nav aria-label="Platform Admin Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { id: 'overview', label: 'Overview & Telemetry' },
              { id: 'users_workspaces', label: 'Users & Workspaces' },
              { id: 'providers', label: 'Providers & OAuth Setup' },
              { id: 'publishing_ops', label: 'Publishing Operations' },
              { id: 'analytics_ops', label: 'Analytics Operations' },
              { id: 'inquiries', label: `Leads & Inquiries (${data.inquiries?.length || 0})` },
              { id: 'audit_log', label: 'Audit Trail' },
              { id: 'settings', label: 'Platform Settings' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  style={{
                    textAlign: 'left',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid #FFD8BE' : '1px solid transparent',
                    background: isActive ? bgSoft : 'transparent',
                    color: isActive ? brandDeep : textSub,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span>{item.label}</span>
                  {isActive && <span style={{ color: brandOrange, fontSize: '16px' }}>&bull;</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '16px', fontSize: '12px' }}>
          <div style={{ fontWeight: 700, color: textMain }}>{data.adminUser.name}</div>
          <div style={{ color: textMuted, marginBottom: '12px' }}>
            {data.adminUser.email} &bull; <span style={{ color: brandDeep, fontWeight: 600 }}>{data.adminUser.platformRole}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/dashboard"
              className="btn-secondary"
              style={{ flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
            >
              <span>Customer UI</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'logout' }),
                });
                router.push('/login');
              }}
              style={{ padding: '8px 12px', borderRadius: '999px', border: `1px solid ${borderCol}`, background: '#FFFFFF', color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', flexWrap: 'wrap', gap: '16px', background: bgCard, padding: '20px 24px', borderRadius: '18px', border: `1px solid ${borderCol}`, boxShadow: '0 8px 24px rgba(24, 24, 27, 0.03)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: brandDeep, marginBottom: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: brandOrange, display: 'inline-block' }}></span>
              <span>DAOZ360 Platform Administration</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: textMain, fontFamily: 'Manrope, Inter, sans-serif' }}>
              Platform Operations &amp; Provider Governance
            </h1>
            <p style={{ fontSize: '13px', color: textSub, margin: 0 }}>
              Zero-trust tenant isolation active: customer OAuth grants and private draft contents are excluded from global inspection.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => runAdminAction({ action: 'run_worker_cycle' }, 'Executed worker queue cycle')}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '13px' }}
            >
              <span>Run Worker Dispatch Cycle</span>
            </button>
            <button
              type="button"
              onClick={fetchAdminData}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </header>

        {statusToast && (
          <div role="status" style={{ padding: '14px 18px', background: bgSoft, border: `1px solid ${brandOrange}`, borderRadius: '12px', color: brandDeep, fontSize: '13px', fontWeight: 600, marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{statusToast}</span>
            <button type="button" onClick={() => setStatusToast('')} style={{ background: 'transparent', border: 'none', color: brandDeep, cursor: 'pointer', fontSize: '18px' }}>&times;</button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total Users', value: ov.totalUsers, sub: 'Active & verified accounts' },
                { label: 'Active Workspaces', value: ov.totalWorkspaces, sub: 'Multi-tenant isolated' },
                { label: 'Configured Providers', value: `${ov.configuredProvidersCount} / 8`, sub: 'Official adapters registered' },
                { label: 'Connected Social Accounts', value: ov.connectedAccountsCount, sub: `${ov.healthyAccountsCount} healthy grants` },
                { label: 'Published Targets', value: ov.publishedTargetsCount, sub: `${ov.failedTargetsCount} failed / need reconcile` },
                { label: 'Worker Queue Lag', value: ov.queueLagCount, sub: 'Due jobs awaiting claim' },
                { label: 'Analytics Freshness', value: ov.analyticsSnapshotsCount, sub: ov.latestAnalyticsSyncAt ? `Last sync ${new Date(ov.latestAnalyticsSyncAt).toLocaleTimeString()}` : 'No snapshots' },
              ].map((stat) => (
                <div key={stat.label} className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '20px', boxShadow: '0 6px 20px rgba(24, 24, 27, 0.03)' }}>
                  <div style={{ fontSize: '12px', color: textSub, fontWeight: 600, marginBottom: '6px' }}>{stat.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: textMain, marginBottom: '4px', fontFamily: 'Manrope, Inter, sans-serif' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: textMuted }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '22px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Provider Health Matrix</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.providers.map((p: any) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: bgPage, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: textMain }}>{p.displayName}</div>
                        <div style={{ fontSize: '11px', color: textSub }}>API {p.apiVersion} &bull; {p.accessTier}</div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: p.lastHealthStatus === 'connected' ? '#DCFCE7' : bgSoft,
                        color: p.lastHealthStatus === 'connected' ? '#166534' : brandDeep,
                      }}>
                        {p.lastHealthStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '22px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Recent Operational Audit Events</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.auditEvents || []).slice(0, 7).map((ev: any) => (
                    <div key={ev._id} style={{ padding: '12px 14px', background: bgPage, borderRadius: '12px', border: `1px solid ${borderCol}`, fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: brandDeep }}>{ev.action}</strong>
                        <span style={{ color: textMuted }}>{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ color: textSub }}>
                        Actor: {ev.actorEmail || ev.actorUserId || 'system'} &bull; Target: {ev.targetType}:{ev.targetId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS & WORKSPACES TAB */}
        {activeTab === 'users_workspaces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Workspaces &amp; Plan Entitlements</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                      <th style={{ padding: '12px 10px' }}>Workspace</th>
                      <th style={{ padding: '12px 10px' }}>Plan Tier</th>
                      <th style={{ padding: '12px 10px' }}>Entitlements (Accounts / Users / Deliveries)</th>
                      <th style={{ padding: '12px 10px' }}>Monthly Usage</th>
                      <th style={{ padding: '12px 10px' }}>Status</th>
                      <th style={{ padding: '12px 10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workspaces.map((ws: any) => (
                      <tr key={ws._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 700, color: textMain }}>{ws.name}</div>
                          <div style={{ fontSize: '11px', color: textMuted }}>{ws._id} &bull; /{ws.slug}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <select
                            value={ws.planId}
                            onChange={(e) =>
                              runAdminAction(
                                { action: 'update_workspace_status_or_plan', workspaceId: ws._id, planId: e.target.value },
                                `Updated workspace ${ws.name} to ${e.target.value}`
                              )
                            }
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          >
                            <option value="starter">Starter (₹999 / $19)</option>
                            <option value="growth">Growth (₹2,499 / $49)</option>
                            <option value="agency">Agency (₹5,999 / $99)</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 10px', color: textSub }}>
                          {ws.limits.accounts} accounts &bull; {ws.limits.users} seats &bull; {ws.limits.deliveriesPerMonth} deliveries/mo
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {ws.usage.deliveriesUsed} used ({ws.usage.deliveriesReserved} reserved)
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: ws.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                            color: ws.status === 'active' ? '#166534' : '#991B1B',
                          }}>
                            {ws.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              runAdminAction(
                                {
                                  action: 'update_workspace_status_or_plan',
                                  workspaceId: ws._id,
                                  status: ws.status === 'active' ? 'suspended' : 'active',
                                },
                                `Workspace ${ws.name} status updated`
                              )
                            }
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <span>{ws.status === 'active' ? 'Suspend' : 'Reactivate'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Platform Users</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                    <th style={{ padding: '12px 10px' }}>Name &amp; Email</th>
                    <th style={{ padding: '12px 10px' }}>Platform Role</th>
                    <th style={{ padding: '12px 10px' }}>MFA</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u: any) => (
                    <tr key={u._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700, color: textMain }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: textSub }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', background: bgSoft, color: brandDeep, fontWeight: 700, fontSize: '11px' }}>{u.platformRole}</span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>{u.mfaEnabled ? 'Configured' : 'Standard'}</td>
                      <td style={{ padding: '12px 10px' }}>{u.status}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              {
                                action: 'update_user_status',
                                userId: u._id,
                                status: u.status === 'active' ? 'suspended' : 'active',
                              },
                              `Updated user ${u.email}`
                            )
                          }
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <span>{u.status === 'active' ? 'Suspend User' : 'Restore User'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PROVIDERS TAB */}
        {activeTab === 'providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-base" style={{ padding: '20px 24px', background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: textMain }}>
                Official Social Provider Configuration &amp; Launch Checklist
              </h2>
              <p style={{ fontSize: '13px', color: textSub, margin: 0 }}>
                Super Admins can verify required environment variables, copy exact callback URLs per environment, run live diagnostics, open step-by-step developer portal guides, and connect DAOZ360-owned test accounts in the isolated Admin workspace (`ws_daoz360_admin`).
              </p>
            </div>

            {data.providers.map((p: any) => (
              <div key={p._id} className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: textMain }}>{p.displayName}</h3>
                      <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: p.lastHealthStatus === 'connected' ? '#DCFCE7' : bgSoft, color: p.lastHealthStatus === 'connected' ? '#166534' : brandDeep, fontWeight: 700 }}>
                        {p.lastHealthStatus}
                      </span>
                      <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: '#F4F4F5', color: textSub, fontWeight: 600 }}>
                        Approval: {p.approvalStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: textSub }}>
                      API Version: <code>{p.apiVersion}</code> &bull; Access Tier: {p.accessTier} &bull; Verified: {p.catalog?.verifiedDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        runAdminAction(
                          { action: 'run_provider_diagnostics', provider: p.provider },
                          `Diagnostics completed for ${p.displayName}`
                        )
                      }
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>Run Diagnostics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGuideProvider(selectedGuideProvider === p.provider ? null : p.provider)
                      }
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>{selectedGuideProvider === p.provider ? 'Hide Setup Guide' : 'Setup Instructions'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await runAdminAction(
                          { action: 'connect_admin_sandbox_account', provider: p.provider },
                          `Started Admin Workspace OAuth flow for ${p.displayName}`
                        );
                        if (res?.authorizationUrl) {
                          window.location.href = res.authorizationUrl;
                        }
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      <span>Connect Admin Test Account</span>
                    </button>
                  </div>
                </div>

                {/* Callback URLs per environment */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {(['development', 'staging', 'production'] as const).map((envKey) => (
                    <div key={envKey} style={{ padding: '12px 14px', background: bgPage, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: textSub }}>
                          {envKey} Callback URL
                        </span>
                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(p.environmentFlags?.[envKey])}
                            onChange={(e) =>
                              runAdminAction(
                                {
                                  action: 'update_provider_config',
                                  provider: p.provider,
                                  apiVersion: p.apiVersion,
                                  accessTier: p.accessTier,
                                  approvalStatus: p.approvalStatus,
                                  requestedScopes: p.requestedScopes,
                                  environmentFlags: {
                                    ...p.environmentFlags,
                                    [envKey]: e.target.checked,
                                  },
                                },
                                `Updated ${p.displayName} ${envKey} toggle`
                              )
                            }
                          />
                          Enabled
                        </label>
                      </div>
                      <code style={{ display: 'block', fontSize: '11px', color: brandDeep, wordBreak: 'break-all', fontWeight: 600 }}>
                        {p.callbacks?.[envKey]}
                      </code>
                    </div>
                  ))}
                </div>

                {/* Required Env Vars & Requested Scopes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: textSub, marginBottom: '6px' }}>Required Environment Secrets:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.envChecklist?.map((env: any) => (
                        <span
                          key={env.name}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: env.configured ? '#DCFCE7' : bgSoft,
                            color: env.configured ? '#166534' : brandDeep,
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {env.name}: {env.configured ? 'Configured' : 'Sandbox Mode'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: textSub, marginBottom: '6px' }}>Requested OAuth Scopes:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.requestedScopes?.map((sc: string) => (
                        <span key={sc} style={{ padding: '4px 10px', borderRadius: '8px', background: '#F4F4F5', color: textMain, fontFamily: 'monospace', fontSize: '11px' }}>
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {p.provider === 'x' && (
                  <div style={{ marginTop: '14px', padding: '12px 16px', background: bgSoft, borderRadius: '12px', border: '1px solid #FFD8BE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: brandDeep }}>
                      <strong>X API Monthly Credit Budget Control:</strong> {p.monthlyBudgetUsed || 0} / {p.monthlyBudgetLimit || 10000} credits used
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        runAdminAction(
                          {
                            action: 'update_provider_config',
                            provider: 'x',
                            apiVersion: p.apiVersion,
                            accessTier: p.accessTier,
                            approvalStatus: p.approvalStatus,
                            environmentFlags: p.environmentFlags,
                            requestedScopes: p.requestedScopes,
                            monthlyBudgetLimit: (p.monthlyBudgetLimit || 10000) + 5000,
                          },
                          'Increased X monthly credit budget cap by 5,000'
                        )
                      }
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '11px' }}
                    >
                      <span>+5,000 Credit Cap</span>
                    </button>
                  </div>
                )}

                {selectedGuideProvider === p.provider && (
                  <div style={{ marginTop: '16px', padding: '18px', background: bgPage, borderRadius: '14px', border: `1px solid ${borderCol}` }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: brandDeep, fontWeight: 800 }}>
                      Step-by-Step Developer Portal Setup ({p.displayName})
                    </h4>
                    <ul style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7, color: textSub }}>
                      {p.catalog?.setupSteps?.map((step: string) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '12px', color: textSub }}>
                      Portal: <a href={p.catalog?.portalUrl} target="_blank" rel="noopener noreferrer" style={{ color: brandOrange, fontWeight: 600 }}>{p.catalog?.portalUrl}</a> &bull; Official Docs: <a href={p.catalog?.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: brandOrange, fontWeight: 600 }}>{p.catalog?.docsUrl}</a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. PUBLISHING OPERATIONS TAB */}
        {activeTab === 'publishing_ops' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>
                Per-Target Delivery Status &amp; Safe Reconciliation
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                    <th style={{ padding: '10px' }}>Target ID</th>
                    <th style={{ padding: '10px' }}>Workspace</th>
                    <th style={{ padding: '10px' }}>Provider</th>
                    <th style={{ padding: '10px' }}>Segments</th>
                    <th style={{ padding: '10px' }}>Scheduled UTC</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Sanitized Error</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.publishingOperations.targets.map((t: any) => (
                    <tr key={t._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{t._id}</td>
                      <td style={{ padding: '10px' }}>{t.workspaceId}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontWeight: 700, color: brandDeep }}>{t.provider}</td>
                      <td style={{ padding: '10px' }}>{t.publishedSegments} / {t.segmentCount}</td>
                      <td style={{ padding: '10px' }}>{new Date(t.scheduledAtUtc).toLocaleString()}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: t.status === 'published' ? '#DCFCE7' : bgSoft,
                          color: t.status === 'published' ? '#166534' : brandDeep,
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#DC2626', fontSize: '12px' }}>{t.lastError || '—'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              { action: 'reconcile_or_retry_target', targetId: t._id, subAction: 'safe_retry' },
                              `Retried target ${t._id} (preserved published segments)`
                            )
                          }
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          <span>Safe Retry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              { action: 'reconcile_or_retry_target', targetId: t._id, subAction: 'reconcile_lookup' },
                              `Reconciled target ${t._id} via idempotency contract`
                            )
                          }
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          <span>Reconcile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Attempt Timeline &amp; Fencing Tokens</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                    <th style={{ padding: '10px' }}>Attempt ID</th>
                    <th style={{ padding: '10px' }}>Target</th>
                    <th style={{ padding: '10px' }}>Provider</th>
                    <th style={{ padding: '10px' }}>Fencing Token</th>
                    <th style={{ padding: '10px' }}>HTTP</th>
                    <th style={{ padding: '10px' }}>Remote IDs</th>
                    <th style={{ padding: '10px' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.publishingOperations.attempts.map((a: any) => (
                    <tr key={a._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{a._id}</td>
                      <td style={{ padding: '10px' }}>{a.targetId}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontWeight: 700 }}>{a.provider}</td>
                      <td style={{ padding: '10px' }}>#{a.fencingToken}</td>
                      <td style={{ padding: '10px' }}>{a.httpStatus}</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>{(a.remoteIds || []).join(', ')}</td>
                      <td style={{ padding: '10px' }}>{a.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ANALYTICS OPERATIONS TAB */}
        {activeTab === 'analytics_ops' && (
          <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Analytics Coverage &amp; Sync Freshness by Provider</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                  <th style={{ padding: '10px' }}>Provider</th>
                  <th style={{ padding: '10px' }}>Snapshots Stored</th>
                  <th style={{ padding: '10px' }}>Latest Sync</th>
                  <th style={{ padding: '10px' }}>Collection Status</th>
                </tr>
              </thead>
              <tbody>
                {data.analyticsOperations.coverageByProvider.map((c: any) => (
                  <tr key={c.provider} style={{ borderBottom: `1px solid ${borderCol}` }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, textTransform: 'uppercase', color: brandDeep }}>{c.provider}</td>
                    <td style={{ padding: '12px 10px' }}>{c.snapshots}</td>
                    <td style={{ padding: '12px 10px' }}>{c.latestSync ? new Date(c.latestSync).toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', background: bgSoft, color: brandDeep, fontWeight: 700, fontSize: '11px' }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. LEADS & INQUIRIES INBOX TAB */}
        {activeTab === 'inquiries' && (
          <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: textMain }}>
                  Leads, Contact Submissions &amp; Chat Requests Inbox
                </h2>
                <p style={{ fontSize: '12px', color: textSub, margin: 0 }}>
                  Every submission from /contact/submit, /api/contact, and /api/chat/* with original reference IDs, status, and owner assignment.
                </p>
              </div>
              <input
                type="search"
                placeholder="Search reference, email, name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ minWidth: '280px', fontSize: '13px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                    <th style={{ padding: '10px' }}>Reference</th>
                    <th style={{ padding: '10px' }}>Kind / Category</th>
                    <th style={{ padding: '10px' }}>Contact</th>
                    <th style={{ padding: '10px' }}>Message / Details</th>
                    <th style={{ padding: '10px' }}>Owner</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq: any) => (
                    <tr key={inq._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: brandDeep }}>
                        {inq.reference}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600, color: textMain }}>{inq.category}</div>
                        <div style={{ fontSize: '11px', color: textMuted }}>{inq.kind}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700, color: textMain }}>{inq.name}</div>
                        <div style={{ fontSize: '12px', color: textSub }}>{inq.email}</div>
                        {inq.company && <div style={{ fontSize: '11px', color: textMuted }}>{inq.company}</div>}
                      </td>
                      <td style={{ padding: '12px 10px', maxWidth: '340px', color: textSub, fontSize: '12px' }}>
                        {inq.message}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '12px' }}>
                        {inq.ownerName || 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <select
                          value={inq.status}
                          onChange={(e) =>
                            runAdminAction(
                              {
                                action: 'update_inquiry',
                                inquiryId: inq._id,
                                status: e.target.value,
                                ownerName: data.adminUser.name,
                              },
                              `Updated inquiry ${inq.reference} to ${e.target.value}`
                            )
                          }
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '12px' }}
                        >
                          <option value="New">New</option>
                          <option value="In Review">In Review</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                          <option value="Spam">Spam</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. AUDIT LOG TAB */}
        {activeTab === 'audit_log' && (
          <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: textMain }}>Immutable Security &amp; Operations Audit Log</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textSub }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>Action</th>
                  <th style={{ padding: '10px' }}>Actor</th>
                  <th style={{ padding: '10px' }}>Workspace</th>
                  <th style={{ padding: '10px' }}>Target</th>
                  <th style={{ padding: '10px' }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {data.auditEvents.map((ev: any) => (
                  <tr key={ev._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                    <td style={{ padding: '10px', fontSize: '12px', color: textSub }}>{new Date(ev.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: brandDeep }}>{ev.action}</td>
                    <td style={{ padding: '10px' }}>{ev.actorEmail || ev.actorUserId || 'system'}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{ev.workspaceId || 'platform'}</td>
                    <td style={{ padding: '10px' }}>{ev.targetType}:{ev.targetId}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: textSub }}>
                      {JSON.stringify(ev.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="card-base" style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px', color: textMain }}>Platform Security, Retention &amp; Encryption Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div style={{ padding: '18px', background: bgPage, borderRadius: '14px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: '6px' }}>Tenant Grant Encryption (AES-256-GCM)</div>
                <p style={{ color: textSub, margin: '0 0 8px' }}>
                  Active Key ID: <code>{process.env.GRANT_ENCRYPTION_KEY_ID || 'v1'}</code>. Authenticated encryption with workspace:provider AAD binding and key rotation support.
                </p>
              </div>
              <div style={{ padding: '18px', background: bgPage, borderRadius: '14px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: '6px' }}>Data Retention &amp; Deletion Policy</div>
                <p style={{ color: textSub, margin: 0 }}>
                  OAuth transactions expire in 10 minutes (TTL index). Revoked grants and disconnected social tokens are purged immediately upon deauthorization or Meta deletion callback.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
