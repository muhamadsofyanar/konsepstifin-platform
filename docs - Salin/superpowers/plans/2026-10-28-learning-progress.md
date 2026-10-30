# Ledger: 2026-10-28-learning-commerce.md
User authorized direct execution. Isolated extracted archive; originals untouched.
Decisions: policy defaults off; refund suspends affected grant pending explicit admin restoration; enrollment requirements snapshotted. Manual payment only until gateway selected.

Tasks 1 and 2 implemented. Review agent identified renewal/refund contribution and payout/refund queue gaps. Both reproduced with failing SQL integration tests and corrected. Earlier inactive-buyer refund, roundtrip duration and simulation report regressions also reproduced then fixed.
Ruling: delivery is local inbox only until provider selected; no guessed commission tariff or gateway. New ZIP release, preserving original archives.
Ruling: build memory usage fallback used outside release source because host lacks /proc. No production build/runtime instrumentation added.
Ruling: refund suspends affected purchase contribution, removes its renewal duration; manual restoration with reason. Certificate uses required lesson snapshot.
Final review: independent reviewer found two Important issues, both have RED→GREEN regressions: renewal contribution refund, pending-refund payout. No Critical/Important finding intentionally deferred. Existing member portal assertion updated to match the requested member learning entry point. Vitest now excludes generated .next output; commerce-store uses plain service adapter so existing non-Next test imports remain valid.

Task 3 complete: 237 app tests passed, 6 skipped; identity78, network7, node45. Lint/typecheck/build passed. Packaged standalone HTTP smoke and both native workers passed. Report queries now share one reserved connection; postgres.js wire regression passed. No real voucher/payment/server mutation. Delivery: source ZIP for same GitHub/Coolify app.
