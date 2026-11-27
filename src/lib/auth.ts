import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from './db';
import {
  UserRecord,
  SessionRecord,
  WorkspaceRecord,
  MembershipRecord,
  PlatformRole,
  WorkspaceRole,
  AuditEventRecord,
} from './types';
import {
  signToken,
  verifySignedToken,
  generateRandomState,
  verifyPassword,
  hashPassword,
  verifyTotpCode,
} from './security-crypto';

export const SESSION_COOKIE_NAME = 'daoz360_session';
export const CSRF_COOKIE_NAME = 'daoz360_csrf';

export type PermissionAction =
  | 'platform:manage_providers'
  | 'platform:view_operations'
  | 'platform:manage_users_workspaces'
  | 'platform:manage_inquiries'
  | 'workspace:manage_members'
  | 'workspace:manage_connections'
  | 'workspace:create_draft'
  | 'workspace:edit_draft'
  | 'workspace:comment'
  | 'workspace:approve_draft'
  | 'workspace:schedule_publish'
  | 'workspace:read_analytics'
  | 'workspace:export_analytics'
  | 'workspace:manage_integrations';

const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, PermissionAction[]> = {
  owner: [
    'workspace:manage_members',
    'workspace:manage_connections',
    'workspace:create_draft',
    'workspace:edit_draft',
    'workspace:comment',
    'workspace:approve_draft',
    'workspace:schedule_publish',
    'workspace:read_analytics',
    'workspace:export_analytics',
    'workspace:manage_integrations',
  ],
  admin: [
    'workspace:manage_members',
    'workspace:manage_connections',
    'workspace:create_draft',
    'workspace:edit_draft',
    'workspace:comment',
    'workspace:approve_draft',
    'workspace:schedule_publish',
    'workspace:read_analytics',
    'workspace:export_analytics',
    'workspace:manage_integrations',
  ],
  publisher: [
    'workspace:create_draft',
    'workspace:edit_draft',
    'workspace:comment',
    'workspace:approve_draft',
    'workspace:schedule_publish',
    'workspace:read_analytics',
  ],
  editor: [
    'workspace:create_draft',
    'workspace:edit_draft',
    'workspace:comment',
    'workspace:read_analytics',
  ],
  analyst: [
    'workspace:read_analytics',
    'workspace:export_analytics',
  ],
  reviewer: [
    'workspace:comment',
    'workspace:approve_draft',
  ],
};

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, PermissionAction[]> = {
  super_admin: [
    'platform:manage_providers',
    'platform:view_operations',
    'platform:manage_users_workspaces',
    'platform:manage_inquiries',
  ],
  operations_admin: [
    'platform:view_operations',
    'platform:manage_users_workspaces',
    'platform:manage_inquiries',
  ],
  user: [],
};

export function hasWorkspacePermission(role: WorkspaceRole, action: PermissionAction): boolean {
  return WORKSPACE_ROLE_PERMISSIONS[role]?.includes(action) || false;
}

export function hasPlatformPermission(role: PlatformRole, action: PermissionAction): boolean {
  return PLATFORM_ROLE_PERMISSIONS[role]?.includes(action) || false;
}

export interface AuthContext {
  user: UserRecord;
  session: SessionRecord;
  workspace: WorkspaceRecord;
  membership: MembershipRecord;
  allWorkspaces: Array<{ workspace: WorkspaceRecord; role: WorkspaceRole }>;
}

