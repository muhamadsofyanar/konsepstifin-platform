import { crmGroups, type CrmGroup } from './crm-domain';
export type CrmQuery = { group?: string; q?: string; status?: string; province?: string; regency?: string; service?: string; campaign?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number };
export type CrmPage = { items: Record<string, unknown>[]; total: number; page: number; pageSize: number; groups: Record<CrmGroup, number>; metrics: Record<'baru'|'terlambat'|'milestone'|'selesai'|'ditutup', number>; options: Record<'province'|'regency'|'service'|'campaign', string[]> };
export async function listCrmLeads(query: (text: string, values: unknown[]) => Promise<Record<string, unknown>[]>, input: CrmQuery): Promise<CrmPage> {
 const group = crmGroups.includes(input.group as CrmGroup) ? input.group as CrmGroup : 'prospect';
 const page = Number.isSafeInteger(input.page) ? Math.min(1000000,Math.max(1,input.page!)) : 1;
 const pageSize = Number.isSafeInteger(input.pageSize) ? Math.min(100,Math.max(1,input.pageSize!)) : 25;
 for(const date of [input.dateFrom,input.dateTo]) if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))) throw new Error('Tanggal filter tidak valid.');
 const values = [group, input.q?.trim().slice(0,200)||'',input.status||'',input.province||'',input.regency||'',input.service||'',input.campaign||'',input.dateFrom||null,input.dateTo||null,pageSize,(page-1)*pageSize];
 const rows = await query(`WITH all_leads AS (
 SELECT *, CASE WHEN lead_type='test_service' THEN CASE WHEN status='selesai' THEN 'client' ELSE 'prospect' END ELSE CASE WHEN status='selesai' THEN 'promoter' ELSE 'candidate' END END AS crm_group FROM public_interest_leads
 ), grouped AS (SELECT * FROM all_leads WHERE crm_group=$1), filtered AS (
 SELECT * FROM grouped WHERE ($2='' OR strpos(lower(concat_ws(' ',id,name,phone,email,city,assigned_promoter_code,pic)),lower($2))>0)
 AND ($3='' OR status=$3) AND ($4='' OR province_name=$4) AND ($5='' OR regency_name=$5) AND ($6='' OR service=$6) AND ($7='' OR utm_campaign=$7)
 AND ($8::date IS NULL OR created_at >= $8::date) AND ($9::date IS NULL OR created_at < $9::date + interval '1 day')
 ), page_rows AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT $10 OFFSET $11)
 SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE((SELECT json_agg(page_rows) FROM page_rows),'[]'::json) AS items,
 (SELECT json_object_agg(crm_group,n) FROM (SELECT crm_group,count(*)::int n FROM all_leads GROUP BY crm_group) g) AS groups,
 (SELECT json_build_object('baru',count(*) FILTER(WHERE status='baru'),'terlambat',count(*) FILTER(WHERE status NOT IN ('selesai','ditutup') AND response_due_at<NOW()),'milestone',count(*) FILTER(WHERE status IN ('dijadwalkan','aktivasi')),'selesai',count(*) FILTER(WHERE status='selesai'),'ditutup',count(*) FILTER(WHERE status='ditutup')) FROM grouped) AS metrics,
 (SELECT json_build_object('province',COALESCE(json_agg(DISTINCT province_name ORDER BY province_name) FILTER(WHERE province_name<>''),'[]'::json),'regency',COALESCE(json_agg(DISTINCT regency_name ORDER BY regency_name) FILTER(WHERE regency_name<>'' AND ($4='' OR province_name=$4)),'[]'::json),'service',COALESCE(json_agg(DISTINCT service ORDER BY service) FILTER(WHERE service<>''),'[]'::json),'campaign',COALESCE(json_agg(DISTINCT utm_campaign ORDER BY utm_campaign) FILTER(WHERE utm_campaign<>''),'[]'::json)) FROM grouped) AS options`,values);
 const row=rows[0];
 return {items:row.items as Record<string,unknown>[],total:Number(row.total),page,pageSize,groups:{prospect:0,client:0,candidate:0,promoter:0,...row.groups as Partial<CrmPage['groups']>},metrics:row.metrics as CrmPage['metrics'],options:row.options as CrmPage['options']};
}
