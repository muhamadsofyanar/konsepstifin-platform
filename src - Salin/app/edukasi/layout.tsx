import { PublicFooter, PublicHeader } from '../public-site-shell';

export default function EducationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-site education-site">
    <PublicHeader active="education" announcement="Edukasi berbasis Pustaka untuk pengembangan diri, keluarga, belajar, dan kolaborasi" />
    {children}
    <PublicFooter />
  </div>;
}
