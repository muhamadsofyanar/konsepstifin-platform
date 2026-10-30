import { ensureArticleSchema, getDatabaseClient } from '@/lib/article-store';

export type CommentStatus = 'pending' | 'approved' | 'spam' | 'rejected';

export type PublicComment = {
  id: number;
  name: string;
  body: string;
  createdAt: string;
};

export type AdminComment = PublicComment & {
  email: string;
  status: CommentStatus;
  articleTitle: string;
  articleSlug: string;
};

const globalForEngagement = globalThis as unknown as { konsepStifinEngagementSchema?: Promise<void> };

export async function ensureEngagementSchema() {
  await ensureArticleSchema();
  if (!globalForEngagement.konsepStifinEngagementSchema) {
    globalForEngagement.konsepStifinEngagementSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`
        CREATE TABLE IF NOT EXISTS article_comments (
          id BIGSERIAL PRIMARY KEY,
          article_id BIGINT NOT NULL REFERENCES education_articles(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          body TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS article_likes (
          id BIGSERIAL PRIMARY KEY,
          article_id BIGINT NOT NULL REFERENCES education_articles(id) ON DELETE CASCADE,
          visitor_token TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(article_id, visitor_token)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS article_events (
          id BIGSERIAL PRIMARY KEY,
          article_id BIGINT NOT NULL REFERENCES education_articles(id) ON DELETE CASCADE,
          visitor_token TEXT NOT NULL,
          event_type TEXT NOT NULL,
          channel TEXT NOT NULL DEFAULT '',
          event_day DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(article_id, visitor_token, event_type, channel, event_day)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS article_comments_status_idx ON article_comments(status, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS article_events_type_idx ON article_events(event_type, created_at DESC)`;
    })().catch((error) => {
      globalForEngagement.konsepStifinEngagementSchema = undefined;
      throw error;
    });
  }
  await globalForEngagement.konsepStifinEngagementSchema;
}

async function articleIdForSlug(slug: string) {
  await ensureEngagementSchema();
  const rows = await getDatabaseClient()`SELECT id FROM education_articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
  return rows[0] ? Number(rows[0].id) : undefined;
}

function publicComment(row: Record<string, unknown>): PublicComment {
  return {
    id: Number(row.id),
    name: String(row.name),
    body: String(row.body),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getPublicEngagement(slug: string, visitorToken: string) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return undefined;
  const sql = getDatabaseClient();
  const [likes, comments, liked] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM article_likes WHERE article_id = ${articleId}`,
    sql`SELECT id, name, body, created_at FROM article_comments WHERE article_id = ${articleId} AND status = 'approved' ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT 1 FROM article_likes WHERE article_id = ${articleId} AND visitor_token = ${visitorToken} LIMIT 1`,
  ]);
  return {
    likes: Number(likes[0]?.count ?? 0),
    liked: Boolean(liked[0]),
    comments: comments.map((row) => publicComment(row)),
  };
}

export async function recordView(slug: string, visitorToken: string) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return false;
  await getDatabaseClient()`
    INSERT INTO article_events (article_id, visitor_token, event_type)
    VALUES (${articleId}, ${visitorToken}, 'view')
    ON CONFLICT DO NOTHING
  `;
  return true;
}

export async function toggleLike(slug: string, visitorToken: string) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return undefined;
  const sql = getDatabaseClient();
  const deleted = await sql`
    DELETE FROM article_likes WHERE article_id = ${articleId} AND visitor_token = ${visitorToken}
    RETURNING id
  `;
  let liked = false;
  if (!deleted[0]) {
    await sql`
      INSERT INTO article_likes (article_id, visitor_token)
      VALUES (${articleId}, ${visitorToken})
      ON CONFLICT DO NOTHING
    `;
    liked = true;
  }
  const count = await sql`SELECT COUNT(*)::int AS count FROM article_likes WHERE article_id = ${articleId}`;
  return { liked, likes: Number(count[0]?.count ?? 0) };
}

export async function recordShare(slug: string, visitorToken: string, channel: string) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return false;
  await getDatabaseClient()`
    INSERT INTO article_events (article_id, visitor_token, event_type, channel)
    VALUES (${articleId}, ${visitorToken}, 'share', ${channel})
    ON CONFLICT DO NOTHING
  `;
  return true;
}

