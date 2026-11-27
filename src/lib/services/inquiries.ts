import { getDb } from '@/lib/db';
import { InquiryRecord, ChatMessageRecord } from '@/lib/types';
import { getPricingChatReply, PRICE_BOOK, SupportedCurrency } from '@/lib/config';
import { generateRandomState } from '@/lib/security-crypto';

const SPAM_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /\b(viagra|casino|crypto\s+airdrop)\b/i,
];

export async function checkRateLimit(key: string, maxRequests = 25, windowSeconds = 60): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  const existing = await db.collection('rate_limits').findOne({ key });

  if (!existing || new Date(existing.expiresAt).getTime() < now.getTime()) {
    await db.collection('rate_limits').updateOne(
      { key },
      {
        $set: {
          _id: `rl_${key}`,
          key,
          count: 1,
          expiresAt: new Date(now.getTime() + windowSeconds * 1000),
        },
      },
      { upsert: true }
    );
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  await db.collection('rate_limits').updateOne({ key }, { $inc: { count: 1 } });
  return true;
}

export function isSpamContent(text: string): boolean {
  return SPAM_PATTERNS.some((re) => re.test(text));
}

function generateDateStamp(): string {
  return new Date().toISOString().slice(2, 10).replace(/-/g, '');
}

function generateRandomFourDigits(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * Shared service for POST /contact/submit and POST /api/contact
 * Enforces validation, spam check, database-backed idempotency, and confirms only after a durable write.
 */
export async function createContactInquiry(params: {
  name: string;
  email: string;
  company?: string;
  channels?: string;
  category?: string;
  plan?: string;
  billing?: string;
  currency?: string;
  message: string;
  idempotencyKey?: string;
  ipAddress?: string;
}): Promise<{
  ok: boolean;
  status: number;
  reference?: string;
  message?: string;
  deduplicated?: boolean;
  error?: string;
}> {
  const ipKey = `contact_${params.ipAddress || 'anon'}`;
  const allowed = await checkRateLimit(ipKey, 20, 60);
  if (!allowed) {
    return { ok: false, status: 429, error: 'Too many requests. Please try again in a minute.' };
  }

  const name = (params.name || '').trim();
  const email = (params.email || '').trim();
  const company = (params.company || '').trim();
  const channels = (params.channels || '').trim();
  const category = (params.category || 'Product Enquiry').trim();
  const message = (params.message || '').trim();

  if (!name || name.length > 100) {
    return { ok: false, status: 422, error: 'Name is required (max 100 characters).' };
  }
  if (!email || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 422, error: 'A valid email address is required.' };
  }
  if (!message || message.length > 5000) {
    return { ok: false, status: 422, error: 'Message is required (max 5000 characters).' };
  }

  if (isSpamContent(`${name} ${company} ${message}`)) {
    return { ok: false, status: 422, error: 'Submission rejected by spam filter.' };
  }

  const db = await getDb();
  const idemKey =
    params.idempotencyKey ||
    `contact_${email.toLowerCase()}_${Buffer.from(message.slice(0, 120)).toString('base64url').slice(0, 32)}`;

  const existing = await db.collection('inquiries').findOne({ idempotencyKey: idemKey });
  if (existing) {
    return {
      ok: true,
      status: 200,
      reference: existing.reference,
      deduplicated: true,
      message: `Thank you! Your inquiry (${existing.reference}) has been received by our team.`,
    };
  }

  const reference = `DAOZ-INQ-${generateDateStamp()}-${generateRandomFourDigits()}`;
  const now = new Date();

  const record: InquiryRecord = {
    _id: `inq_${Date.now().toString(36)}_${generateRandomState(6)}`,
    reference,
    idempotencyKey: idemKey,
    kind: 'contact_inquiry',
    name,
    email,
    company: company || undefined,
    channels: channels || undefined,
    category,
    plan: params.plan || undefined,
    billing: params.billing || undefined,
    currency: params.currency || undefined,
    message,
    status: 'New',
    ipAddress: params.ipAddress,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('inquiries').insertOne(record);

  return {
    ok: true,
    status: 200,
    reference,
    message: `Thank you! Your inquiry (${reference}) has been received by our team.`,
  };
}

/**
 * Shared service for POST /api/chat/leads
 */
export async function createChatLead(params: {
  name: string;
  email: string;
  company?: string;
  ipAddress?: string;
}): Promise<{
  ok: boolean;
  status: number;
  sessionId?: string;
  leadId?: string;
  error?: string;
}> {
  const ipKey = `chat_lead_${params.ipAddress || 'anon'}`;
  if (!(await checkRateLimit(ipKey, 30, 60))) {
    return { ok: false, status: 429, error: 'Rate limit exceeded' };
  }

  const name = (params.name || '').trim();
  const email = (params.email || '').trim();
  const company = (params.company || '').trim();

  if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 422, error: 'Validation failed' };
  }
  if (company.length > 120) {
    return { ok: false, status: 422, error: 'Company name must be under 120 characters' };
  }

  const sessionId = `ses_${Date.now().toString(36)}_${generateRandomState(6)}`;
  const leadId = `lead_${Date.now().toString(36)}_${generateRandomState(4)}`;
  const now = new Date();

  const db = await getDb();
  const record: InquiryRecord = {
    _id: `inq_${leadId}`,
    reference: leadId.toUpperCase(),
    idempotencyKey: `lead_${sessionId}`,
    kind: 'chat_lead',
    sessionId,
    leadId,
    name,
    email,
    company: company || undefined,
    category: 'Chat Pre-Chat Lead',
    message: `Started automated chat session (${sessionId})`,
    status: 'New',
    ipAddress: params.ipAddress,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('inquiries').insertOne(record);

  return {
    ok: true,
    status: 200,
    sessionId,
    leadId,
  };
}

