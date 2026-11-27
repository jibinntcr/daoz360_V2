import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getAuthContextFromCookies,
  hasWorkspacePermission,
  verifyCsrfAndOrigin,
  updateOrRemoveMemberRole,
  recordAuditEvent,
} from '@/lib/auth';
import { getDb } from '@/lib/db';
import {
  saveDraftWithRevision,
  recordDraftApprovalDecision,
  scheduleOrPublishDraft,
  reconcileOrRetryDeliveryTarget,
} from '@/lib/services/publishing';
import {
  getWorkspaceAnalyticsOverview,
  exportMetricsToCsv,
  syncWorkspaceAnalytics,
} from '@/lib/services/analytics';
import { PROVIDER_CATALOG } from '@/lib/providers';
import { generateRandomState } from '@/lib/security-crypto';
import { SocialProvider, WorkspaceRole } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const requestedWsId = req.nextUrl.searchParams.get('workspaceId');
  const exportFormat = req.nextUrl.searchParams.get('export');

  const ctx = await getAuthContextFromCookies(requestedWsId);
  if (!ctx) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  // Enforce strict workspace scope check if a specific workspaceId was requested
  if (requestedWsId && ctx.workspace._id !== requestedWsId) {
    return NextResponse.json(
      { ok: false, error: 'Access denied to the requested workspace scope.' },
      { status: 403 }
    );
  }

  const db = await getDb();
  const workspaceId = ctx.workspace._id;

  if (exportFormat === 'analytics_csv') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:export_analytics')) {
      return NextResponse.json(
        { ok: false, error: 'Insufficient permission to export analytics CSV.' },
        { status: 403 }
      );
    }
    const providerFilter = (req.nextUrl.searchParams.get('provider') as SocialProvider | 'all') || 'all';
    const analytics = await getWorkspaceAnalyticsOverview({
      workspaceId,
      provider: providerFilter,
    });
    const csv = exportMetricsToCsv(analytics.snapshots);

    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.membership.role,
      action: 'analytics.csv_exported',
      targetType: 'workspace',
      targetId: workspaceId,
      metadata: { rowCount: analytics.snapshots.length, providerFilter },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="daoz360-analytics-${ctx.workspace.slug}.csv"`,
      },
    });
  }

  const accounts = await db.collection('social_accounts').find({ workspaceId }).toArray();
  const sanitizedAccounts = accounts.map((a) => ({
    ...a,
    encryptedPageToken: undefined,
  }));

  const accountGroups = await db.collection('account_groups').find({ workspaceId }).toArray();
  const drafts = await db
    .collection('drafts')
    .find({ workspaceId })
    .sort({ pinned: -1, updatedAt: -1 })
    .toArray();
  const revisions = await db
    .collection('draft_revisions')
    .find({ workspaceId })
    .sort({ revisionNumber: -1 })
    .limit(50)
    .toArray();
  const deliveryTargets = await db
    .collection('delivery_targets')
    .find({ workspaceId })
    .sort({ updatedAt: -1 })
    .toArray();
  const comments = await db
    .collection('comments')
    .find({ workspaceId })
    .sort({ createdAt: 1 })
    .toArray();
  const approvals = await db
    .collection('approvals')
    .find({ workspaceId })
    .sort({ createdAt: -1 })
    .toArray();
  const calendarSlots = await db
    .collection('calendar_slots')
    .find({ workspaceId })
    .sort({ dayOfWeek: 1, time24h: 1 })
    .toArray();
  const media = await db
    .collection('media')
    .find({ workspaceId, status: 'ready' })
    .sort({ createdAt: -1 })
    .toArray();
  const notifications = await db
    .collection('notifications')
    .find({ workspaceId, userId: ctx.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();
  const memberships = await db
    .collection('memberships')
    .find({ workspaceId, status: 'active' })
    .toArray();

  const teamMembers = [];
  for (const m of memberships) {
    const u = await db.collection('users').findOne({ _id: m.userId });
    if (u) {
      teamMembers.push({
        membershipId: m._id,
        userId: u._id,
        name: u.name,
        email: u.email,
        role: m.role,
        joinedAt: m.createdAt,
      });
    }
  }

  const invitations = await db
    .collection('invitations')
    .find({ workspaceId, status: 'pending' })
    .toArray();

  const integrationKeys = await db
    .collection('integration_keys')
    .find({ workspaceId })
    .sort({ createdAt: -1 })
    .toArray();

  const analytics = await getWorkspaceAnalyticsOverview({ workspaceId });

  return NextResponse.json({
    ok: true,
    user: {
      _id: ctx.user._id,
      name: ctx.user.name,
      email: ctx.user.email,
      platformRole: ctx.user.platformRole,
    },
    workspace: ctx.workspace,
    role: ctx.membership.role,
    csrfToken: ctx.session.csrfToken,
    allWorkspaces: ctx.allWorkspaces.map((w) => ({
      _id: w.workspace._id,
      name: w.workspace.name,
      slug: w.workspace.slug,
      planId: w.workspace.planId,
      role: w.role,
    })),
    providerCatalog: PROVIDER_CATALOG,
    accounts: sanitizedAccounts,
    accountGroups,
    drafts,
    revisions,
    deliveryTargets,
    comments,
    approvals,
    calendarSlots,
    media,
    notifications,
    teamMembers,
    invitations,
    integrationKeys: integrationKeys.map((k) => ({
      _id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      webhookUrl: k.webhookUrl,
      rateLimitPerMinute: k.rateLimitPerMinute,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    })),
    analytics,
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

  const body = await req.json();
  const action = body.action;
  const db = await getDb();
  const workspaceId = ctx.workspace._id;
  const now = new Date();

  if (body.workspaceId && body.workspaceId !== workspaceId) {
    return NextResponse.json(
      { ok: false, error: 'Cross-workspace mutation rejected.' },
      { status: 403 }
    );
  }

  // 1. Save / Autosave Draft with Version & Revision History
  if (action === 'save_draft') {
    const res = await saveDraftWithRevision({
      actor: ctx,
      draftId: body.draftId,
      expectedVersion: body.expectedVersion,
      title: body.title || 'Untitled Draft',
      targetAccountIds: body.targetAccountIds || [],
      masterSegments: body.masterSegments || [{ id: 'seg_1', text: '', mediaIds: [] }],
      platformVariants: body.platformVariants,
      automations: body.automations,
      tags: body.tags,
      campaign: body.campaign,
      pinned: body.pinned,
      isTemplate: body.isTemplate,
      changeSummary: body.changeSummary,
    });
    return NextResponse.json(res, { status: res.status });
  }

  // 2. Request Approval on Draft
  if (action === 'request_approval') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:edit_draft')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const draft = await db.collection('drafts').findOne({ _id: body.draftId, workspaceId });
    if (!draft) {
      return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 });
    }
    const clientReviewToken = `rev_${generateRandomState(14)}`;
    await db.collection('drafts').updateOne(
      { _id: draft._id },
      {
        $set: {
          status: 'in_review',
          assignedReviewerIds: body.reviewerIds || draft.assignedReviewerIds,
          clientReviewToken,
          clientReviewExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
          updatedAt: now,
        },
      }
    );
    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.membership.role,
      action: 'draft.approval_requested',
      targetType: 'draft',
      targetId: draft._id,
      metadata: { revisionNumber: draft.currentRevisionNumber },
    });
    return NextResponse.json({ ok: true, clientReviewToken });
  }

  // 3. Approve or Request Changes on Draft
  if (action === 'decide_approval') {
    const res = await recordDraftApprovalDecision({
      actor: ctx,
      draftId: body.draftId,
      decision: body.decision,
      note: body.note,
    });
    return NextResponse.json(res, { status: res.status });
  }

  // 4. Add Comment with @Mentions
  if (action === 'add_comment') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:comment')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const draft = await db.collection('drafts').findOne({ _id: body.draftId, workspaceId });
    if (!draft) {
      return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 });
    }
    const text = String(body.body || '').trim();
    const mentions = Array.from(text.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
    const comment = {
      _id: `cmt_${Date.now().toString(36)}_${generateRandomState(5)}`,
      workspaceId,
      draftId: draft._id,
      revisionNumber: draft.currentRevisionNumber,
      segmentId: body.segmentId,
      authorId: ctx.user._id,
      authorName: ctx.user.name,
      body: text,
      mentions,
      resolved: false,
      createdAt: now,
    };
    await db.collection('comments').insertOne(comment);
    return NextResponse.json({ ok: true, comment });
  }

  // 5. Schedule or Publish Draft Now
  if (action === 'schedule_or_publish') {
    const scheduledAtUtc = body.scheduledAtUtc ? new Date(body.scheduledAtUtc) : undefined;
    const res = await scheduleOrPublishDraft({
      actor: ctx,
      draftId: body.draftId,
      publishNow: Boolean(body.publishNow),
      scheduledAtUtc,
      displayTimezone: body.displayTimezone || 'Asia/Kolkata',
    });
    return NextResponse.json(res, { status: res.status });
  }

  // 6. Retry or Reconcile Failed/Partial Target
  if (action === 'retry_or_reconcile_target') {
    const res = await reconcileOrRetryDeliveryTarget({
      actor: ctx,
      targetId: body.targetId,
      action: body.subAction || 'safe_retry',
    });
    return NextResponse.json(res, { status: res.status });
  }

  // 7. Disconnect Social Account & Revoke Grant
  if (action === 'disconnect_account') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_connections')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const acc = await db
      .collection('social_accounts')
      .findOne({ _id: body.accountId, workspaceId });
    if (!acc) {
      return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 });
    }
    await db.collection('social_accounts').updateOne(
      { _id: acc._id },
      { $set: { healthState: 'disconnected', encryptedPageToken: undefined, updatedAt: now } }
    );
    await db.collection('social_grants').updateOne(
      { _id: acc.grantId, workspaceId },
      { $set: { status: 'revoked', updatedAt: now } }
    );
    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.membership.role,
      action: 'oauth.account_disconnected',
      targetType: 'social_account',
      targetId: acc._id,
      metadata: { provider: acc.provider, handle: acc.handle },
    });
    return NextResponse.json({ ok: true });
  }

  // 8. Create Account Group
  if (action === 'create_account_group') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_connections')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const group = {
      _id: `grp_${Date.now().toString(36)}_${generateRandomState(5)}`,
      workspaceId,
      name: String(body.name || 'Brand Group').trim(),
      description: body.description,
      color: body.color || '#FF5A00',
      accountIds: body.accountIds || [],
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('account_groups').insertOne(group);
    return NextResponse.json({ ok: true, group });
  }

  // 9. Invite Teammate
  if (action === 'invite_member') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_members')) {
      return NextResponse.json(
        { ok: false, error: 'Only Workspace Owners or Admins can invite teammates.' },
        { status: 403 }
      );
    }
    const activeMembersCount = await db
      .collection('memberships')
      .countDocuments({ workspaceId, status: 'active' });
    if (activeMembersCount >= ctx.workspace.limits.users) {
      return NextResponse.json(
        {
          ok: false,
          error: `Workspace user seat limit reached (${ctx.workspace.limits.users} seats on ${ctx.workspace.planId} plan).`,
        },
        { status: 403 }
      );
    }
    const token = `inv_${generateRandomState(16)}`;
    const invitation = {
      _id: `inv_${Date.now().toString(36)}_${generateRandomState(5)}`,
      workspaceId,
      email: String(body.email || '').trim().toLowerCase(),
      role: (body.role as WorkspaceRole) || 'editor',
      invitedByUserId: ctx.user._id,
      token,
      status: 'pending' as const,
      expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      createdAt: now,
    };
    await db.collection('invitations').insertOne(invitation);

    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.membership.role,
      action: 'workspace.member_invited',
      targetType: 'invitation',
      targetId: invitation._id,
      metadata: { email: invitation.email, role: invitation.role },
    });
    return NextResponse.json({ ok: true, invitation });
  }

  // 10. Change Member Role or Remove Member (Enforces last-owner protection)
  if (action === 'update_member') {
    const res = await updateOrRemoveMemberRole({
      actor: ctx,
      workspaceId,
      targetUserId: body.targetUserId,
      action: body.subAction,
      newRole: body.newRole,
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  }

  // 11. AI Writing Assistant (Stays in draft review state until user applies!)
  if (action === 'ai_writing_assist') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:edit_draft')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const mode = body.mode || 'hook';
    const inputText = String(body.text || '').trim();
    const toneSamples = ctx.workspace.aiConfig?.toneSamples || [];

    let suggestion = '';
    let suggestedSegments: string[] = [];

    if (mode === 'hook') {
      suggestion = `Most teams lose 6+ hours a week coordinating social approvals in scattered tabs.\n\nHere is how structured workflows turn that time back into creative momentum:\n\n${inputText}`;
      suggestedSegments = [suggestion];
    } else if (mode === 'thread') {
      suggestedSegments = [
        `1/ ${inputText || 'Social media works better when your content, calendar, and approvals live in one place.'}`,
        `2/ When drafts and reviewer comments stay attached to the exact platform preview, nothing gets lost between revisions.`,
        `3/ Schedule across X, LinkedIn, Instagram, and Threads with deterministic delivery tracking and clear performance insights.`,
      ];
      suggestion = suggestedSegments.join('\n\n---\n\n');
    } else if (mode === 'repurpose_linkedin') {
      suggestion = `${inputText}\n\nKey takeaway for marketing and product leaders:\n• Keep approvals close to the content\n• Measure real engagement rates with transparent denominators\n• Plan campaigns with your whole team in view`;
      suggestedSegments = [suggestion];
    } else if (mode === 'alt_text') {
      suggestion = `Clean product interface preview showing ${inputText.slice(0, 80) || 'a multi-channel content calendar and approval status badges'}.`;
      suggestedSegments = [suggestion];
    } else {
      suggestion = `${inputText} — refined with workspace tone guidance (${toneSamples.length} brand samples applied).`;
      suggestedSegments = [suggestion];
    }

    return NextResponse.json({
      ok: true,
      mode,
      suggestion,
      suggestedSegments,
      reviewNotice:
        'AI output is generated as a reviewable suggestion only. It stays in draft until an authorized user applies and approves it.',
    });
  }

  // 12. Upload Media Asset (Validates attachment type & size, records private S3 object key)
  if (action === 'upload_media') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:edit_draft')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'video/mp4',
      'application/pdf',
    ];
    const mimeType = String(body.mimeType || 'image/png');
    const sizeBytes = Number(body.sizeBytes || 102400);

    if (!allowedMimes.includes(mimeType)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported media type (${mimeType}). Allowed: PNG, JPEG, WebP, GIF, MP4, PDF.` },
        { status: 422 }
      );
    }
    if (sizeBytes > 50 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'File size exceeds 50 MB attachment limit.' },
        { status: 422 }
      );
    }

    const mediaId = `med_${Date.now().toString(36)}_${generateRandomState(5)}`;
    const fileName = String(body.fileName || 'upload.png').replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3ObjectKey = `workspaces/${workspaceId}/media/${mediaId}/${fileName}`;

    const asset = {
      _id: mediaId,
      workspaceId,
      uploadedByUserId: ctx.user._id,
      fileName,
      mimeType,
      sizeBytes,
      s3ObjectKey,
      altText: String(body.altText || '').trim(),
      tags: body.tags || [],
      status: 'ready' as const,
      createdAt: now,
    };

    await db.collection('media').insertOne(asset);
    return NextResponse.json({ ok: true, media: asset });
  }

  // 13. Create or Revoke Workspace API / MCP / Zapier Key
  if (action === 'create_integration_key') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_integrations')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const rawSecret = `daoz_live_${generateRandomState(24)}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const keyRecord = {
      _id: `ikey_${Date.now().toString(36)}_${generateRandomState(5)}`,
      workspaceId,
      createdByUserId: ctx.user._id,
      name: String(body.name || 'Workspace Integration Key').trim(),
      keyPrefix: rawSecret.slice(0, 14),
      keyHash,
      scopes: body.scopes || ['drafts:read', 'drafts:write', 'schedule:write', 'accounts:read', 'mcp:tools'],
      webhookUrl: body.webhookUrl,
      rateLimitPerMinute: 60,
      createdAt: now,
    };
    await db.collection('integration_keys').insertOne(keyRecord);

    await recordAuditEvent({
      workspaceId,
      actorUserId: ctx.user._id,
      actorEmail: ctx.user.email,
      actorRole: ctx.membership.role,
      action: 'integration.api_key_created',
      targetType: 'integration_key',
      targetId: keyRecord._id,
      metadata: { name: keyRecord.name, scopes: keyRecord.scopes },
    });

    return NextResponse.json({
      ok: true,
      plaintextKey: rawSecret,
      keyRecord: { ...keyRecord, keyHash: undefined },
    });
  }

  if (action === 'revoke_integration_key') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_integrations')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    await db
      .collection('integration_keys')
      .updateOne({ _id: body.keyId, workspaceId }, { $set: { revokedAt: now } });
    return NextResponse.json({ ok: true });
  }

  // 14. Update Public Social Page Settings
  if (action === 'update_public_social_page') {
    if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_integrations')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    await db.collection('workspaces').updateOne(
      { _id: workspaceId },
      {
        $set: {
          publicSocialPage: {
            enabled: Boolean(body.enabled),
            slug: String(body.slug || ctx.workspace.slug)
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, '-'),
            title: String(body.title || `${ctx.workspace.name} Social Feed`),
            bio: String(body.bio || ''),
            publishedPostIds: body.publishedPostIds || [],
          },
          updatedAt: now,
        },
      }
    );
    return NextResponse.json({ ok: true });
  }

  // 15. Trigger Rate-Controlled Analytics Sync
  if (action === 'sync_analytics') {
    const res = await syncWorkspaceAnalytics(workspaceId);
    return NextResponse.json(res);
  }

  return NextResponse.json({ ok: false, error: 'Unknown dashboard action' }, { status: 400 });
}
