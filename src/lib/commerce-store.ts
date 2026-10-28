import { ensureProductSchema } from './product-store';
import { getDatabaseClient } from '@/lib/article-store';
import { CommerceService, type CommerceDatabase, type CommerceQuery } from './commerce-service';
import {voucherCommerceGuard} from './voucher-service.ts';
import {LearningService} from './learning-service';
import {processVoucherOrder} from './voucher-store.ts';
function database() {
 const sql=getDatabaseClient();
 const query:CommerceQuery['query']=async(text,params=[])=>await sql.unsafe(text,params as never[]) as unknown as Record<string,unknown>[];
 const db:CommerceDatabase={query,transaction:fn=>sql.begin(async tx=>fn({query:async(text,params=[])=>await tx.unsafe(text,params as never[]) as unknown as Record<string,unknown>[]})) as Promise<Awaited<ReturnType<typeof fn>>>};
 return db;
}
function commerce(){const db=database();const learning=new LearningService(db);return new CommerceService(db,async(tx,id,input)=>{await voucherCommerceGuard(tx,id,input);if(input.action==='issue')await tx.query("UPDATE learning_purchases SET snapshot=jsonb_set(snapshot,'{price}',to_jsonb(o.total)) FROM commerce_orders o WHERE learning_purchases.order_id=o.id AND o.id=$1 AND snapshot->>'kind'='service'",[id]);},(tx,id,leadId,total)=>learning.attachServiceOrder(tx,id,leadId,total));}
export const getOrder=(id:number)=>commerce().get(id);
export const listOrders=(options:{page?:number;leadId?:number}={})=>commerce().list(options);
export const createOrder=async(input:Parameters<CommerceService['create']>[0],actor:string)=>{await ensureProductSchema();return commerce().create(input,actor);};
export const commandOrder=async(id:number,input:Parameters<CommerceService['command']>[1],actor:string)=>{
 const order=await commerce().command(id,input,actor);
 // Receipt has committed. A failed delivery cannot roll back or misreport the receipt.
 if(input.action==='receipt'&&order?.paymentStatus==='paid'){try{await processVoucherOrder(id);}catch{/* Pending delivery is recoverable by the worker; payment remains committed. */}}
 if(['receipt','refund','correction'].includes(input.action)){try{await new LearningService(database()).reconcile(id);}catch{/* Durable SQL trigger keeps reconciliation queued for the worker. */}}
 return order;
};
export const getCommerceSummary=()=>commerce().summary();
export const getLeadOrders=(leadId:number)=>commerce().leadOrders(leadId);
export const getCommerceLead=(leadId:number)=>commerce().lead(leadId);
export type { CommerceOrder, OrderCommand } from './commerce-service';
