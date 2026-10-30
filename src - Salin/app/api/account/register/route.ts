import { getIdentityStore } from '@/lib/identity/server';
import { hashPassword } from '@/lib/identity/password';
import { isSameOriginMutation } from '@/lib/admin-request';
import { learningJson } from '@/lib/learning-http';
import { checkRateLimit } from '@/lib/rate-limit';
import { cookies } from 'next/headers';
import { REFERRAL_COOKIE } from '@/lib/referral-service';
export async function POST(request: Request) {
 if(!isSameOriginMutation(request))return learningJson({message:'Permintaan ditolak.'},403);
 if(!checkRateLimit(request,'member-register',5,3600000).allowed)return learningJson({message:'Terlalu banyak percobaan. Coba lagi nanti.'},429);
 try {
  const raw=await request.text();if(raw.length>4096)return learningJson({message:'Data pendaftaran terlalu besar.'},413);
  const d=JSON.parse(raw);
  if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.email!=='string'||typeof d.password!=='string'||d.password.length<12||d.password.length>1024)return learningJson({message:'Gunakan email valid dan kata sandi minimal 12 karakter.'},400);
  const email=d.email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return learningJson({message:'Gunakan alamat email yang valid.'},400);
  const store=getIdentityStore();if(!await store.consumeLoginAttempt('register:'+email))return learningJson({message:'Coba kembali nanti.'},429);
  const referralToken=(await cookies()).get(REFERRAL_COOKIE)?.value??null;
  await store.createAccount(email,await hashPassword(d.password),['member'],null,referralToken);
  return learningJson({message:'Akun peserta dibuat. Silakan masuk.'});
 }catch(error){
  if(error instanceof SyntaxError)return learningJson({message:'Data pendaftaran tidak valid.'},400);
  if(error&&typeof error==='object'&&'code' in error&&error.code==='23505')return learningJson({message:'Pendaftaran belum berhasil. Jika email sudah terdaftar, gunakan halaman masuk.'},400);
  return learningJson({message:'Pendaftaran belum tersedia. Coba kembali nanti.'},503);
 }
}
