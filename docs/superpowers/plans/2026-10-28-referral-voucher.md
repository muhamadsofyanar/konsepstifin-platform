# Mitra referral and voucher purchases

User authorized referral aliases (official ID/name/nickname, unique, old aliases stay owned) and promoter self-service voucher balance/purchase with automatic fulfillment after payment received. Existing payment remains manual admin verification. Source plugin03 now supplied and fully read.

## Verified STIFIn contract from plugin0.10.1
- GET /proGetCab/pro/JML-CAB-62 validates branch member.
- GET /voucherGet/getTotVoucher/{KodeID}; named balance keys or legacy exactly[Free,Voucher]. Parse strictly, don't collect arbitrary metadata numbers.
- POST JSON /voucherPos/editCabVoucher/JML-CAB-62 fields KodeID,Jumlah,JmlFree='0',SaldoJ=current target voucher,SaldoF=current target free,Dispos=unique order reference,Ket=description,UserID=configured API user.
- Auth optional official header from existing server environment. No PassID reuse/exposure.
- Source plugin trusts 2xx but new implementation requires post-read exact balance delta before claiming success. No automatic repeat of ambiguous POST.
- No live POST during development/testing; only private read-only shape check allowed. Test mode default; live mode explicitly configured by operator.

## Architecture
One Next/PostgreSQL app. Alias/referral module owns migration005 and public form attribution. Voucher module owns migration006, commerce-linked orders and fulfillment state. No WordPress/SEJOLI runtime. Default price165000 Rupiah from prior user fact, editable admin, integer snapshots. Configured max per order1000 initially; no fixed packs. This is a safety limit adjustable admin, not one-size package.

## Referral
Active same-branch promoter may customize alias; default officialcode.lowercase. Normalize ASCII letters/digits/hyphens; unique case-insensitive; reserved routes/oldaliases cannot be stolen. /r/[alias] redirects only to allowed internal service destinations; sets HttpOnly Secure(Siteprod) SameSiteLax30day first-valid referral cookie. Server validates current account/role/member, ignores forged body assignment. Valid referral takes precedence over regional matching for new lead, subject to share consent. Store source partner user/code/alias separately from assigned promoter. Reassignment never rewrites source. No lifetime customer commission lock or automatic payouts introduced; future e-course attribution can consume recorded source.

## Voucher
Only server-derived own active profile in branch can buy and read private balance; caller cannot select another code. Checkout creates issued commerce order with nullable lead_id and explicit buyer_user_id plus voucher_orders linkage, no fake CRM lead/consent. Quantity integer1..configured max, price server-derived snapshot. Bank instructions reused. Paid eligibility is issued+sum ledger==total. Payment receipt commit queues/processes automatically; background worker is recovery for queued transactions, never a reason to resend uncertain POST.

At-most-one unresolved delivery per promoter. Persist claim and dispatch state BEFORE external POST. Lock order consistent with commerce. Refund/correction/cancel blocked once delivery preparing/dispatching/uncertain/success; before claim permissible but paid rechecked before dispatch. Order lines cannot be edited for system voucher orders. A sent ambiguous call stays needs_review and never automatically replays. Admin reconciliation requires note/reference and does not secretly resend. Compare fresh before/after; unavailable balance never becomes zero. Crash after dispatch needs manual review. Test_success terminal never silently becomes real delivery on mode change.

## Shared contracts
Voucher store exports getVoucherPortal(userId), getVoucherBalance(userId), createVoucherOrder(userId,{quantity,key}), getVoucherOrder(userId,id), getAdminVouchers(), saveVoucherSettings(actorId,{unitPrice,maxQuantity}), processVoucherOrder(id), getVoucherFulfillment(id), reconcileVoucherOrder(actorId,id,{action,note,reference}). Return DTO order includes id,number,quantity,unitPrice,total,balance,paymentStatus,fulfillmentStatus,mode,promoterCode,promoterName,createdAt,lastError. Portal response includes profile/settings/orders/bank.
Admin commerce commandOrder keeps signature; voucher agent adds in-transaction guard hook to CommerceService, runtime wrapper dispatches after committed full receipt; failures reflected delivery state instead of pretending payment rollback. Original service behavior without hook remains test-compatible. Voucher core modules native .ts imports so worker can execute in Node24 runner.

## File ownership
1 Referral agent: src/lib/referral-*,migration005,src/app/r/**,src/app/akun/tautan/**,api/account/referral/**,interest-store/service and interests API/forms +tests. Own form creation source persistence.
2 Voucher core agent: src/lib/voucher-*,migration006,commerce-service/store hooks +tests. Own payment/fulfillment safety.
3 Voucher UI agent: account voucher pages/APIs,admin voucher pages/APIs,admin order detail voucher status component/integration. No core/migration/nav edits.
4 Root: workers/startup/Docker/env,account guards/nav/wording/links,packaged smoke,review,docs/release.

## Verification
TDD module guards,alias collision/history/source preservation,overlapping order idempotency,partial/full payment,test vs live,no timeout replay,post-balance check,concurrent refund/dispatch,branch and own-data isolation; actual postgres.js wire. Full regression, typecheck,lint,build,standalone smoke. No production writes/push/deploy. User receives full ZIP and new env/migration/worker guidance.
