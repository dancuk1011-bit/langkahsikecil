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

## Ringkasan & langkah berikutnya

Di halaman Perkembangan, aplikasi merangkum jumlah aktivitas dan pengamatan yang dicatat dalam tujuh hari terakhir, lalu memberi satu ide bermain berdasarkan rentang usia (termasuk usia koreksi jika digunakan) dan respons terbaru. Respons lelah menghasilkan saran istirahat; belum tertarik menghasilkan opsi mencoba lebih ringan atau aktivitas lain; menikmati menghasilkan opsi mengulang atau mencoba variasi. Catatan kemampuan yang sebelumnya terlihat lalu dilaporkan hilang mengutamakan anjuran membahasnya dengan tenaga kesehatan. Ini rencana bermain keluarga, bukan skor tumbuh kembang, standar kemampuan, atau hasil skrining. Dataset master dan data pengguna lama tidak diubah.

### Pendampingan bermain yang dipersonalisasi

Hari Ini menampilkan nama dan usia anak, satu kemampuan yang terkait dengan aktivitas utama, serta status **belum dicatat**, **belum terlihat**, **belum yakin**, atau **pernah terlihat** berdasarkan pengamatan keluarga. Status tidak diturunkan dari respons aktivitas. Di bawah aktivitas utama ada satu kartu **Setelah ini**: istirahat bila lelah, ulangi cara sederhana bila belum terlihat atau belum tertarik, coba variasi bila nyaman, atau lihat satu aktivitas lain sesuai usia ketika respons bermain dan pengamatan mendukung. Pilihan lain sebelum ada catatan diberi syarat "jika nyaman", bukan dinyatakan sebagai tahap perkembangan yang harus dicapai.

Pengamatan **Belum terlihat** dapat dicatat di Perkembangan. Profil memberi pilihan sapaan Ayah/Bunda, Mom, Bunda, atau Ayah. Pilihan ini tersimpan bersama pengaturan perangkat dan ikut dalam backup. Semua aktivitas dan pemetaan kemampuan tetap memakai dataset master yang sudah tersedia.

## Penyempurnaan alur pengguna

- Profil anak dapat diperbaiki, termasuk tanggal lahir, prematuritas, HPL, usia koreksi, dan fokus aktivitas. Identitas anak dan catatan lama dipertahankan; catatan yang tanggalnya mendahului tanggal lahir yang sudah diperbaiki tidak dipakai untuk rekomendasi baru.
- Pengamatan awal dapat dilewati. Setelah bermain, respons harus dipilih sendiri sebelum momen disimpan.
- Aktivitas dari katalog di luar rentang usia tetap dapat dibaca, tetapi tidak bisa dimulai atau dicatat.
- Ringkasan angka tujuh hari ada di Perkembangan; Hari Ini menampilkan saran setelah aktivitas utama. Catatan aktivitas dapat diperbaiki atau dihapus dari Perjalanan. Menghapus aktivitas juga menghapus pengamatan yang direkam bersama aktivitas tersebut.
- Pengingat kalender mengikuti hari yang dipilih. Bila push belum dikonfigurasi, aplikasi menjelaskan bahwa hanya kalender yang tersedia dan tidak menampilkan ajakan mengaktifkan push yang gagal.
- Panduan Baby Blues & Depresi Postpartum memakai tautan produk Scalev yang diberikan pemilik. Harga dan tombol beli telah dicocokkan dengan halaman yang aktif pada 26 September 2026.

Cara memperbarui melalui GitHub web dijelaskan di [PANDUAN_UPGRADE_GITHUB.md](PANDUAN_UPGRADE_GITHUB.md).

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

Jika memperbarui situs yang sudah aktif tanpa Git, ekstrak paket proyek lengkap, jalankan `npm ci`, lalu `npx netlify-cli link` untuk memilih **situs lama yang benar**. Uji dahulu dengan `npx netlify-cli deploy --build`; setelah alamat pratinjau diperiksa, jalankan `npx netlify-cli deploy --build --prod`. Mengunggah ZIP proyek lengkap langsung ke Netlify Drop tidak menjalankan build dan tidak memasang Functions.

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
- Halaman produk postpartum di Scalev masih memuat beberapa kalimat template tentang CPNS/NIP yang tidak sesuai produk. Perbaiki di Scalev sebelum mengarahkan iklan ke halaman tersebut.
- `src/analytics.ts` belum mengirim metrik penggunaan. Tanpa pengukuran yang disetujui pengguna, tidak ada dasar untuk menyebut fitur tertentu jarang digunakan atau berdampak pada konversi.
- Materi promosi lama yang menjanjikan Fase, Tidur, Cek Cepat, prediksi rewel, atau keputusan gawat darurat perlu disesuaikan. Fitur dan klaim tersebut tidak tersedia pada versi ini.
- Peninjauan klinis independen **tidak diverifikasi oleh pembuat build**; dasar perubahan status rilis adalah konfirmasi pemilik produk dalam percakapan.

## Cek di ponsel sesudah deploy

1. Buat profil cukup bulan dan prematur, lalu periksa usia koreksi dan pergantian anak.
2. Selesaikan aktivitas, simpan respons, dan pastikan catatan masuk Perjalanan anak yang tepat.
3. Catat kekhawatiran berulang dan pengamatan kemampuan yang sebelumnya terlihat lalu hilang; buka ringkasan PDF.
4. Buat backup, pulihkan pada perangkat uji, dan uji penghapusan data.
5. Instal PWA, buka saat offline, lalu periksa apakah konten dan catatan masih tersedia.
6. Jika push dikonfigurasi, uji izin, jam, jeda, dan berhenti berlangganan di perangkat nyata.
7. Periksa ringkasan Perkembangan: setelah respons lelah tampil anjuran jeda, setelah aktivitas lama melewati rentang usia tidak muncul sebagai ide saat ini, dan setelah mencatat kehilangan kemampuan tampil anjuran konsultasi.
