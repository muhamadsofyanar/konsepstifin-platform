import { getAccountPrincipal } from './identity/server';
import { ChatError } from './dashboard-chat-service';
export const chatJson=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'}});
export async function chatPrincipal(){const p=await getAccountPrincipal();if(!p?.active||!p.sessionValid)throw new ChatError('Silakan masuk ke akun Anda.',401);return p;}
export async function chatBody(request:Request){
 const raw=await request.text();if(raw.length>16384)throw new ChatError('Pesan terlalu besar.',413);
 let data;try{data=JSON.parse(raw);}catch{throw new ChatError('JSON tidak valid.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new ChatError('Data tidak valid.');
 return data as Record<string,unknown>;
}
export function chatFailure(error:unknown){
 if(error instanceof ChatError)return chatJson({message:error.message},error.status);
 const code=error&&typeof error==='object'&&'code' in error?String(error.code):'unknown';
 console.error('[dashboard-chat] request failed; code=%s',code);
 return chatJson({message:code==='42P01'||code==='42703'?'Chat belum tersedia. Minta admin menjalankan migrasi 019-dashboard-chat.sql.':'Chat belum dapat diakses. Coba kembali atau hubungi pengelola.'},503);
}
