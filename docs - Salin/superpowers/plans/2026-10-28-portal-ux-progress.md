# Ledger: Portal UX 0.9.1
User authorized direct implementation. Work in extracted source; original releases preserved.
Root cause: public .hero styles collided with learning hero. Replaced generic classes with isolated learning-app/lr-* namespace.
Role menu and tab tests RED -> GREEN. Account search and renewal aggregation findings from independent reviewer reproduced and fixed. Form failure alert test RED -> GREEN.
Policy: no automatic migrations on startup/request; readiness diagnostics are admin-only. No DB migration/ENV/dependency added. Existing 007 still required.
Browser local Chromium could not launch (SIGTRAP); cloud browser cannot reach local development server. No claim of successful real browser visual QA. Computed CSS and interaction tests used, plus standalone HTTP smoke.

Complete: 250 tests passed, 6 external tests skipped; lint/typecheck/build pass; standalone HTTP/operator/worker smoke pass. No real server/DB mutation. Source packaged as 0.9.1; visual browser limitation documented.
