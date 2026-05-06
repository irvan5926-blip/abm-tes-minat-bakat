// =====================================================================
// Skoring tes Bakat & Minat
// =====================================================================

function classifyBakat(skor) {
  if (skor < 40) return 'Rendah';
  if (skor > 70) return 'Tinggi';
  return 'Sedang';
}

function kategoriIQ(iq) {
  if (iq >= 130) return 'Sangat Superior';
  if (iq >= 120) return 'Superior';
  if (iq >= 110) return 'Di atas Rata-rata';
  if (iq >= 90)  return 'Rata-rata';
  if (iq >= 80)  return 'Di bawah Rata-rata';
  if (iq >= 70)  return 'Borderline';
  return 'Rendah';
}

// Hitung skoring bakat dari jawaban yang sudah dilengkapi.
// jawabanList: [{ soal_id, jawaban, benar }]
// mapping: { urutan: [{ no_tampil, id_asli, subtes }] }
function scoreBakat(jawabanList, mapping) {
  const SUB = window.ABM.BAKAT_SUBTES;
  const SOAL = window.ABM.BAKAT_SOAL;

  const totalsPerSubtes = {};
  SUB.forEach(s => totalsPerSubtes[s.kode] = 0);
  SOAL.forEach(s => { totalsPerSubtes[s.subtes] = (totalsPerSubtes[s.subtes] || 0) + 1; });

  const benarPerSubtes = {};
  SUB.forEach(s => benarPerSubtes[s.kode] = 0);
  jawabanList.forEach(j => {
    if (j.benar) benarPerSubtes[j.subtes] = (benarPerSubtes[j.subtes] || 0) + 1;
  });

  const skorSubtes = {};
  SUB.forEach(s => {
    const total = totalsPerSubtes[s.kode] || 1;
    const benar = benarPerSubtes[s.kode] || 0;
    skorSubtes[s.kode] = {
      kode: s.kode, nama: s.nama, dimensi: s.dimensi,
      benar, total,
      skor_100: Math.round((benar / total) * 1000) / 10
    };
  });

  const dims = ['Spasial','Verbal','Penalaran','Klerikal','Mekanika','Kuantitatif','Bahasa'];
  const skorDimensi = {};
  dims.forEach(d => {
    const subs = SUB.filter(s => s.dimensi === d);
    if (!subs.length) {
      skorDimensi[d] = { skor: 0, klasifikasi: 'Tidak diukur', subtes: [] };
      return;
    }
    let sum = 0;
    subs.forEach(s => { sum += skorSubtes[s.kode].skor_100; });
    const avg = sum / subs.length;
    skorDimensi[d] = {
      skor: Math.round(avg * 10) / 10,
      klasifikasi: classifyBakat(avg),
      subtes: subs.map(s => s.kode)
    };
  });

  // Mekanika: kalau tidak ada subtes langsung, gunakan rata Spasial+Kuantitatif
  if (!skorDimensi['Mekanika'].subtes.length) {
    const mek = (skorDimensi['Spasial'].skor + skorDimensi['Kuantitatif'].skor) / 2;
    skorDimensi['Mekanika'] = {
      skor: Math.round(mek * 10) / 10,
      klasifikasi: classifyBakat(mek),
      subtes: ['Spasial+Kuantitatif (proksi)']
    };
  }

  let totalAvg = 0;
  dims.forEach(d => totalAvg += skorDimensi[d].skor);
  totalAvg /= dims.length;
  let iq = Math.round(70 + 0.6 * totalAvg);
  iq = Math.max(50, Math.min(150, iq));

  const audit = (mapping && mapping.urutan ? mapping.urutan : []).map(u => ({
    no_asli: parseInt(String(u.id_asli || '').replace(/^[A-Z]+/, ''), 10) || 0,
    no_tampil: u.no_tampil, id: u.id_asli, subtes: u.subtes
  }));

  return {
    skor: { subtes: skorSubtes, dimensi: skorDimensi },
    klasifikasi: skorDimensi,
    iq_prediksi: iq,
    rekomendasi: {
      kategori_iq: kategoriIQ(iq),
      bakat_tinggi: dims.filter(d => skorDimensi[d].klasifikasi === 'Tinggi'),
      bakat_rendah: dims.filter(d => skorDimensi[d].klasifikasi === 'Rendah')
    },
    audit_acak: audit,
    ringkasan: {
      iq_prediksi: iq,
      kategori_iq: kategoriIQ(iq),
      bakat_tinggi: dims.filter(d => skorDimensi[d].klasifikasi === 'Tinggi'),
      bakat_rendah: dims.filter(d => skorDimensi[d].klasifikasi === 'Rendah')
    }
  };
}

