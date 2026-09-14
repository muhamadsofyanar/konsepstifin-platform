import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/admin-auth', () => ({ isAdminAuthenticated: vi.fn() }));
vi.mock('@/lib/interest-store', async importOriginal => ({ ...await importOriginal<object>(), createInterestLead: vi.fn() }));
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createInterestLead } from '@/lib/interest-store';
import { POST } from './route';
const input = { group: 'client', name: 'Contoh Klien', phone: '081234567890', city: 'Bandung', service: 'Tes Personal', consentToContact: true, consentToShare: true, idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' };
const request = (body: unknown) => new NextRequest('http://localhost/api/admin/leads', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
describe('admin CRM creation', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(isAdminAuthenticated).mockResolvedValue(true); });
  it('rejects unauthenticated writes', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false);
    expect((await POST(request(input))).status).toBe(401);
    expect(createInterestLead).not.toHaveBeenCalled();
  });
  it('requires explicit consent', async () => {
    expect((await POST(request({ ...input, consentToContact: false }))).status).toBe(400);
    expect(createInterestLead).not.toHaveBeenCalled();
  });
  it('creates a completed client with admin attribution', async () => {
    vi.mocked(createInterestLead).mockResolvedValueOnce({ id: 1 } as never);
    expect((await POST(request(input))).status).toBe(201);
    expect(createInterestLead).toHaveBeenCalledWith(expect.objectContaining({ status: 'selesai', actor: expect.any(String), interest: expect.objectContaining({ leadType: 'test_service', phone: '6281234567890', sourcePath: '/admin/leads' }) }));
  });
  it('does not expose database errors', async () => {
    vi.mocked(createInterestLead).mockRejectedValueOnce(new Error('private database credentials'));
    const response = await POST(request(input));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('credentials');
  });
});
