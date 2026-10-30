import { isAdminAuthenticated } from '@/lib/admin-auth';
import { setServiceCoverageOverride } from '@/lib/service-coverage-store';

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      regionCode?: unknown;
      serviceable?: unknown;
      evidenceNote?: unknown;
    };
    if (typeof body.serviceable !== 'boolean') {
      return Response.json({ message: 'Status serviceable harus boolean.' }, { status: 400 });
    }
    const coverage = await setServiceCoverageOverride({
      regionCode: String(body.regionCode ?? ''),
      serviceable: body.serviceable,
      evidenceNote: String(body.evidenceNote ?? ''),
    });
    return Response.json({ coverage });
  } catch (error) {
    return Response.json({
      message: error instanceof Error ? error.message : 'Cakupan layanan gagal disimpan.',
    }, { status: 400 });
  }
}
