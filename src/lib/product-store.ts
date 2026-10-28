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

const globalProducts = globalThis as unknown as { konsepStifinProductSchema?: Promise<void> };

const seeds: Omit<ManagedProduct, 'id'>[] = [
  ...publicProducts.map((item, index) => ({ productKey: item.linkKey, groupName: 'test' as const, eyebrow: item.category, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.features, bonuses: item.bonuses, action: item.action, checkoutUrl: '', active: true, featured: Boolean(item.featured), sortOrder: index + 1 })),
  ...promoterSteps.map((item, index) => ({ productKey: item.linkKey, groupName: 'promoter' as const, eyebrow: item.label, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.benefits, bonuses: [], action: item.action, checkoutUrl: '', active: true, featured: false, sortOrder: index + 1 })),
  ...affiliatePrograms.map((item, index) => ({ productKey: item.linkKey, groupName: 'affiliate' as const, eyebrow: item.eyebrow, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.points, bonuses: [], action: item.action, checkoutUrl: '', active: true, featured: index === 1, sortOrder: index + 1 })),
];

export async function ensureProductSchema() {
  if (!globalProducts.konsepStifinProductSchema) {
    globalProducts.konsepStifinProductSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`CREATE TABLE IF NOT EXISTS public_products (
        id BIGSERIAL PRIMARY KEY,
        product_key TEXT NOT NULL UNIQUE,
        group_name TEXT NOT NULL,
        eyebrow TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price TEXT NOT NULL DEFAULT '',
        price_note TEXT NOT NULL DEFAULT '',
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        bonuses JSONB NOT NULL DEFAULT '[]'::jsonb,
        action TEXT NOT NULL DEFAULT 'Lihat produk',
        checkout_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS public_product_migrations (
        revision TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      for (const item of seeds) {
        await sql`INSERT INTO public_products (product_key, group_name, eyebrow, title, description, price, price_note, features, bonuses, action, checkout_url, active, featured, sort_order)
          VALUES (${item.productKey}, ${item.groupName}, ${item.eyebrow}, ${item.title}, ${item.description}, ${item.price}, ${item.priceNote}, ${sql.json(item.features)}, ${sql.json(item.bonuses)}, ${item.action}, ${item.checkoutUrl}, ${item.active}, ${item.featured}, ${item.sortOrder})
          ON CONFLICT (product_key) DO NOTHING`;
      }
    })().catch((error) => { globalProducts.konsepStifinProductSchema = undefined; throw error; });
  }
  await globalProducts.konsepStifinProductSchema;
  // Public cards and affiliate catalog share one stable product identity. Never reset commission rules.
  const sql = getDatabaseClient();
  const [ready] = await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='learning_products' AND column_name='source_product_key') AS ready`;
  if (ready?.ready) await sql`INSERT INTO learning_products(slug,title,description,kind,state,price,source_product_key,price_note)
    SELECT 'layanan-' || lower(product_key),title,description,'consultation',CASE WHEN active THEN 'published' ELSE 'archived' END,
    CASE WHEN price ~ '^Rp[0-9.]+$' THEN replace(substring(price from 3),'.','')::bigint ELSE 0 END,product_key,price_note
    FROM public_products WHERE group_name IN ('test','promoter')
    ON CONFLICT(source_product_key) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,state=EXCLUDED.state,price=EXCLUDED.price,price_note=EXCLUDED.price_note
    WHERE learning_products.title IS DISTINCT FROM EXCLUDED.title OR learning_products.description IS DISTINCT FROM EXCLUDED.description OR learning_products.state IS DISTINCT FROM EXCLUDED.state OR learning_products.price IS DISTINCT FROM EXCLUDED.price OR learning_products.price_note IS DISTINCT FROM EXCLUDED.price_note`;

}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function rowToProduct(row: Record<string, unknown>): ManagedProduct {
  return { id: Number(row.id), productKey: String(row.product_key) as ProductKey, groupName: String(row.group_name) as ProductGroup, eyebrow: String(row.eyebrow), title: String(row.title), description: String(row.description), price: String(row.price), priceNote: String(row.price_note), features: textArray(row.features), bonuses: textArray(row.bonuses), action: String(row.action), checkoutUrl: '', active: Boolean(row.active), featured: Boolean(row.featured), sortOrder: Number(row.sort_order), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? '') };
}

export async function getManagedProducts(groupName?: ProductGroup) {
  await ensureProductSchema();
  const sql = getDatabaseClient();
  const rows = groupName
    ? await sql`SELECT * FROM public_products WHERE group_name = ${groupName} ORDER BY sort_order, id`
    : await sql`SELECT * FROM public_products ORDER BY group_name, sort_order, id`;
  return rows.map((row) => rowToProduct(row));
}

export async function getPublicManagedProducts(groupName: ProductGroup) {
  if (!databaseConfigured()) return seeds.filter((item) => item.groupName === groupName).map((item, index) => ({ ...item, id: -(index + 1) }));
  try { return (await getManagedProducts(groupName)).filter((item) => item.active); }
  catch (error) { console.error('Product database fallback', error); return seeds.filter((item) => item.groupName === groupName).map((item, index) => ({ ...item, id: -(index + 1) })); }
}

export async function getPublicProductByKey(productKey: string) {
  const normalized = String(productKey ?? '').trim();
  if (!normalized) return null;
  if (!databaseConfigured()) return seeds.find((item) => item.productKey === normalized && item.active) ?? null;
  try {
    return (await getManagedProducts()).find((item) => item.productKey === normalized && item.active) ?? null;
  } catch (error) {
    console.error('Product database fallback', error);
    return seeds.find((item) => item.productKey === normalized && item.active) ?? null;
  }
}

export async function updateManagedProduct(id: number, input: Partial<ManagedProduct>) {
  await ensureProductSchema();
  const title = String(input.title ?? '').trim();
  const price = String(input.price ?? '').trim();
  if (!title || !price) throw new Error('Nama produk dan harga wajib diisi.');
  const sql = getDatabaseClient();
  const rows = await sql`UPDATE public_products SET
    eyebrow=${String(input.eyebrow ?? '').trim()}, title=${title}, description=${String(input.description ?? '').trim()},
    price=${price}, price_note=${String(input.priceNote ?? '').trim()}, features=${sql.json(textArray(input.features))},
    bonuses=${sql.json(textArray(input.bonuses))}, action=${String(input.action ?? 'Lihat produk').trim()},
    active=${Boolean(input.active)}, featured=${Boolean(input.featured)}, sort_order=${Math.max(0, Number(input.sortOrder) || 0)}, updated_at=NOW()
    WHERE id=${id} RETURNING *`;
  if (!rows[0]) throw new Error('Produk tidak ditemukan.');
  await ensureProductSchema();
  return rowToProduct(rows[0]);
}
