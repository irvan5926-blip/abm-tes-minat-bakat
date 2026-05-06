# Buku Panduan Penggunaan Aplikasi ABM - Tes Minat & Bakat

> Versi cetak (Markdown) dari panduan online di `?page=panduan`.

## Daftar Isi

1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Peran Pengguna](#2-peran-pengguna)
3. [Panduan untuk Admin / Guru BK](#3-panduan-untuk-admin--guru-bk)
4. [Panduan untuk Siswa](#4-panduan-untuk-siswa)
5. [Tes Bakat - 9 Subtes & 7 Dimensi ABM](#5-tes-bakat)
6. [Tes Minat - 8 Bidang & 18 Area ABM](#6-tes-minat)
7. [Cara Membaca Prediksi IQ](#7-cara-membaca-prediksi-iq)
8. [Pengacakan Soal & Audit Trail](#8-pengacakan-soal--audit-trail)
9. [Laporan PDF Profesional](#9-laporan-pdf-profesional)
10. [Pemecahan Masalah](#10-pemecahan-masalah)

---

## 1. Tentang Aplikasi

Aplikasi ini adalah sistem asesmen **Bakat & Minat** berbasis Google Apps
Script yang dirancang untuk lembaga pendidikan (SMP/SMA/SMK) di Indonesia.
Materi mengacu pada:

- **Panduan Pemaknaan ABM** (Pusmendik, 2024) - 7 dimensi bakat & 18 area
  minat.
- **Buku Panduan Bakat & Minat** (Direktorat Pembinaan SMK, 2016) - 9
  subtes bakat & struktur 8 bidang minat.

Database 100% berbasis **Google Spreadsheet**, sehingga tidak perlu DB
eksternal.

## 2. Peran Pengguna

| Peran | Hak |
|-------|-----|
| **Admin / Guru BK** | Login dengan email + password. Bisa membuat token tes, melihat daftar token, melihat hasil tes, **mengunduh PDF laporan**, ubah password, tambah admin. |
| **Siswa** | Login hanya dengan token (tanpa akun). Hanya bisa mengerjakan satu jenis tes sesuai token, dan melihat ringkasan hasil sendiri (tanpa unduh PDF). |

> **Default admin awal:** dibuat otomatis dengan email pemilik script +
> password `admin123`. Wajib diubah pada login pertama.

## 3. Panduan untuk Admin / Guru BK

### 3.1 Login

1. Buka URL aplikasi (mis. `…exec?page=login`).
2. Pada panel **Admin - Login**, isi email & password.
3. Klik **Login Admin**.

### 3.2 Membuat Token Tes

1. Pada tab **Buat Token**, pilih jenis tes (Minat / Bakat).
2. Isi minimal **Nama Siswa** (kolom lain opsional tapi sangat
   disarankan untuk identifikasi laporan).
3. Klik **Buat Token**. Token 8 karakter (huruf besar + angka) akan
   muncul. Klik **Copy Token** untuk menyalin.
4. Bagikan token ke siswa. Token aktif **5 menit** sejak dibuat.

> **Penting:** Satu token hanya bisa dipakai sekali. Setelah siswa memulai
> tes, status menjadi `TERPAKAI`.

### 3.3 Memantau Hasil & Unduh PDF

1. Buka tab **Hasil & Laporan**.
2. Filter berdasarkan jenis tes bila perlu.
3. Klik **Detail** untuk melihat ringkasan, atau **⬇ PDF** untuk mengunduh
   laporan profesional.

### 3.4 Membatalkan Token / Ubah Password

- Tab **Daftar Token** → klik **Batalkan** pada token AKTIF untuk
  menonaktifkan.
- Tombol **Ubah Password** di header untuk mengganti password.

## 4. Panduan untuk Siswa

1. Buka URL aplikasi yang diberikan oleh guru BK.
2. Masukkan token 8 karakter pada panel **Siswa - Mulai Tes**.
3. Klik **Mulai Tes**.
4. Pilih jenis tes yang sesuai dengan token Anda.
5. Kerjakan soal dengan tenang. **Jawaban tersimpan otomatis**.
6. Setelah semua selesai, klik **Selesai & Submit**.
7. Lihat ringkasan hasil. Laporan lengkap (PDF) akan diberikan oleh guru
   BK.

## 5. Tes Bakat

Tes bakat terdiri dari **9 subtes**, lalu hasilnya dipetakan ke **7
dimensi bakat ABM**:

| Subtes | Mengukur | Dimensi ABM |
|--------|----------|-------------|
| Penalaran Visual | Identifikasi pola gambar | Spasial |
| Penalaran Numerik | Pola & relasi angka | Kuantitatif |
| Analisa Verbal | Logika & deduksi teks | Verbal |
| Penalaran Urutan | Pola urutan abstrak | Penalaran |
| Pengenalan Spasial | Hubungan ruang 2D | Spasial |
| Tiga Dimensi | Visualisasi 3D | Spasial |
| Sistematisasi | Mengurutkan & mengkategori | Klerikal |
| Kosa Kata | Sinonim, antonim, kosakata | Bahasa |
| Figural Angka | Aritmetika praktis | Kuantitatif |

> Catatan: dimensi **Mekanika** dihitung sebagai proksi dari rata-rata
> Spasial & Kuantitatif (karena tidak ada subtes mekanik langsung pada
> bank soal).

Klasifikasi skor (skala 0-100):

- **Tinggi** - skor > 70
- **Sedang** - 40 ≤ skor ≤ 70
- **Rendah** - skor < 40

## 6. Tes Minat

Tes minat terdiri dari 2 tahap:

1. **Bidang Soal 1** (28 pasangan kata) - menentukan 3 dari 8 bidang
   minat dominan: Komunikasi, Seni, Kesehatan, Pariwisata, Administrasi,
   Teknologi, Agrobisnis, Teknik.
2. **Program Detail** - untuk masing-masing dari 3 bidang teratas, siswa
   mengerjakan 28 pasangan pekerjaan untuk menemukan program keahlian SMK
   paling cocok.

Skor 8 bidang juga dipetakan ke 18 area minat ABM (Tracey, 2002):

- **8 Minat Dasar:** Social Facilitating, Managing, Business Detail,
  Data Processing, Mechanical, Nature/Outdoors, Artistic, Helping.
- **5 Minat Metodis:** Social Sciences, Influence, Business Systems,
  Financial Analysis, Science.
- **5 Minat Praktis:** Quality Control, Manual Work, Personal Service,
  Construction/Repair, Basic Services.

## 7. Cara Membaca Prediksi IQ

Prediksi IQ *hanya muncul pada Tes Bakat*. Dihitung dengan formula:

```
IQ ≈ 70 + 0.6 × rata_skor_7_dimensi   (dibatasi 50-150)
```

| Skor IQ | Kategori |
|---------|----------|
| ≥ 130 | Sangat Superior |
| 120-129 | Superior |
| 110-119 | Di atas Rata-rata |
| 90-109 | Rata-rata |
| 80-89 | Di bawah Rata-rata |
| 70-79 | Borderline |
| < 70 | Rendah |

> **Penting:** Prediksi IQ ini bersifat **indikatif** dan **BUKAN**
> pengganti tes IQ klinis (WAIS, WISC, atau CFIT). Gunakan sebagai
> gambaran awal untuk konseling, bukan sebagai diagnosis resmi.

## 8. Pengacakan Soal & Audit Trail

Setiap siswa mendapat **urutan soal yang berbeda**. Pengacakan
menggunakan PRNG deterministik (Mulberry32) berdasarkan
`sesi_id + token`, sehingga:

- Hasil pengacakan reproducible (jika perlu reaudit).
- Mapping **nomor asli → nomor tampil** disimpan sepenuhnya pada sheet
  `Sesi` kolom `mapping_json`.
- Pada laporan PDF, ada bagian **Audit Pengacakan Soal** yang
  menampilkan tabel pemetaan misal: *Soal asli no 5 dipindah ke no 18*.

Untuk Tes Bakat, pengacakan dilakukan **per subtes terpisah** sehingga
subtes Penalaran Visual tetap muncul sebelum subtes Numerik, tapi urutan
internal dalam tiap subtes diacak.

## 9. Laporan PDF Profesional

Laporan PDF berisi:

- **Identitas siswa** (nama, NIS, kelas, sekolah).
- **Prediksi IQ** (untuk tes bakat) - kotak besar di atas.
- **Skor 7 dimensi bakat** dengan klasifikasi (Tinggi/Sedang/Rendah).
- **Skor detail per subtes**.
- **3 bidang minat dominan** (untuk tes minat).
- **Rekomendasi program keahlian SMK**.
- **Pemetaan ke 18 area minat ABM**.
- **Audit pengacakan soal** - tabel mapping no asli → no tampil.

PDF disimpan di Google Drive admin pada folder `ABM Reports`, dan juga
distream langsung ke browser dalam format base64 saat tombol unduh
ditekan.

> Hanya admin yang sedang login (sesi 4 jam) yang dapat memanggil
> endpoint `downloadReport`. Siswa tidak punya akses unduh.

## 10. Pemecahan Masalah

| Masalah | Solusi |
|---------|--------|
| Token expired sebelum siswa login | Buat token baru. Token hanya berlaku 5 menit; bagikan setelah siswa siap di depan layar. |
| Siswa salah klik jenis tes | Token mengikat ke jenis tes tertentu. Buat token baru dengan jenis benar. |
| Sesi terputus di tengah tes | Selama token masih dalam masa 5 menit, siswa dapat memasukkan token lagi dan sesi akan dilanjutkan. |
| PDF tidak terunduh | Pastikan browser tidak memblokir popup. Coba refresh halaman, login ulang admin (sesi habis 4 jam). |
| Lupa password admin | Dari editor Apps Script, jalankan fungsi `resetAdminPassword('email','passwordbaru')`. |

---

*Dokumen ini juga tersedia online di: `?page=panduan`*
