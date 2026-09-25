# Langkah Si Kecil — PWA 0–12 bulan

Aplikasi aktivitas bayi, pengamatan keluarga, catatan kekhawatiran, dan panduan tambahan untuk ibu. Dataset master asli dipertahankan. Konten publik versi ini menggunakan **konfirmasi pemilik produk pada 25 September 2026** bahwa seluruh konten telah ditinjau dan valid. Berkas `content/release/attestation.json` mencatat pernyataan tersebut serta checksum workbook dan JSON yang disetujuinya. Identitas peninjau, tanggal peninjauan sebenarnya, dan laporan klinis independen tidak diberikan, sehingga aplikasi tidak mengklaim verifikasi klinis independen.

## Struktur

- `content/master/LSK_master_dataset_0-12_bulan_v4.xlsx`: workbook master asli, tidak disunting (SHA-256 `7da00c57452a6b7642f5755497c31ec07a08e447fbdf3804ba8b8a36f1d7e025`).
- `content/data/*.json`: ekstraksi asli, termasuk 122 aktivitas, 90 skill, 20 sumber, 244 pemetaan, dan 5 aturan. Status historis `source_checked`/`clinical_review` pada berkas ini dipertahankan.
- `content/release/attestation.json`: cakupan dan checksum untuk build publik. Mengubah workbook/JSON tanpa peninjauan dan attestation baru membuat build publik gagal.
- `content/engine/`: usia koreksi, rekomendasi, dan sinyal perhatian.
- `src/`: UI, IndexedDB, backup/pemulihan, PDF, pengingat, service worker, dan produk terkait.
- `netlify/functions/`: pengelolaan push dan pengiriman terjadwal dengan Netlify Blobs.
- `tests/`: uji data dan alur aplikasi.

## Bangun dan uji

Gunakan Node.js yang memenuhi persyaratan Vite 8, lalu:

```bash
npm ci
npm run validate:content
npm run typecheck
npm run lint
npm test
npm run build
```

Build biasa menggunakan mode `production` dan menghasilkan folder `dist/`. Untuk pengujian internal data mentah, set `VITE_CONTENT_MODE=development` secara eksplisit. Jangan gunakan mode tersebut untuk publikasi. Build publik memverifikasi checksum semua berkas sumber dalam attestation; status persetujuan hanya diterapkan pada salinan data dalam aplikasi, tanpa menulis ulang workbook atau hasil ekstraksi.

## Deploy Netlify

**Paket statis:** ekstrak ZIP statis dan unggah folder berisi `index.html` ke Netlify Drop. PWA, konten, IndexedDB, backup, PDF, dan pengingat kalender berfungsi. Push server tidak disertakan di paket statis.

**Paket proyek lengkap:** ekstrak ZIP proyek, masukkan ke repositori Git, lalu hubungkan repositori ke Netlify. `netlify.toml` menetapkan build command `npm run build`, publish directory `dist`, dan Functions directory `netlify/functions`. Anda juga dapat menjalankan `npm ci && npx netlify-cli deploy --build --prod` dari folder proyek setelah login dan menautkan situs yang benar.

Untuk push, buat VAPID key dengan `npx web-push generate-vapid-keys`, lalu isi variabel Netlify:

- `VITE_VAPID_PUBLIC_KEY`: public key yang dipakai browser;
- `VAPID_PUBLIC_KEY`: public key yang sama untuk fungsi server;
- `VAPID_PRIVATE_KEY`: private key, rahasiakan dan jangan pernah beri prefiks `VITE_`;
- `VAPID_SUBJECT`: `mailto:alamat-email-anda@domain.com`.

Public key yang diawali `VITE_` masuk saat build; deploy ulang setelah menggantinya. Push memerlukan Netlify Functions, HTTPS, izin browser, dan VAPID. Tanpa konfigurasi itu, gunakan ekspor pengingat kalender dari aplikasi. Scheduled Functions berjalan otomatis pada deploy produksi yang dipublikasikan, bukan deploy preview.

## Batas yang masih berlaku

- **RISK004 tidak dieksekusi.** Dataset tidak menetapkan ambang numerik atau titik usia untuk pengamatan lintas domain; sistem tidak menebaknya. RISK003 memakai ambang tertulis: dua catatan kekhawatiran kategori sama dalam 14 hari.
- Aplikasi bukan alat skrining, diagnosis, atau penentu keadaan darurat. Catatan kekhawatiran dapat dibawa ke tenaga kesehatan.
- Data anak tersimpan di browser; tidak ada sinkronisasi antar-perangkat selain backup dan pemulihan manual.
- Panduan postpartum menampilkan harga Rp49.000 sebagai informasi, dengan status “Segera Hadir” karena URL checkout resmi belum diberikan.
- Peninjauan klinis independen **tidak diverifikasi oleh pembuat build**; dasar perubahan status rilis adalah konfirmasi pemilik produk dalam percakapan.

## Cek di ponsel sesudah deploy

1. Buat profil cukup bulan dan prematur, lalu periksa usia koreksi dan pergantian anak.
2. Selesaikan aktivitas, simpan respons, dan pastikan catatan masuk Perjalanan anak yang tepat.
3. Catat kekhawatiran berulang dan pengamatan kemampuan yang sebelumnya terlihat lalu hilang; buka ringkasan PDF.
4. Buat backup, pulihkan pada perangkat uji, dan uji penghapusan data.
5. Instal PWA, buka saat offline, lalu periksa apakah konten dan catatan masih tersedia.
6. Jika push dikonfigurasi, uji izin, jam, jeda, dan berhenti berlangganan di perangkat nyata.
