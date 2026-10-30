import { getAccountPrincipal } from '@/lib/identity/server';
import { getReferralService } from '@/lib/referral-store';
export const runtime='nodejs';
const json=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function account() {
 const p=await getAccountPrincipal();
 return p?.active&&p.sessionValid&&p.roles.some(r=>['promoter','affiliate'].includes(r))?p:null;
}
export async function GET() {
 try {const p=await account();if(!p)return json({message:'Akses promotor diperlukan.'},401);return json(await getReferralService().getPortal(p.userId));}
 catch{return json({message:'Tautan sementara tidak tersedia.'},503);}
}
export async function PATCH(request:Request) {
 if(!process.env.PLATFORM_ORIGIN||request.headers.get('origin')!==new URL(process.env.PLATFORM_ORIGIN).origin)return json({message:'Permintaan ditolak.'},403);
 try {
  const p=await account();if(!p)return json({message:'Akses promotor diperlukan.'},401);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({message:'Data tidak valid.'},400);
  let body;
  try {
   const reader=request.body?.getReader();if(!reader)return json({message:'Data tidak valid.'},400);
   const chunks:Uint8Array[]=[];let size=0;
   try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return json({message:'Data terlalu besar.'},400);}chunks.push(value);}}finally{reader.releaseLock();}
   body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }catch{return json({message:'Data tidak valid.'},400);}
  if(!body||Array.isArray(body)||Object.keys(body).some(k=>k!=='alias'))return json({message:'Data tidak valid.'},400);
  return json(await getReferralService().saveAlias(p.userId,body.alias));
 }catch(error){const message=error instanceof Error?error.message:'';return /Alias|Keanggotaan/.test(message)?json({message},400):json({message:'Tautan belum dapat disimpan.'},503);}
}
