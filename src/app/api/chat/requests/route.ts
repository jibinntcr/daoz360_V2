import { NextRequest, NextResponse } from 'next/server';
import { submitChatFollowupRequest } from '@/lib/services/inquiries';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const result = await submitChatFollowupRequest({
      sessionId: body.sessionId,
      idempotencyKey: body.idempotencyKey || req.headers.get('idempotency-key') || undefined,
      reference: body.reference,
      name: body.name || 'Website Visitor',
      email: body.email || 'visitor@daoz360.ai',
      company: body.company,
      topic: body.topic || 'general',
      details: body.details,
      customNotes: body.customNotes,
      ipAddress,
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
        reference: result.reference,
        ...(result.deduplicated ? { deduplicated: true } : {}),
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
