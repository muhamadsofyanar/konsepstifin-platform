import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getManagedProducts } from '@/lib/product-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try { return Response.json({ products: await getManagedProducts() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { console.error(error); return Response.json({ message: 'Data produk belum dapat dibuka.' }, { status: 503 }); }
}
