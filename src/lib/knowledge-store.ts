import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extractText, getDocumentProxy } from 'unpdf';
import { getDatabaseClient } from '@/lib/article-store';

export type KnowledgeAccessLevel = 'reference' | 'internal' | 'restricted';
export type KnowledgeRiskLevel = 'low' | 'medium' | 'high';
export type KnowledgeStatus = 'ready' | 'disabled' | 'error';
export type KnowledgeDocumentType = 'workbook' | 'book' | 'ebook' | 'guide' | 'other';

export type KnowledgeSource = {
  id: number;
  title: string;
  originalFilename: string;
  category: string;
  documentType: KnowledgeDocumentType;
  accessLevel: KnowledgeAccessLevel;
  riskLevel: KnowledgeRiskLevel;
  publicationYear: number | null;
  enabledForAi: boolean;
  pageCount: number;
  chunkCount: number;
  fileSize: number;
  notes: string;
  status: KnowledgeStatus;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeReference = {
  sourceId: number;
  title: string;
  pageNumber: number;
  category: string;
  accessLevel: KnowledgeAccessLevel;
};

export type KnowledgeSearchResult = KnowledgeReference & {
  content: string;
  rank: number;
};

type KnowledgeUpload = {
  bytes: Uint8Array;
  filename: string;
  title?: string;
  category?: string;
  documentType?: string;
  accessLevel?: string;
  riskLevel?: string;
  publicationYear?: number | null;
  notes?: string;
};

const accessLevels: KnowledgeAccessLevel[] = ['reference', 'internal', 'restricted'];
const riskLevels: KnowledgeRiskLevel[] = ['low', 'medium', 'high'];
const documentTypes: KnowledgeDocumentType[] = ['workbook', 'book', 'ebook', 'guide', 'other'];
const statuses: KnowledgeStatus[] = ['ready', 'disabled', 'error'];

const globalForKnowledge = globalThis as unknown as {
  konsepStifinKnowledgeSchema?: Promise<void>;
};

export const knowledgeStorageDirectory = () =>
  path.join(process.cwd(), 'storage', 'stifin-sources');

function knowledgeFilePath(storedFilename: string) {
  return path.join(knowledgeStorageDirectory(), path.basename(storedFilename));
}

export const knowledgeMaxFileBytes = () => {
  const configured = Number(process.env.KNOWLEDGE_MAX_FILE_MB);
  const megabytes = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 100) : 25;
  return megabytes * 1024 * 1024;
};

export async function ensureKnowledgeSchema() {
  if (!globalForKnowledge.konsepStifinKnowledgeSchema) {
    globalForKnowledge.konsepStifinKnowledgeSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`
        CREATE TABLE IF NOT EXISTS knowledge_sources (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          stored_filename TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL DEFAULT 'Dasar STIFIn',
          document_type TEXT NOT NULL DEFAULT 'workbook',
          access_level TEXT NOT NULL DEFAULT 'internal',
          risk_level TEXT NOT NULL DEFAULT 'medium',
          publication_year INTEGER,
          enabled_for_ai BOOLEAN NOT NULL DEFAULT TRUE,
          page_count INTEGER NOT NULL DEFAULT 0,
          chunk_count INTEGER NOT NULL DEFAULT 0,
          file_size BIGINT NOT NULL DEFAULT 0,
          checksum TEXT NOT NULL UNIQUE,
          notes TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'ready',
          error_message TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
          id BIGSERIAL PRIMARY KEY,
          source_id BIGINT NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
          page_number INTEGER NOT NULL,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          word_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(source_id, page_number, chunk_index)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx ON knowledge_chunks(source_id, page_number)`;
      await sql`CREATE INDEX IF NOT EXISTS knowledge_sources_ai_idx ON knowledge_sources(status, enabled_for_ai, access_level)`;
      await sql`CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx ON knowledge_chunks USING GIN(to_tsvector('simple', content))`;
    })().catch((error) => {
      globalForKnowledge.konsepStifinKnowledgeSchema = undefined;
      throw error;
    });
  }
  await globalForKnowledge.konsepStifinKnowledgeSchema;
}

