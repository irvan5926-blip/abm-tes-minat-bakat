// =====================================================================
// Bank soal Tes Bakat
// =====================================================================
// Struktur 9 subtes ABM yang dipetakan ke 7 dimensi (Pusmendik 2024):
//
//   Subtes                    -> Dimensi ABM
//   1. Penalaran Visual (PV)  -> Spasial
//   2. Penalaran Numerik (PN) -> Kuantitatif
//   3. Analisa Verbal (AV)    -> Verbal
//   4. Penalaran Urutan (PU)  -> Penalaran
//   5. Pengenalan Spasial(PS) -> Spasial
//   6. Tiga Dimensi (TD)      -> Mekanika (proksi Spasial)
//   7. Sistematisasi (SI)     -> Klerikal
//   8. Kosa Kata (KK)         -> Bahasa
//   9. Figural Angka (FA)     -> Kuantitatif
//
// MODEL KONTEN (sejak v2.2):
//   Soal aktif disimpan di DB Supabase tabel `bank_soal_bakat`. Admin
//   meng-upload gambar halaman ke Supabase Storage bucket "bakat-pages"
//   dan mengelola entry soal lewat tab "Bank Soal" di dashboard admin.
//   Frontend memuat soal aktif via RPC `api_get_bank_soal_active`.
//
//   File ini menyediakan:
//   - BAKAT_SUBTES: definisi 9 subtes + answer_type default + dimensi
//   - BAKAT_SOAL_DEMO: bank soal demo (text-based) sebagai fallback
//     bila admin belum upload bank soal di DB.
//   - loadBakatBank(): async, ambil bank soal aktif. Auto fallback ke
//     BAKAT_SOAL_DEMO jika DB kosong / Supabase belum dikonfigurasi.
//   - BAKAT_SOAL: legacy alias (dipakai oleh PDF audit, dll). Diupdate
//     setelah loadBakatBank() selesai.
// =====================================================================

const BAKAT_SUBTES = [
  { kode:'PV', nama:'Penalaran Visual',   dimensi:'Spasial',     durasi:8,  answer_type:'letter5' },
  { kode:'PN', nama:'Penalaran Numerik',  dimensi:'Kuantitatif', durasi:10, answer_type:'number'  },
  { kode:'AV', nama:'Analisa Verbal',     dimensi:'Verbal',      durasi:12, answer_type:'letter6' },
  { kode:'PU', nama:'Penalaran Urutan',   dimensi:'Penalaran',   durasi:10, answer_type:'letter5' },
  { kode:'PS', nama:'Pengenalan Spasial', dimensi:'Spasial',     durasi:8,  answer_type:'sb'      },
  { kode:'TD', nama:'Tiga Dimensi',       dimensi:'Mekanika',    durasi:10, answer_type:'letter5' },
  { kode:'SI', nama:'Sistematisasi',      dimensi:'Klerikal',    durasi:15, answer_type:'letter5' },
  { kode:'KK', nama:'Kosa Kata',          dimensi:'Bahasa',      durasi:10, answer_type:'letter4' },
  { kode:'FA', nama:'Figural Angka',      dimensi:'Kuantitatif', durasi:10, answer_type:'number'  }
];

