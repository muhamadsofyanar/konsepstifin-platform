import 'server-only';
import { getDatabaseClient } from '@/lib/article-store';
import { ReferralService } from './referral-service';
import type { NetworkQuery, NetworkTransaction } from './network-service';
export function getReferralService() {
 if(!process.env.PLATFORM_ORIGIN)throw new Error('Identity is not configured');
 const sql=getDatabaseClient();
 const query:NetworkQuery=async(text,args=[])=>[...await sql.unsafe(text,args)];
 const transaction:NetworkTransaction=async work=>await sql.begin(async tx=>work(async(text,args=[])=>[...await tx.unsafe(text,args)])) as Awaited<ReturnType<typeof work>>;
 return new ReferralService(query,transaction,new URL(process.env.PLATFORM_ORIGIN).origin);
}
