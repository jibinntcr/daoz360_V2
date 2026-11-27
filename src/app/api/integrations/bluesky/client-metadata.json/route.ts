import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const baseUrl = (process.env.APP_BASE_URL || req.nextUrl.origin).replace(/\/+$/, '');
  return NextResponse.json({
    client_id: `${baseUrl}/api/integrations/bluesky/client-metadata.json`,
    client_name: 'DAOZ360 Social Media Management',
    client_uri: baseUrl,
    logo_uri: `${baseUrl}/favicon.png`,
    tos_uri: `${baseUrl}/terms-conditions`,
    policy_uri: `${baseUrl}/privacy-policy`,
    redirect_uris: [`${baseUrl}/api/integrations/bluesky/callback`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  });
}
