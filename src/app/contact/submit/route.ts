import { NextRequest, NextResponse } from 'next/server';
import { createContactInquiry } from '@/lib/services/inquiries';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, any> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = String(value);
      });
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const result = await createContactInquiry({
      name: body.name,
      email: body.email,
      company: body.company,
      channels: body.channels,
      category: body.category,
      plan: body.plan,
      billing: body.billing,
      currency: body.currency,
      message: body.message,
      idempotencyKey: body.idempotencyKey || req.headers.get('idempotency-key') || undefined,
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
        deduplicated: result.deduplicated || false,
        message: result.message,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
