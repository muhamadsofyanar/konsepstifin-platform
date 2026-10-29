# Build fix 0.10.8

Fixed the TypeScript initialization error in `src/app/admin/marketing/page.tsx`.
The PostgreSQL query result type includes query metadata, so the page now derives the row element types with indexed access (`[number]`) and declares the initial state as arrays of rows.

No database migration or runtime configuration was changed by this fix.

Validation performed: inspected the exact changed source and verified ZIP integrity. A full production build was not run in this environment because dependency installation timed out. Coolify should run the production build after this source is committed to the connected Git branch.
