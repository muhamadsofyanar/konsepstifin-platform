/** Server-owned referral aliases and opaque first-touch visits. Never trust form attribution. */
import { createHash, randomBytes } from 'node:crypto';
import { NETWORK_BRANCH } from './network-domain.ts';
import type { NetworkQuery, NetworkTransaction } from './network-service.ts';
export const REFERRAL_COOKIE = 'konsepstifin_referral';
export const REFERRAL_MAX_AGE = 30 * 24 * 60 * 60;
const reserved = new Set(['admin','api','akun','login','logout','r','referral','voucher','www','support','tes-stifin','jadi-promotor','promotor-stifin','null','undefined']);
export function normalizeReferralAlias(value: unknown) {
 if (typeof value !== 'string') throw new Error('Alias tidak valid.');
 const alias = value.trim().toLowerCase().replace(/\s+/g,'-');
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias) || alias.length < 2 || alias.length > 80 || reserved.has(alias)) throw new Error('Alias harus 2–80 huruf ASCII, angka, atau tanda hubung dan bukan nama terlarang.');
 return alias;
}
const referralServiceKeys = new Set([
 'tesPersonal', 'tesPasangan', 'paketKeluarga', 'paketKeluargaPlus', 'sekolahKomunitas',
 'previewPromotor', 'wsl1', 'wsl2', 'wst', 'idDanAlat', 'paketPromotor',
]);

