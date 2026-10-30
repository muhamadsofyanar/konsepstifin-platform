/** Explicit Node 24 operator command. Never runs on a request, build, or startup. */
import postgres from 'postgres';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { IdentityStore } from '../src/lib/identity/store.ts';
import { hashPassword } from '../src/lib/identity/password.ts';

export async function runAccountOperation(command, data, query) {
  if (!data || typeof data.email !== 'string' || typeof data.password !== 'string') throw new Error('Email and password required in stdin JSON');
  const store = new IdentityStore(query);
  if (command === 'provision') {
    if (!Array.isArray(data.roles) || !data.roles.length || data.roles.some(role => !['admin', 'super_admin'].includes(role)))
      throw new Error('Provision requires admin or super_admin roles');
    return store.provisionAccount(data.email, await hashPassword(data.password), data.roles);
  }
  if (command === 'verify') {
    const userId = await store.verifyCredentials(data.email, data.password, true);
    if (!userId) throw new Error('Credentials rejected or account is not an active administrator');
    return { verified: true, userId };
  }
  throw new Error('Use migrate, provision, or verify');
}

async function main() {
  const command = process.argv[2];
  if (!['migrate', 'provision', 'verify'].includes(command)) throw new Error('Use migrate, provision, or verify');
  if (!process.env.DATABASE_URL || process.env.IDENTITY_ADMIN_CONFIRM !== 'yes')
    throw new Error('Set DATABASE_URL and IDENTITY_ADMIN_CONFIRM=yes for the intended database.');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    if (command === 'migrate') {
      const directory = new URL('./migrations/', import.meta.url);
      const files = (await readdir(directory)).filter(name => /^\d{3}-[a-z0-9-]+\.sql$/.test(name)).sort();
      for (const file of files) {
        await sql.unsafe(await readFile(new URL(file, directory), 'utf8'));
        console.log(`Applied ${file}`);
      }
    } else {
      // Credentials never appear in shell arguments or logs.
      let input = '';
      for await (const chunk of process.stdin) {
        input += chunk;
        if (input.length > 16384) throw new Error('Input too large');
      }
      console.log(JSON.stringify(await runAccountOperation(command, JSON.parse(input), async (text, values) => [...await sql.unsafe(text, values)])));
    }
  } finally { await sql.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    // Database exceptions can include queries/credentials. Report only known operator failures.
    const message = error instanceof Error ? error.message : '';
    console.error(/^(Use |Set DATABASE_URL|Email and password required|Provision requires|Credentials rejected|Input too large|Password must)/.test(message)
      ? message : 'Operator command failed. Check database connectivity, migration state, and stdin JSON.');
    process.exitCode = 1;
  });
}
