// =====================================================================
// Bank "soal" Tes Minat
// =====================================================================
// Sumber: TES MINAT New.pdf (Buku Panduan Bakat & Minat SMK).
// Label per program & jumlah pasangan dijaga PERSIS sesuai PDF:
//   - Bidang 1: 8 bidang (A-H), 28 pasang
//   - Program A,B,C,D,E,G: 8 sub (A-H), 28 pasang
//   - Program F (Teknologi), H (Teknik): 10 sub (A-J), 45 pasang
//
// Tidak ada benar/salah - siswa memilih SATU dari sepasang.
// Skor 8 bidang dipetakan ke 18 area minat ABM (Tracey 2002).
// =====================================================================

const MINAT_BIDANG = [
  { kode:'A', nama:'Komunikasi' },
  { kode:'B', nama:'Seni' },
  { kode:'C', nama:'Kesehatan' },
  { kode:'D', nama:'Pariwisata' },
  { kode:'E', nama:'Administrasi' },
  { kode:'F', nama:'Teknologi' },
  { kode:'G', nama:'Agrobisnis' },
  { kode:'H', nama:'Teknik' }
];

// Sumber: TES MINAT New.pdf - label sub PERSIS dari PDF (hanya warna boleh diubah).
const MINAT_PROGRAM = {
  A: {
    nama:'Komunikasi',
    sub:[
      { kode:'A', nama:'Programer' },
      { kode:'B', nama:'Jaringan Internet' },
      { kode:'C', nama:'Kameraman' },
      { kode:'D', nama:'Instalasi Jaringan' },
      { kode:'E', nama:'Editing' },
      { kode:'F', nama:'Fotographer' },
      { kode:'G', nama:'Audio Visual' },
      { kode:'H', nama:'Pegawai PLN' }
    ],
    keahlian:{
      A:'Rekayasa Perangkat Lunak', B:'Teknik Komputer & Jaringan',
      C:'Multimedia / Sinematografi', D:'Teknik Komputer & Jaringan',
      E:'Multimedia / Editing Video', F:'Multimedia / Fotografi',
      G:'Broadcasting / Audio Visual', H:'Teknik Ketenagalistrikan'
    }
  },
  B: {
    nama:'Seni',
    sub:[
      { kode:'A', nama:'Pelukis' },
      { kode:'B', nama:'Pengrajin Kayu' },
      { kode:'C', nama:'Musisi' },
      { kode:'D', nama:'Penari' },
      { kode:'E', nama:'Karawitan' },
      { kode:'F', nama:'Dalang' },
      { kode:'G', nama:'Drama' },
      { kode:'H', nama:'Peneliti Budaya' }
    ],
    keahlian:{
      A:'Seni Lukis / Rupa', B:'Kriya Kreatif Kayu & Rotan',
      C:'Seni Musik', D:'Seni Tari',
      E:'Seni Karawitan', F:'Seni Pedalangan',
      G:'Seni Teater', H:'Seni Budaya / Antropologi'
    }
  },
  C: {
    nama:'Kesehatan',
    sub:[
      { kode:'A', nama:'Perawat' },
      { kode:'B', nama:'Psikologi' },
      { kode:'C', nama:'Farmasi' },
      { kode:'D', nama:'Petugas Panti asuhan' },
      { kode:'E', nama:'Dokter' },
      { kode:'F', nama:'Petugas Palang Merah' },
      { kode:'G', nama:'Apoteker' },
      { kode:'H', nama:'Pekerja sosial' }
    ],
    keahlian:{
      A:'Asisten Keperawatan', B:'Psikologi / Bimbingan',
      C:'Farmasi Klinis & Komunitas', D:'Pekerjaan Sosial',
      E:'Pra-Kedokteran / IPA', F:'Pekerjaan Sosial / PMI',
      G:'Farmasi Klinis & Komunitas', H:'Pekerjaan Sosial'
    }
  },
  D: {
    nama:'Pariwisata',
    sub:[
      { kode:'A', nama:'Pemandu Wisata' },
      { kode:'B', nama:'Juru Masak' },
      { kode:'C', nama:'Salon' },
      { kode:'D', nama:'Desainer' },
      { kode:'E', nama:'Traveling' },
      { kode:'F', nama:'Makeup Artis' },
      { kode:'G', nama:'Model Pakaian' },
      { kode:'H', nama:'Bartender' }
    ],
    keahlian:{
      A:'Usaha Perjalanan Wisata', B:'Tata Boga (Kuliner)',
      C:'Tata Kecantikan Kulit & Rambut', D:'Desain Komunikasi Visual',
      E:'Usaha Perjalanan Wisata', F:'Tata Kecantikan / Make-up',
      G:'Tata Busana / Modelling', H:'Perhotelan / FB Service'
    }
  },
  E: {
    nama:'Administrasi',
    sub:[
      { kode:'A', nama:'Administrasi' },
      { kode:'B', nama:'Akuntan' },
      { kode:'C', nama:'Pemasaran' },
      { kode:'D', nama:'Perbankan' },
      { kode:'E', nama:'Marketing' },
      { kode:'F', nama:'Sekertaris' },
      { kode:'G', nama:'Penjualan' },
      { kode:'H', nama:'Kasir' }
    ],
    keahlian:{
      A:'Manajemen Perkantoran', B:'Akuntansi & Keuangan Lembaga',
      C:'Bisnis Daring & Pemasaran', D:'Perbankan & Keuangan Mikro',
      E:'Bisnis Daring & Pemasaran', F:'Otomatisasi & Tata Kelola Perkantoran',
      G:'Bisnis Daring & Pemasaran', H:'Perbankan & Keuangan Mikro'
    }
  },
  F: {
    nama:'Teknologi',
    sub:[
      { kode:'A', nama:'Insinyur' },
      { kode:'B', nama:'Mekanik Pesawat' },
      { kode:'C', nama:'Pegawai Tambang' },
      { kode:'D', nama:'Petugas Pertanahan' },
      { kode:'E', nama:'Kontraktor' },
      { kode:'F', nama:'Konstruksi kayu' },
      { kode:'G', nama:'Jaringan Pipa' },
      { kode:'H', nama:'Komponen Listrik' },
      { kode:'I', nama:'Pertambangan Minyak' },
      { kode:'J', nama:'Percetakan' }
    ],
    keahlian:{
      A:'Teknik Mesin / Sipil', B:'Airframe & Powerplant',
      C:'Teknik Pertambangan', D:'Geomatika / Survei Pertanahan',
      E:'Konstruksi Gedung & Sipil', F:'Konstruksi Kayu',
      G:'Teknik Perpipaan', H:'Teknik Ketenagalistrikan',
      I:'Teknik Pengeboran Minyak & Gas', J:'Teknik Grafika / Percetakan'
    }
  },
  G: {
    nama:'Agrobisnis',
    sub:[
      { kode:'A', nama:'Petugas Perkebunan' },
      { kode:'B', nama:'Peternak' },
      { kode:'C', nama:'Dokter Hewan' },
      { kode:'D', nama:'Pengawas Hasil Pertanian dan Perikanan' },
      { kode:'E', nama:'Produksi Hasil Pertanian' },
      { kode:'F', nama:'Konservasi Hutan' },
      { kode:'G', nama:'Nelayan' },
      { kode:'H', nama:'Pengolahan Lahan' }
    ],
    keahlian:{
      A:'Agribisnis Tanaman Perkebunan', B:'Agribisnis Ternak',
      C:'Kesehatan Hewan', D:'Agribisnis Pengolahan Hasil Pertanian',
      E:'Agribisnis Pengolahan Hasil Pertanian', F:'Kehutanan',
      G:'Nautika / Perikanan Tangkap', H:'Mekanisasi Pertanian'
    }
  },
  H: {
    nama:'Teknik',
    sub:[
      { kode:'A', nama:'Operator Pabrik' },
      { kode:'B', nama:'Teknisi Instrument' },
      { kode:'C', nama:'Perawatan Mesin' },
      { kode:'D', nama:'Konstruksi Kapal' },
      { kode:'E', nama:'Nahkoda' },
      { kode:'F', nama:'Mekanik' },
      { kode:'G', nama:'Pengolahan Limbah' },
      { kode:'H', nama:'Pengolahan Hasil Tangkap' },
      { kode:'I', nama:'Desainer' },
      { kode:'J', nama:'Berlayar' }
    ],
    keahlian:{
      A:'Teknik Mesin / Industri', B:'Teknik Instrumentasi Industri',
      C:'Teknik Pemeliharaan Mekanik Industri', D:'Teknik Perkapalan',
      E:'Nautika Kapal Niaga', F:'Teknik Kendaraan Ringan Otomotif',
      G:'Teknik Kimia / Pengolahan Limbah', H:'Teknologi Produksi Perikanan',
      I:'Desain Komunikasi Visual', J:'Pelayaran / Nautika'
    }
  }
};

