# DAOZ360 — Official Social Provider Integration & Launch Guides

This guide mirrors the interactive configuration and diagnostic checklists inside **Platform Admin > Providers (`/admin?tab=providers`)**. Every OAuth provider uses the canonical callback pattern:

```text
{APP_BASE_URL}/api/integrations/{provider}/callback
```

- **Local Development Callback Origin**: `http://localhost:3000`
- **Production Canonical Origin**: `https://daoz360.ai`

---

## 1. Facebook Pages (Meta Graph API `v21.0`)

- **Developer Portal**: https://developers.facebook.com/apps/
- **Documentation**: https://developers.facebook.com/docs/pages-api/posts/
- **Verification Date**: `2026-11-27`
- **Required Environment Variables**:
  - `META_FACEBOOK_APP_ID` (`[WEB + WORKER]`)
  - `META_FACEBOOK_APP_SECRET` (`[WEB + WORKER]`)
  - `META_FACEBOOK_WEBHOOK_VERIFY_TOKEN` (`[WEB]`)
  - `META_GRAPH_API_VERSION=v21.0` (`[WEB + WORKER]`)
- **Registered Callback URLs**:
  - Dev: `http://localhost:3000/api/integrations/facebook/callback`
  - Prod: `https://daoz360.ai/api/integrations/facebook/callback`
- **Webhook & Data Deletion Callback URL**:
  - `https://daoz360.ai/api/webhooks/meta/deletion`
- **Permission-by-Feature Matrix**:
  - `pages_show_list`: Enumerate manageable Facebook Pages via `/me/accounts`.
  - `pages_read_engagement`: Verify Page tasks and read post engagement counts.
  - `pages_manage_posts`: Publish text, link, photo, and video posts to the selected Page using the Page Access Token.
  - `read_insights`: Collect Page and post impressions, reach, and reactions.
- **Note**: Personal Facebook timelines are outside the Meta Pages API and are explicitly rejected with `unsupported_account`.

---

## 2. Instagram Business & Creator (Instagram API with Instagram Login `v21.0`)

- **Developer Portal**: https://developers.facebook.com/apps/
- **Documentation**: https://developers.facebook.com/documentation/instagram-platform/insights
- **Verification Date**: `2026-11-27`
- **Required Environment Variables**:
  - `INSTAGRAM_CLIENT_ID` (`[WEB + WORKER]`)
  - `INSTAGRAM_CLIENT_SECRET` (`[WEB + WORKER]`)
  - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` (`[WEB]`)
  - `INSTAGRAM_API_VERSION=v21.0` (`[WEB + WORKER]`)
- **Registered Callback URLs**:
  - Dev: `http://localhost:3000/api/integrations/instagram/callback`
  - Prod: `https://daoz360.ai/api/integrations/instagram/callback`
- **Permission-by-Feature Matrix**:
  - `instagram_business_basic`: Read Instagram Business/Creator profile metadata without requiring a linked Facebook Page.
  - `instagram_business_content_publish`: Create media containers (`/{ig-user-id}/media`), poll container readiness, and publish (`/{ig-user-id}/media_publish`).
  - `instagram_business_manage_insights`: Collect media and account insights (`impressions`, `reach`, `saved`, `likes`, `comments`).

---

## 3. LinkedIn Member & Organization (Versioned REST API `202411`)

- **Developer Portal**: https://www.linkedin.com/developers/apps
- **Documentation**: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview
- **Verification Date**: `2026-11-27`
- **Required Environment Variables**:
  - `LINKEDIN_CLIENT_ID` (`[WEB + WORKER]`)
  - `LINKEDIN_CLIENT_SECRET` (`[WEB + WORKER]`)
  - `LINKEDIN_API_VERSION=202411` (`[WEB + WORKER]`)
- **Registered Callback URLs**:
  - Dev: `http://localhost:3000/api/integrations/linkedin/callback`
  - Prod: `https://daoz360.ai/api/integrations/linkedin/callback`
- **Portal Product & Entitlement Steps**:
  1. Associate and verify your LinkedIn Company Page on the app settings tab.
  2. Enable **Sign In with LinkedIn using OpenID Connect** (`openid`, `profile`, `email`) and **Share on LinkedIn** (`w_member_social`).
  3. Apply for **Community Management API** to unlock organization discovery, company page posting (`w_organization_social`), and organization analytics (`r_organization_social`).
  4. All calls to `/rest/posts` include `Linkedin-Version: 202411` and `X-Restli-Protocol-Version: 2.0.0`.

---

## 4. X / Twitter API v2 (OAuth 2.0 Authorization Code with PKCE S256)

- **Developer Portal**: https://developer.x.com/en/portal/dashboard
- **Documentation**: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
- **Verification Date**: `2026-11-27`
- **Required Environment Variables**:
  - `X_CLIENT_ID` (`[WEB + WORKER]`)
  - `X_CLIENT_SECRET` (`[WEB + WORKER]`)
  - `X_API_MONTHLY_BUDGET_CREDITS=10000` (`[WEB + WORKER]`)
- **Registered Callback URLs**:
  - Dev: `http://localhost:3000/api/integrations/x/callback`
  - Prod: `https://daoz360.ai/api/integrations/x/callback`
- **Scopes & Paid Tier Budget Guardrails**:
  - Requested scopes: `tweet.read tweet.write users.read offline.access media.write`.
  - Threads are published via `POST https://api.x.com/2/tweets` chaining `reply.in_reply_to_tweet_id` across ordered segments.
  - Admin > Providers includes a monthly credit budget cap (`monthlyBudgetLimit`) so automated syncs or excessive dispatches pause cleanly (`exhausted_budget`) before overrunning paid tier credits.

---

## 5. Meta Threads (`v1.0`), Bluesky (AT Protocol), Mastodon & Substack Notes

- **Threads**: Callback `{APP_BASE_URL}/api/integrations/threads/callback` with scopes `threads_basic`, `threads_content_publish`, `threads_manage_insights`.
- **Bluesky**: Callback `{APP_BASE_URL}/api/integrations/bluesky/callback` using AT Protocol OAuth discovery and PKCE S256, with custom PDS URL validation.
- **Mastodon**: Callback `{APP_BASE_URL}/api/integrations/mastodon/callback` with per-instance `/api/v2/instance` capability discovery and scopes `read:accounts write:statuses write:media`.
- **Substack Notes**: Saved Notes variants, preview, and 1-click Copy & Open Notes workflow active while private Substack partner API access is pending (`SUBSTACK_PARTNER_ENABLED=false`).
