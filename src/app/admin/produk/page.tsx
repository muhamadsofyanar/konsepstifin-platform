import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getManagedProducts, type ManagedProduct } from '@/lib/product-store';
import ProductManager from './product-manager';

export const metadata = { title: 'Produk & Harga | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminProductPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  let products: ManagedProduct[] = [];
  let initialError = '';
  if (databaseConfigured()) {
    try { products = await getManagedProducts(); }
    catch (error) { console.error(error); initialError = 'Database produk belum dapat dibuka.'; }
  }
  return <ProductManager databaseReady={databaseConfigured()} initialProducts={products} initialError={initialError} />;
}
