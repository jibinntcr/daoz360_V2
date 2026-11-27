import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  registerUserAndWorkspace,
  getAuthContextFromCookies,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  recordAuditEvent,
} from '@/lib/auth';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/security-crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get('workspaceId');
  const ctx = await getAuthContextFromCookies(wsId);
  if (!ctx) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      _id: ctx.user._id,
      email: ctx.user.email,
      name: ctx.user.name,
      platformRole: ctx.user.platformRole,
      mfaEnabled: ctx.user.mfaEnabled,
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
      isAdminWorkspace: w.workspace.isAdminWorkspace,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'login';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'browser';

    if (action === 'logout') {
      const ctx = await getAuthContextFromCookies();
      if (ctx) {
        const db = await getDb();
        await db
          .collection('sessions')
          .updateOne({ _id: ctx.session._id }, { $set: { revokedAt: new Date() } });
      }
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(SESSION_COOKIE_NAME);
      res.cookies.delete(CSRF_COOKIE_NAME);
      return res;
    }

    if (action === 'switch_workspace') {
      const ctx = await getAuthContextFromCookies();
      if (!ctx) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      const targetWs = ctx.allWorkspaces.find((w) => w.workspace._id === body.workspaceId);
      if (!targetWs) {
        return NextResponse.json({ ok: false, error: 'Not a member of that workspace' }, { status: 403 });
      }

      const db = await getDb();
      await db
        .collection('sessions')
        .updateOne({ _id: ctx.session._id }, { $set: { workspaceId: targetWs.workspace._id } });

      const updatedCookie = signToken({
        sid: ctx.session._id,
        uid: ctx.user._id,
        wid: targetWs.workspace._id,
        csrf: ctx.session.csrfToken,
        exp: new Date(ctx.session.expiresAt).getTime(),
      });

      const res = NextResponse.json({ ok: true, workspaceId: targetWs.workspace._id });
      res.cookies.set(SESSION_COOKIE_NAME, updatedCookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 3600,
      });
      return res;
    }

    if (action === 'register') {
      const result = await registerUserAndWorkspace({
        name: body.name || '',
        email: body.email || '',
        password: body.password || '',
        workspaceName: body.workspaceName || `${body.name || 'Team'}'s Workspace`,
        planId: body.planId,
        ipAddress,
      });

      if (!result.ok || !result.signedCookie) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      const res = NextResponse.json({
        ok: true,
        user: {
          _id: result.user!._id,
          email: result.user!.email,
          name: result.user!.name,
          platformRole: result.user!.platformRole,
        },
        workspace: result.workspace,
        csrfToken: result.csrfToken,
      });

      res.cookies.set(SESSION_COOKIE_NAME, result.signedCookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 3600,
      });
      res.cookies.set(CSRF_COOKIE_NAME, result.csrfToken!, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 3600,
      });
      return res;
    }

    // Default: login
    const result = await authenticateUser({
      email: body.email || '',
      password: body.password || '',
      totpCode: body.totpCode,
      ipAddress,
      userAgent,
    });

    if (!result.ok || !result.signedCookie) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          requiresMfa: result.requiresMfa || false,
        },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        _id: result.user!._id,
        email: result.user!.email,
        name: result.user!.name,
        platformRole: result.user!.platformRole,
      },
      csrfToken: result.csrfToken,
    });

    res.cookies.set(SESSION_COOKIE_NAME, result.signedCookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });
    res.cookies.set(CSRF_COOKIE_NAME, result.csrfToken!, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    await recordAuditEvent({
      actorUserId: result.user!._id,
      actorEmail: result.user!.email,
      actorRole: result.user!.platformRole,
      action: 'auth.login_cookie_issued',
      targetType: 'user',
      targetId: result.user!._id,
      ipAddress,
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
