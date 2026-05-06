// =====================================================================
// Auth flows
// =====================================================================
// Admin: Supabase Auth (email + password)
// Siswa: token 8 char (validasi via RPC api_validate_token)

(function() {
  // ---- Admin ----
  async function adminLogin(email, password) {
    const sb = window.ABM.getClient();
    if (!sb) return { ok: false, error: 'Supabase belum dikonfigurasi.' };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  }

  async function adminSignUp(email, password, nama) {
    const sb = window.ABM.getClient();
    if (!sb) return { ok: false, error: 'Supabase belum dikonfigurasi.' };
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { nama: nama || '' } }
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  }

  async function adminLogout() {
    const sb = window.ABM.getClient();
    if (!sb) return { ok: true };
    await sb.auth.signOut();
    return { ok: true };
  }

  async function getCurrentUser() {
    const sb = window.ABM.getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data && data.user;
  }

  async function getAdminProfile() {
    const sb = window.ABM.getClient();
    if (!sb) return null;
    const u = await getCurrentUser();
    if (!u) return null;
    const { data } = await sb.from('admin_profile').select('*').eq('user_id', u.id).maybeSingle();
    return data ? Object.assign({}, data, { email: u.email }) : { user_id: u.id, email: u.email, nama: u.email };
  }

  // ---- Token siswa ----
  async function validateToken(token) {
    return window.ABM.rpc('api_validate_token', { p_token: token });
  }

  async function startSession(token) {
    const r = await window.ABM.rpc('api_start_session', { p_token: token });
    return r;
  }

  async function saveMapping(sesiId, mapping) {
    return window.ABM.rpc('api_save_mapping', { p_sesi_id: sesiId, p_mapping: mapping });
  }

  async function submitAnswer(sesiId, soalId, jawaban, noTampil, subtes, benar) {
    return window.ABM.rpc('api_submit_answer', {
      p_sesi_id: sesiId, p_soal_id: soalId, p_jawaban: String(jawaban),
      p_no_tampil: noTampil || null, p_subtes: subtes || null,
      p_benar: benar === null || benar === undefined ? null : !!benar
    });
  }

  async function finishBakat(sesiId, skor, klasifikasi, iq, rekomendasi) {
    return window.ABM.rpc('api_finish_bakat', {
      p_sesi_id: sesiId, p_skor: skor, p_klasifikasi: klasifikasi,
      p_iq_prediksi: iq, p_rekomendasi: rekomendasi
    });
  }

  async function finishMinat(sesiId, skor, klasifikasi, rekomendasi) {
    return window.ABM.rpc('api_finish_minat', {
      p_sesi_id: sesiId, p_skor: skor, p_klasifikasi: klasifikasi, p_rekomendasi: rekomendasi
    });
  }

  // ---- Token: admin operations ----
  async function adminCreateToken(payload) {
    const sb = window.ABM.getClient();
    if (!sb) return { ok: false, error: 'Supabase belum dikonfigurasi.' };
    const u = await getCurrentUser();
    if (!u) return { ok: false, error: 'Belum login admin.' };
    const jenis = (payload.jenis_tes || '').toLowerCase();
    if (['minat','bakat'].indexOf(jenis) < 0) return { ok: false, error: 'Jenis tes harus minat/bakat.' };
    if (!payload.siswa_nama) return { ok: false, error: 'Nama siswa wajib.' };

    const cfg = window.ABM_CONFIG;
    const expMin = cfg.TOKEN_EXP_MINUTES || 5;
    const now = new Date();
    const exp = new Date(now.getTime() + expMin * 60 * 1000);
    const token = window.ABM.generateTokenString();

    const { error } = await sb.from('tokens').insert({
      token, jenis_tes: jenis,
      siswa_nama: payload.siswa_nama,
      siswa_nis: payload.siswa_nis || '',
      siswa_kelas: payload.siswa_kelas || '',
      siswa_sekolah: payload.siswa_sekolah || '',
      admin_id: u.id, expires_at: exp.toISOString()
    });
    if (error) return { ok: false, error: error.message };
    await sb.from('audit_log').insert({
      actor: u.email, action: 'GENERATE_TOKEN',
      detail: 'token=' + token + ' jenis=' + jenis + ' siswa=' + payload.siswa_nama
    });
    return { ok: true, token, expires_at: exp.toISOString(), expires_in_seconds: expMin * 60 };
  }

  async function adminListTokens() {
    const sb = window.ABM.getClient();
    if (!sb) return { ok: false, error: 'Supabase belum dikonfigurasi.' };
    // auto-expire dulu
    await sb.rpc('api_expire_old_tokens');
    const { data, error } = await sb.from('tokens')
      .select('*').order('created_at', { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: data || [] };
  }

  async function adminCancelToken(token) {
    const sb = window.ABM.getClient();
    const u = await getCurrentUser();
    const { error } = await sb.from('tokens')
      .update({ status: 'DIBATALKAN' }).eq('token', token);
    if (error) return { ok: false, error: error.message };
    await sb.from('audit_log').insert({
      actor: u && u.email, action: 'CANCEL_TOKEN', detail: token
    });
    return { ok: true };
  }

  async function adminListHasil(filterJenis) {
    const sb = window.ABM.getClient();
    let q = sb.from('hasil')
      .select('*, siswa:siswa_id(nama, nis, kelas, sekolah)')
      .order('created_at', { ascending: false });
    if (filterJenis) q = q.eq('jenis_tes', filterJenis);
    const { data, error } = await q;
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: data || [] };
  }

  async function adminGetHasilDetail(hasilId) {
    const sb = window.ABM.getClient();
    const { data: h, error: e1 } = await sb.from('hasil').select('*').eq('id', hasilId).maybeSingle();
    if (e1 || !h) return { ok: false, error: e1 ? e1.message : 'Hasil tidak ditemukan.' };
    const { data: s } = await sb.from('siswa').select('*').eq('id', h.siswa_id).maybeSingle();
    const { data: ses } = await sb.from('sesi').select('*').eq('id', h.sesi_id).maybeSingle();
    return { ok: true, hasil: h, siswa: s || {}, sesi: ses || {} };
  }

  async function adminGetStats() {
    const sb = window.ABM.getClient();
    const [tk, hs, sw] = await Promise.all([
      sb.from('tokens').select('status'),
      sb.from('hasil').select('jenis_tes'),
      sb.from('siswa').select('id')
    ]);
    const tokens = (tk.data || []);
    const hasil = (hs.data || []);
    return {
      ok: true,
      total_token: tokens.length,
      token_aktif:    tokens.filter(t => t.status === 'AKTIF').length,
      token_terpakai: tokens.filter(t => t.status === 'TERPAKAI').length,
      token_expired:  tokens.filter(t => t.status === 'EXPIRED').length,
      total_siswa: (sw.data || []).length,
      total_hasil_bakat: hasil.filter(h => h.jenis_tes === 'bakat').length,
      total_hasil_minat: hasil.filter(h => h.jenis_tes === 'minat').length
    };
  }

  window.ABM = window.ABM || {};
  Object.assign(window.ABM, {
    adminLogin, adminSignUp, adminLogout, getCurrentUser, getAdminProfile,
    validateToken, startSession, saveMapping, submitAnswer, finishBakat, finishMinat,
    adminCreateToken, adminListTokens, adminCancelToken,
    adminListHasil, adminGetHasilDetail, adminGetStats
  });
})();
