/**
 * Storage layer - wrapper di atas Google Spreadsheet sebagai database.
 *
 * Spreadsheet ID disimpan di Script Properties dengan key SPREADSHEET_ID.
 * Saat pertama kali dijalankan, fungsi setupSpreadsheet() akan membuat
 * spreadsheet baru beserta semua sheet yang dibutuhkan.
 */

const SHEETS = {
  ADMINS:   'Admins',
  TOKENS:   'Tokens',
  SISWA:    'Siswa',
  SESI:     'Sesi',
  JAWABAN:  'Jawaban',
  HASIL:    'Hasil',
  AUDIT:    'AuditLog'
};

const SHEET_HEADERS = {
  [SHEETS.ADMINS]:  ['email', 'password_hash', 'nama', 'created_at', 'last_login'],
  [SHEETS.TOKENS]:  ['token', 'jenis_tes', 'siswa_nama', 'siswa_nis', 'siswa_kelas',
                     'siswa_sekolah', 'admin_email', 'created_at', 'expires_at',
                     'used_at', 'status'],
  [SHEETS.SISWA]:   ['siswa_id', 'nama', 'nis', 'kelas', 'sekolah', 'tanggal_lahir',
                     'jenis_kelamin', 'created_at'],
  [SHEETS.SESI]:    ['sesi_id', 'token', 'siswa_id', 'jenis_tes', 'mapping_json',
                     'started_at', 'finished_at'],
  [SHEETS.JAWABAN]: ['sesi_id', 'no_asli', 'no_tampil', 'jawaban', 'benar', 'subtes',
                     'created_at'],
  [SHEETS.HASIL]:   ['hasil_id', 'sesi_id', 'siswa_id', 'jenis_tes', 'skor_json',
                     'klasifikasi_json', 'iq_prediksi', 'rekomendasi_json',
                     'pdf_file_id', 'created_at'],
  [SHEETS.AUDIT]:   ['timestamp', 'actor', 'action', 'detail']
};

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error(
      'Spreadsheet belum di-setup. Jalankan menu "Setup Awal" dari ' +
      'editor Apps Script (fungsi setupSpreadsheet) terlebih dahulu.'
    );
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + name +
                    '. Jalankan setupSpreadsheet() ulang.');
  }
  return sheet;
}

/**
 * Membuat / inisialisasi spreadsheet beserta semua sheet & header.
 * Dipanggil sekali dari editor Apps Script untuk setup awal.
 *
 * @return {string} URL spreadsheet yang dibuat / sudah ada.
 */
function setupSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  let ss;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (err) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('ABM - Database Tes Minat & Bakat');
    props.setProperty('SPREADSHEET_ID', ss.getId());
    // Buang sheet default
    const defaultSheet = ss.getSheets()[0];
    defaultSheet.setName('_README');
    defaultSheet.getRange('A1').setValue(
      'Spreadsheet ini adalah database aplikasi ABM Tes Minat & Bakat. ' +
      'Jangan diedit manual.'
    );
  }

  Object.keys(SHEET_HEADERS).forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    const range = sheet.getRange(1, 1, 1, headers.length);
    if (sheet.getLastRow() === 0) {
      range.setValues([headers]);
      range.setFontWeight('bold').setBackground('#C8E6C9');
      sheet.setFrozenRows(1);
    }
  });

  // Seed admin default jika belum ada admin sama sekali
  const adminSheet = getSheet_(SHEETS.ADMINS);
  if (adminSheet.getLastRow() < 2) {
    const defaultEmail = Session.getEffectiveUser().getEmail() || 'admin@example.com';
    const defaultPass = 'admin123';
    const hash = hashPassword_(defaultPass);
    adminSheet.appendRow([
      defaultEmail, hash, 'Admin Utama', new Date(), ''
    ]);
    audit_('SYSTEM', 'CREATE_DEFAULT_ADMIN',
      'email=' + defaultEmail + ' password=' + defaultPass +
      ' (SEGERA UBAH PASSWORD DARI MENU ADMIN)');
  }

  return ss.getUrl();
}

/** Tambahkan satu baris log audit. */
function audit_(actor, action, detail) {
  try {
    const sheet = getSheet_(SHEETS.AUDIT);
    sheet.appendRow([new Date(), actor, action, detail || '']);
  } catch (err) {
    console.error('audit log failed', err);
  }
}

/** Konversi sheet jadi array of object (row[0] = header). */
function sheetToObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/** Cari index baris (1-based, termasuk header) yang kolom keynya == val. */
function findRowIndex_(sheet, keyCol, val) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  const headers = data[0];
  const idx = headers.indexOf(keyCol);
  if (idx < 0) return -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx]) === String(val)) return i + 1; // 1-based
  }
  return -1;
}

/** Update beberapa kolom di baris tertentu. */
function updateRow_(sheet, rowIndex, updates) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function(key) {
    const c = headers.indexOf(key);
    if (c >= 0) sheet.getRange(rowIndex, c + 1).setValue(updates[key]);
  });
}

/** Append object sebagai row mengikuti urutan header sheet. */
function appendObject_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}
