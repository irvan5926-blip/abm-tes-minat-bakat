// =====================================================================
// App — main coordinator: state, event delegation, business logic
// =====================================================================

(function() {
  const A = window.ABM;
  const S = A.state;

  function init() {
    A.show('login');
    A.rerender();
    setupGlobalDelegation();
    autoRestoreSession();
  }

  // Restore admin session on page reload
  async function autoRestoreSession() {
    if (!A.isConfigured()) return;
    const u = await A.getCurrentUser();
    if (u) {
      // Auto-jump to admin if user already logged in
      // (kecuali kalau ada query param ?token siswa)
      const params = new URLSearchParams(window.location.search);
      if (!params.get('token')) {
        A.show('admin');
        S.adminTab = 'stats';
        A.rerender();
      }
    }
    // Auto-fill token from URL (siswa shortcut: index.html?token=ABCD2345)
    const params = new URLSearchParams(window.location.search);
    const tk = params.get('token');
    if (tk) {
      const inp = document.getElementById('i-token');
      if (inp) inp.value = tk.toUpperCase();
    }
  }

  // ---------- Global event delegation ----------
  function setupGlobalDelegation() {
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
  }

  async function onClick(e) {
    const t = e.target.closest('[data-act], [data-loginmode], [data-admintab], [data-pick]');
    if (!t) return;

    if (t.dataset.loginmode) {
      const mode = t.dataset.loginmode;
      document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.loginmode === mode));
      document.getElementById('login-siswa').style.display = mode === 'siswa' ? 'block' : 'none';
      document.getElementById('login-admin').style.display = mode === 'admin' ? 'block' : 'none';
      return;
    }
    if (t.dataset.admintab) {
      S.adminTab = t.dataset.admintab;
      A.rerender();
      return;
    }
    if (t.dataset.pick !== undefined) {
      // Minat: pasangan
      pickMinat(t.dataset.pick);
      return;
    }

    const act = t.dataset.act;
    if (!act) return;
    e.preventDefault();
    try { await actions[act](t, e); }
    catch (err) {
      console.error(err);
      A.toast('Error: ' + (err.message || err), 'error');
    }
  }

  function onChange(e) {
    if (e.target.matches('input[type="radio"][name="opsi"]')) {
      const T = S.test;
      if (!T) return;
      const s = T.soal[T.idx];
      T.answers[s.id] = e.target.value;
      pushAnswer(s, e.target.value);
      A.rerender();
    }
  }

  function onKeydown(e) {
    if (S.currentView !== 'test') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' && S.test.idx > 0) actions.prev();
    if (e.key === 'ArrowRight' && S.test.idx < S.test.soal.length - 1) actions.next();
  }

  function pickMinat(label) {
    const T = S.test;
    if (!T) return;
    const s = T.soal[T.idx];
    T.answers[s.id] = label;
    pushAnswer(s, label);
    A.rerender();
  }

  // ---------- Push answer to backend (async, non-blocking) ----------
  async function pushAnswer(s, jawaban) {
    const T = S.test;
    if (!T || !S.sesiId) return;
    let benar = null;
    let subtes = null;
    if (T.jenis === 'bakat') {
      const orig = A.BAKAT_SOAL.find(x => x.id === s.id);
      benar = orig && String(orig.kunci).toLowerCase() === String(jawaban).toLowerCase();
      subtes = s.subtes;
    } else {
      subtes = T.subtesTag || 'BIDANG_1';
    }
    const r = await A.submitAnswer(S.sesiId, s.id, String(jawaban), s.no_tampil, subtes, benar);
    if (!r.ok) console.warn('submit_answer failed', r.error);
  }

  // ---------- Actions ----------
  const actions = {
    goLogin() {
      // Reset state untuk siswa
      S.token = null; S.tokenStr = null; S.test = null; S.result = null; S.sesiId = null;
      A.show('login'); A.rerender();
    },
    goPanduan() { A.show('panduan'); A.rerender(); },
    adminGo() { S.adminTab = 'stats'; A.show('admin'); A.rerender(); },

    async siswaLogin() {
      const inp = document.getElementById('i-token');
      const tk = (inp.value || '').toUpperCase().trim();
      if (tk.length !== 8) {
        A.setMsg('login-siswa-msg', 'error', 'Token harus 8 karakter.');
        return;
      }
      A.setMsg('login-siswa-msg', 'info', '⏳ Validasi token...');
      const r = await A.validateToken(tk);
      if (!r.ok) {
        A.setMsg('login-siswa-msg', 'error', A.escapeHtml(r.error || 'Token tidak valid.'));
        return;
      }
      A.setMsg('login-siswa-msg', '', '');
      S.tokenStr = r.token;
      S.token = r;
      A.show('menu');
      A.rerender();
    },

    async adminLogin() {
      const email = document.getElementById('i-email').value.trim();
      const pwd = document.getElementById('i-password').value;
      if (!email || !pwd) { A.setMsg('login-admin-msg', 'error', 'Email & password wajib diisi.'); return; }
      A.setMsg('login-admin-msg', 'info', '⏳ Login...');
      const r = await A.adminLogin(email, pwd);
      if (!r.ok) { A.setMsg('login-admin-msg', 'error', A.escapeHtml(r.error)); return; }
      A.setMsg('login-admin-msg', '', '');
      A.toast('Berhasil login sebagai admin!', 'success');
      S.adminTab = 'stats';
      A.show('admin');
      A.rerender();
    },

    async adminLogout() {
      await A.adminLogout();
      A.toast('Logout berhasil.', 'success');
      actions.goLogin();
    },

    adminSignupShow() {
      const wrap = document.createElement('div');
      wrap.id = 'signup-wrap';
      wrap.innerHTML = A.renderSignupModal();
      document.body.appendChild(wrap);
    },
    signupCancel() {
      const w = document.getElementById('signup-wrap'); if (w) w.remove();
    },
    async signupSubmit() {
      const nama = document.getElementById('su-nama').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const pwd = document.getElementById('su-password').value;
      if (!email || pwd.length < 6) {
        A.setMsg('signup-msg', 'error', 'Email valid + password minimal 6 karakter wajib.');
        return;
      }
      A.setMsg('signup-msg', 'info', '⏳ Mendaftarkan...');
      const r = await A.adminSignUp(email, pwd, nama);
      if (!r.ok) { A.setMsg('signup-msg', 'error', A.escapeHtml(r.error)); return; }
      A.toast('Daftar berhasil! Cek email konfirmasi (bila diaktifkan), lalu login.', 'success', 5000);
      actions.signupCancel();
    },

    // ---- Mulai tes ----
    async startTes(t) {
      const jenis = t.dataset.jenis;
      A.toast('⏳ Memulai sesi tes...', 'info');
      const r = await A.startSession(S.tokenStr);
      if (!r.ok) { A.toast('Error: ' + r.error, 'error'); return; }
      S.sesiId = r.sesi_id;

      // Generate mapping client-side (deterministik) lalu simpan ke backend
      const seed = A.strSeed(r.sesi_id + ':' + S.tokenStr);
      let mapping;
      let soal;
      if (jenis === 'bakat') {
        mapping = buildBakatMapping(seed);
        soal = mappingToBakatSoal(mapping);
        S.test = {
          jenis: 'bakat',
          soal,
          idx: 0,
          answers: {},
          mapping,
          expires_at: r.expires_at || S.token.expires_at
        };
      } else {
        mapping = buildMinatBidang1Mapping(seed);
        soal = mappingToMinatBidang1Soal(mapping);
        S.test = {
          jenis: 'minat',
          subtesTag: 'BIDANG_1',
          tahapNama: 'Tahap 1: Bidang Minat',
          soal,
          idx: 0,
          answers: {},
          mapping: { tahap: 'BIDANG_1', urutan: mapping, programs: {}, top3: [], completed: [] },
          allAnswers: [], // accumulator semua jawaban (bidang_1 + program)
          expires_at: r.expires_at || S.token.expires_at
        };
      }
      // Save mapping ke server (untuk audit)
      await A.saveMapping(r.sesi_id, S.test.mapping);
      A.show('test');
      A.rerender();
    },

    prev() { S.test.idx = Math.max(0, S.test.idx - 1); A.rerender(); },
    next() { S.test.idx = Math.min(S.test.soal.length - 1, S.test.idx + 1); A.rerender(); },

    async finishTes() {
      const T = S.test;
      const unanswered = T.soal.filter(s => !T.answers[s.id]).length;
      if (unanswered > 0) {
        if (!confirm('Masih ada ' + unanswered + ' soal yang belum dijawab. Tetap selesai?')) return;
      }
      if (T.jenis === 'bakat') {
        await finishBakat();
      } else {
        await advanceMinat();
      }
    },

    async copyToken(t) {
      try { await navigator.clipboard.writeText(t.dataset.token); A.toast('Token disalin!', 'success'); }
      catch (e) { A.toast('Gagal menyalin: ' + e.message, 'error'); }
    },

    async cancelToken(t) {
      if (!confirm('Batalkan token ' + t.dataset.token + '?')) return;
      const r = await A.adminCancelToken(t.dataset.token);
      if (!r.ok) { A.toast(r.error, 'error'); return; }
      A.toast('Token dibatalkan.', 'success');
      A.renderAdminContent();
    },

    async buatToken() {
      const payload = {
        jenis_tes: document.getElementById('tk-jenis').value,
        siswa_nama: document.getElementById('tk-nama').value.trim(),
        siswa_nis: document.getElementById('tk-nis').value.trim(),
        siswa_kelas: document.getElementById('tk-kelas').value.trim(),
        siswa_sekolah: document.getElementById('tk-sekolah').value.trim()
      };
      A.setMsg('tk-msg', 'info', '⏳ Generate token...');
      const r = await A.adminCreateToken(payload);
      if (!r.ok) { A.setMsg('tk-msg', 'error', A.escapeHtml(r.error)); return; }
      A.setMsg('tk-msg', '', '');
      const url = window.location.origin + window.location.pathname + '?token=' + r.token;
      document.getElementById('tk-result').innerHTML = `
        <div class="token-box">
          <div class="muted">Token Berhasil Dibuat (berlaku 5 menit)</div>
          <div class="token-text">${r.token}</div>
          <button class="btn secondary" data-act="copyToken" data-token="${r.token}">📋 Salin Token</button>
          <button class="btn secondary" data-act="copyUrl" data-url="${A.escapeHtml(url)}">🔗 Salin URL Siswa</button>
        </div>
        <p class="muted text-center">URL siswa: <code>${A.escapeHtml(url)}</code></p>`;
      A.toast('Token dibuat: ' + r.token, 'success');
    },

    async copyUrl(t) {
      try { await navigator.clipboard.writeText(t.dataset.url); A.toast('URL disalin!', 'success'); }
      catch (e) { A.toast('Gagal menyalin: ' + e.message, 'error'); }
    },

    async downloadPdf(t) {
      const id = t.dataset.id;
      A.toast('⏳ Generate PDF...', 'info');
      const r = await A.adminGetHasilDetail(id);
      if (!r.ok) { A.toast(r.error, 'error'); return; }
      const mapping = r.sesi && r.sesi.mapping;
      A.downloadFromHasil(r.hasil, r.siswa, mapping);
      A.toast('PDF di-download!', 'success');
    }
  };

  // ---------- Mapping builders (client-side) ----------
  function buildBakatMapping(seed) {
    const SUB = A.BAKAT_SUBTES;
    const ALL = A.BAKAT_SOAL;
    const result = { jenis: 'bakat', subtes: {}, urutan: [] };
    let displayNo = 1;
    SUB.forEach(sub => {
      const ids = ALL.filter(x => x.subtes === sub.kode).map(x => x.id);
      const shuffled = A.seededShuffle(ids, seed + A.strSeed(sub.kode));
      result.subtes[sub.kode] = { kode: sub.kode, nama: sub.nama, dimensi: sub.dimensi, soal_ids: shuffled };
      shuffled.forEach(id => result.urutan.push({ no_tampil: displayNo++, id_asli: id, subtes: sub.kode }));
    });
    return result;
  }

  function mappingToBakatSoal(mapping) {
    const bank = Object.fromEntries(A.BAKAT_SOAL.map(s => [s.id, s]));
    return mapping.urutan.map(u => {
      const s = bank[u.id_asli];
      return {
        id: s.id, no_tampil: u.no_tampil,
        no_asli: parseInt(s.id.replace(/^[A-Z]+/, ''), 10),
        subtes: s.subtes, pertanyaan: s.pertanyaan, opsi: s.opsi
      };
    });
  }

  function buildMinatBidang1Mapping(seed) {
    const soal = A.getMinatBidang1Soal();
    const ids = soal.map(s => s.id);
    const shuffled = A.seededShuffle(ids, seed);
    return shuffled.map((id, i) => ({ no_tampil: i + 1, id_asli: id, subtes: 'BIDANG_1' }));
  }

  function mappingToMinatBidang1Soal(mapping) {
    const bank = Object.fromEntries(A.getMinatBidang1Soal().map(s => [s.id, s]));
    return mapping.map(u => {
      const s = bank[u.id_asli];
      return {
        id: s.id, no_tampil: u.no_tampil, no_asli: s.no_asli,
        kata_a: s.kata_a, label_a: s.label_a, kata_b: s.kata_b, label_b: s.label_b
      };
    });
  }

  function buildMinatProgramMapping(seed, progKode) {
    const soal = A.getMinatProgramSoal(progKode);
    const ids = soal.map(s => s.id);
    const shuffled = A.seededShuffle(ids, seed + A.strSeed('PROG_' + progKode));
    return shuffled.map((id, i) => ({ no_tampil: i + 1, id_asli: id, subtes: 'PROGRAM_' + progKode }));
  }

  function mappingToMinatProgramSoal(mapping, progKode) {
    const bank = Object.fromEntries(A.getMinatProgramSoal(progKode).map(s => [s.id, s]));
    return mapping.map(u => {
      const s = bank[u.id_asli];
      return {
        id: s.id, no_tampil: u.no_tampil, no_asli: s.no_asli,
        kata_a: s.kata_a, label_a: s.label_a, kata_b: s.kata_b, label_b: s.label_b
      };
    });
  }

  // ---------- Finishers ----------
  async function finishBakat() {
    const T = S.test;
    // Bangun jawaban list lengkap
    const jawabanList = [];
    T.soal.forEach(s => {
      const j = T.answers[s.id];
      if (!j) return;
      const orig = A.BAKAT_SOAL.find(x => x.id === s.id);
      const benar = orig && String(orig.kunci).toLowerCase() === String(j).toLowerCase();
      jawabanList.push({ soal_id: s.id, jawaban: j, benar, subtes: s.subtes });
    });
    const result = A.scoreBakat(jawabanList, T.mapping);
    const r = await A.finishBakat(S.sesiId, result.skor, result.klasifikasi, result.iq_prediksi, result.rekomendasi);
    if (!r.ok) { A.toast(r.error, 'error'); return; }
    A.fireConfetti();
    S.result = { jenis_tes: 'bakat', ringkasan: result.ringkasan, klasifikasi: result.klasifikasi, rekomendasi: result.rekomendasi };
    A.show('result'); A.rerender();
  }

  async function advanceMinat() {
    const T = S.test;
    // Simpan jawaban tahap saat ini ke allAnswers
    T.soal.forEach(s => {
      const j = T.answers[s.id];
      if (j) T.allAnswers.push({ soal_id: s.id, jawaban: j, subtes: T.subtesTag });
    });

    if (T.subtesTag === 'BIDANG_1') {
      // Hitung top 3 bidang dari jawaban yang ada
      const bidangSkor = {};
      A.MINAT_BIDANG.forEach(b => bidangSkor[b.kode] = 0);
      T.allAnswers.filter(j => j.subtes === 'BIDANG_1').forEach(j => {
        const lab = String(j.jawaban).toUpperCase();
        if (bidangSkor[lab] !== undefined) bidangSkor[lab]++;
      });
      const top3 = A.MINAT_BIDANG
        .map(b => ({ kode: b.kode, skor: bidangSkor[b.kode] || 0 }))
        .sort((a, b) => b.skor - a.skor).slice(0, 3);
      T.mapping.top3 = top3.map(t => t.kode);
      T.mapping.completed = [];
    } else if (T.subtesTag.startsWith('PROGRAM_')) {
      const done = T.subtesTag.replace('PROGRAM_', '');
      T.mapping.completed.push(done);
    }

    // Cari program berikutnya yang belum selesai
    const nextProg = (T.mapping.top3 || []).find(p => (T.mapping.completed || []).indexOf(p) < 0);
    if (!nextProg) {
      // Selesai semua tahap → skor & finish
      const r2 = A.scoreMinat(T.allAnswers);
      const r3 = await A.finishMinat(S.sesiId, r2.skor, r2.klasifikasi, r2.rekomendasi);
      if (!r3.ok) { A.toast(r3.error, 'error'); return; }
      A.fireConfetti();
      S.result = { jenis_tes: 'minat', ringkasan: r2.ringkasan, klasifikasi: r2.klasifikasi, rekomendasi: r2.rekomendasi };
      A.show('result'); A.rerender();
      return;
    }

    // Lanjut ke program berikutnya
    const seed = A.strSeed(S.sesiId + ':' + nextProg);
    const mapping = buildMinatProgramMapping(seed, nextProg);
    T.mapping.programs[nextProg] = mapping;
    T.mapping.urutan = mapping;
    T.subtesTag = 'PROGRAM_' + nextProg;
    T.tahapNama = 'Tahap 2: ' + (A.MINAT_PROGRAM[nextProg].nama || nextProg);
    T.soal = mappingToMinatProgramSoal(mapping, nextProg);
    T.idx = 0;
    T.answers = {};
    await A.saveMapping(S.sesiId, T.mapping);
    A.toast('Lanjut ke ' + T.tahapNama, 'info');
    A.rerender();
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', init);
})();
