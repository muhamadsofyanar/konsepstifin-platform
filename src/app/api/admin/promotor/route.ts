import { isAdminAuthenticated } from '@/lib/admin-auth';
import { setPromoterRegionMapping } from '@/lib/promoter-store';

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const body = await request.json() as { code?: unknown; regionCodes?: unknown };
    const regionCodes = Array.isArray(body.regionCodes) ? body.regionCodes.map(String) : [];
    return Response.json({ mapping: await setPromoterRegionMapping(String(body.code ?? ''), regionCodes) });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Pemetaan gagal disimpan.' }, { status: 400 });
  }
}
