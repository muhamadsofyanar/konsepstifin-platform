# Admin Satu Pintu Implementation Plan

> **For agentic workers:** Execute approved design task-by-task; independent modules may use dispatching-parallel-agents. Use TDD and one final whole-branch review.

**Goal:** One admin portal and internal manually verified orders, no active SEJOLI dependency.
**Architecture:** Existing Next.js app, PostgreSQL, shared database sessions, additive migrations. Public forms record requests; admins create orders and post payments.
**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, PostgreSQL, Node 24.
**Spec:** ../specs/2026-10-28-admin-satu-pintu-design.md

## Global Constraints
- Preserve old data, URLs, and uploaded source archive.
- No production access, push, deploy, or real credentials.
- One DB and one admin login. Manual verification of payments.
- ZIP includes tested operator commands and Coolify instructions.

## Review Focus
- Revoked/non-admin sessions and cross-origin mutations must fail closed.
- Repeated/concurrent payments must not double count; integer Rupiah only.
- Existing edited products must not be overwritten by seeds.
- Searches and totals must include records beyond first 500.
- Docker operator commands must work without development dependencies.

### Task 1: Shared admin identity and operator tooling
Files: admin-auth.ts, identity/*, admin login/logout API, migrations, identity-admin.mjs, Dockerfile.
Produces: getAdminPrincipal(), isAdminAuthenticated() and authenticated actor from one database session; operator migrate/provision/verify.
- [x] Add denial/login/logout tests, run RED.
- [x] Integrate database sessions and origin protection; preserve admin-only access.
- [x] Package migration/provision scripts for Node 24 runner; no legacy bypass.
- [x] Run identity tests GREEN.

### Task 2: Orders and payment ledger
Files: commerce domain/store/tests, migrations/002-commerce.sql, api/admin/orders/*, admin/pesanan/*.
Consumes: admin-auth getAdminPrincipal(), existing public_interest_leads.
Produces: internal orders with snapshots, integer money, transactional idempotent receipt/refund/correction; per-lead summaries.
- [x] Add domain and SQL integration tests for money/idempotency/refund/price snapshots, RED.
- [x] Implement admin order creation/detail/list/payment APIs and usable interface.
- [x] Verify totals calculated server-side, audit atomicity, receipt visibility admin only, GREEN.

### Task 3: Remove active SEJOLI and preserve catalog
Files: site-config, product-store, public-interest-action, interest-service/API, article CTA/validation, related tests and public text.
Produces: every public action stays in app, neutral product keys and internal links, no external redirect, catalog seeds insert-only.
- [x] Write form/CTA/validation/catalog preservation regressions, RED.
- [x] Implement internal request flow, remove obsolete public promises and editor checkout fields.
- [x] Preserve legacy DB fields and data; verify public regressions GREEN.

### Task 4: Server CRM pagination and atomic history
Files: interest-store, admin/leads page and manager/API, CRM tests.
Consumes: admin-auth and existing leads; no commerce table ownership.
Produces: paginated server filters/counts/options/metrics, current actor history, read-only legacy payment reference.
- [x] Add >500-row filter/count and race/rollback regressions, RED.
- [x] Implement SQL pagination and UI request ordering; payment amounts managed only by orders module.
- [x] Verify group/filter/detail/create/history regressions GREEN.

### Task 5: Portal and release integration
Files: admin overview/navigation/settings, CSS, README, release guide, package config.
- [x] Verify protected overview and configuration masking.
- [x] Create overview and settings, integrate menu/subsections and order links.
- [x] Run tests, identity tests, typecheck, lint, production build, browser/smoke checks.
- [x] Fresh reviewer checks branch; fix material issues and repeat required checks.
- [x] Produce full ZIP and checksum with deploy/rollback/backup guide; save deliverable.
