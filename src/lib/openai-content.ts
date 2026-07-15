import { blocksToBody, normalizeArticleBody, type ArticleContentType, type ArticleInput } from '@/lib/article-store';
import type { ArticleBlock } from '@/app/edukasi/articles';
import { findKnowledgeContext } from '@/lib/knowledge-store';

export type ArticleGenerationRequest = {
  topic: string;
  audience: string;
  objective: string;
  category: string;
  keywords: string;
  sourceNotes: string;
  length: 'ringkas' | 'sedang' | 'mendalam';
  tone: 'hangat' | 'praktis' | 'profesional';
  contentType: ArticleContentType;
  productName: string;
  productUrl: string;
  ctaLabel: string;
  variationNumber: number;
  variationTotal: number;
  avoidTitles: string[];
  useKnowledge: boolean;
  knowledgeSourceIds: number[];
  knowledgeContext?: string;
};

type GeneratedArticle = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string | Array<{ heading: string; paragraphs: string[]; bullets: string[] }>;
  takeaway: string;
  readTime: string;
  editorialNotes: string;
};

export type AiProvider = 'gemini' | 'openai';

export class AiProviderError extends Error {
  constructor(message: string, public status = 502, public retryAfter?: number) {
    super(message);
    this.name = 'AiProviderError';
  }
}

const allowedLengths = ['ringkas', 'sedang', 'mendalam'] as const;
const allowedTones = ['hangat', 'praktis', 'profesional'] as const;
const allowedContentTypes: ArticleContentType[] = ['education', 'product', 'affiliate'];
const articleSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    category: { type: 'string' },
    excerpt: { type: 'string' },
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' } },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['heading', 'paragraphs', 'bullets'],
        additionalProperties: false,
      },
    },
    takeaway: { type: 'string' },
    readTime: { type: 'string' },
    editorialNotes: { type: 'string' },
  },
  required: ['title', 'slug', 'category', 'excerpt', 'body', 'takeaway', 'readTime', 'editorialNotes'],
} as const;

export function getAiConfiguration() {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  let provider: AiProvider | null = null;

  if (requested === 'gemini') provider = 'gemini';
  else if (requested === 'openai') provider = 'openai';
  else if (hasGemini) provider = 'gemini';
  else if (hasOpenAi) provider = 'openai';

  const ready = provider === 'gemini' ? hasGemini : provider === 'openai' ? hasOpenAi : false;
  const model = provider === 'gemini'
    ? process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
    : provider === 'openai'
      ? process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || 'gpt-5.6-luna'
      : '';

  return {
    ready,
    provider,
    providerLabel: provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Belum aktif',
    model,
  };
}

export const aiConfigured = () => getAiConfiguration().ready;

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
  const contentType = allowedContentTypes.includes(data.contentType as ArticleContentType)
    ? data.contentType as ArticleContentType : 'education';
  const productName = cleanText(data.productName, 160);
  const productUrl = cleanText(data.productUrl, 1000);
  const ctaLabel = cleanText(data.ctaLabel, 80) || 'Lihat pilihan layanan';
  const variationTotal = Math.min(5, Math.max(1, Number(data.variationTotal) || 1));
  const variationNumber = Math.min(variationTotal, Math.max(1, Number(data.variationNumber) || 1));
  const avoidTitles = Array.isArray(data.avoidTitles)
    ? data.avoidTitles.map((title) => cleanText(title, 180)).filter(Boolean).slice(0, 20) : [];
  const useKnowledge = data.useKnowledge !== false;
  const knowledgeSourceIds = Array.isArray(data.knowledgeSourceIds)
    ? [...new Set(data.knowledgeSourceIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 30)
    : [];

  if (topic.length < 8) throw new Error('Topik minimal 8 karakter.');
  if (audience.length < 3) throw new Error('Tentukan pembaca sasaran.');
  if (objective.length < 8) throw new Error('Tujuan artikel minimal 8 karakter.');
  if (contentType !== 'education' && (!productName || !productUrl)) {
    throw new Error('Nama dan alamat produk wajib diisi untuk artikel produk atau affiliate.');
  }
  return {
    topic, audience, objective, category, keywords, sourceNotes, length, tone,
    contentType, productName, productUrl, ctaLabel, variationNumber, variationTotal, avoidTitles,
    useKnowledge, knowledgeSourceIds,
  };
}

