// =====================================================================
// PDF Report Generator (client-side, jsPDF + autoTable)
// =====================================================================
// Memerlukan:
//   - https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js
//   - https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.0/dist/jspdf.plugin.autotable.min.js

(function() {
  function _doc() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('jsPDF library belum ter-load.');
    return new jsPDF({ unit: 'mm', format: 'a4' });
  }
  const HIJAU = [102, 187, 106]; // #66BB6A
  const HIJAU_DARK = [27, 94, 32]; // #1B5E20
  const HIJAU_TERTIARY = [200, 230, 201]; // #C8E6C9
  const HIJAU_BG = [241, 248, 233]; // #F1F8E9

  function _header(doc, judul) {
    doc.setFillColor(HIJAU[0], HIJAU[1], HIJAU[2]);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.setTextColor(255, 255, 255);
    doc.text(judul, 14, 14);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Asesmen Bakat & Minat (ABM)', 14, 19);
  }

  function _footer(doc, hasilId) {
    const p = doc.getNumberOfPages();
    for (let i = 1; i <= p; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.setLineWidth(.2);
      doc.setDrawColor(HIJAU[0], HIJAU[1], HIJAU[2]);
      doc.line(14, 287, 196, 287);
      doc.text('Hasil ID: ' + hasilId, 14, 292);
      doc.text('Halaman ' + i + ' / ' + p, 196, 292, { align: 'right' });
      doc.text('Dicetak: ' + new Date().toLocaleString('id-ID'), 105, 292, { align: 'center' });
    }
  }

  function _identitas(doc, siswa, hasil, y0) {
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.setTextColor(HIJAU_DARK[0], HIJAU_DARK[1], HIJAU_DARK[2]);
    doc.text('Identitas Siswa', 14, y0);
    doc.autoTable({
      startY: y0 + 2, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, lineColor: [165, 214, 167] },
      columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold', fillColor: HIJAU_TERTIARY } },
      body: [
        ['Nama',     siswa.nama || '-'],
        ['NIS',      siswa.nis || '-'],
        ['Kelas',    siswa.kelas || '-'],
        ['Sekolah',  siswa.sekolah || '-'],
        ['Hasil ID', hasil.id || '-'],
        ['Tanggal',  new Date(hasil.created_at || Date.now()).toLocaleString('id-ID')]
      ]
    });
    return doc.lastAutoTable.finalY;
  }

  function _badgeColor(klas) {
    if (klas === 'Tinggi') return [102,187,106];
    if (klas === 'Rendah') return [255,205,210];
    return [200,230,201];
  }

  // ----- Bakat -----
  function generateBakatPDF(hasil, siswa, mapping) {
    const doc = _doc();
    _header(doc, 'Laporan Tes Bakat');
    let y = _identitas(doc, siswa, hasil, 28);

    // IQ box
    y += 5;
    doc.setFillColor(HIJAU_TERTIARY[0], HIJAU_TERTIARY[1], HIJAU_TERTIARY[2]);
    doc.roundedRect(14, y, 182, 22, 3, 3, 'F');
    doc.setFontSize(10); doc.setTextColor(HIJAU_DARK[0], HIJAU_DARK[1], HIJAU_DARK[2]);
    doc.setFont('helvetica','bold');
    doc.text('Prediksi IQ', 105, y + 6, { align: 'center' });
    doc.setFontSize(28);
    doc.text(String(hasil.iq_prediksi || '-'), 105, y + 16, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Kategori: ' + (window.ABM.kategoriIQ(hasil.iq_prediksi || 0)), 105, y + 21, { align: 'center' });
    y += 26;

    // Catatan
    doc.setFillColor(HIJAU_BG[0], HIJAU_BG[1], HIJAU_BG[2]);
    doc.rect(14, y, 182, 14, 'F');
    doc.setDrawColor(HIJAU[0], HIJAU[1], HIJAU[2]); doc.setLineWidth(.8);
    doc.line(14, y, 14, y + 14);
    doc.setFontSize(8); doc.setTextColor(50, 60, 50); doc.setFont('helvetica','italic');
    doc.text('Catatan: Prediksi IQ bersifat indikatif, dihitung dari rata-rata 7 dimensi bakat ABM. Bukan pengganti tes IQ klinis (WAIS/WISC/CFIT).',
      18, y + 5, { maxWidth: 174 });
    y += 18;

    // Skor 7 dimensi
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.setTextColor(HIJAU_DARK[0], HIJAU_DARK[1], HIJAU_DARK[2]);
    doc.text('Skor 7 Dimensi Bakat (ABM)', 14, y); y += 2;
    const klas = hasil.klasifikasi || {};
    const dimRows = Object.keys(klas).map(d => [d, (klas[d].skor || 0).toFixed(1), klas[d].klasifikasi, (klas[d].subtes || []).join(', ')]);
    doc.autoTable({
      startY: y + 2, theme: 'striped',
      headStyles: { fillColor: HIJAU, textColor: 255, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
      head: [['Dimensi', 'Skor', 'Klasifikasi', 'Subtes Pendukung']],
      body: dimRows,
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const c = _badgeColor(data.cell.raw);
          data.cell.styles.fillColor = c;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = data.cell.raw === 'Rendah' ? [183,28,28] : 255;
          if (data.cell.raw === 'Sedang') data.cell.styles.textColor = HIJAU_DARK;
        }
      }
    });
    y = doc.lastAutoTable.finalY + 4;

    // Skor detail subtes
    if (hasil.skor && hasil.skor.subtes) {
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text('Skor Detail Per Subtes', 14, y); y += 2;
      const rows = Object.keys(hasil.skor.subtes).map(k => {
        const s = hasil.skor.subtes[k];
        return [s.kode, s.nama, s.dimensi, s.benar + '/' + s.total, s.skor_100.toFixed(1)];
      });
      doc.autoTable({
        startY: y + 2, theme: 'striped',
        headStyles: { fillColor: HIJAU, textColor: 255, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2 },
        head: [['Kode', 'Subtes', 'Dimensi', 'Benar', 'Skor (0-100)']],
        body: rows
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    // Audit pengacakan soal
    if (mapping && mapping.urutan && mapping.urutan.length) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text('Audit Pengacakan Soal', 14, y); y += 2;
      doc.setFontSize(8); doc.setFont('helvetica','italic');
      doc.text('Mapping urutan soal ASLI (sesuai bank) -> urutan TAMPIL kepada siswa.', 14, y + 4);
      y += 6;
      const urutan = mapping.urutan;
      const half = Math.ceil(urutan.length / 2);
      const rows = [];
      for (let i = 0; i < half; i++) {
        const a = urutan[i] || {};
        const b = urutan[i + half] || {};
        const aId = a.id_asli || '';
        const aN = aId.replace(/^[A-Z]+/, '');
        const bId = b.id_asli || '';
        const bN = bId.replace(/^[A-Z]+/, '');
        rows.push([
          a.subtes || '', aN, '→ ' + (a.no_tampil || ''),
          b.subtes || '', bN, b.id_asli ? '→ ' + (b.no_tampil || '') : ''
        ]);
      }
      doc.autoTable({
        startY: y + 2, theme: 'grid',
        headStyles: { fillColor: HIJAU, textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        head: [['Subtes', 'Asli', 'Tampil', 'Subtes', 'Asli', 'Tampil']],
        body: rows
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    _footer(doc, hasil.id);
    return doc;
  }

  // ----- Minat -----
  function generateMinatPDF(hasil, siswa) {
    const doc = _doc();
    _header(doc, 'Laporan Tes Minat');
    let y = _identitas(doc, siswa, hasil, 28);

    const klas = hasil.klasifikasi || {};
    const top3 = klas.top_3_bidang || [];
    const ringkasan = klas.ringkasan_area || {};
    const skor = hasil.skor || {};
    const reko = hasil.rekomendasi || {};

    y += 5;
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.setTextColor(HIJAU_DARK[0], HIJAU_DARK[1], HIJAU_DARK[2]);
    doc.text('3 Bidang Minat Dominan', 14, y); y += 2;
    doc.autoTable({
      startY: y + 2, theme: 'striped',
      headStyles: { fillColor: HIJAU, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 2 },
      head: [['Peringkat', 'Bidang', 'Skor (dari 28)']],
      body: top3.map((t, i) => [String(i + 1), t.nama, String(t.skor || 0)])
    });
    y = doc.lastAutoTable.finalY + 4;

    // Rekomendasi pekerjaan & program keahlian
    if (reko.program_keahlian && reko.program_keahlian.length) {
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text('Rekomendasi Pekerjaan & Program Keahlian', 14, y); y += 2;
      doc.autoTable({
        startY: y + 2, theme: 'striped',
        headStyles: { fillColor: HIJAU, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
        head: [['Bidang', 'Pekerjaan Top', 'Program Keahlian']],
        body: reko.program_keahlian.map(p => [p.bidang, p.rekomendasi_pekerjaan, p.rekomendasi_keahlian])
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    // 18 area ABM (gabungkan 3 grup)
    if (klas.abm) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text('Klasifikasi 18 Area Minat ABM', 14, y); y += 2;
      const rows = [];
      ['dasar','metodis','praktis'].forEach(g => {
        (klas.abm[g] || []).forEach(x => {
          rows.push([g.toUpperCase(), x.area, x.skor.toFixed(2), x.klasifikasi]);
        });
      });
      doc.autoTable({
        startY: y + 2, theme: 'striped',
        headStyles: { fillColor: HIJAU, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
        head: [['Kelompok', 'Area', 'Skor', 'Klasifikasi']],
        body: rows,
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 3) {
            const c = _badgeColor(data.cell.raw);
            data.cell.styles.fillColor = c;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = data.cell.raw === 'Rendah' ? [183,28,28] : 255;
            if (data.cell.raw === 'Sedang') data.cell.styles.textColor = HIJAU_DARK;
          }
        }
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    _footer(doc, hasil.id);
    return doc;
  }

  function downloadFromHasil(hasil, siswa, mapping) {
    const doc = hasil.jenis_tes === 'bakat'
      ? generateBakatPDF(hasil, siswa, mapping)
      : generateMinatPDF(hasil, siswa);
    const fname = 'ABM_' + hasil.jenis_tes + '_' +
      String(siswa.nama || 'siswa').replace(/[^a-zA-Z0-9]+/g, '_') + '_' +
      new Date(hasil.created_at || Date.now()).toISOString().substring(0, 10) + '.pdf';
    doc.save(fname);
  }

  window.ABM = window.ABM || {};
  Object.assign(window.ABM, { generateBakatPDF, generateMinatPDF, downloadFromHasil });
})();
