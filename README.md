# 🌱 ABM Tes Minat & Bakat

Aplikasi web untuk asesmen Bakat & Minat (ABM) berbasis **GitHub Pages + Supabase** — gratis, mudah deploy, tanpa server.

> Framework: ABM Pusmendik 2024 (7 dimensi bakat) + Tracey 2002 (18 area minat) — kerangka publik. Bank soal di repo ini bersifat **representatif/contoh**, ditulis ulang dari nol untuk menghindari pelanggaran hak cipta. Anda dapat mengganti soalnya dengan instrumen resmi sekolah Anda di file <kbd>assets/js/soal-bakat.js</kbd> dan <kbd>assets/js/soal-minat.js</kbd>.

## ✨ Fitur

- 🛡️ **Login admin** via Supabase Auth (email + password) dengan signup mandiri
- 🎫 **Token siswa** 8 karakter — berlaku **5 menit**, sekali pakai
- 🎲 **Pengacakan soal per siswa** dengan PRNG deterministik (audit `no_asli → no_tampil`)
- 🧠 **Tes Bakat**: 9 subtes → 7 dimensi ABM (Spasial, Verbal, Penalaran, Klerikal, Mekanika, Kuantitatif, Bahasa)
- 🎯 **Tes Minat**: 8 bidang → 18 area ABM (dasar/metodis/praktis) + rekomendasi pekerjaan & program keahlian
- 📊 **Prediksi IQ** indikatif (50–150) berbasis rata-rata 7 dimensi bakat
- 📄 **Laporan PDF profesional** (jsPDF + autoTable) — admin-only, lengkap dengan audit pengacakan
- 🎨 **UI hijau muda** Material Design dengan animasi & micro-interactions
- 📱 Responsif mobile/desktop
- 🚀 **Auto-deploy** via GitHub Actions ke GitHub Pages

## 🏗️ Arsitektur

```
┌─────────────────┐         ┌──────────────────┐
│  GitHub Pages   │ ◄────► │  Supabase        │
│  (HTML/CSS/JS)  │  HTTPS  │  PostgreSQL+Auth │
│  Static SPA     │         │  RPC + RLS       │
└─────────────────┘         └──────────────────┘
       ▲                              ▲
       │                              │
   ┌───┴────┐                    ┌────┴────┐
   │ Siswa  │                    │  Admin  │
   │ Token  │                    │  Email  │
   └────────┘                    └─────────┘
```

