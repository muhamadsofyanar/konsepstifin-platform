import type { ArticleInput, StoredArticle } from '@/lib/article-store';
import { detectCannibalization } from '@/lib/content-intelligence';
import {
  applyOptimizationPlan,
  buildBatchOptimizationPlan,
  storedArticleToInput,
} from '@/lib/content-optimizer';

export type GeneratedArticleRevision = Partial<Pick<
  ArticleInput,
  'title' | 'excerpt' | 'body' | 'takeaway' | 'readTime' | 'primaryKeyword' |
  'secondaryKeywords' | 'searchIntent' | 'topicCluster' | 'contentRole' | 'relatedSlugs'
>> & { editorialNotes?: string };

export type ArticleRevisionPreview = {
  before: ArticleInput;
  after: ArticleInput;
  conflicts: string[];
  editorialNotes: string;
  summary: {
    beforeWords: number;
    afterWords: number;
    changedFields: string[];
    internalLinks: number;
  };
};

const revisionFields = [
  'title', 'excerpt', 'body', 'takeaway', 'readTime', 'primaryKeyword', 'secondaryKeywords',
  'searchIntent', 'topicCluster', 'contentRole', 'relatedSlugs',
] as const;

function cleanKeyword(value: string) {
  return value.toLocaleLowerCase('id-ID')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join(' ')
    .slice(0, 160);
}

function wordCount(value: string) {
  return value.replace(/^##?\s+/gm, '').replace(/^[-*]\s+/gm, '').split(/\s+/).filter(Boolean).length;
}

function changedFields(before: ArticleInput, after: ArticleInput) {
  return revisionFields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
}

function asStored(original: StoredArticle, input: ArticleInput): StoredArticle {
  return {
    ...original,
    ...input,
    publishedLabel: original.publishedLabel,
  };
}

export function buildArticleRevisionPreview(
  original: StoredArticle,
  generated: GeneratedArticleRevision,
  allArticles: StoredArticle[],
): ArticleRevisionPreview {
  const before = storedArticleToInput(original);
  const title = generated.title?.trim() || before.title;
  const draft: ArticleInput = {
    ...before,
    ...(generated.excerpt?.trim() ? { excerpt: generated.excerpt.trim() } : {}),
    ...(generated.body?.trim() ? { body: generated.body.trim() } : {}),
    ...(generated.takeaway?.trim() ? { takeaway: generated.takeaway.trim() } : {}),
    ...(generated.readTime?.trim() ? { readTime: generated.readTime.trim() } : {}),
    ...(generated.secondaryKeywords?.length ? { secondaryKeywords: generated.secondaryKeywords } : {}),
    ...(generated.searchIntent ? { searchIntent: generated.searchIntent } : {}),
    ...(generated.topicCluster?.trim() ? { topicCluster: generated.topicCluster.trim() } : {}),
    ...(generated.contentRole ? { contentRole: generated.contentRole } : {}),
    ...(generated.relatedSlugs?.length ? { relatedSlugs: generated.relatedSlugs } : {}),
    title,
    primaryKeyword: generated.primaryKeyword?.trim() || cleanKeyword(title),
    status: 'review',
    scheduledAt: '',
    sourceReferences: before.sourceReferences,
    experienceEvidence: before.experienceEvidence,
    reviewerName: before.reviewerName,
    reviewerRole: before.reviewerRole,
    reviewedAt: before.reviewedAt,
  };
  const projected = allArticles.map((article) => article.slug === original.slug ? asStored(original, draft) : article);
  if (!projected.some((article) => article.slug === original.slug)) projected.push(asStored(original, draft));
  const plan = buildBatchOptimizationPlan(projected, [original.id])[0];
  const optimized = plan ? applyOptimizationPlan(asStored(original, draft), plan) : asStored(original, draft);
  const after = storedArticleToInput({
    ...optimized,
    status: 'review',
    scheduledAt: '',
    sourceReferences: before.sourceReferences,
    experienceEvidence: before.experienceEvidence,
    reviewerName: before.reviewerName,
    reviewerRole: before.reviewerRole,
    reviewedAt: before.reviewedAt,
  });
  const afterStored = asStored(original, after);
  const conflictArticles = allArticles.map((article) => article.slug === original.slug ? afterStored : article);
  if (!conflictArticles.some((article) => article.slug === original.slug)) conflictArticles.push(afterStored);
  const conflicts = detectCannibalization(conflictArticles)
    .filter((pair) => pair.first.slug === original.slug || pair.second.slug === original.slug)
    .map((pair) => {
      const counterpart = pair.first.slug === original.slug ? pair.second : pair.first;
      return `${pair.reason} — berpotensi bentrok dengan “${counterpart.title}”.`;
    });

  return {
    before,
    after,
    conflicts,
    editorialNotes: generated.editorialNotes?.trim() || 'Periksa fakta, contoh, dan nada sebelum menerbitkan.',
    summary: {
      beforeWords: wordCount(before.body),
      afterWords: wordCount(after.body),
      changedFields: [...changedFields(before, after)],
      internalLinks: after.relatedSlugs.length,
    },
  };
}
