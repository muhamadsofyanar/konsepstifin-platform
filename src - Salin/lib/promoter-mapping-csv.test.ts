import { describe, expect, it } from 'vitest';
import {
  csvCell,
  parsePromoterMappingCsv,
  renderPromoterMappingCsv,
} from './promoter-mapping-csv';

describe('promoter-mapping-csv', () => {
  it('parses valid rows with multiple region codes', () => {
    expect(parsePromoterMappingCsv(
      'promoter_code,region_codes\nP-1,"32.04;32.73"',
    )).toEqual({
      accepted: [{ promoterCode: 'P-1', regionCodes: ['32.04', '32.73'] }],
      rejected: [],
    });
  });

  it('rejects unknown promoter codes when a catalog is supplied', () => {
    const result = parsePromoterMappingCsv(
      'promoter_code,region_codes\nUNKNOWN,32.04',
      new Set(['P-1']),
    );
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]).toMatchObject({ row: 2, reason: 'Kode promotor tidak ditemukan.' });
  });

  it('rejects invalid regions and duplicate promoter rows', () => {
    const result = parsePromoterMappingCsv(
      'promoter_code,region_codes\nP-1,32.XX\nP-2,32.04\nP-2,32.73',
    );
    expect(result.accepted).toEqual([{ promoterCode: 'P-2', regionCodes: ['32.04'] }]);
    expect(result.rejected).toEqual([
      { row: 2, reason: 'Kode wilayah tidak valid.' },
      { row: 4, reason: 'Kode promotor duplikat.' },
    ]);
  });

  it('rejects oversized input', () => {
    const result = parsePromoterMappingCsv(`promoter_code,region_codes\n${'P'.repeat(2_100_000)}`);
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]).toMatchObject({ row: 0, reason: 'Berkas CSV melebihi 2 MB.' });
  });

  it('neutralizes spreadsheet formulas and renders deterministic CSV', () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe("'=HYPERLINK(\"bad\")");
    expect(renderPromoterMappingCsv([
      { promoterCode: '@BAD', regionCodes: ['32.73'] },
      { promoterCode: 'P-1', regionCodes: ['32.04', '32.73'] },
    ])).toBe([
      'promoter_code,region_codes',
      "'@BAD,32.73",
      'P-1,32.04;32.73',
    ].join('\n'));
  });
});
