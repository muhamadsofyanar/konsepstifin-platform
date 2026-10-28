import {getAdminPrincipal} from '@/lib/admin-auth';
import {requireAdminRequest} from '@/lib/admin-request';
import {readAdminJson} from '@/lib/admin-json';
import {getOperationsService} from '@/lib/operations-store';
import {hashPassword} from '@/lib/identity/password';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const message=(error:unknown)=>error instanceof Error && !('code' in error)?error.message:'Perubahan akun gagal. Periksa email dan database.';
export async function GET(){if(!await getAdminPrincipal())return reply({message:'Silakan masuk.'},401);try{return reply({accounts:await getOperationsService().accounts()});}catch{return reply({message:'Daftar akun belum tersedia.'},503);}}
export async function POST(request:Request){const actor=await requireAdminRequest(request);if(!actor)return reply({message:'Akses ditolak.'},403);
 try{const data=await readAdminJson(request);if(Object.keys(data).some(k=>!['email','password'].includes(k))||typeof data.email!=='string'||typeof data.password!=='string')throw new Error('Email dan kata sandi diperlukan.');
  const id=await getOperationsService().createAdmin(actor.userId,data.email,await hashPassword(data.password));return reply({id},201);
 }catch(error){return reply({message:message(error)},400);}}
export async function PATCH(request:Request){const actor=await requireAdminRequest(request);if(!actor)return reply({message:'Akses ditolak.'},403);
 try{const data=await readAdminJson(request);if(Object.keys(data).some(k=>!['id','active','password'].includes(k))||typeof data.id!=='string'||!/^[0-9a-f-]{36}$/.test(data.id)||(data.active!==undefined&&typeof data.active!=='boolean')||(data.password!==undefined&&typeof data.password!=='string'))throw new Error('Perubahan akun tidak valid.');
  await getOperationsService().updateAccount(actor.userId,data.id,{...(data.active!==undefined?{active:data.active as boolean}:{}),...(data.password!==undefined?{passwordHash:await hashPassword(data.password as string)}:{})});return reply({ok:true,signOut:data.id===actor.userId&&(data.active===false||data.password!==undefined)});
 }catch(error){return reply({message:message(error)},400);}}
