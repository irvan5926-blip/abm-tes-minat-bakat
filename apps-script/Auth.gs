/**
 * Auth - login admin (username/password) dan token sekali pakai untuk siswa.
 *
 *   - Admin login menghasilkan session token (JWT-like) berlaku 4 jam,
 *     disimpan di CacheService + Properties + dikembalikan ke client.
 *   - Token siswa dibuat oleh admin, expired 5 menit setelah dibuat,
 *     hanya boleh dipakai sekali (status: AKTIF -> TERPAKAI / EXPIRED).
 */

const ADMIN_SESSION_HOURS = 4;
const TOKEN_EXP_MINUTES   = 5;

/** Hash password sederhana (SHA-256 + salt dari Script Properties). */
function hashPassword_(pw) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty('PW_SALT');
  if (!salt) {
    salt = Utilities.getUuid();
    props.setProperty('PW_SALT', salt);
  }
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + pw
  );
  return Utilities.base64Encode(raw);
}

/* ============================ ADMIN ============================ */

function adminLogin(email, password) {
  if (!email || !password) {
    return { ok: false, msg: 'Email dan password wajib diisi.' };
  }
  const sheet = getSheet_(SHEETS.ADMINS);
  const rows = sheetToObjects_(sheet);
  const hashed = hashPassword_(password);
  const admin = rows.find(function(r) {
    return String(r.email).toLowerCase() === String(email).toLowerCase()
        && String(r.password_hash) === hashed;
  });
  if (!admin) {
    audit_(email, 'LOGIN_FAIL', '');
    return { ok: false, msg: 'Email atau password salah.' };
  }
  // Generate session token
  const sessToken = Utilities.getUuid().replace(/-/g, '');
  const exp = new Date(Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000);
  const cache = CacheService.getScriptCache();
  cache.put('ADM_' + sessToken, JSON.stringify({
    email: admin.email, nama: admin.nama, exp: exp.getTime()
  }), ADMIN_SESSION_HOURS * 3600);
  // Update last_login
  const idx = findRowIndex_(sheet, 'email', admin.email);
  if (idx > 0) updateRow_(sheet, idx, { last_login: new Date() });
  audit_(admin.email, 'LOGIN_OK', '');
  return {
    ok: true,
    session: sessToken,
    nama: admin.nama,
    email: admin.email,
    expires_at: exp.toISOString()
  };
}

function adminLogout(sessToken) {
  if (sessToken) CacheService.getScriptCache().remove('ADM_' + sessToken);
  return { ok: true };
}

function requireAdmin_(sessToken) {
  if (!sessToken) throw new Error('Sesi admin tidak ditemukan. Silakan login ulang.');
  const cache = CacheService.getScriptCache();
  const data = cache.get('ADM_' + sessToken);
  if (!data) throw new Error('Sesi admin habis. Silakan login ulang.');
  return JSON.parse(data);
}

function adminChangePassword(sessToken, oldPw, newPw) {
  const adm = requireAdmin_(sessToken);
  if (!newPw || newPw.length < 6) {
    return { ok: false, msg: 'Password baru minimal 6 karakter.' };
  }
  const sheet = getSheet_(SHEETS.ADMINS);
  const rows = sheetToObjects_(sheet);
  const cur = rows.find(function(r) { return r.email === adm.email; });
  if (!cur || String(cur.password_hash) !== hashPassword_(oldPw)) {
    return { ok: false, msg: 'Password lama salah.' };
  }
  const idx = findRowIndex_(sheet, 'email', adm.email);
  updateRow_(sheet, idx, { password_hash: hashPassword_(newPw) });
  audit_(adm.email, 'CHANGE_PASSWORD', '');
  return { ok: true, msg: 'Password berhasil diubah.' };
}

function adminAddAdmin(sessToken, email, nama, password) {
  const adm = requireAdmin_(sessToken);
  if (!email || !password || password.length < 6) {
    return { ok: false, msg: 'Email & password (min 6 karakter) wajib diisi.' };
  }
  const sheet = getSheet_(SHEETS.ADMINS);
  if (findRowIndex_(sheet, 'email', email) > 0) {
    return { ok: false, msg: 'Admin dengan email tersebut sudah ada.' };
  }
  appendObject_(sheet, {
    email: email, nama: nama || email, password_hash: hashPassword_(password),
    created_at: new Date(), last_login: ''
  });
  audit_(adm.email, 'ADD_ADMIN', email);
  return { ok: true, msg: 'Admin baru ditambahkan.' };
}

