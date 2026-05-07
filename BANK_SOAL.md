# Bank Soal Bakat — Setup & Pengelolaan

Dokumen ini menjelaskan cara admin (Pak / guru BK) mengelola konten Tes Bakat
secara mandiri lewat dashboard, tanpa mengubah kode aplikasi.

## Arsitektur

```
┌────────────────────┐         ┌──────────────────────────┐
│ GitHub Pages       │  fetch  │ Supabase                 │
│  (frontend, public)│ ──────▶ │  - DB: bank_soal_bakat   │
│                    │         │  - Storage: bakat-pages  │
└────────────────────┘         └──────────────────────────┘
       │                                │
       │  signed URL (60 menit)         │
       ▼                                ▼
   Siswa lihat gambar           Admin upload gambar
   hanya saat tes aktif         lewat tab Bank Soal
```

- **Repo public**: hanya berisi infrastruktur (HTML/CSS/JS, struktur 9 subtes,
  skoring, randomisasi, PDF). Tidak ada gambar/konten soal di repo.
- **Bank Soal di DB**: tabel `bank_soal_bakat` di Supabase berisi metadata per
  soal (subtes, no, kunci, tipe input, path gambar). Hanya admin yang bisa
  baca/tulis (RLS).
- **Gambar di Storage**: bucket private `bakat-pages` di Supabase Storage.
  Anon (siswa) tidak bisa list/download langsung; aplikasi generate
  **signed URL** berdurasi 60 menit saat siswa start tes.

## Setup Awal (sekali, ~15 menit)

### 1. Run schema.sql ulang

Schema sudah dilengkapi tabel `bank_soal_bakat`, RPC admin (upsert/list/delete/
bulk_upsert), policy Storage, dan bucket creator. Schema **idempotent** — aman
dijalankan ulang.

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → pilih project →
   menu **SQL Editor** → **New query**.
2. Copy seluruh isi `supabase/schema.sql` → paste → **Run**.
3. Verifikasi: buka **Table Editor** → harus ada tabel `bank_soal_bakat`
   (kosong). Buka **Storage** → harus ada bucket `bakat-pages` (private).

### 2. (Opsional) Cek bucket policy

Bucket `bakat-pages` dibuat private dengan dua policy:
- **admin write/read**: authenticated user bisa upload/list/download
- **anon read**: anon bisa SELECT (via signed URL)

Storage tab → klik bucket `bakat-pages` → **Policies** untuk verifikasi.

## Workflow Pengelolaan Soal

### A. Tambah soal manual (untuk eksperimen / soal sedikit)

1. Login admin di aplikasi.
2. Buka tab **📚 Bank Soal** → klik **➕ Tambah Soal**.
3. Isi:
   - **Subtes**: PV / PN / AV / PU / PS / TD / SI / KK / FA
   - **No Soal**: 1, 2, 3, …
   - **Sub-index**: 0 untuk soal tunggal; 1, 2, 3, … untuk multi-jawaban
     (misal 1 soal punya 3 sub-pertanyaan dengan jawaban berbeda).
   - **Tipe Input**: pilih sesuai konvensi subtes
     - `letter4` (a-d) → KK
     - `letter5` (a-e) → PV, PU, TD, SI
     - `letter6` (a-f) → AV
     - `number` (angka) → PN, FA
     - `sb` (Sama/Berbeda) → PS
   - **Kunci Jawaban**: huruf kecil (`a`/`b`/…), atau angka, atau `s`/`b`
     (untuk Sama/Berbeda).
   - **Durasi (menit)**: opsional override per soal.
   - **Aktif**: `Ya` agar masuk ke tes; `Tidak` untuk parkir/draft.
   - **Label / Catatan**: opsional, ditampilkan di atas gambar.
4. Klik tombol **📤 Upload** untuk pilih file gambar (JPG/PNG, ≤2 MB
   disarankan). Setelah upload selesai, field "image_path" terisi otomatis.
5. **💾 Simpan**.
6. Klik **👁 Lihat** di baris soal untuk preview.

### B. Import massal (CSV)

Cocok kalau Pak sudah punya kunci jawaban di Excel.

