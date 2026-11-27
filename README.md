# DAOZ360 V2 — Social Media Management, Publishing, Approvals & Analytics Platform

DAOZ360 is a full-stack, multi-tenant social media management application built with **Next.js App Router (TypeScript)**, an independently deployable **Node.js background worker**, and **MongoDB** (with replica-set transactional support and an automatic zero-config local document store fallback for local testing and serverless preview environments).

## Architecture & Key Capabilities

1. **Public Marketing & Legal Site Parity (`/`, `/pricing`, `/contact`, `/privacy-policy`, `/terms-conditions`, `/404`)**:
   - Preserves all verified DAOZ360 copy, 3D visual assets, regional price books (`INR` / `USD`, `Monthly` / `Yearly — save 2 months`), Open Graph metadata, JSON-LD structured data, `sitemap.xml`, `robots.txt`, and `.well-known/security.txt`.
   - Legacy redirects (`/home` &rarr; `/`, `/privacy` &rarr; `/privacy-policy`, `/terms` &rarr; `/terms-conditions`, and `.html` aliases) are configured in `next.config.ts`.
   - Database-backed contact form (`POST /contact/submit`, `POST /api/contact`) and automated chat assistant (`POST /api/chat/leads`, `POST /api/chat/messages`, `POST /api/chat/requests`) with idempotency, rate limits, and spam filtering.

2. **Platform Admin Console (`/admin`)**:
   - Requires Platform Super Admin or Operations Admin authentication with **6-digit TOTP MFA**.
   - **Overview**: Real telemetry for users, workspaces, configured providers, connected accounts, publishing outcomes, queue lag, and analytics freshness.
   - **Users & Workspaces**: Plan tier and limit enforcement (`Starter`, `Growth`, `Agency`), account suspension, and session revocation. Customer tokens and private draft contents are excluded from global inspection.
   - **Providers**: Per-network environment variable checklist, copyable callback URLs (`development`, `staging`, `production`), live diagnostics, step-by-step developer portal setup guides, X monthly credit budget cap, and Admin sandbox test account connection.
   - **Publishing & Analytics Operations**: Per-target status, fencing token attempt timeline, safe retry (preserving published segments), idempotency reconciliation, Leads & Inquiries inbox, and immutable Audit Log.

3. **Multi-Tenant Customer Dashboard (`/dashboard`)**:
   - **Overview & Workspace Switcher**: Multi-workspace switching, monthly delivery allowance meter, notifications, and `Cmd+K` / `Ctrl+K` command palette.
   - **Connections**: OAuth 2.0 (+ PKCE S256) connection flows for Facebook Pages, Instagram Business/Creator, LinkedIn Member & Organization, X v2, Threads, Bluesky, Mastodon, and Substack Notes Assisted Export.
   - **Composer & AI Studio**: Multi-part thread builder, per-platform variants, character/media validation, optimistic concurrency version checking (`expectedVersion`), immutable revision history, configurable AI Writing Assistant (hooks, threads, LinkedIn repurposing, alt text), natural-language scheduling (`"tomorrow at 9:30am"`), and first-comment workflow automation.
   - **Team & Approvals**: Role-based access control (`owner`, `admin`, `publisher`, `editor`, `analyst`, `reviewer`), last-owner protection, `@mention` comments, automatic approval invalidation on edit, and scoped expiring client review tokens.
   - **Analytics & Integrations**: Cross-account metrics with explicit engagement-rate formula and denominator, RFC 4180 CSV export, versioned REST API (`/api/v1/drafts`), OpenAPI spec (`/api/v1/drafts?openapi=1`), Zapier hooks, scoped MCP tools, and opt-in Public Social Pages (`/u/[slug]`).

---

## Local Setup & Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env.local

# 3. Optional: Start local MongoDB replica set & MinIO S3 via Docker
docker compose up -d mongodb minio

# 4. Initialize database collections, compound tenant indexes, TTL indexes, and bootstrap admin
npm run db:setup

# 5. Start Next.js web application (http://localhost:3000)
npm run dev

# 6. Start independent background worker process
npm run worker
# Or run a single deterministic worker cycle:
npm run worker:once

# 7. Run typecheck, tests, and production build
npm run typecheck
npm test
npm run build
```