// Round-robin: untuk n item (A,B,...) menghasilkan C(n,2) pasangan
// dengan urutan PERSIS seperti di PDF (jarak 1, lalu 2, dst).
//   n=8  -> 28 pasang
//   n=10 -> 45 pasang
function generatePairsRR(letters) {
  const pairs = [];
  const n = letters.length;
  for (let d = 1; d < n; d++) {
    for (let i = 0; i + d < n; i++) {
      pairs.push([letters[i], letters[i + d]]);
    }
  }
  return pairs;
}

function getMinatBidang1Soal() {
  const letters = MINAT_BIDANG.map(b => b.kode);
  const namaByKode = Object.fromEntries(MINAT_BIDANG.map(b => [b.kode, b.nama]));
  const pairs = generatePairsRR(letters);
  return pairs.map((p, i) => ({
    id: 'B1-' + (i + 1), no_asli: i + 1,
    label_a: p[0], kata_a: namaByKode[p[0]],
    label_b: p[1], kata_b: namaByKode[p[1]]
  }));
}

function getMinatProgramSoal(progKode) {
  const prog = MINAT_PROGRAM[progKode];
  if (!prog) throw new Error('Program ' + progKode + ' tidak ditemukan');
  const letters = prog.sub.map(s => s.kode);
  const namaByKode = Object.fromEntries(prog.sub.map(s => [s.kode, s.nama]));
  const pairs = generatePairsRR(letters);
  return pairs.map((p, i) => ({
    id: 'P' + progKode + '-' + (i + 1), no_asli: i + 1,
    label_a: p[0], kata_a: namaByKode[p[0]],
    label_b: p[1], kata_b: namaByKode[p[1]]
  }));
}

