import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' };
  if (request.nextUrl.pathname.startsWith('/api/') && !['GET','HEAD','OPTIONS'].includes(request.method)) {
    const origin=process.env.PLATFORM_ORIGIN;
    let valid=false;
    try { valid=Boolean(origin && new URL(origin).origin===origin && request.headers.get('origin')===origin); } catch {}
    if(!valid) return NextResponse.json({message:'Permintaan ditolak. Muat ulang halaman dari alamat resmi.'},{status:403,headers});
  }
  const response=NextResponse.next();response.headers.set('Cache-Control','no-store');return response;
}
export const config = { matcher: ['/admin/:path*','/api/admin/:path*','/api/account/:path*'] };
