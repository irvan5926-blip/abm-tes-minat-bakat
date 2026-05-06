# Detail Skoring ABM

## Tes Bakat

### Per Soal
- Setiap soal pilihan ganda memiliki **kunci jawaban tunggal** (`opsi.kunci`).
- Jawaban siswa diuji case-insensitive: `j === kunci`.
- Hanya jawaban benar yang dihitung (1 poin / soal).

### Per Subtes
```
skor_subtes = (jumlah_benar / total_soal_subtes) × 100
```
- Range: 0–100
- Total soal per subtes berbeda-beda (umumnya 6–10 soal).

### Per Dimensi (7 dimensi ABM)
```
skor_dimensi = rata-rata(skor_subtes_pendukung)
```
| Dimensi      | Subtes Pendukung |
|--------------|------------------|
| Spasial      | PV, PS           |
| Verbal       | AV               |
| Penalaran    | PU               |
| Klerikal     | SI               |
| Mekanika     | TD (atau proksi rata-rata Spasial+Kuantitatif) |
| Kuantitatif  | PN, FA           |
| Bahasa       | KK               |

### Klasifikasi Bakat
```
< 40   → Rendah
40–70  → Sedang
> 70   → Tinggi
```

### Prediksi IQ
```
IQ ≈ 70 + 0.6 × rata_rata_7_dimensi
IQ = clip(IQ, 50, 150)
```

Kategori IQ:
| Range  | Kategori           |
|--------|--------------------|
| ≥ 130  | Sangat Superior    |
| 120–129| Superior           |
| 110–119| Di atas Rata-rata  |
| 90–109 | Rata-rata          |
| 80–89  | Di bawah Rata-rata |
| 70–79  | Borderline         |
| < 70   | Rendah             |

> **Catatan**: Prediksi IQ ini adalah angka indikatif berbasis bakat ABM, **bukan pengganti** tes IQ klinis (WAIS, WISC, CFIT). Untuk keperluan klinis, pakai instrumen yang divalidasi.

## Tes Minat

### Tahap 1: Bidang Minat (28 pasangan)
- 8 bidang: A–H (Komunikasi, Seni, Kesehatan, Pariwisata, Administrasi, Teknologi, Agrobisnis, Teknik).
- Round-robin C(8,2) = 28 pasangan.
- Setiap soal: pilih **A** atau **B**.
- Skor bidang = jumlah dipilih (range 0–7).

### Tahap 2: Program (28 pasangan × 3 bidang dominan)
- Top 3 bidang dari Tahap 1 → masing-masing punya 8 sub-bidang.
- Round-robin lagi → 28 pasangan per bidang dominan.
- Sub-bidang dengan skor tertinggi → **Pekerjaan Top** + **Program Keahlian**.

### Pemetaan ke 18 Area ABM (Tracey 2002)

8 bidang dipetakan ke 18 area dengan bobot:

| Bidang          | Area utama (bobot ≥ 0.7) |
|-----------------|--------------------------|
| A (Komunikasi)  | Social Facilitating      |
| B (Seni)        | Artistic                 |
| C (Kesehatan)   | Helping, Social Sciences |
| D (Pariwisata)  | Personal Service, Basic Services |
| E (Administrasi)| Business Detail          |
| F (Teknologi)   | Data Processing, Business Systems |
| G (Agrobisnis)  | Nature/Outdoors          |
| H (Teknik)      | Mechanical, Construction/Repair |

```
skor_area_X = Σ (skor_bidang_b × bobot[b][X]) untuk semua b
```

### Klasifikasi Area

18 area dikelompokkan menjadi 3 grup:
- **Dasar**: 8 area paling fundamental (Social Facilitating, Managing, Business Detail, Data Processing, Mechanical, Nature/Outdoors, Artistic, Helping)
- **Metodis**: 5 area metodologis (Social Sciences, Influence, Business Systems, Financial Analysis, Science)
- **Praktis**: 5 area praktis (Quality Control, Manual Work, Personal Service, Construction/Repair, Basic Services)

Per grup:
```
klasifikasi(area) = Tinggi  jika skor ≥ 0.5 × skor_max_grup dan skor > 0
                  = Rendah  selainnya
```

## Audit Pengacakan

Setiap sesi siswa menyimpan mapping di `sesi.mapping`:

```json
{
  "jenis": "bakat",
  "subtes": { "PV": { "soal_ids": ["PV03","PV01",...] }, ... },
  "urutan": [
    { "no_tampil": 1, "id_asli": "PV03", "subtes": "PV" },
    { "no_tampil": 2, "id_asli": "PV01", "subtes": "PV" },
    ...
  ]
}
```

Mapping ini dicetak di laporan PDF (admin) sehingga bisa diaudit:
> "Soal yang tampil di nomor 1 untuk siswa ini sebenarnya adalah soal PV03 dari bank soal asli."

PRNG: **Mulberry32** dengan seed = `FNV-1a(sesi_id + ':' + token)`. Deterministik — kalau sesi yang sama dijalankan ulang dengan token yang sama, urutan acaknya identik.
