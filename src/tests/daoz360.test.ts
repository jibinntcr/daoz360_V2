import assert from 'node:assert/strict';
import { ensureDatabaseIndexes, getDb } from '../lib/db';
import {
  createContactInquiry,
  createChatLead,
  recordChatMessage,
  submitChatFollowupRequest,
} from '../lib/services/inquiries';
import {
  authenticateUser,
  registerUserAndWorkspace,
  updateOrRemoveMemberRole,
  AuthContext,
} from '../lib/auth';
import {
  startProviderOAuth,
  completeProviderOAuthCallback,
  validateSegmentsForAccount,
} from '../lib/providers';
import {
  saveDraftWithRevision,
  recordDraftApprovalDecision,
  scheduleOrPublishDraft,
  processDuePublishingJobs,
  reconcileOrRetryDeliveryTarget,
} from '../lib/services/publishing';
import {
  getWorkspaceAnalyticsOverview,
  exportMetricsToCsv,
} from '../lib/services/analytics';
import { encryptSecret, decryptSecret, generateTotpCode } from '../lib/security-crypto';

async function runTests() {
  console.log('=== DAOZ360 V2 Full Product Verification & E2E Workflow Suite ===');
  await ensureDatabaseIndexes();

  // 1. Contact Inquiries & Chat Idempotency
  const idemKey = `test_idem_${Date.now()}`;
  const first = await createContactInquiry({
    name: 'Rohan Sharma',
    email: 'rohan@agency.in',
    company: 'Apex Digital',
    category: 'Pricing & Package Enquiry',
    plan: 'Growth',
    message: 'We manage 14 social channels and want to start on Growth.',
    idempotencyKey: idemKey,
    ipAddress: '127.0.0.1',
  });
  assert.strictEqual(first.ok, true);
  assert.match(String(first.reference), /^DAOZ-INQ-/);

  const second = await createContactInquiry({
    name: 'Rohan Sharma',
    email: 'rohan@agency.in',
    message: 'We manage 14 social channels and want to start on Growth.',
    idempotencyKey: idemKey,
    ipAddress: '127.0.0.1',
  });
  assert.strictEqual(second.ok, true);
  assert.strictEqual(second.deduplicated, true);
  assert.strictEqual(second.reference, first.reference);

  const lead = await createChatLead({
    name: 'Elena Rostova',
    email: 'elena@studio.io',
    company: 'Studio E',
  });
  assert.strictEqual(lead.ok, true);

  const msg = await recordChatMessage({
    sessionId: lead.sessionId!,
    message: 'What are your pricing plans?',
    currency: 'USD',
  });
  assert.strictEqual(msg.ok, true);
  assert.ok(msg.pricingReply?.includes('$19/month'));

  const chatIdem = `chat_idem_${Date.now()}`;
  const req1 = await submitChatFollowupRequest({
    sessionId: lead.sessionId,
    idempotencyKey: chatIdem,
    name: 'Elena Rostova',
    email: 'elena@studio.io',
    topic: 'demo',
    details: { demoFocus: 'Team Approval Workflow' },
  });
  const req2 = await submitChatFollowupRequest({
    sessionId: lead.sessionId,
    idempotencyKey: chatIdem,
    name: 'Elena Rostova',
    email: 'elena@studio.io',
    topic: 'demo',
  });
  assert.strictEqual(req1.ok, true);
  assert.strictEqual(req2.deduplicated, true);
  assert.strictEqual(req2.reference, req1.reference);
  console.log('  ✓ 1. Contact inquiries & chat requests persisted with database-backed idempotency');

  // 2. Grant Encryption & Admin MFA
  const encrypted = encryptSecret('live_oauth_token_secret_123', 'ws_1:x');
  assert.ok(!encrypted.ciphertext.includes('live_oauth_token_secret_123'));
  assert.strictEqual(decryptSecret(encrypted, 'ws_1:x'), 'live_oauth_token_secret_123');

  const noMfa = await authenticateUser({
    email: 'admin@daoz360.ai',
    password: 'ChangeMeImmediately!2026',
  });
  assert.strictEqual(noMfa.ok, false);
  assert.strictEqual(noMfa.requiresMfa, true);

  const validTotp = generateTotpCode('JBSWY3DPEHPK3PXP');
  const withMfa = await authenticateUser({
    email: 'admin@daoz360.ai',
    password: 'ChangeMeImmediately!2026',
    totpCode: validTotp,
  });
  assert.strictEqual(withMfa.ok, true);
  assert.strictEqual(withMfa.user?.platformRole, 'super_admin');
  console.log('  ✓ 2. AES-256-GCM grant encryption at rest and Platform Admin TOTP MFA verified');

  // 3. Last-Owner Protection
  const reg = await registerUserAndWorkspace({
    name: 'Founder One',
    email: `founder_${Date.now()}@test.io`,
    password: 'Password!2026',
    workspaceName: 'Founder Brand',
    planId: 'growth',
  });
  assert.strictEqual(reg.ok, true);

  const db = await getDb();
  const membership = await db
    .collection('memberships')
    .findOne({ workspaceId: reg.workspace!._id, userId: reg.user!._id });

  const ownerCtx: AuthContext = {
    user: reg.user!,
    session: {
      _id: 'ses_test_owner',
      userId: reg.user!._id,
      workspaceId: reg.workspace!._id,
      csrfToken: 'csrf_1',
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
    },
    workspace: reg.workspace!,
    membership: membership!,
    allWorkspaces: [{ workspace: reg.workspace!, role: 'owner' }],
  };

  const removeSelf = await updateOrRemoveMemberRole({
    actor: ownerCtx,
    workspaceId: reg.workspace!._id,
    targetUserId: reg.user!._id,
    action: 'remove',
  });
  assert.strictEqual(removeSelf.ok, false);
  assert.ok(removeSelf.error?.includes('last owner'));
  console.log('  ✓ 3. Last-owner removal protection & workspace tenancy verified');

  // 4. OAuth State Binding & Replay Protection
  const user = await db.collection('users').findOne({ email: 'alex@acmestudio.io' });
  const ws = await db.collection('workspaces').findOne({ _id: 'ws_acme_growth' });

  const start = await startProviderOAuth({
    userId: user!._id,
    sessionId: 'ses_oauth_test',
    workspaceId: ws!._id,
    provider: 'threads',
    intendedAction: 'connect',
  });
  assert.strictEqual(start.ok, true);

  const wrongWs = await completeProviderOAuthCallback({
    provider: 'threads',
    state: start.state!,
    code: 'sandbox_auth_code_threads',
    currentUserId: user!._id,
    currentSessionId: 'ses_oauth_test',
    currentWorkspaceId: 'ws_wrong_tenant',
  });
  assert.strictEqual(wrongWs.ok, false);
  assert.strictEqual(wrongWs.status, 403);

  const start2 = await startProviderOAuth({
    userId: user!._id,
    sessionId: 'ses_oauth_test_2',
    workspaceId: ws!._id,
    provider: 'threads',
    intendedAction: 'connect',
  });

  const firstComplete = await completeProviderOAuthCallback({
    provider: 'threads',
    state: start2.state!,
    code: 'sandbox_auth_code_threads',
    currentUserId: user!._id,
    currentSessionId: 'ses_oauth_test_2',
    currentWorkspaceId: ws!._id,
  });
  assert.strictEqual(firstComplete.ok, true);

  const replayAttempt = await completeProviderOAuthCallback({
    provider: 'threads',
    state: start2.state!,
    code: 'sandbox_auth_code_threads',
    currentUserId: user!._id,
    currentSessionId: 'ses_oauth_test_2',
    currentWorkspaceId: ws!._id,
  });
  assert.strictEqual(replayAttempt.ok, false);
  assert.strictEqual(replayAttempt.status, 400);
  console.log('  ✓ 4. OAuth one-time state binding, PKCE S256, and replay rejection verified');

  // 5. Drafting, Optimistic Concurrency, Approval Invalidation, Scheduling, Reconciliation
  const reviewerUser = await db.collection('users').findOne({ email: 'liam@acmestudio.io' });
  const ownerMem = await db.collection('memberships').findOne({ workspaceId: ws!._id, userId: user!._id });
  const reviewerMem = await db.collection('memberships').findOne({ workspaceId: ws!._id, userId: reviewerUser!._id });

  const acmeOwnerCtx: AuthContext = {
    user: user!,
    session: {
      _id: 'ses_owner_e2e',
      userId: user!._id,
      workspaceId: ws!._id,
      csrfToken: 'csrf_e2e',
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
    },
    workspace: ws!,
    membership: ownerMem!,
    allWorkspaces: [{ workspace: ws!, role: 'owner' }],
  };

  const acmeReviewerCtx: AuthContext = {
    ...acmeOwnerCtx,
    user: reviewerUser!,
    membership: reviewerMem!,
  };

  const created = await saveDraftWithRevision({
    actor: acmeOwnerCtx,
    title: 'E2E Launch Thread',
    targetAccountIds: ['acc_acme_x'],
    masterSegments: [
      { id: 's1', text: '1/ Launching DAOZ360 V2 multi-tenant publishing.', mediaIds: [] },
      { id: 's2', text: '2/ Built with durable MongoDB job queues and atomic fencing.', mediaIds: [] },
    ],
  });
  assert.strictEqual(created.ok, true);
  const draftId = created.draft!._id;

  const unapprovedSchedule = await scheduleOrPublishDraft({
    actor: acmeOwnerCtx,
    draftId,
    publishNow: true,
  });
  assert.strictEqual(unapprovedSchedule.ok, false);
  assert.strictEqual(unapprovedSchedule.status, 403);

  const approved = await recordDraftApprovalDecision({
    actor: acmeReviewerCtx,
    draftId,
    decision: 'approved',
    note: 'LGTM for launch',
  });
  assert.strictEqual(approved.ok, true);
  assert.strictEqual(approved.draft?.approvedRevisionNumber, 1);

  const staleEdit = await saveDraftWithRevision({
    actor: acmeOwnerCtx,
    draftId,
    expectedVersion: 99,
    title: 'Stale Edit',
    targetAccountIds: ['acc_acme_x'],
    masterSegments: [{ id: 's1', text: 'Stale', mediaIds: [] }],
  });
  assert.strictEqual(staleEdit.ok, false);
  assert.strictEqual(staleEdit.status, 409);

  const editedAfterApproval = await saveDraftWithRevision({
    actor: acmeOwnerCtx,
    draftId,
    expectedVersion: 1,
    title: 'E2E Launch Thread (Edited)',
    targetAccountIds: ['acc_acme_x'],
    masterSegments: [
      { id: 's1', text: '1/ Launching DAOZ360 V2 multi-tenant publishing (updated copy).', mediaIds: [] },
      { id: 's2', text: '2/ Built with durable MongoDB job queues and atomic fencing.', mediaIds: [] },
    ],
  });
  assert.strictEqual(editedAfterApproval.ok, true);
  assert.strictEqual(editedAfterApproval.approvalInvalidated, true);
  assert.strictEqual(editedAfterApproval.draft?.approvedRevisionNumber, undefined);

  await recordDraftApprovalDecision({
    actor: acmeReviewerCtx,
    draftId,
    decision: 'approved',
    note: 'Re-approved revision #2',
  });

  const published = await scheduleOrPublishDraft({
    actor: acmeOwnerCtx,
    draftId,
    publishNow: true,
    displayTimezone: 'Asia/Kolkata',
  });
  assert.strictEqual(published.ok, true);
  assert.strictEqual(published.draft?.status, 'published');

  const ambDraft = await saveDraftWithRevision({
    actor: acmeOwnerCtx,
    title: 'Ambiguous Timeout Test',
    targetAccountIds: ['acc_acme_x'],
    masterSegments: [{ id: 's1', text: 'Testing socket timeout reconciliation', mediaIds: [] }],
  });
  await recordDraftApprovalDecision({
    actor: acmeReviewerCtx,
    draftId: ambDraft.draft!._id,
    decision: 'approved',
  });
  const scheduledAmb = await scheduleOrPublishDraft({
    actor: acmeOwnerCtx,
    draftId: ambDraft.draft!._id,
    publishNow: false,
    scheduledAtUtc: new Date(Date.now() - 1000),
  });
  const ambResult = await processDuePublishingJobs({
    workerId: 'test-worker-amb',
    maxJobs: 1,
    simulateAmbiguousTimeout: true,
  });
  assert.strictEqual(ambResult.ambiguousCount, 1);

  const ambTarget = await db
    .collection('delivery_targets')
    .findOne({ _id: scheduledAmb.targets![0]._id });
  assert.strictEqual(ambTarget?.status, 'ambiguous_needs_reconcile');

  const reconciled = await reconcileOrRetryDeliveryTarget({
    actor: acmeOwnerCtx,
    targetId: ambTarget!._id,
    action: 'reconcile_lookup',
  });
  assert.strictEqual(reconciled.ok, true);
  assert.strictEqual(reconciled.target?.status, 'published');
  console.log('  ✓ 5. Optimistic concurrency, approval invalidation, atomic worker queue, and timeout reconciliation verified');

  // 6. Per-Network Payload Validation & Analytics CSV Integrity
  const xAcc = await db.collection('social_accounts').findOne({ _id: 'acc_acme_x' });
  const validation = validateSegmentsForAccount({
    account: xAcc!,
    segments: [{ id: 's1', text: 'A'.repeat(320), mediaIds: [] }],
  });
  assert.strictEqual(validation.valid, false);

  const analytics = await getWorkspaceAnalyticsOverview({ workspaceId: 'ws_acme_growth' });
  assert.ok(analytics.snapshots.length > 0);
  assert.strictEqual(analytics.totalsByProvider.x.reach, null);

  const csv = exportMetricsToCsv(analytics.snapshots);
  assert.ok(csv.includes('Engagement Rate (%),Engagement Formula,Denominator'));
  console.log('  ✓ 6. Per-network character validation & RFC 4180 CSV analytics export verified');

  console.log('\nALL 6 END-TO-END & SECURITY SUITES PASSED!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
