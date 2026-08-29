import { NextRequest } from 'next/server';
import { getWilayah, type WilayahLevel } from '@/lib/wilayah';

const levels = new Set<WilayahLevel>(['provinces', 'regencies', 'districts', 'villages']);
export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  if (!levels.has(level as WilayahLevel)) return Response.json({ error: 'Level wilayah tidak valid.' }, { status: 400 });
  const parent = request.nextUrl.searchParams.get('parent')
    || request.nextUrl.searchParams.get('parentCode')
    || undefined;
  if (level !== 'provinces' && !parent) return Response.json({ error: 'Parameter parent wajib.' }, { status: 400 });
  try {
    const data = await getWilayah(level as WilayahLevel, parent);
    return Response.json({ level, parent: parent ?? null, data }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Data wilayah tidak tersedia.' }, { status: 502 });
  }
}