function scoreMinat(jawabanList) {
  const BIDANG = window.ABM.MINAT_BIDANG;
  const PROG = window.ABM.MINAT_PROGRAM;
  const MAP = window.ABM.MINAT_ABM_MAP;
  const AREAS = window.ABM.MINAT_ABM_AREAS;

  // Skor per bidang (Tahap 1)
  const bidangSkor = {};
  BIDANG.forEach(b => bidangSkor[b.kode] = 0);
  jawabanList.filter(j => j.subtes === 'BIDANG_1').forEach(j => {
    const lab = String(j.jawaban).toUpperCase();
    if (bidangSkor[lab] !== undefined) bidangSkor[lab]++;
  });

  const top3 = BIDANG
    .map(b => ({ kode: b.kode, nama: b.nama, skor: bidangSkor[b.kode] || 0 }))
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 3);

  // Skor program detail per bidang top3
  const programHasil = top3.map(t => {
    const subSkor = {};
    PROG[t.kode].sub.forEach(s => subSkor[s.kode] = 0);
    jawabanList.filter(j => j.subtes === 'PROGRAM_' + t.kode).forEach(j => {
      const lab = String(j.jawaban).toUpperCase();
      if (subSkor[lab] !== undefined) subSkor[lab]++;
    });
    const sortedSub = PROG[t.kode].sub
      .map(s => ({ kode: s.kode, nama: s.nama, skor: subSkor[s.kode] || 0 }))
      .sort((a, b) => b.skor - a.skor);
    return {
      bidang_kode: t.kode, bidang_nama: t.nama, skor_bidang: t.skor,
      sub_skor: sortedSub,
      pekerjaan_top: sortedSub[0],
      keahlian_rekomendasi: PROG[t.kode].keahlian[sortedSub[0].kode],
      semua_keahlian: PROG[t.kode].keahlian
    };
  });

  // Pemetaan ke 18 area ABM
  const abm = {};
  Object.keys(MAP).forEach(b => {
    Object.keys(MAP[b]).forEach(area => {
      const w = MAP[b][area];
      abm[area] = (abm[area] || 0) + (bidangSkor[b] || 0) * w;
    });
  });
  ['dasar','metodis','praktis'].forEach(g => AREAS[g].forEach(a => { if (abm[a] === undefined) abm[a] = 0; }));

  const klas = {};
  ['dasar','metodis','praktis'].forEach(grp => {
    const arr = AREAS[grp].map(a => ({ area: a, skor: Math.round((abm[a] || 0) * 100) / 100 }));
    arr.sort((a, b) => b.skor - a.skor);
    const maxS = arr[0].skor || 1;
    klas[grp] = arr.map(x => ({
      area: x.area, skor: x.skor,
      klasifikasi: x.skor >= 0.5 * maxS && x.skor > 0 ? 'Tinggi' : 'Rendah'
    }));
  });
  const ringkasanArea = {
    dasar:   klas.dasar.slice(0, 3),
    metodis: klas.metodis.slice(0, 1),
    praktis: klas.praktis.slice(0, 1)
  };

  return {
    skor: { bidang: bidangSkor, abm_area: abm, program: programHasil },
    klasifikasi: { top_3_bidang: top3, abm: klas, ringkasan_area: ringkasanArea },
    rekomendasi: {
      program_keahlian: programHasil.map(p => ({
        bidang: p.bidang_nama,
        rekomendasi_pekerjaan: p.pekerjaan_top ? p.pekerjaan_top.nama : '-',
        rekomendasi_keahlian: p.keahlian_rekomendasi || '-'
      }))
    },
    ringkasan: {
      top_3_bidang: top3,
      area_dasar: ringkasanArea.dasar,
      area_metodis: ringkasanArea.metodis,
      area_praktis: ringkasanArea.praktis
    }
  };
}

window.ABM = window.ABM || {};
Object.assign(window.ABM, { scoreBakat, scoreMinat, classifyBakat, kategoriIQ });
