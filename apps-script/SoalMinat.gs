/**
 * Bank soal Tes Minat - mengikuti struktur "Buku Panduan Bakat & Minat SMK"
 * (Direktorat Pembinaan SMK, 2016) BAB 4 (Inventori Minat).
 *
 * Tes minat terdiri dari:
 *
 *   1. Bidang Soal 1 - 28 pasangan kata round-robin pada 8 BIDANG MINAT:
 *        A=Komunikasi, B=Seni, C=Kesehatan, D=Pariwisata,
 *        E=Administrasi, F=Teknologi, G=Agrobisnis, H=Teknik
 *      Skoring: hitung jumlah huruf yang dipilih, ambil 3 BIDANG dengan
 *      skor tertinggi.
 *
 *   2. Untuk tiap bidang teratas, dikerjakan PROGRAM detail (28 pasang
 *      kata round-robin pada 8 sub-bidang spesifik). Hasil program teratas
 *      jadi rekomendasi PROGRAM KEAHLIAN paling cocok.
 *
 * Pemetaan ke 18 area minat ABM (Pusmendik 2024) dilakukan via tabel
 * MINAT_ABM_MAP (lihat Skoring.gs).
 *
 * Karena 28 pasang adalah COMBINATION dari 8 huruf (C(8,2)=28), pasangan
 * digenerate otomatis sehingga konsisten dengan buku.
 */

const MINAT_BIDANG = [
  { kode: 'A', nama: 'Komunikasi' },
  { kode: 'B', nama: 'Seni' },
  { kode: 'C', nama: 'Kesehatan' },
  { kode: 'D', nama: 'Pariwisata' },
  { kode: 'E', nama: 'Administrasi' },
  { kode: 'F', nama: 'Teknologi' },
  { kode: 'G', nama: 'Agrobisnis' },
  { kode: 'H', nama: 'Teknik' }
];

