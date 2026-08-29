# Production Leads, Editorial Assistant, and Public Copy v0.5.1 Design

## Goal

Repair the production lead transaction, make the two public funnels unmistakable, reduce article optimization to a review-first workflow, and revise public copy without adding unverifiable claims.

## Scope and constraints

- Change only the Next.js website `konsepstifin.com`.
- Do not change `app.konsepstifin.com`, WordPress, SEJOLI, or its plugins.
- Preserve all existing production records and additive PostgreSQL migrations.
- A `test_service` lead may be matched to a promoter and redirected only to an HTTPS URL on `app.konsepstifin.com`.
- A `promoter_candidate` lead must never be matched, sent to checkout, or shown payment controls.
- Database and provider errors must be logged server-side but never returned verbatim to public visitors.
- AI-assisted article changes are previews. Applying a preview saves the article as `review`, never `published`.
- Article collisions are surfaced; no article is deleted, merged, redirected, or published automatically.
- Material from `KIRIM AI.zip` is style inspiration only. It is not a factual source.

## Lead transaction

The unique idempotency index is partial: `idempotency_key IS NOT NULL`. The insert conflict target will include the same predicate so PostgreSQL can infer the index. A repeated key returns the existing lead and does not create a second history row.

The public API classifies failures into two groups. Validation, consent, unsupported product, and unavailable checkout messages remain actionable 4xx responses. Database, SQL, network, and unknown exceptions return one neutral 500 message: `Permintaan belum dapat disimpan. Silakan coba kembali.` The original error is logged only on the server.

After a successful `test_service` response with a verified checkout URL, the client redirects immediately to that URL. The same idempotency key remains attached to the open form so a retry cannot duplicate the lead. A successful `promoter_candidate` response stays in the modal and shows its reference number.

## Funnel presentation

Public entry points use two consistent labels:

- `LAYANAN TES STIFIn` with actions that mention choosing a test, matching a promoter, or continuing to payment.
- `JALUR CALON PROMOTOR` with actions that mention requesting consultation or understanding the stages.

The contact page presents these paths before general contact information. Promoter-stage cards always pass `leadType="promoter_candidate"`. Test, regional, and promoter-profile actions always pass `leadType="test_service"`.

## Editorial workflow

The existing editor remains the system of record. Content Intelligence continues to rank priorities and opens the selected article in the editor. The selected article exposes one primary action: `Siapkan revisi AI`.

Generation creates a before/after preview covering title, excerpt, body depth, takeaway, keyword mapping, cluster, and internal links. Existing evidence and reviewer fields are preserved. The preview also lists detected keyword/title conflicts. The user may cancel and restore the original form or apply the result. Apply saves the selected article as `review` and clears scheduling; it never publishes directly.

Article status gains `archived`. Archived articles remain available in admin but are excluded from public queries and sitemaps. The manager adds status filtering and client pagination so the user does not work through one unbounded list.

Article validation strips executable HTML blocks and control characters before storage. React still renders article text without `dangerouslySetInnerHTML`.

## Public copy

Every public route is audited. Copy follows this order where appropriate:

1. A recognizable question or problem.
2. A factual explanation of the route's purpose.
3. A concrete benefit in everyday context.
4. One primary action and, only where useful, one lower-emphasis alternative.

The test and promoter journeys use different vocabulary. Medical outcomes, income, ranking, availability, official status, urgency, and service coverage are not claimed without repository evidence. Legal pages remain informational and are revised only for clarity.

## Verification

- Unit and component tests cover SQL conflict-target regression, public error masking, redirect behavior, candidate non-checkout behavior, article status/sanitization, optimization preview, and review-only apply.
- Existing PostgreSQL integration tests remain enabled when `TEST_DATABASE_URL` is supplied.
- Full tests, ESLint, TypeScript, and production build must pass.
- The release is committed in separate functional commits and packaged from tracked Git files only.

