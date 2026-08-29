# Deploy Fix v0.2.6

## Penyebab kegagalan

Repository tujuan masih menyimpan `src/lib/interest-service.ts` dari revisi
lama. File tersebut tidak terdapat di paket v0.2.6, sehingga proses menimpa
isi repository tidak menghapusnya. Next.js tetap memasukkan seluruh file
TypeScript ke pemeriksaan tipe dan gagal pada impor API promotor lama.

## Perbaikan

Paket ini menyertakan compatibility tombstone pada path yang sama untuk
menimpa file lama. Alur lead aktif tetap menggunakan:

- `src/lib/interest-store.ts`
- `src/app/api/interests/route.ts`

Tidak ada fitur aktif, skema database, atau rute publik yang diubah.

## Validasi

Paket telah diuji dengan instalasi bersih dan `npm run build` menggunakan
Node.js 22. Pemeriksaan TypeScript, kompilasi produksi, dan pembuatan 22
halaman statis berhasil.
