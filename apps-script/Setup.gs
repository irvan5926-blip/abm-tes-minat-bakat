/**
 * Setup awal & utilitas maintenance.
 *
 * Cara pakai (sekali saja, dari editor Apps Script):
 *   1) Jalankan setupSpreadsheet() -> membuat spreadsheet & seed admin.
 *   2) Jalankan installTriggers()  -> trigger auto-expire token tiap 1 menit.
 *   3) Deploy as Web App (Execute as: Me, Access: Anyone).
 *
 * Jika perlu reset admin password:
 *   resetAdminPassword('admin@email', 'passwordbaru');
 */

function installTriggers() {
  // Hapus trigger lama dengan handler yang sama
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'expireOldTokens') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('expireOldTokens').timeBased().everyMinutes(1).create();
  return 'Trigger expireOldTokens (setiap 1 menit) terpasang.';
}

function resetAdminPassword(email, password) {
  if (!email || !password) throw new Error('email & password wajib');
  const sheet = getSheet_(SHEETS.ADMINS);
  const idx = findRowIndex_(sheet, 'email', email);
  if (idx < 0) throw new Error('Admin tidak ditemukan: ' + email);
  updateRow_(sheet, idx, { password_hash: hashPassword_(password) });
  return 'Password untuk ' + email + ' berhasil direset.';
}

/**
 * Tampilkan info deployment & URL untuk dibagikan ke admin.
 * Jalankan dari editor Apps Script setelah deploy.
 */
function getDeploymentInfo() {
  const url = ScriptApp.getService().getUrl();
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ssUrl = ssId ? SpreadsheetApp.openById(ssId).getUrl() : '(belum di-setup)';
  const info = {
    web_app_url: url,
    spreadsheet_url: ssUrl,
    panduan: 'Login admin di: ' + url + '?page=login (klik "Login Admin")'
  };
  console.log(JSON.stringify(info, null, 2));
  return info;
}

/**
 * Health check sederhana - bisa dipanggil dari client untuk memastikan
 * backend reachable.
 */
function ping() {
  return {
    ok: true,
    version: appVersion_(),
    timezone: Session.getScriptTimeZone(),
    timestamp: new Date().toISOString()
  };
}
