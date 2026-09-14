import { accessScope } from './access-policy.ts';
import type { Principal } from './access-policy.ts';
import type { Query } from './store.ts';
const fields = 'id,name,phone,email,city,status';
export class ScopedLeadStore {
  private query: Query;
  constructor(query: Query) { this.query=query; }
  async list(principal: Principal | null, page=1, pageSize=25, search='') {
    if (!Number.isSafeInteger(page) || page<1 || page>1000000 || !Number.isInteger(pageSize) || pageSize<1 || pageSize>100
      || typeof search!=='string' || search.length>200) throw new Error('Invalid pagination');
    const scope=accessScope(principal);
    if(scope.kind==='none') return {items:[],total:0,page,pageSize};
    // One statement keeps total and items in the same database snapshot, including empty pages.
    const rows=await this.query(`WITH scoped AS (
      SELECT ${fields},created_at FROM public_interest_leads
      WHERE ($1='all' OR (assigned_promoter_code=$2 AND consent_to_share=true))
      AND ($3='' OR strpos(lower(name),lower($3))>0 OR strpos(lower(city),lower($3))>0)
    ), page_rows AS (SELECT ${fields} FROM scoped ORDER BY created_at DESC,id DESC LIMIT $4 OFFSET $5)
    SELECT (SELECT count(*)::int FROM scoped) AS total,
      COALESCE((SELECT json_agg(page_rows) FROM page_rows),'[]'::json) AS items`,
    [scope.kind,scope.kind==='assigned'?scope.promoterCode:null,search,pageSize,(page-1)*pageSize]);
    return {items:rows[0].items as Record<string,unknown>[],total:Number(rows[0].total),page,pageSize};
  }
  async detail(principal: Principal | null,id: number) {
    if(!Number.isSafeInteger(id)||id<1) return null;
    const scope=accessScope(principal);if(scope.kind==='none')return null;
    const rows=await this.query(`SELECT ${fields} FROM public_interest_leads WHERE id=$1
      AND ($2='all' OR (assigned_promoter_code=$3 AND consent_to_share=true))`,
      [id,scope.kind,scope.kind==='assigned'?scope.promoterCode:null]);
    return rows[0]??null;
  }
}
