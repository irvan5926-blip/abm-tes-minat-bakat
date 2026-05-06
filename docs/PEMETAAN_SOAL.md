# Pemetaan & Adaptasi Bank Soal

Dokumen ini menjelaskan **bagaimana bank soal di repo ini disusun**.

## Pendekatan: Soal Representatif, Bukan Verbatim

Bank soal di `assets/js/soal-bakat.js` dan `assets/js/soal-minat.js` **bukan reproduksi verbatim** dari Buku Panduan Bakat & Minat SMK (Direktorat Pembinaan SMK 2016) atau Panduan Pemaknaan ABM (Pusmendik 2024). Yang diadopsi adalah:

- **Struktur 9 subtes** untuk Tes Bakat (PV, PN, AV, PU, PS, TD, SI, KK, FA)
- **Struktur 8 bidang minat × 8 sub-bidang** untuk Tes Minat
- **Pemetaan ke 7 dimensi bakat ABM** dan **18 area minat ABM (Tracey 2002)**
- **Format 28-pasangan round-robin** untuk Tes Minat

Soal-soal individu adalah **contoh representatif** yang ditulis ulang dari nol mengikuti gaya & tingkat kesulitan tipikal subtes tersebut. Ini menghindari pelanggaran hak cipta sambil tetap fungsional untuk demo, pengujian aplikasi, atau sebagai template yang dapat dikustomisasi sekolah.

## Cara Mengganti dengan Bank Soal Resmi

Jika sekolah Anda memiliki lisensi/akses ke bank soal ABM resmi (misalnya dari Pusmendik atau penerbit), ganti isi `BAKAT_SOAL` di file <kbd>assets/js/soal-bakat.js</kbd>:

```js
const BAKAT_SOAL = [
  { id:'PV01', subtes:'PV', pertanyaan:'<soal resmi sekolah>',
    opsi:{a:'...',b:'...',c:'...',d:'...',e:'...'}, kunci:'b' },
  ...
];
```

ID harus mengikuti pola **`<KodeSubtes><2 digit>`** (mis. `PV01`, `KK15`). Konvensi ini dipakai oleh:
- Skoring (`skoring.js` filter berdasarkan prefix subtes)
- Audit pengacakan (no_asli diekstrak dari digit 2 terakhir)

Jumlah soal per subtes boleh berbeda-beda. Skor subtes selalu dinormalisasi menjadi 0-100 = `(benar / total) × 100`.

## Pengacakan

Soal **tetap dalam urutan asli** di file source. Pengacakan dilakukan **client-side saat siswa memulai sesi**, dengan PRNG deterministik:

```
seed   = FNV-1a(sesi_id + ':' + token)
shuffle = Fisher-Yates(seed)
```

Mapping `no_asli → no_tampil` disimpan di `sesi.mapping` di Supabase, dan dicetak di laporan PDF admin untuk keperluan audit.

## Tahap Tes Minat

Tahap 1 (Bidang) menggunakan kombinasi 8 bidang menjadi 28 pasang round-robin. Tahap 2 (Program) menggunakan 8 sub-bidang per bidang dominan menjadi 28 pasang. Total: 28 + 3×28 = **112 pasang per siswa** (estimasi 15-20 menit).

Daftar bidang (bisa diganti namanya tapi jumlah harus 8):

| Kode | Bidang        |
|------|---------------|
| A    | Komunikasi    |
| B    | Seni          |
| C    | Kesehatan     |
| D    | Pariwisata    |
| E    | Administrasi  |
| F    | Teknologi     |
| G    | Agrobisnis    |
| H    | Teknik        |

Sub-bidang (8 per bidang) di `MINAT_PROGRAM`. Rekomendasi pekerjaan & program keahlian di-link langsung di struktur ini.
