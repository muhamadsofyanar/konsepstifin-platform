import { NextRequest } from 'next/server';
import { findPromoterMatch, getPublicPromoters } from '@/lib/promoter-store';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const location = { provinceCode: params.get('provinceCode') || '', provinceName: params.get('provinceName') || '', regencyCode: params.get('regencyCode') || '', regencyName: params.get('regencyName') || '' };
    let data; let matchMethod = 'none';
    if (location.provinceCode && location.provinceName && location.regencyCode && location.regencyName) {
      const match = await findPromoterMatch(location); data = match.candidates; matchMethod = match.method;
    } else data = (await getPublicPromoters()).slice(0, 10_000);
    return Response.json({ data, count: data.length, matchMethod }, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400', 'Access-Control-Allow-Origin': '*' } });
  } catch {
    return Response.json({ error: 'Data promotor tidak tersedia.' }, { status: 502 });
  }
}