// Bank soal DEMO — fallback bila admin belum upload bank soal di DB.
// Konten generik (urutan angka, geometri dasar). Tidak diperlukan saat
// `bank_soal_bakat` di Supabase sudah berisi soal aktif.
const BAKAT_SOAL_DEMO = [
  // --- 1. Penalaran Visual (PV) ---
  { id:'PV01', subtes:'PV', pertanyaan:'Manakah pola yang BERBEDA dari empat pola lainnya?',
    opsi:{a:'■ ● ■ ●', b:'▲ ◆ ▲ ◆', c:'★ ☀ ★ ☀', d:'♣ ♠ ♣ ♥', e:'☂ ⚑ ☂ ⚑'},
    kunci:'d' },
  { id:'PV02', subtes:'PV', pertanyaan:'Lanjutan rangkaian: ◯ → ◐ → ● → ◑ → ?',
    opsi:{a:'◯', b:'◐', c:'●', d:'◑', e:'◓'},
    kunci:'a' },
  { id:'PV03', subtes:'PV', pertanyaan:'Gambar mana yang TIDAK termasuk kelompok yang sama?',
    opsi:{a:'segitiga sama sisi', b:'segitiga sama kaki', c:'segitiga siku-siku', d:'persegi', e:'segitiga lancip'},
    kunci:'d' },
  { id:'PV04', subtes:'PV', pertanyaan:'Jika ▲ berputar 90° searah jarum jam tiap langkah, posisi setelah 3 langkah dari ▲ (atas) adalah?',
    opsi:{a:'▶ (kanan)', b:'▼ (bawah)', c:'◀ (kiri)', d:'▲ (atas)', e:'◆ (45°)'},
    kunci:'c' },
  { id:'PV05', subtes:'PV', pertanyaan:'Lanjutan: △ ▽ △ ▽ △ ?',
    opsi:{a:'△', b:'▽', c:'◇', d:'○', e:'□'}, kunci:'b' },
  { id:'PV06', subtes:'PV', pertanyaan:'Manakah yang BERBEDA: kucing - anjing - merpati - kuda - sapi?',
    opsi:{a:'kucing', b:'anjing', c:'merpati', d:'kuda', e:'sapi'},
    kunci:'c' },
  { id:'PV07', subtes:'PV', pertanyaan:'Bayangan huruf "b" pada cermin vertikal adalah?',
    opsi:{a:'b', b:'d', c:'p', d:'q', e:'B'}, kunci:'b' },
  { id:'PV08', subtes:'PV', pertanyaan:'Bertambah berapa tiap langkah: 2 segitiga, 4 persegi, 6 segilima, 8 segienam, ? segitujuh',
    opsi:{a:'7', b:'9', c:'10', d:'12', e:'14'}, kunci:'c' },

  // --- 2. Penalaran Numerik (PN) ---
  { id:'PN01', subtes:'PN', pertanyaan:'Lengkapi: 2, 4, 6, 8, ?',
    opsi:{a:'9', b:'10', c:'11', d:'12', e:'14'}, kunci:'b' },
  { id:'PN02', subtes:'PN', pertanyaan:'Lengkapi: 1, 3, 9, 27, ?',
    opsi:{a:'54', b:'63', c:'72', d:'81', e:'90'}, kunci:'d' },
  { id:'PN03', subtes:'PN', pertanyaan:'Lengkapi: 1, 1, 2, 3, 5, 8, ?',
    opsi:{a:'11', b:'12', c:'13', d:'14', e:'15'}, kunci:'c' },
  { id:'PN04', subtes:'PN', pertanyaan:'Lengkapi: 100, 50, 25, 12.5, ?',
    opsi:{a:'5', b:'6', c:'6.25', d:'7.25', e:'10'}, kunci:'c' },
  { id:'PN05', subtes:'PN', pertanyaan:'Lengkapi: 2, 6, 12, 20, 30, ?',
    opsi:{a:'36', b:'40', c:'42', d:'48', e:'56'}, kunci:'c' },
  { id:'PN06', subtes:'PN', pertanyaan:'Hasil 7 × 8 − 12 = ?',
    opsi:{a:'40', b:'42', c:'44', d:'46', e:'48'}, kunci:'c' },
  { id:'PN07', subtes:'PN', pertanyaan:'Lengkapi: 5, 10, 20, 40, ?',
    opsi:{a:'60', b:'70', c:'80', d:'100', e:'120'}, kunci:'c' },
  { id:'PN08', subtes:'PN', pertanyaan:'Lengkapi: 81, 64, 49, 36, ?',
    opsi:{a:'16', b:'20', c:'25', d:'27', e:'30'}, kunci:'c' },
  { id:'PN09', subtes:'PN', pertanyaan:'Lengkapi: 3, 7, 15, 31, ?',
    opsi:{a:'47', b:'55', c:'63', d:'71', e:'79'}, kunci:'c' },
  { id:'PN10', subtes:'PN', pertanyaan:'¼ dari 240 = ?',
    opsi:{a:'40', b:'50', c:'60', d:'70', e:'80'}, kunci:'c' },

  // --- 3. Analisa Verbal (AV) ---
  { id:'AV01', subtes:'AV', pertanyaan:'Anton, Budi, Johan masing-masing punya 2 mobil. Hanya 1 yang tidak punya Toyota. Budi satu-satunya pemilik Honda. Johan punya Toyota. Anton dan Budi punya Suzuki. Siapa pemilik Mercy?',
    opsi:{a:'Anton', b:'Budi', c:'Johan', d:'Tidak ada', e:'Tidak dapat ditentukan'},
    kunci:'c' },
  { id:'AV02', subtes:'AV', pertanyaan:'Semua dokter pintar. Sebagian orang pintar kaya. Kesimpulan paling tepat?',
    opsi:{a:'Semua dokter kaya', b:'Tidak ada dokter kaya', c:'Sebagian dokter mungkin kaya', d:'Semua orang kaya adalah dokter', e:'Tidak ada simpulan'},
    kunci:'c' },
  { id:'AV03', subtes:'AV', pertanyaan:'Hari ini Selasa. Dua hari setelah lusa adalah?',
    opsi:{a:'Kamis', b:'Jumat', c:'Sabtu', d:'Minggu', e:'Senin'},
    kunci:'c' },
  { id:'AV04', subtes:'AV', pertanyaan:'Andi > Beni > Cahyo > Doni. Yang paling pendek?',
    opsi:{a:'Andi', b:'Beni', c:'Cahyo', d:'Doni', e:'Tidak dapat ditentukan'}, kunci:'d' },
  { id:'AV05', subtes:'AV', pertanyaan:'5 anak duduk berderet. Ali di kiri Bagas, Cici di kanan Bagas, Dedi di kiri Ali, Eka di kanan Cici. Urutan kiri ke kanan?',
    opsi:{a:'Dedi-Ali-Bagas-Cici-Eka', b:'Ali-Dedi-Bagas-Cici-Eka', c:'Dedi-Bagas-Ali-Cici-Eka', d:'Eka-Cici-Bagas-Ali-Dedi', e:'Tidak dapat ditentukan'},
    kunci:'a' },
  { id:'AV06', subtes:'AV', pertanyaan:'Setiap pelajar wajib disiplin. Sandi tidak disiplin. Maka:',
    opsi:{a:'Sandi pasti pelajar', b:'Sandi pasti bukan pelajar', c:'Sandi mungkin pelajar', d:'Sandi pasti malas', e:'Tidak dapat disimpulkan'},
    kunci:'b' },
  { id:'AV07', subtes:'AV', pertanyaan:'Jika hujan, jalan basah. Jalan tidak basah. Maka:',
    opsi:{a:'Hujan', b:'Tidak hujan', c:'Mungkin hujan', d:'Mungkin gerimis', e:'Tidak dapat disimpulkan'},
    kunci:'b' },
  { id:'AV08', subtes:'AV', pertanyaan:'A > B, B > C, C = D. Hubungan A dan D?',
    opsi:{a:'A > D', b:'A < D', c:'A = D', d:'Tidak dapat ditentukan', e:'A ≤ D'}, kunci:'a' },

  // --- 4. Penalaran Urutan (PU) ---
  { id:'PU01', subtes:'PU', pertanyaan:'Lanjutan: ○ □ △ ○ □ △ ○ □ ?',
    opsi:{a:'○', b:'□', c:'△', d:'◇', e:'☆'}, kunci:'c' },
  { id:'PU02', subtes:'PU', pertanyaan:'Lanjutan huruf: A C E G I ?',
    opsi:{a:'J', b:'K', c:'L', d:'M', e:'N'}, kunci:'b' },
  { id:'PU03', subtes:'PU', pertanyaan:'Lanjutan: 1A, 2C, 3E, 4G, ?',
    opsi:{a:'5H', b:'5I', c:'6I', d:'5K', e:'6K'}, kunci:'b' },
  { id:'PU04', subtes:'PU', pertanyaan:'Lanjutan: Z Y W T P ?',
    opsi:{a:'O', b:'N', c:'M', d:'K', e:'J'}, kunci:'d' },
  { id:'PU05', subtes:'PU', pertanyaan:'Lanjutan: 2 4 8 16 32 ?',
    opsi:{a:'48', b:'56', c:'64', d:'72', e:'128'}, kunci:'c' },
  { id:'PU06', subtes:'PU', pertanyaan:'Lengkapi: J F M A M J J A S O N ?',
    opsi:{a:'O', b:'N', c:'D', d:'J', e:'S'}, kunci:'c' },
  { id:'PU07', subtes:'PU', pertanyaan:'Lanjutan: 1, 4, 9, 16, 25, ?',
    opsi:{a:'30', b:'32', c:'36', d:'40', e:'49'}, kunci:'c' },
  { id:'PU08', subtes:'PU', pertanyaan:'Lanjutan: 100, 99, 97, 94, 90, ?',
    opsi:{a:'85', b:'86', c:'87', d:'88', e:'89'}, kunci:'a' },

  // --- 5. Pengenalan Spasial (PS) ---
  { id:'PS01', subtes:'PS', pertanyaan:'Berapa banyak persegi pada gambar ini? □□ / □□ (susunan 2×2)?',
    opsi:{a:'4', b:'5', c:'6', d:'8', e:'9'}, kunci:'b' },
  { id:'PS02', subtes:'PS', pertanyaan:'Sebuah kubus dipotong jadi 27 kubus kecil (3×3×3). Yang punya tepat 1 sisi terlihat?',
    opsi:{a:'1', b:'6', c:'8', d:'12', e:'27'}, kunci:'b' },
  { id:'PS03', subtes:'PS', pertanyaan:'Bila huruf "L" diputar 180° searah jarum jam, terlihat seperti?',
    opsi:{a:'L', b:'⌐', c:'⌐ terbalik', d:'⌐ rotasi 90°', e:'huruf ⌐'},
    kunci:'c' },
  { id:'PS04', subtes:'PS', pertanyaan:'Kubus dilipat dari net (jaring-jaring). Berapa sisi tetangga sisi tengah?',
    opsi:{a:'2', b:'3', c:'4', d:'5', e:'6'}, kunci:'c' },
  { id:'PS05', subtes:'PS', pertanyaan:'Berapa segitiga total pada bintang Daud (heksagram)?',
    opsi:{a:'2', b:'6', c:'8', d:'12', e:'14'}, kunci:'c' },
  { id:'PS06', subtes:'PS', pertanyaan:'Bayangan piramida segitiga di atas tanah datar saat matahari tepat di atas?',
    opsi:{a:'segitiga', b:'persegi', c:'lingkaran', d:'titik', e:'segiempat'}, kunci:'a' },
  { id:'PS07', subtes:'PS', pertanyaan:'Sebuah kotak 4×4×4. Berapa banyak kubus 1×1×1 di dalamnya?',
    opsi:{a:'12', b:'16', c:'32', d:'48', e:'64'}, kunci:'e' },
  { id:'PS08', subtes:'PS', pertanyaan:'Pencerminan kata "POP" pada cermin vertikal?',
    opsi:{a:'POP', b:'qoq', c:'PoP', d:'QOQ', e:'pop'}, kunci:'a' },

  // --- 6. Tiga Dimensi (TD) ---
  { id:'TD01', subtes:'TD', pertanyaan:'Bila kubus dibuka jadi jaring-jaring T-shape, ada berapa persegi?',
    opsi:{a:'4', b:'5', c:'6', d:'7', e:'8'}, kunci:'c' },
  { id:'TD02', subtes:'TD', pertanyaan:'Volume balok 5×4×3?',
    opsi:{a:'12', b:'24', c:'45', d:'60', e:'120'}, kunci:'d' },
  { id:'TD03', subtes:'TD', pertanyaan:'Luas permukaan kubus rusuk 4 cm?',
    opsi:{a:'16', b:'48', c:'64', d:'96', e:'128'}, kunci:'d' },
  { id:'TD04', subtes:'TD', pertanyaan:'Diagonal ruang kubus rusuk 3?',
    opsi:{a:'3', b:'3√2', c:'3√3', d:'9', e:'6√2'}, kunci:'c' },
  { id:'TD05', subtes:'TD', pertanyaan:'Bila balok 2×3×4 dipotong jadi kubus 1×1×1, berapa kubus terbentuk?',
    opsi:{a:'9', b:'12', c:'18', d:'24', e:'30'}, kunci:'d' },
  { id:'TD06', subtes:'TD', pertanyaan:'Sisi yang berhadapan dengan sisi atas kubus jika diputar 180° searah sumbu Y?',
    opsi:{a:'depan', b:'belakang', c:'kanan', d:'kiri', e:'tetap atas'},
    kunci:'e' },

  // --- 7. Sistematisasi (SI) - mencocokkan/menyusun cepat ---
  { id:'SI01', subtes:'SI', pertanyaan:'Dari deret: 312, 132, 213, 321, 231 - mana yang JIKA dijumlahkan digit-nya = 6 dan urut?',
    opsi:{a:'312', b:'132', c:'213', d:'321', e:'231'}, kunci:'c' },
  { id:'SI02', subtes:'SI', pertanyaan:'Pasangkan: 1->A, 2->B, 3->C, 4->D, 5->E. Berapa kode "BAEDC"?',
    opsi:{a:'12534', b:'21543', c:'12453', d:'21345', e:'12345'}, kunci:'a' },
  { id:'SI03', subtes:'SI', pertanyaan:'Daftar nama: ANI, BAGAS, CICI, DEDI, ELI - dalam urutan abjad. Yang ke-3 adalah?',
    opsi:{a:'ANI', b:'BAGAS', c:'CICI', d:'DEDI', e:'ELI'}, kunci:'c' },
  { id:'SI04', subtes:'SI', pertanyaan:'Mengurutkan jam: 14:30, 09:15, 23:00, 06:45, 19:20. Yang paling awal?',
    opsi:{a:'14:30', b:'09:15', c:'23:00', d:'06:45', e:'19:20'}, kunci:'d' },
  { id:'SI05', subtes:'SI', pertanyaan:'Dari kode kelas X-A, X-B, XI-A, XI-B, XII-A: yang TERTUA?',
    opsi:{a:'X-A', b:'X-B', c:'XI-A', d:'XI-B', e:'XII-A'}, kunci:'e' },
  { id:'SI06', subtes:'SI', pertanyaan:'Kalender: 1 Januari 2025 = Rabu. Maka 8 Januari 2025?',
    opsi:{a:'Selasa', b:'Rabu', c:'Kamis', d:'Jumat', e:'Sabtu'}, kunci:'b' },

  // --- 8. Kosa Kata (KK) ---
  { id:'KK01', subtes:'KK', pertanyaan:'Sinonim dari "RAJIN":',
    opsi:{a:'Malas', b:'Tekun', c:'Lambat', d:'Marah', e:'Riang'}, kunci:'b' },
  { id:'KK02', subtes:'KK', pertanyaan:'Antonim dari "BERANI":',
    opsi:{a:'Pemalu', b:'Pendiam', c:'Pengecut', d:'Pelit', e:'Pembohong'}, kunci:'c' },
  { id:'KK03', subtes:'KK', pertanyaan:'Sinonim "BIJAKSANA":',
    opsi:{a:'Bodoh', b:'Cerdas', c:'Arif', d:'Tegas', e:'Ramah'}, kunci:'c' },
  { id:'KK04', subtes:'KK', pertanyaan:'"Pohon" : "Akar" =? : ?',
    opsi:{a:'rumah:atap', b:'mobil:roda', c:'gunung:lereng', d:'gedung:fondasi', e:'sungai:hilir'},
    kunci:'d' },
  { id:'KK05', subtes:'KK', pertanyaan:'Antonim "BOROS":',
    opsi:{a:'Hemat', b:'Pelit', c:'Kaya', d:'Lapang', e:'Murah'}, kunci:'a' },
  { id:'KK06', subtes:'KK', pertanyaan:'Padanan kata "EKSPLISIT":',
    opsi:{a:'Tersirat', b:'Tegas', c:'Tertulis', d:'Tersurat', e:'Terbuka'}, kunci:'d' },
  { id:'KK07', subtes:'KK', pertanyaan:'Lawan kata "FIKTIF":',
    opsi:{a:'Realita', b:'Maya', c:'Imajiner', d:'Khayal', e:'Karangan'}, kunci:'a' },
  { id:'KK08', subtes:'KK', pertanyaan:'Padanan "EVALUASI":',
    opsi:{a:'Permulaan', b:'Penilaian', c:'Penyelesaian', d:'Persiapan', e:'Pelaksanaan'},
    kunci:'b' },

  // --- 9. Figural Angka (FA) ---
  { id:'FA01', subtes:'FA', pertanyaan:'Hasil 12 + 13 + 14 + 15 = ?',
    opsi:{a:'52', b:'54', c:'56', d:'58', e:'60'}, kunci:'b' },
  { id:'FA02', subtes:'FA', pertanyaan:'Selesaikan: 144 ÷ 12 + 6 × 2 = ?',
    opsi:{a:'18', b:'24', c:'30', d:'36', e:'48'}, kunci:'b' },
  { id:'FA03', subtes:'FA', pertanyaan:'25% dari 480 = ?',
    opsi:{a:'96', b:'120', c:'160', d:'240', e:'360'}, kunci:'b' },
  { id:'FA04', subtes:'FA', pertanyaan:'Akar dari 729 = ?',
    opsi:{a:'21', b:'24', c:'27', d:'29', e:'33'}, kunci:'c' },
  { id:'FA05', subtes:'FA', pertanyaan:'Bila 3x + 4 = 19, maka x = ?',
    opsi:{a:'3', b:'4', c:'5', d:'6', e:'7'}, kunci:'c' },
  { id:'FA06', subtes:'FA', pertanyaan:'Rata-rata 60, 70, 80, 90 = ?',
    opsi:{a:'70', b:'72', c:'75', d:'78', e:'80'}, kunci:'c' },
  { id:'FA07', subtes:'FA', pertanyaan:'Jam 14:35 + 2 jam 50 menit = ?',
    opsi:{a:'17:25', b:'17:15', c:'16:25', d:'16:55', e:'17:35'}, kunci:'a' },
  { id:'FA08', subtes:'FA', pertanyaan:'Skala 1:200.000. Jarak peta 4,5 cm = ? km',
    opsi:{a:'4,5', b:'9', c:'45', d:'90', e:'900'}, kunci:'b' }
];

