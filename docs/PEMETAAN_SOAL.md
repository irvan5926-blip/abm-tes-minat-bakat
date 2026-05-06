# Pemetaan Soal: Buku Asli → Aplikasi

Dokumen ini menjelaskan **soal mana yang dipindah / dimodifikasi** dari
buku referensi ke bank soal aplikasi, agar guru BK dapat mengaudit
relevansi materi.

> Catatan umum: aplikasi web tidak dapat menampilkan gambar soal asli
> (mis. pola gambar, jaring-jaring kubus, dll) yang banyak terdapat pada
> Buku SMK 2016. Soal-soal tersebut **diadaptasi menjadi format teks +
> simbol unicode** dengan logika pengukuran yang setara (mengukur
> dimensi/sub-kemampuan yang sama).

## A. Audit Pengacakan per Sesi

Selain pemetaan statis ini, **setiap sesi tes** menyimpan mapping
*no_asli → no_tampil* di sheet `Sesi` kolom `mapping_json`. Mapping per
sesi inilah yang memungkinkan pernyataan seperti:

> *"Untuk siswa A, soal asli nomor 5 muncul di nomor 18."*

Mapping ini juga dicetak di laporan PDF pada bagian **Audit Pengacakan
Soal** (lihat `apps-script/Report.gs`, fungsi `renderBakatReportHtml_`
dan `renderMinatReportHtml_`).

## B. Bank Soal Bakat

Dari 9 subtes di Buku SMK 2016, aplikasi menyediakan bank soal teks
sebagai berikut:

| Kode | Subtes | ID di App | Jumlah | Keterangan |
|------|--------|-----------|--------|------------|
| PV | Penalaran Visual | `PV01..PV08` | 8 | Adaptasi pola gambar → simbol unicode (■ ● ▲ ◆ ☆ ☂ ⚑ ◯ ◐ ●) |
| PN | Penalaran Numerik | `PN01..PN10` | 10 | Adaptasi langsung |
| AV | Analisa Verbal | `AV01..AV08` | 8 | Soal logika & deduksi (Bahasa Indonesia) |
| PU | Penalaran Urutan | `PU01..PU08` | 8 | Pola huruf/angka/simbol |
| PS | Pengenalan Spasial | `PS01..PS06` | 6 | Geometri 2D (sudut, simetri, tessellation) |
| TD | Tiga Dimensi | `TD01..TD06` | 6 | Volume, jaring-jaring, dadu |
| SI | Sistematisasi | `SI01..SI06` | 6 | Mengurutkan, analogi, klasifikasi |
| KK | Kosa Kata | `KK01..KK08` | 8 | Sinonim/antonim |
| FA | Figural Angka | `FA01..FA08` | 8 | Aritmetika praktis (uang, kecepatan, persen) |
| **Total** | | | **68** | Tersebar di 9 subtes |

Definisi lengkap setiap soal ada di
[`apps-script/SoalBakat.gs`](../apps-script/SoalBakat.gs) pada fungsi
`getBakatSoal_()`. Kunci jawaban hanya tersedia di server (tidak dikirim
ke browser siswa).

### Pemetaan ke 7 Dimensi ABM (Pusmendik 2024)

| Dimensi ABM | Subtes Pendukung |
|-------------|------------------|
| Spasial | PV, PS, TD |
| Verbal | AV |
| Penalaran | PU |
| Klerikal | SI |
| Mekanika | (proksi: rata-rata Spasial + Kuantitatif) |
| Kuantitatif | PN, FA |
| Bahasa | KK |

## C. Bank Soal Minat

Mengikuti struktur Buku SMK 2016 BAB 4 (Inventori Minat).

### C.1 Bidang Soal 1 (28 pasangan kata)

8 bidang minat: A=Komunikasi, B=Seni, C=Kesehatan, D=Pariwisata,
E=Administrasi, F=Teknologi, G=Agrobisnis, H=Teknik.

28 pasangan kata digenerate **otomatis** dengan algoritma round-robin
C(8,2) (urutan jarak 1 hingga jarak 7) di
[`apps-script/SoalMinat.gs`](../apps-script/SoalMinat.gs) fungsi
`generatePairs28_()`. Hasil akhir setara dengan urutan pada Buku SMK.

ID soal: `B1-1` sampai `B1-28`.

### C.2 Program Detail (A-H)

Setiap bidang punya 8 sub-bidang spesifik. ID soal: `P{X}-1` sampai
`P{X}-28` di mana `{X}` ∈ {A,B,C,D,E,F,G,H}.

Contoh untuk Program A (Komunikasi):

| Kode | Sub-bidang | Rekomendasi Program Keahlian |
|------|------------|------------------------------|
| A | Programer | Rekayasa Perangkat Lunak |
| B | Jaringan Internet | Teknik Komputer & Jaringan |
| C | Kameraman | Produksi & Siaran Program TV |
| D | Instalasi Jaringan | Teknik Komputer & Jaringan |
| E | Editing | Multimedia |
| F | Fotographer | Multimedia |
| G | Audio Visual | Produksi & Siaran Program TV |
| H | Pegawai PLN | Teknik Ketenagalistrikan |

Daftar lengkap untuk semua program ada di `MINAT_PROGRAM` (lihat
[`apps-script/SoalMinat.gs`](../apps-script/SoalMinat.gs)).

### C.3 Pemetaan ke 18 Area Minat ABM

Tabel pemetaan 8 bidang → area ABM disimpan di `MINAT_ABM_MAP` di
`SoalMinat.gs`:

| Bidang | Pemetaan ABM (bobot) |
|--------|----------------------|
| A. Komunikasi | Social Facilitating (1.0), Helping (0.5), Influence (0.5), Personal Service (0.3) |
| B. Seni | Artistic (1.0) |
| C. Kesehatan | Helping (1.0), Social Sciences (0.7), Personal Service (0.3) |
| D. Pariwisata | Personal Service (1.0), Basic Services (0.7), Social Facilitating (0.4) |
| E. Administrasi | Business Detail (1.0), Managing (0.6), Financial Analysis (0.5), Basic Services (0.3) |
| F. Teknologi | Data Processing (1.0), Business Systems (0.8), Mechanical (0.4) |
| G. Agrobisnis | Nature/Outdoors (1.0), Manual Work (0.5), Science (0.3) |
| H. Teknik | Mechanical (1.0), Construction/Repair (0.8), Quality Control (0.4), Manual Work (0.4) |

## D. Modifikasi Visual / Warna

Pada buku asli (Buku SMK 2016), tema dominan adalah **hijau gelap** (≈
`#2E7D32` / `#1B5E20`). Aplikasi memodifikasi palette ke **hijau muda**
(Material Green 100-400) sesuai permintaan:

| Elemen | Warna Buku Asli | Warna Aplikasi |
|--------|-----------------|----------------|
| Primary | Hijau gelap | `#66BB6A` (Green 400) |
| Secondary | - | `#A5D6A7` (Green 200) |
| Card border / accent | - | `#C8E6C9` (Green 100) |
| Background | Putih/krem | `#F1F8E9` (Light Green 50) |
| Text | Hitam | `#1B5E20` (Green 900, kontras WCAG AA) |
| Heading | Hijau gelap | `#2E7D32` (Green 800) |

Lihat token CSS di [`apps-script/styles.html`](../apps-script/styles.html).
