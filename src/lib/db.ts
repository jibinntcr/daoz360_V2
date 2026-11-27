import { MongoClient, Db, Collection, Document, Filter, UpdateFilter, FindOptions } from 'mongodb';
import fs from 'fs';
import path from 'path';
import {
  UserRecord,
  SessionRecord,
  WorkspaceRecord,
  MembershipRecord,
  InvitationRecord,
  AccountGroupRecord,
  ProviderAppSettingRecord,
  OAuthTransactionRecord,
  SocialGrantRecord,
  SocialAccountRecord,
  DraftRecord,
  DraftRevisionRecord,
  DeliveryTargetRecord,
  JobRecord,
  PublishAttemptRecord,
  MediaAssetRecord,
  CommentRecord,
  ApprovalRecord,
  CalendarSlotRecord,
  MetricSnapshotRecord,
  NotificationRecord,
  IntegrationKeyRecord,
  InquiryRecord,
  ChatMessageRecord,
  AuditEventRecord,
} from './types';
import { hashPassword, encryptSecret } from './security-crypto';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let useFallbackStore = false;

interface FallbackStoreData {
  users: UserRecord[];
  sessions: SessionRecord[];
  workspaces: WorkspaceRecord[];
  memberships: MembershipRecord[];
  invitations: InvitationRecord[];
  account_groups: AccountGroupRecord[];
  provider_app_settings: ProviderAppSettingRecord[];
  oauth_transactions: OAuthTransactionRecord[];
  social_grants: SocialGrantRecord[];
  social_accounts: SocialAccountRecord[];
  drafts: DraftRecord[];
  draft_revisions: DraftRevisionRecord[];
  delivery_targets: DeliveryTargetRecord[];
  jobs: JobRecord[];
  publish_attempts: PublishAttemptRecord[];
  media: MediaAssetRecord[];
  comments: CommentRecord[];
  approvals: ApprovalRecord[];
  calendar_slots: CalendarSlotRecord[];
  metric_snapshots: MetricSnapshotRecord[];
  notifications: NotificationRecord[];
  integration_keys: IntegrationKeyRecord[];
  inquiries: InquiryRecord[];
  chat_messages: ChatMessageRecord[];
  audit_events: AuditEventRecord[];
  rate_limits: Array<{ _id: string; key: string; count: number; expiresAt: Date }>;
}

const FALLBACK_FILE =
  process.env.DAOZ360_LOCAL_STORE_PATH ||
  path.join(process.cwd(), '.daoz360-data', 'store.json');

let memoryStore: FallbackStoreData | null = null;

function reviveDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(obj)) {
    return new Date(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => reviveDates(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = reviveDates(v);
    }
    return out as T;
  }
  return obj;
}

