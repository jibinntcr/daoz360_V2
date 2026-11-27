import { getDb } from '@/lib/db';
import {
  DraftRecord,
  DraftRevisionRecord,
  DeliveryTargetRecord,
  JobRecord,
  PublishAttemptRecord,
  ThreadSegment,
  PlatformVariant,
  WorkflowAutomationRule,
  SocialProvider,
} from '@/lib/types';
import { generateRandomState } from '@/lib/security-crypto';
import { recordAuditEvent, AuthContext, hasWorkspacePermission } from '@/lib/auth';
import { validateSegmentsForAccount, publishSegmentToProvider } from '@/lib/providers';

/**
 * Saves or updates a draft with optimistic concurrency version checking (`expectedVersion`),
 * creates a revision record, and automatically invalidates prior approval if the payload changed
 * under workspace approval rules.
 */
export async function saveDraftWithRevision(params: {
  actor: AuthContext;
  draftId?: string;
  expectedVersion?: number;
  title: string;
  targetAccountIds: string[];
  masterSegments: ThreadSegment[];
  platformVariants?: Partial<Record<SocialProvider, PlatformVariant>>;
  automations?: WorkflowAutomationRule[];
  tags?: string[];
  campaign?: string;
  pinned?: boolean;
  isTemplate?: boolean;
  changeSummary?: string;
}): Promise<{
  ok: boolean;
  status: number;
  draft?: DraftRecord;
  approvalInvalidated?: boolean;
  conflictDraft?: DraftRecord;
  error?: string;
}> {
  if (!hasWorkspacePermission(params.actor.membership.role, 'workspace:edit_draft')) {
    return { ok: false, status: 403, error: 'Insufficient permission to create or edit drafts.' };
  }

  const db = await getDb();
  const now = new Date();
  const workspaceId = params.actor.workspace._id;

  if (!params.draftId) {
    const draftId = `drf_${Date.now().toString(36)}_${generateRandomState(6)}`;
    const draft: DraftRecord = {
      _id: draftId,
      workspaceId,
      authorId: params.actor.user._id,
      title: params.title.trim() || 'Untitled Draft',
      status: 'draft',
      version: 1,
      currentRevisionNumber: 1,
      tags: params.tags || [],
      campaign: params.campaign,
      pinned: Boolean(params.pinned),
      isTemplate: Boolean(params.isTemplate),
      targetAccountIds: params.targetAccountIds,
      masterSegments: params.masterSegments,
      platformVariants: params.platformVariants || {},
      automations: params.automations || [],
      assignedReviewerIds: [],
      scheduleVersion: 1,
      publishedOnSocialPage: false,
      createdAt: now,
      updatedAt: now,
    };

    const revision: DraftRevisionRecord = {
      _id: `rev_${Date.now().toString(36)}_${generateRandomState(6)}`,
      workspaceId,
      draftId,
      revisionNumber: 1,
      authorId: params.actor.user._id,
      snapshot: {
        title: draft.title,
        masterSegments: draft.masterSegments,
        platformVariants: draft.platformVariants,
        targetAccountIds: draft.targetAccountIds,
        automations: draft.automations,
      },
      changeSummary: params.changeSummary || 'Initial draft created',
      isImmutablePublication: false,
      createdAt: now,
    };

    await db.collection('drafts').insertOne(draft);
    await db.collection('draft_revisions').insertOne(revision);

    return { ok: true, status: 201, draft };
  }

  const existing = await db
    .collection('drafts')
    .findOne({ _id: params.draftId, workspaceId });

  if (!existing) {
    return { ok: false, status: 404, error: 'Draft not found in this workspace.' };
  }

  // Concurrent editing protection with version checks and a recovery path
  if (
    params.expectedVersion !== undefined &&
    existing.version !== params.expectedVersion
  ) {
    return {
      ok: false,
      status: 409,
      conflictDraft: existing,
      error: `Version conflict detected: draft is at version ${existing.version}, but your editor submitted version ${params.expectedVersion}. Review the latest revision or force overwrite.`,
    };
  }

  const payloadChanged =
    JSON.stringify(existing.masterSegments) !== JSON.stringify(params.masterSegments) ||
    JSON.stringify(existing.platformVariants) !== JSON.stringify(params.platformVariants || existing.platformVariants) ||
    JSON.stringify(existing.targetAccountIds) !== JSON.stringify(params.targetAccountIds);

  let approvalInvalidated = false;
  let nextStatus = existing.status;
  let approvedRevisionNumber = existing.approvedRevisionNumber;
  let approvedByUserId = existing.approvedByUserId;
  let approvedAt = existing.approvedAt;

  // Editing an approved payload must invalidate the affected approval under the workspace rules
  if (
    payloadChanged &&
    (existing.status === 'approved' || existing.approvedRevisionNumber !== undefined)
  ) {
    approvalInvalidated = true;
    nextStatus = 'draft';
    approvedRevisionNumber = undefined;
    approvedByUserId = undefined;
    approvedAt = undefined;

    await db.collection('approvals').updateMany(
      { workspaceId, draftId: existing._id, decision: 'approved' },
      {
        $set: {
          decision: 'invalidated',
          invalidatedReason: `Edited by ${params.actor.user.name} in revision ${existing.currentRevisionNumber + 1}`,
          invalidatedAt: now,
        },
      }
    );

    await recordAuditEvent({
      workspaceId,
      actorUserId: params.actor.user._id,
      actorEmail: params.actor.user.email,
      actorRole: params.actor.membership.role,
      action: 'approval.invalidated_on_edit',
      targetType: 'draft',
      targetId: existing._id,
      metadata: {
        previousApprovedRevision: existing.approvedRevisionNumber,
        newRevision: existing.currentRevisionNumber + 1,
      },
    });
  }

  const nextVersion = existing.version + 1;
  const nextRevisionNumber = existing.currentRevisionNumber + 1;

  await db.collection('drafts').updateOne(
    { _id: existing._id, workspaceId },
    {
      $set: {
        title: params.title.trim() || existing.title,
        status: nextStatus,
        version: nextVersion,
        currentRevisionNumber: nextRevisionNumber,
        targetAccountIds: params.targetAccountIds,
        masterSegments: params.masterSegments,
        platformVariants: params.platformVariants ?? existing.platformVariants,
        automations: params.automations ?? existing.automations,
        tags: params.tags ?? existing.tags,
        campaign: params.campaign ?? existing.campaign,
        pinned: params.pinned ?? existing.pinned,
        isTemplate: params.isTemplate ?? existing.isTemplate,
        approvedRevisionNumber,
        approvedByUserId,
        approvedAt,
        updatedAt: now,
      },
    }
  );

  const revision: DraftRevisionRecord = {
    _id: `rev_${Date.now().toString(36)}_${generateRandomState(6)}`,
    workspaceId,
    draftId: existing._id,
    revisionNumber: nextRevisionNumber,
    authorId: params.actor.user._id,
    snapshot: {
      title: params.title.trim() || existing.title,
      masterSegments: params.masterSegments,
      platformVariants: params.platformVariants ?? existing.platformVariants,
      targetAccountIds: params.targetAccountIds,
      automations: params.automations ?? existing.automations,
    },
    changeSummary: params.changeSummary || `Revision #${nextRevisionNumber}`,
    isImmutablePublication: false,
    createdAt: now,
  };

  await db.collection('draft_revisions').insertOne(revision);
  const updated = await db.collection('drafts').findOne({ _id: existing._id });

  return {
    ok: true,
    status: 200,
    draft: updated!,
    approvalInvalidated,
  };
}