function buildArticlePrompt(input: ArticleGenerationRequest) {
  const wordTargets = { ringkas: '600–800', sedang: '900–1.200', mendalam: '1.400–1.800' };
  const knowledgeInstruction = input.knowledgeContext
    ? `Gunakan potongan Pustaka STIFIn berikut sebagai landasan utama. Nomor halaman hanya untuk jejak pemeriksaan admin. Jangan mengarang isi yang tidak terdapat di dalam potongan. Jangan menyalin panjang secara verbatim.\n\n${input.knowledgeContext}`
    : input.useKnowledge
      ? 'Tidak ditemukan potongan Pustaka STIFIn yang relevan. Jangan membuat klaim khusus tentang STIFIn yang tidak diberikan oleh admin.'
      : 'Pustaka STIFIn tidak dipakai pada permintaan ini.';
  const sourceInstruction = input.sourceNotes
    ? `Catatan tambahan admin:\n${input.sourceNotes}`
    : 'Tidak ada catatan tambahan admin. Hindari angka, riset, kutipan, atau klaim ilmiah spesifik yang tidak dapat diverifikasi.';
  const contentInstruction = input.contentType === 'education'
    ? 'Jenis konten: edukasi umum. Fokus pada manfaat pembaca dan jangan memaksakan penjualan.'
    : input.contentType === 'product'
      ? `Jenis konten: edukasi dengan rekomendasi produk “${input.productName}”. Jelaskan konteks kebutuhan secara wajar tanpa janji hasil atau klaim berlebihan.`
      : `Jenis konten: artikel affiliate transparan untuk produk “${input.productName}”. Tetap utamakan edukasi, jangan berpura-pura memiliki pengalaman pribadi, dan jangan menyembunyikan sifat promosinya.`;
  const variationInstruction = input.variationTotal > 1
    ? `Ini artikel ${input.variationNumber} dari ${input.variationTotal}. Pilih sudut pandang, judul, pembuka, dan struktur yang berbeda dari artikel lain dalam paket.`
    : 'Buat satu artikel dengan sudut pandang yang spesifik dan tidak generik.';
  const avoidInstruction = input.avoidTitles.length
    ? `Jangan memakai atau mendekati judul berikut:\n- ${input.avoidTitles.join('\n- ')}`
    : 'Tidak ada daftar judul yang perlu dihindari.';

  return {
    systemInstruction: [
      'Anda adalah editor senior berbahasa Indonesia untuk pusat edukasi umum Konsep STIFIn.',
      'Tulis artikel yang ringan, praktis, menghargai perbedaan, dan tidak memberi diagnosis atau janji hasil.',
      'Jangan mengarang kutipan, penelitian, statistik, kredensial, atau sumber.',
      'Jangan menyatakan STIFIn sebagai pengganti layanan medis, psikologis, pendidikan, atau profesional.',
      'Field body wajib berupa array berisi 3–5 bagian yang runtut. Setiap bagian memiliki heading, paragraphs, dan bullets.',
      'Setiap isi paragraphs harus berupa paragraf utuh sepanjang 2–4 kalimat. Isi bullets dengan array kosong jika daftar tidak diperlukan.',
      'Hindari pembuka klise, pengulangan definisi, kalimat terlalu panjang, nada menggurui, dan kesimpulan yang sekadar mengulang pembuka.',
      'Slug hanya huruf kecil, angka, dan tanda hubung. Hasil selalu draf yang perlu ditinjau manusia.',
    ].join(' '),
    userInput: [
      `Topik: ${input.topic}`,
      `Pembaca: ${input.audience}`,
      `Tujuan: ${input.objective}`,
      `Kategori: ${input.category}`,
      `Kata kunci: ${input.keywords || '-'}`,
      `Nada: ${input.tone}`,
      `Panjang target: ${wordTargets[input.length]} kata`,
      contentInstruction,
      variationInstruction,
      avoidInstruction,
      knowledgeInstruction,
      sourceInstruction,
      'Pada editorialNotes, tuliskan singkat bagian faktual yang tetap perlu dicek admin sebelum diterbitkan.',
    ].join('\n'),
  };
}

