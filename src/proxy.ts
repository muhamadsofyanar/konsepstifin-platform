import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const headers:Record<string,string> = { 'Cache-Control': 'no-store', 'Referrer-Policy':'no-referrer' };
  if(request.nextUrl.pathname==='/akun/aktivasi')headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self' data:; frame-src 'none'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'";
  if (request.nextUrl.pathname.startsWith('/api/') && !['GET','HEAD','OPTIONS'].includes(request.method)) {
    const origin=process.env.PLATFORM_ORIGIN;
    let valid=false;
    try { valid=Boolean(origin && new URL(origin).origin===origin && request.headers.get('origin')===origin); } catch {}
    if(!valid) return NextResponse.json({message:'Permintaan ditolak. Muat ulang halaman dari alamat resmi.'},{status:403,headers});
  }
  const response=NextResponse.next();for(const [key,value] of Object.entries(headers))response.headers.set(key,value);return response;
}
export const config = { matcher: ['/admin/:path*','/akun/:path*','/api/admin/:path*','/api/account/:path*'] };
