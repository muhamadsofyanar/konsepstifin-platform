import {test,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {OperationsService,type OperationQuery,type OperationTransaction} from './operations-service';
test('real PostgreSQL driver stores audit details as JSON objects through administrative writes',async()=>{
 const db=await PGlite.create(),server=new PGLiteSocketServer({db,port:0,host:'127.0.0.1'});let sql:ReturnType<typeof postgres>|undefined;
 try{
  await server.start();sql=postgres('postgres://postgres:postgres@'+server.getServerConn()+'/postgres',{max:1,connect_timeout:5});
  for(const file of ['001-identity.sql','003-operations.sql'])await sql.unsafe(await readFile('scripts/migrations/'+file,'utf8'));
  const actor=randomUUID(),hash=`scrypt$32768$8$1$${'ab'.repeat(16)}$${'ab'.repeat(64)}`;
  await sql.unsafe('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[actor,'wire@example.test',hash]);await sql.unsafe("INSERT INTO platform_user_roles VALUES($1,'admin')",[actor]);
  const driver=sql;
  const query:OperationQuery=async(text,args=[])=>[...await driver.unsafe(text,args)];
  const transaction:OperationTransaction=async(work)=>await driver.begin(async tx=>work(async(text,args=[])=>[...await tx.unsafe(text,args)])) as Awaited<ReturnType<typeof work>>;
  const service=new OperationsService(query,transaction);
  await service.saveSettings(actor,{bankName:'Bank Uji',accountNumber:'123',accountHolder:'Pengelola',instructions:'Periksa mutasi.'});
  const id=await service.createAdmin(actor,'admin2@example.test',hash);await service.updateAccount(actor,id,{active:false});
  const rows=await query('SELECT details FROM platform_admin_audit ORDER BY id');
  expect(rows.map(r=>r.details)).toEqual([{}, {}, {active:false,passwordReset:false}]);
  expect((await service.settings()).accountNumber).toBe('123');
 }finally{if(sql)await sql.end();await server.stop();await db.close();}
},20000);
