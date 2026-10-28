import { getDatabaseClient } from '@/lib/article-store';
import { CommerceService, type CommerceDatabase, type CommerceQuery } from './commerce-service';
function commerce() {
 const sql=getDatabaseClient();
 const query:CommerceQuery['query']=async(text,params=[])=>await sql.unsafe(text,params as never[]) as unknown as Record<string,unknown>[];
 const db:CommerceDatabase={query,transaction:fn=>sql.begin(async tx=>fn({query:async(text,params=[])=>await tx.unsafe(text,params as never[]) as unknown as Record<string,unknown>[]})) as Promise<Awaited<ReturnType<typeof fn>>>};
 return new CommerceService(db);
}
export const getOrder=(id:number)=>commerce().get(id);
export const listOrders=(options:{page?:number;leadId?:number}={})=>commerce().list(options);
export const createOrder=(input:Parameters<CommerceService['create']>[0],actor:string)=>commerce().create(input,actor);
export const commandOrder=(id:number,input:Parameters<CommerceService['command']>[1],actor:string)=>commerce().command(id,input,actor);
export const getCommerceSummary=()=>commerce().summary();
export const getLeadOrders=(leadId:number)=>commerce().leadOrders(leadId);
export const getCommerceLead=(leadId:number)=>commerce().lead(leadId);
export type { CommerceOrder, OrderCommand } from './commerce-service';
