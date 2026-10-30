import { getAdminPrincipal } from '@/lib/admin-auth';
import { isSameOriginMutation } from '@/lib/admin-request';
import { CommerceError } from './commerce-domain';
export const commerceJson=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function commerceGuard(request:Request,write=false){
 const principal=await getAdminPrincipal();
 if(!principal||!principal.roles.some(role=>role==='admin'||role==='super_admin'))return {response:commerceJson({message:'Sesi admin tidak valid.'},401)};
 if(write&&!isSameOriginMutation(request))return {response:commerceJson({message:'Origin permintaan tidak valid.'},403)};
 return {principal};
}
export function commerceFailure(error:unknown){if(error instanceof CommerceError)return commerceJson({message:error.message},400);if(error instanceof SyntaxError)return commerceJson({message:'Data permintaan tidak valid.'},400);console.error('Commerce operation failed',error instanceof Error?error.name:'unknown');return commerceJson({message:'Data pesanan gagal disimpan atau dibaca. Periksa database dan migrasi; coba kembali dengan kunci permintaan yang sama.'},503);}