1. Tab **📚 Bank Soal** → **📥 Import CSV**.
2. Format header (baris 1):
   ```
   subtes,no,sub_index,image_path,answer_type,kunci,label,active
   ```
3. Contoh isi:
   ```csv
   subtes,no,sub_index,image_path,answer_type,kunci,label,active
   PV,1,0,,letter5,b,,true
   PV,2,0,,letter5,e,,true
   PV,3,0,,letter5,a,,true
   PN,1,0,,number,12,,true
   PN,2,0,,number,81,,true
   AV,1,0,,letter6,c,Soal silogisme,true
   PS,1,0,,sb,s,,true
   PU,1,1,,letter5,c,Sub-jawaban I,true
   PU,1,2,,letter5,a,Sub-jawaban II,true
   ```
4. **Tempel CSV** ke textarea → **📥 Import**.
5. Image path bisa diisi belakangan (edit per row + upload).
6. Re-import file yang sama akan **update** entry existing (matching by
   `subtes + no + sub_index`).

### C. Upload gambar batch (manual via Storage UI)

Kalau Pak punya banyak gambar (mis. hasil scan) dan ingin upload sekaligus:

1. Buka Supabase Dashboard → **Storage** → bucket **bakat-pages** → **Upload
   files**.
2. Drag & drop semua gambar. Catat path/filename masing-masing.
3. Di tab **Bank Soal** aplikasi, edit per soal → paste path file ke field
   image_path → simpan. Atau pakai CSV import dengan kolom `image_path`
   sudah terisi nama file.

### D. Export untuk backup

Tab **📚 Bank Soal** → **📤 Export CSV**. Akan download semua entry
(termasuk path gambar). Simpan sebagai backup; bisa di-import kembali jika
perlu rollback.

## Convention No Soal & Sub-index

- **Soal tunggal**: `subtes=PV, no=1, sub_index=0`. ID auto-generate `PV01`.
- **Soal multi-jawaban**: misal 1 soal Penalaran Urutan punya 3 sub-jawaban
  (I, II, III): buat 3 entry dengan no sama, sub_index 1/2/3:
  ```
  PU,5,1,...,letter5,c
  PU,5,2,...,letter5,a
  PU,5,3,...,letter5,b
  ```
  ID auto-generate `PU05_1`, `PU05_2`, `PU05_3`. Tiap sub-jawaban dihitung
  sebagai 1 soal terpisah saat skoring.

## Pertanyaan Umum

**Q: Apa yang terjadi kalau bank soal di DB kosong?**
A: Aplikasi otomatis fallback ke **demo bawaan** (set soal generik di
`assets/js/soal-bakat.js`). Cocok untuk uji coba alur tes sebelum konten
disuplai.

**Q: Bisa aktif/non-aktifkan soal tanpa hapus?**
A: Bisa. Edit soal → set **Aktif = Tidak**. Soal tetap di DB tapi tidak
ikut diacak ke siswa.

**Q: Gambar saya format PDF, bukan JPG. Bisa langsung upload?**
A: Bucket terima file apa saja, tapi browser hanya render JPG/PNG/WEBP
sebagai `<img>`. Convert PDF ke gambar (mis. via tool screenshot atau
[pdf2image online](https://www.ilovepdf.com/pdf_to_jpg)) sebelum upload.

**Q: Berapa banyak soal yang aman?**
A: Free tier Supabase: DB 500 MB + Storage 1 GB. 1 gambar ~150 KB → muat
~6500 gambar. Untuk 1 angkatan SMK: jauh dari limit.

**Q: Apakah siswa bisa download/share gambar?**
A: Bisa lewat browser DevTools (signed URL), tapi URL expired 60 menit
setelah generate. Tidak ada proteksi DRM yang sempurna untuk gambar di
web — ini sama seperti soal dicetak di kertas: bisa difoto siswa.

## Schema reference

Lihat `supabase/schema.sql` untuk:
- Tabel `bank_soal_bakat` (kolom + constraint + index)
- RPC `api_get_bank_soal_active` (anon, untuk siswa)
- RPC `api_admin_bank_soal_upsert` / `bulk_upsert` / `delete` (admin)
- Storage bucket `bakat-pages` + RLS policies