/** Resolve only known internal destinations. Referral links must never become open redirects. */
export function referralDestination(value: string | null) {
 const fallback = '/tes-stifin';
 if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
 let url: URL;
 try { url = new URL(value, 'https://konsepstifin.com'); } catch { return fallback; }
 if (url.origin !== 'https://konsepstifin.com' || url.username || url.password) return fallback;
 const path = url.pathname;
 const allowed = new Set(['/tes-stifin', '/jadi-promotor', '/belajar', '/akun/daftar', '/affiliate', '/promotor', '/kontak', '/edukasi']);
 const isServiceProduct = path.startsWith('/produk/layanan/') && referralServiceKeys.has(path.slice('/produk/layanan/'.length));
 if (!allowed.has(path) && !isServiceProduct) return fallback;
 const query = path === '/belajar' && url.searchParams.get('tab') === 'catalog' ? '?tab=catalog' : '';
 const allowedHashes: Record<string, Set<string>> = {
  '/tes-stifin': new Set(['#layanan', '#proses']),
  '/jadi-promotor': new Set(['#tahapan', '#year-end-workshop']),
  '/affiliate': new Set(['#program']),
  '/kontak': new Set(['#affiliate']),
 };
 const hash = allowedHashes[path]?.has(url.hash) ? url.hash : '';
 return `${path}${query}${hash}`;
}
export type ReferralSource = { userId: string; promoterCode: string; alias: string; name: string; branchCode: string; area: string };
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const eligible = `SELECT u.id,a.promoter_code,p.name,p.branch_code,p.service_area FROM platform_users u JOIN platform_promoter_accounts a ON a.user_id=u.id JOIN platform_promoter_profiles p ON p.user_id=u.id WHERE u.active=true AND p.branch_code=$2 AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter') AND u.id=$1`;
export class ReferralService {
 constructor(private query: NetworkQuery, private transaction: NetworkTransaction, private origin: string) {}
 private async member(q: NetworkQuery,userId: string,lock=false) {
  let [row]=await q(eligible+(lock?' FOR UPDATE OF u':''),[userId,NETWORK_BRANCH.code]);
 if(!row)[row]=await q(`SELECT u.id,'mitra-'||replace(u.id::text,'-','') AS promoter_code,split_part(u.email,'@',1) AS name,'' AS branch_code,'' AS service_area FROM platform_users u WHERE u.id=$1 AND u.active=true AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='affiliate')`+(lock?' FOR UPDATE OF u':''),[userId]);
  if(!row) throw new Error('Keanggotaan promotor aktif diperlukan.');
  return row;
 }
 private async ensureDefault(q: NetworkQuery,userId: string,code: string) {
  const alias=normalizeReferralAlias(code);
  await q('INSERT INTO platform_referral_aliases(alias,user_id,is_current) VALUES($1,$2,false) ON CONFLICT DO NOTHING',[alias,userId]);
  const [owner]=await q('SELECT user_id FROM platform_referral_aliases WHERE alias=$1',[alias]);
  if(owner?.user_id!==userId) throw new Error('Alias kode resmi sudah digunakan.');
  await q('UPDATE platform_referral_aliases SET is_current=true WHERE alias=$1 AND user_id=$2 AND NOT EXISTS(SELECT 1 FROM platform_referral_aliases WHERE user_id=$2 AND is_current)',[alias,userId]);
 }
 async getPortal(userId: string) {
  return this.transaction(async q=>{
   const member=await this.member(q,userId,true);await this.ensureDefault(q,userId,String(member.promoter_code));
   const aliases=await q('SELECT alias,is_current FROM platform_referral_aliases WHERE user_id=$1 ORDER BY is_current DESC,created_at,alias',[userId]);
   const alias=String(aliases.find(a=>a.is_current)?.alias);
   return {promoterCode:String(member.promoter_code),name:String(member.name),alias,url:`${this.origin}/r/${alias}`,aliases:aliases.map(a=>String(a.alias))};
  });
 }
 async saveAlias(userId: string,value: unknown) {
  const alias=normalizeReferralAlias(value);
  await this.transaction(async q=>{
   const member=await this.member(q,userId,true);await this.ensureDefault(q,userId,String(member.promoter_code));
   const official=await q('SELECT user_id FROM platform_promoter_accounts WHERE lower(promoter_code)=$1 AND user_id<>$2',[alias,userId]);
   if(official.length)throw new Error('Alias sudah dimiliki promotor lain.');
   // Unique alias constraint serializes competing claims. Historical rows are never deleted.
   await q('INSERT INTO platform_referral_aliases(alias,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[alias,userId]);
   const [row]=await q('SELECT user_id FROM platform_referral_aliases WHERE alias=$1',[alias]);
   if(row?.user_id!==userId)throw new Error('Alias sudah dimiliki promotor lain.');
   await q('UPDATE platform_referral_aliases SET is_current=false WHERE user_id=$1 AND is_current',[userId]);
   await q('UPDATE platform_referral_aliases SET is_current=true WHERE alias=$1 AND user_id=$2',[alias,userId]);
  });
  return this.getPortal(userId);
 }
 async resolveToken(token: string | undefined): Promise<ReferralSource|null> {
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const [row]=await this.query(`SELECT u.id,a.promoter_code,p.name,p.branch_code,p.service_area,v.alias FROM platform_referral_visits v JOIN platform_referral_aliases x ON x.alias=v.alias JOIN platform_users u ON u.id=x.user_id LEFT JOIN platform_promoter_accounts a ON a.user_id=u.id LEFT JOIN platform_promoter_profiles p ON p.user_id=u.id WHERE v.token_hash=$1 AND v.expires_at>now() AND u.active=true AND ((p.branch_code=$2 AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter')) OR EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='affiliate'))`,[digest(token),NETWORK_BRANCH.code]);
  return row?{userId:String(row.id),promoterCode:String(row.promoter_code ?? ''),alias:String(row.alias),name:String(row.name ?? 'Mitra'),branchCode:String(row.branch_code ?? ''),area:String(row.service_area ?? '')}:null;
 }
 async resolveRegistered(userId: string): Promise<ReferralSource|null> {
  const [row]=await this.query(`SELECT u.id,a.promoter_code,p.name,p.branch_code,p.service_area,r.alias
    FROM platform_referral_registrations r JOIN platform_users u ON u.id=r.partner_user_id
    LEFT JOIN platform_promoter_accounts a ON a.user_id=u.id LEFT JOIN platform_promoter_profiles p ON p.user_id=u.id
    WHERE r.user_id=$1 AND r.attribution_expires_at>now() AND u.active=true
    AND ((p.branch_code=$2 AND EXISTS(SELECT 1 FROM platform_user_roles roles WHERE roles.user_id=u.id AND roles.role='promoter'))
      OR EXISTS(SELECT 1 FROM platform_user_roles roles WHERE roles.user_id=u.id AND roles.role='affiliate'))`,[userId,NETWORK_BRANCH.code]);
  return row?{userId:String(row.id),promoterCode:String(row.promoter_code??''),alias:String(row.alias),name:String(row.name??'Mitra'),branchCode:String(row.branch_code??''),area:String(row.service_area??'')}:null;
 }
 async activity(userId: string) {
  return this.transaction(async q=>{
   await this.member(q,userId);
   const [counts]=await q(`SELECT
    (SELECT count(*) FROM platform_referral_visits v JOIN platform_referral_aliases a ON a.alias=v.alias WHERE a.user_id=$1) AS visits,
    (SELECT count(*) FROM platform_referral_registrations WHERE partner_user_id=$1) AS registrations,
    (SELECT count(*) FROM public_interest_leads WHERE source_partner_user_id=$1) AS requests,
    (SELECT count(*) FROM learning_purchases WHERE partner_user_id=$1) AS purchases`,[userId]);
   const registrations=await q(`SELECT 'Peserta '||left(replace(user_id::text,'-',''),8) AS participant,alias,created_at
    FROM platform_referral_registrations WHERE partner_user_id=$1 ORDER BY created_at DESC,user_id LIMIT 100`,[userId]);
   const purchases=await q(`SELECT p.id,p.snapshot->>'title' AS product_title,p.created_at,o.number,o.total,o.state AS order_state,
    EXISTS(SELECT 1 FROM commerce_ledger r WHERE r.order_id=o.id AND r.kind='refund') AS has_refund,
    COALESCE((SELECT sum(amount) FROM commerce_ledger WHERE order_id=o.id),0) AS balance
    FROM learning_purchases p LEFT JOIN commerce_orders o ON o.id=p.order_id WHERE p.partner_user_id=$1 ORDER BY p.id DESC LIMIT 100`,[userId]);
   const requests=await q(`SELECT id,service,status,created_at FROM public_interest_leads
    WHERE source_partner_user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100`,[userId]);
   return {requests,counts:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,Number(v)])),registrations,purchases};
  });
 }
 async visit(value: string,existingToken?: string) {
  // Existing valid first touch is never extended or replaced.
  if(await this.resolveToken(existingToken))return {token:null,valid:true};
  let alias;try{alias=normalizeReferralAlias(value);}catch{return {token:null,valid:false};}
  // Imports after migration also receive their official-code URL on first use.
  const [official]=await this.query('SELECT user_id FROM platform_promoter_accounts WHERE lower(promoter_code)=$1',[alias]);
  if(official)await this.transaction(async q=>{const member=await this.member(q,String(official.user_id),true);await this.ensureDefault(q,String(official.user_id),String(member.promoter_code));}).catch(()=>undefined);
  const token=randomBytes(32).toString('hex');
  const rows=await this.query(`INSERT INTO platform_referral_visits(token_hash,alias) SELECT $1,x.alias FROM platform_referral_aliases x JOIN platform_users u ON u.id=x.user_id LEFT JOIN platform_promoter_profiles p ON p.user_id=u.id LEFT JOIN platform_promoter_accounts a ON a.user_id=u.id WHERE x.alias=$2 AND u.active=true AND ((p.branch_code=$3 AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter')) OR EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='affiliate')) RETURNING alias`,[digest(token),alias,NETWORK_BRANCH.code]);
  return {token:rows.length?token:null,valid:!!rows.length};
 }
}
