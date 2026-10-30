import {describe,it,expect,beforeEach} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from './proxy';
describe('private API proxy',()=>{
 beforeEach(()=>{process.env.PLATFORM_ORIGIN='https://konsepstifin.com';});
 it('blocks missing/cross origin cookie mutations but permits configured origin',()=>{
  for(const origin of ['', 'https://evil.test']){
   const result=proxy(new NextRequest('https://konsepstifin.com/api/admin/articles/1',{method:'DELETE',headers:origin?{origin}:{}}));
   expect(result.status).toBe(403);expect(result.headers.get('Cache-Control')).toBe('no-store');
  }
  expect(proxy(new NextRequest('https://konsepstifin.com/api/admin/articles/1',{method:'DELETE',headers:{origin:'https://konsepstifin.com'}})).headers.get('x-middleware-next')).toBe('1');
 });
 it('prevents caching private reads without blocking login pages',()=>{
  expect(proxy(new NextRequest('https://konsepstifin.com/api/admin/products')).headers.get('Cache-Control')).toBe('no-store');
  expect(proxy(new NextRequest('https://konsepstifin.com/admin/login')).headers.get('Cache-Control')).toBe('no-store');
 });
 it('protects activation URLs from referrer and third-party script leakage',()=>{
  const response=proxy(new NextRequest('https://konsepstifin.com/akun/aktivasi'));
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(response.headers.get('Content-Security-Policy')).toContain("connect-src 'self'");
  expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self' 'unsafe-inline'");
 });
});