/** Sub-bidang per Program (A-H). Masing-masing 8 sub. */
const MINAT_PROGRAM = {
  A: { // Komunikasi
    nama: 'Komunikasi',
    sub: [
      { kode:'A', nama:'Programer' },
      { kode:'B', nama:'Jaringan Internet' },
      { kode:'C', nama:'Kameraman' },
      { kode:'D', nama:'Instalasi Jaringan' },
      { kode:'E', nama:'Editing' },
      { kode:'F', nama:'Fotographer' },
      { kode:'G', nama:'Audio Visual' },
      { kode:'H', nama:'Pegawai PLN' }
    ],
    keahlian: {
      A: 'Rekayasa Perangkat Lunak',
      B: 'Teknik Komputer dan Jaringan',
      C: 'Produksi dan Siaran Program TV',
      D: 'Teknik Komputer dan Jaringan',
      E: 'Multimedia',
      F: 'Multimedia',
      G: 'Produksi dan Siaran Program TV',
      H: 'Teknik Ketenagalistrikan'
    }
  },
  B: { // Seni
    nama: 'Seni',
    sub: [
      { kode:'A', nama:'Pelukis' },
      { kode:'B', nama:'Pengrajin Kayu' },
      { kode:'C', nama:'Musisi' },
      { kode:'D', nama:'Penari' },
      { kode:'E', nama:'Karawitan' },
      { kode:'F', nama:'Dalang' },
      { kode:'G', nama:'Drama' },
      { kode:'H', nama:'Peneliti Budaya' }
    ],
    keahlian: {
      A: 'Seni Lukis', B: 'Kriya Kayu', C: 'Seni Musik',
      D: 'Seni Tari', E: 'Karawitan', F: 'Seni Pedalangan',
      G: 'Seni Teater', H: 'Antropologi/Studi Budaya'
    }
  },
  C: { // Kesehatan
    nama: 'Kesehatan',
    sub: [
      { kode:'A', nama:'Perawat' },
      { kode:'B', nama:'Psikologi' },
      { kode:'C', nama:'Farmasi' },
      { kode:'D', nama:'Petugas Panti Asuhan' },
      { kode:'E', nama:'Dokter' },
      { kode:'F', nama:'Petugas Palang Merah' },
      { kode:'G', nama:'Apoteker' },
      { kode:'H', nama:'Pekerja Sosial' }
    ],
    keahlian: {
      A: 'Keperawatan', B: 'Psikologi (Lanjut S1)', C: 'Farmasi',
      D: 'Pekerjaan Sosial', E: 'Kedokteran (Lanjut S1)',
      F: 'Tanggap Darurat', G: 'Farmasi Industri', H: 'Pekerjaan Sosial'
    }
  },
  D: { // Pariwisata
    nama: 'Pariwisata',
    sub: [
      { kode:'A', nama:'Pemandu Wisata' },
      { kode:'B', nama:'Pramugari' },
      { kode:'C', nama:'Salon' },
      { kode:'D', nama:'Make Up Artis' },
      { kode:'E', nama:'Travelling' },
      { kode:'F', nama:'Boga (Memasak)' },
      { kode:'G', nama:'Perhotelan' },
      { kode:'H', nama:'Desainer Pakaian' }
    ],
    keahlian: {
      A: 'Usaha Perjalanan Wisata', B: 'Pelayanan Penerbangan',
      C: 'Tata Kecantikan Rambut', D: 'Tata Kecantikan Kulit',
      E: 'Usaha Perjalanan Wisata', F: 'Tata Boga',
      G: 'Akomodasi Perhotelan', H: 'Tata Busana'
    }
  },
  E: { // Administrasi
    nama: 'Administrasi',
    sub: [
      { kode:'A', nama:'Administrasi' },
      { kode:'B', nama:'Akuntan' },
      { kode:'C', nama:'Pemasaran' },
      { kode:'D', nama:'Perbankan' },
      { kode:'E', nama:'Marketing' },
      { kode:'F', nama:'Sekretaris' },
      { kode:'G', nama:'Penjualan' },
      { kode:'H', nama:'Kasir' }
    ],
    keahlian: {
      A: 'Otomatisasi Tata Kelola Perkantoran', B: 'Akuntansi & Keuangan Lembaga',
      C: 'Bisnis Daring & Pemasaran', D: 'Perbankan & Keuangan Mikro',
      E: 'Bisnis Daring & Pemasaran', F: 'Otomatisasi Tata Kelola Perkantoran',
      G: 'Bisnis Daring & Pemasaran', H: 'Akuntansi & Keuangan Lembaga'
    }
  },
  F: { // Teknologi
    nama: 'Teknologi',
    sub: [
      { kode:'A', nama:'Insinyur' },
      { kode:'B', nama:'Pengembang Aplikasi' },
      { kode:'C', nama:'Teknisi Listrik' },
      { kode:'D', nama:'Operator Komputer' },
      { kode:'E', nama:'Kontraktor' },
      { kode:'F', nama:'Drafter' },
      { kode:'G', nama:'Animator' },
      { kode:'H', nama:'Robotika' }
    ],
    keahlian: {
      A: 'Teknik Energi Terbarukan', B: 'Rekayasa Perangkat Lunak',
      C: 'Teknik Instalasi Tenaga Listrik', D: 'Teknik Komputer dan Jaringan',
      E: 'Konstruksi Gedung', F: 'Desain Pemodelan Bangunan (DPIB)',
      G: 'Animasi', H: 'Mekatronika'
    }
  },
  G: { // Agrobisnis
    nama: 'Agrobisnis',
    sub: [
      { kode:'A', nama:'Petugas Perkebunan' },
      { kode:'B', nama:'Peternak' },
      { kode:'C', nama:'Pengolah Hasil Pertanian' },
      { kode:'D', nama:'Pengawas Hasil Pertanian' },
      { kode:'E', nama:'Produksi Hasil Pertanian' },
      { kode:'F', nama:'Konservasi Hutan' },
      { kode:'G', nama:'Nelayan' },
      { kode:'H', nama:'Pengolahan Lahan' }
    ],
    keahlian: {
      A: 'Agribisnis Tanaman Perkebunan', B: 'Agribisnis Ternak',
      C: 'APHP (Agribisnis Pengolahan Hasil Pertanian)',
      D: 'APHP', E: 'Mekanisasi Pertanian', F: 'Kehutanan',
      G: 'Nautika Kapal Penangkap Ikan', H: 'Mekanisasi Pertanian'
    }
  },
  H: { // Teknik
    nama: 'Teknik',
    sub: [
      { kode:'A', nama:'Operator Pabrik' },
      { kode:'B', nama:'Teknisi Instrumen' },
      { kode:'C', nama:'Perawatan Mesin' },
      { kode:'D', nama:'Konstruksi Kapal' },
      { kode:'E', nama:'Nakhoda' },
      { kode:'F', nama:'Mekanik Otomotif' },
      { kode:'G', nama:'Pengolahan Limbah' },
      { kode:'H', nama:'Pengolahan Hasil Tangkap' }
    ],
    keahlian: {
      A: 'Teknik Mesin', B: 'Teknik Instrumentasi Industri',
      C: 'Teknik Industri', D: 'Teknik Perkapalan',
      E: 'Nautika Kapal Niaga', F: 'Teknik Kendaraan Ringan Otomotif',
      G: 'Teknik Kimia Industri', H: 'Teknologi Produksi Perikanan Budidaya'
    }
  }
};

