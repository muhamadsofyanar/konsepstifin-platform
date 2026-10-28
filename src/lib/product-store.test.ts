import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ query: null as null | ((query: string, parameters: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) }));
vi.mock('@/lib/article-store', () => ({
  databaseConfigured: () => true,
  getDatabaseClient: () => Object.assign(async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
    return (await state.query!(query, values)).rows;
  }, { json: (value: unknown) => JSON.stringify(value) }),
}));
import { ensureProductSchema, getManagedProducts, updateManagedProduct } from './product-store';
const database = new PGlite();
beforeAll(() => { state.query = (query, parameters) => database.query(query, parameters); });
afterAll(() => database.close());
describe('internal product catalog', () => {
  it('preserves admin prices and descriptions when initialization repeats', async () => {
    await ensureProductSchema();
    await database.query("UPDATE public_products SET title='Layanan khusus admin',price='Rp777.000',description='Catatan khusus',checkout_url='https://app.konsepstifin.com/product/history/' WHERE product_key='tesPersonal'");
    // An absent/new revision marker must never reset existing catalog edits.
    await database.query('DELETE FROM public_product_migrations');
    (globalThis as unknown as { konsepStifinProductSchema?: Promise<void> }).konsepStifinProductSchema = undefined;
    await ensureProductSchema();
    const products = await getManagedProducts('test');
    const personal = products.find((product) => product.productKey === 'tesPersonal')!;
    expect(personal).toMatchObject({ title: 'Layanan khusus admin', price: 'Rp777.000', description: 'Catatan khusus', checkoutUrl: '' });
    const history = await database.query<{ checkout_url: string }>('SELECT checkout_url FROM public_products WHERE id=$1', [personal.id]);
    expect(history.rows[0].checkout_url).toContain('/history/');
    const saved = await updateManagedProduct(personal.id, { ...personal, price: 'Rp778.000', checkoutUrl: 'https://evil.example/' });
    expect(saved).toMatchObject({ price: 'Rp778.000', checkoutUrl: '' });
    const after = await database.query<{ checkout_url: string }>('SELECT checkout_url FROM public_products WHERE id=$1', [personal.id]);
    expect(after.rows[0].checkout_url).toEqual(history.rows[0].checkout_url);
  });
  it('seeds the remaining catalog with unchanged display prices and no checkout', async () => {
    const products = await getManagedProducts('test');
    expect(products.find((product) => product.productKey === 'tesPasangan')?.price).toBe('Rp1.100.000');
    expect(products.find((product) => product.productKey === 'paketKeluargaPlus')?.price).toBe('Rp2.499.999');
    expect(products.every((product) => product.checkoutUrl === '')).toBe(true);
  });
});
