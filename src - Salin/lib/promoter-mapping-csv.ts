import { normalizeRegionCodes } from './promoter-domain';

export type MappingImportResult = {
  accepted: Array<{ promoterCode: string; regionCodes: string[] }>;
  rejected: Array<{ row: number; reason: string }>;
};

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 10_000;
const MAX_REGION_CODES = 200;
const PROMOTER_CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,79}$/;

function parseRows(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && !cell) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error('Tanda kutip CSV tidak ditutup.');
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

export function parsePromoterMappingCsv(
  input: string,
  knownPromoterCodes?: ReadonlySet<string>,
): MappingImportResult {
  if (new TextEncoder().encode(input).byteLength > MAX_BYTES) {
    return { accepted: [], rejected: [{ row: 0, reason: 'Berkas CSV melebihi 2 MB.' }] };
  }

  let rows: string[][];
  try {
    rows = parseRows(input.replace(/^\uFEFF/, ''));
  } catch (error) {
    return {
      accepted: [],
      rejected: [{ row: 0, reason: error instanceof Error ? error.message : 'CSV tidak valid.' }],
    };
  }
  const header = rows[0]?.map((cell) => cell.trim().toLowerCase());
  if (!header || header.length !== 2 || header[0] !== 'promoter_code' || header[1] !== 'region_codes') {
    return {
      accepted: [],
      rejected: [{ row: 1, reason: 'Header harus promoter_code,region_codes.' }],
    };
  }
  if (rows.length - 1 > MAX_ROWS) {
    return {
      accepted: [],
      rejected: [{ row: 0, reason: 'CSV melebihi 10.000 baris data.' }],
    };
  }

  const accepted: MappingImportResult['accepted'] = [];
  const rejected: MappingImportResult['rejected'] = [];
  const seen = new Set<string>();
  const known = knownPromoterCodes
    ? new Set([...knownPromoterCodes].map((code) => code.trim().toUpperCase()))
    : null;

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    if (cells.length === 1 && !cells[0].trim()) return;
    if (cells.length !== 2) {
      rejected.push({ row: rowNumber, reason: 'Baris CSV harus memiliki dua kolom.' });
      return;
    }
    const promoterCode = cells[0].trim().toUpperCase();
    if (!PROMOTER_CODE_PATTERN.test(promoterCode)) {
      rejected.push({ row: rowNumber, reason: 'Kode promotor tidak valid.' });
      return;
    }
    if (seen.has(promoterCode)) {
      rejected.push({ row: rowNumber, reason: 'Kode promotor duplikat.' });
      return;
    }
    seen.add(promoterCode);
    if (known && !known.has(promoterCode)) {
      rejected.push({ row: rowNumber, reason: 'Kode promotor tidak ditemukan.' });
      return;
    }

    const rawRegionCodes = cells[1].split(';').map((code) => code.trim()).filter(Boolean);
    const regionCodes = normalizeRegionCodes(rawRegionCodes);
    if (rawRegionCodes.length > MAX_REGION_CODES) {
      rejected.push({ row: rowNumber, reason: 'Maksimal 200 kode wilayah per promotor.' });
      return;
    }
    if (regionCodes.length !== new Set(rawRegionCodes).size) {
      rejected.push({ row: rowNumber, reason: 'Kode wilayah tidak valid.' });
      return;
    }
    accepted.push({ promoterCode, regionCodes });
  });

  return { accepted, rejected };
}

export function csvCell(value: string) {
  return /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function quoteCsvCell(value: string) {
  const safe = csvCell(value);
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function renderPromoterMappingCsv(
  rows: Array<{ promoterCode: string; regionCodes: string[] }>,
) {
  const rendered = [...rows]
    .sort((left, right) => left.promoterCode.localeCompare(right.promoterCode, 'id-ID'))
    .map((row) => [
      quoteCsvCell(row.promoterCode),
      quoteCsvCell(normalizeRegionCodes(row.regionCodes).join(';')),
    ].join(','));
  return ['promoter_code,region_codes', ...rendered].join('\n');
}
