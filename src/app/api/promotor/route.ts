import { NextRequest } from 'next/server';
import { getPublicPromoters } from '@/lib/promoter-store';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function GET(request: NextRequest) {
  try {
    const region = request.nextUrl.searchParams.get('region') || undefined;
    const data = await getPublicPromoters(region);
    return Response.json({ data, count: data.length }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800', 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Data promotor tidak tersedia.' }, { status: 502 });
  }
}
