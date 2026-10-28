import { getDatabaseClient } from '@/lib/article-store';
import { OperationsService, type OperationQuery, type OperationTransaction } from './operations-service';
export function getOperationsService(){
 const sql=getDatabaseClient();
 const query:OperationQuery=async(text,args=[])=>[...await sql.unsafe(text,args)];
 const transaction:OperationTransaction=async(work)=>await sql.begin(async(tx)=>work(async(text,args=[])=>[...await tx.unsafe(text,args)])) as Awaited<ReturnType<typeof work>>;
 return new OperationsService(query,transaction);
}
