const rupiah = new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0});
/** Whole Rupiah only. Do not turn a range or explanatory text into a fabricated number. */
export function catalogAmount(value: string): number | null {
  const raw=value.trim().replace(/\u00a0/g,' ');
  if(/^gratis$/i.test(raw))return 0;
  const match=/^(?:Rp\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,00)?$/i.exec(raw);
  if(!match)return null;
  const amount=Number(match[1].replaceAll('.',''));
  return Number.isSafeInteger(amount)&&amount>=0&&amount<=999999999999?amount:null;
}
export function formatRupiah(value: number) {return rupiah.format(value).replace(/\u00a0/g,'');}
export function currentPublicCopy(value:string){
  return value.replace(/checkout\s+SEJOLI/gi,'konfirmasi pengelola').replace(/\bSEJOLI\b/gi,'KonsepSTIFIn').replace(/app\.konsepstifin\.com/gi,'konsepstifin.com');
}
export function publicPrice(key:string,value:string){
  const amount=catalogAmount(value);
  if((key==='sekolahKomunitas'&&(amount===0||amount===null))||(['tesPersonal','tesPasangan','paketKeluarga','paketKeluargaPlus'].includes(key)&&amount===0))return 'Minta penawaran';
  if(['affiliateUmum','affiliatePromotor'].includes(key)&&amount!==null&&amount<=1&&!/^gratis$/i.test(value.trim()))return 'Konfirmasi ketentuan';
  if(['previewPromotor','wsl1','wsl2','wst','idDanAlat','paketPromotor'].includes(key)&&amount===0)return 'Konfirmasi jadwal';
  if(amount===0)return 'Gratis';
  return amount===null?currentPublicCopy(value):formatRupiah(amount);
}
export function publicProductPresentation<T extends {productKey:string;title:string;description:string;price:string;priceNote:string;features:string[];bonuses:string[];action:string}>(p:T):T{
  return {...p,title:currentPublicCopy(p.title),description:currentPublicCopy(p.description),price:publicPrice(p.productKey,p.price),priceNote:currentPublicCopy(p.priceNote),features:p.features.map(currentPublicCopy),bonuses:p.bonuses.map(currentPublicCopy),action:currentPublicCopy(p.action)};
}
export function promoterInvestment(products:{productKey:string;price:string}[]){
 const keys=['wsl1','wsl2','idDanAlat'];
 const amounts=keys.map(key=>{const p=products.find(p=>p.productKey===key);return p?catalogAmount(p.price):null;});
 const total=amounts.every((p):p is number=>p!==null&&p>0)?amounts.reduce((a,b)=>a+b,0):null;
 const item=products.find(p=>p.productKey==='paketPromotor'),rawPackage=item?catalogAmount(item.price):null;
 const bundle=rawPackage!==null&&rawPackage>0?rawPackage:null;
 return {individual:total,package:bundle,main:item?bundle:total,saving:bundle!==null&&total!==null&&total>bundle?total-bundle:null};
}
