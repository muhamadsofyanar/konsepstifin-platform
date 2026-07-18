import Image from 'next/image';

const activities = [
  {
    src: '/images/dokumentasi/tes-keluarga.webp',
    width: 1280,
    height: 960,
    title: 'Pendampingan keluarga',
    caption: 'Pembahasan bersama peserta dilakukan secara langsung dan personal.',
    alt: 'Promotor mendampingi keluarga melihat penjelasan melalui laptop',
  },
  {
    src: '/images/dokumentasi/pemindaian-sidik-jari.webp',
    width: 960,
    height: 1280,
    title: 'Tes dilakukan offline',
    caption: 'Pemindaian sidik jari menggunakan perangkat dan aplikasi pendukung.',
    alt: 'Proses pemindaian sidik jari secara langsung menggunakan scanner dan laptop',
  },
  {
    src: '/images/dokumentasi/pendampingan-peserta.webp',
    width: 1280,
    height: 963,
    title: 'Hasil dibahas bersama',
    caption: 'Peserta mendapat ruang untuk bertanya dan memahami hasilnya.',
    alt: 'Promotor menjelaskan hasil kepada peserta secara tatap muka',
  },
  {
    src: '/images/dokumentasi/kegiatan-kelompok.webp',
    width: 1296,
    height: 728,
    title: 'Kegiatan kelompok',
    caption: 'Pelaksanaan dapat disesuaikan untuk komunitas dan kelompok.',
    alt: 'Pendampingan peserta dalam kegiatan kelompok STIFIn',
  },
  {
    src: '/images/dokumentasi/workshop-edukasi.webp',
    width: 1800,
    height: 1011,
    title: 'Workshop dan edukasi',
    caption: 'Pembelajaran dilakukan melalui diskusi dan aktivitas terarah.',
    alt: 'Peserta mengikuti kegiatan workshop dan diskusi kelompok',
  },
  {
    src: '/images/dokumentasi/jejaring-promotor.webp',
    width: 1800,
    height: 1011,
    title: 'Jejaring promotor',
    caption: 'Kegiatan belajar mempertemukan peserta dalam jejaring yang nyata.',
    alt: 'Foto bersama peserta kegiatan dan jejaring promotor',
  },
] as const;

export default function ActivityGallery() {
  return <section className="section real-activity" aria-labelledby="real-activity-title">
    <div className="real-activity-heading">
      <div><span>DOKUMENTASI KEGIATAN NYATA</span><h2 id="real-activity-title">Bukan sekadar ilustrasi. Inilah sebagian proses yang benar-benar berlangsung.</h2></div>
      <p>Tes, pembahasan hasil, workshop, dan kegiatan kelompok dilakukan bersama peserta secara langsung. Foto-foto ini berasal dari dokumentasi kegiatan tim Konsep STIFIn.</p>
    </div>
    <div className="real-activity-grid">
      {activities.map((activity, index) => <figure className={index === 0 ? 'activity-wide' : ''} key={activity.src}>
        <Image src={activity.src} alt={activity.alt} width={activity.width} height={activity.height} sizes="(max-width: 720px) 100vw, (max-width: 1050px) 50vw, 33vw" />
        <figcaption><b>{activity.title}</b><span>{activity.caption}</span></figcaption>
      </figure>)}
    </div>
    <p className="real-activity-note">Dokumentasi asli kegiatan. Identitas peserta tidak digunakan sebagai klaim hasil atau testimoni.</p>
  </section>;
}
