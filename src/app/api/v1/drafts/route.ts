import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/services/inquiries';
import { generateRandomState } from '@/lib/security-crypto';
import { recordAuditEvent } from '@/lib/auth';

export const runtime = 'nodejs';

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';
  const rawKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : apiKeyHeader.trim();

  if (!rawKey) return null;

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const db = await getDb();
  const keyDoc = await db.collection('integration_keys').findOne({ keyHash });
  if (!keyDoc || keyDoc.revokedAt) return null;

  const workspace = await db.collection('workspaces').findOne({ _id: keyDoc.workspaceId });
  if (!workspace || workspace.status !== 'active') return null;

  await db
    .collection('integration_keys')
    .updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } });

  return { keyDoc, workspace };
}

/**
 * Versioned REST API v1 (/api/v1/drafts) + OpenAPI Spec + Scoped MCP Tool execution
 * Compatible with Typefully API workflows, Zapier webhooks, and MCP tools.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('openapi') === '1') {
    return NextResponse.json({
      openapi: '3.1.0',
      info: {
        title: 'DAOZ360 Workspace REST & MCP API',
        version: '1.0.0',
        description:
          'Workspace-scoped REST API for drafts, scheduling, connected social accounts, and MCP tools. Requires Bearer API key and honors workspace approval rules.',
      },
      paths: {
        '/api/v1/drafts': {
          get: { summary: 'List workspace drafts, scheduled posts, and connected accounts' },
          post: { summary: 'Create draft, schedule draft, or invoke scoped MCP tool' },
        },
      },
    });
  }

  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Valid workspace API key required (Authorization: Bearer daoz_live_...)' },
      { status: 401 }
    );
  }

  const allowed = await checkRateLimit(`apikey_${auth.keyDoc._id}`, auth.keyDoc.rateLimitPerMinute, 60);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'API key rate limit exceeded' }, { status: 429 });
  }

  if (!auth.keyDoc.scopes.includes('drafts:read')) {
    return NextResponse.json({ ok: false, error: 'Missing drafts:read scope' }, { status: 403 });
  }

  const db = await getDb();
  const drafts = await db
    .collection('drafts')
    .find({ workspaceId: auth.workspace._id })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  const accounts = auth.keyDoc.scopes.includes('accounts:read')
    ? await db
        .collection('social_accounts')
        .find({ workspaceId: auth.workspace._id, healthState: 'connected' })
        .toArray()
    : [];

  return NextResponse.json({
    ok: true,
    workspace: {
      id: auth.workspace._id,
      name: auth.workspace.name,
      slug: auth.workspace.slug,
      approvalRule: auth.workspace.approvalRule,
    },
    drafts,
    accounts: accounts.map((a) => ({
      id: a._id,
      provider: a.provider,
      handle: a.handle,
      displayName: a.displayName,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Valid workspace API key required' },
      { status: 401 }
    );
  }

  const allowed = await checkRateLimit(`apikey_${auth.keyDoc._id}`, auth.keyDoc.rateLimitPerMinute, 60);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'API key rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json();
  const db = await getDb();
  const now = new Date();

  // Support scoped MCP tool calls (drafts.create, drafts.add_feedback, calendar.list_slots)
  if (body.mcpTool) {
    if (!auth.keyDoc.scopes.includes('mcp:tools')) {
      return NextResponse.json({ ok: false, error: 'Missing mcp:tools scope' }, { status: 403 });
    }
    if (body.mcpTool === 'calendar.list_slots') {
      const slots = await db
        .collection('calendar_slots')
        .find({ workspaceId: auth.workspace._id })
        .toArray();
      return NextResponse.json({ ok: true, tool: body.mcpTool, slots });
    }
  }

  if (!auth.keyDoc.scopes.includes('drafts:write')) {
    return NextResponse.json({ ok: false, error: 'Missing drafts:write scope' }, { status: 403 });
  }

  // Honor workspace review rules: external API/Zapier/MCP cannot bypass required approval!
  const wantsSchedule = Boolean(body.scheduleAt);
  if (wantsSchedule) {
    if (!auth.keyDoc.scopes.includes('schedule:write')) {
      return NextResponse.json({ ok: false, error: 'Missing schedule:write scope' }, { status: 403 });
    }
    if (auth.workspace.approvalRule === 'required_before_schedule') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Workspace approval rules require a reviewer to approve this draft before it can be scheduled. Submit as a draft or in_review first.',
        },
        { status: 403 }
      );
    }
  }

  const contentText = String(body.content || body.text || '').trim();
  const segments = contentText
    .split(/\n{3,}|---/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text, idx) => ({
      id: `seg_${idx + 1}`,
      text,
      mediaIds: [],
    }));

  const draftId = `drf_api_${Date.now().toString(36)}_${generateRandomState(5)}`;
  const draft = {
    _id: draftId,
    workspaceId: auth.workspace._id,
    authorId: auth.keyDoc.createdByUserId,
    title: String(body.title || segments[0]?.text?.slice(0, 60) || 'API Draft'),
    status: (body.requestReview ? 'in_review' : 'draft') as 'in_review' | 'draft',
    version: 1,
    currentRevisionNumber: 1,
    tags: body.tags || ['API'],
    campaign: body.campaign,
    pinned: false,
    isTemplate: false,
    targetAccountIds: body.targetAccountIds || [],
    masterSegments: segments.length ? segments : [{ id: 'seg_1', text: contentText, mediaIds: [] }],
    platformVariants: {},
    automations: [],
    assignedReviewerIds: [],
    scheduleVersion: 1,
    publishedOnSocialPage: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('drafts').insertOne(draft);

  await recordAuditEvent({
    workspaceId: auth.workspace._id,
    actorUserId: auth.keyDoc.createdByUserId,
    action: 'api.v1_draft_created',
    targetType: 'draft',
    targetId: draft._id,
    metadata: { keyPrefix: auth.keyDoc.keyPrefix, status: draft.status },
  });

  return NextResponse.json({ ok: true, draft }, { status: 201 });
}