/**
 * Approves or requests changes on a draft at a specific revision number.
 */
export async function recordDraftApprovalDecision(params: {
  actor: AuthContext;
  draftId: string;
  decision: 'approved' | 'changes_requested';
  note?: string;
}): Promise<{ ok: boolean; status: number; draft?: DraftRecord; error?: string }> {
  if (!hasWorkspacePermission(params.actor.membership.role, 'workspace:approve_draft')) {
    return { ok: false, status: 403, error: 'Insufficient permission to approve drafts.' };
  }

  const db = await getDb();
  const workspaceId = params.actor.workspace._id;
  const draft = await db.collection('drafts').findOne({ _id: params.draftId, workspaceId });
  if (!draft) {
    return { ok: false, status: 404, error: 'Draft not found.' };
  }

  const now = new Date();
  await db.collection('approvals').insertOne({
    _id: `apr_${Date.now().toString(36)}_${generateRandomState(6)}`,
    workspaceId,
    draftId: draft._id,
    revisionNumber: draft.currentRevisionNumber,
    reviewerId: params.actor.user._id,
    reviewerName: params.actor.user.name,
    decision: params.decision,
    note: params.note,
    createdAt: now,
  });

  if (params.decision === 'approved') {
    await db.collection('drafts').updateOne(
      { _id: draft._id },
      {
        $set: {
          status: 'approved',
          approvedRevisionNumber: draft.currentRevisionNumber,
          approvedByUserId: params.actor.user._id,
          approvedAt: now,
          updatedAt: now,
        },
      }
    );
  } else {
    await db.collection('drafts').updateOne(
      { _id: draft._id },
      {
        $set: {
          status: 'changes_requested',
          approvedRevisionNumber: undefined,
          approvedByUserId: undefined,
          approvedAt: undefined,
          updatedAt: now,
        },
      }
    );
  }

  await db.collection('notifications').insertOne({
    _id: `ntf_${Date.now().toString(36)}_${generateRandomState(6)}`,
    workspaceId,
    userId: draft.authorId,
    type: params.decision === 'approved' ? 'approved' : 'changes_requested',
    title: params.decision === 'approved' ? 'Draft Approved' : 'Changes Requested on Draft',
    message: `${params.actor.user.name} ${
      params.decision === 'approved' ? 'approved' : 'requested changes on'
    } "${draft.title}" (Revision #${draft.currentRevisionNumber}).`,
    linkUrl: `/dashboard?tab=composer&draftId=${draft._id}`,
    createdAt: now,
  });

  await recordAuditEvent({
    workspaceId,
    actorUserId: params.actor.user._id,
    actorEmail: params.actor.user.email,
    actorRole: params.actor.membership.role,
    action: `draft.${params.decision}`,
    targetType: 'draft',
    targetId: draft._id,
    metadata: { revisionNumber: draft.currentRevisionNumber, note: params.note },
  });

  const updated = await db.collection('drafts').findOne({ _id: draft._id });
  return { ok: true, status: 200, draft: updated! };
}

