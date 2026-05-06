// =====================================================================
// Bank "soal" Tes Minat
// =====================================================================
// Tidak ada benar/salah - siswa memilih SATU dari sepasang.
//
// Tahap 1 (Bidang Soal 1): 28 pasangan dari 8 BIDANG MINAT (A-H).
// Sistem round-robin (jarak 1..7) menghasilkan tepat C(8,2)=28 pasangan,
// sesuai pola Buku Panduan Bakat & Minat SMK.
//
// Tahap 2 (Program X): per bidang dominan, 28 pasangan dari 8 sub-bidang
// (A-H) di dalam bidang itu. Hasil: rekomendasi pekerjaan + program keahlian.
//
// Skor 8 bidang dipetakan ke 18 area minat ABM (Tracey 2002) via tabel
// MINAT_ABM_MAP, lalu diklasifikasi per kelompok (dasar/metodis/praktis).
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

const MINAT_PROGRAM = {
  A: {
    nama:'Komunikasi',
    sub:[
      { kode:'A', nama:'Public Relations / Humas' },
      { kode:'B', nama:'Penyiar / Presenter' },
      { kode:'C', nama:'Wartawan / Jurnalis' },
      { kode:'D', nama:'Penerjemah / Interpreter' },
      { kode:'E', nama:'Konselor / BK' },
      { kode:'F', nama:'Marketing / Sales' },
      { kode:'G', nama:'Trainer / Fasilitator' },
      { kode:'H', nama:'Customer Service' }
    ],
    keahlian:{
      A:'Manajemen Perkantoran', B:'Broadcasting & Film',
      C:'Multimedia / Penyiaran', D:'Bahasa & Sastra Asing',
      E:'Bimbingan Konseling', F:'Bisnis Daring & Pemasaran',
      G:'Manajemen SDM', H:'Layanan Bisnis'
    }
  },
  B: {
    nama:'Seni',
    sub:[
      { kode:'A', nama:'Pelukis / Seniman' },
      { kode:'B', nama:'Desainer Grafis' },
      { kode:'C', nama:'Fotografer / Sinematografer' },
      { kode:'D', nama:'Penari / Koreografer' },
      { kode:'E', nama:'Musisi / Komposer' },
      { kode:'F', nama:'Aktor / Aktris' },
      { kode:'G', nama:'Animator' },
      { kode:'H', nama:'Perancang Mode' }
    ],
    keahlian:{
      A:'Seni Lukis / Rupa', B:'Desain Komunikasi Visual',
      C:'Multimedia / Sinematografi', D:'Seni Tari',
      E:'Seni Musik', F:'Seni Teater',
      G:'Animasi', H:'Tata Busana'
    }
  },
  C: {
    nama:'Kesehatan',
    sub:[
      { kode:'A', nama:'Perawat' },
      { kode:'B', nama:'Bidan' },
      { kode:'C', nama:'Asisten Apoteker / Farmasi' },
      { kode:'D', nama:'Analis Kesehatan' },
      { kode:'E', nama:'Ahli Gizi' },
      { kode:'F', nama:'Terapis / Fisioterapis' },
      { kode:'G', nama:'Asisten Dokter Gigi' },
      { kode:'H', nama:'Petugas Kesehatan Masyarakat' }
    ],
    keahlian:{
      A:'Asisten Keperawatan', B:'Asisten Kebidanan',
      C:'Farmasi Klinis & Komunitas', D:'Analis Kesehatan',
      E:'Tata Boga / Gizi', F:'Pekerjaan Sosial',
      G:'Asisten Keperawatan Gigi', H:'Kesehatan Masyarakat'
    }
  },
  D: {
    nama:'Pariwisata',
    sub:[
      { kode:'A', nama:'Pemandu Wisata' },
      { kode:'B', nama:'Resepsionis Hotel' },
      { kode:'C', nama:'Chef / Juru Masak' },
      { kode:'D', nama:'Barista / Bartender' },
      { kode:'E', nama:'Tour Planner' },
      { kode:'F', nama:'Penata Rias / Salon' },
      { kode:'G', nama:'Pengelola Spa' },
      { kode:'H', nama:'Event Organizer' }
    ],
    keahlian:{
      A:'Usaha Perjalanan Wisata', B:'Perhotelan',
      C:'Tata Boga (Kuliner)', D:'Tata Boga / FB Service',
      E:'Usaha Perjalanan Wisata', F:'Tata Kecantikan Kulit & Rambut',
      G:'Spa & Beauty Therapy', H:'Manajemen Perhotelan / Event'
    }
  },
  E: {
    nama:'Administrasi',
    sub:[
      { kode:'A', nama:'Sekretaris' },
      { kode:'B', nama:'Akuntan / Pembukuan' },
      { kode:'C', nama:'Kasir / Teller' },
      { kode:'D', nama:'HRD / SDM' },
      { kode:'E', nama:'Staf Logistik / Gudang' },
      { kode:'F', nama:'Staf Pajak' },
      { kode:'G', nama:'Auditor Junior' },
      { kode:'H', nama:'Notaris / Legal' }
    ],
    keahlian:{
      A:'Manajemen Perkantoran', B:'Akuntansi & Keuangan Lembaga',
      C:'Perbankan & Keuangan Mikro', D:'Manajemen SDM',
      E:'Logistik', F:'Akuntansi & Keuangan Lembaga',
      G:'Akuntansi & Keuangan Lembaga', H:'Layanan Bisnis'
    }
  },
  F: {
    nama:'Teknologi',
    sub:[
      { kode:'A', nama:'Programmer / Software Engineer' },
      { kode:'B', nama:'Web Developer' },
      { kode:'C', nama:'Network Engineer' },
      { kode:'D', nama:'Data Analyst' },
      { kode:'E', nama:'Cyber Security' },
      { kode:'F', nama:'IT Support' },
      { kode:'G', nama:'Game Developer' },
      { kode:'H', nama:'UI/UX Designer'  }
    ],
    keahlian:{
      A:'Rekayasa Perangkat Lunak', B:'Pengembangan Web',
      C:'Teknik Komputer & Jaringan', D:'Sistem Informatika & Data',
      E:'Keamanan Siber', F:'Teknik Komputer & Jaringan',
      G:'Animasi / Game', H:'Desain Komunikasi Visual'
    }
  },
  G: {
    nama:'Agrobisnis',
    sub:[
      { kode:'A', nama:'Petugas Perkebunan' },
      { kode:'B', nama:'Peternak' },
      { kode:'C', nama:'Pengolah Hasil Pertanian' },
      { kode:'D', nama:'Pengawas Hasil Pertanian' },
      { kode:'E', nama:'Mekanisasi Pertanian' },
      { kode:'F', nama:'Konservasi Hutan' },
      { kode:'G', nama:'Nelayan / Perikanan' },
      { kode:'H', nama:'Pengolahan Lahan' }
    ],
    keahlian:{
      A:'Agribisnis Tanaman Perkebunan', B:'Agribisnis Ternak',
      C:'Agribisnis Pengolahan Hasil Pertanian',
      D:'Agribisnis Pengolahan Hasil Pertanian',
      E:'Mekanisasi Pertanian', F:'Kehutanan',
      G:'Perikanan / Nautika', H:'Mekanisasi Pertanian'
    }
  },
  H: {
    nama:'Teknik',
    sub:[
      { kode:'A', nama:'Operator Pabrik' },
      { kode:'B', nama:'Teknisi Instrumen' },
      { kode:'C', nama:'Perawatan Mesin' },
      { kode:'D', nama:'Konstruksi Kapal' },
      { kode:'E', nama:'Nakhoda' },
      { kode:'F', nama:'Mekanik Otomotif' },
      { kode:'G', nama:'Pengolahan Limbah' },
      { kode:'H', nama:'Pengolahan Hasil Tangkap'  }
    ],
    keahlian:{
      A:'Teknik Mesin', B:'Teknik Instrumentasi Industri',
      C:'Teknik Industri', D:'Teknik Perkapalan',
      E:'Nautika Kapal Niaga', F:'Teknik Kendaraan Ringan Otomotif',
      G:'Teknik Kimia Industri', H:'Teknologi Produksi Perikanan Budidaya'
    }
  }
};

// Generate 28 pasang round-robin (jarak 1..n-1)
function generatePairs28(letters) {
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
  const pairs = generatePairs28(letters);
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
  const pairs = generatePairs28(letters);
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
  MINAT_ABM_MAP, MINAT_ABM_AREAS
});
