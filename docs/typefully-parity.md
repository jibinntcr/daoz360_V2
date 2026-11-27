# DAOZ360 — Typefully Functional Benchmark & Parity Matrix

Prepared from Typefully's publicly documented workflows (`typefully.com`, `typefully.com/changelog`, `support.typefully.com`, and `support.typefully.com/en/articles/8718287-typefully-api`), mapped directly to the DAOZ360 UI, server APIs, automated test suite, and upstream provider dependencies.

---

## 1. Core Composer, Threading & Media Formats

| Publicly Documented Feature | DAOZ360 UI Surface | DAOZ360 Server API / Service | Verification Status | Provider Dependency & Payload Limits |
| --- | --- | --- | --- | --- |
| **Multi-part Threads & Ordered Replies** | `/dashboard?tab=composer` (Segment builder, character counters, drag/add segments) | `POST /api/dashboard` (`save_draft`), `publishSegmentToProvider` | **Live-Verified (Fixture + E2E Tested)** | Supported on X (280 chars/seg), Threads (500 chars/seg), Bluesky (300 chars/seg), Mastodon (500 chars/seg). LinkedIn & Facebook Pages require single post or platform variant. |
| **Cross-Platform Variants per Draft** | `/dashboard?tab=composer` (Master segments + per-network customized variants) | `DraftRecord.platformVariants`, `validateSegmentsForAccount` | **Live-Verified (Fixture + E2E Tested)** | Enforces per-network character and media limits prior to scheduling. |
| **Concurrent Editing & Revision History** | `/dashboard?tab=composer` (Immutable revision drawer + restore + version check) | `saveDraftWithRevision` (`expectedVersion` optimistic concurrency check -> HTTP 409 on conflict) | **Live-Verified (E2E Tested)** | Database-backed in `drafts` and `draft_revisions`. |
| **Media Library, Alt Text, PDFs / Documents, GIFs & Polls** | `/dashboard?tab=composer` | `POST /api/dashboard` (`upload_media`), private S3 object key storage | **Live-Verified (E2E Tested)** | LinkedIn supports PDF/PPTX document uploads; Instagram requires media container; Polls gated on X, LinkedIn, Threads, Mastodon. |
| **X Articles / Long-Form Posts** | `/dashboard?tab=composer` (`articleTitle`, `articleBodyMarkdown`) | `PlatformVariant.articleBodyMarkdown`, capability flag `canPublishArticle` | **Gated by Provider Entitlement** | X API v2 does not expose a public endpoint for X Articles; requires X Premium+ manual or enterprise entitlement check before enabling direct publish button. |
| **Substack Notes Cross-Posting** | `/dashboard?tab=composer` (Substack Notes Variant card + 1-click Copy & Open Notes) | `PROVIDER_CATALOG.substack` (`supportsDirectPublish: false`) | **Assisted Export Active / Partner Pending** | Typefully documents a private partner Substack Notes connection (`articles/16124373`), which does not grant public API access. DAOZ360 saves Notes variants, renders preview, and provides a 1-click Copy & Open Substack Notes flow while partner access is pending. |

---

## 2. Scheduling, Planner & Workflow Automation

| Publicly Documented Feature | DAOZ360 UI Surface | DAOZ360 Server API / Service | Verification Status | Provider Dependency & Payload Limits |
| --- | --- | --- | --- | --- |
| **Visual Calendar, List View & Account Group Filters** | `/dashboard?tab=planner` | `GET /api/dashboard` (`calendarSlots`, `accountGroups`, `drafts`) | **Live-Verified (E2E Tested)** | Tenant-scoped in MongoDB. |
| **Natural-Language Scheduling (`"tomorrow 9:30am"`)** | `/dashboard?tab=composer` (Natural-language parser with timezone & parsed confirmation banner) | `parseNaturalLanguageSchedule` -> `scheduleOrPublishDraft` | **Live-Verified (E2E Tested)** | Persists exact UTC instant (`scheduledAtUtc`) and `displayTimezone`. |
| **Recurring Time Slots & Best Time Suggestions** | `/dashboard?tab=planner` | `calendar_slots` collection + `getWorkspaceAnalyticsOverview` (`bestTimeRecommendations`) | **Live-Verified (E2E Tested)** | Uses explained historical sample size; falls back to user-configured queue slots when sample < 5 posts. |
| **First Comments / Auto-Plugs / Delayed Replies / Quote Dependencies** | `/dashboard?tab=composer` (Opt-in Workflow Automation rules) | `DraftRecord.automations`, `DeliveryTargetRecord.parentTargetId` | **Live-Verified (E2E Tested)** | Dependent publication requires a valid parent `remotePostId` and automatically updates when parent schedule changes. |
| **Durable Queue, Atomic Claims, Fencing & Partial Thread Recovery** | `/dashboard?tab=publishing_history` & `/admin?tab=publishing_ops` | `src/worker/index.ts`, `processDuePublishingJobs`, `reconcileOrRetryDeliveryTarget` | **Live-Verified (E2E Tested)** | Preserves already-published thread segments on retry; pauses on `timeout_ambiguous` for idempotency reconciliation. |

