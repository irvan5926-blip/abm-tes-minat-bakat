# ABM - Aplikasi Tes Minat & Bakat

Aplikasi web untuk asesmen **Bakat & Minat** siswa SMP/SMA/SMK berbasis
[Google Apps Script](https://developers.google.com/apps-script) (GAS) dengan
**Google Spreadsheet sebagai database**.

Materi soal & metode skoring mengacu pada:

- **Panduan Pemaknaan ABM** (Pusmendik, 2024) - 7 dimensi bakat & 18 area
  minat.
- **Buku Panduan Bakat & Minat** (Direktorat Pembinaan SMK, 2016) - 9 subtes
  bakat & struktur 8 bidang minat dengan program keahlian.

## Fitur

- Login admin (email + password) terpisah dari login siswa.
- **Token siswa sekali pakai, expired 5 menit** - dibuat oleh admin per
  siswa.
- Menu terpisah untuk **Tes Minat** dan **Tes Bakat**.
- **Soal diacak per siswa**, mapping no-asli → no-tampil disimpan untuk
  audit (PRNG deterministik berbasis sesi).
- Skoring otomatis: 7 dimensi bakat, 18 area minat, 3 bidang dominan,
  rekomendasi program keahlian SMK.
- **Prediksi IQ** dari hasil tes bakat (indikatif) dengan klasifikasi.
- **Laporan PDF profesional** - hanya admin yang dapat mengunduh.
- **Palette hijau muda** (Material Green 100-400) menggantikan hijau gelap
  pada buku asli.
- Buku panduan online (`?page=panduan`).

## Struktur Database (Spreadsheet)

| Sheet | Isi |
|-------|-----|
| `Admins` | Daftar admin (email, password hash, nama). |
| `Tokens` | Token tes (token, jenis, siswa, expires, status). |
| `Siswa` | Biodata siswa (auto-generated dari token). |
| `Sesi` | Sesi tes + mapping pengacakan soal (mapping_json). |
| `Jawaban` | Jawaban per soal (incremental save). |
| `Hasil` | Hasil akhir + skor + klasifikasi + IQ. |
| `AuditLog` | Log aksi admin & siswa. |

## Setup & Deploy

1. Buka [script.google.com](https://script.google.com), buat project baru.
2. Salin semua file dari `apps-script/` ke editor Apps Script (file `.gs`
   sebagai Script, file `.html` sebagai HTML).
3. Pastikan `appsscript.json` di-include (View → Show appsscript.json).
4. Jalankan fungsi `setupSpreadsheet()` sekali → membuat spreadsheet
   database. Catat URL yang dicetak di log.
5. Jalankan fungsi `installTriggers()` sekali → memasang trigger
   auto-expire token tiap 1 menit.
6. **Deploy → New deployment → Web app**:
   - Execute as: `Me`
   - Who has access: `Anyone` (atau `Anyone within ...` untuk
     organisasi).
7. Salin URL deployment & bagikan ke admin/guru BK.

### Login Admin Default

Setelah `setupSpreadsheet()`, sebuah admin default dibuat dengan:

- Email: email akun Google pemilik script.
- Password: `admin123` → **wajib diubah** pada login pertama melalui
  tombol "Ubah Password" di dashboard admin.

## Routing Web App

| URL | Halaman |
|-----|---------|
| `?page=login` (default) | Halaman login admin / input token siswa. |
| `?page=admin` | Dashboard admin (perlu login). |
| `?page=menu` | Menu pilih Tes Minat / Tes Bakat (perlu token valid). |
| `?page=test` | Halaman pengerjaan soal. |
| `?page=result` | Ringkasan hasil siswa (tanpa unduh PDF). |
| `?page=panduan` | Buku panduan penggunaan. |

## Dokumentasi Tambahan

- [`PANDUAN.md`](PANDUAN.md) - panduan lengkap dalam Markdown
  (versi cetak dari `panduan.html`).
- [`docs/PEMETAAN_SOAL.md`](docs/PEMETAAN_SOAL.md) - dokumentasi soal
  yang dipindah/dimodifikasi dari buku asli.
- [`docs/SKORING.md`](docs/SKORING.md) - rincian formula skoring &
  prediksi IQ.

## Lisensi

Aplikasi ini dirilis untuk keperluan internal sekolah / lembaga
pendidikan. Materi soal merupakan adaptasi dari publikasi resmi
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi RI - silakan
mengikuti ketentuan distribusi materi tersebut.
