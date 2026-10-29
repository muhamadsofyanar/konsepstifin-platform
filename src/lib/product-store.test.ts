import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({sql:null as unknown,reads:[] as string[]}));
vi.mock('@/lib/article-store',()=>({databaseConfigured:()=>true,getDatabaseClient:()=>state.sql}));
import {getManagedProducts,getPublicProductByKey,updateManagedProduct} from './product-store';
const database=new PGlite();
function adapter(connection:{query:(text:string,values:unknown[])=>Promise<{rows:Record<string,unknown>[]}>}){
 const tag=Object.assign(async(parts:TemplateStringsArray,...values:unknown[])=>{const sql=parts.reduce((s,p,i)=>s+(i?`$${i}`:'')+p,'');state.reads.push(sql);return (await connection.query(sql,values)).rows;},{json:(v:unknown)=>JSON.stringify(v),begin:async<T>(fn:(sql:ReturnType<typeof adapter>)=>Promise<T>):Promise<T>=>database.transaction(tx=>fn(adapter(tx)))});return tag;
}
beforeAll(async()=>{for(const file of (await readdir('scripts/migrations')).filter(f=>/^\d{3}.*\.sql$/.test(f)).sort())await database.exec(await readFile('scripts/migrations/'+file,'utf8'));state.sql=adapter(database);});
afterAll(()=>database.close());
it('preserves operator edits and historical checkout fields when catalog migration repeats',async()=>{
 await database.query<Record<string,unknown>>("UPDATE public_products SET title='Layanan khusus admin',price='Rp777.000',description='Catatan khusus',checkout_url='https://app.konsepstifin.com/product/history/' WHERE product_key='tesPersonal'");
 await database.exec(await readFile('scripts/migrations/010-catalog-read-path.sql','utf8'));
 const personal=(await getManagedProducts('test')).find(p=>p.productKey==='tesPersonal')!;
 expect(personal).toMatchObject({title:'Layanan khusus admin',price:'Rp777.000',description:'Catatan khusus',checkoutUrl:''});
 const saved=await updateManagedProduct(personal.id,{...personal,price:'Rp778.000',checkoutUrl:'https://evil.example/'});
 expect(saved).toMatchObject({price:'Rp778.000',checkoutUrl:''});
 expect((await database.query<Record<string,unknown>>("SELECT checkout_url FROM public_products WHERE id=$1",[personal.id])).rows[0].checkout_url).toContain('/history/');
 expect(Number((await database.query<Record<string,unknown>>("SELECT price FROM learning_products WHERE source_product_key='tesPersonal'")).rows[0].price)).toBe(778000);
});
it('keeps original catalog amounts and configured commission policies on rerun',async()=>{
 const products=await getManagedProducts('test');expect(products.find(p=>p.productKey==='tesPasangan')?.price).toBe('Rp1.100.000');expect(products.find(p=>p.productKey==='paketKeluargaPlus')?.price).toBe('Rp2.499.999');
 const family=products.find(p=>p.productKey==='paketKeluarga')!;
 await database.query<Record<string,unknown>>("UPDATE learning_products SET commission_bps=1200,attribution_enabled=true WHERE source_product_key='paketKeluarga'");
 await updateManagedProduct(family.id,{...family,price:'Rp1.650.000'});await database.exec(await readFile('scripts/migrations/010-catalog-read-path.sql','utf8'));
 const [stored]=(await database.query<Record<string,unknown>>("SELECT price,commission_bps,attribution_enabled FROM learning_products WHERE source_product_key='paketKeluarga'")).rows;
 expect(Number(stored.price)).toBe(1650000);expect(stored.commission_bps).toBe(1200);expect(stored.attribution_enabled).toBe(true);
});
it('uses one SELECT per product read, without schema checks, synchronization or whole-catalog scans for a detail',async()=>{
 state.reads.length=0;await getManagedProducts('test');await getManagedProducts('test');await getPublicProductByKey('tesPersonal');
 expect(state.reads).toHaveLength(3);expect(state.reads.every(sql=>/^\s*SELECT /i.test(sql))).toBe(true);expect(state.reads[2]).toContain('product_key=');
});
it('rolls legacy and unified edits back together when synchronization fails',async()=>{
 const product=(await getManagedProducts('test')).find(p=>p.productKey==='tesPersonal')!;
 await database.exec("CREATE FUNCTION reject_catalog_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test sync failure'; END $$; CREATE TRIGGER reject_catalog_test BEFORE UPDATE ON learning_products FOR EACH ROW EXECUTE FUNCTION reject_catalog_test();");
 try{await expect(updateManagedProduct(product.id,{...product,price:'Rp900.000'})).rejects.toThrow(/test sync failure/);expect((await getManagedProducts('test')).find(p=>p.id===product.id)?.price).toBe(product.price);}
 finally{await database.exec('DROP TRIGGER reject_catalog_test ON learning_products; DROP FUNCTION reject_catalog_test();');}
});
