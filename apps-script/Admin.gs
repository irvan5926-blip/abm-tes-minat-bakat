/**
 * Admin endpoints (dipanggil dari client via google.script.run).
 * Semua membutuhkan sessToken admin yang valid.
 */

function adminListTokens(sessToken) {
  requireAdmin_(sessToken);
  const sheet = getSheet_(SHEETS.TOKENS);
  const rows = sheetToObjects_(sheet);
  // Auto-expire sebelum return
  const now = Date.now();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const stCol = headers.indexOf('status');
  rows.forEach(function(r, i) {
    if (r.status === 'AKTIF' && new Date(r.expires_at).getTime() < now) {
      r.status = 'EXPIRED';
      sheet.getRange(i + 2, stCol + 1).setValue('EXPIRED');
    }
  });
  return rows.reverse(); // terbaru di atas
}

function adminListHasil(sessToken, filters) {
  requireAdmin_(sessToken);
  const hasilSheet = getSheet_(SHEETS.HASIL);
  const siswaSheet = getSheet_(SHEETS.SISWA);
  const siswaMap = {};
  sheetToObjects_(siswaSheet).forEach(function(s) {
    siswaMap[s.siswa_id] = s;
  });
  let rows = sheetToObjects_(hasilSheet);
  if (filters && filters.jenis_tes) {
    rows = rows.filter(function(r) { return r.jenis_tes === filters.jenis_tes; });
  }
  return rows.map(function(r) {
    const s = siswaMap[r.siswa_id] || {};
    return {
      hasil_id: r.hasil_id, sesi_id: r.sesi_id,
      siswa_id: r.siswa_id, siswa_nama: s.nama || '-',
      siswa_nis: s.nis || '-', siswa_kelas: s.kelas || '-',
      siswa_sekolah: s.sekolah || '-',
      jenis_tes: r.jenis_tes,
      iq_prediksi: r.iq_prediksi,
      created_at: r.created_at,
      ringkasan_klasifikasi: parseRingkasan_(r),
      pdf_file_id: r.pdf_file_id || ''
    };
  }).reverse();
}

function parseRingkasan_(r) {
  try {
    const k = JSON.parse(r.klasifikasi_json || '{}');
    if (r.jenis_tes === 'bakat') {
      const tinggi = Object.keys(k).filter(function(d) { return k[d].klasifikasi === 'Tinggi'; });
      return tinggi.length ? 'Tinggi: ' + tinggi.join(', ') : 'Sedang';
    }
    if (r.jenis_tes === 'minat') {
      const top3 = (k.top_3_bidang || []).map(function(b) { return b.nama; });
      return top3.join(', ');
    }
  } catch (e) {}
  return '-';
}

function adminGetHasilDetail(sessToken, hasilId) {
  requireAdmin_(sessToken);
  const hasilSheet = getSheet_(SHEETS.HASIL);
  const siswaSheet = getSheet_(SHEETS.SISWA);
  const sesiSheet = getSheet_(SHEETS.SESI);
  const hasil = sheetToObjects_(hasilSheet).find(function(r) {
    return r.hasil_id === hasilId;
  });
  if (!hasil) return { ok: false, msg: 'Hasil tidak ditemukan.' };
  const siswa = sheetToObjects_(siswaSheet).find(function(s) {
    return s.siswa_id === hasil.siswa_id;
  });
  const sesi = sheetToObjects_(sesiSheet).find(function(s) {
    return s.sesi_id === hasil.sesi_id;
  });
  return {
    ok: true,
    hasil: hasil,
    siswa: siswa || {},
    sesi: sesi || {},
    skor: JSON.parse(hasil.skor_json || '{}'),
    klasifikasi: JSON.parse(hasil.klasifikasi_json || '{}'),
    rekomendasi: JSON.parse(hasil.rekomendasi_json || '{}')
  };
}

function adminCancelToken(sessToken, token) {
  const adm = requireAdmin_(sessToken);
  const sheet = getSheet_(SHEETS.TOKENS);
  const idx = findRowIndex_(sheet, 'token', token);
  if (idx < 0) return { ok: false, msg: 'Token tidak ditemukan.' };
  updateRow_(sheet, idx, { status: 'DIBATALKAN' });
  audit_(adm.email, 'CANCEL_TOKEN', token);
  return { ok: true };
}

function adminGetStats(sessToken) {
  requireAdmin_(sessToken);
  const tokens = sheetToObjects_(getSheet_(SHEETS.TOKENS));
  const hasil = sheetToObjects_(getSheet_(SHEETS.HASIL));
  const siswa = sheetToObjects_(getSheet_(SHEETS.SISWA));
  return {
    total_token: tokens.length,
    token_aktif: tokens.filter(function(t) { return t.status === 'AKTIF'; }).length,
    token_terpakai: tokens.filter(function(t) { return t.status === 'TERPAKAI'; }).length,
    total_siswa: siswa.length,
    total_hasil_bakat: hasil.filter(function(h) { return h.jenis_tes === 'bakat'; }).length,
    total_hasil_minat: hasil.filter(function(h) { return h.jenis_tes === 'minat'; }).length
  };
}

/** Endpoint untuk siswa: melihat ringkasan hasil DIRI SENDIRI tanpa download PDF. */
function siswaGetRingkasan(sesiId) {
  const sesiSheet = getSheet_(SHEETS.SESI);
  const sesi = sheetToObjects_(sesiSheet).find(function(s) {
    return s.sesi_id === sesiId;
  });
  if (!sesi || !sesi.finished_at) {
    return { ok: false, msg: 'Sesi belum selesai atau tidak ditemukan.' };
  }
  const hasil = sheetToObjects_(getSheet_(SHEETS.HASIL))
    .find(function(h) { return h.sesi_id === sesiId; });
  if (!hasil) return { ok: false, msg: 'Hasil belum tersedia.' };
  return {
    ok: true,
    jenis_tes: sesi.jenis_tes,
    iq_prediksi: hasil.iq_prediksi,
    klasifikasi: JSON.parse(hasil.klasifikasi_json || '{}'),
    rekomendasi: JSON.parse(hasil.rekomendasi_json || '{}')
  };
}
