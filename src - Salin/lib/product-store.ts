import { publicProductPresentation } from './catalog-presentation';
import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';
import { affiliatePrograms, promoterSteps, publicProducts, type ProductKey } from '@/app/site-config';

export type ProductGroup = 'test' | 'promoter' | 'affiliate';
export type ManagedProduct = {
  id: number;
  productKey: ProductKey;
  groupName: ProductGroup;
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  bonuses: string[];
  action: string;
  checkoutUrl: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  updatedAt?: string;
};

const seeds: Omit<ManagedProduct, 'id'>[] = [
  ...publicProducts.map((item, index) => ({ productKey: item.linkKey, groupName: 'test' as const, eyebrow: item.category, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.features, bonuses: item.bonuses, action: item.action, checkoutUrl: '', active: true, featured: Boolean(item.featured), sortOrder: index + 1 })),
  ...promoterSteps.map((item, index) => ({ productKey: item.linkKey, groupName: 'promoter' as const, eyebrow: item.label, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.benefits, bonuses: [], action: item.action, checkoutUrl: '', active: true, featured: false, sortOrder: index + 1 })),
  ...affiliatePrograms.map((item, index) => ({ productKey: item.linkKey, groupName: 'affiliate' as const, eyebrow: item.eyebrow, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.points, bonuses: [], action: item.action, checkoutUrl: '', active: true, featured: index === 1, sortOrder: index + 1 })),
];

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function rowToProduct(row: Record<string, unknown>): ManagedProduct {
  return { id: Number(row.id), productKey: String(row.product_key) as ProductKey, groupName: String(row.group_name) as ProductGroup, eyebrow: String(row.eyebrow), title: String(row.title), description: String(row.description), price: String(row.price), priceNote: String(row.price_note), features: textArray(row.features), bonuses: textArray(row.bonuses), action: String(row.action), checkoutUrl: '', active: Boolean(row.active), featured: Boolean(row.featured), sortOrder: Number(row.sort_order), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? '') };
}

export async function getManagedProducts(groupName?: ProductGroup) {
  const sql = getDatabaseClient();
  const rows = groupName
    ? await sql`SELECT * FROM public_products WHERE group_name = ${groupName} ORDER BY sort_order, id`
    : await sql`SELECT * FROM public_products ORDER BY group_name, sort_order, id`;
  return rows.map((row) => rowToProduct(row));
}

export async function getPublicManagedProducts(groupName: ProductGroup) {
  const fallback=()=>seeds.filter(item=>item.groupName===groupName).map((item,index)=>publicProductPresentation({...item,id:-(index+1)}));
  if (!databaseConfigured()) return fallback();
  try { return (await getManagedProducts(groupName)).filter(item=>item.active).map(publicProductPresentation); }
  catch { console.error('Product database unavailable'); return fallback(); }
}
export async function getPublicProductByKey(productKey: string) {
  const normalized=String(productKey??'').trim();if(!normalized)return null;
  const fallback=()=>{const item=seeds.find(p=>p.productKey===normalized&&p.active);return item?publicProductPresentation(item):null;};
  if(!databaseConfigured())return fallback();
  try { const sql=getDatabaseClient();const [row]=await sql`SELECT * FROM public_products WHERE product_key=${normalized} AND active=true LIMIT 1`;return row?publicProductPresentation(rowToProduct(row)):null; }
  catch {return fallback();}
}

export async function updateManagedProduct(id: number, input: Partial<ManagedProduct>) {
  const title = String(input.title ?? '').trim();
  const price = String(input.price ?? '').trim();
  if (!title || !price) throw new Error('Nama produk dan harga wajib diisi.');
  const sql = getDatabaseClient();
  return sql.begin(async transaction => {
  // Match the unified editor lock order before touching either catalog row.
  await transaction`LOCK TABLE learning_products IN SHARE ROW EXCLUSIVE MODE`;
  const rows = await transaction`UPDATE public_products SET
    eyebrow=${String(input.eyebrow ?? '').trim()}, title=${title}, description=${String(input.description ?? '').trim()},
    price=${price}, price_note=${String(input.priceNote ?? '').trim()}, features=${transaction.json(textArray(input.features))},
    bonuses=${transaction.json(textArray(input.bonuses))}, action=${String(input.action ?? 'Lihat produk').trim()},
    active=${Boolean(input.active)}, featured=${Boolean(input.featured)}, sort_order=${Math.max(0, Number(input.sortOrder) || 0)}, updated_at=NOW()
    WHERE id=${id} RETURNING *`;
  if (!rows[0]) throw new Error('Produk tidak ditemukan.');
  await transaction`INSERT INTO learning_products(slug,title,description,kind,state,price,source_product_key,price_note)
    SELECT 'layanan-'||lower(product_key),title,description,'consultation',CASE WHEN active THEN 'published' ELSE 'archived' END,
    CASE WHEN price ~ '^Rp[0-9.]+$' THEN replace(substring(price from 3),'.','')::bigint ELSE 0 END,product_key,price_note
    FROM public_products WHERE id=${id} AND group_name IN ('test','promoter')
    ON CONFLICT(source_product_key) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,state=EXCLUDED.state,price=EXCLUDED.price,price_note=EXCLUDED.price_note`;
  return rowToProduct(rows[0]);
  });
}