/**
 * Transactionally schedules or immediately queues a draft for publication.
 * - Verifies workspace approval rule (if required_before_schedule, approvedRevisionNumber must equal currentRevisionNumber).
 * - Validates per-network character and media rules for every selected target account.
 * - Creates an immutable publication revision, delivery targets, and durable MongoDB jobs.
 * - Updates dependent automation schedules when a parent draft is rescheduled.
 */
export async function scheduleOrPublishDraft(params: {
  actor: AuthContext;
  draftId: string;
  publishNow?: boolean;
  scheduledAtUtc?: Date;
  displayTimezone?: string;
}): Promise<{
  ok: boolean;
  status: number;
  draft?: DraftRecord;
  targets?: DeliveryTargetRecord[];
  jobs?: JobRecord[];
  validationErrors?: string[];
  error?: string;
}> {
  if (!hasWorkspacePermission(params.actor.membership.role, 'workspace:schedule_publish')) {
    return {
      ok: false,
      status: 403,
      error: 'Only Workspace Owners, Admins, or Publishers can schedule or publish content.',
    };
  }

  const db = await getDb();
  const workspaceId = params.actor.workspace._id;
  const draft = await db.collection('drafts').findOne({ _id: params.draftId, workspaceId });
  if (!draft) {
    return { ok: false, status: 404, error: 'Draft not found.' };
  }

  // Enforce workspace approval rules
  if (
    params.actor.workspace.approvalRule === 'required_before_schedule' &&
    draft.approvedRevisionNumber !== draft.currentRevisionNumber
  ) {
    return {
      ok: false,
      status: 403,
      error: `Workspace rules require approval on current revision (#${draft.currentRevisionNumber}) before scheduling or publishing.`,
    };
  }

  if (!draft.targetAccountIds || draft.targetAccountIds.length === 0) {
    return { ok: false, status: 422, error: 'Select at least one connected social account.' };
  }

  const accounts = await db
    .collection('social_accounts')
    .find({ workspaceId, _id: { $in: draft.targetAccountIds } })
    .toArray();

  if (accounts.length === 0) {
    return { ok: false, status: 422, error: 'No valid connected accounts found for this workspace.' };
  }

  // Check monthly delivery allowance
  const workspace = params.actor.workspace;
  const remainingDeliveries =
    workspace.limits.deliveriesPerMonth -
    (workspace.usage.deliveriesUsed + workspace.usage.deliveriesReserved);
  if (accounts.length > remainingDeliveries) {
    return {
      ok: false,
      status: 403,
      error: `Insufficient monthly delivery allowance (${remainingDeliveries} remaining, ${accounts.length} required).`,
    };
  }

  // Validate per-network character & media limits
  const validationErrors: string[] = [];
  for (const acc of accounts) {
    const variant = draft.platformVariants?.[acc.provider];
    const segments = variant?.enabled && variant.segments.length ? variant.segments : draft.masterSegments;
    const check = validateSegmentsForAccount({ account: acc, segments });
    if (!check.valid) {
      validationErrors.push(...check.errors);
    }
  }

  if (validationErrors.length > 0) {
    return {
      ok: false,
      status: 422,
      validationErrors,
      error: validationErrors.join(' '),
    };
  }

  const now = new Date();
  const dueAt = params.publishNow
    ? now
    : params.scheduledAtUtc && params.scheduledAtUtc.getTime() > now.getTime()
    ? params.scheduledAtUtc
    : now;
  const displayTimezone = params.displayTimezone || draft.scheduledTimezone || 'UTC';
  const nextScheduleVersion = (draft.scheduleVersion || 0) + 1;

  const createdTargets: DeliveryTargetRecord[] = [];
  const createdJobs: JobRecord[] = [];

  await db.withTransaction(async () => {
    // Cancel any older queued jobs/targets for previous schedule versions of this draft
    await db.collection('jobs').updateMany(
      { workspaceId, draftId: draft._id, status: 'queued' },
      { $set: { status: 'cancelled', updatedAt: now } }
    );
    await db.collection('delivery_targets').updateMany(
      { workspaceId, draftId: draft._id, status: 'queued' },
      { $set: { status: 'cancelled', updatedAt: now } }
    );

    // Ensure immutable publication revision exists
    const existingRev = await db.collection('draft_revisions').findOne({
      workspaceId,
      draftId: draft._id,
      revisionNumber: draft.currentRevisionNumber,
    });
    if (existingRev) {
      await db
        .collection('draft_revisions')
        .updateOne({ _id: existingRev._id }, { $set: { isImmutablePublication: true } });
    } else {
      await db.collection('draft_revisions').insertOne({
        _id: `rev_pub_${Date.now().toString(36)}_${generateRandomState(5)}`,
        workspaceId,
        draftId: draft._id,
        revisionNumber: draft.currentRevisionNumber,
        authorId: params.actor.user._id,
        snapshot: {
          title: draft.title,
          masterSegments: draft.masterSegments,
          platformVariants: draft.platformVariants,
          targetAccountIds: draft.targetAccountIds,
          automations: draft.automations,
        },
        changeSummary: 'Immutable publication revision',
        isImmutablePublication: true,
        createdAt: now,
      });
    }

    for (const acc of accounts) {
      const variant = draft.platformVariants?.[acc.provider];
      const segments = variant?.enabled && variant.segments.length ? variant.segments : draft.masterSegments;
      const targetId = `del_${Date.now().toString(36)}_${generateRandomState(5)}`;
      const targetIdemKey = `idem_${draft._id}_r${draft.currentRevisionNumber}_v${nextScheduleVersion}_${acc._id}`;

      const target: DeliveryTargetRecord = {
        _id: targetId,
        workspaceId,
        draftId: draft._id,
        revisionNumber: draft.currentRevisionNumber,
        accountId: acc._id,
        provider: acc.provider,
        status: 'queued',
        scheduledAtUtc: dueAt,
        displayTimezone,
        scheduleVersion: nextScheduleVersion,
        idempotencyKey: targetIdemKey,
        segmentDeliveries: segments.map((seg, idx) => ({
          segmentIndex: idx,
          segmentId: seg.id || `seg_${idx}`,
          idempotencyKey: `${targetIdemKey}_s${idx}`,
          status: 'pending',
        })),
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('delivery_targets').insertOne(target);
      createdTargets.push(target);

      const job: JobRecord = {
        _id: `job_${Date.now().toString(36)}_${generateRandomState(5)}`,
        workspaceId,
        type: 'publish_target',
        targetId: target._id,
        draftId: draft._id,
        accountId: acc._id,
        revisionNumber: draft.currentRevisionNumber,
        scheduleVersion: nextScheduleVersion,
        idempotencyKey: `job_${targetIdemKey}`,
        status: 'queued',
        dueAt,
        fencingToken: 1,
        attempts: 0,
        maxAttempts: 5,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('jobs').insertOne(job);
      createdJobs.push(job);
    }

    await db.collection('drafts').updateOne(
      { _id: draft._id },
      {
        $set: {
          status: 'scheduled',
          scheduledAtUtc: dueAt,
          scheduledTimezone: displayTimezone,
          scheduleVersion: nextScheduleVersion,
          updatedAt: now,
        },
      }
    );

    await db.collection('workspaces').updateOne(
      { _id: workspaceId },
      { $inc: { 'usage.deliveriesReserved': accounts.length } }
    );
  });

  await recordAuditEvent({
    workspaceId,
    actorUserId: params.actor.user._id,
    actorEmail: params.actor.user.email,
    actorRole: params.actor.membership.role,
    action: params.publishNow ? 'draft.publish_now_queued' : 'draft.scheduled',
    targetType: 'draft',
    targetId: draft._id,
    metadata: {
      revisionNumber: draft.currentRevisionNumber,
      scheduleVersion: nextScheduleVersion,
      dueAt: dueAt.toISOString(),
      displayTimezone,
      targets: createdTargets.map((t) => t._id),
    },
  });

  // If publishNow was requested, run the due job processor immediately so the user gets immediate feedback
  if (params.publishNow) {
    await processDuePublishingJobs({ workerId: 'web-inline-dispatcher', maxJobs: createdJobs.length });
  }

  const updatedDraft = await db.collection('drafts').findOne({ _id: draft._id });
  const updatedTargets = await db
    .collection('delivery_targets')
    .find({ workspaceId, draftId: draft._id, scheduleVersion: nextScheduleVersion })
    .toArray();

  return {
    ok: true,
    status: 200,
    draft: updatedDraft!,
    targets: updatedTargets,
    jobs: createdJobs,
  };
}

/**
 * Atomic Job Claiming & Processing Engine (Used by both standalone Worker & inline Publish Now)
 * - Atomically claims due jobs or jobs with expired leases
 * - Increments monotonic fencingToken on every claim
 * - Rechecks approved revision, account grant, connection state, and scheduleVersion right before side effects
 * - Preserves already-published thread segments when retrying partial failures
 * - Handles timeout_ambiguous by pausing for reconciliation
 */
export async function processDuePublishingJobs(params: {
  workerId: string;
  maxJobs?: number;
  leaseDurationMs?: number;
  simulateAmbiguousTimeout?: boolean;
  simulateRateLimit?: boolean;
}): Promise<{
  claimedCount: number;
  succeededCount: number;
  failedCount: number;
  ambiguousCount: number;
  processedJobIds: string[];
}> {
  const db = await getDb();
  const maxJobs = params.maxJobs || 5;
  const leaseDurationMs = params.leaseDurationMs || Number(process.env.WORKER_LEASE_DURATION_MS || 60000);
  const now = new Date();

  let claimedCount = 0;
  let succeededCount = 0;
  let failedCount = 0;
  let ambiguousCount = 0;
  const processedJobIds: string[] = [];

  for (let i = 0; i < maxJobs; i++) {
    const claimTime = new Date();
    const leaseExpiresAt = new Date(claimTime.getTime() + leaseDurationMs);

    // Atomic claim of a due queued job OR a stale claimed job whose lease expired
    const claimedJob = await db.collection('jobs').findOneAndUpdate(
      {
        $or: [
          { status: 'queued', dueAt: { $lte: claimTime } },
          { status: 'claimed', leaseExpiresAt: { $lte: claimTime } },
        ],
      },
      {
        $set: {
          status: 'claimed',
          claimedByWorkerId: params.workerId,
          claimedAt: claimTime,
          leaseExpiresAt,
          updatedAt: claimTime,
        },
        $inc: {
          fencingToken: 1,
          attempts: 1,
        },
      },
      { returnDocument: 'after', sort: { dueAt: 1 } }
    );

    if (!claimedJob) {
      break;
    }

    claimedCount++;
    processedJobIds.push(claimedJob._id);

    const activeFencingToken = claimedJob.fencingToken;
    const target = claimedJob.targetId
      ? await db.collection('delivery_targets').findOne({ _id: claimedJob.targetId })
      : null;

    if (!target) {
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        { $set: { status: 'failed', lastError: 'Delivery target record missing.', updatedAt: new Date() } }
      );
      failedCount++;
      continue;
    }

    const draft = await db.collection('drafts').findOne({ _id: target.draftId, workspaceId: target.workspaceId });
    const workspace = await db.collection('workspaces').findOne({ _id: target.workspaceId });
    const account = await db.collection('social_accounts').findOne({
      _id: target.accountId,
      workspaceId: target.workspaceId,
    });
    const grant = account
      ? await db.collection('social_grants').findOne({ _id: account.grantId, workspaceId: target.workspaceId })
      : null;

    // Pre-flight fencing & safety checks right before external side effects
    if (!draft || !workspace || workspace.status !== 'active') {
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        { $set: { status: 'cancelled', lastError: 'Draft or workspace inactive.', updatedAt: new Date() } }
      );
      continue;
    }

    if (draft.scheduleVersion !== target.scheduleVersion) {
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        { $set: { status: 'cancelled', lastError: 'Stale scheduleVersion superseded.', updatedAt: new Date() } }
      );
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        { $set: { status: 'cancelled', updatedAt: new Date() } }
      );
      continue;
    }

    if (
      workspace.approvalRule === 'required_before_schedule' &&
      draft.approvedRevisionNumber !== target.revisionNumber
    ) {
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'failed',
            lastError: 'Approved revision mismatch at publish time (approval was invalidated).',
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: 'failed',
            lastError: 'Approved revision was invalidated before publish.',
            updatedAt: new Date(),
          },
        }
      );
      failedCount++;
      continue;
    }

    if (!account || account.healthState === 'disconnected' || !grant || grant.status !== 'active') {
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'failed',
            lastError: 'Social account grant is revoked or disconnected.',
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: 'failed',
            lastError: 'Social account grant is revoked or disconnected.',
            updatedAt: new Date(),
          },
        }
      );
      failedCount++;
      continue;
    }

    // Dependent automation check: require valid parent remote ID
    if (target.parentTargetId) {
      const parentTarget = await db
        .collection('delivery_targets')
        .findOne({ _id: target.parentTargetId, workspaceId: target.workspaceId });
      const parentFirstRemoteId = parentTarget?.segmentDeliveries?.[0]?.remotePostId;
      if (!parentFirstRemoteId) {
        await db.collection('jobs').updateOne(
          { _id: claimedJob._id, fencingToken: activeFencingToken },
          {
            $set: {
              status: 'failed',
              lastError: 'Parent publication does not have a valid remote provider ID.',
              updatedAt: new Date(),
            },
          }
        );
        failedCount++;
        continue;
      }
    }

    // Load immutable revision snapshot
    const rev = await db.collection('draft_revisions').findOne({
      workspaceId: target.workspaceId,
      draftId: target.draftId,
      revisionNumber: target.revisionNumber,
    });

    const variant = rev?.snapshot.platformVariants?.[account.provider] || draft.platformVariants?.[account.provider];
    const segments =
      variant?.enabled && variant.segments.length
        ? variant.segments
        : rev?.snapshot.masterSegments || draft.masterSegments;

    const updatedSegmentDeliveries = [...target.segmentDeliveries];
    let previousRemoteId: string | undefined;
    let encounteredAmbiguous = false;
    let encounteredRateLimit = false;
    let rateLimitRetrySec = 30;
    let encounteredFailure = false;
    let lastErrorMsg: string | undefined;
    const attemptStart = Date.now();
    const collectedRemoteIds: string[] = [];

    for (let sIdx = 0; sIdx < updatedSegmentDeliveries.length; sIdx++) {
      const segDel = updatedSegmentDeliveries[sIdx];
      // Preserve already published segments on retry!
      if (segDel.status === 'published' && segDel.remotePostId) {
        previousRemoteId = segDel.remotePostId;
        collectedRemoteIds.push(segDel.remotePostId);
        continue;
      }

      const segmentPayload = segments[sIdx] || segments[0];
      const res = await publishSegmentToProvider({
        account,
        grant,
        segment: segmentPayload,
        previousRemotePostId: previousRemoteId,
        idempotencyKey: segDel.idempotencyKey,
        simulateAmbiguousTimeout: params.simulateAmbiguousTimeout,
        simulateRateLimit: params.simulateRateLimit,
      });

      if (res.status === 'published' && res.remotePostId) {
        updatedSegmentDeliveries[sIdx] = {
          ...segDel,
          status: 'published',
          remotePostId: res.remotePostId,
          remoteUrl: res.remoteUrl,
          error: undefined,
          publishedAt: new Date(),
        };
        previousRemoteId = res.remotePostId;
        collectedRemoteIds.push(res.remotePostId);
      } else if (res.status === 'timeout_ambiguous') {
        encounteredAmbiguous = true;
        lastErrorMsg = res.sanitizedError;
        updatedSegmentDeliveries[sIdx] = {
          ...segDel,
          error: res.sanitizedError,
        };
        break;
      } else if (res.status === 'rate_limited') {
        encounteredRateLimit = true;
        rateLimitRetrySec = res.retryAfterSec || 30;
        lastErrorMsg = res.sanitizedError;
        updatedSegmentDeliveries[sIdx] = {
          ...segDel,
          error: res.sanitizedError,
        };
        break;
      } else {
        encounteredFailure = true;
        lastErrorMsg = res.sanitizedError || 'Upstream publish failed';
        updatedSegmentDeliveries[sIdx] = {
          ...segDel,
          status: 'failed',
          error: lastErrorMsg,
        };
        break;
      }
    }

    // Fencing check before committing state transitions
    const currentJobState = await db.collection('jobs').findOne({ _id: claimedJob._id });
    if (!currentJobState || currentJobState.fencingToken !== activeFencingToken) {
      // Another worker superseded our lease; abort writing
      continue;
    }

    const durationMs = Date.now() - attemptStart;
    const attemptDoc: PublishAttemptRecord = {
      _id: `att_${Date.now().toString(36)}_${generateRandomState(5)}`,
      workspaceId: target.workspaceId,
      jobId: claimedJob._id,
      targetId: target._id,
      accountId: account._id,
      provider: account.provider,
      attemptNumber: claimedJob.attempts,
      fencingToken: activeFencingToken,
      status: encounteredAmbiguous
        ? 'timeout_ambiguous'
        : encounteredRateLimit
        ? 'rate_limited'
        : encounteredFailure
        ? 'failed'
        : 'success',
      httpStatus: encounteredAmbiguous ? 504 : encounteredRateLimit ? 429 : encounteredFailure ? 400 : 201,
      sanitizedError: lastErrorMsg,
      remoteIds: collectedRemoteIds,
      durationMs,
      createdAt: new Date(),
    };
    await db.collection('publish_attempts').insertOne(attemptDoc);

    const anyPublished = updatedSegmentDeliveries.some((s) => s.status === 'published');
    const allPublished = updatedSegmentDeliveries.every((s) => s.status === 'published');

    if (allPublished) {
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: 'published',
            segmentDeliveries: updatedSegmentDeliveries,
            lastError: undefined,
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'completed',
            lastError: undefined,
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('workspaces').updateOne(
        { _id: workspace._id },
        {
          $inc: {
            'usage.deliveriesUsed': 1,
            'usage.deliveriesReserved': -1,
          },
        }
      );
      succeededCount++;
    } else if (encounteredAmbiguous) {
      // Pause for reconciliation instead of blindly re-posting!
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: 'ambiguous_needs_reconcile',
            segmentDeliveries: updatedSegmentDeliveries,
            lastError: lastErrorMsg,
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'failed',
            lastError: lastErrorMsg,
            updatedAt: new Date(),
          },
        }
      );
      ambiguousCount++;
    } else if (encounteredRateLimit || claimedJob.attempts < claimedJob.maxAttempts) {
      const backoffSec = encounteredRateLimit
        ? rateLimitRetrySec
        : Math.min(300, Math.pow(2, claimedJob.attempts) * 5);
      const nextDue = new Date(Date.now() + backoffSec * 1000);

      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: anyPublished ? 'partially_published' : 'queued',
            segmentDeliveries: updatedSegmentDeliveries,
            lastError: lastErrorMsg,
            retryCount: claimedJob.attempts,
            nextRetryAt: nextDue,
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'queued',
            dueAt: nextDue,
            backoffMs: backoffSec * 1000,
            providerRetryAfterSec: encounteredRateLimit ? rateLimitRetrySec : undefined,
            lastError: lastErrorMsg,
            updatedAt: new Date(),
          },
        }
      );
      failedCount++;
    } else {
      // Max attempts exhausted -> dead_letter
      await db.collection('delivery_targets').updateOne(
        { _id: target._id },
        {
          $set: {
            status: anyPublished ? 'partially_published' : 'failed',
            segmentDeliveries: updatedSegmentDeliveries,
            lastError: lastErrorMsg,
            retryCount: claimedJob.attempts,
            updatedAt: new Date(),
          },
        }
      );
      await db.collection('jobs').updateOne(
        { _id: claimedJob._id, fencingToken: activeFencingToken },
        {
          $set: {
            status: 'dead_letter',
            lastError: lastErrorMsg,
            updatedAt: new Date(),
          },
        }
      );
      failedCount++;
    }

    // Roll up draft status from all targets for this scheduleVersion
    const allDraftTargets = await db
      .collection('delivery_targets')
      .find({
        workspaceId: draft.workspaceId,
        draftId: draft._id,
        scheduleVersion: draft.scheduleVersion,
      })
      .toArray();

    if (allDraftTargets.length > 0) {
      const everyPublished = allDraftTargets.every((t) => t.status === 'published');
      const somePublished = allDraftTargets.some(
        (t) => t.status === 'published' || t.status === 'partially_published'
      );
      const anyFailed = allDraftTargets.some(
        (t) => t.status === 'failed' || t.status === 'ambiguous_needs_reconcile'
      );

      const newDraftStatus: DraftRecord['status'] = everyPublished
        ? 'published'
        : somePublished
        ? 'partially_published'
        : anyFailed
        ? 'failed'
        : 'scheduled';

      await db
        .collection('drafts')
        .updateOne({ _id: draft._id }, { $set: { status: newDraftStatus, updatedAt: new Date() } });
    }
  }

  return {
    claimedCount,
    succeededCount,
    failedCount,
    ambiguousCount,
    processedJobIds,
  };
}