- **Frontend**: vanilla HTML/CSS/JS — no framework, no build step
- **Backend**: Supabase Postgres dengan **Row Level Security** + **RPC functions**
- **Auth admin**: Supabase Auth (email/password)
- **Auth siswa**: token 8-karakter via RPC `api_validate_token`
- **Skoring**: 100% client-side (deterministik, mudah diaudit)
- **PDF**: client-side via [jsPDF](https://github.com/parallax/jsPDF)

## 🚀 Cara Setup (sekali, ~10 menit)

### 1. Daftar Supabase

1. Kunjungi <https://supabase.com> → **Start your project** → login (bisa pakai GitHub)
2. Klik **New Project**:
   - Name: `abm-tes-minat-bakat`
   - Region: **Southeast Asia (Singapore)** (terdekat untuk Indonesia)
   - Set database password (catat baik-baik, walau tidak dipakai oleh aplikasi ini)
3. Tunggu ~2 menit sampai status **Project is ready**

### 2. Jalankan Schema SQL

1. Di dashboard Supabase, klik menu kiri: **SQL Editor** → **New query**
2. Copy seluruh isi `supabase/schema.sql` dari repo ini → tempel
3. Klik **Run** (atau `Ctrl+Enter`)
4. Pastikan tidak ada error merah

### 3. Ambil Kredensial

1. Menu kiri: **Project Settings** (ikon gear) → **API**
2. Catat dua nilai:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: token panjang `eyJhbGciOiJI...`

> ⚠️ **PENTING**: anon key **AMAN** dipublish ke GitHub. Jangan pernah copy `service_role` key — yang ini rahasia.

### 4. Konfigurasi Repo

Edit `assets/js/config.js`:

```js
window.ABM_CONFIG = {
  SUPABASE_URL:      'https://xxxxx.supabase.co',           // ← tempel di sini
  SUPABASE_ANON_KEY: 'eyJhbGciOiJI...',                      // ← tempel di sini
  TOKEN_EXP_MINUTES: 5,
  APP_VERSION:       '2.0.0-supabase'
};
```

Commit & push:

```bash
git add assets/js/config.js
git commit -m "config: setup Supabase credentials"
git push
```

### 5. Aktifkan GitHub Pages

1. Buka repo di GitHub → **Settings** → **Pages**
2. **Source**: pilih **"Deploy from a branch"**
3. **Branch**: pilih **`main`** → folder **`/ (root)`** → klik **Save**
4. Tunggu ~1 menit, GitHub akan generate URL aplikasi
5. URL aplikasi: `https://<username>.github.io/abm-tes-minat-bakat/`

> Setiap kali Anda push ke `main`, GitHub Pages otomatis mendeploy ulang.

### 6. Daftar Admin Pertama

1. Buka URL aplikasi → tab **Admin** → **Daftar di sini**
2. Isi nama, email, password (min. 6 karakter)
3. Cek email konfirmasi (kalau Supabase Auth set "Confirm email" aktif). Atau matikan di Supabase: **Authentication → Providers → Email → Confirm email = OFF** (untuk demo).
4. Login → masuk dashboard admin

## 📋 Cara Pakai

### Admin

1. Login → tab **Buat Token** → isi nama siswa & jenis tes (Minat / Bakat)
2. Klik **Generate Token** → token 8-karakter muncul (berlaku 5 menit)
3. Salin token (atau URL siswa langsung) → bagikan ke siswa
4. Setelah siswa selesai → tab **Hasil & Laporan** → klik **⬇ PDF**

### Siswa

1. Buka URL aplikasi (atau URL langsung dari admin) → tab **Siswa**
2. Masukkan token 8 karakter → **Mulai Tes →**
3. Kerjakan soal urut. Jawaban tersimpan otomatis ke Supabase.
4. Klik **Selesai ✓** di soal terakhir → halaman hasil ringkas tampil
5. PDF lengkap diunduh oleh admin (siswa tidak bisa download).

## 🗂️ Struktur Repo

```
abm-tes-minat-bakat/
├── index.html                  # SPA entry point
├── assets/
│   ├── css/styles.css          # Material Design hijau muda
│   └── js/
│       ├── config.js           # ⚠️ EDIT: kredensial Supabase
│       ├── utils.js            # PRNG, hashing, formatting, toast
│       ├── supabase-client.js  # Wrapper @supabase/supabase-js
│       ├── soal-bakat.js       # Bank soal Bakat (9 subtes)
│       ├── soal-minat.js       # Bank soal Minat (28 pasang × 9 tahap)
│       ├── skoring.js          # Skoring + IQ + ABM area mapping
│       ├── auth.js             # Auth admin & siswa flow
│       ├── pdf-report.js       # PDF generator (jsPDF)
│       ├── views.js            # Render setiap halaman
│       └── app.js              # Coordinator: state, routing, events
├── supabase/
│   ├── schema.sql              # Schema + RLS + RPC functions
│   └── seed.sql                # Optional seed
├── docs/
│   ├── PEMETAAN_SOAL.md        # Catatan adaptasi soal
│   └── SKORING.md              # Detail rumus skoring & IQ
├── .github/workflows/deploy.yml  # Auto-deploy GitHub Pages
└── README.md
```

## 🔧 Customisasi Bank Soal

Edit `assets/js/soal-bakat.js`:

```js
const BAKAT_SOAL = [
  { id:'PV01', subtes:'PV', pertanyaan:'...', opsi:{a:'...',b:'...',c:'...',d:'...',e:'...'}, kunci:'b' },
  // tambah/hapus sesuai kebutuhan
];
```

ID soal = `<KodeSubtes><2 digit>` (mis. `PV09`). Konvensi ini dipakai untuk audit pengacakan.

Untuk minat, edit struktur `MINAT_PROGRAM` (sub-bidang & rekomendasi keahlian per bidang).

## 🧪 Pengujian Lokal

Karena aplikasi static, cukup:

```bash
# Python
python3 -m http.server 8080

# atau Node
npx serve .

# Buka http://localhost:8080
```

Pastikan `config.js` sudah diisi sebelum testing.

## 🔐 Keamanan

| Aspek | Implementasi |
|-------|-------------|
| Direct table access (anon) | ❌ Diblokir Row Level Security |
| Token siswa | RPC `security definer` (validasi server-side, expired 5 menit) |
| Soal & jawaban | Tidak dapat dimodifikasi siswa setelah submit |
| Admin actions | Memerlukan Supabase Auth session (JWT) |
| anon key publik | ✅ Aman (dilindungi RLS + RPC) |
| service_role key | 🚨 JANGAN PERNAH dicommit |

## 📊 Skoring

### Bakat
- Skor subtes = `(jumlah benar / total) × 100`
- Skor dimensi = rata-rata skor subtes pendukung
- Klasifikasi: **Rendah** (<40), **Sedang** (40–70), **Tinggi** (>70)
- Prediksi IQ ≈ `70 + 0.6 × rata-rata 7 dimensi`, capped 50–150 (indikatif)

### Minat
- Tahap 1: 28 pasang round-robin dari 8 bidang. Skor bidang = jumlah dipilih (0–7).
- Tahap 2: 28 pasang per bidang dominan (top 3) → pekerjaan top + program keahlian.
- 8 bidang dipetakan ke 18 area ABM via tabel bobot (Tracey 2002).

Detail di `docs/SKORING.md`.

## 🛠️ Troubleshooting

| Gejala | Solusi |
|--------|--------|
| Banner kuning "Setup Belum Selesai" | Edit `assets/js/config.js` → push ulang |
| `RPC error: permission denied` | Pastikan grant execute di schema.sql sudah dijalankan |
| Email konfirmasi tidak datang | Supabase: Authentication → Providers → Email → Confirm email = OFF |
| Token sudah expired | Buat token baru — masa berlaku 5 menit |
| PDF tidak terdownload | Cek browser console; pastikan jsPDF dari CDN ter-load |

## 📝 Lisensi

MIT — bebas dipakai untuk sekolah, lembaga bimbingan, atau riset.

## 🙏 Kredit

- ABM Framework: Pusat Asesmen Pendidikan, Kemendikbudristek
- 18 Area Minat: Tracey, T. J. G. (2002). The 18-area Personal Globe Inventory
- Bank soal contoh: ditulis ulang oleh kontributor repo ini
