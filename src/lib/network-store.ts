import 'server-only';
import {getDatabaseClient} from '@/lib/article-store';
import {initializeInterestSchema} from '@/lib/interest-store';
import {NetworkService} from './network-service';
import type {NetworkQuery,NetworkTransaction} from './network-service';
export function getNetworkService(){
 if(!process.env.PLATFORM_ORIGIN)throw new Error('Identity is not configured');
 const sql=getDatabaseClient();
 const query:NetworkQuery=async(text,args=[])=>[...await sql.unsafe(text,args)];
 const transaction:NetworkTransaction=async(work)=>await sql.begin(async tx=>work(async(text,args=[])=>[...await tx.unsafe(text,args)])) as Awaited<ReturnType<typeof work>>;
 return new NetworkService(query,transaction,process.env.PLATFORM_ORIGIN);
}
export const getNetworkOverview=()=>getNetworkService().getNetworkOverview();
export async function getPromoterPortal(userId:string){
 await initializeInterestSchema();
 return getNetworkService().getPromoterPortal(userId);
}
export const issuePromoterInvite=(userId:string,actorId:string)=>getNetworkService().issuePromoterInvite(userId,actorId);
export const activatePromoter=(token:string,password:string)=>getNetworkService().activatePromoter(token,password);
