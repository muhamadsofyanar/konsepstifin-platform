import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/admin-auth', () => ({ getAdminPrincipal: vi.fn() }));
vi.mock('@/lib/network-store', () => ({ activatePromoter: vi.fn() }));
import { activatePromoter } from '@/lib/network-store';
import { POST } from './route';
const request = (body: unknown, origin = 'https://konsepstifin.com') => new Request('https://konsepstifin.com/api/account/activate', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { process.env.PLATFORM_ORIGIN = 'https://konsepstifin.com'; });
it('rejects cross-origin activation before touching account storage', async () => {
 expect((await POST(request({ token: 'a'.repeat(64), password: 'password12345' }, 'https://evil.test'))).status).toBe(403);
 expect(activatePromoter).not.toHaveBeenCalled();
});
it('rejects weak passwords and oversized streamed bodies', async () => {
 expect((await POST(request({token: 'a'.repeat(64), password: 'short'}))).status).toBe(400);
 expect((await POST(request({token:'a'.repeat(64),password:'a'.repeat(17000)}))).status).toBe(400);
 expect(activatePromoter).not.toHaveBeenCalled();
});
it('activates using only the provided secret and never echoes it', async () => {
 const token='a'.repeat(64); const response=await POST(request({token,password:'password12345'}));
 expect(response.status).toBe(200);expect(activatePromoter).toHaveBeenCalledWith(token,'password12345');
 expect(await response.text()).not.toContain(token);expect(response.headers.get('cache-control')).toContain('no-store');
});
it('uses a safe error for expired or already-used tokens', async () => {
 vi.mocked(activatePromoter).mockRejectedValueOnce(new Error('SQL private token'));
 const response=await POST(request({token:'a'.repeat(64),password:'password12345'}));
 expect(response.status).toBe(400);expect(await response.text()).not.toContain('SQL');
});
