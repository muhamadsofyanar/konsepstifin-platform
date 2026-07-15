import type { ArticleInput } from '@/lib/article-store';

export type ArticleGenerationRequest = {
  topic: string;
  audience: string;
  objective: string;
  category: string;
  keywords: string;
  sourceNotes: string;
  length: 'ringkas' | 'sedang' | 'mendalam';
  tone: 'hangat' | 'praktis' | 'profesional';
};

type GeneratedArticle = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  takeaway: string;
  readTime: string;
  editorialNotes: string;
};

const allowedLengths = ['ringkas', 'sedang', 'mendalam'] as const;
const allowedTones = ['hangat', 'praktis', 'profesional'] as const;

export const aiConfigured = () => Boolean(process.env.OPENAI_API_KEY);

function cleanText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

export function validateGenerationRequest(value: unknown): ArticleGenerationRequest {
  if (!value || typeof value !== 'object') throw new Error('Permintaan artikel tidak valid.');
  const data = value as Record<string, unknown>;
  const topic = cleanText(data.topic, 240);
  const audience = cleanText(data.audience, 160);
  const objective = cleanText(data.objective, 240);
  const category = cleanText(data.category, 80) || 'Pengembangan Diri';
  const keywords = cleanText(data.keywords, 300);
  const sourceNotes = cleanText(data.sourceNotes, 6000);
  const length = allowedLengths.includes(data.length as typeof allowedLengths[number])
    ? data.length as ArticleGenerationRequest['length'] : 'sedang';
  const tone = allowedTones.includes(data.tone as typeof allowedTones[number])
    ? data.tone as ArticleGenerationRequest['tone'] : 'hangat';

  if (topic.length < 8) throw new Error('Topik minimal 8 karakter.');
  if (audience.length < 3) throw new Error('Tentukan pembaca sasaran.');
  if (objective.length < 8) throw new Error('Tujuan artikel minimal 8 karakter.');
  return { topic, audience, objective, category, keywords, sourceNotes, length, tone };
}

function outputText(result: Record<string, unknown>) {
  const outputs = Array.isArray(result.output) ? result.output : [];
  for (const output of outputs) {
    if (!output || typeof output !== 'object') continue;
    const content = Array.isArray((output as { content?: unknown[] }).content)
      ? (output as { content: unknown[] }).content : [];
    for (const item of content) {
      if (item && typeof item === 'object' && (item as { type?: string }).type === 'output_text') {
        return String((item as { text?: unknown }).text ?? '');
      }
    }
  }
  return '';
}

export async function generateArticleDraft(input: ArticleGenerationRequest) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY belum dikonfigurasi di Coolify.');
  const model = process.env.AI_MODEL?.trim() || 'gpt-5.6-luna';
  const wordTargets = { ringkas: '600–800', sedang: '900–1.200', mendalam: '1.400–1.800' };
  const sourceInstruction = input.sourceNotes
    ? `Gunakan catatan sumber admin berikut sebagai batas fakta utama:\n${input.sourceNotes}`
    : 'Tidak ada catatan sumber khusus. Hindari angka, riset, kutipan, atau klaim ilmiah spesifik yang tidak dapat diverifikasi.';

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: [
        'Anda adalah editor senior berbahasa Indonesia untuk pusat edukasi umum Konsep STIFIn.',
        'Tulis artikel yang ringan, praktis, menghargai perbedaan, dan tidak memberi diagnosis atau janji hasil.',
        'Jangan mengarang kutipan, penelitian, statistik, kredensial, atau sumber.',
        'Jangan menyatakan STIFIn sebagai pengganti layanan medis, psikologis, pendidikan, atau profesional.',
        'Isi body memakai format sederhana: setiap subjudul diawali ##, daftar diawali -, dan paragraf dipisahkan baris kosong.',
        'Slug hanya huruf kecil, angka, dan tanda hubung. Hasil selalu draf yang perlu ditinjau manusia.',
      ].join(' '),
      input: [
        `Topik: ${input.topic}`,
        `Pembaca: ${input.audience}`,
        `Tujuan: ${input.objective}`,
        `Kategori: ${input.category}`,
        `Kata kunci: ${input.keywords || '-'}`,
        `Nada: ${input.tone}`,
        `Panjang target: ${wordTargets[input.length]} kata`,
        sourceInstruction,
        'Pada editorialNotes, tuliskan singkat bagian faktual yang tetap perlu dicek admin sebelum diterbitkan.',
      ].join('\n'),
      text: {
        format: {
          type: 'json_schema',
          name: 'konsepstifin_article_draft',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              slug: { type: 'string' },
              category: { type: 'string' },
              excerpt: { type: 'string' },
              body: { type: 'string' },
              takeaway: { type: 'string' },
              readTime: { type: 'string' },
              editorialNotes: { type: 'string' },
            },
            required: ['title', 'slug', 'category', 'excerpt', 'body', 'takeaway', 'readTime', 'editorialNotes'],
          },
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const apiError = result.error && typeof result.error === 'object'
      ? String((result.error as { message?: unknown }).message ?? '') : '';
    console.error('OpenAI article generation failed', response.status, apiError);
    throw new Error(response.status === 429
      ? 'Batas penggunaan AI sedang tercapai. Coba lagi beberapa saat.'
      : 'AI belum dapat membuat artikel. Periksa API key, model, dan saldo API.');
  }

  const raw = outputText(result);
  if (!raw) throw new Error('AI tidak mengembalikan isi artikel. Silakan coba lagi.');
  let generated: GeneratedArticle;
  try {
    generated = JSON.parse(raw) as GeneratedArticle;
  } catch {
    throw new Error('Format hasil AI tidak valid. Silakan coba lagi.');
  }

  const slug = generated.slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
  const article: ArticleInput = {
    title: cleanText(generated.title, 180),
    slug,
    category: cleanText(generated.category, 80) || input.category,
    excerpt: cleanText(generated.excerpt, 400),
    body: cleanText(generated.body, 50_000),
    takeaway: cleanText(generated.takeaway, 500),
    readTime: cleanText(generated.readTime, 40) || '5 menit baca',
    publishedAt: new Date().toISOString().slice(0, 10),
    tone: 'forest',
    featured: false,
    status: 'draft',
  };
  return { article, editorialNotes: cleanText(generated.editorialNotes, 1000), model };
}

export async function moderateComment(text: string) {
  if (!process.env.OPENAI_API_KEY) return { flagged: false, checked: false };
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return { flagged: false, checked: false };
    const result = await response.json() as { results?: Array<{ flagged?: boolean }> };
    return { flagged: Boolean(result.results?.[0]?.flagged), checked: true };
  } catch (error) {
    console.error('Moderasi komentar tidak tersedia.', error);
    return { flagged: false, checked: false };
  }
}

