'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type DashboardTab =
  | 'overview'
  | 'connections'
  | 'composer'
  | 'planner'
  | 'team_approvals'
  | 'publishing_history'
  | 'analytics'
  | 'integrations'
  | 'social_page';

function parseNaturalLanguageSchedule(input: string): { valid: boolean; date: Date; formatted: string } {
  const lower = (input || '').trim().toLowerCase();
  const now = new Date();
  const target = new Date(now.getTime() + 2 * 3600 * 1000);

  if (lower.includes('tomorrow')) {
    target.setDate(now.getDate() + 1);
  } else if (lower.includes('next monday')) {
    const day = now.getDay();
    const diff = (1 + 7 - day) % 7 || 7;
    target.setDate(now.getDate() + diff);
  } else if (lower.includes('in 1 hour')) {
    target.setTime(now.getTime() + 3600 * 1000);
    return { valid: true, date: target, formatted: target.toLocaleString() };
  }

  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3];
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
      target.setHours(hours, mins, 0, 0);
    }
  } else {
    target.setHours(9, 30, 0, 0);
  }

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return {
    valid: true,
    date: target,
    formatted: target.toLocaleString(),
  };
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);

  // Composer State
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>('drf_sample_review_02');
  const [draftVersion, setDraftVersion] = useState<number>(2);
  const [draftTitle, setDraftTitle] = useState<string>('Multi-Channel Agency Collaboration Checklist');
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>(['acc_acme_x', 'acc_acme_linkedin']);
  const [segments, setSegments] = useState<Array<{ id: string; text: string; mediaIds: string[] }>>([
    {
      id: 'seg_1',
      text: 'How growing teams review and approve 40+ social accounts without bottlenecks: a 4-step checklist.',
      mediaIds: [],
    },
  ]);
  const [substackNoteText, setSubstackNoteText] = useState<string>(
    'How growing teams review and approve 40+ social accounts without bottlenecks — full breakdown for Substack Notes readers.'
  );
  const [firstCommentText, setFirstCommentText] = useState<string>('');
  const [naturalScheduleText, setNaturalScheduleText] = useState<string>('tomorrow at 9:30am');
  const [scheduleTimezone, setScheduleTimezone] = useState<string>('Asia/Kolkata');

  // AI Writing Assistant State
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [aiNotice, setAiNotice] = useState<string>('');

  // Team & Integrations State
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [commentInput, setCommentInput] = useState<string>('');
  const [newApiKeyName, setNewApiKeyName] = useState<string>('');
  const [createdPlaintextKey, setCreatedPlaintextKey] = useState<string>('');
  const [mastodonInstance, setMastodonInstance] = useState<string>('https://mastodon.social');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.status === 401) {
        setError('Please sign in to access your DAOZ360 workspace dashboard.');
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Failed to load dashboard');
      } else {
        setData(json);
        setError('');
      }
    } catch {
      setError('Failed to connect to dashboard API');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Keyboard command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function loadDraftIntoComposer(draft: any) {
    setSelectedDraftId(draft._id);
    setDraftVersion(draft.version);
    setDraftTitle(draft.title);
    setTargetAccountIds(draft.targetAccountIds || []);
    setSegments(
      draft.masterSegments?.length
        ? draft.masterSegments
        : [{ id: 'seg_1', text: '', mediaIds: [] }]
    );
    const fc = (draft.automations || []).find((a: any) => a.type === 'first_comment');
    setFirstCommentText(fc?.content || '');
    setActiveTab('composer');
  }

  async function runDashboardAction(payload: Record<string, any>, successMsg?: string) {
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': data?.csrfToken || '',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setToast(`Error: ${json.error || 'Action failed'}`);
        return json;
      }
      if (successMsg) {
        setToast(
          json.approvalInvalidated
            ? `${successMsg} (Note: Prior approval was invalidated because the approved content changed.)`
            : successMsg
        );
      }
      await fetchDashboard();
      if (json.draft) {
        setDraftVersion(json.draft.version);
        setSelectedDraftId(json.draft._id);
      }
      return json;
    } catch {
      setToast('Network error');
      return null;
    }
  }

  async function handleConnectProvider(provider: string) {
    try {
      const res = await fetch(`/api/integrations/${provider}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': data?.csrfToken || '',
        },
        body: JSON.stringify({
          intendedAction: 'connect',
          instanceUrl: provider === 'mastodon' ? mastodonInstance : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setToast(`OAuth Error: ${json.error || 'Could not initiate connection'}`);
        return;
      }
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
      }
    } catch {
      setToast('Network error starting OAuth flow');
    }
  }

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', color: '#18181B' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Loading DAOZ360 Workspace...</div>
          <div style={{ fontSize: '13px', color: '#71717A' }}>Syncing drafts, connected channels, and calendar slots</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', padding: '24px' }}>
        <div className="card-base" style={{ maxWidth: '460px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px' }}>Sign In to Your Workspace</h1>
          <p style={{ fontSize: '14px', color: '#52525B', marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Sign In</span>
            </Link>
            <Link href="/register" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Create Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDark = false;
  const bgMain = '#FFF9F5';
  const bgCard = '#FFFFFF';
  const bgSidebar = '#FFFFFF';
  const borderCol = '#F2E5DC';
  const textMain = '#18181B';
  const textMuted = '#52525B';

  const parsedNaturalTime = parseNaturalLanguageSchedule(naturalScheduleText);
  const currentDraftObj = (data.drafts || []).find((d: any) => d._id === selectedDraftId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: bgMain, color: textMain, fontFamily: 'Inter, sans-serif' }}>
      {/* Command Palette Overlay (Cmd+K) */}
      {cmdOpen && (
        <div
          onClick={() => setCmdOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '90px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '480px', maxWidth: '90vw', background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: textMuted, marginBottom: '10px', textTransform: 'uppercase' }}>
              DAOZ360 Quick Command Palette
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'New Blank Draft / Thread', tab: 'composer', action: () => {
                  setSelectedDraftId(undefined);
                  setDraftTitle('New Social Campaign Thread');
                  setSegments([{ id: 'seg_1', text: '', mediaIds: [] }]);
                }},
                { label: 'Connect a Social Account (OAuth)', tab: 'connections' },
                { label: 'Open Visual Content Planner & Slots', tab: 'planner' },
                { label: 'Review Drafts Awaiting Approval', tab: 'team_approvals' },
                { label: 'View Cross-Account Analytics & Export CSV', tab: 'analytics' },
                { label: 'Toggle Light / Dark Theme', tab: activeTab, action: () => setTheme(isDark ? 'light' : 'dark') },
              ].map((cmd) => (
                <button
                  key={cmd.label}
                  type="button"
                  onClick={() => {
                    if (cmd.action) cmd.action();
                    setActiveTab(cmd.tab as DashboardTab);
                    setCmdOpen(false);
                  }}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside style={{ width: '260px', background: bgSidebar, borderRight: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 14px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 16px', borderBottom: `1px solid ${borderCol}`, marginBottom: '14px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={135} height={27} />
            </Link>
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title="Toggle Light / Dark Theme"
              style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: 'transparent', color: textMain, fontSize: '11px', cursor: 'pointer' }}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Workspace Switcher */}
          <div style={{ marginBottom: '16px', padding: '10px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}` }}>
            <label htmlFor="ws-switcher" style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: textMuted, marginBottom: '4px' }}>
              Active Workspace ({data.role})
            </label>
            <select
              id="ws-switcher"
              value={data.workspace._id}
              onChange={async (e) => {
                await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'switch_workspace', workspaceId: e.target.value }),
                });
                fetchDashboard();
              }}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, fontWeight: 700, fontSize: '13px' }}
            >
              {data.allWorkspaces.map((w: any) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.planId.toUpperCase()})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: textMuted, marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Deliveries: {data.workspace.usage.deliveriesUsed}/{data.workspace.limits.deliveriesPerMonth}</span>
              <span>Accounts: {data.accounts.filter((a: any) => a.healthState === 'connected').length}/{data.workspace.limits.accounts}</span>
            </div>
          </div>

          <nav aria-label="Workspace Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'overview', label: '1. Overview & Shortcuts' },
              { id: 'connections', label: `2. Connections (${data.accounts.length})` },
              { id: 'composer', label: '3. Composer & AI Studio' },
              { id: 'planner', label: '4. Planner & Time Slots' },
              { id: 'team_approvals', label: '5. Team & Approvals' },
              { id: 'publishing_history', label: '6. Publishing History' },
              { id: 'analytics', label: '7. Analytics & CSV Export' },
              { id: 'integrations', label: '8. API, Zapier & MCP' },
              { id: 'social_page', label: '9. Public Social Page' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as DashboardTab)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === item.id ? '#FF5A00' : 'transparent',
                  color: activeTab === item.id ? '#FFFFFF' : textMain,
                  fontWeight: activeTab === item.id ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '14px', fontSize: '12px' }}>
          <div style={{ fontWeight: 700 }}>{data.user.name}</div>
          <div style={{ color: textMuted, marginBottom: '10px' }}>{data.user.email}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              ⌘K Commands
            </button>
            {(data.user.platformRole === 'super_admin' || data.user.platformRole === 'operations_admin') && (
              <Link href="/admin" style={{ padding: '6px 8px', borderRadius: '6px', background: '#27272A', color: '#FDBA74', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}>
                Admin
              </Link>
            )}
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
              style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: 'transparent', color: '#EF4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, padding: '28px 34px', overflowY: 'auto' }}>
        {toast && (
          <div role="status" style={{ padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FF5A00', borderRadius: '10px', color: '#9A3412', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{toast}</span>
            <button type="button" onClick={() => setToast('')} style={{ background: 'transparent', border: 'none', color: '#9A3412', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>
                  {data.workspace.name} — Workspace Overview
                </h1>
                <p style={{ fontSize: '13px', color: textMuted, margin: 0 }}>
                  Connect accounts &rarr; Create draft &rarr; Approve &amp; Schedule &rarr; Analyze performance.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDraftId(undefined);
                    setDraftTitle('New Multi-Channel Campaign');
                    setSegments([{ id: 'seg_1', text: '', mediaIds: [] }]);
                    setActiveTab('composer');
                  }}
                  className="btn-primary"
                >
                  <span>+ New Draft / Thread</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('connections')}
                  className="btn-secondary"
                >
                  <span>Connect Account</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Connected Accounts', value: `${data.accounts.filter((a: any) => a.healthState === 'connected').length} / ${data.workspace.limits.accounts}`, action: () => setActiveTab('connections') },
                { label: 'Drafts Awaiting Review', value: data.drafts.filter((d: any) => d.status === 'in_review').length, action: () => setActiveTab('team_approvals') },
                { label: 'Scheduled Queue', value: data.drafts.filter((d: any) => d.status === 'scheduled').length, action: () => setActiveTab('planner') },
                { label: 'Monthly Deliveries Used', value: `${data.workspace.usage.deliveriesUsed} / ${data.workspace.limits.deliveriesPerMonth}`, action: () => setActiveTab('publishing_history') },
              ].map((card) => (
                <div
                  key={card.label}
                  onClick={card.action}
                  style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '18px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: textMuted, fontWeight: 600, marginBottom: '6px' }}>{card.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800 }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Recent & Upcoming Drafts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.drafts.map((d: any) => (
                    <div
                      key={d._id}
                      onClick={() => loadDraftIntoComposer(d)}
                      style={{ padding: '12px 14px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          {d.pinned && '📌 '}
                          {d.title}
                        </div>
                        <div style={{ fontSize: '12px', color: textMuted }}>
                          Revision #{d.currentRevisionNumber} &bull; {d.masterSegments?.length || 1} segment(s)
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: d.status === 'published' ? '#DCFCE7' : d.status === 'in_review' ? '#FEF3C7' : '#E2E8F0', color: '#0F172A' }}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Notifications & Connection Alerts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.notifications || []).map((n: any) => (
                    <div key={n._id} style={{ padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}`, fontSize: '12px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{n.title}</div>
                      <div style={{ color: textMuted }}>{n.message}</div>
                    </div>
                  ))}
                  {data.accounts.filter((a: any) => a.healthState !== 'connected').map((a: any) => (
                    <div key={a._id} style={{ padding: '12px', background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '12px', color: '#9A3412' }}>
                      <strong>{a.displayName} ({a.healthState}):</strong> {a.remediationGuide || 'Review connection settings.'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONNECTIONS TAB */}
        {activeTab === 'connections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
                Connected Social Accounts & Brand Groups
              </h1>
              <p style={{ fontSize: '13px', color: textMuted, margin: 0 }}>
                Connect Facebook Pages, Instagram Business/Creator, LinkedIn Member &amp; Organization, X v2 (PKCE), Threads, Bluesky, Mastodon, and Substack Notes.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {Object.values(data.providerCatalog || {}).map((prov: any) => (
                <div key={prov.provider} style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{prov.displayName}</h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: bgMain, color: textMuted }}>
                        {prov.apiVersion}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
                      Scopes: {prov.defaultScopes.slice(0, 3).join(', ')}
                    </p>
                    {prov.provider === 'mastodon' && (
                      <input
                        type="url"
                        value={mastodonInstance}
                        onChange={(e) => setMastodonInstance(e.target.value)}
                        placeholder="https://mastodon.social"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: `1px solid ${borderCol}`, marginBottom: '10px' }}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConnectProvider(prov.provider)}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: '13px' }}
                  >
                    <span>
                      {prov.provider === 'substack'
                        ? 'Enable Assisted Notes Export'
                        : `Connect ${prov.displayName}`}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Active Workspace Accounts</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: textMuted }}>
                    <th style={{ padding: '10px' }}>Account</th>
                    <th style={{ padding: '10px' }}>Provider / Type</th>
                    <th style={{ padding: '10px' }}>Granted Capabilities</th>
                    <th style={{ padding: '10px' }}>Health State</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((acc: any) => (
                    <tr key={acc._id} style={{ borderBottom: `1px solid ${borderCol}` }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700 }}>{acc.displayName}</div>
                        <div style={{ fontSize: '12px', color: textMuted }}>{acc.handle}</div>
                      </td>
                      <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>
                        {acc.provider} ({acc.accountType})
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '12px', color: textMuted }}>
                        Max {acc.capabilities.maxCharacters} chars &bull; {acc.capabilities.maxMediaItems} media
                        {acc.capabilities.canPublishThread && ' • Threads'}
                        {acc.capabilities.canPublishDocument && ' • PDF/Docs'}
                        {acc.capabilities.canReadInsights && ' • Insights'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: acc.healthState === 'connected' ? '#DCFCE7' : '#FEF3C7',
                          color: '#0F172A',
                        }}>
                          {acc.healthState}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleConnectProvider(acc.provider)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: 'transparent', color: textMain, fontSize: '12px', cursor: 'pointer' }}
                        >
                          Reconnect
                        </button>
                        {acc.healthState !== 'disconnected' && (
                          <button
                            type="button"
                            onClick={() =>
                              runDashboardAction(
                                { action: 'disconnect_account', accountId: acc._id },
                                `Disconnected ${acc.displayName} and revoked grant`
                              )
                            }
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FCA5A5', background: 'transparent', color: '#EF4444', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Disconnect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. COMPOSER & AI WRITING ASSISTANT TAB */}
        {activeTab === 'composer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '22px' }}>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    Multi-Channel Thread &amp; Variant Composer
                  </h2>
                  <span style={{ fontSize: '12px', color: textMuted }}>
                    Optimistic Version #{draftVersion} &bull; Approval Rule: {data.workspace.approvalRule}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runDashboardAction(
                      {
                        action: 'save_draft',
                        draftId: selectedDraftId,
                        expectedVersion: selectedDraftId ? draftVersion : undefined,
                        title: draftTitle,
                        targetAccountIds,
                        masterSegments: segments,
                        automations: firstCommentText
                          ? [{ id: 'auto_fc', type: 'first_comment', enabled: true, content: firstCommentText }]
                          : [],
                        changeSummary: 'Saved in composer',
                      },
                      'Saved draft revision'
                    )
                  }
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  <span>Save Revision</span>
                </button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Campaign / Draft Title
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Target Connected Accounts
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.accounts
                    .filter((a: any) => a.healthState !== 'disconnected')
                    .map((acc: any) => {
                      const isSelected = targetAccountIds.includes(acc._id);
                      return (
                        <button
                          key={acc._id}
                          type="button"
                          onClick={() =>
                            setTargetAccountIds((prev) =>
                              isSelected ? prev.filter((id) => id !== acc._id) : [...prev, acc._id]
                            )
                          }
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            border: isSelected ? '2px solid #FF5A00' : `1px solid ${borderCol}`,
                            background: isSelected ? '#FFF7ED' : bgMain,
                            color: isSelected ? '#C2410C' : textMain,
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}
                          {acc.displayName} ({acc.provider.toUpperCase()})
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Thread Segments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {segments.map((seg, idx) => (
                  <div key={seg.id} style={{ padding: '14px', background: bgMain, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      <strong>Segment #{idx + 1}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: seg.text.length > 280 ? '#EF4444' : textMuted, fontWeight: 600 }}>
                          {seg.text.length} / 280 (X) &bull; {seg.text.length} / 3000 (LinkedIn)
                        </span>
                        {segments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSegments((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={seg.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSegments((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, text: val } : item))
                        );
                      }}
                      placeholder="Write your post or thread segment..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, fontSize: '14px', fontFamily: 'inherit' }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setSegments((prev) => [
                      ...prev,
                      { id: `seg_${prev.length + 1}_${Date.now()}`, text: '', mediaIds: [] },
                    ])
                  }
                  style={{ alignSelf: 'flex-start', padding: '7px 14px', borderRadius: '8px', border: `1px dashed ${borderCol}`, background: 'transparent', color: textMain, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add Thread Segment
                </button>
              </div>

              {/* Workflow Automation: First Comment / Auto-Plug */}
              <div style={{ marginBottom: '16px', padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}` }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Opt-In Workflow Automation: First Comment / Thread Finisher
                </label>
                <input
                  type="text"
                  value={firstCommentText}
                  onChange={(e) => setFirstCommentText(e.target.value)}
                  placeholder="Optional auto-reply link or first comment after parent post succeeds..."
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              {/* Natural-Language Scheduling & Publish Controls */}
              <div style={{ padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9A3412', marginBottom: '6px' }}>
                  Natural-Language Scheduler (Parsed &amp; Confirmed Before Queueing)
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={naturalScheduleText}
                    onChange={(e) => setNaturalScheduleText(e.target.value)}
                    placeholder="e.g. tomorrow at 9:30am, next monday 2pm"
                    className="form-input"
                    style={{ flex: 1, fontSize: '13px' }}
                  />
                  <select
                    value={scheduleTimezone}
                    onChange={(e) => setScheduleTimezone(e.target.value)}
                    className="form-input"
                    style={{ width: '160px', fontSize: '13px' }}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                  </select>
                </div>
                <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: 600 }}>
                  Confirmed Target Time: {parsedNaturalTime.formatted} ({scheduleTimezone})
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() =>
                    runDashboardAction(
                      {
                        action: 'request_approval',
                        draftId: selectedDraftId,
                      },
                      'Requested team approval and generated scoped client review link'
                    )
                  }
                  className="btn-secondary"
                >
                  <span>Request Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runDashboardAction(
                      {
                        action: 'schedule_or_publish',
                        draftId: selectedDraftId,
                        publishNow: false,
                        scheduledAtUtc: parsedNaturalTime.date.toISOString(),
                        displayTimezone: scheduleTimezone,
                      },
                      `Scheduled draft for ${parsedNaturalTime.formatted} (${scheduleTimezone})`
                    )
                  }
                  className="btn-primary"
                >
                  <span>Confirm &amp; Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runDashboardAction(
                      {
                        action: 'schedule_or_publish',
                        draftId: selectedDraftId,
                        publishNow: true,
                        displayTimezone: scheduleTimezone,
                      },
                      'Published immediately across selected accounts!'
                    )
                  }
                  style={{ padding: '10px 16px', borderRadius: '999px', border: 'none', background: '#18181B', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  <span>Publish Now</span>
                </button>
              </div>
            </div>

            {/* Right Pane: Live Previews, AI Assistant & Substack Notes Assisted Export */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* AI Writing Assistant */}
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 8px' }}>
                  Configurable AI Writing Assistant
                </h3>
                <p style={{ fontSize: '12px', color: textMuted, margin: '0 0 10px' }}>
                  Uses your workspace tone samples. Output remains reviewable in draft until you explicitly apply it.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { mode: 'hook', label: 'Generate Hook' },
                    { mode: 'thread', label: 'Expand to 3-Part Thread' },
                    { mode: 'repurpose_linkedin', label: 'Repurpose for LinkedIn' },
                    { mode: 'alt_text', label: 'Suggest Alt Text' },
                  ].map((btn) => (
                    <button
                      key={btn.mode}
                      type="button"
                      onClick={async () => {
                        const res = await runDashboardAction({
                          action: 'ai_writing_assist',
                          mode: btn.mode,
                          text: segments[0]?.text || draftTitle,
                        });
                        if (res?.suggestion) {
                          setAiSuggestion(res.suggestion);
                          setAiNotice(res.reviewNotice);
                        }
                      }}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✨ {btn.label}
                    </button>
                  ))}
                </div>
                {aiSuggestion && (
                  <div style={{ padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}`, fontSize: '12px' }}>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{aiSuggestion}</div>
                    <div style={{ fontSize: '11px', color: textMuted, marginBottom: '8px' }}>{aiNotice}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setSegments([{ id: 'seg_ai_1', text: aiSuggestion, mediaIds: [] }]);
                        setAiSuggestion('');
                        setToast('Applied AI draft suggestion to composer.');
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <span>Apply to Draft</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Substack Notes Variant & Assisted Export */}
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Substack Notes Variant (Assisted Export)</h3>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                    Partner API Pending
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={substackNoteText}
                  onChange={(e) => setSubstackNoteText(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, fontSize: '13px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(substackNoteText);
                      setToast('Copied Substack Note variant to clipboard!');
                    }}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Copy Note Text
                  </button>
                  <a
                    href="https://substack.com/notes"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '6px 12px', borderRadius: '8px', background: '#FF5A00', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Open Substack Notes &rarr;
                  </a>
                </div>
              </div>

              {/* Revision History Drawer */}
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px' }}>Immutable Revision History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(data.revisions || [])
                    .filter((r: any) => !selectedDraftId || r.draftId === selectedDraftId)
                    .slice(0, 5)
                    .map((rev: any) => (
                      <div key={rev._id} style={{ padding: '8px 10px', background: bgMain, borderRadius: '8px', border: `1px solid ${borderCol}`, fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Rev #{rev.revisionNumber}:</strong> {rev.changeSummary}
                          {rev.isImmutablePublication && (
                            <span style={{ marginLeft: '6px', color: '#16A34A', fontWeight: 700 }}>(Immutable Publication)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (rev.snapshot?.masterSegments) {
                              setSegments(rev.snapshot.masterSegments);
                              setToast(`Restored Revision #${rev.revisionNumber} into editor`);
                            }
                          }}
                          style={{ padding: '3px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, fontSize: '11px', cursor: 'pointer' }}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PLANNER TAB */}
        {activeTab === 'planner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
                Visual Content Calendar, Recurring Queue Slots &amp; Best Times
              </h1>
              <p style={{ fontSize: '13px', color: textMuted, margin: 0 }}>
                Manage planned placeholders, recurring time slots, and data-backed best-time recommendations.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>Configured Recurring Queue Slots</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.calendarSlots || []).map((slot: any) => (
                    <div key={slot._id} style={{ padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.dayOfWeek]} at {slot.time24h} ({slot.timezone})
                        </div>
                        <div style={{ fontSize: '12px', color: textMuted }}>{slot.label}</div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
                        Active Slot
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>Best Time to Post Recommendations</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.analytics?.bestTimeRecommendations || []).map((rec: any, idx: number) => (
                    <div key={idx} style={{ padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                        <span>{rec.dayOfWeek} at {rec.time24h} ({rec.timezone})</span>
                        <span style={{ color: '#FF5A00' }}>{rec.averageEngagementRate}% avg engagement</span>
                      </div>
                      <div style={{ fontSize: '12px', color: textMuted }}>
                        Sample size: {rec.sampleSize} posts &bull; {rec.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Scheduled &amp; Planned Calendar Items</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {data.drafts.map((d: any) => (
                  <div key={d._id} style={{ padding: '16px', background: bgMain, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#FF5A00', color: '#FFFFFF' }}>
                        {d.campaign || 'General'}
                      </span>
                      <span style={{ fontSize: '11px', color: textMuted }}>{d.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{d.title}</div>
                    <div style={{ fontSize: '12px', color: textMuted, marginBottom: '12px' }}>
                      {d.scheduledAtUtc
                        ? `Scheduled: ${new Date(d.scheduledAtUtc).toLocaleString()} (${d.scheduledTimezone || 'UTC'})`
                        : 'Unscheduled Draft'}
                    </div>
                    <button
                      type="button"
                      onClick={() => loadDraftIntoComposer(d)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open in Composer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. TEAM & APPROVALS TAB */}
        {activeTab === 'team_approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Approval Queue */}
              <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 12px' }}>
                  Draft Approval Queue &amp; Revision Tracking
                </h2>
                <p style={{ fontSize: '12px', color: textMuted, marginBottom: '16px' }}>
                  Editing an approved payload automatically invalidates the approval and requires re-verification on the new revision number.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.drafts.map((d: any) => (
                    <div key={d._id} style={{ padding: '16px', background: bgMain, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '15px' }}>{d.title}</strong>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: d.approvedRevisionNumber === d.currentRevisionNumber ? '#DCFCE7' : '#FEF3C7', color: '#0F172A' }}>
                          {d.approvedRevisionNumber === d.currentRevisionNumber
                            ? `Approved (Rev #${d.approvedRevisionNumber})`
                            : `Current Rev #${d.currentRevisionNumber} (${d.status})`}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 12px' }}>
                        {d.masterSegments?.[0]?.text}
                      </p>

                      {d.clientReviewToken && (
                        <div style={{ fontSize: '11px', color: '#C2410C', background: '#FFF7ED', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                          Scoped Expiring Client Review Token: <code>{d.clientReviewToken}</code>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() =>
                            runDashboardAction(
                              {
                                action: 'decide_approval',
                                draftId: d._id,
                                decision: 'approved',
                                note: `Approved revision #${d.currentRevisionNumber}`,
                              },
                              `Approved "${d.title}" at Revision #${d.currentRevisionNumber}`
                            )
                          }
                          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#16A34A', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✓ Approve Revision #{d.currentRevisionNumber}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runDashboardAction(
                              {
                                action: 'decide_approval',
                                draftId: d._id,
                                decision: 'changes_requested',
                                note: 'Requested copy adjustments before scheduling',
                              },
                              `Requested changes on "${d.title}"`
                            )
                          }
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #F59E0B', background: 'transparent', color: '#D97706', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Request Changes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Members, Invitations & Comments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>
                    Workspace Members &amp; Role Management
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="email"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, fontSize: '13px' }}
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="form-input"
                      style={{ width: '120px', fontSize: '13px' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="publisher">Publisher</option>
                      <option value="editor">Editor</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!inviteEmail) return;
                        runDashboardAction(
                          { action: 'invite_member', email: inviteEmail, role: inviteRole },
                          `Sent workspace invitation to ${inviteEmail}`
                        );
                        setInviteEmail('');
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>Invite</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.teamMembers.map((m: any) => (
                      <div key={m.membershipId} style={{ padding: '10px 12px', background: bgMain, borderRadius: '8px', border: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: '11px', color: textMuted }}>{m.email} &bull; {m.role.toUpperCase()}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            runDashboardAction(
                              { action: 'update_member', targetUserId: m.userId, subAction: 'remove' },
                              `Removed member ${m.email}`
                            )
                          }
                          style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: 'transparent', color: '#EF4444', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Thread */}
                <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>
                    Draft Comments &amp; @Mentions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(data.comments || []).map((c: any) => (
                      <div key={c._id} style={{ padding: '10px', background: bgMain, borderRadius: '8px', border: `1px solid ${borderCol}`, fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                          {c.authorName} <span style={{ color: textMuted, fontWeight: 400 }}>(Rev #{c.revisionNumber})</span>
                        </div>
                        <div>{c.body}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Write a comment with @mention..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!commentInput.trim()) return;
                        runDashboardAction(
                          {
                            action: 'add_comment',
                            draftId: currentDraftObj?._id || data.drafts[0]?._id,
                            body: commentInput,
                          },
                          'Added review comment'
                        );
                        setCommentInput('');
                      }}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PUBLISHING HISTORY TAB */}
        {activeTab === 'publishing_history' && (
          <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '22px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
              Per-Account &amp; Per-Segment Publishing History
            </h1>
            <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 18px' }}>
              Track delivery per destination account and per thread segment. Retrying a failed target preserves all previously published segments.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.deliveryTargets.map((t: any) => (
                <div key={t._id} style={{ padding: '16px', background: bgMain, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>{t.provider}</strong> &bull; Target <code>{t._id}</code> &bull; Revision #{t.revisionNumber}
                      <div style={{ fontSize: '12px', color: textMuted }}>
                        Scheduled: {new Date(t.scheduledAtUtc).toLocaleString()} ({t.displayTimezone})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: t.status === 'published' ? '#DCFCE7' : '#FEF3C7', color: '#0F172A' }}>
                        {t.status}
                      </span>
                      {t.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            runDashboardAction(
                              { action: 'retry_or_reconcile_target', targetId: t._id, subAction: 'safe_retry' },
                              `Retried target ${t._id} while preserving published segments`
                            )
                          }
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          <span>Retry Unpublished Segments</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(t.segmentDeliveries || []).map((seg: any) => (
                      <div key={seg.idempotencyKey} style={{ padding: '8px 12px', background: bgCard, borderRadius: '8px', border: `1px solid ${borderCol}`, fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          Segment #{seg.segmentIndex + 1} (<code>{seg.status}</code>)
                        </span>
                        {seg.remoteUrl ? (
                          <a href={seg.remoteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF5A00', fontWeight: 600 }}>
                            {seg.remotePostId} &nearr;
                          </a>
                        ) : (
                          <span style={{ color: textMuted }}>{seg.error || 'Pending dispatch'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
                  Verified Performance Analytics &amp; CSV Export
                </h1>
                <p style={{ fontSize: '12px', color: textMuted, margin: 0, maxWidth: '720px' }}>
                  {data.analytics?.disclaimer}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() =>
                    runDashboardAction(
                      { action: 'sync_analytics' },
                      'Synced latest account and post metrics'
                    )
                  }
                  className="btn-secondary"
                >
                  <span>Refresh Metrics</span>
                </button>
                <a
                  href={`/api/dashboard?workspaceId=${data.workspace._id}&export=analytics_csv`}
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Download RFC 4180 CSV</span>
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {Object.values(data.analytics?.totalsByProvider || {}).map((prov: any) => (
                <div key={prov.provider} style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                      {prov.provider} Performance
                    </h3>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
                      {prov.coverageStatus}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: bgMain, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: textMuted }}>Impressions</div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{prov.impressions.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: bgMain, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: textMuted }}>Unique Reach</div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>
                        {prov.reach !== null ? prov.reach.toLocaleString() : 'N/A (Not exposed)'}
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: bgMain, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: textMuted }}>Engagements</div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{prov.engagements.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: bgMain, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: textMuted }}>Engagement Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF5A00' }}>
                        {prov.averageEngagementRatePercent !== null ? `${prov.averageEngagementRatePercent}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted, lineHeight: 1.5 }}>
                    <strong>Formula:</strong> <code>{prov.engagementRateFormula}</code><br />
                    <strong>Denominator:</strong> <code>{prov.engagementRateDenominator}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. INTEGRATIONS (REST API, ZAPIER, MCP) TAB */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '22px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
                Versioned REST API v1, Zapier Webhooks &amp; Scoped MCP Tools
              </h1>
              <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 16px' }}>
                Generate revocable workspace API keys for <code>/api/v1/drafts</code>, OpenAPI spec (<code>/api/v1/drafts?openapi=1</code>), Zapier automation hooks, and Model Context Protocol (MCP) tools. All external calls enforce the exact same workspace approval rules as the dashboard.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="API Key Label (e.g. Zapier Content Pipeline, Claude MCP)"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await runDashboardAction(
                      { action: 'create_integration_key', name: newApiKeyName || 'Workspace API Key' },
                      'Generated new workspace integration key'
                    );
                    if (res?.plaintextKey) {
                      setCreatedPlaintextKey(res.plaintextKey);
                      setNewApiKeyName('');
                    }
                  }}
                  className="btn-primary"
                >
                  <span>Generate API Key</span>
                </button>
              </div>

              {createdPlaintextKey && (
                <div style={{ padding: '14px', background: '#052E16', color: '#4ADE80', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                  <strong>Copy your new API key now (shown once):</strong>{' '}
                  <code style={{ background: '#000', padding: '4px 8px', borderRadius: '6px' }}>{createdPlaintextKey}</code>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.integrationKeys || []).map((k: any) => (
                  <div key={k._id} style={{ padding: '12px', background: bgMain, borderRadius: '10px', border: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{k.name} (<code>{k.keyPrefix}...</code>)</div>
                      <div style={{ fontSize: '11px', color: textMuted }}>
                        Scopes: {(k.scopes || []).join(', ')} &bull; Rate Limit: {k.rateLimitPerMinute}/min
                      </div>
                    </div>
                    {k.revokedAt ? (
                      <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700 }}>Revoked</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          runDashboardAction(
                            { action: 'revoke_integration_key', keyId: k._id },
                            `Revoked API key ${k.keyPrefix}`
                          )
                        }
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FCA5A5', background: 'transparent', color: '#EF4444', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Revoke Key
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. PUBLIC SOCIAL PAGE TAB */}
        {activeTab === 'social_page' && (
          <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '22px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
              Opt-In Public Social Page (/u/{data.workspace.publicSocialPage?.slug || data.workspace.slug})
            </h1>
            <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 16px' }}>
              Curate an opt-in public social blog feed of your published threads with explicit visibility and post selection controls.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link
                href={`/u/${data.workspace.publicSocialPage?.slug || data.workspace.slug}`}
                target="_blank"
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <span>View Live Public Social Page &nearr;</span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  runDashboardAction(
                    {
                      action: 'update_public_social_page',
                      enabled: !data.workspace.publicSocialPage?.enabled,
                      slug: data.workspace.publicSocialPage?.slug || data.workspace.slug,
                      title: data.workspace.publicSocialPage?.title || `${data.workspace.name} Social Feed`,
                      bio: data.workspace.publicSocialPage?.bio || '',
                      publishedPostIds: data.drafts
                        .filter((d: any) => d.status === 'published')
                        .map((d: any) => d._id),
                    },
                    'Updated Public Social Page visibility'
                  )
                }
                className="btn-secondary"
              >
                <span>
                  {data.workspace.publicSocialPage?.enabled ? 'Unpublish Social Page' : 'Enable Public Social Page'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
