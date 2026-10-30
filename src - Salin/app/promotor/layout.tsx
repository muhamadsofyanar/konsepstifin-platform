import { PublicHeader,PublicFooter } from '../public-site-shell';
export default function Layout({children}:{children:React.ReactNode}){return <div className="public-site journey-site"><PublicHeader active="location" announcement="Temukan promotor berdasarkan data dan cakupan wilayah yang tersedia" ctaHref="/tes-stifin#layanan" ctaLabel="Pilih layanan tes"/>{children}<PublicFooter/></div>;}
