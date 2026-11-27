export type PlatformRole = 'super_admin' | 'operations_admin' | 'user';

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'publisher'
  | 'editor'
  | 'analyst'
  | 'reviewer';

export type SocialProvider =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'bluesky'
  | 'mastodon'
  | 'substack';

export type ConnectionHealthState =
  | 'connected'
  | 'missing_credentials'
  | 'pending_review'
  | 'missing_permission'
  | 'unsupported_account'
  | 'expired_access'
  | 'exhausted_budget'
  | 'temporary_outage'
  | 'disconnected';

export interface UserRecord {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: boolean;
  platformRole: PlatformRole;
  mfaEnabled: boolean;
  mfaSecret?: string;
  status: 'active' | 'suspended';
  defaultWorkspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  _id: string;
  userId: string;
  workspaceId: string;
  csrfToken: string;
  mfaVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface WorkspaceRecord {
  _id: string;
  name: string;
  slug: string;
  planId: 'starter' | 'growth' | 'agency' | 'custom';
  billingInterval: 'monthly' | 'yearly';
  currency: 'INR' | 'USD';
  status: 'active' | 'suspended';
  isAdminWorkspace?: boolean;
  limits: {
    accounts: number;
    users: number;
    deliveriesPerMonth: number;
  };
  usage: {
    currentMonth: string; // YYYY-MM
    deliveriesUsed: number;
    deliveriesReserved: number;
  };
  approvalRule: 'optional' | 'required_before_schedule';
  slackWebhookUrl?: string;
  publicSocialPage?: {
    enabled: boolean;
    slug: string;
    title: string;
    bio: string;
    publishedPostIds: string[];
  };
  aiConfig?: {
    provider: 'gemini' | 'openai' | 'anthropic';
    toneSamples: string[];
    customInstructions: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationRecord {
  _id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedByUserId: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

export interface AccountGroupRecord {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  accountIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAppSettingRecord {
  _id: string; // provider id
  provider: SocialProvider;
  displayName: string;
  apiVersion: string;
  accessTier: string;
  approvalStatus: 'approved' | 'pending_review' | 'sandbox_only' | 'partner_pending';
  environmentFlags: {
    development: boolean;
    staging: boolean;
    production: boolean;
  };
  requestedScopes: string[];
  webhookStatus: 'verified' | 'unconfigured' | 'not_applicable';
  deletionCallbackStatus: 'verified' | 'unconfigured' | 'not_applicable';
  monthlyBudgetLimit?: number;
  monthlyBudgetUsed?: number;
  lastHealthCheckAt?: Date;
  lastHealthStatus: ConnectionHealthState;
  lastDiagnosticMessage?: string;
  customConfig?: Record<string, string>;
  updatedAt: Date;
  updatedByUserId?: string;
}

export interface OAuthTransactionRecord {
  _id: string;
  state: string;
  userId: string;
  sessionId: string;
  workspaceId: string;
  provider: SocialProvider;
  intendedAction: 'connect' | 'reconnect';
  codeVerifier?: string;
  instanceUrl?: string;
  redirectUri: string;
  consumedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface EncryptedSecretRecord {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  alg: 'AES-256-GCM';
}

export interface SocialGrantRecord {
  _id: string;
  workspaceId: string;
  provider: SocialProvider;
  connectedByUserId: string;
  encryptedAccessToken: EncryptedSecretRecord;
  encryptedRefreshToken?: EncryptedSecretRecord;
  grantedScopes: string[];
  tokenExpiresAt?: Date;
  refreshExpiresAt?: Date;
  instanceUrl?: string;
  status: 'active' | 'expired' | 'revoked';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccountCapabilities {
  canPublishText: boolean;
  canPublishImages: boolean;
  canPublishVideo: boolean;
  canPublishCarousel: boolean;
  canPublishReel: boolean;
  canPublishStory: boolean;
  canPublishDocument: boolean;
  canPublishPoll: boolean;
  canPublishThread: boolean;
  canPublishArticle: boolean;
  canQuote: boolean;
  canReply: boolean;
  canRepost: boolean;
  canReadInsights: boolean;
  maxCharacters: number;
  maxMediaItems: number;
}

export interface SocialAccountRecord {
  _id: string;
  workspaceId: string;
  grantId: string;
  provider: SocialProvider;
  externalAccountId: string;
  accountType: 'page' | 'business' | 'creator' | 'member' | 'organization' | 'profile' | 'instance_account' | 'notes';
  handle: string;
  displayName: string;
  avatarUrl?: string;
  encryptedPageToken?: EncryptedSecretRecord; // For Facebook Pages
  capabilities: SocialAccountCapabilities;
  healthState: ConnectionHealthState;
  lastVerifiedAt: Date;
  lastError?: string;
  remediationGuide?: string;
  groupIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadSegment {
  id: string;
  text: string;
  mediaIds: string[];
  poll?: {
    options: string[];
    durationMinutes: number;
  };
  quotePostUrl?: string;
  replyToPostId?: string;
  altTexts?: Record<string, string>;
}

export interface PlatformVariant {
  provider: SocialProvider;
  enabled: boolean;
  segments: ThreadSegment[];
  articleTitle?: string; // For X Articles / LinkedIn Long-form
  articleBodyMarkdown?: string;
  substackNoteExportedAt?: Date;
}

export interface WorkflowAutomationRule {
  id: string;
  type:
    | 'first_comment'
    | 'delayed_reply'
    | 'thread_finisher'
    | 'scheduled_quote'
    | 'conditional_repost'
    | 'recurrence';
  enabled: boolean;
  delayMinutes?: number;
  thresholdLikes?: number;
  content?: string;
  targetAccountId?: string;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly';
}

export interface DraftRecord {
  _id: string;
  workspaceId: string;
  authorId: string;
  title: string;
  status:
    | 'idea'
    | 'draft'
    | 'in_review'
    | 'changes_requested'
    | 'approved'
    | 'scheduled'
    | 'publishing'
    | 'published'
    | 'partially_published'
    | 'failed';
  version: number; // Optimistic concurrency version
  currentRevisionNumber: number;
  tags: string[];
  campaign?: string;
  pinned: boolean;
  isTemplate: boolean;
  targetAccountIds: string[];
  masterSegments: ThreadSegment[];
  platformVariants: Partial<Record<SocialProvider, PlatformVariant>>;
  automations: WorkflowAutomationRule[];
  assignedReviewerIds: string[];
  approvedRevisionNumber?: number;
  approvedByUserId?: string;
  approvedAt?: Date;
  scheduledAtUtc?: Date;
  scheduledTimezone?: string;
  scheduleVersion: number;
  clientReviewToken?: string;
  clientReviewExpiresAt?: Date;
  publishedOnSocialPage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftRevisionRecord {
  _id: string;
  workspaceId: string;
  draftId: string;
  revisionNumber: number;
  authorId: string;
  snapshot: {
    title: string;
    masterSegments: ThreadSegment[];
    platformVariants: Partial<Record<SocialProvider, PlatformVariant>>;
    targetAccountIds: string[];
    automations: WorkflowAutomationRule[];
  };
  changeSummary: string;
  isImmutablePublication: boolean;
  createdAt: Date;
}

export interface SegmentDeliveryRecord {
  segmentIndex: number;
  segmentId: string;
  idempotencyKey: string;
  status: 'pending' | 'published' | 'failed';
  remotePostId?: string;
  remoteUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export interface DeliveryTargetRecord {
  _id: string;
  workspaceId: string;
  draftId: string;
  revisionNumber: number;
  accountId: string;
  provider: SocialProvider;
  status:
    | 'queued'
    | 'claiming'
    | 'publishing'
    | 'published'
    | 'partially_published'
    | 'failed'
    | 'ambiguous_needs_reconcile'
    | 'cancelled';
  scheduledAtUtc: Date;
  displayTimezone: string;
  scheduleVersion: number;
  idempotencyKey: string;
  parentTargetId?: string; // For dependent quote/reply automations
  requiredParentRemoteId?: string;
  segmentDeliveries: SegmentDeliveryRecord[];
  lastError?: string;
  retryCount: number;
  nextRetryAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobRecord {
  _id: string;
  workspaceId: string;
  type: 'publish_target' | 'reconcile_target' | 'collect_metrics' | 'execute_automation' | 'cleanup_retention';
  targetId?: string;
  draftId?: string;
  accountId?: string;
  revisionNumber?: number;
  scheduleVersion?: number;
  idempotencyKey: string;
  status: 'queued' | 'claimed' | 'completed' | 'failed' | 'dead_letter' | 'cancelled';
  dueAt: Date;
  claimedByWorkerId?: string;
  claimedAt?: Date;
  leaseExpiresAt?: Date;
  fencingToken: number;
  attempts: number;
  maxAttempts: number;
  backoffMs?: number;
  lastError?: string;
  providerRetryAfterSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishAttemptRecord {
  _id: string;
  workspaceId: string;
  jobId: string;
  targetId: string;
  accountId: string;
  provider: SocialProvider;
  attemptNumber: number;
  fencingToken: number;
  status: 'success' | 'failed' | 'timeout_ambiguous' | 'rate_limited';
  httpStatus?: number;
  sanitizedError?: string;
  remoteIds: string[];
  durationMs: number;
  createdAt: Date;
}

export interface MediaAssetRecord {
  _id: string;
  workspaceId: string;
  uploadedByUserId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;
  s3ObjectKey: string;
  altText: string;
  tags: string[];
  status: 'ready' | 'deleted';
  createdAt: Date;
}

export interface CommentRecord {
  _id: string;
  workspaceId: string;
  draftId: string;
  revisionNumber: number;
  segmentId?: string;
  authorId: string;
  authorName: string;
  body: string;
  mentions: string[];
  resolved: boolean;
  createdAt: Date;
}

export interface ApprovalRecord {
  _id: string;
  workspaceId: string;
  draftId: string;
  revisionNumber: number;
  reviewerId: string;
  reviewerName: string;
  decision: 'approved' | 'changes_requested' | 'invalidated';
  note?: string;
  invalidatedReason?: string;
  invalidatedAt?: Date;
  createdAt: Date;
}

export interface CalendarSlotRecord {
  _id: string;
  workspaceId: string;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  time24h: string; // HH:mm
  timezone: string;
  accountGroupIds: string[];
  label?: string;
  enabled: boolean;
  createdAt: Date;
}

export interface MetricSnapshotRecord {
  _id: string;
  workspaceId: string;
  accountId: string;
  provider: SocialProvider;
  entityType: 'account' | 'post';
  entityId: string; // accountId or remotePostId
  draftId?: string;
  metricWindow: 'lifetime' | 'interval_24h' | 'interval_7d' | 'interval_30d';
  dateKey: string; // YYYY-MM-DD
  metrics: {
    impressions: number | null;
    reach: number | null;
    views: number | null;
    engagements: number | null;
    reactions: number | null;
    comments: number | null;
    reposts: number | null;
    saves: number | null;
    clicks: number | null;
    followerCount: number | null;
    followerChange: number | null;
  };
  nativeMetrics: Record<string, number | null>;
  engagementRateFormula: string;
  engagementRateDenominator: 'impressions' | 'reach' | 'views' | 'followers' | 'unavailable';
  engagementRatePercent: number | null;
  coverageStatus: 'verified' | 'restricted_scope' | 'unavailable_on_tier' | 'stale';
  syncedAt: Date;
}

export interface NotificationRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  type: 'invitation' | 'mention' | 'approval_requested' | 'approved' | 'changes_requested' | 'publish_failed' | 'publish_succeeded' | 'connection_alert';
  title: string;
  message: string;
  linkUrl?: string;
  readAt?: Date;
  createdAt: Date;
}

export interface IntegrationKeyRecord {
  _id: string;
  workspaceId: string;
  createdByUserId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: ('drafts:read' | 'drafts:write' | 'schedule:write' | 'publish:write' | 'accounts:read' | 'analytics:read' | 'mcp:tools')[];
  webhookUrl?: string;
  rateLimitPerMinute: number;
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface InquiryRecord {
  _id: string;
  reference: string;
  idempotencyKey: string;
  kind: 'contact_inquiry' | 'chat_lead' | 'chat_request';
  sessionId?: string;
  leadId?: string;
  name: string;
  email: string;
  company?: string;
  channels?: string;
  category: string;
  topic?: string;
  plan?: string;
  billing?: string;
  currency?: string;
  message: string;
  details?: Record<string, unknown>;
  status: 'New' | 'In Review' | 'Contacted' | 'Closed' | 'Spam';
  ownerUserId?: string;
  ownerName?: string;
  ipAddress?: string;
  legacyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageRecord {
  _id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  message: string;
  currency?: 'INR' | 'USD';
  createdAt: Date;
}

export interface AuditEventRecord {
  _id: string;
  workspaceId?: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
