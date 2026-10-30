import { oldProductPath } from '@/lib/product-links';
import { NextRequest, NextResponse } from 'next/server';
import { getReferralService } from '@/lib/referral-store';
import { REFERRAL_COOKIE, REFERRAL_MAX_AGE, referralDestination } from '@/lib/referral-service';
export const runtime = 'nodejs';
const campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'] as const;
function trackedDestination(request: NextRequest) {
 const product=request.nextUrl.searchParams.get('product');
 const path=product && /^[a-zA-Z0-9-]{1,100}$/.test(product)
  ? oldProductPath(product,request.nextUrl.searchParams.get('kind')??undefined)
  : referralDestination(request.nextUrl.searchParams.get('to'));
 const target=new URL(path,request.nextUrl.origin);
 if(target.origin!==request.nextUrl.origin)return '/tes-stifin';
 for(const key of campaignKeys){
  const value=(request.nextUrl.searchParams.get(key)||'').replace(/[<>{}"'`]/g,'').trim().slice(0,120);
  if(value)target.searchParams.set(key,value);
 }
 return `${target.pathname}${target.search}${target.hash}`;
}
export async function GET(request: NextRequest, {params}: {params: Promise<{alias:string}>}) {
 const response=new NextResponse(null,{status:302,headers:{Location:trackedDestination(request)}});
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','same-origin');
 try {
  const result=await getReferralService().visit((await params).alias,request.cookies.get(REFERRAL_COOKIE)?.value);
  if(!result.valid)return new NextResponse('<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tautan referral tidak aktif</title><main style="font:16px/1.7 system-ui;max-width:560px;margin:15vh auto;padding:24px"><h1>Tautan referral tidak aktif</h1><p>Minta pengirim memeriksa tautannya melalui akun mitra. Kunjungan ini belum dicatat sebagai referral.</p><a href="/belajar?tab=catalog">Lihat katalog KonsepSTIFIn</a></main></html>',{status:404,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
  if(result.token)response.cookies.set(REFERRAL_COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:REFERRAL_MAX_AGE});
 } catch { return new Response('Tautan sementara tidak tersedia. Silakan coba kembali.',{status:503,headers:{'Cache-Control':'no-store'}}); }
 return response;
}
