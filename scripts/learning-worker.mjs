/** Restart-safe local fulfillment. Does not send vouchers, payments or messages. */
import postgres from 'postgres';
import {LearningService} from '../src/lib/learning-service.ts';
let stopping=false,timer;
const sql=process.env.DATABASE_URL?postgres(process.env.DATABASE_URL,{max:2,connect_timeout:10,idle_timeout:20}):null;
const service=sql?new LearningService({query:async(t,p=[])=>[...await sql.unsafe(t,p)],transaction:fn=>sql.begin(tx=>fn({query:async(t,p=[])=>[...await tx.unsafe(t,p)]}))}):null;
async function tick(){if(stopping)return;if(service)try{await service.processPending(20);}catch{console.error('Learning queue unavailable. Check migrations and database.');}if(!stopping)timer=setTimeout(tick,10000);}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{stopping=true;clearTimeout(timer);try{if(sql)await sql.end({timeout:5});}finally{process.exit(0);}});
await tick();