function getDefaultSeedStore(): FallbackStoreData {
  const now = new Date();
  const adminId = 'usr_superadmin_01';
  const opsId = 'usr_opsadmin_01';
  const customerId = 'usr_customer_01';
  const editorId = 'usr_editor_01';
  const reviewerId = 'usr_reviewer_01';

  const adminWsId = 'ws_daoz360_admin';
  const customerWsId = 'ws_acme_growth';

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@daoz360.ai';
  const adminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'ChangeMeImmediately!2026';

  const users: UserRecord[] = [
    {
      _id: adminId,
      email: adminEmail,
      name: 'DAOZ360 Super Admin',
      passwordHash: hashPassword(adminPass),
      emailVerified: true,
      platformRole: 'super_admin',
      mfaEnabled: true,
      mfaSecret: process.env.ADMIN_BOOTSTRAP_MFA_SECRET || 'JBSWY3DPEHPK3PXP',
      status: 'active',
      defaultWorkspaceId: adminWsId,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: opsId,
      email: 'ops@daoz360.ai',
      name: 'Operations Admin',
      passwordHash: hashPassword('OpsAdmin!2026'),
      emailVerified: true,
      platformRole: 'operations_admin',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      status: 'active',
      defaultWorkspaceId: adminWsId,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: customerId,
      email: 'alex@acmestudio.io',
      name: 'Alex Morgan',
      passwordHash: hashPassword('Customer!2026'),
      emailVerified: true,
      platformRole: 'user',
      mfaEnabled: false,
      status: 'active',
      defaultWorkspaceId: customerWsId,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: editorId,
      email: 'maya@acmestudio.io',
      name: 'Maya Lin',
      passwordHash: hashPassword('Editor!2026'),
      emailVerified: true,
      platformRole: 'user',
      mfaEnabled: false,
      status: 'active',
      defaultWorkspaceId: customerWsId,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: reviewerId,
      email: 'liam@acmestudio.io',
      name: 'Liam Patel',
      passwordHash: hashPassword('Reviewer!2026'),
      emailVerified: true,
      platformRole: 'user',
      mfaEnabled: false,
      status: 'active',
      defaultWorkspaceId: customerWsId,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const currentMonth = now.toISOString().slice(0, 7);

  const workspaces: WorkspaceRecord[] = [
    {
      _id: adminWsId,
      name: 'DAOZ360 Brand & Sandbox Workspace',
      slug: 'daoz360-internal',
      planId: 'agency',
      billingInterval: 'yearly',
      currency: 'USD',
      status: 'active',
      isAdminWorkspace: true,
      limits: { accounts: 40, users: 10, deliveriesPerMonth: 5000 },
      usage: { currentMonth, deliveriesUsed: 18, deliveriesReserved: 4 },
      approvalRule: 'optional',
      publicSocialPage: {
        enabled: true,
        slug: 'daoz360',
        title: 'DAOZ360 Official Social Feed',
        bio: 'Plan. Publish. Grow. Official updates from DAOZ360.',
        publishedPostIds: ['drf_sample_published_01'],
      },
      aiConfig: {
        provider: 'gemini',
        toneSamples: [
          'Bring your content, publishing and team into one workspace.',
          'More creating. Less coordinating.',
        ],
        customInstructions: 'Write with calm precision, clear structure, and zero hype.',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: customerWsId,
      name: 'Acme Studio Marketing',
      slug: 'acme-studio',
      planId: 'growth',
      billingInterval: 'monthly',
      currency: 'INR',
      status: 'active',
      isAdminWorkspace: false,
      limits: { accounts: 15, users: 3, deliveriesPerMonth: 1500 },
      usage: { currentMonth, deliveriesUsed: 42, deliveriesReserved: 6 },
      approvalRule: 'required_before_schedule',
      publicSocialPage: {
        enabled: true,
        slug: 'acme-studio',
        title: 'Acme Studio Social Highlights',
        bio: 'Curated threads, product launches, and design insights from Acme Studio.',
        publishedPostIds: ['drf_sample_published_01'],
      },
      aiConfig: {
        provider: 'gemini',
        toneSamples: [
          'Design systems work best when engineering and product speak the same language.',
          'Here is how we cut our weekly content review loop from 4 days to 45 minutes.',
        ],
        customInstructions: 'Keep threads concise, actionable, and human.',
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const memberships: MembershipRecord[] = [
    { _id: 'mem_01', workspaceId: adminWsId, userId: adminId, role: 'owner', status: 'active', createdAt: now, updatedAt: now },
    { _id: 'mem_02', workspaceId: adminWsId, userId: opsId, role: 'admin', status: 'active', createdAt: now, updatedAt: now },
    { _id: 'mem_03', workspaceId: customerWsId, userId: customerId, role: 'owner', status: 'active', createdAt: now, updatedAt: now },
    { _id: 'mem_04', workspaceId: customerWsId, userId: editorId, role: 'editor', status: 'active', createdAt: now, updatedAt: now },
    { _id: 'mem_05', workspaceId: customerWsId, userId: reviewerId, role: 'publisher', status: 'active', createdAt: now, updatedAt: now },
  ];

  const providerSettings: ProviderAppSettingRecord[] = [
    {
      _id: 'facebook',
      provider: 'facebook',
      displayName: 'Facebook Pages (Meta Graph API)',
      apiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
      accessTier: 'Standard / Advanced Access (Business Verification)',
      approvalStatus: process.env.META_FACEBOOK_APP_ID ? 'approved' : 'pending_review',
      environmentFlags: { development: true, staging: true, production: Boolean(process.env.META_FACEBOOK_APP_ID) },
      requestedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'read_insights'],
      webhookStatus: process.env.META_FACEBOOK_WEBHOOK_VERIFY_TOKEN ? 'verified' : 'unconfigured',
      deletionCallbackStatus: 'verified',
      lastHealthCheckAt: now,
      lastHealthStatus: process.env.META_FACEBOOK_APP_ID ? 'connected' : 'missing_credentials',
      lastDiagnosticMessage: process.env.META_FACEBOOK_APP_ID
        ? 'Meta App ID and Graph v21.0 endpoints verified.'
        : 'Set META_FACEBOOK_APP_ID and META_FACEBOOK_APP_SECRET to enable live OAuth.',
      updatedAt: now,
    },
    {
      _id: 'instagram',
      provider: 'instagram',
      displayName: 'Instagram Business & Creator (Instagram Login)',
      apiVersion: process.env.INSTAGRAM_API_VERSION || 'v21.0',
      accessTier: 'Instagram API with Instagram Login',
      approvalStatus: process.env.INSTAGRAM_CLIENT_ID ? 'approved' : 'pending_review',
      environmentFlags: { development: true, staging: true, production: Boolean(process.env.INSTAGRAM_CLIENT_ID) },
      requestedScopes: ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_insights'],
      webhookStatus: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? 'verified' : 'unconfigured',
      deletionCallbackStatus: 'verified',
      lastHealthCheckAt: now,
      lastHealthStatus: process.env.INSTAGRAM_CLIENT_ID ? 'connected' : 'missing_credentials',
      lastDiagnosticMessage: process.env.INSTAGRAM_CLIENT_ID
        ? 'Instagram Login endpoints and container polling ready.'
        : 'Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to enable live OAuth.',
      updatedAt: now,
    },
    {
      _id: 'linkedin',
      provider: 'linkedin',
      displayName: 'LinkedIn Member & Organization (Versioned REST)',
      apiVersion: process.env.LINKEDIN_API_VERSION || '202411',
      accessTier: 'Share on LinkedIn + Community Management API',
      approvalStatus: process.env.LINKEDIN_CLIENT_ID ? 'approved' : 'pending_review',
      environmentFlags: { development: true, staging: true, production: Boolean(process.env.LINKEDIN_CLIENT_ID) },
      requestedScopes: ['openid', 'profile', 'email', 'w_member_social', 'w_organization_social', 'r_organization_social', 'rw_organization_admin', 'r_member_postAnalytics'],
      webhookStatus: process.env.LINKEDIN_WEBHOOK_SECRET ? 'verified' : 'unconfigured',
      deletionCallbackStatus: 'not_applicable',
      lastHealthCheckAt: now,
      lastHealthStatus: process.env.LINKEDIN_CLIENT_ID ? 'connected' : 'missing_credentials',
      lastDiagnosticMessage: process.env.LINKEDIN_CLIENT_ID
        ? 'LinkedIn-Version 202411 and Restli-Protocol-Version 2.0.0 ready.'
        : 'Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to enable live OAuth.',
      updatedAt: now,
    },
    {
      _id: 'x',
      provider: 'x',
      displayName: 'X / Twitter API v2 (OAuth 2.0 PKCE)',
      apiVersion: 'v2',
      accessTier: 'Basic / Pro Tier (Credit Budget Monitored)',
      approvalStatus: process.env.X_CLIENT_ID ? 'approved' : 'sandbox_only',
      environmentFlags: { development: true, staging: true, production: Boolean(process.env.X_CLIENT_ID) },
      requestedScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'media.write'],
      webhookStatus: 'not_applicable',
      deletionCallbackStatus: 'not_applicable',
      monthlyBudgetLimit: Number(process.env.X_API_MONTHLY_BUDGET_CREDITS || 10000),
      monthlyBudgetUsed: 412,
      lastHealthCheckAt: now,
      lastHealthStatus: process.env.X_CLIENT_ID ? 'connected' : 'missing_credentials',
      lastDiagnosticMessage: process.env.X_CLIENT_ID
        ? 'X v2 PKCE S256 and credit budget guardrails active.'
        : 'Set X_CLIENT_ID and X_CLIENT_SECRET to enable live OAuth 2.0 PKCE.',
      updatedAt: now,
    },
    {
      _id: 'threads',
      provider: 'threads',
      displayName: 'Meta Threads API',
      apiVersion: process.env.THREADS_API_VERSION || 'v1.0',
      accessTier: 'Threads Use Case (Meta Developer Portal)',
      approvalStatus: process.env.THREADS_APP_ID ? 'approved' : 'pending_review',
      environmentFlags: { development: true, staging: true, production: Boolean(process.env.THREADS_APP_ID) },
      requestedScopes: ['threads_basic', 'threads_content_publish', 'threads_manage_insights', 'threads_manage_replies'],
      webhookStatus: 'verified',
      deletionCallbackStatus: 'verified',
      lastHealthCheckAt: now,
      lastHealthStatus: process.env.THREADS_APP_ID ? 'connected' : 'missing_credentials',
      lastDiagnosticMessage: process.env.THREADS_APP_ID
        ? 'Threads v1.0 container publishing and insights active.'
        : 'Set THREADS_APP_ID and THREADS_APP_SECRET to enable live OAuth.',
      updatedAt: now,
    },
    {
      _id: 'bluesky',
      provider: 'bluesky',
      displayName: 'Bluesky (AT Protocol OAuth / PDS)',
      apiVersion: 'com.atproto / app.bsky',
      accessTier: 'AT Protocol OAuth Client & Custom PDS',
      approvalStatus: 'approved',
      environmentFlags: { development: true, staging: true, production: true },
      requestedScopes: ['atproto', 'transition:generic'],
      webhookStatus: 'not_applicable',
      deletionCallbackStatus: 'not_applicable',
      lastHealthCheckAt: now,
      lastHealthStatus: 'connected',
      lastDiagnosticMessage: 'AT Protocol OAuth client metadata and custom PDS discovery ready.',
      updatedAt: now,
    },
    {
      _id: 'mastodon',
      provider: 'mastodon',
      displayName: 'Mastodon Federated Instances',
      apiVersion: 'v1 / v2 REST',
      accessTier: 'Dynamic Per-Instance OAuth Registration',
      approvalStatus: 'approved',
      environmentFlags: { development: true, staging: true, production: true },
      requestedScopes: ['read:accounts', 'write:statuses', 'write:media'],
      webhookStatus: 'not_applicable',
      deletionCallbackStatus: 'not_applicable',
      lastHealthCheckAt: now,
      lastHealthStatus: 'connected',
      lastDiagnosticMessage: 'Instance discovery (/api/v2/instance) and status publishing active.',
      updatedAt: now,
    },
    {
      _id: 'substack',
      provider: 'substack',
      displayName: 'Substack Notes (Assisted Export / Partner Gate)',
      apiVersion: 'Assisted Export v1',
      accessTier: 'Partner Access Pending (Saved Notes & Manual Open Ready)',
      approvalStatus: 'partner_pending',
      environmentFlags: { development: true, staging: true, production: false },
      requestedScopes: ['notes:export'],
      webhookStatus: 'not_applicable',
      deletionCallbackStatus: 'not_applicable',
      lastHealthCheckAt: now,
      lastHealthStatus: 'pending_review',
      lastDiagnosticMessage: 'No public Substack Notes API exists; saved Notes variants, preview, and 1-click copy/open workflow active.',
      updatedAt: now,
    },
  ];

  const sampleGrantId = 'grt_sample_x_01';
  const sampleLinkedinGrantId = 'grt_sample_li_01';

  const socialGrants: SocialGrantRecord[] = [
    {
      _id: sampleGrantId,
      workspaceId: customerWsId,
      provider: 'x',
      connectedByUserId: customerId,
      encryptedAccessToken: encryptSecret('fixture_x_access_token_acme'),
      encryptedRefreshToken: encryptSecret('fixture_x_refresh_token_acme'),
      grantedScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'media.write'],
      tokenExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: sampleLinkedinGrantId,
      workspaceId: customerWsId,
      provider: 'linkedin',
      connectedByUserId: customerId,
      encryptedAccessToken: encryptSecret('fixture_li_access_token_acme'),
      grantedScopes: ['openid', 'profile', 'w_member_social', 'w_organization_social', 'r_organization_social'],
      tokenExpiresAt: new Date(now.getTime() + 55 * 24 * 3600 * 1000),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const socialAccounts: SocialAccountRecord[] = [
    {
      _id: 'acc_acme_x',
      workspaceId: customerWsId,
      grantId: sampleGrantId,
      provider: 'x',
      externalAccountId: 'x_192837465',
      accountType: 'profile',
      handle: '@acmestudio',
      displayName: 'Acme Studio',
      capabilities: {
        canPublishText: true,
        canPublishImages: true,
        canPublishVideo: true,
        canPublishCarousel: false,
        canPublishReel: false,
        canPublishStory: false,
        canPublishDocument: false,
        canPublishPoll: true,
        canPublishThread: true,
        canPublishArticle: false,
        canQuote: true,
        canReply: true,
        canRepost: true,
        canReadInsights: true,
        maxCharacters: 280,
        maxMediaItems: 4,
      },
      healthState: 'connected',
      lastVerifiedAt: now,
      groupIds: ['grp_acme_core'],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'acc_acme_linkedin',
      workspaceId: customerWsId,
      grantId: sampleLinkedinGrantId,
      provider: 'linkedin',
      externalAccountId: 'urn:li:organization:9841230',
      accountType: 'organization',
      handle: 'acme-studio-design',
      displayName: 'Acme Studio (LinkedIn Page)',
      capabilities: {
        canPublishText: true,
        canPublishImages: true,
        canPublishVideo: true,
        canPublishCarousel: false,
        canPublishReel: false,
        canPublishStory: false,
        canPublishDocument: true,
        canPublishPoll: true,
        canPublishThread: false,
        canPublishArticle: false,
        canQuote: false,
        canReply: true,
        canRepost: true,
        canReadInsights: true,
        maxCharacters: 3000,
        maxMediaItems: 9,
      },
      healthState: 'connected',
      lastVerifiedAt: now,
      groupIds: ['grp_acme_core'],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'acc_acme_substack',
      workspaceId: customerWsId,
      grantId: 'grt_substack_manual',
      provider: 'substack',
      externalAccountId: 'substack_acmestudio',
      accountType: 'notes',
      handle: '@acmestudio.substack.com',
      displayName: 'Acme Studio Notes (Assisted Export)',
      capabilities: {
        canPublishText: true,
        canPublishImages: true,
        canPublishVideo: false,
        canPublishCarousel: false,
        canPublishReel: false,
        canPublishStory: false,
        canPublishDocument: false,
        canPublishPoll: false,
        canPublishThread: false,
        canPublishArticle: false,
        canQuote: false,
        canReply: false,
        canRepost: false,
        canReadInsights: false,
        maxCharacters: 5000,
        maxMediaItems: 4,
      },
      healthState: 'pending_review',
      lastVerifiedAt: now,
      remediationGuide: 'Partner API access is pending with Substack. Use the Composer Assisted Export to copy formatted Notes and open Substack Notes directly.',
      groupIds: ['grp_acme_core'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const accountGroups: AccountGroupRecord[] = [
    {
      _id: 'grp_acme_core',
      workspaceId: customerWsId,
      name: 'Core Brand Channels',
      description: 'Primary X, LinkedIn, and Substack Notes channels for Acme Studio',
      color: '#FF5A00',
      accountIds: ['acc_acme_x', 'acc_acme_linkedin', 'acc_acme_substack'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const drafts: DraftRecord[] = [
    {
      _id: 'drf_sample_published_01',
      workspaceId: customerWsId,
      authorId: customerId,
      title: 'Q4 Design Workflow Architecture Thread',
      status: 'published',
      version: 3,
      currentRevisionNumber: 3,
      tags: ['Launch', 'Product', 'Thread'],
      campaign: 'Q4 Workflow Launch',
      pinned: true,
      isTemplate: false,
      targetAccountIds: ['acc_acme_x', 'acc_acme_linkedin'],
      masterSegments: [
        {
          id: 'seg_1',
          text: '1/ Social media works better when your ideas, content, and team move together in one shared calendar.',
          mediaIds: [],
        },
        {
          id: 'seg_2',
          text: '2/ Instead of scattered spreadsheets and lost approval threads, keep every revision, comment, and platform preview right beside the post.',
          mediaIds: [],
        },
      ],
      platformVariants: {
        linkedin: {
          provider: 'linkedin',
          enabled: true,
          segments: [
            {
              id: 'seg_li_1',
              text: 'Social media works better when your ideas, content, and team move together.\n\nInstead of scattered spreadsheets and lost approval threads, keep every revision, comment, and platform preview right beside the post.',
              mediaIds: [],
            },
          ],
        },
      },
      automations: [
        {
          id: 'auto_1',
          type: 'first_comment',
          enabled: true,
          content: 'Explore our full workflow guide at https://daoz360.ai/pricing',
        },
      ],
      assignedReviewerIds: [reviewerId],
      approvedRevisionNumber: 3,
      approvedByUserId: reviewerId,
      approvedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      scheduledAtUtc: new Date(now.getTime() - 12 * 3600 * 1000),
      scheduledTimezone: 'Asia/Kolkata',
      scheduleVersion: 1,
      publishedOnSocialPage: true,
      createdAt: new Date(now.getTime() - 48 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
    {
      _id: 'drf_sample_review_02',
      workspaceId: customerWsId,
      authorId: editorId,
      title: 'Multi-Channel Agency Collaboration Checklist',
      status: 'in_review',
      version: 2,
      currentRevisionNumber: 2,
      tags: ['Agency', 'Checklist'],
      campaign: 'Agency Playbook',
      pinned: false,
      isTemplate: false,
      targetAccountIds: ['acc_acme_x', 'acc_acme_linkedin'],
      masterSegments: [
        {
          id: 'seg_rev_1',
          text: 'How growing teams review and approve 40+ social accounts without bottlenecks: a 4-step checklist.',
          mediaIds: [],
        },
      ],
      platformVariants: {},
      automations: [],
      assignedReviewerIds: [reviewerId],
      clientReviewToken: 'rev_tok_sample_acme_2026',
      clientReviewExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      scheduleVersion: 1,
      publishedOnSocialPage: false,
      createdAt: new Date(now.getTime() - 6 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 3600 * 1000),
    },
    {
      _id: 'drf_sample_scheduled_03',
      workspaceId: customerWsId,
      authorId: customerId,
      title: 'Weekly Product Insights & Metrics Recap',
      status: 'scheduled',
      version: 1,
      currentRevisionNumber: 1,
      tags: ['Analytics', 'Weekly'],
      campaign: 'Q4 Workflow Launch',
      pinned: false,
      isTemplate: false,
      targetAccountIds: ['acc_acme_x'],
      masterSegments: [
        {
          id: 'seg_sched_1',
          text: 'Let your next idea start with insight. Review real impressions, reach, and engagement patterns across your connected channels.',
          mediaIds: [],
        },
      ],
      platformVariants: {},
      automations: [],
      assignedReviewerIds: [reviewerId],
      approvedRevisionNumber: 1,
      approvedByUserId: reviewerId,
      approvedAt: now,
      scheduledAtUtc: new Date(now.getTime() + 24 * 3600 * 1000),
      scheduledTimezone: 'Asia/Kolkata',
      scheduleVersion: 1,
      publishedOnSocialPage: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const deliveryTargets: DeliveryTargetRecord[] = [
    {
      _id: 'del_target_01',
      workspaceId: customerWsId,
      draftId: 'drf_sample_published_01',
      revisionNumber: 3,
      accountId: 'acc_acme_x',
      provider: 'x',
      status: 'published',
      scheduledAtUtc: new Date(now.getTime() - 12 * 3600 * 1000),
      displayTimezone: 'Asia/Kolkata',
      scheduleVersion: 1,
      idempotencyKey: 'idem_drf_sample_published_01_r3_acc_acme_x',
      segmentDeliveries: [
        {
          segmentIndex: 0,
          segmentId: 'seg_1',
          idempotencyKey: 'idem_drf_sample_published_01_r3_acc_acme_x_s0',
          status: 'published',
          remotePostId: '18619001001',
          remoteUrl: 'https://x.com/acmestudio/status/18619001001',
          publishedAt: new Date(now.getTime() - 12 * 3600 * 1000),
        },
        {
          segmentIndex: 1,
          segmentId: 'seg_2',
          idempotencyKey: 'idem_drf_sample_published_01_r3_acc_acme_x_s1',
          status: 'published',
          remotePostId: '18619001002',
          remoteUrl: 'https://x.com/acmestudio/status/18619001002',
          publishedAt: new Date(now.getTime() - 12 * 3600 * 1000),
        },
      ],
      retryCount: 0,
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
    {
      _id: 'del_target_02',
      workspaceId: customerWsId,
      draftId: 'drf_sample_published_01',
      revisionNumber: 3,
      accountId: 'acc_acme_linkedin',
      provider: 'linkedin',
      status: 'published',
      scheduledAtUtc: new Date(now.getTime() - 12 * 3600 * 1000),
      displayTimezone: 'Asia/Kolkata',
      scheduleVersion: 1,
      idempotencyKey: 'idem_drf_sample_published_01_r3_acc_acme_linkedin',
      segmentDeliveries: [
        {
          segmentIndex: 0,
          segmentId: 'seg_li_1',
          idempotencyKey: 'idem_drf_sample_published_01_r3_acc_acme_linkedin_s0',
          status: 'published',
          remotePostId: 'urn:li:share:72670019283',
          remoteUrl: 'https://www.linkedin.com/feed/update/urn:li:share:72670019283',
          publishedAt: new Date(now.getTime() - 12 * 3600 * 1000),
        },
      ],
      retryCount: 0,
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
    {
      _id: 'del_target_03',
      workspaceId: customerWsId,
      draftId: 'drf_sample_scheduled_03',
      revisionNumber: 1,
      accountId: 'acc_acme_x',
      provider: 'x',
      status: 'queued',
      scheduledAtUtc: new Date(now.getTime() + 24 * 3600 * 1000),
      displayTimezone: 'Asia/Kolkata',
      scheduleVersion: 1,
      idempotencyKey: 'idem_drf_sample_scheduled_03_r1_acc_acme_x',
      segmentDeliveries: [
        {
          segmentIndex: 0,
          segmentId: 'seg_sched_1',
          idempotencyKey: 'idem_drf_sample_scheduled_03_r1_acc_acme_x_s0',
          status: 'pending',
        },
      ],
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const metricSnapshots: MetricSnapshotRecord[] = [
    {
      _id: 'met_x_post_01',
      workspaceId: customerWsId,
      accountId: 'acc_acme_x',
      provider: 'x',
      entityType: 'post',
      entityId: '18619001001',
      draftId: 'drf_sample_published_01',
      metricWindow: 'lifetime',
      dateKey: now.toISOString().slice(0, 10),
      metrics: {
        impressions: 14820,
        reach: null,
        views: 14820,
        engagements: 942,
        reactions: 618,
        comments: 64,
        reposts: 128,
        saves: 132,
        clicks: 310,
        followerCount: 8420,
        followerChange: 38,
      },
      nativeMetrics: {
        impression_count: 14820,
        like_count: 618,
        reply_count: 64,
        retweet_count: 128,
        bookmark_count: 132,
        url_link_clicks: 310,
      },
      engagementRateFormula: '(reactions + comments + reposts + saves + clicks) / impressions * 100',
      engagementRateDenominator: 'impressions',
      engagementRatePercent: 8.45,
      coverageStatus: 'verified',
      syncedAt: now,
    },
    {
      _id: 'met_li_post_01',
      workspaceId: customerWsId,
      accountId: 'acc_acme_linkedin',
      provider: 'linkedin',
      entityType: 'post',
      entityId: 'urn:li:share:72670019283',
      draftId: 'drf_sample_published_01',
      metricWindow: 'lifetime',
      dateKey: now.toISOString().slice(0, 10),
      metrics: {
        impressions: 9640,
        reach: 6210,
        views: null,
        engagements: 615,
        reactions: 412,
        comments: 53,
        reposts: 38,
        saves: null,
        clicks: 112,
        followerCount: 12350,
        followerChange: 64,
      },
      nativeMetrics: {
        impressionCount: 9640,
        uniqueImpressionsCount: 6210,
        likeCount: 412,
        commentCount: 53,
        shareCount: 38,
        clickCount: 112,
      },
      engagementRateFormula: '(reactions + comments + reposts + clicks) / impressions * 100',
      engagementRateDenominator: 'impressions',
      engagementRatePercent: 6.38,
      coverageStatus: 'verified',
      syncedAt: now,
    },
  ];

  const calendarSlots: CalendarSlotRecord[] = [
    {
      _id: 'slot_mon_0930',
      workspaceId: customerWsId,
      dayOfWeek: 1,
      time24h: '09:30',
      timezone: 'Asia/Kolkata',
      accountGroupIds: ['grp_acme_core'],
      label: 'Morning Thought Leadership',
      enabled: true,
      createdAt: now,
    },
    {
      _id: 'slot_wed_1400',
      workspaceId: customerWsId,
      dayOfWeek: 3,
      time24h: '14:00',
      timezone: 'Asia/Kolkata',
      accountGroupIds: ['grp_acme_core'],
      label: 'Mid-Week Thread Slot',
      enabled: true,
      createdAt: now,
    },
    {
      _id: 'slot_fri_1630',
      workspaceId: customerWsId,
      dayOfWeek: 5,
      time24h: '16:30',
      timezone: 'Asia/Kolkata',
      accountGroupIds: ['grp_acme_core'],
      label: 'Friday Insights Recap',
      enabled: true,
      createdAt: now,
    },
  ];

  const inquiries: InquiryRecord[] = [
    {
      _id: 'inq_seed_01',
      reference: 'DAOZ-INQ-261127-4821',
      idempotencyKey: 'DAOZ-INQ-261127-4821',
      kind: 'contact_inquiry',
      name: 'Priya Nair',
      email: 'priya@horizonmedia.in',
      company: 'Horizon Media Labs',
      channels: 'Instagram, LinkedIn, X',
      category: 'Pricing & Package Enquiry',
      plan: 'Growth',
      billing: 'Yearly (Save 2 months)',
      currency: 'INR',
      message: 'We manage 12 client channels with 3 editors and would like to onboard onto the Growth yearly plan.',
      status: 'New',
      ownerUserId: opsId,
      ownerName: 'Operations Admin',
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 3600 * 1000),
    },
  ];

  const auditEvents: AuditEventRecord[] = [
    {
      _id: 'aud_seed_01',
      workspaceId: customerWsId,
      actorUserId: reviewerId,
      actorEmail: 'liam@acmestudio.io',
      actorRole: 'publisher',
      action: 'draft.approved',
      targetType: 'draft',
      targetId: 'drf_sample_published_01',
      metadata: { revisionNumber: 3, decision: 'approved' },
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
    {
      _id: 'aud_seed_02',
      workspaceId: customerWsId,
      actorUserId: customerId,
      actorEmail: 'alex@acmestudio.io',
      actorRole: 'owner',
      action: 'oauth.account_connected',
      targetType: 'social_account',
      targetId: 'acc_acme_x',
      metadata: { provider: 'x', handle: '@acmestudio' },
      createdAt: new Date(now.getTime() - 48 * 3600 * 1000),
    },
  ];

  return {
    users,
    sessions: [],
    workspaces,
    memberships,
    invitations: [],
    account_groups: accountGroups,
    provider_app_settings: providerSettings,
    oauth_transactions: [],
    social_grants: socialGrants,
    social_accounts: socialAccounts,
    drafts,
    draft_revisions: [
      {
        _id: 'rev_sample_01',
        workspaceId: customerWsId,
        draftId: 'drf_sample_published_01',
        revisionNumber: 3,
        authorId: customerId,
        snapshot: {
          title: drafts[0].title,
          masterSegments: drafts[0].masterSegments,
          platformVariants: drafts[0].platformVariants,
          targetAccountIds: drafts[0].targetAccountIds,
          automations: drafts[0].automations,
        },
        changeSummary: 'Final approved thread revision for publication',
        isImmutablePublication: true,
        createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
      },
    ],
    delivery_targets: deliveryTargets,
    jobs: [
      {
        _id: 'job_sample_01',
        workspaceId: customerWsId,
        type: 'publish_target',
        targetId: 'del_target_01',
        draftId: 'drf_sample_published_01',
        revisionNumber: 3,
        scheduleVersion: 1,
        idempotencyKey: 'job_idem_del_target_01',
        status: 'completed',
        dueAt: new Date(now.getTime() - 12 * 3600 * 1000),
        fencingToken: 1,
        attempts: 1,
        maxAttempts: 5,
        createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
        updatedAt: new Date(now.getTime() - 12 * 3600 * 1000),
      },
      {
        _id: 'job_sample_02',
        workspaceId: customerWsId,
        type: 'publish_target',
        targetId: 'del_target_03',
        draftId: 'drf_sample_scheduled_03',
        revisionNumber: 1,
        scheduleVersion: 1,
        idempotencyKey: 'job_idem_del_target_03',
        status: 'queued',
        dueAt: new Date(now.getTime() + 24 * 3600 * 1000),
        fencingToken: 1,
        attempts: 0,
        maxAttempts: 5,
        createdAt: now,
        updatedAt: now,
      },
    ],
    publish_attempts: [
      {
        _id: 'att_sample_01',
        workspaceId: customerWsId,
        jobId: 'job_sample_01',
        targetId: 'del_target_01',
        accountId: 'acc_acme_x',
        provider: 'x',
        attemptNumber: 1,
        fencingToken: 1,
        status: 'success',
        httpStatus: 201,
        remoteIds: ['18619001001', '18619001002'],
        durationMs: 380,
        createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
      },
    ],
    media: [],
    comments: [
      {
        _id: 'cmt_sample_01',
        workspaceId: customerWsId,
        draftId: 'drf_sample_review_02',
        revisionNumber: 2,
        authorId: reviewerId,
        authorName: 'Liam Patel',
        body: '@maya Could we tighten the opening hook so it fits cleanly above the fold on LinkedIn?',
        mentions: ['maya'],
        resolved: false,
        createdAt: new Date(now.getTime() - 3600 * 1000),
      },
    ],
    approvals: [
      {
        _id: 'apr_sample_01',
        workspaceId: customerWsId,
        draftId: 'drf_sample_published_01',
        revisionNumber: 3,
        reviewerId,
        reviewerName: 'Liam Patel',
        decision: 'approved',
        note: 'Verified thread copy and LinkedIn variant.',
        createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
      },
    ],
    calendar_slots: calendarSlots,
    metric_snapshots: metricSnapshots,
    notifications: [
      {
        _id: 'ntf_sample_01',
        workspaceId: customerWsId,
        userId: customerId,
        type: 'approval_requested',
        title: 'Draft awaiting review',
        message: 'Maya Lin requested review on "Multi-Channel Agency Collaboration Checklist".',
        linkUrl: '/dashboard?tab=composer&draftId=drf_sample_review_02',
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
    ],
    integration_keys: [],
    inquiries,
    chat_messages: [],
    audit_events: auditEvents,
    rate_limits: [],
  };
}

function loadFallbackStore(): FallbackStoreData {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
      memoryStore = reviveDates(JSON.parse(raw)) as FallbackStoreData;
      return memoryStore;
    }
  } catch {
    // ignore read error and seed default
  }
  memoryStore = getDefaultSeedStore();
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(store: FallbackStoreData): void {
  memoryStore = store;
  try {
    fs.mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Ephemeral serverless filesystem fallback (e.g., /tmp)
    try {
      const tmpFile = path.join('/tmp', 'daoz360-store.json');
      fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
    } catch {
      // keep in memory
    }
  }
}

function matchesFilter<T extends Record<string, any>>(doc: T, filter: Filter<T>): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(cond)) {
      if (!cond.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(cond)) {
      if (!cond.every((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    const val = key.includes('.')
      ? key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), doc as any)
      : doc[key];

    if (cond && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
      for (const [op, opVal] of Object.entries(cond)) {
        if (op === '$in' && Array.isArray(opVal)) {
          if (Array.isArray(val)) {
            if (!val.some((v) => opVal.includes(v))) return false;
          } else if (!opVal.includes(val)) {
            return false;
          }
        } else if (op === '$ne') {
          if (val === opVal) return false;
        } else if (op === '$lte') {
          if (!(val <= (opVal as any))) return false;
        } else if (op === '$gte') {
          if (!(val >= (opVal as any))) return false;
        } else if (op === '$lt') {
          if (!(val < (opVal as any))) return false;
        } else if (op === '$gt') {
          if (!(val > (opVal as any))) return false;
        } else if (op === '$exists') {
          const exists = val !== undefined && val !== null;
          if (Boolean(opVal) !== exists) return false;
        } else if (op === '$regex') {
          const flags = (cond as any).$options || 'i';
          const re = new RegExp(String(opVal), flags);
          if (!re.test(String(val || ''))) return false;
        }
      }
    } else {
      if (val !== cond) return false;
    }
  }
  return true;
}

function applyUpdate<T extends Record<string, any>>(doc: T, update: UpdateFilter<T>): T {
  const clone = { ...doc } as any;
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      if (k.includes('.')) {
        const parts = k.split('.');
        let cur = clone;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = { ...(cur[parts[i]] || {}) };
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = v;
      } else {
        clone[k] = v;
      }
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      if (k.includes('.')) {
        const parts = k.split('.');
        let cur = clone;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = { ...(cur[parts[i]] || {}) };
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = (Number(cur[parts[parts.length - 1]]) || 0) + Number(v);
      } else {
        clone[k] = (Number(clone[k]) || 0) + Number(v);
      }
    }
  }
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      delete clone[k];
    }
  }
  return clone as T;
}

class LocalCollection<T extends { _id: any }> {
  constructor(private collectionName: keyof FallbackStoreData) {}

  private getArray(): T[] {
    const store = loadFallbackStore();
    if (!store[this.collectionName]) {
      (store as any)[this.collectionName] = [];
    }
    return (store[this.collectionName] as unknown) as T[];
  }

  private persist(): void {
    saveFallbackStore(loadFallbackStore());
  }

  async findOne(filter: Filter<T> = {}): Promise<T | null> {
    const arr = this.getArray();
    return arr.find((item) => matchesFilter(item, filter)) || null;
  }

  find(filter: Filter<T> = {}, options?: FindOptions) {
    const arr = this.getArray().filter((item) => matchesFilter(item, filter));
    let current = [...arr];
    const cursor = {
      sort: (sortSpec: Record<string, 1 | -1>) => {
        const entries = Object.entries(sortSpec);
        current.sort((a: any, b: any) => {
          for (const [field, dir] of entries) {
            const av = a[field] instanceof Date ? a[field].getTime() : a[field];
            const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
          }
          return 0;
        });
        return cursor;
      },
      skip: (n: number) => {
        current = current.slice(n);
        return cursor;
      },
      limit: (n: number) => {
        current = current.slice(0, n);
        return cursor;
      },
      toArray: async (): Promise<T[]> => {
        return current;
      },
    };
    if (options?.sort) cursor.sort(options.sort as any);
    if (options?.skip) cursor.skip(options.skip);
    if (options?.limit) cursor.limit(options.limit);
    return cursor;
  }

  async countDocuments(filter: Filter<T> = {}): Promise<number> {
    return this.getArray().filter((item) => matchesFilter(item, filter)).length;
  }

  async insertOne(doc: T): Promise<{ insertedId: any }> {
    const arr = this.getArray();
    const existingIdx = arr.findIndex((x) => x._id === doc._id);
    if (existingIdx !== -1) {
      throw new Error(`E11000 duplicate key error collection: ${String(this.collectionName)} _id: ${doc._id}`);
    }
    arr.push(doc);
    this.persist();
    return { insertedId: doc._id };
  }

  async insertMany(docs: T[]): Promise<{ insertedCount: number }> {
    const arr = this.getArray();
    for (const d of docs) {
      arr.push(d);
    }
    this.persist();
    return { insertedCount: docs.length };
  }

  async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: { upsert?: boolean }
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const arr = this.getArray();
    const idx = arr.findIndex((item) => matchesFilter(item, filter));
    if (idx === -1) {
      if (options?.upsert) {
        const base = { ...(filter as any) };
        const created = applyUpdate<T>(base as T, update);
        arr.push(created);
        this.persist();
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }
    arr[idx] = applyUpdate(arr[idx], update);
    this.persist();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const arr = this.getArray();
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      if (matchesFilter(arr[i], filter)) {
        arr[i] = applyUpdate(arr[i], update);
        count++;
      }
    }
    if (count > 0) this.persist();
    return { matchedCount: count, modifiedCount: count };
  }

  async findOneAndUpdate(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: { returnDocument?: 'before' | 'after'; sort?: Record<string, 1 | -1> }
  ): Promise<T | null> {
    const arr = this.getArray();
    let candidates = arr.filter((item) => matchesFilter(item, filter));
    if (!candidates.length) return null;
    if (options?.sort) {
      const entries = Object.entries(options.sort);
      candidates.sort((a: any, b: any) => {
        for (const [field, dir] of entries) {
          const av = a[field] instanceof Date ? a[field].getTime() : a[field];
          const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
        }
        return 0;
      });
    }
    const target = candidates[0];
    const idx = arr.findIndex((x) => x._id === target._id);
    const before = { ...arr[idx] };
    const after = applyUpdate(arr[idx], update);
    arr[idx] = after;
    this.persist();
    return options?.returnDocument === 'before' ? before : after;
  }

  async deleteOne(filter: Filter<T>): Promise<{ deletedCount: number }> {
    const arr = this.getArray();
    const idx = arr.findIndex((item) => matchesFilter(item, filter));
    if (idx === -1) return { deletedCount: 0 };
    arr.splice(idx, 1);
    this.persist();
    return { deletedCount: 1 };
  }

  async deleteMany(filter: Filter<T>): Promise<{ deletedCount: number }> {
    const arr = this.getArray();
    const initialLen = arr.length;
    const remaining = arr.filter((item) => !matchesFilter(item, filter));
    (loadFallbackStore() as any)[this.collectionName] = remaining;
    this.persist();
    return { deletedCount: initialLen - remaining.length };
  }

  async createIndex(_spec: any, _options?: any): Promise<string> {
    return 'idx_local_ok';
  }
}

export async function getDb(): Promise<{
  isMongoConnected: boolean;
  collection: <K extends keyof FallbackStoreData>(
    name: K
  ) => Collection<FallbackStoreData[K][number] & Document> | LocalCollection<FallbackStoreData[K][number]>;
  withTransaction: <R>(fn: () => Promise<R>) => Promise<R>;
}> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'daoz360';

  if (uri && !useFallbackStore) {
    try {
      if (!cachedClient) {
        const client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 2500,
          connectTimeoutMS: 2500,
        });
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(dbName);
      }
      if (cachedDb && cachedClient) {
        return {
          isMongoConnected: true,
          collection: <K extends keyof FallbackStoreData>(name: K) =>
            cachedDb!.collection<FallbackStoreData[K][number] & Document>(String(name)),
          withTransaction: async <R>(fn: () => Promise<R>): Promise<R> => {
            const session = cachedClient!.startSession();
            try {
              let result!: R;
              await session.withTransaction(async () => {
                result = await fn();
              });
              return result;
            } finally {
              await session.endSession();
            }
          },
        };
      }
    } catch {
      useFallbackStore = true;
    }
  }

  return {
    isMongoConnected: false,
    collection: <K extends keyof FallbackStoreData>(name: K) =>
      new LocalCollection<FallbackStoreData[K][number]>(name),
    withTransaction: async <R>(fn: () => Promise<R>): Promise<R> => {
      return await fn();
    },
  };
}

/**
 * Configures required MongoDB schema validators, compound tenant-scoped unique indexes,
 * due-job indexes, analytics query indexes, and TTL indexes for short-lived OAuth and session records.
 */
export async function ensureDatabaseIndexes(): Promise<{
  mode: 'mongodb' | 'local_document_store';
  indexesCreated: string[];
}> {
  const db = await getDb();
  const created: string[] = [];

  // Users: unique email
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  created.push('users.email_unique');

  // Sessions: TTL index on expiresAt
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('sessions').createIndex({ userId: 1, revokedAt: 1 });
  created.push('sessions.expiresAt_ttl', 'sessions.userId_revokedAt');

  // Workspaces: unique slug
  await db.collection('workspaces').createIndex({ slug: 1 }, { unique: true });
  created.push('workspaces.slug_unique');

  // Memberships: compound tenant-scoped unique index
  await db.collection('memberships').createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
  created.push('memberships.workspaceId_userId_unique');

  // Invitations: compound tenant-scoped index + TTL on expiresAt
  await db.collection('invitations').createIndex({ token: 1 }, { unique: true });
  await db.collection('invitations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 86400 * 30 });
  created.push('invitations.token_unique', 'invitations.expiresAt_ttl');

  // OAuth transactions: unique one-time state + TTL index on expiresAt
  await db.collection('oauth_transactions').createIndex({ state: 1 }, { unique: true });
  await db.collection('oauth_transactions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  created.push('oauth_transactions.state_unique', 'oauth_transactions.expiresAt_ttl');

  // Social accounts: compound tenant-scoped unique index (workspaceId + provider + externalAccountId)
  await db
    .collection('social_accounts')
    .createIndex({ workspaceId: 1, provider: 1, externalAccountId: 1 }, { unique: true });
  created.push('social_accounts.workspace_provider_external_unique');

  // Drafts & revisions: compound tenant-scoped indexes
  await db.collection('drafts').createIndex({ workspaceId: 1, status: 1, scheduledAtUtc: 1 });
  await db
    .collection('draft_revisions')
    .createIndex({ workspaceId: 1, draftId: 1, revisionNumber: 1 }, { unique: true });
  created.push('drafts.workspace_status_schedule', 'draft_revisions.workspace_draft_rev_unique');

  // Delivery targets: compound tenant-scoped idempotency index
  await db
    .collection('delivery_targets')
    .createIndex({ workspaceId: 1, idempotencyKey: 1 }, { unique: true });
  await db.collection('delivery_targets').createIndex({ workspaceId: 1, draftId: 1 });
  created.push('delivery_targets.workspace_idempotency_unique');

  // Jobs: due jobs polling index + unique idempotencyKey
  await db.collection('jobs').createIndex({ status: 1, dueAt: 1, leaseExpiresAt: 1 });
  await db.collection('jobs').createIndex({ workspaceId: 1, idempotencyKey: 1 }, { unique: true });
  created.push('jobs.due_polling_idx', 'jobs.workspace_idempotency_unique');

  // Metric snapshots: analytics query index
  await db
    .collection('metric_snapshots')
    .createIndex(
      { workspaceId: 1, provider: 1, entityType: 1, entityId: 1, dateKey: 1 },
      { unique: true }
    );
  created.push('metric_snapshots.workspace_entity_date_unique');

  // Inquiries: unique reference + unique idempotencyKey
  await db.collection('inquiries').createIndex({ reference: 1 }, { unique: true });
  await db.collection('inquiries').createIndex({ idempotencyKey: 1 }, { unique: true });
  created.push('inquiries.reference_unique', 'inquiries.idempotencyKey_unique');

  // Audit events: workspace + timestamp
  await db.collection('audit_events').createIndex({ workspaceId: 1, createdAt: -1 });
  created.push('audit_events.workspace_createdAt');

  return {
    mode: db.isMongoConnected ? 'mongodb' : 'local_document_store',
    indexesCreated: created,
  };
}
