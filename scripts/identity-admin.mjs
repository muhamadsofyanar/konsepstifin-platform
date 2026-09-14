/** Explicit operator command. Never runs from a request or during build. */
import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
import {IdentityStore} from '../src/lib/identity/store.ts';
import {hashPassword} from '../src/lib/identity/password.ts';
if (!process.env.DATABASE_URL || process.env.IDENTITY_ADMIN_CONFIRM !== 'yes') {
  throw new Error('Set DATABASE_URL and IDENTITY_ADMIN_CONFIRM=yes for the intended database.');
}
const sql=postgres(process.env.DATABASE_URL,{max:1});
try {
  if(process.argv[2]==='migrate') {
    await sql.unsafe(await readFile(new URL('./migrations/001-identity.sql',import.meta.url),'utf8'));
    console.log('Identity migration applied.');
  } else if(process.argv[2]==='provision') {
    // Read credentials from stdin JSON; never from shell command arguments or logs.
    let input='';for await(const chunk of process.stdin) {input+=chunk;if(input.length>16384)throw new Error('Input too large');}
    const data=JSON.parse(input);
    const store=new IdentityStore(async(text,values)=>[...await sql.unsafe(text,values)]);
    const id=await store.createAccount(data.email,await hashPassword(data.password),data.roles,data.promoterCode??null);
    console.log(JSON.stringify({createdUserId:id}));
  } else throw new Error('Use migrate or provision');
} finally {await sql.end();}
