import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/lib/admin-auth', () => ({ getAdminPrincipal: vi.fn() }));
import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest, isSameOriginMutation } from './admin-request';
describe('admin mutation boundary', () => {
  beforeEach(() => { process.env.PLATFORM_ORIGIN='https://konsepstifin.com'; vi.mocked(getAdminPrincipal).mockResolvedValue({userId:'a',email:'a@example.com',roles:['admin']}); });
  it('denies missing, cross site, and malformed configured origin before authentication', async () => {
    for (const origin of ['', 'https://evil.test','https://konsepstifin.com.evil.test']) {
      expect(await requireAdminRequest(new Request('https://konsepstifin.com/api/admin/products/1',{method:'PATCH',headers:origin?{origin}:{}}))).toBeNull();
    }
    expect(getAdminPrincipal).not.toHaveBeenCalled();
    process.env.PLATFORM_ORIGIN='https://konsepstifin.com/path';
    expect(isSameOriginMutation(new Request('https://konsepstifin.com',{method:'POST',headers:{origin:'https://konsepstifin.com'}}))).toBe(false);
  });
  it('requires admin principal for same-origin mutation and fails closed on outages',async()=>{
    const req=new Request('https://konsepstifin.com/api/admin/settings',{method:'POST',headers:{origin:'https://konsepstifin.com'}});
    expect((await requireAdminRequest(req))?.userId).toBe('a');
    vi.mocked(getAdminPrincipal).mockResolvedValue(null); expect(await requireAdminRequest(req)).toBeNull();
    vi.mocked(getAdminPrincipal).mockRejectedValue(new Error('db')); expect(await requireAdminRequest(req)).toBeNull();
  });
});
