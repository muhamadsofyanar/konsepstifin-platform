import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ principal: vi.fn() }));
vi.mock('./server', () => ({ getAccountPrincipal: mocks.principal }));
import { getAdminPrincipal, isAdminAuthenticated } from '../admin-auth';
beforeEach(() => { mocks.principal.mockReset(); });
describe('database administrator authorization', () => {
  it('returns audit identity only for database administrator roles', async () => {
    mocks.principal.mockResolvedValue({userId:'db-admin',email:'admin@example.com',roles:['admin'],active:true,sessionValid:true});
    expect(await getAdminPrincipal()).toEqual({userId:'db-admin',email:'admin@example.com',roles:['admin']});
    expect(await isAdminAuthenticated()).toBe(true);
  });
  it('denies non-admin accounts and legacy or absent sessions', async () => {
    for (const principal of [null,{userId:'member',email:'member@example.com',roles:['member'],active:true,sessionValid:true}]) {
      mocks.principal.mockResolvedValue(principal);
      expect(await getAdminPrincipal()).toBeNull();
      expect(await isAdminAuthenticated()).toBe(false);
    }
  });
  it('database outage never restores environment credentials', async () => {
    mocks.principal.mockRejectedValue(new Error('offline'));
    expect(await getAdminPrincipal()).toBeNull();
    expect(await isAdminAuthenticated()).toBe(false);
  });
});
