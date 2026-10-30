import { getAccountPrincipal, getScopedLeadStore } from '@/lib/identity/server';
export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{id: string}> }) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const principal = await getAccountPrincipal();
    if (!principal) return Response.json({ message: 'Silakan masuk.' }, { status: 401, headers });
    const {id} = await context.params;
    const lead = /^\d+$/.test(id) ? await getScopedLeadStore().detail(principal, Number(id)) : null;
    if (!lead) return Response.json({ message: 'Data tidak ditemukan.' }, { status: 404, headers });
    return Response.json(lead, { headers });
  } catch { return Response.json({ message: 'Layanan sementara tidak tersedia.' }, { status: 503, headers }); }
}