---

## 3. Team Collaboration, Approvals & AI Writing Assistant

| Publicly Documented Feature | DAOZ360 UI Surface | DAOZ360 Server API / Service | Verification Status | Provider Dependency & Payload Limits |
| --- | --- | --- | --- | --- |
| **Role-Based Permissions & Last-Owner Protection** | `/dashboard?tab=team_approvals` & `/admin` | `src/lib/auth.ts` (`updateOrRemoveMemberRole`) | **Live-Verified (E2E Tested)** | Separate platform roles (`super_admin`, `operations_admin`) and workspace roles (`owner`, `admin`, `publisher`, `editor`, `analyst`, `reviewer`). Prevents removing last owner and revokes sessions on removal. |
| **Shared Comments, @Mentions & Approval Invalidation on Edit** | `/dashboard?tab=team_approvals` | `recordDraftApprovalDecision`, `saveDraftWithRevision` | **Live-Verified (E2E Tested)** | Editing an approved payload automatically invalidates prior approval (`decision: 'invalidated'`) and blocks scheduling until re-approved. |
| **Scoped Expiring Client Review Links** | `/dashboard?tab=team_approvals` | `DraftRecord.clientReviewToken`, `clientReviewExpiresAt` | **Live-Verified (E2E Tested)** | Scoped to a single draft with 7-day expiration. |
| **AI Writing Assistant (Hooks, Threads, Rewrites, Tone Guidance, Alt Text)** | `/dashboard?tab=composer` (AI Studio panel) | `POST /api/dashboard` (`ai_writing_assist`) | **Live-Verified (E2E Tested)** | Enforces workspace boundaries; AI output never auto-publishes and stays in draft review state until applied and approved. |

---

## 4. Analytics, Public Social Page, API / MCP & Native Distribution

| Publicly Documented Feature | DAOZ360 UI Surface | DAOZ360 Server API / Service | Verification Status | Provider Dependency & Payload Limits |
| --- | --- | --- | --- | --- |
| **Cross-Account Analytics & RFC 4180 CSV Export** | `/dashboard?tab=analytics` | `getWorkspaceAnalyticsOverview`, `exportMetricsToCsv` | **Live-Verified (E2E Tested)** | Displays exact engagement-rate formula and denominator (`impressions`). Never conflates impressions with unique reach or sums unique reach across networks. |
| **Versioned REST API v1, OpenAPI Docs, Zapier & Scoped MCP Tools** | `/dashboard?tab=integrations` | `GET/POST /api/v1/drafts`, `/api/v1/drafts?openapi=1` | **Live-Verified (E2E Tested)** | Uses SHA-256 hashed revocable API keys, rate limits, and enforces workspace approval rules on API/MCP schedule calls. |
| **Opt-In Public Social Page (Social Blog)** | `/dashboard?tab=social_page` & `/u/[slug]` | `src/app/u/[slug]/page.tsx` | **Live-Verified (E2E Tested)** | Opt-in per workspace with explicit post selection and instant unpublish control. |
| **Native macOS Desktop App Distribution** | Web Command Palette (`Cmd+K` / `Ctrl+K`) + Responsive PWA Manifest (`/site.webmanifest`) | Functional Web Equivalent Active | **Separate Native Deliverable** | Native macOS binary notarization/App Store packaging is a separate desktop distribution deliverable; all keyboard-first quick-capture (`Cmd+K`) workflows are implemented in the web application. |
