export const serviceKeys = ['tesPersonal','tesPasangan','paketKeluarga','paketKeluargaPlus','sekolahKomunitas','previewPromotor','wsl1','wsl2','idDanAlat','paketPromotor'];
export function productPath(p: { source_product_key?: unknown; slug?: unknown }) {
  return p.source_product_key ? '/produk/layanan/' + encodeURIComponent(String(p.source_product_key)) : '/produk/' + encodeURIComponent(String(p.slug));
}
export function oldProductPath(identifier: string, kind?: string) {
  return productPath(kind !== 'digital' && serviceKeys.includes(identifier) ? {source_product_key:identifier} : {slug:identifier});
}
export function safeReturnPath(value: unknown) {
  if(typeof value !== 'string' || value.length > 600 || /[\\\r\n]/.test(value)) return '/akun';
  if(/^\/produk\/(?:layanan\/)?[a-zA-Z0-9-]+$/.test(value)) return value;
  return /^\/belajar(?:\?tab=(?:classes|orders|catalog))?$/.test(value) ? value : '/akun';
}
