import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';
import { affiliatePrograms, promoterSteps, publicProducts, sejoliLinks, type SejoliLinkKey } from '@/app/site-config';

export type ProductGroup = 'test' | 'promoter' | 'affiliate';
export type ManagedProduct = {
  id: number;
  productKey: SejoliLinkKey;
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
const PRODUCT_CATALOG_REVISION = 'catalog-2026-07-sejoli-v3-card-prices';

const seeds: Omit<ManagedProduct, 'id'>[] = [
  ...publicProducts.map((item, index) => ({ productKey: item.linkKey, groupName: 'test' as const, eyebrow: item.category, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.features, bonuses: item.bonuses, action: item.action, checkoutUrl: sejoliLinks[item.linkKey], active: true, featured: Boolean(item.featured), sortOrder: index + 1 })),
  ...promoterSteps.map((item, index) => ({ productKey: item.linkKey, groupName: 'promoter' as const, eyebrow: item.label, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.benefits, bonuses: [], action: item.action, checkoutUrl: sejoliLinks[item.linkKey], active: true, featured: false, sortOrder: index + 1 })),
  ...affiliatePrograms.map((item, index) => ({ productKey: item.linkKey, groupName: 'affiliate' as const, eyebrow: item.eyebrow, title: item.title, description: item.description, price: item.price, priceNote: item.priceNote, features: item.points, bonuses: [], action: item.action, checkoutUrl: sejoliLinks[item.linkKey], active: true, featured: index === 1, sortOrder: index + 1 })),
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
      const applied = await sql`SELECT revision FROM public_product_migrations WHERE revision = ${PRODUCT_CATALOG_REVISION}`;
      if (!applied[0]) {
        for (const item of seeds) {
          await sql`UPDATE public_products SET
            group_name=${item.groupName}, eyebrow=${item.eyebrow}, title=${item.title}, description=${item.description},
            price=${item.price}, price_note=${item.priceNote}, features=${sql.json(item.features)}, bonuses=${sql.json(item.bonuses)},
            action=${item.action}, checkout_url=${item.checkoutUrl}, active=${item.active}, featured=${item.featured}, sort_order=${item.sortOrder}, updated_at=NOW()
            WHERE product_key=${item.productKey}`;
        }
        await sql`INSERT INTO public_product_migrations (revision) VALUES (${PRODUCT_CATALOG_REVISION})`;
      }
    })().catch((error) => { globalProducts.konsepStifinProductSchema = undefined; throw error; });
  }
  await globalProducts.konsepStifinProductSchema;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function rowToProduct(row: Record<string, unknown>): ManagedProduct {
  return { id: Number(row.id), productKey: String(row.product_key) as SejoliLinkKey, groupName: String(row.group_name) as ProductGroup, eyebrow: String(row.eyebrow), title: String(row.title), description: String(row.description), price: String(row.price), priceNote: String(row.price_note), features: textArray(row.features), bonuses: textArray(row.bonuses), action: String(row.action), checkoutUrl: String(row.checkout_url), active: Boolean(row.active), featured: Boolean(row.featured), sortOrder: Number(row.sort_order), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? '') };
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

export async function updateManagedProduct(id: number, input: Partial<ManagedProduct>) {
  await ensureProductSchema();
  const title = String(input.title ?? '').trim();
  const price = String(input.price ?? '').trim();
  if (!title || !price) throw new Error('Nama produk dan harga wajib diisi.');
  const checkoutUrl = String(input.checkoutUrl ?? '').trim();
  if (checkoutUrl && !/^https:\/\//i.test(checkoutUrl)) throw new Error('URL checkout harus menggunakan https://');
  const sql = getDatabaseClient();
  const rows = await sql`UPDATE public_products SET
    eyebrow=${String(input.eyebrow ?? '').trim()}, title=${title}, description=${String(input.description ?? '').trim()},
    price=${price}, price_note=${String(input.priceNote ?? '').trim()}, features=${sql.json(textArray(input.features))},
    bonuses=${sql.json(textArray(input.bonuses))}, action=${String(input.action ?? 'Lihat produk').trim()}, checkout_url=${checkoutUrl},
    active=${Boolean(input.active)}, featured=${Boolean(input.featured)}, sort_order=${Math.max(0, Number(input.sortOrder) || 0)}, updated_at=NOW()
    WHERE id=${id} RETURNING *`;
  if (!rows[0]) throw new Error('Produk tidak ditemukan.');
  return rowToProduct(rows[0]);
}
