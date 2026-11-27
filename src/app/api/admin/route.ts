import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthContextFromCookies,
  hasPlatformPermission,
  verifyCsrfAndOrigin,
  recordAuditEvent,
} from '@/lib/auth';
import { getDb } from '@/lib/db';
import {
  PROVIDER_CATALOG,
  getCallbackUrl,
  runProviderDiagnostics,
  startProviderOAuth,
} from '@/lib/providers';
import { reconcileOrRetryDeliveryTarget, processDuePublishingJobs } from '@/lib/services/publishing';
import { SocialProvider } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContextFromCookies();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  if (!hasPlatformPermission(ctx.user.platformRole, 'platform:view_operations')) {
    return NextResponse.json(
      { ok: false, error: 'Platform Administrator role (Super Admin or Operations Admin) required.' },
      { status: 403 }
    );
  }

  const db = await getDb();
  const baseUrl = process.env.APP_BASE_URL || req.nextUrl.origin;

  const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
  const workspaces = await db.collection('workspaces').find({}).sort({ createdAt: -1 }).toArray();
  const providerSettings = await db.collection('provider_app_settings').find({}).toArray();
  // Exclude customer tokens and private drafts from global inspection!
  const socialAccounts = await db.collection('social_accounts').find({}).toArray();
  const sanitizedAccounts = socialAccounts.map((a) => ({
    _id: a._id,
    workspaceId: a.workspaceId,
    provider: a.provider,
    accountType: a.accountType,
    handle: a.handle,
    displayName: a.displayName,
    healthState: a.healthState,
    lastVerifiedAt: a.lastVerifiedAt,
    lastError: a.lastError,
  }));

  const deliveryTargets = await db
    .collection('delivery_targets')
    .find({})
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();
  // Sanitize targets so customer private draft text is never exposed in global admin inspection
  const sanitizedTargets = deliveryTargets.map((t) => ({
    _id: t._id,
    workspaceId: t.workspaceId,
    draftId: t.draftId,
    revisionNumber: t.revisionNumber,
    accountId: t.accountId,
    provider: t.provider,
    status: t.status,
    scheduledAtUtc: t.scheduledAtUtc,
    displayTimezone: t.displayTimezone,
    scheduleVersion: t.scheduleVersion,
    retryCount: t.retryCount,
    lastError: t.lastError,
    segmentCount: t.segmentDeliveries.length,
    publishedSegments: t.segmentDeliveries.filter((s) => s.status === 'published').length,
    updatedAt: t.updatedAt,
  }));

  const jobs = await db.collection('jobs').find({}).sort({ updatedAt: -1 }).limit(50).toArray();
  const attempts = await db
    .collection('publish_attempts')
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  const metricSnapshots = await db
    .collection('metric_snapshots')
    .find({})
    .sort({ syncedAt: -1 })
    .limit(50)
    .toArray();
  const inquiries = await db
    .collection('inquiries')
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  const auditEvents = await db
    .collection('audit_events')
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const enrichedProviders = providerSettings.map((p) => {
    const meta = PROVIDER_CATALOG[p.provider];
    return {
      ...p,
      catalog: meta,
      callbacks: {
        development: getCallbackUrl(p.provider, 'http://localhost:3000'),
        staging: getCallbackUrl(p.provider, baseUrl),
        production: getCallbackUrl(p.provider, 'https://daoz360.ai'),
      },
      envChecklist: meta.requiredEnvVars.map((envKey) => ({
        name: envKey,
        configured: Boolean(process.env[envKey]),
      })),
    };
  });

  const dueJobsLagCount = jobs.filter(
    (j) => j.status === 'queued' && new Date(j.dueAt).getTime() < Date.now()
  ).length;

  return NextResponse.json({
    ok: true,
    adminUser: {
      _id: ctx.user._id,
      email: ctx.user.email,
      name: ctx.user.name,
      platformRole: ctx.user.platformRole,
    },
    csrfToken: ctx.session.csrfToken,
    overview: {
      totalUsers: users.length,
      totalWorkspaces: workspaces.length,
      configuredProvidersCount: enrichedProviders.filter((p) => p.lastHealthStatus === 'connected').length,
      connectedAccountsCount: sanitizedAccounts.filter((a) => a.healthState === 'connected').length,
      healthyAccountsCount: sanitizedAccounts.filter((a) => a.healthState === 'connected').length,
      publishedTargetsCount: sanitizedTargets.filter((t) => t.status === 'published').length,
      failedTargetsCount: sanitizedTargets.filter(
        (t) => t.status === 'failed' || t.status === 'ambiguous_needs_reconcile'
      ).length,
      queueLagCount: dueJobsLagCount,
      analyticsSnapshotsCount: metricSnapshots.length,
      latestAnalyticsSyncAt: metricSnapshots[0]?.syncedAt || null,
    },
    users: users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      platformRole: u.platformRole,
      status: u.status,
      mfaEnabled: u.mfaEnabled,
      defaultWorkspaceId: u.defaultWorkspaceId,
      createdAt: u.createdAt,
    })),
    workspaces,
    providers: enrichedProviders,
    accounts: sanitizedAccounts,
    publishingOperations: {
      targets: sanitizedTargets,
      jobs,
      attempts,
    },
    analyticsOperations: {
      snapshotsCount: metricSnapshots.length,
      coverageByProvider: Object.keys(PROVIDER_CATALOG).map((prov) => {
        const provSnaps = metricSnapshots.filter((m) => m.provider === prov);
        return {
          provider: prov,
          snapshots: provSnaps.length,
          latestSync: provSnaps[0]?.syncedAt || null,
          status:
            prov === 'substack'
              ? 'unavailable_partner_pending'
              : provSnaps.length > 0
              ? 'healthy'
              : 'awaiting_initial_sync',
        };
      }),
    },
    inquiries,
    auditEvents,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContextFromCookies();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  const csrfCheck = verifyCsrfAndOrigin(req, ctx);
  if (!csrfCheck.ok) {
    return NextResponse.json({ ok: false, error: csrfCheck.error }, { status: 403 });
  }

  if (!hasPlatformPermission(ctx.user.platformRole, 'platform:view_operations')) {
    return NextResponse.json({ ok: false, error: 'Platform Admin role required' }, { status: 403 });
  }

  const body = await req.json();
  const action = body.action;
  const db = await getDb();
  const now = new Date();

  if (action === 'update_provider_config') {
    if (!hasPlatformPermission(ctx.user.platformRole, 'platform:manage_providers')) {
      return NextResponse.json(
        { ok: false, error: 'Only Platform Super Admin can modify provider configurations.' },
        { status: 403 }
      );
    }
    const provider = body.provider as SocialProvider;
    await db.collection('provider_app_settings').updateOne(
      { _id: provider },
      {
        $set: {
          apiVersion: body.apiVersion,
          accessTier: body.accessTier,
          approvalStatus: body.approvalStatus,
          environmentFlags: body.environmentFlags,
          requestedScopes: body.requestedScopes,
          monthlyBudgetLimit: body.monthlyBudgetLimit ? Number(body.monthlyBudgetLimit) : undefined,
          updatedAt: now,
          updatedByUserId: ctx.user._id,
        },
      }
    );

    await recordAuditEvent({
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.user.platformRole,
      action: 'admin.provider_config_updated',
      targetType: 'provider',
      targetId: provider,
      metadata: { approvalStatus: body.approvalStatus, environmentFlags: body.environmentFlags },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === 'run_provider_diagnostics') {
    const provider = body.provider as SocialProvider;
    const diag = await runProviderDiagnostics(
      provider,
      process.env.APP_BASE_URL || req.nextUrl.origin
    );
    await recordAuditEvent({
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.user.platformRole,
      action: 'admin.provider_diagnostics_run',
      targetType: 'provider',
      targetId: provider,
      metadata: { healthState: diag.healthState },
    });
    return NextResponse.json({ ok: true, diagnostics: diag });
  }

  if (action === 'connect_admin_sandbox_account') {
    if (!hasPlatformPermission(ctx.user.platformRole, 'platform:manage_providers')) {
      return NextResponse.json(
        { ok: false, error: 'Only Super Admins can connect DAOZ360 brand/test accounts.' },
        { status: 403 }
      );
    }
    const provider = body.provider as SocialProvider;
    const oauthStart = await startProviderOAuth({
      userId: ctx.user._id,
      sessionId: ctx.session._id,
      workspaceId: 'ws_daoz360_admin',
      provider,
      intendedAction: 'connect',
      baseUrl: process.env.APP_BASE_URL || req.nextUrl.origin,
    });
    return NextResponse.json(oauthStart);
  }

  if (action === 'update_workspace_status_or_plan') {
    const { workspaceId, status, planId } = body;
    const limits =
      planId === 'starter'
        ? { accounts: 5, users: 1, deliveriesPerMonth: 300 }
        : planId === 'agency'
        ? { accounts: 40, users: 10, deliveriesPerMonth: 5000 }
        : { accounts: 15, users: 3, deliveriesPerMonth: 1500 };

    await db.collection('workspaces').updateOne(
      { _id: workspaceId },
      {
        $set: {
          ...(status ? { status } : {}),
          ...(planId ? { planId, limits } : {}),
          updatedAt: now,
        },
      }
    );

    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.user.platformRole,
      action: 'admin.workspace_updated',
      targetType: 'workspace',
      targetId: workspaceId,
      metadata: { status, planId },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'update_user_status') {
    const { userId, status } = body;
    await db.collection('users').updateOne({ _id: userId }, { $set: { status, updatedAt: now } });
    if (status === 'suspended') {
      await db.collection('sessions').updateMany({ userId }, { $set: { revokedAt: now } });
    }
    await recordAuditEvent({
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.user.platformRole,
      action: 'admin.user_status_updated',
      targetType: 'user',
      targetId: userId,
      metadata: { status },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'update_inquiry') {
    const { inquiryId, status, ownerName } = body;
    await db.collection('inquiries').updateOne(
      { _id: inquiryId },
      {
        $set: {
          status,
          ownerUserId: ctx.user._id,
          ownerName: ownerName || ctx.user.name,
          updatedAt: now,
        },
      }
    );
    await recordAuditEvent({
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.user.platformRole,
      action: 'admin.inquiry_updated',
      targetType: 'inquiry',
      targetId: inquiryId,
      metadata: { status, ownerName },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reconcile_or_retry_target') {
    const res = await reconcileOrRetryDeliveryTarget({
      actor: ctx,
      targetId: body.targetId,
      action: body.subAction || 'safe_retry',
    });
    return NextResponse.json(res, { status: res.status });
  }

  if (action === 'run_worker_cycle') {
    const res = await processDuePublishingJobs({
      workerId: `admin-manual-${ctx.user._id}`,
      maxJobs: 10,
    });
    return NextResponse.json({ ok: true, result: res });
  }

  return NextResponse.json({ ok: false, error: 'Unknown admin action' }, { status: 400 });
}
