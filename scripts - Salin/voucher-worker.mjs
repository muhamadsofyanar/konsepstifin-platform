/** Recovery for paid voucher orders. Ambiguous external deliveries are never replayed. */
import postgres from 'postgres';
import {VoucherService} from '../src/lib/voucher-service.ts';
import {StifinVoucherApi} from '../src/lib/voucher-api.ts';
import {voucherMode} from '../src/lib/voucher-domain.ts';
let stopping=false,timer;
const sql=process.env.DATABASE_URL?postgres(process.env.DATABASE_URL,{max:2,connect_timeout:10,idle_timeout:20}):null;
const db=sql?{
 query:async(text,params=[])=>[...await sql.unsafe(text,params)],
 transaction:work=>sql.begin(tx=>work({query:async(text,params=[])=>[...await tx.unsafe(text,params)]})),
}:null;
async function tick(){
 if(stopping)return;
 if(db){
  try{
   const service=new VoucherService(db,new StifinVoucherApi(),voucherMode());
   const recovered=await service.recoverStale(10);
   if(recovered)console.info('Voucher: stale deliveries moved to manual review.');
   await service.processPending(20);
  }catch{
   // No raw API payloads, SQL, credentials or customer data in worker logs.
   console.error('Voucher queue unavailable. Check migrations, database and API configuration.');
  }
 }
 if(!stopping)timer=setTimeout(tick,15000);
}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{
 stopping=true;clearTimeout(timer);
 try{if(sql)await sql.end({timeout:5});}finally{process.exit(0);}
});
if(!db)console.info('Voucher worker waiting for DATABASE_URL configuration.');
await tick();
