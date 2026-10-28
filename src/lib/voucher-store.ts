import 'server-only';
import {getDatabaseClient} from '@/lib/article-store';
import {VoucherService} from './voucher-service.ts';
import {StifinVoucherApi} from './voucher-api.ts';
import type {CommerceDatabase,CommerceQuery} from './commerce-service.ts';
export function getVoucherService(){const sql=getDatabaseClient();const query:CommerceQuery['query']=async(text,args=[])=>[...await sql.unsafe(text,args as never[])];const db:CommerceDatabase={query,transaction:fn=>sql.begin(async tx=>fn({query:async(text,args=[])=>[...await tx.unsafe(text,args as never[])]})) as Promise<Awaited<ReturnType<typeof fn>>>};return new VoucherService(db,new StifinVoucherApi());}
export const getVoucherPortal=(userId:string)=>getVoucherService().getVoucherPortal(userId);
export const getVoucherBalance=(userId:string)=>getVoucherService().getVoucherBalance(userId);
export const createVoucherOrder=(userId:string,input:Parameters<VoucherService['createVoucherOrder']>[1])=>getVoucherService().createVoucherOrder(userId,input);
export const getVoucherOrder=(userId:string,id:number)=>getVoucherService().getVoucherOrder(userId,id);
export const getAdminVouchers=()=>getVoucherService().getAdminVouchers();
export const saveVoucherSettings=(actorId:string,input:Parameters<VoucherService['saveVoucherSettings']>[1])=>getVoucherService().saveVoucherSettings(actorId,input);
export const processVoucherOrder=(id:number)=>getVoucherService().processVoucherOrder(id);
export const getVoucherFulfillment=(id:number)=>getVoucherService().getVoucherFulfillment(id);
export const reconcileVoucherOrder=(actorId:string,id:number,input:Parameters<VoucherService['reconcileVoucherOrder']>[2])=>getVoucherService().reconcileVoucherOrder(actorId,id,input);
export type {VoucherOrder,VoucherSettings,VoucherBalance} from './voucher-domain.ts';
