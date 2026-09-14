import { getAccountPrincipal, getScopedLeadStore } from '@/lib/identity/server';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const principal = await getAccountPrincipal();
    if (!principal) return Response.json({ message: 'Silakan masuk.' }, { status: 401, headers });
    const params = new URL(request.url).searchParams;
    const page = Number(params.get('page') ?? 1), size = Number(params.get('pageSize') ?? 25), q = params.get('q') ?? '';
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isInteger(size) || size < 1 || size > 100 || q.length > 200)
      return Response.json({ message: 'Parameter tidak valid.' }, { status: 400, headers });
    return Response.json(await getScopedLeadStore().list(principal, page, size, q), { headers });
  } catch { return Response.json({ message: 'Layanan sementara tidak tersedia.' }, { status: 503, headers }); }
}
