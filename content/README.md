# Sumber konten Langkah Si Kecil 0–12 bulan

Sumber editorial tunggal: `master/LSK_master_dataset_0-12_bulan_v4.xlsx`. Folder `data/` adalah hasil ekstraksi asli yang disertakan pengguna. Pemeriksaan ID dan judul terhadap workbook: 122 aktivitas, 90 skill, 20 sumber, 244 relasi, dan 5 aturan; seluruhnya cocok. Status pada workbook/JSON tetap menggambarkan tahap ekstraksi awal: `source_checked` dan `clinical_review`.

Konfirmasi pemilik produk pada 25 September 2026 menyatakan konten sudah ditinjau, valid, dan siap publikasi. Catatan rilis `release/attestation.json` mengikat pernyataan itu ke checksum workbook serta setiap berkas JSON. Build publik hanya berjalan bila checksum cocok; status efektif `approved` dibuat pada salinan data aplikasi, bukan dengan menyunting dataset asli. Nama dan tanggal reviewer klinis serta laporan peninjauan independen tidak disertakan.

RISK003 menjalankan ambang yang memang tertulis dalam data. RISK004 tidak dieksekusi karena ambang angka dan titik usia belum ditetapkan; status persetujuan konten tidak cukup untuk mengarang algoritmanya.

Untuk revisi berikutnya, perbarui sumber master, lakukan peninjauan pada versi yang berubah, perbarui attestation, dan jalankan `npm run validate:content`, `npm test`, serta `npm run build`.
