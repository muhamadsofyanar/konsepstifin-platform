import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { listCrmLeads } from './crm-query';
const db = new PGlite();
const query = async (text: string, values: unknown[]) => (await db.query(text, values)).rows as Record<string, unknown>[];
beforeAll(async () => {
 await db.exec(`CREATE TABLE public_interest_leads(id serial PRIMARY KEY,name text,phone text DEFAULT '',email text DEFAULT '',city text DEFAULT '',assigned_promoter_code text DEFAULT '',pic text DEFAULT '',lead_type text DEFAULT 'test_service',status text DEFAULT 'baru',province_name text DEFAULT '',regency_name text DEFAULT '',service text DEFAULT 'Tes',utm_campaign text DEFAULT '',response_due_at timestamptz DEFAULT now()-interval '1 hour',created_at timestamptz DEFAULT '2026-01-01');
 INSERT INTO public_interest_leads(name) SELECT 'Person '||n FROM generate_series(1,525)n;
 INSERT INTO public_interest_leads(name,province_name,utm_campaign,created_at) VALUES ('Old target','Aceh','old','2025-01-01');
 INSERT INTO public_interest_leads(name,status) VALUES('Client','selesai');
 INSERT INTO public_interest_leads(name,lead_type,status) VALUES('Promoter','promoter_candidate','selesai'),('Candidate','promoter_candidate','baru');`);
});
afterAll(async()=>{await db.close();});
it('queries all records with stable pagination and full counts, metrics and options beyond 500',async()=>{
 const page=await listCrmLeads(query,{});
 expect(page.items).toHaveLength(25); expect(page.total).toBe(526); expect(page.groups).toEqual({prospect:526,client:1,candidate:1,promoter:1});
 expect(page.metrics.baru).toBe(526); expect(page.options.province).toContain('Aceh');
 const last=await listCrmLeads(query,{page:22}); expect(last.items).toHaveLength(1); expect(last.items[0].name).toBe('Old target');
 const filtered=await listCrmLeads(query,{q:'Old target',province:'Aceh',campaign:'old',dateFrom:'2025-01-01',dateTo:'2025-01-01'});
 expect(filtered.total).toBe(1); expect(filtered.items[0].name).toBe('Old target');
 expect((await listCrmLeads(query,{q:"' OR 1=1 --"})).total).toBe(0);
 expect((await listCrmLeads(query,{group:'promoter'})).items[0].name).toBe('Promoter');
});
it('bounds page size and validates dates',async()=>{
 expect((await listCrmLeads(query,{pageSize:1000})).items).toHaveLength(100);
 await expect(listCrmLeads(query,{dateFrom:'invalid'})).rejects.toThrow();
});
