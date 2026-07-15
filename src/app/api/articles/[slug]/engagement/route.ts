import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { databaseConfigured } from '@/lib/article-store';
import { createComment, getPublicEngagement, recordShare, recordView, toggleLike, type CommentStatus } from '@/lib/engagement-store';
import { moderateComment } from '@/lib/openai-content';
import { checkRateLimit } from '@/lib/rate-limit';

const VISITOR_COOKIE = 'ks_visitor';
const validChannels = ['native', 'whatsapp', 'facebook', 'linkedin', 'x', 'copy'];

function visitor(request: NextRequest) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9-]{20,80}$/.test(existing)) return { token: existing, fresh: false };
  return { token: randomUUID(), fresh: true };
}

function withVisitorCookie(response: NextResponse, token: string, fresh: boolean) {
  if (fresh) response.cookies.set(VISITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!databaseConfigured()) return NextResponse.json({ available: false, likes: 0, liked: false, comments: [] });
  const { slug } = await params;
  const currentVisitor = visitor(request);
  try {
    const engagement = await getPublicEngagement(slug, currentVisitor.token);
    if (!engagement) return NextResponse.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
    return withVisitorCookie(NextResponse.json({ available: true, ...engagement }, {
      headers: { 'Cache-Control': 'private, no-store' },
    }), currentVisitor.token, currentVisitor.fresh);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ available: false, likes: 0, liked: false, comments: [] }, { status: 503 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!databaseConfigured()) return NextResponse.json({ message: 'Fitur interaksi belum tersedia.' }, { status: 503 });
  const { slug } = await params;
  const currentVisitor = visitor(request);
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ message: 'Permintaan tidak valid.' }, { status: 400 });
  }
  const action = String(data.action ?? '');

  try {
    if (action === 'view') {
      const rate = checkRateLimit(request, `view:${slug}`, 30, 60 * 1000);
      if (!rate.allowed) return NextResponse.json({ ok: true });
      await recordView(slug, currentVisitor.token);
      return withVisitorCookie(NextResponse.json({ ok: true }), currentVisitor.token, currentVisitor.fresh);
    }

    if (action === 'like') {
      const rate = checkRateLimit(request, `like:${slug}`, 20, 60 * 1000);
      if (!rate.allowed) return NextResponse.json({ message: 'Terlalu banyak permintaan.' }, { status: 429 });
      const result = await toggleLike(slug, currentVisitor.token);
      if (!result) return NextResponse.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
      return withVisitorCookie(NextResponse.json(result), currentVisitor.token, currentVisitor.fresh);
    }

    if (action === 'share') {
      const channel = String(data.channel ?? '');
      if (!validChannels.includes(channel)) return NextResponse.json({ message: 'Kanal berbagi tidak valid.' }, { status: 400 });
      const rate = checkRateLimit(request, `share:${slug}`, 30, 60 * 1000);
      if (rate.allowed) await recordShare(slug, currentVisitor.token, channel);
      return withVisitorCookie(NextResponse.json({ ok: true }), currentVisitor.token, currentVisitor.fresh);
    }

    if (action === 'comment') {
      const rate = checkRateLimit(request, `comment:${slug}`, 4, 30 * 60 * 1000);
      if (!rate.allowed) {
        return NextResponse.json({ message: 'Terlalu banyak komentar. Coba kembali nanti.' }, {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfter) },
        });
      }
      if (String(data.website ?? '').trim()) return NextResponse.json({ ok: true, pending: true });
      const name = String(data.name ?? '').trim().slice(0, 80);
      const email = String(data.email ?? '').trim().toLowerCase().slice(0, 180);
      const body = String(data.body ?? '').trim().slice(0, 2000);
      if (name.length < 2) return NextResponse.json({ message: 'Nama minimal 2 karakter.' }, { status: 400 });
      if (body.length < 10) return NextResponse.json({ message: 'Komentar minimal 10 karakter.' }, { status: 400 });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ message: 'Format email tidak valid.' }, { status: 400 });
      const moderation = await moderateComment(body);
      const status: CommentStatus = moderation.flagged ? 'spam' : 'pending';
      const id = await createComment(slug, { name, email, body, status });
      if (!id) return NextResponse.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
      return withVisitorCookie(NextResponse.json({ ok: true, pending: true }, { status: 201 }), currentVisitor.token, currentVisitor.fresh);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Interaksi belum dapat disimpan.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Aksi tidak dikenal.' }, { status: 400 });
}

