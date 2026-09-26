# Upgrade Langkah Si Kecil melalui GitHub web

**Repositori yang dipakai tetap sama:** `dancuk1011-bit/langkahsikecil`. Tidak perlu membuat repositori baru. Netlify membaca proyek Vite dari akar repositori; `netlify.toml` menjalankan `npm run build` dan memublikasikan `dist`.

## Unggah pembaruan

1. Unduh **Paket_Upgrade_GitHub_Langkah_Si_Kecil_2026-09-26.zip**, kemudian klik dua kali ZIP di Finder untuk mengekstraknya. **Jangan unggah ZIP apa adanya.**
2. Buka [repositori langkahsikecil](https://github.com/dancuk1011-bit/langkahsikecil) di GitHub web. Pastikan Anda berada pada halaman utama repositori dan cabang `main`, bukan di dalam folder `src` atau `tests`.
3. Klik **Add file → Upload files**. Buka folder hasil ekstraksi, lalu seret **seluruh isinya** ke area unggah: `src`, `tests`, `README.md`, dan `PANDUAN_UPGRADE_GITHUB.md`. Folder di dalamnya harus tetap ikut.
4. Sebelum menekan **Commit changes**, pastikan seluruh **9 jalur berkas** di tabel berikut ada. GitHub dapat mengelompokkan tampilan menurut folder; jumlah item tingkat atas bukan jumlah berkas.
5. Tekan **Commit changes**. Jika Netlify terhubung ke cabang `main`, deploy produksi berjalan dari commit tersebut.
6. Setelah deploy Netlify selesai, buka `https://langkahsikecilv2.netlify.app/`. Jika versi lama masih muncul di PWA yang sudah terpasang, tekan **Perbarui** ketika diminta atau tutup dan buka ulang aplikasinya.

Arsip ZIP adalah alat pengiriman; GitHub perlu menerima berkas di lokasi berikut:

| Lokasi di repositori | Perubahan |
| --- | --- |
| `src/app.tsx` | Alur utama aplikasi |
| `src/db.ts` | Penghapusan catatan yang aman |
| `src/push.ts` | Jadwal kalender sesuai pilihan hari |
| `src/config/related-products.ts` | Tautan Baby Blues |
| `tests/app.test.tsx` | Uji alur utama |
| `tests/calendar.test.ts` | Uji kalender |
| `tests/db-correction.test.ts` | Uji isolasi data anak |
| `README.md` | Keterangan proyek |
| `PANDUAN_UPGRADE_GITHUB.md` | Langkah pembaruan |

Jangan unggah `node_modules`, `dist`, `.env`, arsip ZIP, atau folder pembungkus hasil ekstraksi ke repositori. Simpan backup data anak dari menu **Data Saya** sebelum mencoba versi baru.

## Cek singkat setelah deploy

1. Buka Profil Si Kecil, ubah data lalu pastikan Perjalanan lama masih ada.
2. Selesaikan aktivitas: tombol **Simpan Momen** baru aktif setelah memilih respons.
3. Buka aktivitas usia lain dari katalog dan pastikan tombol mulai tidak tersedia.
4. Pilih pengingat **Senin–Jumat** lalu ekspor kalender; jadwal kalender harus mengikuti hari itu setelah berkas dibuka.
5. Buka Untuk Keluarga dan periksa tombol **Lihat dan Beli Panduan** mengarah ke produk Baby Blues.

## Hal di luar berkas GitHub

- Notifikasi push baru dapat diuji setelah konfigurasi VAPID dan fungsi server di situs Netlify yang benar. Aplikasi memakai kalender sebagai pilihan yang tersedia sekarang.
- Halaman produk Baby Blues di Scalev masih berisi teks template CPNS/NIP. Perbaiki bagian **Setelah membeli** dan **Cocok buat kamu yang** sebelum mengarahkan calon pembeli ke sana.
- Aplikasi belum mengukur penggunaan semua pengguna; kebermanfaatan dan konversi perlu diuji dengan pengguna nyata. Materi promosi harus sesuai fitur aplikasi yang benar-benar tersedia.
