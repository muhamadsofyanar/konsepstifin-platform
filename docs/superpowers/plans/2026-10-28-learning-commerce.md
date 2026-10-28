# KonsepSTIFIn 0.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Execute inline as requested by user.

**Goal:** Upgrade 0.8 using the attached Averion development specification, retaining one account, database, ledger and voucher behavior.
**Architecture:** Additive PostgreSQL learning and affiliate tables. Existing commerce ledger remains payment authority. A transactional durable job reconciles access and commission after receipts/refunds. Protected files remain outside public directories.
**Tech Stack:** Next.js 16.2.10, React 19, PostgreSQL, postgres.js, Vitest/PGlite.
**Spec:** docs/Spesifikasi-Pengembangan-KonsepSTIFIn-dari-Averion.md

## Global Constraints
- Preserve old accounts/passwords/referral aliases/voucher flows.
- Do not set business tariffs, gateway or product content on behalf of owner.
- No payment gateway until selected. Manual transfer remains usable.
- No automatic replay of ambiguous voucher delivery.
- A single release package for GitHub/Coolify upload.

## Review Focus
- Direct material/file URLs must enforce access and drip server-side.
- Repeated payment processing must not duplicate entitlement or money.
- Refund after payout must keep a reversal and block unsafe balance reuse.
- Simultaneous checkout/payout operations must serialize.
- Product edits must not alter existing order snapshots.

### Task 1: Learning commerce and affiliate domain
Files: scripts/migrations/007-learning.sql, src/lib/learning-service.ts, tests/learning/service.test.ts.
- [x] Write and run failing integration tests: snapshot checkout, partial/full receipt, duplicate fulfillment, protected/drip lessons, progress persistence, renewal, refund reversal, atomic payout reservation, coupons.
- [x] Implement additive schema and transactional service. Payment hook enqueues reconciliation in same transaction.
- [x] Run integration tests and existing commerce/voucher tests.

### Task 2: HTTP and usable admin/student/partner screens
Files: src/lib/learning-store.ts, src/lib/learning-http.ts, src/app/api/learning/route.ts, src/app/api/learning/files/[id]/route.ts, src/app/belajar/*, src/app/admin/kelas/*, src/app/akun/kelas/*.
- [x] Add API authorization tests before implementation.
- [x] Implement authenticated action API, admin editor, catalog/checkout and student reader; partner payout dashboard.
- [x] Render text safely; validate outbound links and private file paths.
- [x] Run API tests, typecheck, lint and production build.

### Task 3: Recovery, upgrade and release
Files: scripts/learning-worker.mjs, Dockerfile, scripts/start-with-worker.mjs, docs/UPGRADE-0.9.md, docs/HASIL-PENGUJIAN-0.9.md.
- [x] Add worker recovery tests and preserve voucher worker.
- [x] Document migration/backup/restore/configuration/manual transfer and unfinished features.
- [x] Run full suites, review and package source as 0.9.0 ZIP.