function openAiOutputText(result: Record<string, unknown>) {
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

function geminiOutputText(result: Record<string, unknown>) {
  if (typeof result.text === 'string') return result.text;
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== 'object') continue;
    const parts = Array.isArray((content as { parts?: unknown[] }).parts)
      ? (content as { parts: unknown[] }).parts : [];
    const text = parts.map((part) => part && typeof part === 'object'
      ? String((part as { text?: unknown }).text ?? '') : '').join('');
    if (text) return text;
  }
  if (typeof result.title === 'string' && typeof result.body === 'string') return JSON.stringify(result);
  return '';
}

async function responseJson(response: Response) {
  const text = await response.text();
  if (!text) return {} as Record<string, unknown>;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text } as Record<string, unknown>;
  }
}

function apiErrorMessage(result: Record<string, unknown>) {
  return result.error && typeof result.error === 'object'
    ? String((result.error as { message?: unknown }).message ?? '') : '';
}

async function generateWithGemini(input: ArticleGenerationRequest, model: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiProviderError('GEMINI_API_KEY belum dikonfigurasi di Coolify.', 503);
  const prompt = buildArticlePrompt(input);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt.userInput }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: articleSchema,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const result = await responseJson(response);
  if (!response.ok) {
    const detail = apiErrorMessage(result);
    console.error('Gemini article generation failed', response.status, detail);
    const retryAfter = Number(response.headers.get('retry-after')) || undefined;
    if (response.status === 429) {
      throw new AiProviderError('Batas gratis Gemini sedang tercapai. Tunggu sebentar lalu coba kembali, atau cek Rate Limits di Google AI Studio.', 429, retryAfter);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiProviderError('API key Gemini tidak valid atau belum diizinkan. Periksa GEMINI_API_KEY di Coolify.', 503);
    }
    if (response.status === 400 || response.status === 404) {
      throw new AiProviderError('Model Gemini tidak tersedia untuk API key ini. Periksa GEMINI_MODEL di Coolify.', 400);
    }
    throw new AiProviderError('Gemini belum dapat membuat artikel. Coba lagi atau periksa status layanan Google AI.', 502);
  }
  return geminiOutputText(result);
}

async function generateWithOpenAi(input: ArticleGenerationRequest, model: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AiProviderError('OPENAI_API_KEY belum dikonfigurasi di Coolify.', 503);
  const prompt = buildArticlePrompt(input);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: prompt.systemInstruction,
      input: prompt.userInput,
      text: {
        format: {
          type: 'json_schema',
          name: 'konsepstifin_article_draft',
          strict: true,
          schema: { ...articleSchema, additionalProperties: false },
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const result = await responseJson(response);
  if (!response.ok) {
    const detail = apiErrorMessage(result);
    console.error('OpenAI article generation failed', response.status, detail);
    const retryAfter = Number(response.headers.get('retry-after')) || undefined;
    if (response.status === 429) {
      throw new AiProviderError('Kuota atau saldo OpenAI habis. Isi billing OpenAI atau ubah AI_PROVIDER ke gemini.', 429, retryAfter);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiProviderError('API key OpenAI tidak valid atau tidak memiliki izin.', 503);
    }
    throw new AiProviderError('OpenAI belum dapat membuat artikel. Periksa API key, model, dan saldo API.', 502);
  }
  return openAiOutputText(result);
}

function parseGeneratedArticle(raw: string) {
  if (!raw) throw new AiProviderError('AI tidak mengembalikan isi artikel. Silakan coba lagi.', 502);
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned) as GeneratedArticle;
  } catch {
    throw new AiProviderError('Format hasil AI tidak valid. Silakan coba lagi.', 502);
  }
}

