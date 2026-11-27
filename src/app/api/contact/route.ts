import { NextRequest } from 'next/server';
import { POST as submitContact } from '@/app/contact/submit/route';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return submitContact(req);
}