// Bank aktif yang dipakai oleh app/skoring. Awalnya = DEMO; di-replace
// oleh hasil loadBakatBank() saat sesi tes mulai.
let BAKAT_SOAL = BAKAT_SOAL_DEMO.slice();

// Ambil bank soal aktif dari Supabase. Hasil di-merge ke BAKAT_SOAL.
// Return: { source: 'db'|'demo', soal: [...], count: N }
async function loadBakatBank() {
  const A = window.ABM || {};
  if (!A.isConfigured || !A.isConfigured()) {
    BAKAT_SOAL = BAKAT_SOAL_DEMO.slice();
    A.BAKAT_SOAL = BAKAT_SOAL;
    return { source: 'demo', soal: BAKAT_SOAL, count: BAKAT_SOAL.length, reason: 'supabase-not-configured' };
  }
  try {
    const r = await A.rpc('api_get_bank_soal_active', { p_subtes: null });
    if (Array.isArray(r) && r.length > 0) {
      // Map row DB ke struktur BAKAT_SOAL
      const soal = r.map(row => ({
        id: row.subtes + String(row.no).padStart(2,'0') + (row.sub_index ? '_' + row.sub_index : ''),
        no_asli: row.no,
        sub_index: row.sub_index || 0,
        subtes: row.subtes,
        image_path: row.image_path || '',
        answer_type: row.answer_type || 'letter5',
        kunci: String(row.kunci || '').toLowerCase().trim(),
        label: row.label || '',
        pertanyaan: row.label || ('Soal ' + row.subtes + ' no.' + row.no + (row.sub_index ? ' (jawaban ' + row.sub_index + ')' : '')),
        opsi: defaultOpsiFor(row.answer_type || 'letter5')
      }));
      BAKAT_SOAL = soal;
      A.BAKAT_SOAL = BAKAT_SOAL;
      return { source: 'db', soal, count: soal.length };
    }
  } catch (e) { /* fallback */ }
  BAKAT_SOAL = BAKAT_SOAL_DEMO.slice();
  A.BAKAT_SOAL = BAKAT_SOAL;
  return { source: 'demo', soal: BAKAT_SOAL, count: BAKAT_SOAL.length, reason: 'db-empty' };
}