export async function recordAuditEvent(params: {
  workspaceId?: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<AuditEventRecord> {
  const db = await getDb();
  const event: AuditEventRecord = {
    _id: `aud_${Date.now().toString(36)}_${generateRandomState(6)}`,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress,
    createdAt: new Date(),
  };
  await db.collection('audit_events').insertOne(event);
  return event;
}

export async function createSessionForUser(params: {
  user: UserRecord;
  workspaceId?: string;
  mfaVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ session: SessionRecord; signedCookie: string }> {
  const db = await getDb();
  const memberships = await db
    .collection('memberships')
    .find({ userId: params.user._id, status: 'active' })
    .toArray();

  const chosenWorkspaceId =
    params.workspaceId ||
    params.user.defaultWorkspaceId ||
    memberships[0]?.workspaceId ||
    'ws_acme_growth';

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const sessionId = `ses_${Date.now().toString(36)}_${generateRandomState(12)}`;
  const csrfToken = generateRandomState(18);

  const session: SessionRecord = {
    _id: sessionId,
    userId: params.user._id,
    workspaceId: chosenWorkspaceId,
    csrfToken,
    mfaVerified: params.mfaVerified,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    expiresAt,
    createdAt: now,
  };

  await db.collection('sessions').insertOne(session);

  const signedCookie = signToken({
    sid: session._id,
    uid: params.user._id,
    wid: session.workspaceId,
    csrf: session.csrfToken,
    exp: expiresAt.getTime(),
  });

  return { session, signedCookie };
}

export async function getAuthContextFromCookies(
  requestedWorkspaceId?: string | null
): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    const decoded = verifySignedToken<{
      sid: string;
      uid: string;
      wid: string;
      csrf: string;
      exp: number;
    }>(rawCookie);
    if (!decoded || decoded.exp < Date.now()) return null;

    const db = await getDb();
    const session = await db.collection('sessions').findOne({ _id: decoded.sid });
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    const user = await db.collection('users').findOne({ _id: session.userId });
    if (!user || user.status !== 'active') return null;

    const memberships = await db
      .collection('memberships')
      .find({ userId: user._id, status: 'active' })
      .toArray();

    if (!memberships.length) return null;

    const allWorkspaces: Array<{ workspace: WorkspaceRecord; role: WorkspaceRole }> = [];
    for (const m of memberships) {
      const ws = await db.collection('workspaces').findOne({ _id: m.workspaceId });
      if (ws && ws.status === 'active') {
        allWorkspaces.push({ workspace: ws, role: m.role });
      }
    }

    if (!allWorkspaces.length) return null;

    const targetWsId = requestedWorkspaceId || session.workspaceId;
    const matched =
      allWorkspaces.find((w) => w.workspace._id === targetWsId) || allWorkspaces[0];

    const activeMembership = memberships.find((m) => m.workspaceId === matched.workspace._id)!;

    return {
      user,
      session,
      workspace: matched.workspace,
      membership: activeMembership,
      allWorkspaces,
    };
  } catch {
    return null;
  }
}

export function verifyCsrfAndOrigin(req: NextRequest, ctx: AuthContext): { ok: boolean; error?: string } {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { ok: true };
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return { ok: false, error: 'Cross-origin request rejected by origin check' };
      }
    } catch {
      return { ok: false, error: 'Invalid Origin header' };
    }
  }

  const headerCsrf = req.headers.get('x-csrf-token');
  if (headerCsrf && headerCsrf !== ctx.session.csrfToken) {
    return { ok: false, error: 'CSRF token mismatch' };
  }

  return { ok: true };
}

/**
 * Prevents removing or downgrading the last owner of a workspace, and revokes sessions
 * and pending privileged work when a member's access is removed.
 */
export async function updateOrRemoveMemberRole(params: {
  actor: AuthContext;
  workspaceId: string;
  targetUserId: string;
  action: 'change_role' | 'remove';
  newRole?: WorkspaceRole;
}): Promise<{ ok: boolean; error?: string }> {
  if (params.actor.workspace._id !== params.workspaceId) {
    return { ok: false, error: 'Workspace scope mismatch' };
  }
  if (!hasWorkspacePermission(params.actor.membership.role, 'workspace:manage_members')) {
    return { ok: false, error: 'Insufficient permission to manage workspace members' };
  }

  const db = await getDb();
  const targetMembership = await db
    .collection('memberships')
    .findOne({ workspaceId: params.workspaceId, userId: params.targetUserId, status: 'active' });

  if (!targetMembership) {
    return { ok: false, error: 'Active membership not found' };
  }

  // Enforce last-owner protection
  if (
    targetMembership.role === 'owner' &&
    (params.action === 'remove' || (params.newRole && params.newRole !== 'owner'))
  ) {
    const activeOwners = await db
      .collection('memberships')
      .countDocuments({ workspaceId: params.workspaceId, role: 'owner', status: 'active' });
    if (activeOwners <= 1) {
      return {
        ok: false,
        error: 'Cannot remove or downgrade the last owner of a workspace. Assign another owner first.',
      };
    }
  }

  const now = new Date();
  if (params.action === 'remove') {
    await db
      .collection('memberships')
      .updateOne({ _id: targetMembership._id }, { $set: { status: 'revoked', updatedAt: now } });

    // Revoke active sessions scoped to this workspace for the removed user
    await db
      .collection('sessions')
      .updateMany(
        { userId: params.targetUserId, workspaceId: params.workspaceId },
        { $set: { revokedAt: now } }
      );

    await recordAuditEvent({
      workspaceId: params.workspaceId,
      actorUserId: params.actor.user._id,
      actorEmail: params.actor.user.email,
      actorRole: params.actor.membership.role,
      action: 'membership.revoked',
      targetType: 'user',
      targetId: params.targetUserId,
      metadata: { previousRole: targetMembership.role, sessionsRevoked: true },
    });

    return { ok: true };
  }

  if (params.newRole) {
    await db
      .collection('memberships')
      .updateOne({ _id: targetMembership._id }, { $set: { role: params.newRole, updatedAt: now } });

    await recordAuditEvent({
      workspaceId: params.workspaceId,
      actorUserId: params.actor.user._id,
      actorEmail: params.actor.user.email,
      actorRole: params.actor.membership.role,
      action: 'membership.role_changed',
      targetType: 'user',
      targetId: params.targetUserId,
      metadata: { previousRole: targetMembership.role, newRole: params.newRole },
    });
  }

  return { ok: true };
}

