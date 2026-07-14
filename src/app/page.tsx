const benefits = [
  ["Tes offline", "Proses pemindaian sidik jari dilakukan langsung bersama promotor."],
  ["Pendampingan", "Hasil dijelaskan agar lebih mudah diterapkan dalam keseharian."],
  ["Jaringan nasional", "Temukan promotor dan jadwal tes di berbagai kota Indonesia."],
];

const steps = [
  ["01", "Pilih lokasi", "Tentukan kota dan jadwal tes yang paling dekat."],
  ["02", "Konfirmasi jadwal", "Tim kami menghubungi Anda melalui WhatsApp."],
  ["03", "Tes langsung", "Datang ke lokasi untuk proses pemindaian sidik jari."],
  ["04", "Kenali hasil", "Dapatkan penjelasan dan arahan penerapan hasil tes."],
];

export default function Home() {
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Konsep STIFIn">
          <span className="brandMark">K</span>
          <span>Konsep STIFIn</span>
        </a>
        <nav>
          <a href="#tentang">Tentang</a>
          <a href="#proses">Cara Tes</a>
          <a href="#promotor">Promotor</a>
        </nav>
        <a className="button buttonSmall" href="#daftar">Daftar Tes</a>
      </header>

      <section className="hero shell" id="top">
        <div className="heroCopy">
          <div className="eyebrow"><span /> Tes STIFIn · Offline & Terjadwal</div>
          <h1>Kenali cara kerja terbaik diri Anda.</h1>
          <p className="lead">Temukan potensi dominan melalui Tes STIFIn dan dapatkan pendampingan untuk memahami hasilnya bersama promotor.</p>
          <div className="heroActions">
            <a className="button" href="#daftar">Cari Jadwal Tes</a>
            <a className="textLink" href="#promotor">Peluang Menjadi Promotor <span>→</span></a>
          </div>
          <div className="trustRow">
            <div><strong>Mulai Rp550 ribu</strong><span>Biaya tes</span></div>
            <div><strong>Offline</strong><span>Pemindaian langsung</span></div>
            <div><strong>Indonesia</strong><span>Jaringan promotor</span></div>
          </div>
        </div>
        <div className="heroVisual" aria-hidden="true">
          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />
          <div className="fingerprint">
            <span className="fpLabel">Kenali</span>
            <strong>Potensi<br/>Terbaikmu</strong>
            <span className="fpSub">Sensing · Thinking · Intuiting<br/>Feeling · Insting</span>
          </div>
          <div className="floatingCard cardTop"><i>✓</i><span><b>Terjadwal</b> Pilih kota terdekat</span></div>
          <div className="floatingCard cardBottom"><i>↗</i><span><b>Didampingi</b> Penjelasan hasil</span></div>
        </div>
      </section>

      <section className="softSection" id="tentang">
        <div className="shell sectionPad">
          <div className="sectionHead">
            <div><span className="kicker">Mengapa Konsep STIFIn</span><h2>Lebih dari sekadar mengikuti tes.</h2></div>
            <p>Kami membantu Anda menemukan jadwal, menjalani tes secara langsung, dan memahami hasil bersama promotor.</p>
          </div>
          <div className="benefitGrid">
            {benefits.map(([title, copy], index) => (
              <article className="benefitCard" key={title}>
                <span className="number">0{index + 1}</span>
                <h3>{title}</h3><p>{copy}</p><span className="arrow">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell sectionPad" id="proses">
        <span className="kicker">Proses Tes</span>
        <div className="processIntro"><h2>Empat langkah sederhana.</h2><p>Seluruh proses dibuat jelas, dari memilih kota sampai memahami hasil tes.</p></div>
        <div className="steps">
          {steps.map(([num, title, copy]) => <article key={num}><span>{num}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="promotor shell" id="promotor">
        <div>
          <span className="kicker kickerLight">Bertumbuh Bersama</span>
          <h2>Bangun dampak sebagai Promotor STIFIn.</h2>
          <p>Pelajari jalur WSL, persiapan alat tes, aktivasi promotor, dan dukungan pengembangan pasar bersama jaringan Konsep STIFIn.</p>
          <a className="button buttonLight" href="#daftar-promotor">Pelajari Jalur Promotor</a>
        </div>
        <div className="promotorStats"><strong>Nasional</strong><span>Terbuka untuk calon promotor dari berbagai kota di Indonesia.</span></div>
      </section>

      <section className="shell sectionPad" id="daftar">
        <div className="cta">
          <span className="kicker">Mulai dari sini</span>
          <h2>Siap mengenali potensi terbaik Anda?</h2>
          <p>Daftarkan minat Anda. Tim kami akan membantu memilih promotor, kota, dan jadwal tes.</p>
          <div className="ctaActions"><a className="button" href="mailto:halo@konsepstifin.com">Daftar Tes STIFIn</a><a className="button buttonOutline" id="daftar-promotor" href="mailto:halo@konsepstifin.com?subject=Minat%20Menjadi%20Promotor">Saya Ingin Menjadi Promotor</a></div>
          <small>Formulir pendaftaran dan integrasi WhatsApp akan diaktifkan pada tahap berikutnya.</small>
        </div>
      </section>

      <footer><div className="shell"><div className="brand"><span className="brandMark">K</span><span>Konsep STIFIn</span></div><p>Platform informasi tes dan pengembangan promotor STIFIn Indonesia.</p><span>© 2026 Konsep STIFIn</span></div></footer>
    </main>
  );
}
