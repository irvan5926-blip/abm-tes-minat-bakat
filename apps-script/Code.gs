/**
 * Aplikasi Tes Minat dan Bakat (ABM) berbasis Google Apps Script.
 *
 * Entry point web app. Routing berdasarkan query param ?page=...
 *
 *   ?page=login   -> Halaman login admin / input token siswa (default)
 *   ?page=admin   -> Dashboard admin (perlu login admin)
 *   ?page=menu    -> Menu pilih Tes Minat / Tes Bakat (perlu token valid)
 *   ?page=test    -> Halaman pengerjaan tes (perlu sesi aktif)
 *   ?page=result  -> Halaman hasil ringkas siswa (tanpa download PDF)
 *   ?page=panduan -> Buku panduan penggunaan aplikasi
 */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'login';
  const allowed = {
    login:   'login',
    admin:   'admin',
    menu:    'menu',
    test:    'test',
    result:  'result',
    panduan: 'panduan'
  };
  const file = allowed[page] || 'login';

  const tpl = HtmlService.createTemplateFromFile(file);
  tpl.params = (e && e.parameter) || {};
  return tpl.evaluate()
    .setTitle('ABM - Tes Minat & Bakat')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk include partial HTML (CSS/JS) dari file lain.
 *   <?!= include('styles'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Versi aplikasi - ditampilkan di footer. */
function appVersion_() {
  return '1.0.0';
}
