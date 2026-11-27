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
        setError('Platform Administrator authentication (with MFA) is required to access /admin.');
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

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B', color: '#FAFAFA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Loading DAOZ360 Platform Admin Console...</div>
          <div style={{ fontSize: '13px', color: '#A1A1AA' }}>Verifying administrator session and MFA state</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B', color: '#FAFAFA', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#18181B', border: '1px solid #27272A', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '999px', background: '#451A03', color: '#FDBA74', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
            Restricted Platform Console
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px' }}>Administrator Sign-In Required</h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Sign In with Admin MFA</span>
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
    <div style={{ minHeight: '100vh', display: 'flex', background: '#09090B', color: '#F4F4F5', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '265px', background: '#121215', borderRight: '1px solid #27272A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 14px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 20px', borderBottom: '1px solid #27272A', marginBottom: '16px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={135} height={27} />
            </Link>
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: '#FF5A00', color: '#FFFFFF', textTransform: 'uppercase' }}>
              Admin
            </span>
          </div>

          <nav aria-label="Platform Admin Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'overview', label: 'Overview & Telemetry' },
              { id: 'users_workspaces', label: 'Users & Workspaces' },
              { id: 'providers', label: 'Providers & OAuth Setup' },
              { id: 'publishing_ops', label: 'Publishing Operations' },
              { id: 'analytics_ops', label: 'Analytics Operations' },
              { id: 'inquiries', label: `Leads & Inquiries (${data.inquiries?.length || 0})` },
              { id: 'audit_log', label: 'Audit Trail' },
              { id: 'settings', label: 'Platform Settings' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as AdminTab)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === item.id ? '#27272A' : 'transparent',
                  color: activeTab === item.id ? '#FFFFFF' : '#A1A1AA',
                  fontWeight: activeTab === item.id ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{item.label}</span>
                {activeTab === item.id && <span style={{ color: '#FF5A00' }}>&bull;</span>}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #27272A', paddingTop: '14px', fontSize: '12px' }}>
          <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{data.adminUser.name}</div>
          <div style={{ color: '#A1A1AA', marginBottom: '10px' }}>
            {data.adminUser.email} &bull; <span style={{ color: '#FDBA74' }}>{data.adminUser.platformRole}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard" style={{ flex: 1, textAlign: 'center', padding: '7px 10px', borderRadius: '8px', background: '#27272A', color: '#E4E4E7', textDecoration: 'none', fontWeight: 600 }}>
              Customer UI
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
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #3F3F46', background: 'transparent', color: '#F87171', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF' }}>
              DAOZ360 Platform Operations Console
            </h1>
            <p style={{ fontSize: '13px', color: '#A1A1AA', margin: 0 }}>
              Zero-trust tenant isolation active: customer OAuth grants and private draft contents are excluded from global inspection.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => runAdminAction({ action: 'run_worker_cycle' }, 'Executed worker queue cycle')}
              style={{ padding: '9px 14px', borderRadius: '9px', border: '1px solid #3F3F46', background: '#18181B', color: '#FAFAFA', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Run Worker Dispatch Cycle
            </button>
            <button
              type="button"
              onClick={fetchAdminData}
              style={{ padding: '9px 14px', borderRadius: '9px', border: 'none', background: '#FF5A00', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh Telemetry
            </button>
          </div>
        </header>

        {statusToast && (
          <div role="status" style={{ padding: '12px 16px', background: '#18181B', border: '1px solid #FF5A00', borderRadius: '10px', color: '#FDBA74', fontSize: '13px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{statusToast}</span>
            <button type="button" onClick={() => setStatusToast('')} style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}>&times;</button>
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
                <div key={stat.label} style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600, marginBottom: '6px' }}>{stat.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#71717A' }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Provider Health Matrix</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.providers.map((p: any) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{p.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#A1A1AA' }}>API {p.apiVersion} &bull; {p.accessTier}</div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: p.lastHealthStatus === 'connected' ? '#052E16' : '#451A03',
                        color: p.lastHealthStatus === 'connected' ? '#4ADE80' : '#FDBA74',
                      }}>
                        {p.lastHealthStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Recent Operational Audit Events</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.auditEvents || []).slice(0, 7).map((ev: any) => (
                    <div key={ev._id} style={{ padding: '10px 12px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#FDBA74' }}>{ev.action}</strong>
                        <span style={{ color: '#71717A' }}>{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#A1A1AA' }}>
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
            <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>Workspaces & Plan Entitlements</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
                      <th style={{ padding: '10px' }}>Workspace</th>
                      <th style={{ padding: '10px' }}>Plan Tier</th>
                      <th style={{ padding: '10px' }}>Entitlements (Accounts / Users / Deliveries)</th>
                      <th style={{ padding: '10px' }}>Monthly Usage</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workspaces.map((ws: any) => (
                      <tr key={ws._id} style={{ borderBottom: '1px solid #27272A' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{ws.name}</div>
                          <div style={{ fontSize: '11px', color: '#71717A' }}>{ws._id} &bull; /{ws.slug}</div>
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
                            style={{ background: '#121215', color: '#FFFFFF', border: '1px solid #3F3F46', borderRadius: '6px', padding: '5px 8px' }}
                          >
                            <option value="starter">Starter (₹999 / $19)</option>
                            <option value="growth">Growth (₹2,499 / $49)</option>
                            <option value="agency">Agency (₹5,999 / $99)</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#D4D4D8' }}>
                          {ws.limits.accounts} accounts &bull; {ws.limits.users} seats &bull; {ws.limits.deliveriesPerMonth} deliveries/mo
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {ws.usage.deliveriesUsed} used ({ws.usage.deliveriesReserved} reserved)
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: ws.status === 'active' ? '#052E16' : '#450A0A',
                            color: ws.status === 'active' ? '#4ADE80' : '#F87171',
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
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #3F3F46', background: 'transparent', color: '#E4E4E7', cursor: 'pointer', fontSize: '12px' }}
                          >
                            {ws.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>Platform Users</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
                    <th style={{ padding: '10px' }}>Name & Email</th>
                    <th style={{ padding: '10px' }}>Platform Role</th>
                    <th style={{ padding: '10px' }}>MFA</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u: any) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #27272A' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#A1A1AA' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#27272A', fontSize: '12px' }}>{u.platformRole}</span>
                      </td>
                      <td style={{ padding: '10px' }}>{u.mfaEnabled ? 'Enabled (TOTP)' : 'Standard'}</td>
                      <td style={{ padding: '10px' }}>{u.status}</td>
                      <td style={{ padding: '10px' }}>
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
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #3F3F46', background: 'transparent', color: '#E4E4E7', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {u.status === 'active' ? 'Suspend User' : 'Restore User'}
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
            <div style={{ padding: '16px 20px', background: '#18181B', border: '1px solid #27272A', borderRadius: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px' }}>
                Official Social Provider Configuration & Launch Checklist
              </h2>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: 0 }}>
                Super Admins can verify required environment variables, copy exact callback URLs per environment, run live diagnostics, open step-by-step developer portal guides, and connect DAOZ360-owned test accounts in the isolated Admin workspace (`ws_daoz360_admin`).
              </p>
            </div>

            {data.providers.map((p: any) => (
              <div key={p._id} style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{p.displayName}</h3>
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: p.lastHealthStatus === 'connected' ? '#052E16' : '#451A03', color: p.lastHealthStatus === 'connected' ? '#4ADE80' : '#FDBA74', fontWeight: 700 }}>
                        {p.lastHealthStatus}
                      </span>
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: '#27272A', color: '#D4D4D8' }}>
                        Approval: {p.approvalStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
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
                      style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #3F3F46', background: '#27272A', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Run Diagnostics
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGuideProvider(selectedGuideProvider === p.provider ? null : p.provider)
                      }
                      style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #3F3F46', background: 'transparent', color: '#FDBA74', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {selectedGuideProvider === p.provider ? 'Hide Setup Guide' : 'Setup Instructions'}
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
                      style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#FF5A00', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Connect Admin Test Account
                    </button>
                  </div>
                </div>

                {/* Callback URLs per environment */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {(['development', 'staging', 'production'] as const).map((envKey) => (
                    <div key={envKey} style={{ padding: '10px 12px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#A1A1AA' }}>
                          {envKey} Callback URL
                        </span>
                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
                      <code style={{ display: 'block', fontSize: '11px', color: '#FDBA74', wordBreak: 'break-all' }}>
                        {p.callbacks?.[envKey]}
                      </code>
                    </div>
                  ))}
                </div>

                {/* Required Env Vars & Requested Scopes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>Required Environment Secrets:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.envChecklist?.map((env: any) => (
                        <span
                          key={env.name}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: env.configured ? '#052E16' : '#27272A',
                            color: env.configured ? '#4ADE80' : '#D4D4D8',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                          }}
                        >
                          {env.name}: {env.configured ? 'Configured' : 'Unset (Sandbox)'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>Requested OAuth Scopes:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.requestedScopes?.map((sc: string) => (
                        <span key={sc} style={{ padding: '3px 8px', borderRadius: '6px', background: '#27272A', color: '#E4E4E7', fontFamily: 'monospace', fontSize: '11px' }}>
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {p.provider === 'x' && (
                  <div style={{ marginTop: '14px', padding: '10px 14px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#D4D4D8' }}>
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
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #3F3F46', background: '#27272A', color: '#FFFFFF', fontSize: '11px', cursor: 'pointer' }}
                    >
                      +5,000 Credit Cap
                    </button>
                  </div>
                )}

                {selectedGuideProvider === p.provider && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#121215', borderRadius: '10px', border: '1px solid #3F3F46' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#FDBA74' }}>
                      Step-by-Step Developer Portal Setup ({p.displayName})
                    </h4>
                    <ul style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7, color: '#D4D4D8' }}>
                      {p.catalog?.setupSteps?.map((step: string) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
                      Portal: <a href={p.catalog?.portalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF5A00' }}>{p.catalog?.portalUrl}</a> &bull; Official Docs: <a href={p.catalog?.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF5A00' }}>{p.catalog?.docsUrl}</a>
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
            <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>
                Per-Target Delivery Status & Safe Reconciliation
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
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
                    <tr key={t._id} style={{ borderBottom: '1px solid #27272A' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{t._id}</td>
                      <td style={{ padding: '10px' }}>{t.workspaceId}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontWeight: 700 }}>{t.provider}</td>
                      <td style={{ padding: '10px' }}>{t.publishedSegments} / {t.segmentCount}</td>
                      <td style={{ padding: '10px' }}>{new Date(t.scheduledAtUtc).toLocaleString()}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: t.status === 'published' ? '#052E16' : t.status === 'queued' ? '#1E1B4B' : '#451A03',
                          color: t.status === 'published' ? '#4ADE80' : t.status === 'queued' ? '#A5B4FC' : '#FDBA74',
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#F87171', fontSize: '12px' }}>{t.lastError || '—'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              { action: 'reconcile_or_retry_target', targetId: t._id, subAction: 'safe_retry' },
                              `Retried target ${t._id} (preserved published segments)`
                            )
                          }
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #3F3F46', background: '#27272A', color: '#FFFFFF', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Safe Retry
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              { action: 'reconcile_or_retry_target', targetId: t._id, subAction: 'reconcile_lookup' },
                              `Reconciled target ${t._id} via idempotency contract`
                            )
                          }
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #3F3F46', background: 'transparent', color: '#FDBA74', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Reconcile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>Attempt Timeline & Fencing Tokens</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
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
                    <tr key={a._id} style={{ borderBottom: '1px solid #27272A' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{a._id}</td>
                      <td style={{ padding: '10px' }}>{a.targetId}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase' }}>{a.provider}</td>
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
          <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>Analytics Coverage & Sync Freshness by Provider</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
                  <th style={{ padding: '10px' }}>Provider</th>
                  <th style={{ padding: '10px' }}>Snapshots Stored</th>
                  <th style={{ padding: '10px' }}>Latest Sync</th>
                  <th style={{ padding: '10px' }}>Collection Status</th>
                </tr>
              </thead>
              <tbody>
                {data.analyticsOperations.coverageByProvider.map((c: any) => (
                  <tr key={c.provider} style={{ borderBottom: '1px solid #27272A' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, textTransform: 'uppercase' }}>{c.provider}</td>
                    <td style={{ padding: '12px 10px' }}>{c.snapshots}</td>
                    <td style={{ padding: '12px 10px' }}>{c.latestSync ? new Date(c.latestSync).toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '999px', background: '#27272A', fontSize: '11px' }}>
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
          <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px' }}>
                  Leads, Contact Submissions & Chat Requests Inbox
                </h2>
                <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>
                  Every submission from /contact/submit, /api/contact, and /api/chat/* with original reference IDs, status, and owner assignment.
                </p>
              </div>
              <input
                type="search"
                placeholder="Search reference, email, name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #3F3F46', background: '#121215', color: '#FFFFFF', fontSize: '13px', minWidth: '280px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
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
                    <tr key={inq._id} style={{ borderBottom: '1px solid #27272A' }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#FDBA74' }}>
                        {inq.reference}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{inq.category}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{inq.kind}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700 }}>{inq.name}</div>
                        <div style={{ fontSize: '12px', color: '#A1A1AA' }}>{inq.email}</div>
                        {inq.company && <div style={{ fontSize: '11px', color: '#71717A' }}>{inq.company}</div>}
                      </td>
                      <td style={{ padding: '12px 10px', maxWidth: '340px', color: '#D4D4D8', fontSize: '12px' }}>
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
                          style={{ background: '#121215', color: '#FFFFFF', border: '1px solid #3F3F46', borderRadius: '6px', padding: '5px 8px', fontSize: '12px' }}
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
          <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px' }}>Immutable Security & Operations Audit Log</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272A', textAlign: 'left', color: '#A1A1AA' }}>
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
                  <tr key={ev._id} style={{ borderBottom: '1px solid #27272A' }}>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#A1A1AA' }}>{new Date(ev.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#FDBA74' }}>{ev.action}</td>
                    <td style={{ padding: '10px' }}>{ev.actorEmail || ev.actorUserId || 'system'}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{ev.workspaceId || 'platform'}</td>
                    <td style={{ padding: '10px' }}>{ev.targetType}:{ev.targetId}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#A1A1AA' }}>
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
          <div style={{ background: '#18181B', border: '1px solid #27272A', borderRadius: '14px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 12px' }}>Platform Security, Retention & Encryption Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div style={{ padding: '16px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>Tenant Grant Encryption (AES-256-GCM)</div>
                <p style={{ color: '#A1A1AA', margin: '0 0 8px' }}>
                  Active Key ID: <code>{process.env.GRANT_ENCRYPTION_KEY_ID || 'v1'}</code>. Authenticated encryption with workspace:provider AAD binding and key rotation support.
                </p>
              </div>
              <div style={{ padding: '16px', background: '#121215', borderRadius: '10px', border: '1px solid #27272A' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>Data Retention & Deletion Policy</div>
                <p style={{ color: '#A1A1AA', margin: 0 }}>
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
