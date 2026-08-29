import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDatabaseClient } from './article-store';
import { getServiceCoverageOverride, setServiceCoverageOverride } from './service-coverage-store';

const describeWithDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase('service-coverage-store', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  });

  afterAll(async () => {
    await getDatabaseClient()`DELETE FROM public_serviceable_regions WHERE region_code = '32.04'`;
  });

  it('rejects serviceable coverage without evidence', async () => {
    await expect(setServiceCoverageOverride({
      regionCode: '32.04',
      serviceable: true,
      evidenceNote: '',
    })).rejects.toThrow('Bukti layanan harus berisi 10-500 karakter.');
  });

  it('stores and reads an evidence-backed override', async () => {
    const saved = await setServiceCoverageOverride({
      regionCode: '32.04',
      serviceable: true,
      evidenceNote: 'Jadwal layanan telah dikonfirmasi oleh tim operasional.',
    });

    expect(saved).toMatchObject({
      regionCode: '32.04',
      serviceable: true,
      evidenceNote: 'Jadwal layanan telah dikonfirmasi oleh tim operasional.',
    });
    expect(saved.updatedAt).toEqual(expect.any(String));
    await expect(getServiceCoverageOverride('32.04')).resolves.toEqual(saved);
  });
});
