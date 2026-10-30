import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdminEngagement } from '@/lib/engagement-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    return Response.json(await getAdminEngagement(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Statistik interaksi belum dapat dimuat.' }, { status: 503 });
  }
}

