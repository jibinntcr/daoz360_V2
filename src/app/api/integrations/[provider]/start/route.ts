import { NextRequest, NextResponse } from 'next/server';
import { getAuthContextFromCookies, hasWorkspacePermission } from '@/lib/auth';
import { startProviderOAuth, PROVIDER_CATALOG } from '@/lib/providers';
import { SocialProvider } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const socialProvider = provider as SocialProvider;

  if (!PROVIDER_CATALOG[socialProvider]) {
    return NextResponse.json({ ok: false, error: 'Unsupported provider' }, { status: 400 });
  }

  const ctx = await getAuthContextFromCookies();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  if (!hasWorkspacePermission(ctx.membership.role, 'workspace:manage_connections')) {
    return NextResponse.json(
      { ok: false, error: 'Only Workspace Owners or Admins can connect social accounts.' },
      { status: 403 }
    );
  }

  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const baseUrl = process.env.APP_BASE_URL || req.nextUrl.origin;

  const result = await startProviderOAuth({
    userId: ctx.user._id,
    sessionId: ctx.session._id,
    workspaceId: ctx.workspace._id,
    provider: socialProvider,
    intendedAction: body.intendedAction || 'connect',
    instanceUrl: body.instanceUrl,
    baseUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
