import { NextRequest } from 'next/server';
import { getPromoterCatalogStatus, queryPromoters } from '@/lib/promoter-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function searchValue(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key)?.replace(/\s+/g, ' ').trim();
  return value ? value.slice(0, 160) : undefined;
}

function pageValue(request: NextRequest) {
  const value = Number(request.nextUrl.searchParams.get('page'));
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const page = await queryPromoters({
      q: searchValue(request, 'q'),
      province: searchValue(request, 'province'),
      regency: searchValue(request, 'regency'),
      branch: searchValue(request, 'branch'),
      page: pageValue(request),
      pageSize: 24,
    });
    const status = await getPromoterCatalogStatus();
    const data = page.items.map((promoter) => ({
      code: promoter.code,
      name: promoter.name,
      branchCode: promoter.branchCode,
      area: promoter.area,
      province: promoter.province,
      active: promoter.active,
      regionCodes: promoter.regionCodes,
    }));
    return Response.json({
      data,
      meta: {
        total: page.total,
        page: page.page,
        pageSize: page.pageSize,
        totalPages: page.totalPages,
        updatedAt: status.updatedAt ?? status.source.lastSuccessAt,
      },
    }, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Data promotor tidak tersedia.',
    }, { status: 502, headers: corsHeaders });
  }
}
