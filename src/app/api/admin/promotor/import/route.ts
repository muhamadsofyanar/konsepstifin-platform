import { isAdminAuthenticated } from '@/lib/admin-auth';
import { parsePromoterMappingCsv } from '@/lib/promoter-mapping-csv';
import { getPublicPromoters, setPromoterRegionMappings } from '@/lib/promoter-store';
import { wilayahCodeExists } from '@/lib/wilayah';

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().includes('text/csv')) {
    return Response.json({ message: 'Gunakan berkas text/csv.' }, { status: 415 });
  }

  try {
    const promoters = await getPublicPromoters();
    const knownPromoterCodes = new Set(promoters.map((promoter) => promoter.code));
    const parsed = parsePromoterMappingCsv(await request.text(), knownPromoterCodes);
    const validity = new Map<string, boolean>();
    const uniqueRegionCodes = [...new Set(parsed.accepted.flatMap((row) => row.regionCodes))];
    for (const regionCode of uniqueRegionCodes) {
      validity.set(regionCode, await wilayahCodeExists(regionCode));
    }

    const accepted = [] as typeof parsed.accepted;
    const rejected = [...parsed.rejected];
    parsed.accepted.forEach((row, index) => {
      const invalidCode = row.regionCodes.find((regionCode) => !validity.get(regionCode));
      if (invalidCode) {
        rejected.push({ row: index + 2, reason: `Kode wilayah ${invalidCode} tidak ditemukan.` });
      } else {
        accepted.push(row);
      }
    });
    if (accepted.length) await setPromoterRegionMappings(accepted);

    return Response.json({ accepted, rejected });
  } catch (error) {
    return Response.json({
      message: error instanceof Error ? error.message : 'Impor pemetaan gagal.',
    }, { status: 400 });
  }
}
