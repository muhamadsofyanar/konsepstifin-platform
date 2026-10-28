import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { recordCta } from '@/lib/engagement-store';
vi.mock('@/lib/article-store', () => ({ databaseConfigured: () => true }));
vi.mock('@/lib/engagement-store', () => ({ recordCta: vi.fn(), createComment: vi.fn(), getPublicEngagement: vi.fn(), recordShare: vi.fn(), recordView: vi.fn(), toggleLike: vi.fn() }));
vi.mock('@/lib/openai-content', () => ({ moderateComment: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }) }));
function request(channel: string) {
  return new NextRequest('https://konsepstifin.com/api/articles/contoh/engagement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cta', channel }) });
}
describe('article CTA engagement', () => {
  it('accepts and records the internal service channel', async () => {
    const response = await POST(request('internal_service'), { params: Promise.resolve({ slug: 'contoh' }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(recordCta).toHaveBeenCalledWith('contoh', expect.any(String), 'internal_service');
  });
  it('rejects the retired external checkout channel', async () => {
    const response = await POST(request('sejoli'), { params: Promise.resolve({ slug: 'contoh' }) });
    expect(response.status).toBe(400);
    expect(recordCta).not.toHaveBeenCalled();
  });
});
