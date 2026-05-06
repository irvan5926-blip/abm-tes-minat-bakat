# Skema Skoring & Prediksi IQ

Dokumen teknis ini menjelaskan rumus skoring yang dipakai aplikasi.
Implementasi ada di [`apps-script/Skoring.gs`](../apps-script/Skoring.gs).

## A. Tes Bakat

### A.1 Skor per Subtes (skala 0-100)

```
skor_subtes = (jumlah_benar / total_soal_subtes) * 100
```

### A.2 Skor per Dimensi ABM

```
skor_dimensi = mean(skor_subtes untuk semua subtes yang memetakan ke dimensi tsb)
```

Kasus khusus dimensi **Mekanika** (tidak ada subtes langsung):

```
skor_mekanika = (skor_spasial + skor_kuantitatif) / 2
```

### A.3 Klasifikasi

| Skor | Klasifikasi |
|------|-------------|
| > 70 | Tinggi |
| 40 - 70 | Sedang |
| < 40 | Rendah |

### A.4 Prediksi IQ

```
IQ = round(70 + 0.6 * mean(skor_7_dimensi))
IQ = clamp(IQ, 50, 150)
```

Logika di balik formula:

- Jika rata-rata skor = 50 (di tengah skala), IQ ≈ 100 (rata-rata
  populasi).
- Jika rata-rata skor = 100 (semua benar), IQ = 130 (mendekati Superior).
- Batas atas/bawah dipilih untuk menghindari nilai ekstrem yang tidak
  bermakna pada tes pendek (<100 soal).

| Skor IQ | Kategori |
|---------|----------|
| ≥ 130 | Sangat Superior |
| 120-129 | Superior |
| 110-119 | Di atas Rata-rata |
| 90-109 | Rata-rata |
| 80-89 | Di bawah Rata-rata |
| 70-79 | Borderline |
| < 70 | Rendah |

> **Disclaimer:** Prediksi IQ ini bersifat **indikatif**. Untuk diagnosis
> klinis, gunakan tes IQ baku (WAIS, WISC, CFIT) yang diadministrasi oleh
> psikolog tersertifikasi.

## B. Tes Minat

### B.1 Skor 8 Bidang (dari Bidang Soal 1)

Setiap bidang berpasangan 7 kali dalam 28 pasangan (round-robin C(8,2)).
Skor per bidang = jumlah kali bidang dipilih (rentang 0-7).

```
3 bidang teratas (skor terbesar) = bidang dominan siswa
```

### B.2 Skor Program Detail

Untuk masing-masing dari 3 bidang teratas, siswa mengerjakan 28 pasangan
sub-bidang. Skor per sub-bidang = jumlah dipilih (0-7).

Sub-bidang dengan skor tertinggi → **rekomendasi program keahlian SMK**.

### B.3 Pemetaan ke 18 Area Minat ABM

Skor area ABM dihitung dengan bobot:

```
skor_area = SUM(skor_bidang[B] * bobot_map[B][area])  untuk semua B
```

Bobot tersimpan di `MINAT_ABM_MAP` (lihat
[`SoalMinat.gs`](../apps-script/SoalMinat.gs)).

### B.4 Klasifikasi Area Minat

Threshold dinamis per grup (dasar / metodis / praktis):

```
maxS = max(skor_area dalam grup)
klasifikasi[area] = "Tinggi" jika skor_area >= 0.5 * maxS dan skor > 0
                    "Rendah" lainnya
```

Output ringkas:

- **3 area dasar teratas** dari grup Dasar (8 area)
- **1 area teratas** dari grup Metodis (5 area)
- **1 area teratas** dari grup Praktis (5 area)

## C. Pengacakan Soal (PRNG Deterministik)

PRNG: **Mulberry32** (32-bit, periode 2³², kualitas baik untuk
shuffle non-kriptografis).

Seed:

```
seed = hash_FNV1a(sesi_id + ":" + token)
```

Untuk Tes Bakat, tiap subtes diacak terpisah dengan
`seed + hash(kode_subtes)` sehingga urutan subtes tetap
(PV → PN → AV → ...) tapi soal di dalamnya teracak.

Mapping disimpan ke kolom `mapping_json` pada sheet `Sesi`:

```json
{
  "jenis": "bakat",
  "urutan": [
    { "no_tampil": 1, "id_asli": "PV05", "subtes": "PV" },
    { "no_tampil": 2, "id_asli": "PV01", "subtes": "PV" },
    ...
  ]
}
```

Mapping ini dicetak di laporan PDF untuk audit
*"soal asli no X dipindah ke nomor Y"*.
