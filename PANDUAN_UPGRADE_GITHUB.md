# Upgrade Langkah Si Kecil: pendampingan dan aktivitas selanjutnya

**Tetap gunakan repositori yang sama:** [dancuk1011-bit/langkahsikecil](https://github.com/dancuk1011-bit/langkahsikecil). Pembaruan sebelumnya sudah ada pada cabang `main` saat paket ini disiapkan, 26 September 2026. Tidak perlu membuat repositori baru atau mengunggah ulang database.

## Unggah lewat GitHub web di komputer

1. Unduh `Paket_Upgrade_LSK_Stimulasi_dan_Aktivitas_Selanjutnya_2026-09-26.zip`. Klik dua kali ZIP di Finder untuk mengekstraknya. **Jangan unggah ZIP mentah** ke repositori.
2. Buka [halaman utama repositori](https://github.com/dancuk1011-bit/langkahsikecil) pada cabang `main`. Klik **Add file → Upload files**.
3. Buka folder hasil ekstraksi. Seret **isinya** ke halaman unggah GitHub: folder `src`, folder `tests`, `README.md`, dan `PANDUAN_UPGRADE_GITHUB.md`. Jangan seret folder pembungkusnya. GitHub akan mempertahankan susunan folder di dalamnya.
4. Sebelum menekan **Commit changes**, periksa bahwa **delapan jalur berkas** di bawah muncul. Tampilan folder tingkat atas hanya memperlihatkan empat item, tetapi isi `src` dan `tests` memuat berkas lainnya.
5. Klik **Commit changes**. Netlify yang terhubung dengan `main` akan membangun dan menerbitkan versi baru setelah commit berhasil. Tunggu status deploy selesai sebelum menguji situs.

| Jalur di repositori | Jenis |
| --- | --- |
| `src/app.tsx` | Ganti berkas lama |
| `src/db.ts` | Ganti berkas lama |
| `src/styles.css` | Ganti berkas lama |
| `src/play-guidance.ts` | Berkas baru |
| `tests/app.test.tsx` | Ganti berkas lama |
| `tests/play-guidance.test.ts` | Berkas baru |
| `README.md` | Ganti berkas lama |
| `PANDUAN_UPGRADE_GITHUB.md` | Ganti berkas lama |

Jangan unggah `dist`, `node_modules`, berkas `.env`, atau folder pembungkus hasil ekstraksi. Isi `content/` dan dataset master **tidak perlu diubah**. Beri waktu PWA terpasang untuk memuat versi baru; jika masih terlihat tampilan lama, tutup dan buka ulang aplikasi atau muat ulang halamannya.

## Cek setelah deploy

1. Di **Hari Ini**, lihat aktivitas utama, nama dan usia anak, status pengamatan, lalu kartu **Setelah ini** tepat di bawahnya.
2. Jika belum ada pengamatan, aplikasi harus menulis **Belum dicatat**, bukan menyimpulkan anak belum mampu. Kartu berikutnya dapat menunjukkan pilihan bersyarat bila bermain nyaman.
3. Buka **Perkembangan** dan catat **Belum terlihat** pada satu kemampuan; kembali ke Hari Ini. Jika kemampuan itu terkait aktivitas yang ditampilkan, aplikasi menyarankan cara lebih mudah.
4. Di **Profil**, pilih sapaan **Mom**. Kembali ke Hari Ini; teks pengamatan harus memakai sapaan itu. Pilihan sapaan lain tetap tersedia.
5. Catat aktivitas sebagai **Sedang lelah**; langkah berikutnya mengutamakan istirahat, bukan berpindah ke aktivitas yang lebih menantang.

Cadangkan catatan melalui **Profil → Data Saya** sebelum pembaruan, terutama jika perangkat dipakai untuk catatan asli. Pembaruan kode tidak menghapus data tersimpan, selama data situs di browser tidak dihapus dan alamat situs tetap sama. Ringkasan ini membantu memilih permainan keluarga; bukan pemeriksaan perkembangan atau diagnosis.
