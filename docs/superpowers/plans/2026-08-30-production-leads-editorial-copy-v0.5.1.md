# Production Leads, Editorial Assistant, and Public Copy v0.5.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver v0.5.1 with reliable lead persistence and checkout, visibly separate funnels, a review-first article assistant, and complete public-copy coverage.

**Architecture:** Keep PostgreSQL stores and AI providers server-only. Use the existing public interest component as the client boundary for form state and redirects. Extend the existing article editor rather than creating a second editor, with pure helpers for previews and client-only interaction.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PostgreSQL via `postgres`, Vitest, React Testing Library, ESLint.

**Spec:** `docs/superpowers/specs/2026-08-30-production-leads-editorial-copy-v0.5.1-design.md`

## Global Constraints

- Change only `konsepstifin.com`.
- Never expose SQL, database, provider, token, or PII details publicly.
- Never send `promoter_candidate` to matching or checkout.
- Never auto-publish an AI result.
- Do not delete existing tests or production records.
- Use only verifiable public claims.

---

### Task 1: Production lead persistence and checkout

**Files:**
- Modify: `src/lib/interest-store.ts`
- Modify: `src/app/api/interests/route.ts`
- Modify: `src/app/api/interests/route.test.ts`
- Modify: `src/app/public-interest-action.tsx`
- Modify: `src/app/public-interest-action.test.tsx`
- Test: `src/lib/interest-store.integration.test.ts`

**Interfaces:**
- Consumes: `submitInterest(payload, dependencies)` and partial unique index `public_interest_leads_idempotency_idx`.
- Produces: idempotent `createInterestLead`, neutral public 500 responses, immediate verified test checkout redirect.

- [ ] Add a route test where `submitInterest` rejects with the PostgreSQL conflict error and assert status 500 plus the neutral message, with no SQL text in JSON.
- [ ] Run `npm test -- src/app/api/interests/route.test.ts` and verify the new assertion fails against the raw-error response.
- [ ] Change the insert to `ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING` and mask internal route errors.
- [ ] Add a component test that a successful test submission invokes `navigateToCheckout` with the verified `app.konsepstifin.com` URL, while a promoter candidate does not navigate.
- [ ] Run `npm test -- src/app/public-interest-action.test.tsx src/app/api/interests/route.test.ts` and verify redirect/error behavior passes.
- [ ] Run the full test suite and commit as `fix: restore idempotent lead checkout`.

### Task 2: Explicit two-funnel entry points

**Files:**
- Modify: `src/app/jadi-promotor/page.tsx`
- Modify: `src/app/kontak/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/public-site-shell.tsx`
- Create: `src/app/funnel-entry-points.test.tsx`

**Interfaces:**
- Consumes: `PublicInterestAction` with explicit `LeadType`.
- Produces: unambiguous test-service and promoter-candidate entry points.

- [ ] Write rendering assertions for `JALUR CALON PROMOTOR`, `LAYANAN TES STIFIn`, and the absence of payment language on candidate actions.
- [ ] Run the focused test and confirm it fails for the current contact/navigation presentation.
- [ ] Add the two-path contact section, normalize candidate CTAs, and retain explicit `leadType` props.
- [ ] Run focused and full tests, then commit as `feat: clarify public test and promoter funnels`.

### Task 3: Review-first article assistant

**Files:**
- Modify: `src/lib/article-store.ts`
- Modify: `src/lib/content-optimizer.ts`
- Create: `src/lib/article-assistant.ts`
- Create: `src/lib/article-assistant.test.ts`
- Modify: `src/app/admin/artikel/article-editor.tsx`
- Create: `src/app/admin/artikel/article-editor.test.tsx`
- Modify: `src/app/admin/intelligence/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: generated article draft, `buildBatchOptimizationPlan`, `detectCannibalization`, and existing article update endpoint.
- Produces: `buildArticleRevisionPreview(original, generated, allArticles)` with `before`, `after`, `conflicts`, and `summary`; applying the preview sends an `ArticleInput` with `status: 'review'` and empty `scheduledAt`.

- [ ] Write pure tests that generated fields are merged, evidence/reviewer fields are preserved, conflicts are exposed, and status becomes `review`.
- [ ] Run `npm test -- src/lib/article-assistant.test.ts` and confirm failure because the helper does not exist.
- [ ] Implement the pure preview helper and make its tests pass.
- [ ] Write a component test for one-click generation, before/after preview, cancel restore, and `Simpan ke review` PUT payload.
- [ ] Run the editor test and confirm failure against the existing manual flow.
- [ ] Integrate the preview helper, add the focused review UI, keep server modules out of the client bundle, and make the component test pass.
- [ ] Run full tests and commit as `feat: add review-first article assistant`.

### Task 4: Article lifecycle and manageable lists

**Files:**
- Modify: `src/lib/article-store.ts`
- Create: `src/lib/article-store.test.ts`
- Modify: `src/app/admin/artikel/article-editor.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing article CRUD and public `status = 'published'` queries.
- Produces: `archived` status, storage sanitization, status filter, and 20-row manager pagination.

- [ ] Write tests that `archived` validates, script blocks/control characters are removed, and published input remains valid.
- [ ] Run the focused tests and observe failure.
- [ ] Extend status validation and sanitize stored article text without interpreting Markdown as HTML.
- [ ] Add article-manager status filtering, pagination, counts, and archive action without deleting records.
- [ ] Run focused and full tests, then commit as `feat: simplify article lifecycle management`.

### Task 5: Complete public copy audit

**Files:**
- Modify: public pages under `src/app` including `/`, `/tes-stifin`, `/jadi-promotor`, `/promotor`, `/wilayah`, `/edukasi`, `/affiliate`, `/tentang`, `/kontak`, `/privasi`, `/ketentuan`, local-city pages, promoter profiles, article pages, header, and footer.
- Create: `docs/verification/2026-08-30-public-copy-audit-v0.5.1.md`

**Interfaces:**
- Consumes: existing factual data, product catalog, promoter coverage, and two funnel labels.
- Produces: route-by-route old/new headline and CTA report plus revised copy.

- [ ] Inventory every public route, headline, primary CTA, and funnel ownership.
- [ ] Rewrite each route using problem → context → benefit → action while preserving factual boundaries.
- [ ] Record each old/new headline and CTA in the verification table.
- [ ] Search for unsupported claims and ambiguous cross-funnel CTAs.
- [ ] Run full tests, lint, TypeScript, and build; commit as `copy: align every public journey`.

### Task 6: Release verification and package

**Files:**
- Create: `docs/verification/2026-08-30-production-leads-editorial-copy-v0.5.1.md`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: all completed v0.5.1 commits.
- Produces: verified tracked-source ZIP and SHA-256.

- [ ] Set package version to `0.5.1` and document the production database regression fix and redeploy checks.
- [ ] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` from the final tree.
- [ ] Record exact results and skipped-test reasons in the verification report.
- [ ] Commit as `test: verify v0.5.1 production fixes`.
- [ ] Create the ZIP from `git ls-files`, exclude `.git`, `.next`, `node_modules`, environment files, credentials, and database dumps, then run `unzip -t` and SHA-256.

