import { getDatabaseClient } from '@/lib/article-store';
import { CommerceService, type CommerceDatabase, type CommerceQuery } from './commerce-service';
import {voucherCommerceGuard} from './voucher-service.ts';
import {processVoucherOrder} from './voucher-store.ts';
function commerce() {
 const sql=getDatabaseClient();
 const query:CommerceQuery['query']=async(text,params=[])=>await sql.unsafe(text,params as never[]) as unknown as Record<string,unknown>[];
 const db:CommerceDatabase={query,transaction:fn=>sql.begin(async tx=>fn({query:async(text,params=[])=>await tx.unsafe(text,params as never[]) as unknown as Record<string,unknown>[]})) as Promise<Awaited<ReturnType<typeof fn>>>};
 return new CommerceService(db,voucherCommerceGuard);
}
export const getOrder=(id:number)=>commerce().get(id);
export const listOrders=(options:{page?:number;leadId?:number}={})=>commerce().list(options);
export const createOrder=(input:Parameters<CommerceService['create']>[0],actor:string)=>commerce().create(input,actor);
export const commandOrder=async(id:number,input:Parameters<CommerceService['command']>[1],actor:string)=>{
 const order=await commerce().command(id,input,actor);
 // Receipt has committed. A failed delivery cannot roll back or misreport the receipt.
 if(input.action==='receipt'&&order?.paymentStatus==='paid'){try{await processVoucherOrder(id);}catch{/* Pending delivery is recoverable by the worker; payment remains committed. */}}
 return order;
};
export const getCommerceSummary=()=>commerce().summary();
export const getLeadOrders=(leadId:number)=>commerce().leadOrders(leadId);
export const getCommerceLead=(leadId:number)=>commerce().lead(leadId);
export type { CommerceOrder, OrderCommand } from './commerce-service';