export async function recordCta(slug: string, visitorToken: string, channel: string) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return false;
  await getDatabaseClient()`
    INSERT INTO article_events (article_id, visitor_token, event_type, channel)
    VALUES (${articleId}, ${visitorToken}, 'cta', ${channel})
    ON CONFLICT DO NOTHING
  `;
  return true;
}

export async function createComment(slug: string, input: { name: string; email: string; body: string; status: CommentStatus }) {
  const articleId = await articleIdForSlug(slug);
  if (!articleId) return undefined;
  const rows = await getDatabaseClient()`
    INSERT INTO article_comments (article_id, name, email, body, status)
    VALUES (${articleId}, ${input.name}, ${input.email}, ${input.body}, ${input.status})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function getAdminEngagement() {
  await ensureEngagementSchema();
  const sql = getDatabaseClient();
  const [metricRows, comments, topArticles] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM article_events WHERE event_type = 'view') AS views,
        (SELECT COUNT(*)::int FROM article_likes) AS likes,
        (SELECT COUNT(*)::int FROM article_events WHERE event_type = 'share') AS shares,
        (SELECT COUNT(*)::int FROM article_events WHERE event_type = 'cta') AS cta_clicks,
        (SELECT COUNT(*)::int FROM article_comments WHERE status = 'approved') AS approved_comments,
        (SELECT COUNT(*)::int FROM article_comments WHERE status = 'pending') AS pending_comments
    `,
    sql`
      SELECT c.id, c.name, c.email, c.body, c.status, c.created_at, a.title AS article_title, a.slug AS article_slug
      FROM article_comments c JOIN education_articles a ON a.id = c.article_id
      ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.created_at DESC
      LIMIT 200
    `,
    sql`
      SELECT a.id, a.title, a.slug,
        COALESCE(v.views, 0)::int AS views,
        COALESCE(l.likes, 0)::int AS likes,
        COALESCE(s.shares, 0)::int AS shares,
        COALESCE(ct.cta_clicks, 0)::int AS cta_clicks,
        COALESCE(c.comments, 0)::int AS comments
      FROM education_articles a
      LEFT JOIN (SELECT article_id, COUNT(*) AS views FROM article_events WHERE event_type = 'view' GROUP BY article_id) v ON v.article_id = a.id
      LEFT JOIN (SELECT article_id, COUNT(*) AS likes FROM article_likes GROUP BY article_id) l ON l.article_id = a.id
      LEFT JOIN (SELECT article_id, COUNT(*) AS shares FROM article_events WHERE event_type = 'share' GROUP BY article_id) s ON s.article_id = a.id
      LEFT JOIN (SELECT article_id, COUNT(*) AS cta_clicks FROM article_events WHERE event_type = 'cta' GROUP BY article_id) ct ON ct.article_id = a.id
      LEFT JOIN (SELECT article_id, COUNT(*) AS comments FROM article_comments WHERE status = 'approved' GROUP BY article_id) c ON c.article_id = a.id
      WHERE a.status = 'published'
      ORDER BY COALESCE(v.views, 0) + COALESCE(l.likes, 0) * 3 + COALESCE(s.shares, 0) * 2 DESC, a.published_at DESC
      LIMIT 10
    `,
  ]);
  const metrics = metricRows[0] ?? {};
  return {
    metrics: {
      views: Number(metrics.views ?? 0),
      likes: Number(metrics.likes ?? 0),
      shares: Number(metrics.shares ?? 0),
      ctaClicks: Number(metrics.cta_clicks ?? 0),
      approvedComments: Number(metrics.approved_comments ?? 0),
      pendingComments: Number(metrics.pending_comments ?? 0),
    },
    comments: comments.map((row) => ({
      ...publicComment(row),
      email: String(row.email ?? ''),
      status: String(row.status) as CommentStatus,
      articleTitle: String(row.article_title),
      articleSlug: String(row.article_slug),
    })),
    topArticles: topArticles.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      slug: String(row.slug),
      views: Number(row.views),
      likes: Number(row.likes),
      shares: Number(row.shares),
      ctaClicks: Number(row.cta_clicks),
      comments: Number(row.comments),
    })),
  };
}

export async function updateCommentStatus(id: number, status: CommentStatus) {
  await ensureEngagementSchema();
  const rows = await getDatabaseClient()`
    UPDATE article_comments SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING id
  `;
  return Boolean(rows[0]);
}

export async function deleteComment(id: number) {
  await ensureEngagementSchema();
  const rows = await getDatabaseClient()`DELETE FROM article_comments WHERE id = ${id} RETURNING id`;
  return Boolean(rows[0]);
}
