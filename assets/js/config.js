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
  SUPABASE_URL:      'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY-HERE',

  TOKEN_EXP_MINUTES: 5,
  APP_VERSION:       '2.0.0-supabase'
};
