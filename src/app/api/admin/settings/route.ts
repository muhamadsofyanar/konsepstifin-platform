import {getAdminPrincipal} from '@/lib/admin-auth';
import {requireAdminRequest} from '@/lib/admin-request';
import {readAdminJson} from '@/lib/admin-json';
import {getOperationsService} from '@/lib/operations-store';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 if(!await getAdminPrincipal())return reply({message:'Silakan masuk.'},401);
 try{return reply({settings:await getOperationsService().settings()});}catch{return reply({message:'Pengaturan belum tersedia. Periksa migrasi dan database.'},503);}
}
export async function PUT(request:Request){
 const actor=await requireAdminRequest(request);if(!actor)return reply({message:'Akses ditolak.'},403);
 try{const value=await readAdminJson(request);if(Object.keys(value).some(key=>!['bankName','accountNumber','accountHolder','instructions'].includes(key)))throw new Error('Isian tidak dikenal.');
  return reply({settings:await getOperationsService().saveSettings(actor.userId,value)});
 }catch(error){return reply({message:error instanceof Error && !('code' in error)?error.message:'Pengaturan belum tersimpan.'},400);}
}
