/**
 * Skoring tes Bakat & Minat + prediksi IQ.
 *
 * BAKAT
 *   - Tiap soal = 1 poin (jawaban benar).
 *   - Per subtes: skor = jumlah benar / total * 100 (skala 0-100).
 *   - Per dimensi ABM: rata-rata skor subtes yang memetakan ke dimensi tsb.
 *   - Klasifikasi (Rendah/Sedang/Tinggi) memakai cut-off persentil pada
 *     populasi ASUMSI (mean=50, sd=20) sehingga:
 *         skor < 40        -> Rendah   (~< -0.5 SD)
 *         40 <= skor <= 70 -> Sedang
 *         skor > 70        -> Tinggi   (~> +1 SD)
 *   - Prediksi IQ dihitung dari rata-rata skor 7 dimensi:
 *         IQ ≈ 70 + 0.6 * total_skor   (dibatasi 50..150)
 *     Formula sederhana ini menghasilkan rata-rata ≈ 100 pada skor rata-rata
 *     50/100. Hanya untuk indikasi kasar.
 *
 * MINAT
 *   - Tahap 1 (Bidang Soal 1): 28 pasang. Skor per huruf = jumlah dipilih.
 *     3 huruf tertinggi = 3 bidang minat dominan.
 *   - Tahap 2 (Program X): per bidang dominan, 28 pasang -> skor per huruf,
 *     ambil 1 sub-bidang teratas sebagai PROGRAM KEAHLIAN paling cocok.
 *   - Skor 8 BIDANG dipetakan ke 18 area minat ABM via MINAT_ABM_MAP,
 *     kemudian:
 *         dasar:   3 area dengan skor tertinggi
 *         metodis: 1 area dengan skor tertinggi
 *         praktis: 1 area dengan skor tertinggi
 *     Cut-off Tinggi = >= 60% skor maksimum bidang dominan.
 */

function scoreBakat_(sesiId, sesi) {
  const jSheet = getSheet_(SHEETS.JAWABAN);
  const jawaban = sheetToObjects_(jSheet).filter(function(j) {
    return String(j.sesi_id) === String(sesiId);
  });

  // Total per subtes
  const totalsPerSubtes = {};
  BAKAT_SUBTES.forEach(function(s) { totalsPerSubtes[s.kode] = 0; });
  getBakatSoal_().forEach(function(s) {
    totalsPerSubtes[s.subtes] = (totalsPerSubtes[s.subtes] || 0) + 1;
  });

  // Hitung benar per subtes
  const benarPerSubtes = {};
  BAKAT_SUBTES.forEach(function(s) { benarPerSubtes[s.kode] = 0; });
  jawaban.forEach(function(j) {
    if (j.benar === 'YA') {
      benarPerSubtes[j.subtes] = (benarPerSubtes[j.subtes] || 0) + 1;
    }
  });

  // Skor 0-100 per subtes
  const skorSubtes = {};
  BAKAT_SUBTES.forEach(function(s) {
    const total = totalsPerSubtes[s.kode] || 1;
    const benar = benarPerSubtes[s.kode] || 0;
    skorSubtes[s.kode] = {
      kode: s.kode, nama: s.nama, dimensi: s.dimensi,
      benar: benar, total: total,
      skor_100: Math.round((benar / total) * 1000) / 10
    };
  });

  // Skor & klasifikasi per 7 dimensi ABM
  const dims = ['Spasial','Verbal','Penalaran','Klerikal','Mekanika','Kuantitatif','Bahasa'];
  const skorDimensi = {};
  dims.forEach(function(d) {
    const subs = BAKAT_SUBTES.filter(function(s) { return s.dimensi === d; });
    if (subs.length === 0) {
      skorDimensi[d] = { skor: 0, klasifikasi: 'Tidak diukur', subtes: [] };
      return;
    }
    let sum = 0;
    subs.forEach(function(s) { sum += skorSubtes[s.kode].skor_100; });
    const avg = sum / subs.length;
    skorDimensi[d] = {
      skor: Math.round(avg * 10) / 10,
      klasifikasi: classifyBakat_(avg),
      subtes: subs.map(function(s) { return s.kode; })
    };
  });

  // Mekanika tidak punya subtes langsung -> heuristik dari Spasial+Kuantitatif
  if (skorDimensi['Mekanika'].subtes.length === 0) {
    const mek = (skorDimensi['Spasial'].skor + skorDimensi['Kuantitatif'].skor) / 2;
    skorDimensi['Mekanika'] = {
      skor: Math.round(mek * 10) / 10,
      klasifikasi: classifyBakat_(mek),
      subtes: ['Spasial+Kuantitatif (proksi)']
    };
  }

  // IQ prediksi: rata-rata seluruh dimensi
  let totalAvg = 0;
  dims.forEach(function(d) { totalAvg += skorDimensi[d].skor; });
  totalAvg /= dims.length;
  let iq = Math.round(70 + 0.6 * totalAvg);
  iq = Math.max(50, Math.min(150, iq));

  // Mapping no_asli -> no_tampil untuk audit
  const mapping = JSON.parse(sesi.mapping_json);
  const audit = mapping.urutan.map(function(u) {
    const noAsli = parseInt(u.id_asli.replace(/^[A-Z]+/, ''), 10);
    return {
      no_asli: noAsli, no_tampil: u.no_tampil,
      id: u.id_asli, subtes: u.subtes
    };
  });

  return {
    skor: { subtes: skorSubtes, dimensi: skorDimensi },
    klasifikasi: skorDimensi,
    iq_prediksi: iq,
    rekomendasi: { kategori_iq: kategoriIQ_(iq) },
    audit_acak: audit,
    ringkasan: {
      iq_prediksi: iq,
      kategori_iq: kategoriIQ_(iq),
      bakat_tinggi: dims.filter(function(d) {
        return skorDimensi[d].klasifikasi === 'Tinggi';
      }),
      bakat_rendah: dims.filter(function(d) {
        return skorDimensi[d].klasifikasi === 'Rendah';
      })
    }
  };
}

