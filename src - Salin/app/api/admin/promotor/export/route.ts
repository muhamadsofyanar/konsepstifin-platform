import { isAdminAuthenticated } from '@/lib/admin-auth';
import { renderPromoterMappingCsv } from '@/lib/promoter-mapping-csv';
import { getPublicPromoters } from '@/lib/promoter-store';

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  }

  try {
    const promoters = await getPublicPromoters();
    const csv = renderPromoterMappingCsv(promoters.map((promoter) => ({
      promoterCode: promoter.code,
      regionCodes: promoter.regionCodes,
    })));
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="promoter-region-mappings.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return Response.json({
      message: error instanceof Error ? error.message : 'Ekspor pemetaan gagal.',
    }, { status: 500 });
  }
}
