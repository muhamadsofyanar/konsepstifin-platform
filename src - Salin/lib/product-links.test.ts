import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './product-links';

describe('safeReturnPath', () => {
  it('preserves the new promoter growth tab after login', () => {
    expect(safeReturnPath('/akun/mitra?tab=growth')).toBe('/akun/mitra?tab=growth');
  });
  it('continues to reject external and unsupported destinations', () => {
    expect(safeReturnPath('https://evil.test')).toBe('/akun');
    expect(safeReturnPath('/admin')).toBe('/akun');
  });
});
