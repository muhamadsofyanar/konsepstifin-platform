/** Apply one explicitly named SQL migration. Never runs during build or startup. */
import postgres from 'postgres';
import { readFile, readdir } from 'node:fs/promises';

async function main() {
  const filename = process.argv[2] || '';
  if (!/^\d{3}-[a-z0-9-]+\.sql$/.test(filename)) throw new Error('Provide one migration filename, e.g. 012-integrations-promotions.sql');
  if (!process.env.DATABASE_URL || process.env.IDENTITY_ADMIN_CONFIRM !== 'yes') throw new Error('Set DATABASE_URL and IDENTITY_ADMIN_CONFIRM=yes for the intended database.');
  const directory = new URL('./migrations/', import.meta.url);
  const files = await readdir(directory);
  if (!files.includes(filename)) throw new Error('Migration file not found.');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    await sql.unsafe(await readFile(new URL(filename, directory), 'utf8'));
    console.log(`Applied ${filename}`);
  } catch {
    console.error('Migration failed. Check database connectivity, migration order, and backup state.');
    process.exitCode = 1;
  } finally { await sql.end(); }
}
main().catch(error => {
  const message = error instanceof Error ? error.message : '';
  console.error(/^(Provide one migration filename|Set DATABASE_URL|Migration file not found)/.test(message) ? message : 'Migration command failed.');
  process.exitCode = 1;
});
