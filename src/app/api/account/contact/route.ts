import { isSameOriginMutation } from '@/lib/admin-request';
import { getDashboardChatService } from '@/lib/dashboard-chat-store';
import { chatBody,chatFailure,chatJson,chatPrincipal } from '@/lib/dashboard-chat-http';
import { checkRateLimit } from '@/lib/rate-limit';
export const dynamic='force-dynamic';
export async function GET(){try{const p=await chatPrincipal();return chatJson({profile:await getDashboardChatService().contact(p)});}catch(e){return chatFailure(e);}}
export async function POST(request:Request){
 if(!isSameOriginMutation(request))return chatJson({message:'Origin permintaan tidak valid.'},403);
 try{const p=await chatPrincipal();if(!checkRateLimit(request,'contact-profile:'+p.userId,15,60000).allowed)return chatJson({message:'Tunggu sebentar sebelum menyimpan lagi.'},429);
 const d=await chatBody(request);return chatJson({profile:await getDashboardChatService().saveContact(p,{displayName:d.displayName,whatsappPhone:d.whatsappPhone})});
 }catch(e){return chatFailure(e);}
}
