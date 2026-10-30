import { isAdminAuthenticated } from '@/lib/admin-auth';
import { updateManagedProduct } from '@/lib/product-store';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const { id } = await context.params;
    return Response.json({ product: await updateManagedProduct(Number(id), await request.json()) });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Produk gagal disimpan.' }, { status: 400 });
  }
}
