import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { submitInterest } from '@/lib/interest-service';

vi.mock('@/lib/interest-service', () => ({ submitInterest: vi.fn() }));

let address = 0;
function request(body: Record<string, unknown>, ip = `198.51.100.${++address}`) {
  return new NextRequest('http://localhost/api/interests', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ ...body, startedAt: Date.now() - 2_000 }),
  });
}

describe('POST /api/interests', () => {
  beforeEach(() => vi.mocked(submitInterest).mockReset());

  it('mengembalikan referensi, match aman, dan checkout resmi untuk lead tes', async () => {
    vi.mocked(submitInterest).mockResolvedValue({
      lead: { id: 42, leadType: 'test_service', status: 'ditawarkan' },
      reference: 'KSF-42',
      status: 'ditawarkan',
      match: { method: 'area', promoter: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' } },
      checkoutUrl: 'https://app.konsepstifin.com/product/tes/',
    } as Awaited<ReturnType<typeof submitInterest>>);
    const response = await POST(request({ leadType: 'test_service' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      reference: 'KSF-42',
      status: 'ditawarkan',
      match: { method: 'area', promoter: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' } },
      checkoutUrl: 'https://app.konsepstifin.com/product/tes/',
    });
    expect(JSON.stringify(body)).not.toMatch(/phone|email|pass|saldo/i);
  });

  it('tidak pernah mengembalikan match atau checkout untuk calon promotor', async () => {
    vi.mocked(submitInterest).mockResolvedValue({
      lead: { id: 43, leadType: 'promoter_candidate', status: 'baru' },
      reference: 'KSF-43',
      status: 'baru',
      match: null,
      checkoutUrl: 'https://evil.example/checkout',
    } as Awaited<ReturnType<typeof submitInterest>>);
    const response = await POST(request({ leadType: 'promoter_candidate' }));
    expect(await response.json()).toEqual({ ok: true, reference: 'KSF-43', status: 'baru', match: null });
  });

  it('menolak bot cepat dan membatasi delapan permintaan per alamat', async () => {
    const fast = await POST(new NextRequest('http://localhost/api/interests', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.1' },
      body: JSON.stringify({ startedAt: Date.now() }),
    }));
    expect(fast.status).toBe(400);

    vi.mocked(submitInterest).mockResolvedValue({
      lead: { id: 1, leadType: 'promoter_candidate', status: 'baru' }, reference: 'KSF-1', status: 'baru', match: null, checkoutUrl: '',
    } as Awaited<ReturnType<typeof submitInterest>>);
    const responses = [];
    for (let index = 0; index < 9; index += 1) responses.push(await POST(request({}, '203.0.113.2')));
    expect(responses.slice(0, 8).every((response) => response.status === 201)).toBe(true);
    expect(responses[8].status).toBe(429);
  });
});
