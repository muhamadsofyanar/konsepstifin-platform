import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {expect,it,vi} from 'vitest';
import {CommerceService,type CommerceDatabase} from './commerce-service';
import {VoucherService,voucherCommerceGuard} from './voucher-service';
it('persists voucher lines and dispatch snapshots through real postgres.js wire binding',async()=>{
 const db=await PGlite.create(),server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});let sql:ReturnType<typeof postgres>|undefined;
 try{await server.start();sql=postgres(`postgres://postgres:postgres@${server.getServerConn()}/postgres`,{max:1,prepare:false,connect_timeout:5});const connection=sql;for(const migration of ['001-identity','002-commerce','003-operations','004-promoter-network','006-vouchers'])await connection.unsafe(readFileSync('scripts/migrations/'+migration+'.sql','utf8'));
  const user=randomUUID();await connection.unsafe("INSERT INTO platform_users(id,email,password_hash) VALUES($1,'wire@test.test','unused')",[user]);await connection.unsafe("INSERT INTO platform_user_roles VALUES($1,'promoter')",[user]);await connection.unsafe("INSERT INTO platform_branches VALUES('JML-CAB-62','Cabang','33.26','Pekalongan','MANAGER',now())");await connection.unsafe("INSERT INTO platform_promoter_accounts VALUES($1,'P-1')",[user]);await connection.unsafe("INSERT INTO platform_promoter_profiles(user_id,branch_code,name) VALUES($1,'JML-CAB-62','Promotor')",[user]);
  const adapter:CommerceDatabase={query:async(text,args=[])=>[...await connection.unsafe(text,args as never[])],transaction:fn=>connection.begin(async tx=>fn({query:async(text,args=[])=>[...await tx.unsafe(text,args as never[])]})) as Promise<Awaited<ReturnType<typeof fn>>>};let balance=3;const refill=vi.fn(async({quantity}:{quantity:number})=>{balance+=quantity;});const service=new VoucherService(adapter,{member:async()=>{},balance:async()=>({voucher:balance,free:2,checkedAt:'2026-10-28T00:00:00Z'}),refill},'live'),commerce=new CommerceService(adapter,voucherCommerceGuard);const order=await service.createVoucherOrder(user,{quantity:17,key:'wire'});expect((await commerce.get(order.id))?.lines).toEqual([{name:'Voucher STIFIn',quantity:17,unitPrice:165000}]);await commerce.command(order.id,{action:'receipt',amount:order.total,key:'paid',reason:'Bank verified',reference:'WIRE'},user);await service.processVoucherOrder(order.id);await service.processVoucherOrder(order.id);expect(refill).toHaveBeenCalledTimes(1);expect((await service.getVoucherFulfillment(order.id))?.fulfillmentStatus).toBe('success');const [row]=await connection.unsafe('SELECT before_balance,after_balance FROM voucher_orders WHERE order_id=$1',[order.id]);expect(row.before_balance.voucher).toBe(3);expect(row.after_balance.voucher).toBe(20);
 }finally{if(sql)await sql.end();await server.stop();await db.close();}
},20000);