function classifyBakat_(skor) {
  if (skor < 40) return 'Rendah';
  if (skor > 70) return 'Tinggi';
  return 'Sedang';
}

function kategoriIQ_(iq) {
  if (iq >= 130) return 'Sangat Superior';
  if (iq >= 120) return 'Superior';
  if (iq >= 110) return 'Di atas Rata-rata';
  if (iq >= 90)  return 'Rata-rata';
  if (iq >= 80)  return 'Di bawah Rata-rata';
  if (iq >= 70)  return 'Borderline';
  return 'Rendah';
}

function computeTop3Bidang_(sesiId) {
  const jSheet = getSheet_(SHEETS.JAWABAN);
  const jawaban = sheetToObjects_(jSheet).filter(function(j) {
    return String(j.sesi_id) === String(sesiId) && j.subtes === 'BIDANG_1';
  });
  const skor = {};
  MINAT_BIDANG.forEach(function(b) { skor[b.kode] = 0; });
  jawaban.forEach(function(j) {
    const lab = String(j.jawaban).toUpperCase();
    if (skor[lab] !== undefined) skor[lab]++;
  });
  return MINAT_BIDANG
    .map(function(b) { return { kode: b.kode, nama: b.nama, skor: skor[b.kode] || 0 }; })
    .sort(function(a, b) { return b.skor - a.skor; })
    .slice(0, 3);
}

