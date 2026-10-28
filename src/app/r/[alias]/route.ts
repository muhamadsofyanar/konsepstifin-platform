import { NextRequest, NextResponse } from 'next/server';
import { getReferralService } from '@/lib/referral-store';
import { REFERRAL_COOKIE, REFERRAL_MAX_AGE, referralDestination } from '@/lib/referral-service';
export const runtime = 'nodejs';
export async function GET(request: NextRequest, {params}: {params: Promise<{alias:string}>}) {
 const response=NextResponse.redirect(new URL(referralDestination(request.nextUrl.searchParams.get('to')),request.url),302);
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','same-origin');
 try {
  const result=await getReferralService().visit((await params).alias,request.cookies.get(REFERRAL_COOKIE)?.value);
  if(result.token)response.cookies.set(REFERRAL_COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:REFERRAL_MAX_AGE});
 } catch { return new Response('Tautan sementara tidak tersedia. Silakan coba kembali.',{status:503,headers:{'Cache-Control':'no-store'}}); }
 return response;
}
