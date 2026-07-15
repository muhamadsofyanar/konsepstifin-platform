import postgres from 'postgres';
import { articles, type ArticleBlock, type ArticleTone } from '@/app/edukasi/articles';

export type ArticleStatus = 'draft' | 'published';

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
  createdAt?: string;
  updatedAt?: string;
};

export type ArticleInput = Omit<StoredArticle, 'id' | 'publishedLabel' | 'createdAt' | 'updatedAt'>;

const tones: ArticleTone[] = ['forest', 'leaf', 'sand', 'mint', 'charcoal'];
const statuses: ArticleStatus[] = ['draft', 'published'];

const globalForDatabase = globalThis as unknown as {
  konsepStifinSql?: ReturnType<typeof postgres>;
  konsepStifinSchema?: Promise<void>;
};

export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);

function getSql() {
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
  }));
}

async function ensureSchema() {
  if (!globalForDatabase.konsepStifinSchema) {
    globalForDatabase.konsepStifinSchema = (async () => {
      const sql = getSql();
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
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

export async function getPublishedArticles(limit?: number): Promise<StoredArticle[]> {
  if (!databaseConfigured()) return fallbackArticles().slice(0, limit);
  try {
    await ensureSchema();
    const sql = getSql();
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
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM education_articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    return rows[0] ? rowToArticle(rows[0]) : undefined;
  } catch (error) {
    console.error('Gagal membaca artikel dari database, menggunakan artikel bawaan.', error);
    return fallbackArticles().find((article) => article.slug === slug);
  }
}

export async function getAdminArticles(): Promise<StoredArticle[]> {
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM education_articles ORDER BY updated_at DESC, id DESC`;
  return rows.map((row) => rowToArticle(row));
}

export async function createArticle(input: ArticleInput): Promise<StoredArticle> {
  await ensureSchema();
  const rows = await getSql()`
    INSERT INTO education_articles
      (slug, category, title, excerpt, published_at, read_time, tone, featured, body, takeaway, status)
    VALUES
      (${input.slug}, ${input.category}, ${input.title}, ${input.excerpt}, ${input.publishedAt}, ${input.readTime}, ${input.tone}, ${input.featured}, ${input.body}, ${input.takeaway}, ${input.status})
    RETURNING *
  `;
  return rowToArticle(rows[0]);
}

export async function updateArticle(id: number, input: ArticleInput): Promise<StoredArticle | undefined> {
  await ensureSchema();
  const rows = await getSql()`
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
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? rowToArticle(rows[0]) : undefined;
}

export async function deleteArticle(id: number) {
  await ensureSchema();
  const rows = await getSql()`DELETE FROM education_articles WHERE id = ${id} RETURNING id`;
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
  if (!tones.includes(tone)) throw new Error('Warna sampul tidak valid.');
  if (!statuses.includes(status)) throw new Error('Status artikel tidak valid.');
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
  };
}