function generatedBodyToText(value: GeneratedArticle['body']) {
  if (!Array.isArray(value)) return normalizeArticleBody(cleanText(value, 50_000));
  const blocks: ArticleBlock[] = value.flatMap((section) => {
    if (!section || typeof section !== 'object') return [];
    const heading = cleanText(section.heading, 160) || 'Pembahasan';
    const paragraphs = Array.isArray(section.paragraphs)
      ? section.paragraphs.map((paragraph) => cleanText(paragraph, 3000)).filter(Boolean).slice(0, 12)
      : [];
    const bullets = Array.isArray(section.bullets)
      ? section.bullets.map((bullet) => cleanText(bullet, 600)).filter(Boolean).slice(0, 12)
      : [];
    if (!paragraphs.length && !bullets.length) return [];
    return [{ heading, paragraphs, bullets: bullets.length ? bullets : undefined }];
  });
  return normalizeArticleBody(blocksToBody(blocks));
}

export async function generateArticleDraft(input: ArticleGenerationRequest) {
  const configuration = getAiConfiguration();
  if (!configuration.provider || !configuration.ready) {
    const variable = configuration.provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
    throw new AiProviderError(`${variable} belum dikonfigurasi di Coolify.`, 503);
  }

  let knowledge = { context: '', references: [] as Awaited<ReturnType<typeof findKnowledgeContext>>['references'] };
  if (input.useKnowledge) {
    try {
      const result = await findKnowledgeContext({
        query: `${input.topic} ${input.category} ${input.keywords}`,
        sourceIds: input.knowledgeSourceIds,
      });
      knowledge = { context: result.context, references: result.references };
    } catch (error) {
      console.error('Pustaka STIFIn tidak dapat dicari.', error);
      throw new AiProviderError('Pustaka STIFIn tidak dapat dibaca. Periksa database lalu coba kembali.', 503);
    }
  }
  const groundedInput = { ...input, knowledgeContext: knowledge.context };
  const raw = configuration.provider === 'gemini'
    ? await generateWithGemini(groundedInput, configuration.model)
    : await generateWithOpenAi(groundedInput, configuration.model);
  const generated = parseGeneratedArticle(raw);
  const slugSource = generated.slug || generated.title;
  const slug = cleanText(slugSource, 180).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
  const article: ArticleInput = {
    title: cleanText(generated.title, 180),
    slug,
    category: cleanText(generated.category, 80) || input.category,
    excerpt: cleanText(generated.excerpt, 400),
    body: generatedBodyToText(generated.body),
    takeaway: cleanText(generated.takeaway, 500),
    readTime: cleanText(generated.readTime, 40) || '5 menit baca',
    publishedAt: new Date().toISOString().slice(0, 10),
    tone: 'forest',
    featured: false,
    status: 'draft',
    contentType: input.contentType,
    productName: input.productName,
    productUrl: input.productUrl,
    ctaLabel: input.ctaLabel,
    scheduledAt: '',
    sourceReferences: knowledge.references,
  };
  if (!article.title || !article.slug || !article.excerpt || !article.body) {
    throw new AiProviderError('Hasil AI belum lengkap. Silakan coba lagi.', 502);
  }
  return {
    article,
    editorialNotes: cleanText(generated.editorialNotes, 1000),
    model: configuration.model,
    provider: configuration.provider,
    sources: knowledge.references,
  };
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
