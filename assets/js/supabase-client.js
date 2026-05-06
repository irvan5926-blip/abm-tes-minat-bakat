// =====================================================================
// Supabase client wrapper
// =====================================================================
// Memerlukan:
//   - assets/js/config.js (window.ABM_CONFIG)
//   - https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 (di index.html)
//
// Diakses lewat window.ABM.sb (singleton).

(function() {
  const cfg = window.ABM_CONFIG || {};
  const url = cfg.SUPABASE_URL;
  const key = cfg.SUPABASE_ANON_KEY;
  let client = null;

  function isConfigured() {
    return url && key &&
           !/YOUR-PROJECT/i.test(url) &&
           !/YOUR-ANON/i.test(key);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (typeof supabase === 'undefined') {
      console.error('Supabase client library belum ter-load.');
      return null;
    }
    client = supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    return client;
  }

  // Wrapper untuk panggil RPC dengan error handling konsisten
  async function rpc(fn, args) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'Supabase belum dikonfigurasi. Edit assets/js/config.js.' };
    const { data, error } = await sb.rpc(fn, args || {});
    if (error) {
      console.error('RPC ' + fn + ' error', error);
      return { ok: false, error: error.message || String(error) };
    }
    return data || { ok: true };
  }

  window.ABM = window.ABM || {};
  Object.assign(window.ABM, { getClient, rpc, isConfigured });
})();
