import 'server-only';
import { getDatabaseClient } from './article-store';
import { DashboardChatService, type ChatDatabase } from './dashboard-chat-service';
export function getDashboardChatService(){
 const sql=getDatabaseClient();
 const db:ChatDatabase={
  query:async(t,p=[])=>[...await sql.unsafe(t,p as never[])],
  transaction:fn=>sql.begin(tx=>fn({query:async(t,p=[])=>[...await tx.unsafe(t,p as never[])],transaction:async()=>{throw new Error('Nested chat transactions are not supported');}})) as Promise<Awaited<ReturnType<typeof fn>>>,
 };
 return new DashboardChatService(db);
}
