/**
 * Compatibility tombstone for overwrite-based deployments.
 *
 * Older repository revisions contained an interest orchestration service that
 * depended on promoter APIs removed from v0.2.6. Keeping this empty module in
 * the deploy archive overwrites that stale file when the archive is copied on
 * top of an existing checkout, so Next.js does not type-check obsolete imports.
 * The active lead flow lives in `interest-store.ts` and
 * `src/app/api/interests/route.ts`.
 */
export {};
