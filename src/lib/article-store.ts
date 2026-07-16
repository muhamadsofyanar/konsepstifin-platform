import postgres from 'postgres';
import { articles, type ArticleBlock, type ArticleTone } from '@/app/edukasi/articles';
import type { KnowledgeReference } from '@/lib/knowledge-store';

export type ArticleStatus = 'draft' | 'scheduled' | 'published';
export type ArticleContentType = 'education' | 'product' | 'affiliate';

export type StoredArticle = {
  id: number | string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedLabel: string;
  readTime: string;
  tone: ArticleTone;
  featured: boolean;
  body: string;
  takeaway: string;
  status: ArticleStatus;
  contentType: ArticleContentType;
  productName: string;
  productUrl: string;
  ctaLabel: string;
  scheduledAt: string;
  sourceReferences: KnowledgeReference[];
  createdAt?: string;
  updatedAt?: string;
};

export type ArticleInput = Omit<StoredArticle, 'id' | 'publishedLabel' | 'createdAt' | 'updatedAt'>;

const tones: ArticleTone[] = ['forest', 'leaf', 'sand', 'mint', 'charcoal'];
const statuses: ArticleStatus[] = ['draft', 'scheduled', 'published'];
const contentTypes: ArticleContentType[] = ['education', 'product', 'affiliate'];

const globalForDatabase = globalThis as unknown as {
  konsepStifinSql?: ReturnType<typeof postgres>;
  konsepStifinSchema?: Promise<void>;
};

export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);

export function getDatabaseClient() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum dikonfigurasi.');
  if (!globalForDatabase.konsepStifinSql) {
    globalForDatabase.konsepStifinSql = postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDatabase.konsepStifinSql;
}

export function blocksToBody(blocks: ArticleBlock[]) {
  return blocks.map((block) => [
    `## ${block.heading}`,
    ...block.paragraphs,
    ...(block.bullets ?? []).map((bullet) => `- ${bullet}`),
  ].join('\n\n')).join('\n\n');
}