// Pemetaan 8 BIDANG MINAT -> 18 area minat ABM (Tracey 2002)
const MINAT_ABM_MAP = {
  A: { 'Social Facilitating': 1.0, 'Helping': 0.5, 'Influence': 0.5, 'Personal Service': 0.3 },
  B: { 'Artistic': 1.0 },
  C: { 'Helping': 1.0, 'Social Sciences': 0.7, 'Personal Service': 0.3 },
  D: { 'Personal Service': 1.0, 'Basic Services': 0.7, 'Social Facilitating': 0.4 },
  E: { 'Business Detail': 1.0, 'Managing': 0.6, 'Financial Analysis': 0.5, 'Basic Services': 0.3 },
  F: { 'Data Processing': 1.0, 'Business Systems': 0.8, 'Mechanical': 0.4 },
  G: { 'Nature/Outdoors': 1.0, 'Manual Work': 0.5, 'Science': 0.3 },
  H: { 'Mechanical': 1.0, 'Construction/Repair': 0.8, 'Quality Control': 0.4, 'Manual Work': 0.4 }
};

const MINAT_ABM_AREAS = {
  dasar:   ['Social Facilitating','Managing','Business Detail','Data Processing','Mechanical','Nature/Outdoors','Artistic','Helping'],
  metodis: ['Social Sciences','Influence','Business Systems','Financial Analysis','Science'],
  praktis: ['Quality Control','Manual Work','Personal Service','Construction/Repair','Basic Services']
};

window.ABM = window.ABM || {};
Object.assign(window.ABM, {
  MINAT_BIDANG, MINAT_PROGRAM,
  getMinatBidang1Soal, getMinatProgramSoal,
  generatePairsRR,
  MINAT_ABM_MAP, MINAT_ABM_AREAS
});