// Generate signed URLs untuk semua image_path soal aktif (anon, default
// 60 menit). Return Map<image_path, signedUrl>. Dipanggil sekali saat
// startTes agar tidak ada round-trip per soal.
async function signBakatPages(soalList) {
  const A = window.ABM || {};
  const sb = A.getClient && A.getClient();
  const map = {};
  if (!sb) return map;
  const paths = Array.from(new Set((soalList || [])
    .map(s => s.image_path).filter(p => p && p.length > 0)));
  if (paths.length === 0) return map;
  // batch via createSignedUrls (1 request)
  const { data, error } = await sb.storage.from('bakat-pages')
    .createSignedUrls(paths, 60 * 60);
  if (error) { console.warn('createSignedUrls', error); return map; }
  (data || []).forEach(d => {
    if (d && d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

// Default opsi untuk render UI berdasar answer_type. Hanya dipakai
// sebagai placeholder; untuk image-based, gambar yang menjadi konten,
// label opsi (a/b/c/...) dirender oleh views.js.
function defaultOpsiFor(at) {
  switch (at) {
    case 'letter4': return { a:'A', b:'B', c:'C', d:'D' };
    case 'letter5': return { a:'A', b:'B', c:'C', d:'D', e:'E' };
    case 'letter6': return { a:'A', b:'B', c:'C', d:'D', e:'E', f:'F' };
    case 'sb':      return { s:'S (Sama)', b:'B (Berbeda)' };
    case 'number':  return {}; // input bebas
    default:        return { a:'A', b:'B', c:'C', d:'D', e:'E' };
  }
}

window.ABM = window.ABM || {};
window.ABM.BAKAT_SUBTES = BAKAT_SUBTES;
window.ABM.BAKAT_SOAL = BAKAT_SOAL;
window.ABM.BAKAT_SOAL_DEMO = BAKAT_SOAL_DEMO;
window.ABM.loadBakatBank = loadBakatBank;
window.ABM.signBakatPages = signBakatPages;
window.ABM.defaultOpsiFor = defaultOpsiFor;
