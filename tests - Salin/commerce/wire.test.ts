import {readFileSync} from 'node:fs';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {expect,it} from 'vitest';
import {CommerceService,type CommerceDatabase} from '../../src/lib/commerce-service';
it('stores JSON line arrays through actual postgres.js wire binding on create and draft update',async()=>{
 const db=await PGlite.create();const server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});let sql:ReturnType<typeof postgres>|undefined;
 try{
  await server.start();sql=postgres(`postgres://postgres:postgres@${server.getServerConn()}/postgres`,{max:1,prepare:false,connect_timeout:5});const connection=sql;
  await connection.unsafe('CREATE TABLE public_interest_leads(id BIGINT PRIMARY KEY,name TEXT,phone TEXT,email TEXT)');await connection.unsafe("INSERT INTO public_interest_leads VALUES(1,'Ayu','081','a@example.test')");await connection.unsafe(readFileSync('scripts/migrations/002-commerce.sql','utf8'));
  // Characterize the driver bug: jsonb inference serializes an already-stringified value again.
  const scalar=await connection.unsafe('SELECT $1::jsonb AS value',[JSON.stringify([{name:'Tes'}])]);expect(typeof scalar[0].value).toBe('string');
  const adapter:CommerceDatabase={query:async(text,args=[])=>[...await connection.unsafe(text,args as never[])],transaction:fn=>connection.begin(async tx=>fn({query:async(text,args=[])=>[...await tx.unsafe(text,args as never[])]})) as Promise<Awaited<ReturnType<typeof fn>>>};
  const service=new CommerceService(adapter);const order=await service.create({leadId:1,lines:[{name:'Tes',unitPrice:100000,quantity:2}],key:'wire-create'},'admin');expect(order.lines).toEqual([{name:'Tes',unitPrice:100000,quantity:2}]);
  const updated=await service.command(order.id,{action:'update',lines:[{name:'Konsultasi',unitPrice:75000,quantity:3}],key:'wire-update'},'admin');expect(updated?.lines).toEqual([{name:'Konsultasi',unitPrice:75000,quantity:3}]);expect(updated?.total).toBe(225000);
 }finally{if(sql)await sql.end();await server.stop();await db.close();}
},20000);
