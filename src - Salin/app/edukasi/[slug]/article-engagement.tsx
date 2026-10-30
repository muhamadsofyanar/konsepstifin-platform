'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type PublicComment = { id: number; name: string; body: string; createdAt: string };
type Engagement = { available: boolean; likes: number; liked: boolean; comments: PublicComment[] };

const initialEngagement: Engagement = { available: true, likes: 0, liked: false, comments: [] };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function ArticleEngagement({ slug, title }: { slug: string; title: string }) {
  const [engagement, setEngagement] = useState(initialEngagement);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', body: '', website: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const endpoint = `/api/articles/${encodeURIComponent(slug)}/engagement`;
  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      const result = await response.json();
      if (response.ok) setEngagement(result);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void (async () => {
      await load();
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      }).catch(() => undefined);
    })();
  }, [endpoint, load]);

  async function like() {
    setLiking(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Respons belum dapat disimpan.');
      setEngagement((current) => ({ ...current, likes: result.likes, liked: result.liked }));
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : 'Respons belum dapat disimpan.');
    } finally {
      setLiking(false);
    }
  }

  function trackShare(channel: string) {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', channel }),
    }).catch(() => undefined);
  }

  async function share(channel: 'native' | 'whatsapp' | 'facebook' | 'linkedin' | 'x' | 'copy') {
    const url = window.location.href;
    const text = `${title} — Konsep STIFIn`;
    if (channel === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          trackShare(channel);
        } catch {
          // Pembaca membatalkan dialog berbagi.
        }
      } else {
        await navigator.clipboard.writeText(url);
        setMessage('Tautan artikel sudah disalin.');
        trackShare('copy');
      }
      return;
    }
    if (channel === 'copy') {
      await navigator.clipboard.writeText(url);
      setMessage('Tautan artikel sudah disalin.');
      trackShare(channel);
      return;
    }
    const destinations = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    if (!(channel in destinations)) return;
    window.open(destinations[channel as keyof typeof destinations], '_blank', 'noopener,noreferrer,width=760,height=620');
    trackShare(channel);
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    setCommenting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', ...form }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Komentar gagal dikirim.');
      setForm({ name: '', email: '', body: '', website: '' });
      setMessage('Terima kasih. Komentar menunggu pemeriksaan admin sebelum tampil.');
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Komentar gagal dikirim.');
    } finally {
      setCommenting(false);
    }
  }

  return <section className="article-engagement">
    <div className="article-reaction-row">
      <div><span>APAKAH ARTIKEL INI BERMANFAAT?</span><button className={engagement.liked ? 'liked' : ''} onClick={like} disabled={liking || loading || !engagement.available}>♡ <b>{engagement.liked ? 'Bermanfaat' : 'Tandai bermanfaat'}</b><small>{engagement.likes}</small></button></div>
      <div className="article-share"><span>BAGIKAN</span><div><button onClick={() => void share('native')}>Bagikan</button><button onClick={() => void share('whatsapp')}>WhatsApp</button><button onClick={() => void share('facebook')}>Facebook</button><button onClick={() => void share('linkedin')}>LinkedIn</button><button onClick={() => void share('x')}>X</button><button onClick={() => void share('copy')}>Salin tautan</button></div></div>
    </div>

    {message && <p className="engagement-message success">✓ {message}</p>}
    {error && <p className="engagement-message error">{error}</p>}

    {engagement.available && <div className="article-comments">
      <div className="comments-heading"><span>RUANG DISKUSI</span><h2>Komentar pembaca</h2><p>Komentar ditinjau terlebih dahulu agar percakapan tetap aman dan relevan.</p></div>
      <form onSubmit={submitComment}>
        <div><label>Nama<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={80} required /></label><label>Email <small>(tidak ditampilkan)</small><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={180} /></label></div>
        <label className="comment-honeypot" aria-hidden="true">Website<input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} tabIndex={-1} autoComplete="off" /></label>
        <label>Komentar<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} minLength={10} maxLength={2000} rows={5} placeholder="Bagikan pemikiran atau pengalaman yang relevan…" required /></label>
        <p>Dengan mengirim komentar, Anda menyetujui komentar diperiksa dan ditampilkan bersama nama Anda. Jangan cantumkan data pribadi atau informasi rahasia.</p>
        <button type="submit" disabled={commenting}>{commenting ? 'Mengirim…' : 'Kirim komentar →'}</button>
      </form>
      <div className="comment-list">{engagement.comments.length ? engagement.comments.map((comment) => <article key={comment.id}><header><b>{comment.name}</b><time dateTime={comment.createdAt}>{dateLabel(comment.createdAt)}</time></header><p>{comment.body}</p></article>) : <div className="empty-comments"><b>Belum ada komentar yang diterbitkan.</b><p>Jadilah pembaca pertama yang membuka percakapan.</p></div>}</div>
    </div>}
  </section>;
}
