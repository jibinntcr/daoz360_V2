import { NextRequest, NextResponse } from 'next/server';
import { getAuthContextFromCookies } from '@/lib/auth';
import { completeProviderOAuthCallback, PROVIDER_CATALOG } from '@/lib/providers';
import { SocialProvider } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const socialProvider = provider as SocialProvider;

  if (!PROVIDER_CATALOG[socialProvider]) {
    return NextResponse.json({ ok: false, error: 'Unsupported provider' }, { status: 400 });
  }

  const state = req.nextUrl.searchParams.get('state') || '';
  const code = req.nextUrl.searchParams.get('code') || '';
  const format = req.nextUrl.searchParams.get('format') || 'redirect';

  if (!state || !code) {
    return NextResponse.json(
      { ok: false, error: 'Missing required OAuth state or authorization code' },
      { status: 400 }
    );
  }

  const ctx = await getAuthContextFromCookies();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: 'Active session required to complete OAuth callback' }, { status: 401 });
  }

  const result = await completeProviderOAuthCallback({
    provider: socialProvider,
    state,
    code,
    currentUserId: ctx.user._id,
    currentSessionId: ctx.session._id,
    currentWorkspaceId: ctx.workspace._id,
    selectedAssetType: (req.nextUrl.searchParams.get('assetType') as any) || undefined,
    customHandle: req.nextUrl.searchParams.get('handle') || undefined,
  });

  if (format === 'json' || req.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json(
      {
        ok: result.ok,
        accountsConnected: result.accountsConnected,
        error: result.error,
      },
      { status: result.status }
    );
  }

  const redirectTarget = ctx.workspace.isAdminWorkspace
    ? new URL('/admin?tab=providers', req.nextUrl.origin)
    : new URL('/dashboard?tab=connections', req.nextUrl.origin);

  if (result.ok) {
    redirectTarget.searchParams.set('connected', socialProvider);
  } else {
    redirectTarget.searchParams.set('oauth_error', result.error || 'Connection failed');
  }

  return NextResponse.redirect(redirectTarget);
}
