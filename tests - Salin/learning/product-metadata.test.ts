import {it,expect,vi} from 'vitest';
const product=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/learning-store',()=>({getLearningService:()=>({publicProduct:product})}));
vi.mock('@/lib/product-store',()=>({ensureProductSchema:vi.fn(),getPublicProductByKey:vi.fn()}));
vi.mock('@/lib/identity/server',()=>({getAccountPrincipal:vi.fn()}));
import {generateMetadata} from '../../src/app/produk/[...identifier]/page';
it('gives a published product its own title and canonical instead of the homepage URL',async()=>{product.mockResolvedValue({title:'Paket Keluarga',description:'Layanan keluarga',slug:'custom',source_product_key:'paketKeluarga'});const data=await generateMetadata({params:Promise.resolve({identifier:['layanan','paketKeluarga']})});expect(data.title).toBe('Paket Keluarga | KonsepSTIFIn');expect(data.alternates?.canonical).toBe('/produk/layanan/paketKeluarga');});
it('does not invite indexing of an unpublished or unknown product',async()=>{product.mockResolvedValue(null);const data=await generateMetadata({params:Promise.resolve({identifier:['tidak-ada']})});expect(data.robots).toEqual({index:false,follow:false});});