/**
 * Shared service for POST /api/chat/messages
 */
export async function recordChatMessage(params: {
  sessionId: string;
  message: string;
  currency?: string;
}): Promise<{
  ok: boolean;
  status: number;
  sessionId?: string;
  pricingReply?: string;
  error?: string;
}> {
  const sessionId = (params.sessionId || 'ses_active').trim().slice(0, 80);
  const message = (params.message || '').trim().slice(0, 1000);
  const currency: SupportedCurrency = params.currency === 'USD' ? 'USD' : 'INR';

  if (!message) {
    return { ok: false, status: 422, error: 'Message cannot be empty' };
  }

  const db = await getDb();
  const record: ChatMessageRecord = {
    _id: `cmsg_${Date.now().toString(36)}_${generateRandomState(6)}`,
    sessionId,
    sender: 'user',
    message,
    currency,
    createdAt: new Date(),
  };

  await db.collection('chat_messages').insertOne(record);

  const pricingReply = getPricingChatReply(currency, PRICE_BOOK.mode);

  return {
    ok: true,
    status: 200,
    sessionId,
    pricingReply,
  };
}

/**
 * Shared service for POST /api/chat/requests with MongoDB-backed idempotency
 */
export async function submitChatFollowupRequest(params: {
  sessionId?: string;
  idempotencyKey?: string;
  reference?: string;
  name: string;
  email: string;
  company?: string;
  topic: string;
  details?: Record<string, unknown>;
  customNotes?: string;
  ipAddress?: string;
}): Promise<{
  ok: boolean;
  status: number;
  reference?: string;
  deduplicated?: boolean;
  error?: string;
}> {
  const ipKey = `chat_req_${params.ipAddress || 'anon'}`;
  if (!(await checkRateLimit(ipKey, 30, 60))) {
    return { ok: false, status: 429, error: 'Rate limit exceeded' };
  }

  const name = (params.name || 'Website Visitor').trim().slice(0, 80);
  const email = (params.email || '').trim().slice(0, 150);
  const topic = (params.topic || 'general').trim().slice(0, 50);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 422, error: 'Valid email is required' };
  }

  const prefix = topic === 'pricing' ? 'PRC' : topic === 'demo' ? 'DMO' : 'SPT';
  const requestedRef = params.reference ? params.reference.trim().slice(0, 60) : undefined;
  const idemKey = (params.idempotencyKey || requestedRef || '').trim().slice(0, 100);

  const db = await getDb();

  if (idemKey) {
    const existingByIdem = await db.collection('inquiries').findOne({
      $or: [{ idempotencyKey: idemKey }, ...(requestedRef ? [{ reference: requestedRef }] : [])],
    });
    if (existingByIdem) {
      return {
        ok: true,
        status: 200,
        reference: existingByIdem.reference,
        deduplicated: true,
      };
    }
  }

  const reference =
    requestedRef || `DAOZ-${prefix}-${generateDateStamp()}-${generateRandomFourDigits()}`;
  const finalIdemKey = idemKey || reference;
  const now = new Date();

  const summaryMsg =
    params.customNotes ||
    (params.details && typeof params.details === 'object'
      ? JSON.stringify(params.details)
      : `Chat assistant ${topic} request`);

  const record: InquiryRecord = {
    _id: `inq_${Date.now().toString(36)}_${generateRandomState(6)}`,
    reference,
    idempotencyKey: finalIdemKey,
    kind: 'chat_request',
    sessionId: params.sessionId || 'ses_web',
    name,
    email,
    company: params.company?.trim(),
    category: `Chat Request (${topic})`,
    topic,
    message: String(summaryMsg).slice(0, 3000),
    details: params.details || {},
    status: 'New',
    ipAddress: params.ipAddress,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('inquiries').insertOne(record);

  return {
    ok: true,
    status: 200,
    reference,
  };
}
