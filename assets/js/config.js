// =====================================================================
// KONFIGURASI SUPABASE
// =====================================================================
//
// Cara setup:
//   1. Buka https://supabase.com -> login -> New Project.
//   2. Tunggu sampai project ready (~2 menit).
//   3. Settings -> API.
//   4. Copy "Project URL" -> tempel di SUPABASE_URL.
//   5. Copy "anon public" key -> tempel di SUPABASE_ANON_KEY.
//   6. Commit & push -> GitHub Pages otomatis redeploy.
//
// CATATAN: anon key AMAN dipublish (akses dikunci RLS + RPC).
// JANGAN PERNAH menempel service_role key di sini!
// =====================================================================

window.ABM_CONFIG = {
  SUPABASE_URL:      'https://ygmqhcepyhspjgtngvmq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbXFoY2VweWhzcGpndG5ndm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjA0OTQsImV4cCI6MjA5MzY5NjQ5NH0.7khErgAj_nDhVd2wgG288t0pc-c1LYUjyIh-ohYJTZw',

  TOKEN_EXP_MINUTES: 5,
  APP_VERSION:       '2.2.0-bank-soal'
};