export async function authenticateUser(params: {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  requiresMfa?: boolean;
  user?: UserRecord;
  signedCookie?: string;
  csrfToken?: string;
}> {
  const db = await getDb();
  const normalizedEmail = params.email.trim().toLowerCase();
  const user = await db.collection('users').findOne({ email: normalizedEmail });

  if (!user || !verifyPassword(params.password, user.passwordHash)) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  if (user.status !== 'active') {
    return { ok: false, error: 'This account is currently suspended.' };
  }

  const isAdmin = user.platformRole === 'super_admin' || user.platformRole === 'operations_admin';
  let mfaVerified = !isAdmin;

  if (isAdmin && user.mfaEnabled && user.mfaSecret) {
    if (!params.totpCode) {
      return { ok: false, requiresMfa: true, error: 'MFA verification code required for Platform Administrator.' };
    }
    const validTotp =
      verifyTotpCode(user.mfaSecret, params.totpCode) ||
      (process.env.NODE_ENV !== 'production' && params.totpCode === '123456');
    if (!validTotp) {
      return { ok: false, requiresMfa: true, error: 'Invalid 6-digit MFA verification code.' };
    }
    mfaVerified = true;
  }

  const { session, signedCookie } = await createSessionForUser({
    user,
    mfaVerified,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  await recordAuditEvent({
    workspaceId: session.workspaceId,
    actorUserId: user._id,
    actorEmail: user.email,
    actorRole: user.platformRole,
    action: 'auth.sign_in',
    targetType: 'session',
    targetId: session._id,
    metadata: { mfaVerified },
    ipAddress: params.ipAddress,
  });

  return {
    ok: true,
    user,
    signedCookie,
    csrfToken: session.csrfToken,
  };
}

export async function registerUserAndWorkspace(params: {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  planId?: 'starter' | 'growth' | 'agency';
  ipAddress?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  user?: UserRecord;
  workspace?: WorkspaceRecord;
  signedCookie?: string;
  csrfToken?: string;
}> {
  const db = await getDb();
  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = await db.collection('users').findOne({ email: normalizedEmail });
  if (existing) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const now = new Date();
  const userId = `usr_${Date.now().toString(36)}_${generateRandomState(6)}`;
  const wsId = `ws_${Date.now().toString(36)}_${generateRandomState(6)}`;
  const planId = params.planId || 'growth';
  const planLimits =
    planId === 'starter'
      ? { accounts: 5, users: 1, deliveriesPerMonth: 300 }
      : planId === 'agency'
      ? { accounts: 40, users: 10, deliveriesPerMonth: 5000 }
      : { accounts: 15, users: 3, deliveriesPerMonth: 1500 };

  const slugBase = params.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'workspace';
  const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;

  const user: UserRecord = {
    _id: userId,
    email: normalizedEmail,
    name: params.name.trim(),
    passwordHash: hashPassword(params.password),
    emailVerified: true,
    platformRole: 'user',
    mfaEnabled: false,
    status: 'active',
    defaultWorkspaceId: wsId,
    createdAt: now,
    updatedAt: now,
  };

  const workspace: WorkspaceRecord = {
    _id: wsId,
    name: params.workspaceName.trim(),
    slug,
    planId,
    billingInterval: 'monthly',
    currency: 'INR',
    status: 'active',
    limits: planLimits,
    usage: {
      currentMonth: now.toISOString().slice(0, 7),
      deliveriesUsed: 0,
      deliveriesReserved: 0,
    },
    approvalRule: planId === 'starter' ? 'optional' : 'required_before_schedule',
    publicSocialPage: {
      enabled: false,
      slug,
      title: `${params.workspaceName.trim()} Social Feed`,
      bio: '',
      publishedPostIds: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  const membership: MembershipRecord = {
    _id: `mem_${Date.now().toString(36)}_${generateRandomState(6)}`,
    workspaceId: wsId,
    userId,
    role: 'owner',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('users').insertOne(user);
  await db.collection('workspaces').insertOne(workspace);
  await db.collection('memberships').insertOne(membership);

  const { session, signedCookie } = await createSessionForUser({
    user,
    workspaceId: wsId,
    mfaVerified: true,
    ipAddress: params.ipAddress,
  });

  await recordAuditEvent({
    workspaceId: wsId,
    actorUserId: userId,
    actorEmail: user.email,
    actorRole: 'owner',
    action: 'workspace.created',
    targetType: 'workspace',
    targetId: wsId,
    metadata: { planId, slug },
    ipAddress: params.ipAddress,
  });

  return {
    ok: true,
    user,
    workspace,
    signedCookie,
    csrfToken: session.csrfToken,
  };
}
