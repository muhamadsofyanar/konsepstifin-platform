import Link from 'next/link';
import { getActivePromotion } from '@/lib/promotion-store';
const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
function dateLabel(value: string) { const [y,m,d] = value.split('-').map(Number); return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d))); }
export default async function PublicPromotionBanner({ family = true, workshop = true, compact = false }: { family?: boolean; workshop?: boolean; compact?: boolean }) {
  const { settings, active, familyActive, workshopActive } = await getActivePromotion();
  if (!active || (!familyActive || !family) && (!workshopActive || !workshop)) return null;
  return <section className={`public-promo-banner${compact ? ' compact' : ''}`} aria-label="Program promo pusat">
    <div className="public-promo-heading"><span>PROGRAM RESMI PUSAT</span><h2>Promo Family Test & Year-End Workshop</h2><p>Berlaku {dateLabel(settings.startDate)} sampai {dateLabel(settings.endDate)}. Program opsional, mengikuti ketentuan pusat.</p></div>
    <div className="public-promo-cards">
      {family && familyActive && <article><small>UNTUK PROMOTOR & PESERTA KELUARGA</small><h3>Family Test</h3><p>Bayar sesuai jumlah tes berbayar, lalu dapatkan tes bonus sesuai skema.</p><ul>{settings.familySchemes.map(s=><li key={s.key}><b>{s.label}</b><span>Minimal {rupiah(s.paidTests * settings.minimumPaidTestPrice)}</span></li>)}</ul><p className="promo-minimum">Harga jual minimal: <b>{rupiah(settings.minimumPaidTestPrice)}</b> per tes berbayar.</p><Link href="/tes-stifin#promo-family">Lihat skema & ajukan Family Test →</Link></article>}
      {workshop && workshopActive && <article><small>UNTUK CABANG</small><h3>Year-End Workshop</h3><ul><li><b>WSL 1</b><span>{rupiah(settings.workshopPrices.wsl1)}</span></li><li><b>WSL 2</b><span>{rupiah(settings.workshopPrices.wsl2)}</span></li><li><b>WST</b><span>{rupiah(settings.workshopPrices.wst)}</span></li></ul><p className="promo-minimum">Harga khusus selama periode promo. Jadwal dan detail program dikonfirmasi kepada tim.</p><Link href="/jadi-promotor#year-end-workshop">Lihat harga workshop →</Link></article>}
    </div>
  </section>;
}