function scoreMinat_(sesiId, sesi) {
  const jSheet = getSheet_(SHEETS.JAWABAN);
  const jawaban = sheetToObjects_(jSheet).filter(function(j) {
    return String(j.sesi_id) === String(sesiId);
  });

  // Skor Bidang 1
  const bidangSkor = {};
  MINAT_BIDANG.forEach(function(b) { bidangSkor[b.kode] = 0; });
  jawaban.filter(function(j) { return j.subtes === 'BIDANG_1'; })
    .forEach(function(j) {
      const lab = String(j.jawaban).toUpperCase();
      if (bidangSkor[lab] !== undefined) bidangSkor[lab]++;
    });

  const top3 = MINAT_BIDANG
    .map(function(b) {
      return { kode: b.kode, nama: b.nama, skor: bidangSkor[b.kode] || 0 };
    })
    .sort(function(a, b) { return b.skor - a.skor; })
    .slice(0, 3);

  // Skor program detail untuk tiap bidang top3
  const programHasil = top3.map(function(t) {
    const subSkor = {};
    Object.keys(MINAT_PROGRAM[t.kode].keahlian).forEach(function(k) {
      subSkor[k] = 0;
    });
    jawaban.filter(function(j) { return j.subtes === 'PROGRAM_' + t.kode; })
      .forEach(function(j) {
        const lab = String(j.jawaban).toUpperCase();
        if (subSkor[lab] !== undefined) subSkor[lab]++;
      });
    const sortedSub = MINAT_PROGRAM[t.kode].sub
      .map(function(s) { return { kode: s.kode, nama: s.nama, skor: subSkor[s.kode] || 0 }; })
      .sort(function(a, b) { return b.skor - a.skor; });
    return {
      bidang_kode: t.kode, bidang_nama: t.nama,
      skor_bidang: t.skor,
      sub_skor: sortedSub,
      pekerjaan_top: sortedSub[0],
      keahlian_rekomendasi: MINAT_PROGRAM[t.kode].keahlian[sortedSub[0].kode],
      semua_keahlian: MINAT_PROGRAM[t.kode].keahlian
    };
  });

  // Pemetaan ke 18 area minat ABM
  const abm = {};
  Object.keys(MINAT_ABM_MAP).forEach(function(b) {
    Object.keys(MINAT_ABM_MAP[b]).forEach(function(area) {
      const w = MINAT_ABM_MAP[b][area];
      abm[area] = (abm[area] || 0) + (bidangSkor[b] || 0) * w;
    });
  });
  // Pastikan semua 18 area ada di hasil
  ['dasar','metodis','praktis'].forEach(function(grp) {
    MINAT_ABM_AREAS[grp].forEach(function(a) {
      if (abm[a] === undefined) abm[a] = 0;
    });
  });

  // Klasifikasi tinggi/rendah per area (ambang = 50% skor maksimum di
  // grup tsb; minimal 1 untuk dianggap berarti)
  const klas = {};
  ['dasar','metodis','praktis'].forEach(function(grp) {
    const arr = MINAT_ABM_AREAS[grp].map(function(a) {
      return { area: a, skor: Math.round((abm[a] || 0) * 100) / 100 };
    });
    arr.sort(function(a, b) { return b.skor - a.skor; });
    const maxS = arr[0].skor || 1;
    klas[grp] = arr.map(function(x) {
      return {
        area: x.area, skor: x.skor,
        klasifikasi: x.skor >= 0.5 * maxS && x.skor > 0 ? 'Tinggi' : 'Rendah'
      };
    });
  });
  // Top3 dasar, top1 metodis, top1 praktis
  const ringkasanArea = {
    dasar:   klas.dasar.slice(0, 3),
    metodis: klas.metodis.slice(0, 1),
    praktis: klas.praktis.slice(0, 1)
  };

  const skor = {
    bidang: bidangSkor,
    abm_area: abm,
    program: programHasil
  };
  const klasifikasi = {
    top_3_bidang: top3,
    abm: klas,
    ringkasan_area: ringkasanArea
  };
  const rekomendasi = {
    program_keahlian: programHasil.map(function(p) {
      return {
        bidang: p.bidang_nama,
        rekomendasi_pekerjaan: p.pekerjaan_top.nama,
        rekomendasi_keahlian: p.keahlian_rekomendasi
      };
    })
  };

  return {
    skor: skor, klasifikasi: klasifikasi, rekomendasi: rekomendasi,
    iq_prediksi: '', // tidak dihitung untuk minat
    ringkasan: {
      top_3_bidang: top3,
      area_dasar: ringkasanArea.dasar,
      area_metodis: ringkasanArea.metodis,
      area_praktis: ringkasanArea.praktis,
      rekomendasi: rekomendasi.program_keahlian
    }
  };
}
