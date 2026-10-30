import { describe, expect, it } from 'vitest';
import { isInternalServiceUrl, productLinks } from '@/app/site-config';
import { validateGenerationRequest } from './openai-content';
const input = { topic: 'Panduan layanan personal', audience: 'Calon peserta', objective: 'Memahami layanan tes personal', contentType: 'product', productName: 'Tes Personal' };
describe('internal service destinations', () => {
  it.each(Object.values(productLinks))('accepts implemented service %s', (url) => {
    expect(isInternalServiceUrl(url)).toBe(true);
    expect(validateGenerationRequest({ ...input, productUrl: url }).productUrl).toBe(url);
  });
  it.each(['https://app.konsepstifin.com/product/tes/', 'https://evil.example/tes-stifin', '//evil.example/tes-stifin', 'javascript:alert(1)', '/admin', 'https://name:pass@konsepstifin.com/tes-stifin', '/api/interests', '/tes-stifin\\evil'])('rejects external or unavailable destination %s', (url) => {
    expect(isInternalServiceUrl(url)).toBe(false);
    expect(() => validateGenerationRequest({ ...input, productUrl: url })).toThrow('halaman layanan internal');
  });
});
