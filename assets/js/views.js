// =====================================================================
// Views — render & event handler per halaman
// =====================================================================
//
// Pattern: tiap view mengexpose render(state) yang menulis HTML ke
// container view-nya. State global di window.ABM.state.
//
// Views:
//   #view-login    Login admin / input token siswa
//   #view-menu     Menu tes (siswa setelah validasi token)
//   #view-test     Halaman pengerjaan tes
//   #view-result   Halaman hasil ringkas siswa
//   #view-admin    Dashboard admin
//   #view-panduan  Buku panduan aplikasi

(function() {
  const A = window.ABM;
  const S = A.state = A.state || {};

  function show(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.add('active');
    S.currentView = name;
    // update nav
    updateHeader();
    window.scrollTo(0, 0);
  }

  async function updateHeader() {
    const navEl = document.getElementById('app-nav');
    if (!navEl) return;
    const u = await A.getCurrentUser();
    let html = '';
    if (S.currentView !== 'login') html += `<button data-act="goLogin">🏠 Beranda</button>`;
    if (u) {
      html += `<span class="muted" style="color:white;opacity:.85;font-size:12px;">${A.escapeHtml(u.email)}</span>`;
      html += `<button data-act="adminGo">📊 Admin</button>`;
      html += `<button data-act="adminLogout">⏻ Logout</button>`;
    }
    html += `<button data-act="goPanduan">📖 Panduan</button>`;
    navEl.innerHTML = html;
  }

  // ---------- LOGIN VIEW ----------
  function renderLogin() {
    const cfgWarn = !A.isConfigured() ? `
      <div class="banner-setup">
        <b>⚠️ Setup Belum Selesai</b><br>
        Aplikasi belum terhubung ke Supabase. Edit <code>assets/js/config.js</code>:
        <ol style="margin:6px 0 0 18px; font-size:13px;">
          <li>Daftar di <a href="https://supabase.com" target="_blank">supabase.com</a> → New Project</li>
          <li>Settings → API → copy <b>Project URL</b> + <b>anon public key</b></li>
          <li>Tempel ke <code>config.js</code> → push ke GitHub</li>
        </ol>
      </div>` : '';
    return `
      ${cfgWarn}
      <div class="login-wrap">
        <div class="card">
          <h2>🌱 ABM Tes Minat & Bakat</h2>
          <p class="muted text-center">Asesmen Bakat & Minat berbasis ABM (Pusmendik 2024)</p>

          <div class="login-tabs" style="margin-top:16px;">
            <button class="tab-btn active" data-loginmode="siswa">👨‍🎓 Siswa</button>
            <button class="tab-btn" data-loginmode="admin">🛡️ Admin</button>
          </div>

          <div id="login-siswa">
            <div id="login-siswa-msg"></div>
            <div class="form-group">
              <label>Token (8 karakter)</label>
              <input id="i-token" maxlength="8" placeholder="Mis. ABCD2345" style="text-transform:uppercase; font-family:monospace; letter-spacing:3px; font-size:18px; text-align:center;">
              <div class="muted" style="margin-top:6px;">Token diberikan admin, berlaku 5 menit, sekali pakai.</div>
            </div>
            <button class="btn full lg" data-act="siswaLogin">Mulai Tes →</button>
          </div>

          <div id="login-admin" style="display:none;">
            <div id="login-admin-msg"></div>
            <div class="form-group">
              <label>Email Admin</label>
              <input id="i-email" type="email" autocomplete="email" placeholder="admin@sekolah.sch.id">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input id="i-password" type="password" autocomplete="current-password" placeholder="Min. 6 karakter">
            </div>
            <button class="btn full lg" data-act="adminLogin">Login Admin →</button>
            <hr>
            <div class="text-center muted" style="font-size:12px;">
              Belum punya akun admin?
              <a href="#" data-act="adminSignupShow">Daftar di sini</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- ADMIN SIGNUP MODAL ----------
  function renderSignupModal() {
    return `
      <div class="modal-bg" id="modal-signup">
        <div class="modal">
          <h2>🛡️ Daftar Admin Baru</h2>
          <p class="muted">Buat akun admin pertama. Akan dikirim email konfirmasi (cek folder Spam).</p>
          <div id="signup-msg"></div>
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input id="su-nama" placeholder="Pak Muhammad Irvan">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input id="su-email" type="email" placeholder="admin@sekolah.sch.id">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input id="su-password" type="password" placeholder="Min. 6 karakter">
          </div>
          <div class="flex between">
            <button class="btn secondary" data-act="signupCancel">Batal</button>
            <button class="btn" data-act="signupSubmit">Daftar</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- SISWA-FORM VIEW (after token valid, before menu) ----------
  function renderSiswaForm() {
    const t = S.token || {};
    const i = S.siswaInfo || {};
    const jenisLabel = t.jenis_tes === 'bakat' ? '🧠 Tes Bakat' : t.jenis_tes === 'minat' ? '🎯 Tes Minat' : '-';
    return `
      <div class="card" style="max-width:640px;margin:0 auto;">
        <h2>📝 Isi Identitas Anda</h2>
        <p class="muted">Sebelum mengerjakan tes, mohon isi data diri di bawah. Data ini hanya untuk laporan & rekap admin.</p>
        <div class="alert success" style="margin-bottom:16px;">
          ✅ Token valid. Jenis tes: <b>${A.escapeHtml(jenisLabel)}</b>
        </div>
        <div id="sf-msg"></div>
        <div class="form-group">
          <label>Nama Lengkap <span style="color:var(--c-error)">*</span></label>
          <input id="sf-nama" placeholder="Nama lengkap sesuai KTP/Kartu Pelajar" value="${A.escapeHtml(i.nama || '')}">
        </div>
        <div class="form-row">
          <div class="form-group"><label>NIS / NISN</label>
            <input id="sf-nis" placeholder="Nomor induk siswa" value="${A.escapeHtml(i.nis || '')}">
          </div>
          <div class="form-group"><label>Kelas</label>
            <input id="sf-kelas" placeholder="mis. XII-IPA-1" value="${A.escapeHtml(i.kelas || '')}">
          </div>
        </div>
        <div class="form-group"><label>Sekolah</label>
          <input id="sf-sekolah" placeholder="Nama sekolah" value="${A.escapeHtml(i.sekolah || '')}">
        </div>
        <div class="form-row">
          <div class="form-group"><label>Tanggal Lahir</label>
            <input id="sf-tgl" type="date" value="${A.escapeHtml(i.tanggal_lahir || '')}">
          </div>
          <div class="form-group"><label>Jenis Kelamin</label>
            <select id="sf-jk">
              <option value="">-- Pilih --</option>
              <option value="L" ${i.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
              <option value="P" ${i.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan</option>
            </select>
          </div>
        </div>
        <button class="btn full lg" data-act="siswaFormSubmit">Lanjut ke Tes →</button>
      </div>`;
  }

  // ---------- MENU VIEW (siswa setelah identitas tersimpan) ----------
  function renderMenu() {
    const t = S.token || {};
    const i = S.siswaInfo || {};
    const nama = i.nama || t.siswa_nama || 'Siswa';
    return `
      <div class="card">
        <h2>👋 Selamat datang, ${A.escapeHtml(nama)}</h2>
        <p class="muted">Token: <b>${A.escapeHtml(S.tokenStr || '-')}</b> &middot; Jenis: <b>${A.escapeHtml((t.jenis_tes || '-').toUpperCase())}</b></p>
        <div class="alert info">
          <b>Info:</b> Jenis tes ditentukan oleh token. Klik kartu di bawah untuk mulai.
        </div>
        <div class="menu-grid">
          ${(t.jenis_tes === 'bakat') ? `
          <div class="menu-card" data-act="startTes" data-jenis="bakat">
            <div class="icon">🧠</div>
            <h3>Tes Bakat</h3>
            <p>Mengukur 7 dimensi kemampuan kognitif: Spasial, Verbal, Penalaran, Klerikal, Mekanika, Kuantitatif, Bahasa.</p>
            <button class="btn">Mulai →</button>
          </div>` : ''}
          ${(t.jenis_tes === 'minat') ? `
          <div class="menu-card" data-act="startTes" data-jenis="minat">
            <div class="icon">🎯</div>
            <h3>Tes Minat</h3>
            <p>Mengeksplorasi 8 bidang minat &amp; 18 area minat ABM. Hasilnya rekomendasi program keahlian.</p>
            <button class="btn">Mulai →</button>
          </div>` : ''}
        </div>
      </div>`;
  }

  // ---------- TEST VIEW ----------
  function renderTest() {
    const T = S.test;
    if (!T) return '<div class="card"><div class="alert error">Sesi tidak ditemukan.</div></div>';
    const total = T.soal.length;
    const cur = T.idx;
    const s = T.soal[cur];
    const pct = Math.round(((cur) / total) * 100);
    const subInfo = T.jenis === 'bakat' ?
      `<div class="info-item"><div class="lab">Subtes</div><div class="val">${A.escapeHtml(s.subtes || '-')}</div></div>` : '';
    const tahapInfo = T.jenis === 'minat' ?
      `<div class="info-item"><div class="lab">Tahap</div><div class="val">${A.escapeHtml(T.tahapNama || '-')}</div></div>` : '';

    let bodyHtml = '';
    if (T.jenis === 'bakat') {
      const opsi = s.opsi || {};
      const sel = T.answers[s.id] || '';
      bodyHtml = `
        <div class="soal-box">
          <div><span class="soal-no">${cur + 1}</span><b>Soal ${cur + 1} dari ${total}</b> <span class="badge muted">${A.escapeHtml(s.subtes)}</span></div>
          <div class="soal-text">${A.escapeHtml(s.pertanyaan)}</div>
          <div class="opsi-list">
            ${['a','b','c','d','e'].filter(k => opsi[k] !== undefined).map(k => `
              <label class="opsi ${sel === k ? 'selected' : ''}">
                <input type="radio" name="opsi" value="${k}" ${sel === k ? 'checked' : ''}>
                <span class="label">${k.toUpperCase()}.</span>
                <span class="text">${A.escapeHtml(opsi[k])}</span>
              </label>`).join('')}
          </div>
        </div>`;
    } else {
      // Minat: pasangan A vs B
      const sel = T.answers[s.id] || '';
      bodyHtml = `
        <div class="soal-box">
          <div><span class="soal-no">${cur + 1}</span><b>Soal ${cur + 1} dari ${total}</b></div>
          <p class="muted">Pilih kata/pekerjaan yang LEBIH menarik bagi Anda:</p>
          <div class="minat-pair">
            <div class="opt ${sel === s.label_a ? 'selected' : ''}" data-pick="${s.label_a}">${A.escapeHtml(s.kata_a)}</div>
            <div class="vs">VS</div>
            <div class="opt ${sel === s.label_b ? 'selected' : ''}" data-pick="${s.label_b}">${A.escapeHtml(s.kata_b)}</div>
          </div>
        </div>`;
    }

    return `
      <div class="test-header">
        <div class="info">
          <div class="info-item"><div class="lab">Jenis</div><div class="val">${A.escapeHtml(T.jenis.toUpperCase())}</div></div>
          <div class="info-item"><div class="lab">Soal</div><div class="val">${cur + 1} / ${total}</div></div>
          ${subInfo}${tahapInfo}
        </div>
        <div class="timer" id="t-timer">--:--</div>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
      ${bodyHtml}
      <div class="test-nav">
        <button class="btn secondary" data-act="prev" ${cur === 0 ? 'disabled' : ''}>← Sebelumnya</button>
        <div class="muted">Tip: gunakan tombol <span class="kbd">←</span> <span class="kbd">→</span> untuk navigasi</div>
        ${cur === total - 1
          ? `<button class="btn" data-act="finishTes">Selesai ✓</button>`
          : `<button class="btn" data-act="next">Selanjutnya →</button>`}
      </div>`;
  }

  // ---------- RESULT VIEW ----------
  function renderResult() {
    const R = S.result;
    if (!R) return '<div class="card"><div class="alert error">Hasil tidak tersedia.</div></div>';
    if (R.jenis_tes === 'bakat') {
      const ring = R.ringkasan || {};
      const dims = R.klasifikasi || {};
      return `
        <div class="card text-center">
          <h2 style="justify-content:center;border:none;">🎉 Tes Bakat Selesai!</h2>
          <div class="iq-box">
            <div class="lab">Prediksi IQ</div>
            <div class="num">${ring.iq_prediksi || '-'}</div>
            <div class="cat">${A.escapeHtml(ring.kategori_iq || '-')}</div>
          </div>
          <p class="muted">Catatan: prediksi IQ bersifat indikatif, bukan pengganti tes IQ klinis.</p>
        </div>
        <div class="card">
          <h2>Skor 7 Dimensi Bakat</h2>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>Dimensi</th><th>Skor (0-100)</th><th>Klasifikasi</th></tr></thead>
              <tbody>
                ${Object.keys(dims).map(d => {
                  const k = dims[d]; const klas = k.klasifikasi;
                  const cls = klas === 'Tinggi' ? 'success' : klas === 'Rendah' ? 'error' : 'muted';
                  return `<tr><td>${A.escapeHtml(d)}</td><td>${(k.skor || 0).toFixed(1)}</td><td><span class="badge ${cls}">${A.escapeHtml(klas)}</span></td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h3>Ringkasan</h3>
          <p><b>Bakat Dominan (Tinggi):</b> ${ring.bakat_tinggi && ring.bakat_tinggi.length ? ring.bakat_tinggi.join(', ') : '-'}</p>
          <p><b>Perlu Dikembangkan (Rendah):</b> ${ring.bakat_rendah && ring.bakat_rendah.length ? ring.bakat_rendah.join(', ') : '-'}</p>
          <div class="alert info">PDF lengkap dapat di-download oleh admin dari dashboard.</div>
          <div class="flex" style="margin-top:14px;">
            <button class="btn secondary" data-act="goLogin">Selesai</button>
          </div>
        </div>`;
    }
    // Minat
    const ring = R.ringkasan || {};
    return `
      <div class="card text-center">
        <h2 style="justify-content:center;border:none;">🎉 Tes Minat Selesai!</h2>
        <p class="muted">Berikut 3 bidang minat dominan Anda:</p>
        <div class="result-grid" style="grid-template-columns: repeat(3, 1fr); margin-top:16px;">
          ${(ring.top_3_bidang || []).map((t, i) => `
            <div class="iq-box" style="padding:18px;">
              <div class="lab">Peringkat ${i + 1}</div>
              <div style="font-size:22px;font-weight:700;margin-top:6px;">${A.escapeHtml(t.nama)}</div>
              <div style="font-size:13px;opacity:.85;">Skor: ${t.skor || 0}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h2>Rekomendasi Pekerjaan & Program Keahlian</h2>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Bidang</th><th>Pekerjaan Top</th><th>Program Keahlian</th></tr></thead>
            <tbody>
              ${(R.rekomendasi && R.rekomendasi.program_keahlian || []).map(p => `
                <tr><td>${A.escapeHtml(p.bidang)}</td><td>${A.escapeHtml(p.rekomendasi_pekerjaan)}</td><td>${A.escapeHtml(p.rekomendasi_keahlian)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="alert info" style="margin-top:14px;">PDF lengkap dapat di-download oleh admin dari dashboard.</div>
        <div class="flex" style="margin-top:14px;"><button class="btn secondary" data-act="goLogin">Selesai</button></div>
      </div>`;
  }

  // ---------- ADMIN VIEW ----------
  function renderAdmin() {
    const tab = S.adminTab || 'stats';
    return `
      <div class="card">
        <h2>📊 Dashboard Admin</h2>
        <div class="tabs">
          <button class="tab ${tab === 'stats' ? 'active' : ''}" data-admintab="stats">📈 Statistik</button>
          <button class="tab ${tab === 'token-buat' ? 'active' : ''}" data-admintab="token-buat">➕ Buat Token</button>
          <button class="tab ${tab === 'massal' ? 'active' : ''}" data-admintab="massal">📦 Tambah Massal</button>
          <button class="tab ${tab === 'token-list' ? 'active' : ''}" data-admintab="token-list">🎫 Daftar Token</button>
          <button class="tab ${tab === 'hasil' ? 'active' : ''}" data-admintab="hasil">📋 Hasil & Laporan</button>
          <button class="tab ${tab === 'bank' ? 'active' : ''}" data-admintab="bank">📚 Bank Soal</button>
        </div>
        <div id="admin-content"><div class="center-spinner"><div class="spinner lg"></div></div></div>
      </div>`;
  }

  async function renderAdminContent() {
    const cont = document.getElementById('admin-content');
    if (!cont) return;
    const tab = S.adminTab || 'stats';
    cont.innerHTML = '<div class="center-spinner"><div class="spinner lg"></div></div>';

    if (tab === 'stats') {
      const r = await A.adminGetStats();
      if (!r.ok) { cont.innerHTML = `<div class="alert error">${A.escapeHtml(r.error || 'Gagal')}</div>`; return; }
      cont.innerHTML = `
        <div class="stat-grid">
          <div class="stat"><div class="num">${r.total_token}</div><div class="lab">Total Token</div></div>
          <div class="stat"><div class="num">${r.token_aktif}</div><div class="lab">Token Aktif</div></div>
          <div class="stat"><div class="num">${r.token_terpakai}</div><div class="lab">Token Terpakai</div></div>
          <div class="stat"><div class="num">${r.token_expired}</div><div class="lab">Token Expired</div></div>
          <div class="stat"><div class="num">${r.total_siswa}</div><div class="lab">Total Siswa</div></div>
          <div class="stat"><div class="num">${r.total_hasil_bakat}</div><div class="lab">Hasil Bakat</div></div>
          <div class="stat"><div class="num">${r.total_hasil_minat}</div><div class="lab">Hasil Minat</div></div>
        </div>`;
    }
    else if (tab === 'token-buat') {
      cont.innerHTML = `
        <div class="alert info">
          <b>Generate 1 token kosong.</b> Siswa akan input identitas (nama, NIS, kelas, sekolah) sendiri saat login.
        </div>
        <div id="tk-msg"></div>
        <div class="form-row">
          <div class="form-group"><label>Jenis Tes</label>
            <select id="tk-jenis"><option value="bakat">Tes Bakat</option><option value="minat">Tes Minat</option></select>
          </div>
          <div class="form-group"><label>Berlaku (menit)</label>
            <input type="number" id="tk-exp" value="5" min="1" max="480">
          </div>
        </div>
        <button class="btn lg" data-act="buatToken">⚡ Generate Token</button>
        <div id="tk-result" style="margin-top:14px;"></div>`;
    }
    else if (tab === 'massal') {
      cont.innerHTML = `
        <div class="alert info">
          <b>Generate banyak token kosong sekaligus</b> — siswa akan input identitas saat login. Cocok untuk testing 1 kelas / 1 angkatan sekaligus.
        </div>
        <div id="bm-msg"></div>
        <div class="form-row">
          <div class="form-group">
            <label>Jenis Tes</label>
            <select id="bm-jenis">
              <option value="bakat">Tes Bakat</option>
              <option value="minat">Tes Minat</option>
            </select>
          </div>
          <div class="form-group">
            <label>Jumlah Token</label>
            <input type="number" id="bm-jumlah" value="30" min="1" max="500">
          </div>
          <div class="form-group">
            <label>Berlaku (menit)</label>
            <input type="number" id="bm-exp" value="60" min="1" max="480">
          </div>
        </div>
        <button class="btn lg" data-act="bulkGenerate">⚡ Generate Token Massal</button>
        <div id="bm-result" style="margin-top:18px;"></div>`;
    }
    else if (tab === 'token-list') {
      const r = await A.adminListTokens();
      if (!r.ok) { cont.innerHTML = `<div class="alert error">${A.escapeHtml(r.error)}</div>`; return; }
      const rows = r.rows.map(t => {
        const stCls = { AKTIF: 'success', TERPAKAI: 'info', EXPIRED: 'muted', DIBATALKAN: 'error' }[t.status] || 'muted';
        return `<tr>
          <td><b style="font-family:monospace;">${A.escapeHtml(t.token)}</b>
            <button class="btn sm secondary" data-act="copyToken" data-token="${A.escapeHtml(t.token)}">📋</button>
          </td>
          <td>${A.escapeHtml((t.jenis_tes || '').toUpperCase())}</td>
          <td>${A.escapeHtml(t.siswa_nama || '-')}</td>
          <td>${A.escapeHtml(t.siswa_kelas || '-')}</td>
          <td>${A.fmtTime(t.created_at)}</td>
          <td>${A.fmtTime(t.expires_at)}</td>
          <td><span class="badge ${stCls}">${t.status}</span></td>
          <td>${t.status === 'AKTIF' ? `<button class="btn sm danger" data-act="cancelToken" data-token="${A.escapeHtml(t.token)}">Batalkan</button>` : ''}</td>
        </tr>`;
      }).join('');
      cont.innerHTML = `<div class="table-wrap"><table class="data">
        <thead><tr><th>Token</th><th>Jenis</th><th>Nama</th><th>Kelas</th><th>Dibuat</th><th>Expired</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8" class="text-center muted">Belum ada token.</td></tr>'}</tbody>
      </table></div>`;
    }
    else if (tab === 'hasil') {
      const r = await A.adminListHasil();
      if (!r.ok) { cont.innerHTML = `<div class="alert error">${A.escapeHtml(r.error)}</div>`; return; }
      const rows = r.rows.map(h => {
        const sw = h.siswa || {};
        return `<tr>
          <td>${A.escapeHtml(sw.nama || '-')}</td>
          <td>${A.escapeHtml(sw.nis || '-')}</td>
          <td>${A.escapeHtml(sw.kelas || '-')}</td>
          <td><span class="badge ${h.jenis_tes === 'bakat' ? 'success' : 'info'}">${A.escapeHtml((h.jenis_tes || '').toUpperCase())}</span></td>
          <td>${h.iq_prediksi || '-'}</td>
          <td>${A.fmtDateTime(h.created_at)}</td>
          <td><button class="btn sm" data-act="downloadPdf" data-id="${A.escapeHtml(h.id)}">⬇ PDF</button></td>
        </tr>`;
      }).join('');
      cont.innerHTML = `<div class="table-wrap"><table class="data">
        <thead><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Jenis</th><th>IQ</th><th>Tanggal</th><th>Laporan</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" class="text-center muted">Belum ada hasil.</td></tr>'}</tbody>
      </table></div>`;
    }
    else if (tab === 'bank') {
      const totBakat = A.BAKAT_SOAL.length;
      const subRows = A.BAKAT_SUBTES.map(s => {
        const c = A.BAKAT_SOAL.filter(q => q.subtes === s.kode).length;
        return `<tr><td>${s.kode}</td><td>${A.escapeHtml(s.nama)}</td><td>${A.escapeHtml(s.dimensi)}</td><td>${c}</td></tr>`;
      }).join('');
      cont.innerHTML = `
        <div class="alert info">
          Bank soal di-bundle di file <code>assets/js/soal-bakat.js</code> dan <code>assets/js/soal-minat.js</code>.
          Untuk menambah/mengganti soal: edit file tersebut → commit ke GitHub → halaman ini auto re-deploy.
        </div>
        <h3>Soal Bakat</h3>
        <p>Total: <b>${totBakat}</b> soal aktif.</p>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Kode</th><th>Subtes</th><th>Dimensi</th><th>Jumlah</th></tr></thead>
          <tbody>${subRows}</tbody>
        </table></div>
        <h3 style="margin-top:18px;">Soal Minat</h3>
        <p>Tahap 1 (Bidang): <b>28</b> pasangan dari 8 bidang.<br>
        Tahap 2 (Program): per bidang dominan, <b>28</b> pasangan dari 8 sub-bidang.<br>
        Total per siswa: ~28 + 3×28 = 112 pasangan.</p>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Kode</th><th>Bidang</th></tr></thead>
          <tbody>${A.MINAT_BIDANG.map(b => `<tr><td>${b.kode}</td><td>${A.escapeHtml(b.nama)}</td></tr>`).join('')}</tbody>
        </table></div>`;
    }
  }

  // ---------- PANDUAN VIEW ----------
  function renderPanduan() {
    return `
      <div class="card">
        <h2>📖 Panduan Penggunaan</h2>
        <h3>Untuk Admin</h3>
        <ol>
          <li><b>Login</b> di halaman utama → tab Admin → masukkan email &amp; password.</li>
          <li>Buka tab <b>➕ Buat Token</b> → pilih jenis tes &amp; durasi → klik Generate. (Tidak perlu isi nama siswa — siswa isi sendiri saat login.)</li>
          <li>Untuk banyak siswa: tab <b>📦 Tambah Massal</b> → tentukan jumlah token → cetak kartu / download CSV.</li>
          <li>Token <b>sekali pakai</b> dengan masa berlaku sesuai pilihan. Salin &amp; bagikan ke siswa.</li>
          <li>Setelah siswa selesai, lihat <b>📑 Hasil &amp; Laporan</b> untuk download PDF.</li>
        </ol>
        <h3>Untuk Siswa</h3>
        <ol>
          <li>Buka URL aplikasi → tab Siswa → masukkan token 8 karakter → klik <b>Mulai Tes</b>.</li>
          <li><b>Isi identitas</b> Anda (nama wajib; NIS/kelas/sekolah/tanggal lahir/jenis kelamin opsional) → klik <b>Lanjut ke Tes</b>.</li>
          <li>Klik kartu menu tes → kerjakan soal urut. Jawaban tersimpan otomatis.</li>
          <li>Setelah selesai, hasil ringkas akan tampil. PDF lengkap diunduh oleh admin.</li>
        </ol>
        <h3>Tentang ABM</h3>
        <p>Asesmen Bakat &amp; Minat (ABM) mengukur 7 dimensi bakat (Spasial, Verbal, Penalaran, Klerikal, Mekanika, Kuantitatif, Bahasa) dan 18 area minat (Tracey 2002) yang dipetakan dari 8 bidang minat.</p>
        <h3>Pengacakan Soal</h3>
        <p>Setiap siswa mendapat urutan soal acak yang berbeda (dengan seed deterministik berbasis sesi+token). Mapping <i>no_asli → no_tampil</i> direkam untuk audit dan dicetak di laporan PDF admin.</p>
        <h3>Skoring Bakat</h3>
        <ul>
          <li>Tiap soal benar = 1 poin. Skor subtes = (benar / total) × 100.</li>
          <li>Skor dimensi = rata-rata skor subtes pendukung.</li>
          <li>Klasifikasi: <span class="badge error">Rendah</span> (&lt;40) · <span class="badge muted">Sedang</span> (40-70) · <span class="badge success">Tinggi</span> (&gt;70)</li>
          <li>Prediksi IQ ≈ 70 + 0.6 × rata-rata 7 dimensi (capped 50–150). Indikatif saja.</li>
        </ul>
        <h3>Skoring Minat</h3>
        <ul>
          <li>Tahap 1: 28 pasang bidang (round-robin 8 bidang). Skor per bidang = jumlah dipilih.</li>
          <li>Tahap 2: 28 pasang per bidang dominan (3 bidang teratas). Hasilnya = pekerjaan top + program keahlian.</li>
          <li>8 bidang dipetakan ke 18 area ABM (dasar/metodis/praktis) via tabel bobot.</li>
        </ul>
      </div>`;
  }

  // ---------- View dispatcher ----------
  function rerender() {
    const map = {
      login:        renderLogin(),
      'siswa-form': renderSiswaForm(),
      menu:         renderMenu(),
      test:         renderTest(),
      result:       renderResult(),
      admin:        renderAdmin(),
      panduan:      renderPanduan()
    };
    const html = map[S.currentView] || renderLogin();
    document.getElementById('view-' + S.currentView).innerHTML = html;
    if (S.currentView === 'admin') renderAdminContent();
    if (S.currentView === 'test') startCountdown();
  }

  // ---------- Countdown for test (token expiry) ----------
  let _ctTimer = null;
  function startCountdown() {
    if (_ctTimer) clearInterval(_ctTimer);
    const T = S.test;
    if (!T || !T.expires_at) return;
    const tEl = document.getElementById('t-timer');
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(T.expires_at).getTime() - Date.now()) / 1000));
      const m = String(Math.floor(left / 60)).padStart(2, '0');
      const s = String(left % 60).padStart(2, '0');
      if (tEl) {
        tEl.textContent = m + ':' + s;
        tEl.classList.toggle('warn', left <= 60);
      }
      // Token expiry doesn't terminate test, but display the remaining time
      // for the test session. We treat it as informational.
    };
    tick();
    _ctTimer = setInterval(tick, 1000);
  }

  window.ABM = window.ABM || {};
  Object.assign(window.ABM, { show, rerender, renderSignupModal, renderAdminContent });
})();
