import { ImageResponse } from 'next/og';

export const brandOgSize = { width: 1200, height: 630 };

export function createBrandOgImage({ eyebrow, title, description, accent = '#8aaa2d' }: { eyebrow: string; title: string; description: string; accent?: string }) {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', background: '#f3f8f5', color: '#102019', padding: 70, fontFamily: 'Arial, sans-serif', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', width: 430, height: 430, borderRadius: 999, background: '#07563e', right: -70, bottom: -120 }} />
    <div style={{ position: 'absolute', width: 230, height: 230, borderRadius: 999, background: '#cfe4d9', right: 120, top: -70 }} />
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><div style={{ width: 54, height: 54, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#043f2b', color: 'white', fontSize: 28, fontWeight: 800 }}>K</div><div style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 28 }}>Konsep STIFIn</b><span style={{ fontSize: 14, letterSpacing: 3, color: '#547066' }}>PUSAT LAYANAN & EDUKASI</span></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><span style={{ fontSize: 18, color: '#087454', fontWeight: 800, letterSpacing: 4 }}>{eyebrow}</span><h1 style={{ margin: 0, fontSize: 70, lineHeight: 1.05, letterSpacing: -3 }}>{title}</h1><p style={{ margin: 0, fontSize: 25, lineHeight: 1.5, color: '#42584e', maxWidth: 790 }}>{description}</p></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, color: '#476057' }}><span style={{ width: 54, height: 5, background: accent, borderRadius: 8 }} />konsepstifin.com</div>
    </div>
  </div>, { ...brandOgSize });
}
