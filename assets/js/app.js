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
      S.token = null; S.tokenStr = null; S.siswaInfo = null;
      S.test = null; S.result = null; S.sesiId = null;
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
      // Pre-fill siswaInfo dari token (kalau admin sempat isi data, biasanya kosong)
      S.siswaInfo = {
        nama: r.siswa_nama || '',
        nis: r.siswa_nis || '',
        kelas: r.siswa_kelas || '',
        sekolah: r.siswa_sekolah || ''
      };
      A.show('siswa-form');
      A.rerender();
    },

    siswaFormSubmit() {
      const nama = (document.getElementById('sf-nama').value || '').trim();
      if (!nama) {
        A.setMsg('sf-msg', 'error', 'Nama lengkap wajib diisi.');
        return;
      }
      S.siswaInfo = {
        nama,
        nis: (document.getElementById('sf-nis').value || '').trim(),
        kelas: (document.getElementById('sf-kelas').value || '').trim(),
        sekolah: (document.getElementById('sf-sekolah').value || '').trim(),
        tanggal_lahir: (document.getElementById('sf-tgl').value || '') || null,
        jenis_kelamin: (document.getElementById('sf-jk').value || '') || null
      };
      A.toast('Identitas tersimpan. Klik kartu untuk mulai tes.', 'success');
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
      if (!S.siswaInfo || !S.siswaInfo.nama) {
        A.toast('Silakan isi identitas terlebih dahulu.', 'error');
        A.show('siswa-form'); A.rerender();
        return;
      }
      A.toast('⏳ Memulai sesi tes...', 'info');
      const r = await A.startSession(S.tokenStr, S.siswaInfo);
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
      const jenis = document.getElementById('tk-jenis').value;
      const expMin = parseInt(document.getElementById('tk-exp').value, 10) || 5;
      A.setMsg('tk-msg', 'info', '⏳ Generate token...');
      const r = await A.adminCreateToken({ jenis_tes: jenis, exp_minutes: expMin });
      if (!r.ok) { A.setMsg('tk-msg', 'error', A.escapeHtml(r.error)); return; }
      A.setMsg('tk-msg', '', '');
      const url = window.location.origin + window.location.pathname + '?token=' + r.token;
      document.getElementById('tk-result').innerHTML = `
        <div class="token-box">
          <div class="muted">Token Berhasil Dibuat (berlaku ${expMin} menit) — ${A.escapeHtml(jenis.toUpperCase())}</div>
          <div class="token-text">${r.token}</div>
          <button class="btn secondary" data-act="copyToken" data-token="${r.token}">📋 Salin Token</button>
          <button class="btn secondary" data-act="copyUrl" data-url="${A.escapeHtml(url)}">🔗 Salin URL Siswa</button>
        </div>
        <p class="muted text-center">URL siswa: <code>${A.escapeHtml(url)}</code></p>
        <p class="muted text-center" style="font-size:12px;">Siswa akan diminta isi nama &amp; identitas saat login.</p>`;
      A.toast('Token dibuat: ' + r.token, 'success');
    },

    async copyUrl(t) {
      try { await navigator.clipboard.writeText(t.dataset.url); A.toast('URL disalin!', 'success'); }
      catch (e) { A.toast('Gagal menyalin: ' + e.message, 'error'); }
    },

    async bulkGenerate() {
      const jenis  = document.getElementById('bm-jenis').value;
      const jumlah = parseInt(document.getElementById('bm-jumlah').value, 10) || 0;
      const expMin = parseInt(document.getElementById('bm-exp').value, 10)    || 5;
      if (jumlah < 1 || jumlah > 500) {
        A.setMsg('bm-msg', 'error', 'Jumlah token harus 1-500.');
        return;
      }
      A.setMsg('bm-msg', 'info', `⏳ Generating ${jumlah} token...`);
      const r = await A.adminCreateTokensBulk(jenis, jumlah, expMin);
      if (!r.ok) {
        A.setMsg('bm-msg', 'error', A.escapeHtml(r.error || 'Gagal generate.'));
        return;
      }
      const tokens = r.tokens || [];
      const expIso = r.expires_at;
      const data = tokens.map(t => ({
        nama: '', nis: '', kelas: '', sekolah: '',
        token: t.token, expires_at: t.expires_at || expIso, jenis_tes: jenis
      }));
      A.setMsg('bm-msg', 'success', `<b>${data.length} token</b> berhasil dibuat. Berlaku sampai <b>${new Date(expIso).toLocaleString('id-ID')}</b>.`);
      renderBulkResult(data);
    },

    async copyBulkCsv() {
      const data = window.ABM._bulkResults || [];
      if (!data.length) return;
      const csv = bulkToCsv(data);
      try {
        await navigator.clipboard.writeText(csv);
        A.toast(`${data.length} baris CSV disalin!`, 'success');
      } catch (e) { A.toast('Gagal menyalin: ' + e.message, 'error'); }
    },

    async downloadBulkCsv() {
      const data = window.ABM._bulkResults || [];
      if (!data.length) return;
      const blob = new Blob([bulkToCsv(data)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'token-massal-' + Date.now() + '.csv';
      a.click();
      A.toast('CSV di-download!', 'success');
    },

    printBulkTokens() {
      const data = window.ABM._bulkResults || [];
      if (!data.length) return;
      const url = window.location.origin + window.location.pathname;
      const cards = data.map((d, i) => `
        <div class="card-token">
          <div class="head">KARTU TOKEN #${i + 1} · ${A.escapeHtml((d.jenis_tes || '').toUpperCase())}</div>
          <div class="nama-blank">Nama: <span class="line"></span></div>
          <div class="token">${A.escapeHtml(d.token)}</div>
          <div class="meta">Berlaku sampai: <b>${new Date(d.expires_at).toLocaleString('id-ID')}</b></div>
          <div class="meta">Buka: <b>${A.escapeHtml(url)}</b></div>
          <div class="meta" style="margin-top:6px;font-size:10px;color:#888;">
            Cara pakai: buka URL di atas → pilih tab Siswa → ketik token → isi nama &amp; identitas → mulai tes.
          </div>
        </div>`).join('');
      const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Kartu Token Siswa - ABM</title>
<style>
  body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 16px; background:#fff; margin:0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card-token { border: 2px dashed #66BB6A; border-radius: 12px; padding: 14px; page-break-inside: avoid; background: #F1F8E9; }
  .head { font-size: 11px; font-weight: 700; color: #4CAF50; letter-spacing: 1px; }
  .nama-blank { font-size: 13px; color: #555; margin: 8px 0; }
  .nama-blank .line { display: inline-block; border-bottom: 1px solid #888; width: 70%; height: 18px; vertical-align: middle; }
  .meta { font-size: 11px; color: #555; margin: 2px 0; }
  .token { font-family: 'Courier New', monospace; font-size: 30px; letter-spacing: 5px; font-weight: 800; color: #1B5E20; background: #fff; padding: 8px 12px; border-radius: 6px; margin: 8px 0; text-align: center; border: 2px solid #66BB6A; }
  @media print {
    body { padding: 8px; }
    .grid { gap: 8px; }
    .card-token { page-break-inside: avoid; }
    .no-print { display: none; }
  }
  button { background: #66BB6A; color: white; border: none; padding: 10px 20px; border-radius: 999px; cursor: pointer; font-weight: 600; margin-bottom: 14px; }
</style></head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Cetak Sekarang</button>
    <span style="font-size:12px;color:#666;">Total: ${data.length} kartu token. Potong per kotak, bagikan ke siswa.</span>
  </div>
  <div class="grid">${cards}</div>
  <script>setTimeout(() => window.print(), 400);</script>
</body></html>`;
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
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

  // ---------- Helpers (bulk export & render) ----------
  function bulkToCsv(data) {
    const lines = ['no,token,jenis_tes,expires_at'];
    data.forEach((d, i) => {
      lines.push([i + 1, d.token, d.jenis_tes,
        new Date(d.expires_at).toLocaleString('id-ID')
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    });
    return lines.join('\n');
  }

  function renderBulkResult(data) {
    window.ABM._bulkResults = data;
    const cont = document.getElementById('bm-result');
    if (!cont) return;
    if (!data.length) { cont.innerHTML = ''; return; }
    const rows = data.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><b style="font-family:monospace;font-size:15px;letter-spacing:2px;">${A.escapeHtml(d.token)}</b></td>
        <td><span class="badge ${d.jenis_tes === 'bakat' ? 'success' : 'info'}">${A.escapeHtml((d.jenis_tes || '').toUpperCase())}</span></td>
        <td>${A.fmtTime(d.expires_at)}</td>
        <td><button class="btn sm secondary" data-act="copyToken" data-token="${A.escapeHtml(d.token)}">📋 Salin</button></td>
      </tr>`).join('');
    cont.innerHTML = `
      <div class="alert success">
        <b>✅ ${data.length} token berhasil dibuat!</b> Pilih cara distribusi:
      </div>
      <div class="flex wrap" style="gap:8px; margin-bottom:12px;">
        <button class="btn" data-act="printBulkTokens">🖨️ Cetak Kartu Token (siap potong &amp; bagi)</button>
        <button class="btn secondary" data-act="downloadBulkCsv">⬇️ Download CSV</button>
        <button class="btn secondary" data-act="copyBulkCsv">📋 Salin CSV</button>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>No</th><th>Token</th><th>Jenis</th><th>Expired</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

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
