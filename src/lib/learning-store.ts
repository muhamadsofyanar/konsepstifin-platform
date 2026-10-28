import 'server-only';
import { getDatabaseClient } from '@/lib/article-store';
import { LearningService } from './learning-service';
import type { CommerceDatabase } from './commerce-service';
export function getLearningService() { const sql = getDatabaseClient(); const db: CommerceDatabase = { query: async (t, p = []) => [...await sql.unsafe(t, p as never[])], transaction: fn => sql.begin(tx => fn({ query: async (t, p = []) => [...await tx.unsafe(t, p as never[])] })) as Promise<Awaited<ReturnType<typeof fn>>> }; return new LearningService(db); }
