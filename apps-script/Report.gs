/**
 * Report - generate laporan PDF profesional dari hasil tes.
 *
 * Hanya admin yang sudah login yang bisa men-download.
 * PDF disimpan di Google Drive dalam folder "ABM Reports", file ID
 * dicatat di sheet Hasil (kolom pdf_file_id) dan distream balik via
 * encoding base64 agar bisa di-download dari browser tanpa perlu izin
 * publik atas file Drive.
 */

const REPORT_FOLDER_NAME = 'ABM Reports';

function getReportFolder_() {
  const it = DriveApp.getFoldersByName(REPORT_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(REPORT_FOLDER_NAME);
}

/**
 * Hasilkan PDF (atau ambil cache) dan return base64 + nama file.
 *
 * @param {string} sessToken  Sesi admin yang valid.
 * @param {string} hasilId    ID hasil tes.
 */
function downloadReport(sessToken, hasilId) {
  const adm = requireAdmin_(sessToken);
  const hasilSheet = getSheet_(SHEETS.HASIL);
  const hRows = sheetToObjects_(hasilSheet);
  const hasil = hRows.find(function(r) { return r.hasil_id === hasilId; });
  if (!hasil) return { ok: false, msg: 'Hasil tidak ditemukan.' };

  // Selalu regenerate untuk konsistensi (cepat krn data kecil),
  // namun simpan ke Drive sebagai backup.
  const blob = generateReportBlob_(hasil);
  const folder = getReportFolder_();
  // Hapus file lama (kalau ada) dengan id yg tercatat
  if (hasil.pdf_file_id) {
    try { DriveApp.getFileById(hasil.pdf_file_id).setTrashed(true); }
    catch (e) {}
  }
  const file = folder.createFile(blob);
  file.setName(blob.getName());
  // Update sheet Hasil
  const idx = findRowIndex_(hasilSheet, 'hasil_id', hasilId);
  if (idx > 0) updateRow_(hasilSheet, idx, { pdf_file_id: file.getId() });
  audit_(adm.email, 'DOWNLOAD_REPORT', 'hasil=' + hasilId);

  return {
    ok: true,
    filename: blob.getName(),
    base64: Utilities.base64Encode(blob.getBytes()),
    mime: 'application/pdf'
  };
}

function generateReportBlob_(hasil) {
  const siswaSheet = getSheet_(SHEETS.SISWA);
  const siswa = sheetToObjects_(siswaSheet)
    .find(function(r) { return r.siswa_id === hasil.siswa_id; }) ||
    { nama: '-', nis: '-', kelas: '-', sekolah: '-' };

  const sesiSheet = getSheet_(SHEETS.SESI);
  const sesi = sheetToObjects_(sesiSheet)
    .find(function(r) { return r.sesi_id === hasil.sesi_id; });

  const skor = JSON.parse(hasil.skor_json || '{}');
  const klasifikasi = JSON.parse(hasil.klasifikasi_json || '{}');
  const rekomendasi = JSON.parse(hasil.rekomendasi_json || '{}');

  let mapping = {};
  try { mapping = JSON.parse(sesi ? sesi.mapping_json : '{}'); } catch (e) {}

  const html = (hasil.jenis_tes === 'bakat')
    ? renderBakatReportHtml_(siswa, hasil, skor, klasifikasi, mapping)
    : renderMinatReportHtml_(siswa, hasil, skor, klasifikasi, rekomendasi, mapping);

  const tmp = HtmlService.createHtmlOutput(html).getBlob().getAs('text/html');
  // Apps Script HtmlOutput.getBlob() menghasilkan HTML mentah; trick PDF:
  // gunakan UrlFetchApp ke Drive convert, atau pakai DocumentApp.
  // Cara paling reliable: buat blob HTML lalu DriveApp.createFile -> getAs PDF.
  const htmlBlob = Utilities.newBlob(html, 'text/html', 'report.html');
  const pdf = htmlBlob.getAs('application/pdf');
  const filename = 'ABM_' + hasil.jenis_tes + '_' +
    String(siswa.nama).replace(/[^a-zA-Z0-9]+/g, '_') + '_' +
    new Date(hasil.created_at).toISOString().substring(0, 10) + '.pdf';
  pdf.setName(filename);
  return pdf;
}

function htmlEscape_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function renderReportHead_(judul) {
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + htmlEscape_(judul) + '</title>' +
    '<style>' +
    '@page { size: A4; margin: 22mm 18mm; }' +
    'body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1B5E20; font-size: 11pt; }' +
    'h1 { color: #2E7D32; margin: 0 0 4mm; font-size: 22pt; }' +
    'h2 { color: #388E3C; border-bottom: 2px solid #C8E6C9; padding-bottom: 2mm; margin-top: 8mm; font-size: 14pt; }' +
    'h3 { color: #2E7D32; margin: 6mm 0 2mm; font-size: 12pt; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 10pt; }' +
    'th, td { border: 1px solid #A5D6A7; padding: 4px 6px; text-align: left; vertical-align: top; }' +
    'th { background: #C8E6C9; color: #1B5E20; }' +
    'tr.alt td { background: #F1F8E9; }' +
    '.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9pt; font-weight: bold; }' +
    '.bd-tinggi { background: #66BB6A; color: white; }' +
    '.bd-sedang { background: #C8E6C9; color: #1B5E20; }' +
    '.bd-rendah { background: #FFCDD2; color: #B71C1C; }' +
    '.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #66BB6A; padding-bottom: 4mm; }' +
    '.header .right { text-align: right; font-size: 9pt; color: #2E7D32; }' +
    '.muted { color: #4E5C50; font-size: 9pt; }' +
    '.note { background: #F1F8E9; border-left: 4px solid #66BB6A; padding: 3mm 4mm; margin: 4mm 0; font-size: 10pt; }' +
    '.iq-box { background: #C8E6C9; padding: 5mm; text-align: center; border-radius: 4mm; margin: 4mm 0; }' +
    '.iq-box .num { font-size: 36pt; font-weight: bold; color: #1B5E20; }' +
    '.iq-box .lab { font-size: 12pt; color: #2E7D32; }' +
    'footer { margin-top: 8mm; padding-top: 3mm; border-top: 1px solid #C8E6C9; font-size: 9pt; color: #4E5C50; text-align: center; }' +
    '</style></head><body>';
}

function renderHeader_(siswa, hasil) {
  return '<div class="header">' +
    '<div><h1>Laporan Asesmen Bakat & Minat</h1>' +
    '<div class="muted">Berdasarkan Panduan Pemaknaan ABM (Pusmendik 2024) ' +
    '&amp; Buku Panduan Bakat & Minat (Direktorat SMK 2016)</div></div>' +
    '<div class="right">' +
    '<div><b>ID Hasil:</b> ' + htmlEscape_(hasil.hasil_id) + '</div>' +
    '<div><b>Tanggal:</b> ' + Utilities.formatDate(new Date(hasil.created_at), 'Asia/Jakarta', 'd MMM yyyy HH:mm') + '</div>' +
    '</div></div>' +
    '<h2>Identitas Siswa</h2>' +
    '<table>' +
    '<tr><th style="width:25%">Nama</th><td>' + htmlEscape_(siswa.nama) + '</td></tr>' +
    '<tr class="alt"><th>NIS</th><td>' + htmlEscape_(siswa.nis) + '</td></tr>' +
    '<tr><th>Kelas</th><td>' + htmlEscape_(siswa.kelas) + '</td></tr>' +
    '<tr class="alt"><th>Sekolah</th><td>' + htmlEscape_(siswa.sekolah) + '</td></tr>' +
    '</table>';
}

function renderBakatReportHtml_(siswa, hasil, skor, klasifikasi, mapping) {
  const dims = Object.keys(klasifikasi || {});
  let dimRows = '';
  dims.forEach(function(d, i) {
    const k = klasifikasi[d];
    const cls = k.klasifikasi === 'Tinggi' ? 'bd-tinggi' :
                k.klasifikasi === 'Rendah' ? 'bd-rendah' : 'bd-sedang';
    dimRows += '<tr' + (i % 2 ? ' class="alt"' : '') + '>' +
      '<td>' + htmlEscape_(d) + '</td>' +
      '<td style="text-align:right">' + (k.skor || 0).toFixed(1) + '</td>' +
      '<td><span class="badge ' + cls + '">' + htmlEscape_(k.klasifikasi) + '</span></td>' +
      '<td class="muted">' + htmlEscape_((k.subtes || []).join(', ')) + '</td></tr>';
  });

  let subtesRows = '';
  if (skor && skor.subtes) {
    Object.keys(skor.subtes).forEach(function(k, i) {
      const s = skor.subtes[k];
      subtesRows += '<tr' + (i % 2 ? ' class="alt"' : '') + '>' +
        '<td>' + htmlEscape_(s.kode) + '</td>' +
        '<td>' + htmlEscape_(s.nama) + '</td>' +
        '<td>' + htmlEscape_(s.dimensi) + '</td>' +
        '<td style="text-align:right">' + s.benar + '/' + s.total + '</td>' +
        '<td style="text-align:right">' + s.skor_100.toFixed(1) + '</td></tr>';
    });
  }

  // Audit pengacakan: tabel "Soal No Asli -> Tampil Ke No"
  let mapRows = '';
  ((mapping && mapping.urutan) || []).forEach(function(u, i) {
    const sub = u.subtes || '';
    const noAsli = u.id_asli ? u.id_asli.replace(/^[A-Z]+/, '') : '?';
    if (i % 2 === 0) {
      mapRows += '<tr><td>' + sub + '</td><td>' + noAsli + ' (' + htmlEscape_(u.id_asli) + ')</td><td>' + u.no_tampil + '</td>';
    } else {
      mapRows += '<td>' + sub + '</td><td>' + noAsli + ' (' + htmlEscape_(u.id_asli) + ')</td><td>' + u.no_tampil + '</td></tr>';
    }
  });
  if ((((mapping && mapping.urutan) || []).length) % 2 === 1) {
    mapRows += '<td colspan="3"></td></tr>';
  }

  const ringkasanTinggi = dims.filter(function(d) {
    return klasifikasi[d].klasifikasi === 'Tinggi';
  });
  const ringkasanRendah = dims.filter(function(d) {
    return klasifikasi[d].klasifikasi === 'Rendah';
  });

  return renderReportHead_('Laporan Bakat - ' + siswa.nama) +
    renderHeader_(siswa, hasil) +
    '<h2>Hasil Prediksi IQ</h2>' +
    '<div class="iq-box">' +
    '<div class="num">' + htmlEscape_(hasil.iq_prediksi) + '</div>' +
    '<div class="lab">Kategori: ' + htmlEscape_(kategoriIQ_(hasil.iq_prediksi)) + '</div>' +
    '</div>' +
    '<div class="note"><b>Catatan:</b> Prediksi IQ ini bersifat <i>indikatif</i> ' +
    'dan dihitung dari rata-rata skor 7 dimensi bakat ABM. Nilai ini bukan ' +
    'pengganti tes IQ klinis (WAIS/WISC/CFIT). Hanya digunakan untuk membantu ' +
    'guru BK memberikan gambaran awal kemampuan kognitif siswa.</div>' +
    '<h2>Skor 7 Dimensi Bakat (ABM)</h2>' +
    '<table><thead><tr><th>Dimensi</th><th>Skor (0-100)</th><th>Klasifikasi</th><th>Subtes Pendukung</th></tr></thead>' +
    '<tbody>' + dimRows + '</tbody></table>' +
    '<h3>Bakat Dominan</h3><p>' + (ringkasanTinggi.length ?
      '<b>Tinggi:</b> ' + ringkasanTinggi.join(', ') : '-') + '</p>' +
    '<h3>Bakat yang Perlu Dikembangkan</h3><p>' + (ringkasanRendah.length ?
      '<b>Rendah:</b> ' + ringkasanRendah.join(', ') : '-') + '</p>' +
    '<h2>Skor Detail Per Subtes</h2>' +
    '<table><thead><tr><th>Kode</th><th>Subtes</th><th>Dimensi ABM</th><th>Benar/Total</th><th>Skor 0-100</th></tr></thead>' +
    '<tbody>' + subtesRows + '</tbody></table>' +
    '<h2>Audit Pengacakan Soal</h2>' +
    '<div class="muted">Tabel berikut menunjukkan pemetaan nomor soal asli (sesuai bank soal / Buku Panduan) ' +
    'ke nomor tampil yang dilihat siswa - misal soal asli no 5 dipindah ke nomor 18.</div>' +
    '<table><thead><tr>' +
    '<th>Subtes</th><th>No Asli</th><th>Tampil ke No</th>' +
    '<th>Subtes</th><th>No Asli</th><th>Tampil ke No</th>' +
    '</tr></thead><tbody>' + mapRows + '</tbody></table>' +
    renderFooter_();
}

function renderMinatReportHtml_(siswa, hasil, skor, klasifikasi, rekomendasi, mapping) {
  let bidangRows = '';
  (klasifikasi.top_3_bidang || []).forEach(function(b, i) {
    bidangRows += '<tr' + (i % 2 ? ' class="alt"' : '') + '>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><b>' + htmlEscape_(b.nama) + '</b> (' + b.kode + ')</td>' +
      '<td style="text-align:right">' + b.skor + '</td></tr>';
  });

  let progRows = '';
  ((skor && skor.program) || []).forEach(function(p, i) {
    progRows += '<tr' + (i % 2 ? ' class="alt"' : '') + '>' +
      '<td>' + htmlEscape_(p.bidang_nama) + '</td>' +
      '<td>' + htmlEscape_(p.pekerjaan_top.nama) + ' (skor ' + p.pekerjaan_top.skor + ')</td>' +
      '<td><b>' + htmlEscape_(p.keahlian_rekomendasi) + '</b></td></tr>';
  });

  const renderArea = function(arr) {
    return arr.map(function(x) {
      const cls = x.klasifikasi === 'Tinggi' ? 'bd-tinggi' : 'bd-rendah';
      return '<tr><td>' + htmlEscape_(x.area) + '</td>' +
        '<td style="text-align:right">' + x.skor + '</td>' +
        '<td><span class="badge ' + cls + '">' + x.klasifikasi + '</span></td></tr>';
    }).join('');
  };

  // Audit pengacakan tahap 1
  const urut1 = (mapping && mapping.urutan && mapping.tahap === undefined ?
    mapping.urutan : (mapping.urutan || [])).filter(function(u) {
      return u.subtes === 'BIDANG_1';
    });
  let mapRows = '';
  urut1.forEach(function(u, i) {
    const noAsli = u.id_asli ? u.id_asli.replace(/^B1-/, '') : '?';
    if (i % 2 === 0) {
      mapRows += '<tr><td>Bidang 1</td><td>' + noAsli + '</td><td>' + u.no_tampil + '</td>';
    } else {
      mapRows += '<td>Bidang 1</td><td>' + noAsli + '</td><td>' + u.no_tampil + '</td></tr>';
    }
  });
  if (urut1.length % 2 === 1) mapRows += '<td colspan="3"></td></tr>';

  return renderReportHead_('Laporan Minat - ' + siswa.nama) +
    renderHeader_(siswa, hasil) +
    '<h2>3 Bidang Minat Dominan</h2>' +
    '<table><thead><tr><th>Peringkat</th><th>Bidang</th><th>Skor (0-7)</th></tr></thead>' +
    '<tbody>' + bidangRows + '</tbody></table>' +
    '<h2>Rekomendasi Program Keahlian (SMK)</h2>' +
    '<table><thead><tr><th>Bidang</th><th>Pekerjaan Paling Diminati</th><th>Program Keahlian</th></tr></thead>' +
    '<tbody>' + progRows + '</tbody></table>' +
    '<h2>Pemetaan ke 18 Area Minat ABM (Tracey, 2002)</h2>' +
    '<h3>Minat Dasar (3 area teratas)</h3>' +
    '<table><thead><tr><th>Area</th><th>Skor</th><th>Klasifikasi</th></tr></thead><tbody>' +
    renderArea(klasifikasi.ringkasan_area.dasar) + '</tbody></table>' +
    '<h3>Minat Metodis (1 area teratas)</h3>' +
    '<table><thead><tr><th>Area</th><th>Skor</th><th>Klasifikasi</th></tr></thead><tbody>' +
    renderArea(klasifikasi.ringkasan_area.metodis) + '</tbody></table>' +
    '<h3>Minat Praktis (1 area teratas)</h3>' +
    '<table><thead><tr><th>Area</th><th>Skor</th><th>Klasifikasi</th></tr></thead><tbody>' +
    renderArea(klasifikasi.ringkasan_area.praktis) + '</tbody></table>' +
    '<div class="note"><b>Cara Membaca Hasil:</b> Skor minat <i>tidak</i> mengukur kemampuan, ' +
    'melainkan ketertarikan. Skor "Tinggi" pada suatu area berarti siswa cenderung menyukai ' +
    'aktivitas/pekerjaan di area tersebut. Untuk pengambilan keputusan karir, gabungkan ' +
    'dengan hasil tes Bakat dan diskusikan dengan guru BK.</div>' +
    '<h2>Audit Pengacakan Soal (Bidang 1)</h2>' +
    '<table><thead><tr>' +
    '<th>Tahap</th><th>No Asli</th><th>Tampil ke No</th>' +
    '<th>Tahap</th><th>No Asli</th><th>Tampil ke No</th>' +
    '</tr></thead><tbody>' + mapRows + '</tbody></table>' +
    renderFooter_();
}

function renderFooter_() {
  return '<footer>Laporan ini dihasilkan otomatis oleh aplikasi ABM Tes Minat & Bakat ' +
    '(versi ' + appVersion_() + '). Hanya admin yang dapat mengunduh laporan ini.<br>' +
    'Cetakan: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'd MMM yyyy HH:mm') + ' WIB</footer></body></html>';
}
