import { NextRequest, NextResponse } from 'next/server';
import { createChatLead } from '@/lib/services/inquiries';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const result = await createChatLead({
      name: body.name,
      email: body.email,
      company: body.company,
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
        sessionId: result.sessionId,
        leadId: result.leadId,
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