function sourceFromRow(row: Record<string, unknown>): KnowledgeSource {
  const documentType = String(row.document_type) as KnowledgeDocumentType;
  const accessLevel = String(row.access_level) as KnowledgeAccessLevel;
  const riskLevel = String(row.risk_level) as KnowledgeRiskLevel;
  const status = String(row.status) as KnowledgeStatus;
  return {
    id: Number(row.id),
    title: String(row.title),
    originalFilename: String(row.original_filename),
    category: String(row.category),
    documentType: documentTypes.includes(documentType) ? documentType : 'other',
    accessLevel: accessLevels.includes(accessLevel) ? accessLevel : 'internal',
    riskLevel: riskLevels.includes(riskLevel) ? riskLevel : 'medium',
    publicationYear: row.publication_year == null ? null : Number(row.publication_year),
    enabledForAi: Boolean(row.enabled_for_ai),
    pageCount: Number(row.page_count),
    chunkCount: Number(row.chunk_count),
    fileSize: Number(row.file_size),
    notes: String(row.notes ?? ''),
    status: statuses.includes(status) ? status : 'error',
    errorMessage: String(row.error_message ?? ''),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function displayTitle(filename: string) {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/^\d{1,3}[-_ ]*/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'Materi STIFIn';
}

export function inferKnowledgeMetadata(filename: string) {
  const name = filename.toLowerCase();
  let category = 'Dasar STIFIn';
  let accessLevel: KnowledgeAccessLevel = 'reference';
  let riskLevel: KnowledgeRiskLevel = 'low';
  let enabledForAi = true;

  if (name.includes('level 2') || name.includes('level-2')) {
    category = 'Promotor & Lisensi';
    accessLevel = 'restricted';
    riskLevel = 'medium';
    enabledForAi = false;
  } else if (name.includes('level 1') || name.includes('level-1')) {
    category = 'Dasar STIFIn';
    accessLevel = 'internal';
  } else if (name.includes('learning') || name.includes('teaching')) {
    category = 'Belajar & Anak';
    riskLevel = 'medium';
  } else if (name.includes('parenting')) {
    category = 'Keluarga';
    riskLevel = 'medium';
  } else if (name.includes('profesi')) {
    category = 'Pengembangan Diri';
    riskLevel = 'medium';
  } else if (name.includes('human-resource') || name.includes('human resource') || name.includes('leadership')) {
    category = 'Tim & Organisasi';
    riskLevel = 'medium';
  } else if (name.includes('marketing') || name.includes('bisnis')) {
    category = 'Bisnis & Pemasaran';
    riskLevel = 'medium';
  } else if (name.includes('couple')) {
    category = 'Keluarga';
    accessLevel = 'restricted';
    riskLevel = 'high';
    enabledForAi = false;
  } else if (name.includes('finansial')) {
    category = 'Finansial';
    accessLevel = 'restricted';
    riskLevel = 'high';
    enabledForAi = false;
  } else if (name.includes('politik')) {
    category = 'Politik';
    accessLevel = 'restricted';
    riskLevel = 'high';
    enabledForAi = false;
  } else if (name.includes('suri-rumah') || name.includes('suri rumah')) {
    category = 'Keluarga';
    accessLevel = 'restricted';
    riskLevel = 'high';
    enabledForAi = false;
  } else if (name.includes('health')) {
    category = 'Kesehatan';
    accessLevel = 'restricted';
    riskLevel = 'high';
    enabledForAi = false;
  }

  const yearMatch = name.match(/(?:19|20)\d{2}/);
  return {
    title: displayTitle(filename),
    category,
    documentType: 'workbook' as KnowledgeDocumentType,
    accessLevel,
    riskLevel,
    enabledForAi,
    publicationYear: yearMatch ? Number(yearMatch[0]) : null,
  };
}

function cleanPageText(value: string) {
  return value
    .replace(/\u00ad/g, '')
    .replace(/([\p{L}\d])-\s*\n\s*([\p{L}\d])/gu, '$1$2')
    .replace(/[\t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkPageText(pageText: string) {
  const words = pageText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [];
  const targetWords = 210;
  const overlapWords = 32;
  const chunks: Array<{ content: string; wordCount: number }> = [];
  for (let start = 0; start < words.length; start += targetWords - overlapWords) {
    const slice = words.slice(start, start + targetWords);
    if (!slice.length) break;
    chunks.push({ content: slice.join(' '), wordCount: slice.length });
    if (start + targetWords >= words.length) break;
  }
  return chunks;
}

export async function ingestKnowledgePdf(input: KnowledgeUpload): Promise<KnowledgeSource> {
  await ensureKnowledgeSchema();
  if (input.bytes.byteLength < 5 || new TextDecoder().decode(input.bytes.slice(0, 5)) !== '%PDF-') {
    throw new Error('File bukan PDF yang valid.');
  }
  if (input.bytes.byteLength > knowledgeMaxFileBytes()) {
    throw new Error(`Ukuran PDF melebihi batas ${Math.round(knowledgeMaxFileBytes() / 1024 / 1024)} MB.`);
  }

  const checksum = createHash('sha256').update(input.bytes).digest('hex');
  const sql = getDatabaseClient();
  const existing = await sql`SELECT id FROM knowledge_sources WHERE checksum = ${checksum} LIMIT 1`;
  if (existing[0]) throw new Error('PDF ini sudah ada di Pustaka STIFIn.');

  const inferred = inferKnowledgeMetadata(input.filename);
  const accessLevel = accessLevels.includes(input.accessLevel as KnowledgeAccessLevel)
    ? input.accessLevel as KnowledgeAccessLevel : inferred.accessLevel;
  const riskLevel = riskLevels.includes(input.riskLevel as KnowledgeRiskLevel)
    ? input.riskLevel as KnowledgeRiskLevel : inferred.riskLevel;
  const documentType = documentTypes.includes(input.documentType as KnowledgeDocumentType)
    ? input.documentType as KnowledgeDocumentType : inferred.documentType;
  const publicationYear = input.publicationYear && input.publicationYear >= 1900 && input.publicationYear <= 2100
    ? input.publicationYear : inferred.publicationYear;
  const enabledForAi = accessLevel === 'restricted' ? false : inferred.enabledForAi;
  const storedFilename = `${randomUUID()}.pdf`;
  const storageDirectory = knowledgeStorageDirectory();
  const storedPath = knowledgeFilePath(storedFilename);
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storedPath, input.bytes, { flag: 'wx' });

  try {
    const pdf = await getDocumentProxy(input.bytes);
    const extracted = await extractText(pdf, { mergePages: false });
    await pdf.destroy();
    const chunks = extracted.text.flatMap((page, pageIndex) =>
      chunkPageText(cleanPageText(page)).map((chunk, chunkIndex) => ({
        page_number: pageIndex + 1,
        chunk_index: chunkIndex,
        content: chunk.content,
        word_count: chunk.wordCount,
      })),
    );
    if (!chunks.length) throw new Error('PDF tidak memiliki lapisan teks yang dapat dibaca.');

    const source = await sql.begin(async (transaction) => {
      const rows = await transaction`
        INSERT INTO knowledge_sources
          (title, original_filename, stored_filename, category, document_type, access_level, risk_level,
           publication_year, enabled_for_ai, page_count, chunk_count, file_size, checksum, notes, status)
        VALUES
          (${String(input.title || inferred.title).trim().slice(0, 180)}, ${input.filename.slice(0, 260)}, ${storedFilename},
           ${String(input.category || inferred.category).trim().slice(0, 100)}, ${documentType}, ${accessLevel}, ${riskLevel},
           ${publicationYear}, ${enabledForAi}, ${extracted.totalPages}, ${chunks.length}, ${input.bytes.byteLength},
           ${checksum}, ${String(input.notes || '').trim().slice(0, 2000)}, 'ready')
        RETURNING *
      `;
      const sourceId = Number(rows[0].id);
      await transaction`
        INSERT INTO knowledge_chunks
        ${transaction(chunks.map((chunk) => ({ source_id: sourceId, ...chunk })),
          'source_id', 'page_number', 'chunk_index', 'content', 'word_count')}
      `;
      return sourceFromRow(rows[0]);
    });
    return source;
  } catch (error) {
    await unlink(storedPath).catch(() => undefined);
    throw error;
  }
}

export async function getKnowledgeSources() {
  await ensureKnowledgeSchema();
  const rows = await getDatabaseClient()`SELECT * FROM knowledge_sources ORDER BY updated_at DESC, id DESC`;
  return rows.map((row) => sourceFromRow(row));
}

export async function getKnowledgeSource(id: number) {
  await ensureKnowledgeSchema();
  const rows = await getDatabaseClient()`SELECT * FROM knowledge_sources WHERE id = ${id} LIMIT 1`;
  return rows[0] ? sourceFromRow(rows[0]) : undefined;
}

export async function getKnowledgePreview(id: number, limit = 20) {
  await ensureKnowledgeSchema();
  const source = await getKnowledgeSource(id);
  if (!source) return undefined;
  const chunks = await getDatabaseClient()`
    SELECT page_number, chunk_index, content, word_count
    FROM knowledge_chunks
    WHERE source_id = ${id}
    ORDER BY page_number, chunk_index
    LIMIT ${Math.min(50, Math.max(1, limit))}
  `;
  return {
    source,
    chunks: chunks.map((row) => ({
      pageNumber: Number(row.page_number),
      chunkIndex: Number(row.chunk_index),
      content: String(row.content),
      wordCount: Number(row.word_count),
    })),
  };
}

export async function updateKnowledgeSource(id: number, value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Data sumber tidak valid.');
  const data = value as Record<string, unknown>;
  const current = await getKnowledgeSource(id);
  if (!current) return undefined;
  const title = String(data.title ?? current.title).trim().slice(0, 180);
  const category = String(data.category ?? current.category).trim().slice(0, 100);
  const documentType = documentTypes.includes(data.documentType as KnowledgeDocumentType)
    ? data.documentType as KnowledgeDocumentType : current.documentType;
  const accessLevel = accessLevels.includes(data.accessLevel as KnowledgeAccessLevel)
    ? data.accessLevel as KnowledgeAccessLevel : current.accessLevel;
  const riskLevel = riskLevels.includes(data.riskLevel as KnowledgeRiskLevel)
    ? data.riskLevel as KnowledgeRiskLevel : current.riskLevel;
  const year = Number(data.publicationYear);
  const publicationYear = Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null;
  const notes = String(data.notes ?? current.notes).trim().slice(0, 2000);
  const enabledForAi = Boolean(data.enabledForAi);
  if (title.length < 3 || category.length < 2) throw new Error('Judul dan kategori wajib diisi.');
  const rows = await getDatabaseClient()`
    UPDATE knowledge_sources SET
      title = ${title}, category = ${category}, document_type = ${documentType}, access_level = ${accessLevel},
      risk_level = ${riskLevel}, publication_year = ${publicationYear}, enabled_for_ai = ${enabledForAi},
      notes = ${notes}, status = ${enabledForAi ? 'ready' : 'disabled'}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? sourceFromRow(rows[0]) : undefined;
}

export async function deleteKnowledgeSource(id: number) {
  await ensureKnowledgeSchema();
  const sql = getDatabaseClient();
  const rows = await sql`DELETE FROM knowledge_sources WHERE id = ${id} RETURNING stored_filename`;
  if (!rows[0]) return false;
  const storedFilename = path.basename(String(rows[0].stored_filename));
  await unlink(knowledgeFilePath(storedFilename)).catch(() => undefined);
  return true;
}

export async function readKnowledgeFile(id: number) {
  await ensureKnowledgeSchema();
  const rows = await getDatabaseClient()`
    SELECT original_filename, stored_filename FROM knowledge_sources WHERE id = ${id} LIMIT 1
  `;
  if (!rows[0]) return undefined;
  const storedFilename = path.basename(String(rows[0].stored_filename));
  const bytes = await readFile(knowledgeFilePath(storedFilename));
  return { bytes, filename: String(rows[0].original_filename) };
}

const searchStopWords = new Set([
  'yang', 'dan', 'untuk', 'dengan', 'dari', 'pada', 'dalam', 'atau', 'agar', 'cara', 'tentang', 'artikel',
  'pembaca', 'memberi', 'membuat', 'menjadi', 'lebih', 'sebagai', 'adalah', 'ini', 'itu', 'ke', 'di', 'bagi',
]);

function knowledgeSearchExpression(value: string) {
  const terms = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]{3,}/g)?.filter((term) => !searchStopWords.has(term)) ?? [];
  return [...new Set(terms)].slice(0, 14).join(' OR ');
}

export async function findKnowledgeContext({
  query,
  sourceIds = [],
  limit = 9,
}: {
  query: string;
  sourceIds?: number[];
  limit?: number;
}) {
  await ensureKnowledgeSchema();
  const sql = getDatabaseClient();
  const expression = knowledgeSearchExpression(query);
  if (!expression) return { context: '', references: [] as KnowledgeReference[], results: [] as KnowledgeSearchResult[] };
  const selectedIds = [...new Set(sourceIds.filter((id) => Number.isInteger(id) && id > 0))].slice(0, 30);
  const sourceFilter = selectedIds.length
    ? sql`AND ks.id IN ${sql(selectedIds)}`
    : sql`AND ks.access_level <> 'restricted'`;
  const rows = await sql`
    SELECT kc.content, kc.page_number, ks.id AS source_id, ks.title, ks.category, ks.access_level,
           ts_rank_cd(to_tsvector('simple', kc.content), websearch_to_tsquery('simple', ${expression})) AS rank
    FROM knowledge_chunks kc
    JOIN knowledge_sources ks ON ks.id = kc.source_id
    WHERE ks.status = 'ready'
      AND ks.enabled_for_ai = TRUE
      AND to_tsvector('simple', kc.content) @@ websearch_to_tsquery('simple', ${expression})
      ${sourceFilter}
    ORDER BY rank DESC, ks.id, kc.page_number
    LIMIT ${Math.min(15, Math.max(1, limit))}
  `;
  const results = rows.map((row) => ({
    sourceId: Number(row.source_id),
    title: String(row.title),
    pageNumber: Number(row.page_number),
    category: String(row.category),
    accessLevel: String(row.access_level) as KnowledgeAccessLevel,
    content: String(row.content),
    rank: Number(row.rank),
  }));
  const references: KnowledgeReference[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    const key = `${result.sourceId}:${result.pageNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      references.push({
        sourceId: result.sourceId,
        title: result.title,
        pageNumber: result.pageNumber,
        category: result.category,
        accessLevel: result.accessLevel,
      });
    }
  }
  const context = results.map((result, index) =>
    `[PUSTAKA ${index + 1}] ${result.title}, halaman ${result.pageNumber}\n${result.content}`,
  ).join('\n\n').slice(0, 18_000);
  return { context, references, results };
}
