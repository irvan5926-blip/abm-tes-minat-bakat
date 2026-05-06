# Panduan Penggunaan ABM

## Untuk Siswa

1. **Dapatkan token** dari guru/admin (8 karakter, mis. `ABCD2345`).
2. Buka URL aplikasi (mis. `https://username.github.io/abm-tes-minat-bakat/`).
3. Pilih tab **Siswa** → masukkan token → klik **Mulai Tes →**.
4. Kerjakan setiap soal dengan memilih jawaban (radio button untuk Bakat, klik kartu untuk Minat).
5. Gunakan tombol **← Sebelumnya** / **Selanjutnya →** atau panah keyboard untuk navigasi.
6. Di soal terakhir, klik **Selesai ✓**.
7. Halaman ringkasan hasil akan tampil (skor, klasifikasi, prediksi IQ untuk Bakat).
8. Klik **Selesai** untuk kembali ke halaman utama.

> **Penting**: Token hanya berlaku 5 menit dan **sekali pakai**. Kalau token kadaluwarsa, mintalah token baru ke admin.

## Untuk Admin

### Setup Awal
1. Daftar Supabase (lihat `README.md` bagian Setup).
2. Daftar admin pertama lewat tab **Admin** → **Daftar di sini**.

### Membuat Token
1. Login admin → tab **Buat Token**.
2. Pilih **Jenis Tes** (Bakat / Minat) — token hanya bisa untuk satu jenis.
3. Isi nama siswa (wajib), NIS, kelas, sekolah (opsional).
4. Klik **Generate Token (5 menit)**.
5. Salin token (atau URL siswa langsung) → kirim ke siswa.

### Memantau Token
- Tab **Daftar Token**: lihat status semua token (Aktif / Terpakai / Expired / Dibatalkan).
- Tombol **Batalkan**: matikan token aktif sebelum kadaluwarsa (jika salah generate).
- Tombol **📋**: salin token ke clipboard.

### Mengunduh Laporan
1. Tab **Hasil & Laporan**.
2. Pilih siswa → klik **⬇ PDF**.
3. PDF terdownload otomatis. Berisi:
   - Identitas siswa
   - Skor 7 dimensi + klasifikasi (Bakat) atau 3 bidang dominan (Minat)
   - Prediksi IQ + kategori (Bakat)
   - Rekomendasi program keahlian (Minat)
   - **Audit pengacakan**: tabel mapping `no_asli → no_tampil`

### Statistik
Tab **Statistik**: jumlah token, siswa, hasil per jenis tes.

### Bank Soal
Tab **Bank Soal**: ringkasan jumlah soal per subtes (Bakat) dan daftar bidang (Minat). Untuk mengubah soalnya, edit file `assets/js/soal-bakat.js` / `assets/js/soal-minat.js` lalu commit ke GitHub — auto-redeploy.

## Tentang ABM

Asesmen Bakat & Minat (ABM) berbasis kerangka Pusat Asesmen Pendidikan (Pusmendik) Kemendikbudristek 2024.

### 7 Dimensi Bakat
- **Spasial**: kemampuan memvisualisasi & memanipulasi objek 2D/3D
- **Verbal**: kemampuan analisa logika dengan kata-kata
- **Penalaran**: kemampuan analisis pola & sebab-akibat
- **Klerikal**: kecepatan & ketelitian klerikal/administratif
- **Mekanika**: pemahaman prinsip mesin & alat
- **Kuantitatif**: kemampuan numerik & perhitungan
- **Bahasa**: penguasaan kosakata & makna kata

### 18 Area Minat (Tracey 2002)
Dikelompokkan jadi:
- **Dasar (8)**: Social Facilitating, Managing, Business Detail, Data Processing, Mechanical, Nature/Outdoors, Artistic, Helping
- **Metodis (5)**: Social Sciences, Influence, Business Systems, Financial Analysis, Science
- **Praktis (5)**: Quality Control, Manual Work, Personal Service, Construction/Repair, Basic Services

## Pengacakan & Audit
Setiap siswa mendapatkan urutan soal acak yang berbeda (PRNG deterministik dengan seed = sesi+token). Mapping `no_asli → no_tampil` disimpan di database dan dicetak di PDF admin.

## Skoring & IQ
Detail di `docs/SKORING.md`.

## Pertanyaan?
Lihat `README.md` bagian Troubleshooting, atau buka issue di GitHub.