export function bodyToBlocks(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let current: ArticleBlock = { heading: 'Pembahasan', paragraphs: [], bullets: [] };
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const value = paragraph.join(' ').trim();
    if (value) current.paragraphs.push(value);
    paragraph = [];
  };
  const flushBlock = () => {
    flushParagraph();
    if (current.paragraphs.length || current.bullets?.length) {
      if (!current.bullets?.length) delete current.bullets;
      blocks.push(current);
    }
  };

  for (const rawLine of body.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      flushBlock();
      current = { heading: line.slice(3).trim() || 'Pembahasan', paragraphs: [], bullets: [] };
    } else if (line.startsWith('- ')) {
      flushParagraph();
      current.bullets ??= [];
      current.bullets.push(line.slice(2).trim());
    } else if (!line) {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushBlock();
  return blocks.length ? blocks : [{ heading: 'Pembahasan', paragraphs: [body.trim()], bullets: undefined }];
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function fallbackArticles(): StoredArticle[] {
  return articles.map((article, index) => ({
    id: `seed-${index + 1}`,
    slug: article.slug,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    publishedLabel: article.publishedLabel,
    readTime: article.readTime,
    tone: article.tone,
    featured: Boolean(article.featured),
    body: blocksToBody(article.blocks),
    takeaway: article.takeaway,
    status: 'published',
    contentType: 'education',
    productName: '',
    productUrl: '',
    ctaLabel: 'Pilih layanan',
    scheduledAt: '',
    sourceReferences: [],
  }));
}

export async function ensureArticleSchema() {
  if (!globalForDatabase.konsepStifinSchema) {
    globalForDatabase.konsepStifinSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`
        CREATE TABLE IF NOT EXISTS education_articles (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          published_at DATE NOT NULL,
          read_time TEXT NOT NULL,
          tone TEXT NOT NULL DEFAULT 'forest',
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          body TEXT NOT NULL,
          takeaway TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'education'`;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS product_url TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS cta_label TEXT NOT NULL DEFAULT 'Pilih layanan'`;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE education_articles ADD COLUMN IF NOT EXISTS source_references JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`CREATE INDEX IF NOT EXISTS education_articles_schedule_idx ON education_articles(status, scheduled_at)`;
      for (const article of fallbackArticles()) {
        await sql`
          INSERT INTO education_articles
            (slug, category, title, excerpt, published_at, read_time, tone, featured, body, takeaway, status)
          VALUES
            (${article.slug}, ${article.category}, ${article.title}, ${article.excerpt}, ${article.publishedAt}, ${article.readTime}, ${article.tone}, ${article.featured}, ${article.body}, ${article.takeaway}, 'published')
          ON CONFLICT (slug) DO NOTHING
        `;
      }
    })().catch((error) => {
      globalForDatabase.konsepStifinSchema = undefined;
      throw error;
    });
  }
  await globalForDatabase.konsepStifinSchema;
}

function rowToArticle(row: Record<string, unknown>): StoredArticle {
  const publishedAt = row.published_at instanceof Date
    ? row.published_at.toISOString().slice(0, 10)
    : String(row.published_at).slice(0, 10);
  return {
    id: Number(row.id),
    slug: String(row.slug),
    category: String(row.category),
    title: String(row.title),
    excerpt: String(row.excerpt),
    publishedAt,
    publishedLabel: formatDateLabel(publishedAt),
    readTime: String(row.read_time),
    tone: tones.includes(row.tone as ArticleTone) ? row.tone as ArticleTone : 'forest',
    featured: Boolean(row.featured),
    body: String(row.body),
    takeaway: String(row.takeaway),
    status: statuses.includes(row.status as ArticleStatus) ? row.status as ArticleStatus : 'draft',
    contentType: contentTypes.includes(row.content_type as ArticleContentType)
      ? row.content_type as ArticleContentType : 'education',
    productName: String(row.product_name ?? ''),
    productUrl: String(row.product_url ?? ''),
    ctaLabel: String(row.cta_label ?? 'Pilih layanan'),
    scheduledAt: row.scheduled_at ? new Date(String(row.scheduled_at)).toISOString() : '',
    sourceReferences: Array.isArray(row.source_references)
      ? row.source_references.filter((item): item is KnowledgeReference => Boolean(
        item && typeof item === 'object' && Number((item as KnowledgeReference).sourceId) > 0,
      )) : [],
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

async function publishDueArticles() {
  if (!databaseConfigured()) return;
  await ensureArticleSchema();
  await getDatabaseClient()`
    UPDATE education_articles
    SET status = 'published',
        published_at = (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date,
        updated_at = NOW()
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()
  `;
}

export async function getPublishedArticles(limit?: number): Promise<StoredArticle[]> {
  if (!databaseConfigured()) return fallbackArticles().slice(0, limit);
  try {
    await publishDueArticles();
    const sql = getDatabaseClient();
    const rows = limit
      ? await sql`SELECT * FROM education_articles WHERE status = 'published' ORDER BY featured DESC, published_at DESC, id DESC LIMIT ${limit}`
      : await sql`SELECT * FROM education_articles WHERE status = 'published' ORDER BY featured DESC, published_at DESC, id DESC`;
    return rows.map((row) => rowToArticle(row));
  } catch (error) {
    console.error('Gagal membaca artikel dari database, menggunakan artikel bawaan.', error);
    return fallbackArticles().slice(0, limit);
  }
}

export async function getPublishedArticleBySlug(slug: string): Promise<StoredArticle | undefined> {
  if (!databaseConfigured()) return fallbackArticles().find((article) => article.slug === slug);
  try {
    await publishDueArticles();
    const sql = getDatabaseClient();
    const rows = await sql`SELECT * FROM education_articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    return rows[0] ? rowToArticle(rows[0]) : undefined;
  } catch (error) {
    console.error('Gagal membaca artikel dari database, menggunakan artikel bawaan.', error);
    return fallbackArticles().find((article) => article.slug === slug);
  }
}

export async function getAdminArticles(): Promise<StoredArticle[]> {
  await publishDueArticles();
  const rows = await getDatabaseClient()`SELECT * FROM education_articles ORDER BY updated_at DESC, id DESC`;
  return rows.map((row) => rowToArticle(row));
}

export async function createArticle(input: ArticleInput): Promise<StoredArticle> {
  await ensureArticleSchema();
  const sql = getDatabaseClient();
  const rows = await sql`
    INSERT INTO education_articles
      (slug, category, title, excerpt, published_at, read_time, tone, featured, body, takeaway, status,
       content_type, product_name, product_url, cta_label, scheduled_at, source_references)
    VALUES
      (${input.slug}, ${input.category}, ${input.title}, ${input.excerpt}, ${input.publishedAt}, ${input.readTime}, ${input.tone}, ${input.featured}, ${input.body}, ${input.takeaway}, ${input.status},
       ${input.contentType}, ${input.productName}, ${input.productUrl}, ${input.ctaLabel}, ${input.scheduledAt || null}, ${sql.json(input.sourceReferences)})
    RETURNING *
  `;
  return rowToArticle(rows[0]);
}

export async function updateArticle(id: number, input: ArticleInput): Promise<StoredArticle | undefined> {
  await ensureArticleSchema();
  const sql = getDatabaseClient();
  const rows = await sql`
    UPDATE education_articles SET
      slug = ${input.slug},
      category = ${input.category},
      title = ${input.title},
      excerpt = ${input.excerpt},
      published_at = ${input.publishedAt},
      read_time = ${input.readTime},
      tone = ${input.tone},
      featured = ${input.featured},
      body = ${input.body},
      takeaway = ${input.takeaway},
      status = ${input.status},
      content_type = ${input.contentType},
      product_name = ${input.productName},
      product_url = ${input.productUrl},
      cta_label = ${input.ctaLabel},
      scheduled_at = ${input.scheduledAt || null},
      source_references = ${sql.json(input.sourceReferences)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? rowToArticle(rows[0]) : undefined;
}

export async function deleteArticle(id: number) {
  await ensureArticleSchema();
  const rows = await getDatabaseClient()`DELETE FROM education_articles WHERE id = ${id} RETURNING id`;
  return Boolean(rows[0]);
}

export function validateArticleInput(value: unknown): ArticleInput {
  if (!value || typeof value !== 'object') throw new Error('Data artikel tidak valid.');
  const data = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    const result = String(data[key] ?? '').trim();
    if (result.length < min || result.length > max) throw new Error(`${key} harus berisi ${min}–${max} karakter.`);
    return result;
  };
  const slug = text('slug', 3, 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.');
  const publishedAt = text('publishedAt', 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) || Number.isNaN(Date.parse(`${publishedAt}T00:00:00Z`))) throw new Error('Tanggal terbit tidak valid.');
  const tone = String(data.tone ?? 'forest') as ArticleTone;
  const status = String(data.status ?? 'draft') as ArticleStatus;
  const contentType = String(data.contentType ?? 'education') as ArticleContentType;
  if (!tones.includes(tone)) throw new Error('Warna sampul tidak valid.');
  if (!statuses.includes(status)) throw new Error('Status artikel tidak valid.');
  if (!contentTypes.includes(contentType)) throw new Error('Jenis artikel tidak valid.');
  const scheduledAtValue = String(data.scheduledAt ?? '').trim();
  let scheduledAt = '';
  if (scheduledAtValue) {
    const parsed = new Date(scheduledAtValue);
    if (Number.isNaN(parsed.getTime())) throw new Error('Jadwal terbit tidak valid.');
    scheduledAt = parsed.toISOString();
  }
  if (status === 'scheduled' && !scheduledAt) throw new Error('Tentukan tanggal dan jam untuk artikel terjadwal.');
  const productName = String(data.productName ?? '').trim().slice(0, 160);
  const productUrlValue = String(data.productUrl ?? '').trim().slice(0, 1000);
  let productUrl = '';
  if (productUrlValue) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(productUrlValue);
    } catch {
      throw new Error('Alamat produk SEJOLI tidak valid.');
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Alamat produk harus menggunakan http atau https.');
    productUrl = parsedUrl.toString();
  }
  if (contentType !== 'education' && (!productName || !productUrl)) {
    throw new Error('Nama dan alamat produk wajib diisi untuk artikel produk atau affiliate.');
  }
  return {
    slug,
    category: text('category', 2, 80),
    title: text('title', 8, 180),
    excerpt: text('excerpt', 20, 400),
    publishedAt,
    readTime: text('readTime', 3, 40),
    tone,
    featured: Boolean(data.featured),
    body: text('body', 80, 50000),
    takeaway: text('takeaway', 15, 500),
    status,
    contentType,
    productName,
    productUrl,
    ctaLabel: String(data.ctaLabel ?? 'Pilih layanan').trim().slice(0, 80) || 'Pilih layanan',
    scheduledAt,
    sourceReferences: Array.isArray(data.sourceReferences)
      ? data.sourceReferences.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const reference = item as Record<string, unknown>;
        const sourceId = Number(reference.sourceId);
        const pageNumber = Number(reference.pageNumber);
        if (!Number.isInteger(sourceId) || sourceId <= 0 || !Number.isInteger(pageNumber) || pageNumber <= 0) return [];
        return [{
          sourceId,
          pageNumber,
          title: String(reference.title ?? '').trim().slice(0, 180),
          category: String(reference.category ?? '').trim().slice(0, 100),
          accessLevel: ['reference', 'internal', 'restricted'].includes(String(reference.accessLevel))
            ? reference.accessLevel as KnowledgeReference['accessLevel'] : 'internal',
        }];
      }).slice(0, 30) : [],
  };
}