/**
 * Generate 28 pasangan round-robin huruf A..H.
 *
 * Urutan: jarak 1 (7 pasang), jarak 2 (6 pasang), ..., jarak 7 (1 pasang).
 * Sesuai dengan urutan yang digunakan di Buku SMK halaman 122-124.
 */
function generatePairs28_(letters) {
  const pairs = [];
  const n = letters.length;
  for (let d = 1; d < n; d++) {
    for (let i = 0; i + d < n; i++) {
      pairs.push([letters[i], letters[i + d]]);
    }
  }
  return pairs; // panjang = C(n,2) = 28 untuk n=8
}

/**
 * Soal Bidang 1 (memilih 1 dari 8 bidang minat).
 * @return {Array<{id, no_asli, kata_a, kata_b, label_a, label_b}>}
 */
function getMinatBidang1Soal_() {
  const letters = MINAT_BIDANG.map(function(b) { return b.kode; });
  const namaByKode = {};
  MINAT_BIDANG.forEach(function(b) { namaByKode[b.kode] = b.nama; });
  const pairs = generatePairs28_(letters);
  return pairs.map(function(pair, idx) {
    return {
      id:      'B1-' + (idx + 1),
      no_asli: idx + 1,
      kata_a:  namaByKode[pair[0]],
      label_a: pair[0],
      kata_b:  namaByKode[pair[1]],
      label_b: pair[1]
    };
  });
}

/**
 * Soal Program X (X = A..H).
 */
function getMinatProgramSoal_(progKode) {
  const prog = MINAT_PROGRAM[progKode];
  if (!prog) throw new Error('Program tidak dikenali: ' + progKode);
  const letters = prog.sub.map(function(s) { return s.kode; });
  const namaByKode = {};
  prog.sub.forEach(function(s) { namaByKode[s.kode] = s.nama; });
  const pairs = generatePairs28_(letters);
  return pairs.map(function(pair, idx) {
    return {
      id:      'P' + progKode + '-' + (idx + 1),
      no_asli: idx + 1,
      kata_a:  namaByKode[pair[0]],
      label_a: pair[0],
      kata_b:  namaByKode[pair[1]],
      label_b: pair[1]
    };
  });
}

/**
 * Pemetaan 8 BIDANG MINAT (Buku SMK) -> 18 area minat ABM (Tracey 2002).
 * Tiap bidang memetakan ke beberapa area; bobot 1 utk pemetaan utama.
 *
 * Sumber: kombinasi tabel matriks Panduan ABM + deskripsi area.
 */
const MINAT_ABM_MAP = {
  A: { // Komunikasi
    'Social Facilitating': 1.0,
    'Helping': 0.5,
    'Influence': 0.5,
    'Personal Service': 0.3
  },
  B: { // Seni
    'Artistic': 1.0
  },
  C: { // Kesehatan
    'Helping': 1.0,
    'Social Sciences': 0.7,
    'Personal Service': 0.3
  },
  D: { // Pariwisata
    'Personal Service': 1.0,
    'Basic Services': 0.7,
    'Social Facilitating': 0.4
  },
  E: { // Administrasi
    'Business Detail': 1.0,
    'Managing': 0.6,
    'Financial Analysis': 0.5,
    'Basic Services': 0.3
  },
  F: { // Teknologi
    'Data Processing': 1.0,
    'Business Systems': 0.8,
    'Mechanical': 0.4
  },
  G: { // Agrobisnis
    'Nature/Outdoors': 1.0,
    'Manual Work': 0.5,
    'Science': 0.3
  },
  H: { // Teknik
    'Mechanical': 1.0,
    'Construction/Repair': 0.8,
    'Quality Control': 0.4,
    'Manual Work': 0.4
  }
};

const MINAT_ABM_AREAS = {
  dasar: ['Social Facilitating','Managing','Business Detail','Data Processing',
          'Mechanical','Nature/Outdoors','Artistic','Helping'],
  metodis: ['Social Sciences','Influence','Business Systems','Financial Analysis','Science'],
  praktis: ['Quality Control','Manual Work','Personal Service','Construction/Repair','Basic Services']
};
