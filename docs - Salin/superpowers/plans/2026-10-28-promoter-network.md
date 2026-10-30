# Branch promoter account implementation

User request: Muhamad Sofyan AR is Head of Branch with ten subordinate promoters, eleven including himself. One official branch per kabupaten/kota. Vouchers flow branch to promoters. Find exact own network and prepare promoter accounts; user deploys manually via GitHub/Coolify.

Verified on 28 October 2026: official branch API proGetCab/pro/JML-CAB-62 returns eleven active exact members. Owner code BKS-HRA-40, branch JML-CAB-62. Head branch territory Kabupaten Pekalongan from project owner; promoter service area Sumedang is a separate field. Existing admin email admin@konsepstifin.com is reused; do not create a second owner login using external registry email.

Implementation decisions:
- One application/database/sessions; promoter role already exists. Add membership/profile and activation tokens.
- One branch per typed official regency code (Kabupaten Pekalongan 33.26), unique DB constraint, preserve multiple promoter service areas.
- Operator fetches branch API and only allowlists code/name/email/branch/area; never store upstream password/PassID or whole response.
- Import validates fixed branch, owner identity and exact expected 11 code set; uses transaction, fails conflicting mappings, never upgrades others to admin.
- Owner existing verified admin mapped to owner promoter code; ten new users inactive with random non-shared unusable password until activation.
- Tokens hashed, one-use, expiry, explicit reissue, origin-checked activation; no email/message sending. Token URLs only emitted privately by CLI/admin.
- Public portal /akun/login and /akun; no admin access for promoter, scoped consenting own leads only.
- Admin /admin/jaringan lists own branch and accounts separately from national directory; invitation reissue for pending users only.
- No existing production DB connection in this session. User runs migrate and network import to create live accounts after redeploy.
- Voucher pricing and opening balances are not known; don't fabricate credits or claim actual voucher refill. Branch membership is foundation for the next voucher module.

Tasks:
- [x] Core: migration004, branch/member service, actual-wire import/invitation/activation tests, operator command.
- [x] UI: promoter login/activation/portal and guarded admin network list/invite, no analytics token leakage.
- [x] Integration: navigation/proxy, TDD scope/security checks, build+smoke+release documentation and ZIP.

Shared contracts in src/lib/network-store.ts:
getNetworkOverview() => {branch:{code,name,regencyCode,regencyName,managerCode},members:[{userId,promoterCode,name,email,area,active,isManager}]}
getPromoterPortal(userId:string) => {profile:{userId,promoterCode,name,email,area,branchCode,branchName,isManager},leads:[{id,name,phone,email,city,status}],total:number}|null
issuePromoterInvite(userId:string,actorId:string) => {activationUrl:string,expiresAt:string}
activatePromoter(token:string,password:string) => void
All services server-only wrappers; core class dependency-injected for SQL tests. Invitation token passed in URL fragment, never query/referrer. Shared admin auth/current session APIs retained.

Completion:175 Vitest passed6 legacy skipped;7 network native,78 identity,45 legacy native passed;typecheck/lint/build/packagedHTTP smoke passed. Fresh reviewer found no P1/P2. Production import remains user-run per manual deployment preference.
Ruling: implement account/membership request now; don't fabricate or refill voucher balances without pricing and opening stock.
Ruling: use existing database email login and private single-use invitations; no shared password or upstream PassID reuse.