/* ============================ TOKEN SISWA ============================ */

function generateToken(sessToken, payload) {
  const adm = requireAdmin_(sessToken);
  const jenis = (payload.jenis_tes || '').toLowerCase();
  if (['minat', 'bakat'].indexOf(jenis) < 0) {
    return { ok: false, msg: 'Jenis tes harus "minat" atau "bakat".' };
  }
  if (!payload.siswa_nama) {
    return { ok: false, msg: 'Nama siswa wajib diisi.' };
  }
  // Token 8 karakter: huruf besar + angka, mudah diketik
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  const now = new Date();
  const exp = new Date(now.getTime() + TOKEN_EXP_MINUTES * 60 * 1000);
  appendObject_(getSheet_(SHEETS.TOKENS), {
    token:         token,
    jenis_tes:     jenis,
    siswa_nama:    payload.siswa_nama,
    siswa_nis:     payload.siswa_nis || '',
    siswa_kelas:   payload.siswa_kelas || '',
    siswa_sekolah: payload.siswa_sekolah || '',
    admin_email:   adm.email,
    created_at:    now,
    expires_at:    exp,
    used_at:       '',
    status:        'AKTIF'
  });
  audit_(adm.email, 'GENERATE_TOKEN',
    'token=' + token + ' jenis=' + jenis + ' siswa=' + payload.siswa_nama);
  return {
    ok: true,
    token: token,
    expires_at: exp.toISOString(),
    expires_in_seconds: TOKEN_EXP_MINUTES * 60
  };
}

/**
 * Validasi token siswa. Tidak menandai TERPAKAI di sini - itu dilakukan
 * saat sesi tes benar-benar dimulai (startSession).
 */
function validateToken(token) {
  if (!token) return { ok: false, msg: 'Token kosong.' };
  token = String(token).toUpperCase().trim();
  const sheet = getSheet_(SHEETS.TOKENS);
  const rows = sheetToObjects_(sheet);
  const idx = rows.findIndex(function(r) { return String(r.token) === token; });
  if (idx < 0) return { ok: false, msg: 'Token tidak ditemukan.' };
  const t = rows[idx];
  if (t.status !== 'AKTIF') {
    return { ok: false, msg: 'Token sudah dipakai atau dibatalkan.' };
  }
  const exp = new Date(t.expires_at).getTime();
  if (Date.now() > exp) {
    // Auto-expire
    updateRow_(sheet, idx + 2, { status: 'EXPIRED' });
    return { ok: false, msg: 'Token sudah expired (lewat 5 menit).' };
  }
  return {
    ok: true,
    token: token,
    jenis_tes: t.jenis_tes,
    siswa_nama: t.siswa_nama,
    siswa_nis: t.siswa_nis,
    siswa_kelas: t.siswa_kelas,
    siswa_sekolah: t.siswa_sekolah,
    expires_at: new Date(t.expires_at).toISOString(),
    expires_in_seconds: Math.max(0, Math.round((exp - Date.now()) / 1000))
  };
}

/** Tandai token jadi TERPAKAI (dipanggil internal saat sesi mulai). */
function markTokenUsed_(token) {
  const sheet = getSheet_(SHEETS.TOKENS);
  const idx = findRowIndex_(sheet, 'token', token);
  if (idx > 0) {
    updateRow_(sheet, idx, { used_at: new Date(), status: 'TERPAKAI' });
  }
}

/** Trigger periodik untuk auto-expire token (disetup di Setup.gs). */
function expireOldTokens() {
  const sheet = getSheet_(SHEETS.TOKENS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  const headers = data[0];
  const expCol = headers.indexOf('expires_at');
  const stCol  = headers.indexOf('status');
  const now = Date.now();
  for (let i = 1; i < data.length; i++) {
    if (data[i][stCol] === 'AKTIF' &&
        new Date(data[i][expCol]).getTime() < now) {
      sheet.getRange(i + 1, stCol + 1).setValue('EXPIRED');
    }
  }
}
