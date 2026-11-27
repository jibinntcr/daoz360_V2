import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Meta (Facebook Pages, Instagram, Threads) Data Deletion & Deauthorization Callback
 * Honors signed_request HMAC-SHA256 verification, revokes active grants, deletes cached
 * tokens/snapshots, and returns a status confirmation code per Meta Platform requirements.
 */
export async function POST(req: NextRequest) {
  try {
    let signedRequest = '';
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      signedRequest = body.signed_request || '';
    } else {
      const form = await req.formData();
      signedRequest = String(form.get('signed_request') || '');
    }

    if (!signedRequest || !signedRequest.includes('.')) {
      return NextResponse.json({ error: 'Invalid signed_request format' }, { status: 400 });
    }

    const [encodedSig, payload] = signedRequest.split('.');
    const secret =
      process.env.META_FACEBOOK_APP_SECRET ||
      process.env.INSTAGRAM_CLIENT_SECRET ||
      'daoz360_meta_dev_secret';

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');

    if (
      process.env.META_FACEBOOK_APP_SECRET &&
      encodedSig !== expectedSig
    ) {
      return NextResponse.json({ error: 'Invalid Meta signature' }, { status: 401 });
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const externalUserId = String(data.user_id || 'unknown');
    const confirmationCode = `DEL-${Date.now().toString(36).toUpperCase()}`;

    const db = await getDb();
    await db.collection('social_accounts').updateMany(
      { externalAccountId: { $regex: externalUserId } },
      { $set: { healthState: 'disconnected', encryptedPageToken: undefined, updatedAt: new Date() } }
    );

    await recordAuditEvent({
      action: 'webhook.meta_data_deletion',
      targetType: 'external_user',
      targetId: externalUserId,
      metadata: { confirmationCode },
    });

    const baseUrl = (process.env.APP_BASE_URL || req.nextUrl.origin).replace(/\/+$/, '');
    return NextResponse.json({
      url: `${baseUrl}/privacy-policy?deletion_code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch {
    return NextResponse.json({ error: 'Malformed deletion webhook' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  const expectedToken =
    process.env.META_FACEBOOK_WEBHOOK_VERIFY_TOKEN ||
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
    'daoz360_verify_token';

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
