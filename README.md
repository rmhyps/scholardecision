# ScholarDecision (GDSS TOPSIS & Borda)

Sistem Pendukung Keputusan Kelompok (Group Decision Support System - GDSS) untuk Seleksi Penerima Beasiswa Menggunakan Integrasi Metode TOPSIS dan Borda Berbasis Web.

Dikembangkan untuk memenuhi Tugas Akhir Mata Kuliah Praktikum Sistem Informasi (2026), Jurusan Teknik Informatika, Fakultas Sains dan Teknologi, Universitas Islam Negeri Maulana Malik Ibrahim Malang.

---

## Gambaran Proyek

ScholarDecision adalah platform evaluasi beasiswa yang memadukan objektivitas perhitungan multikriteria individual dengan konsensus kolektif multi-penilai:
1. **Penilaian Multikriteria Individual (TOPSIS)**: Mengevaluasi kandidat terhadap solusi ideal positif ($A^+$) dan solusi ideal negatif ($A^-$) untuk menghasilkan nilai kedekatan relatif ($V_i$).
2. **Konsensus Kelompok (Metode Borda)**: Mengagregasikan hasil pemeringkatan dari 3 evaluator pengambil keputusan (*Decision Makers*):
   - Bagian Kemahasiswaan (Fokus: Prestasi & Portofolio)
   - Dosen Wali (Fokus: Akademik & IPK)
   - Pengelola Beasiswa (Fokus: Kondisi Finansial & Tanggungan)
3. **Penetapan Kuota & Pengesahan**: Penentuan penerima beasiswa otomatis berbasis kuota dinamis dengan berita acara resmi digital bertanda tangan kriptografis.

---

## Tech Stack

- **Framework**: React 18 (TypeScript) + Vite
- **Styling**: Tailwind CSS v3 + PostCSS
- **Visualisasi Data**: Recharts (Donut Chart & Bar Chart)
- **Animasi & Interaktivitas**: Framer Motion
- **Ikon Antarmuka**: Lucide React
- **Ekspor Dokumen**: jsPDF + html2canvas (Cetak Berita Acara Format A4 & Ekspor PDF/CSV)
- **Pengujian Matematis**: Node.js Test Runner (9/9 Unit Tests Numerik Lulus 100%)

---

## 13 Layar Antarmuka

1. **Portal Akademik / Login**: Autentikasi akun institusi dengan kartu identitas sistem.
2. **Dashboard Utama**: Ringkasan kuota, status progres penilai, dan grafik preferensi sementara.
3. **Data Calon Mahasiswa**: Manajemen 20 kandidat alternatif (A01-A20), pencarian, dan filter verifikasi.
4. **Data Kriteria Seleksi**: 5 kriteria inti (Benefit/Cost), bobot proporsi, dan kartu panduan.
5. **Pengaturan Bobot Kriteria**: Slider pembobotan interaktif dengan validasi real-time 100%.
6. **Form Penilaian Kandidat**: Matriks pengisian skor kandidat per kriteria dengan fitur kunci evaluasi.
7. **Hasil TOPSIS Individual**: Peringkat $V_i$ dan 4 tab transparansi langkah matematis (R, Y, $A^+/A^-$, $D^+/D^-$).
8. **Hasil Konsensus Borda**: Rekapitulasi perbandingan 3 penilai, skor Borda, dan pemetaan kuota.
9. **Pengesahan Hasil Seleksi**: Stepper 4 tahap seleksi dan dialog konfirmasi pengesahan final.
10. **Laporan & Berita Acara Resmi**: Naskah dinas universitas resmi siap cetak (Kop surat, tanda tangan digital 3 penilai, stempel rektorat, dan hash SHA-256).
11. **Manajemen Periode Seleksi**: Manajemen siklus beasiswa dan form wizard batch baru.
12. **Riwayat Aktivitas & Log Sistem**: Audit trail ISO 27001 compliant trace dengan rantai hash transaksi.
13. **Profil & Pengaturan Akun**: Manajemen identitas penilai dan ganti kata sandi.

---

## Panduan Menjalankan Proyek

### Prasyarat
- Node.js (versi 18 atau lebih baru)
- npm

### Instalasi & Menjalankan Lokal
```bash
# 1. Masuk ke direktori proyek
cd web

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev

# 4. Jalankan pengujian unit matematis
npm test

# 5. Kompilasi build produksi
npm run build
```

Aplikasi dapat diakses melalui peramban di `http://localhost:5173`.

---

## Tim Pengembang (Kelompok GDSS)

- R Muhammad Hanif Yasir P. S (240605110123)
- Nur Azizah Riska Rajabiy (240605110078)
- Nadia Tria Almuqoffa (240605110136)
- Farah Aufa Huwaidah (240605110197)

**Dosen Pengampu**: Ashri Shabrina Afrah, M.T.  
Jurusan Teknik Informatika, Fakultas Sains dan Teknologi  
Universitas Islam Negeri Maulana Malik Ibrahim Malang  
Tahun Akademik 2025/2026