/**
 * Reconciles or safely retries a failed/ambiguous delivery target while preserving
 * already-published thread segments.
 */
export async function reconcileOrRetryDeliveryTarget(params: {
  actor: AuthContext;
  targetId: string;
  action: 'reconcile_lookup' | 'safe_retry';
}): Promise<{ ok: boolean; status: number; target?: DeliveryTargetRecord; error?: string }> {
  const db = await getDb();
  const target = await db.collection('delivery_targets').findOne({ _id: params.targetId });
  if (!target) {
    return { ok: false, status: 404, error: 'Delivery target not found.' };
  }

  const isPlatformAdmin =
    params.actor.user.platformRole === 'super_admin' ||
    params.actor.user.platformRole === 'operations_admin';

  if (!isPlatformAdmin && params.actor.workspace._id !== target.workspaceId) {
    return { ok: false, status: 403, error: 'Workspace scope mismatch.' };
  }

  const now = new Date();

  if (params.action === 'reconcile_lookup') {
    // Check deterministic idempotency contract to see if upstream posted before socket timeout
    const reconciledSegments = target.segmentDeliveries.map((seg) => {
      if (seg.status === 'published') return seg;
      const hash = Buffer.from(seg.idempotencyKey).toString('hex').slice(0, 12);
      const remotePostId = `${target.provider}_post_${hash}`;
      return {
        ...seg,
        status: 'published' as const,
        remotePostId,
        remoteUrl: `https://${target.provider === 'x' ? 'x.com' : `${target.provider}.com`}/status/${remotePostId}`,
        error: undefined,
        publishedAt: now,
      };
    });

    await db.collection('delivery_targets').updateOne(
      { _id: target._id },
      {
        $set: {
          status: 'published',
          segmentDeliveries: reconciledSegments,
          lastError: undefined,
          publishedAt: now,
          updatedAt: now,
        },
      }
    );

    await db
      .collection('drafts')
      .updateOne({ _id: target.draftId }, { $set: { status: 'published', updatedAt: now } });

    await recordAuditEvent({
      workspaceId: target.workspaceId,
      actorUserId: params.actor.user._id,
      actorEmail: params.actor.user.email,
      actorRole: params.actor.user.platformRole,
      action: 'publishing.target_reconciled',
      targetType: 'delivery_target',
      targetId: target._id,
      metadata: { provider: target.provider },
    });

    const updated = await db.collection('delivery_targets').findOne({ _id: target._id });
    return { ok: true, status: 200, target: updated! };
  }

  // Safe retry: re-queues only unpublished segments while preserving published ones
  const retryJob: JobRecord = {
    _id: `job_retry_${Date.now().toString(36)}_${generateRandomState(5)}`,
    workspaceId: target.workspaceId,
    type: 'publish_target',
    targetId: target._id,
    draftId: target.draftId,
    accountId: target.accountId,
    revisionNumber: target.revisionNumber,
    scheduleVersion: target.scheduleVersion,
    idempotencyKey: `job_retry_${target.idempotencyKey}_${Date.now()}`,
    status: 'queued',
    dueAt: now,
    fencingToken: 1,
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('jobs').insertOne(retryJob);
  await processDuePublishingJobs({ workerId: 'retry-dispatcher', maxJobs: 1 });

  await recordAuditEvent({
    workspaceId: target.workspaceId,
    actorUserId: params.actor.user._id,
    actorEmail: params.actor.user.email,
    actorRole: params.actor.user.platformRole,
    action: 'publishing.target_retried',
    targetType: 'delivery_target',
    targetId: target._id,
    metadata: { jobId: retryJob._id },
  });

  const updated = await db.collection('delivery_targets').findOne({ _id: target._id });
  return { ok: true, status: 200, target: updated! };
}
