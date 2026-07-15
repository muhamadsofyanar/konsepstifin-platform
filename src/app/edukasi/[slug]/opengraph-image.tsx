import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getPublishedArticleBySlug } from '@/lib/article-store';
import type { ArticleTone } from '../articles';

export const dynamic = 'force-dynamic';
export const alt = 'Artikel Edukasi Konsep STIFIn';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const toneColors: Record<ArticleTone, { primary: string; secondary: string; soft: string }> = {
  forest: { primary: '#043f2b', secondary: '#087d59', soft: '#dceee7' },
  leaf: { primary: '#315c23', secondary: '#82a927', soft: '#edf3d9' },
  sand: { primary: '#81521f', secondary: '#d7912d', soft: '#f8ead8' },
  mint: { primary: '#086348', secondary: '#39a080', soft: '#dff2eb' },
  charcoal: { primary: '#10291f', secondary: '#395548', soft: '#e3ebe7' },
};

function shorten(value: string, maximum: number) {
  if (value.length <= maximum) return value;
  return `${value.slice(0, maximum - 1).trimEnd()}…`;
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  const colors = toneColors[article?.tone ?? 'forest'];
  const title = shorten(article?.title ?? 'Edukasi Konsep STIFIn', 100);
  const excerpt = shorten(
    article?.excerpt ?? 'Wawasan praktis untuk memahami diri, hubungan, dan cara bertumbuh.',
    150,
  );
  const logo = await readFile(join(process.cwd(), 'public', 'stifin-konsep-wordmark.png'));
  const logoSource = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#f7faf8',
        color: '#10251d',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: 24,
          height: '100%',
          display: 'flex',
          background: colors.primary,
        }}
      />
      <div
        style={{
          width: 770,
          height: '100%',
          padding: '58px 44px 52px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={logoSource}
            alt=""
            width={177}
            height={84}
            style={{ width: 177, height: 84, display: 'flex', objectFit: 'contain' }}
          />
          <div
            style={{
              height: 48,
              width: 1,
              display: 'flex',
              background: '#bdd0c7',
              margin: '0 24px',
            }}
          />
          <span style={{ fontSize: 22, color: colors.primary, fontWeight: 700, letterSpacing: 2 }}>
            EDUKASI
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 20,
              color: colors.secondary,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            {article?.category ?? 'Pusat Edukasi'}
          </span>
          <h1
            style={{
              fontSize: title.length > 72 ? 46 : 54,
              lineHeight: 1.06,
              letterSpacing: -1.5,
              margin: 0,
              fontWeight: 800,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 22, lineHeight: 1.42, color: '#486056', margin: '22px 0 0' }}>
            {excerpt}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: '#52685e', fontSize: 18 }}>
          <span>konsepstifin.com</span>
          <span style={{ margin: '0 14px' }}>•</span>
          <span>{article?.readTime ?? 'Artikel edukasi'}</span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: colors.soft,
        }}
      >
        <div
          style={{
            width: 310,
            height: 310,
            borderRadius: 155,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.primary,
            boxShadow: '0 30px 60px rgba(4, 63, 43, 0.22)',
          }}
        >
          <div
            style={{
              width: 225,
              minHeight: 250,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 25px',
              background: '#ffffff',
              transform: 'rotate(-4deg)',
              boxShadow: '0 18px 38px rgba(0, 0, 0, 0.18)',
            }}
          >
            <span style={{ color: colors.secondary, fontSize: 15, fontWeight: 700, letterSpacing: 1.5 }}>
              WAWASAN PRAKTIS
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                color: colors.primary,
                fontSize: 27,
                lineHeight: 1.08,
                fontWeight: 700,
              }}
            >
              <span>Kenali diri.</span>
              <span>Bangun hubungan.</span>
              <span>Tumbuh terarah.</span>
            </div>
            <span style={{ color: '#61756c', fontSize: 14 }}>KONSEP STIFIn</span>
          </div>
        </div>
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: 58,
            display: 'flex',
            position: 'absolute',
            right: 38,
            top: 58,
            background: colors.secondary,
            opacity: 0.5,
          }}
        />
      </div>
    </div>,
    size,
  );
}
