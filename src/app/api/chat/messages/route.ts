import { NextRequest, NextResponse } from 'next/server';
import { recordChatMessage } from '@/lib/services/inquiries';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await recordChatMessage({
      sessionId: body.sessionId || 'ses_active',
      message: body.message || 'ping',
      currency: body.currency,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sessionId: result.sessionId,
        pricingReply: result.pricingReply,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}
