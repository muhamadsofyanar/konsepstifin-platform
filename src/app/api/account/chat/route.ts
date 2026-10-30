import { isSameOriginMutation } from '@/lib/admin-request';
import { getDashboardChatService } from '@/lib/dashboard-chat-store';
import { chatBody,chatFailure,chatJson,chatPrincipal } from '@/lib/dashboard-chat-http';
import { ChatError } from '@/lib/dashboard-chat-service';
import { checkRateLimit } from '@/lib/rate-limit';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const p=await chatPrincipal(),s=getDashboardChatService(),u=new URL(request.url);
 if(u.searchParams.get('view')==='accounts')return chatJson({accounts:await s.accounts(p,u.searchParams.get('q')||'')});
 if(u.searchParams.get('view')==='summary')return chatJson(await s.summary(p));
 return chatJson({messages:await s.messages(p,u.searchParams.get('memberId')||p.userId,{after:u.searchParams.get('after')??undefined,before:u.searchParams.get('before')??undefined})});
}catch(e){return chatFailure(e);}}
export async function POST(request:Request){
 if(!isSameOriginMutation(request))return chatJson({message:'Origin permintaan tidak valid.'},403);
 try{
  const p=await chatPrincipal();
  if(!checkRateLimit(request,'dashboard-chat:'+p.userId,60,60000).allowed)return chatJson({message:'Terlalu banyak permintaan. Tunggu sebentar.'},429);
  const d=await chatBody(request),s=getDashboardChatService();
  const target=d.memberId===undefined?p.userId:String(d.memberId);
  if(d.action==='send'){
   if(typeof d.body!=='string'||typeof d.clientKey!=='string')throw new ChatError('Data pesan tidak valid.');
   return chatJson({message:await s.send(p,target,d.body,d.clientKey)},201);
  }
  if(d.action==='read'&&typeof d.lastId==='string')return chatJson(await s.markRead(p,target,d.lastId));
  throw new ChatError('Tindakan tidak dikenal.');
 }catch(e){return chatFailure(e);}
}
