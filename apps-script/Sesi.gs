/**
 * Sesi - mengelola sesi tes siswa: mulai, ambil soal yang sudah diacak,
 * simpan jawaban per soal, dan finish.
 *
 * Saat startSession() dipanggil, soal diacak dengan SHUFFLE per siswa
 * sehingga MAPPING no_asli -> no_tampil unik per siswa. Mapping disimpan
 * di sheet Sesi (kolom mapping_json) sehingga admin dapat mengaudit
 * "soal nomor X dipindah ke nomor Y" pada laporan PDF.
 */

/** PRNG deterministik berbasis seed (Mulberry32). */
function mulberry32_(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle_(arr, seed) {
  const rng = mulberry32_(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/** Hash string ke 32-bit int sederhana untuk seed. */
function strSeed_(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Mulai sesi tes berdasarkan token yang valid.
 *
 * @param {string} token
 * @return {Object} { ok, sesi_id, jenis_tes, soal: [...], mapping }
 *   - Untuk jenis BAKAT: soal[] adalah array soal yang sudah diacak
 *     (tanpa kunci jawaban).
 *   - Untuk jenis MINAT: dikembalikan tahap "BIDANG_1" dulu (28 soal),
 *     program detail dipanggil setelah skoring tahap 1.
 */
function startSession(token) {
  const v = validateToken(token);
  if (!v.ok) return v;
  token = v.token;
  const sesiSheet = getSheet_(SHEETS.SESI);

  // Cegah double-start
  const existingIdx = findRowIndex_(sesiSheet, 'token', token);
  if (existingIdx > 0) {
    const existing = sheetToObjects_(sesiSheet)[existingIdx - 2];
    if (existing.finished_at) {
      return { ok: false, msg: 'Sesi sudah selesai sebelumnya.' };
    }
    // Lanjutkan sesi yang sudah ada
    return { ok: true, resume: true, ...buildSesiPayload_(existing) };
  }

  // Buat siswa baru atau cari yang sudah ada (NIS = unique key kalau ada)
  const siswaSheet = getSheet_(SHEETS.SISWA);
  let siswaId = null;
  if (v.siswa_nis) {
    const idx = findRowIndex_(siswaSheet, 'nis', v.siswa_nis);
    if (idx > 0) {
      siswaId = sheetToObjects_(siswaSheet)[idx - 2].siswa_id;
    }
  }
  if (!siswaId) {
    siswaId = 'S' + Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase();
    appendObject_(siswaSheet, {
      siswa_id: siswaId, nama: v.siswa_nama, nis: v.siswa_nis || '',
      kelas: v.siswa_kelas || '', sekolah: v.siswa_sekolah || '',
      tanggal_lahir: '', jenis_kelamin: '', created_at: new Date()
    });
  }

  // Generate sesi
  const sesiId = 'SES-' + Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  const seed = strSeed_(sesiId + ':' + token);
  let mapping;
  if (v.jenis_tes === 'bakat') {
    mapping = buildBakatMapping_(seed);
  } else {
    mapping = buildMinatBidang1Mapping_(seed);
  }

  appendObject_(sesiSheet, {
    sesi_id: sesiId, token: token, siswa_id: siswaId,
    jenis_tes: v.jenis_tes, mapping_json: JSON.stringify(mapping),
    started_at: new Date(), finished_at: ''
  });
  markTokenUsed_(token);
  audit_(siswaId, 'START_SESSION',
    'sesi=' + sesiId + ' jenis=' + v.jenis_tes + ' token=' + token);

  return {
    ok: true,
    resume: false,
    ...buildSesiPayload_({
      sesi_id: sesiId, token: token, siswa_id: siswaId,
      jenis_tes: v.jenis_tes, mapping_json: JSON.stringify(mapping)
    }, v)
  };
}

/** Bangun mapping soal bakat: tiap subtes diacak terpisah, lalu disusun. */
function buildBakatMapping_(seed) {
  const all = getBakatSoal_();
  const bySub = {};
  all.forEach(function(s) {
    if (!bySub[s.subtes]) bySub[s.subtes] = [];
    bySub[s.subtes].push(s.id);
  });
  const result = { jenis: 'bakat', subtes: {}, urutan: [] };
  let displayNo = 1;
  BAKAT_SUBTES.forEach(function(sub) {
    const ids = bySub[sub.kode] || [];
    const shuffled = seededShuffle_(ids, seed + strSeed_(sub.kode));
    result.subtes[sub.kode] = {
      kode: sub.kode, nama: sub.nama, dimensi: sub.dimensi,
      soal_ids: shuffled
    };
    shuffled.forEach(function(id) {
      result.urutan.push({ no_tampil: displayNo++, id_asli: id, subtes: sub.kode });
    });
  });
  return result;
}

function buildMinatBidang1Mapping_(seed) {
  const soal = getMinatBidang1Soal_();
  const ids = soal.map(function(s) { return s.id; });
  const shuffled = seededShuffle_(ids, seed);
  const urutan = shuffled.map(function(id, i) {
    return { no_tampil: i + 1, id_asli: id, subtes: 'BIDANG_1' };
  });
  return { jenis: 'minat', tahap: 'BIDANG_1', urutan: urutan };
}

function buildMinatProgramMapping_(seed, progKode) {
  const soal = getMinatProgramSoal_(progKode);
  const ids = soal.map(function(s) { return s.id; });
  const shuffled = seededShuffle_(ids, seed + strSeed_('PROG_' + progKode));
  return shuffled.map(function(id, i) {
    return { no_tampil: i + 1, id_asli: id, subtes: 'PROGRAM_' + progKode };
  });
}

/** Build payload untuk client (tanpa kunci jawaban). */
function buildSesiPayload_(sesi, tokenInfo) {
  const mapping = JSON.parse(sesi.mapping_json);
  if (sesi.jenis_tes === 'bakat') {
    const bank = {};
    getBakatSoal_().forEach(function(s) { bank[s.id] = s; });
    const soalDisplay = mapping.urutan.map(function(u) {
      const s = bank[u.id_asli];
      return {
        no_tampil: u.no_tampil, no_asli: parseInt(s.id.substring(2), 10),
        id: s.id, subtes: s.subtes,
        pertanyaan: s.pertanyaan, opsi: s.opsi
      };
    });
    return {
      sesi_id: sesi.sesi_id, jenis_tes: 'bakat',
      siswa: tokenInfoToSiswa_(tokenInfo, sesi),
      subtes_meta: BAKAT_SUBTES,
      soal: soalDisplay
    };
  }
  // Minat - tahap 1 saja yang langsung di-load
  const bank1 = {};
  getMinatBidang1Soal_().forEach(function(s) { bank1[s.id] = s; });
  const soalDisplay = mapping.urutan.map(function(u) {
    const s = bank1[u.id_asli];
    return {
      no_tampil: u.no_tampil, no_asli: s.no_asli, id: s.id,
      kata_a: s.kata_a, label_a: s.label_a,
      kata_b: s.kata_b, label_b: s.label_b
    };
  });
  return {
    sesi_id: sesi.sesi_id, jenis_tes: 'minat', tahap: mapping.tahap || 'BIDANG_1',
    siswa: tokenInfoToSiswa_(tokenInfo, sesi),
    soal: soalDisplay
  };
}

function tokenInfoToSiswa_(tokenInfo, sesi) {
  if (tokenInfo) {
    return {
      nama: tokenInfo.siswa_nama, nis: tokenInfo.siswa_nis,
      kelas: tokenInfo.siswa_kelas, sekolah: tokenInfo.siswa_sekolah
    };
  }
  // Fallback - cari dari sheet siswa
  const siswaSheet = getSheet_(SHEETS.SISWA);
  const idx = findRowIndex_(siswaSheet, 'siswa_id', sesi.siswa_id);
  if (idx > 0) {
    const r = sheetToObjects_(siswaSheet)[idx - 2];
    return { nama: r.nama, nis: r.nis, kelas: r.kelas, sekolah: r.sekolah };
  }
  return { nama: '-', nis: '-', kelas: '-', sekolah: '-' };
}

/**
 * Submit jawaban sebuah soal (incremental, sehingga tidak hilang jika
 * browser tertutup di tengah).
 *
 * @param {string} sesiId
 * @param {string} soalId   ID asli soal (mis. PV01)
 * @param {string} jawaban  'a'|'b'|'c'|'d'|'e' untuk bakat,
 *                          'A' atau 'B' label kata (utk minat)
 */
function submitJawaban(sesiId, soalId, jawaban) {
  const sesiSheet = getSheet_(SHEETS.SESI);
  const idx = findRowIndex_(sesiSheet, 'sesi_id', sesiId);
  if (idx < 0) return { ok: false, msg: 'Sesi tidak ditemukan.' };
  const sesi = sheetToObjects_(sesiSheet)[idx - 2];
  if (sesi.finished_at) return { ok: false, msg: 'Sesi sudah selesai.' };
  const mapping = JSON.parse(sesi.mapping_json);

  let no_tampil, subtes;
  let entry;
  if (sesi.jenis_tes === 'bakat') {
    entry = mapping.urutan.find(function(u) { return u.id_asli === soalId; });
    if (!entry) return { ok: false, msg: 'Soal tidak terdaftar di sesi.' };
    no_tampil = entry.no_tampil;
    subtes = entry.subtes;
  } else {
    if (mapping.tahap === 'BIDANG_1' && /^B1-/.test(soalId)) {
      entry = mapping.urutan.find(function(u) { return u.id_asli === soalId; });
    } else if (mapping.tahap && mapping.tahap.indexOf('PROGRAM_') === 0) {
      entry = (mapping.urutan || []).find(function(u) { return u.id_asli === soalId; });
    } else {
      return { ok: false, msg: 'Soal tidak sesuai tahap saat ini.' };
    }
    if (!entry) return { ok: false, msg: 'Soal tidak terdaftar di sesi.' };
    no_tampil = entry.no_tampil;
    subtes = entry.subtes;
  }

  // Hitung kebenaran (utk bakat). Minat tidak ada benar/salah.
  let benar = '';
  if (sesi.jenis_tes === 'bakat') {
    const bank = {};
    getBakatSoal_().forEach(function(s) { bank[s.id] = s; });
    benar = (bank[soalId] && String(bank[soalId].kunci).toLowerCase() ===
             String(jawaban).toLowerCase()) ? 'YA' : 'TIDAK';
  }

  // Upsert: kalau sudah ada baris untuk (sesi_id, soalId), update.
  const jSheet = getSheet_(SHEETS.JAWABAN);
  const data = jSheet.getDataRange().getValues();
  const headers = data[0];
  const sesiCol = headers.indexOf('sesi_id');
  const noAsliCol = headers.indexOf('no_asli');
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][sesiCol] === sesiId && data[i][noAsliCol] === soalId) {
      foundRow = i + 1; break;
    }
  }
  if (foundRow > 0) {
    updateRow_(jSheet, foundRow, {
      jawaban: String(jawaban), benar: benar, created_at: new Date()
    });
  } else {
    appendObject_(jSheet, {
      sesi_id: sesiId, no_asli: soalId, no_tampil: no_tampil,
      jawaban: String(jawaban), benar: benar, subtes: subtes,
      created_at: new Date()
    });
  }
  return { ok: true };
}

/**
 * Selesaikan sesi BAKAT. Jalankan skoring + simpan ke Hasil + return ringkasan.
 */
function finishBakat(sesiId) {
  const sesiSheet = getSheet_(SHEETS.SESI);
  const idx = findRowIndex_(sesiSheet, 'sesi_id', sesiId);
  if (idx < 0) return { ok: false, msg: 'Sesi tidak ditemukan.' };
  const sesi = sheetToObjects_(sesiSheet)[idx - 2];
  if (sesi.jenis_tes !== 'bakat') {
    return { ok: false, msg: 'finishBakat hanya untuk tes bakat.' };
  }
  if (sesi.finished_at) return { ok: false, msg: 'Sesi sudah selesai.' };

  const result = scoreBakat_(sesiId, sesi);
  updateRow_(sesiSheet, idx, { finished_at: new Date() });
  const hasilId = saveHasil_(sesi, result);
  audit_(sesi.siswa_id, 'FINISH_BAKAT',
    'sesi=' + sesiId + ' iq=' + result.iq_prediksi);
  return { ok: true, hasil_id: hasilId, ringkasan: result.ringkasan };
}

/**
 * Tahap ke-2 tes minat: setelah Bidang 1 selesai, sistem hitung 3 bidang
 * teratas, lalu sajikan Program detail untuk masing-masing.
 *
 * Client memanggil ini untuk transisi ke program berikutnya, dan terakhir
 * memanggil finishMinat() bila semua program selesai.
 */
function nextMinatProgram(sesiId, completedProg) {
  const sesiSheet = getSheet_(SHEETS.SESI);
  const idx = findRowIndex_(sesiSheet, 'sesi_id', sesiId);
  if (idx < 0) return { ok: false, msg: 'Sesi tidak ditemukan.' };
  const sesi = sheetToObjects_(sesiSheet)[idx - 2];
  if (sesi.jenis_tes !== 'minat') return { ok: false, msg: 'Bukan sesi minat.' };
  const mapping = JSON.parse(sesi.mapping_json);

  // Tentukan 3 bidang teratas berdasar jawaban di sheet jawaban (tahap BIDANG_1)
  const top3 = computeTop3Bidang_(sesiId);
  if (!mapping.programs) mapping.programs = {};
  if (!mapping.top3) mapping.top3 = top3.map(function(t) { return t.kode; });
  if (!mapping.completed) mapping.completed = [];
  if (completedProg) mapping.completed.push(completedProg);

  // Cari program berikutnya yang belum selesai
  const nextProg = mapping.top3.find(function(p) {
    return mapping.completed.indexOf(p) < 0;
  });

  if (!nextProg) {
    // Sudah selesai semua program
    updateRow_(sesiSheet, idx, { mapping_json: JSON.stringify(mapping) });
    return { ok: true, done: true };
  }

  // Generate mapping untuk program ini bila belum
  if (!mapping.programs[nextProg]) {
    const seed = strSeed_(sesiId + ':' + nextProg);
    mapping.programs[nextProg] = buildMinatProgramMapping_(seed, nextProg);
  }
  mapping.tahap = 'PROGRAM_' + nextProg;
  // urutan untuk submit -> ambil dari programs[nextProg]
  mapping.urutan = mapping.programs[nextProg];
  updateRow_(sesiSheet, idx, { mapping_json: JSON.stringify(mapping) });

  // Bangun soal untuk client
  const bank = {};
  getMinatProgramSoal_(nextProg).forEach(function(s) { bank[s.id] = s; });
  const soalDisplay = mapping.urutan.map(function(u) {
    const s = bank[u.id_asli];
    return {
      no_tampil: u.no_tampil, no_asli: s.no_asli, id: s.id,
      kata_a: s.kata_a, label_a: s.label_a,
      kata_b: s.kata_b, label_b: s.label_b
    };
  });
  const prog = MINAT_PROGRAM[nextProg];
  return {
    ok: true, done: false, program_kode: nextProg,
    program_nama: prog.nama, soal: soalDisplay
  };
}

function finishMinat(sesiId) {
  const sesiSheet = getSheet_(SHEETS.SESI);
  const idx = findRowIndex_(sesiSheet, 'sesi_id', sesiId);
  if (idx < 0) return { ok: false, msg: 'Sesi tidak ditemukan.' };
  const sesi = sheetToObjects_(sesiSheet)[idx - 2];
  if (sesi.jenis_tes !== 'minat') return { ok: false, msg: 'Bukan sesi minat.' };
  if (sesi.finished_at) return { ok: false, msg: 'Sesi sudah selesai.' };

  const result = scoreMinat_(sesiId, sesi);
  updateRow_(sesiSheet, idx, { finished_at: new Date() });
  const hasilId = saveHasil_(sesi, result);
  audit_(sesi.siswa_id, 'FINISH_MINAT', 'sesi=' + sesiId);
  return { ok: true, hasil_id: hasilId, ringkasan: result.ringkasan };
}

function saveHasil_(sesi, result) {
  const hasilId = 'HSL-' + Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  appendObject_(getSheet_(SHEETS.HASIL), {
    hasil_id: hasilId, sesi_id: sesi.sesi_id, siswa_id: sesi.siswa_id,
    jenis_tes: sesi.jenis_tes,
    skor_json: JSON.stringify(result.skor || {}),
    klasifikasi_json: JSON.stringify(result.klasifikasi || {}),
    iq_prediksi: result.iq_prediksi || '',
    rekomendasi_json: JSON.stringify(result.rekomendasi || {}),
    pdf_file_id: '',
    created_at: new Date()
  });
  return hasilId;
}
