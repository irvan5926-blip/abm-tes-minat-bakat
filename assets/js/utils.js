// =====================================================================
// Utility helpers (PRNG, hashing, formatting, dll)
// =====================================================================

// PRNG Mulberry32 - deterministik dengan seed 32-bit
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rng = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Hash string -> 32-bit int (FNV-1a) untuk seed
function strSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// HTML escape
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Format tanggal Indonesia
function fmtDateTime(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch (e) { return String(d); }
}
function fmtTime(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch (e) { return String(d); }
}

// Generate token 8-char alphanumeric (huruf besar tanpa I/O ambigu)
function generateTokenString() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let t = '';
  for (let i = 0; i < 8; i++) t += charset.charAt(Math.floor(Math.random() * charset.length));
  return t;
}

// Toast
function toast(text, type = 'info', ms = 3000) {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = text;
  let cont = document.getElementById('toast-container');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toast-container';
    document.body.appendChild(cont);
  }
  cont.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = '.25s';
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// Confetti (untuk perayaan saat selesai tes)
function fireConfetti() {
  const colors = ['#66BB6A','#A5D6A7','#FFD54F','#FF8A65','#64B5F6','#BA68C8'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = (Math.random() * .5) + 's';
    c.style.animationDuration = (1.5 + Math.random()) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

// Inline alert (digabung dengan view)
function setMsg(elId, type, html) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = html ? `<div class="alert ${type}">${html}</div>` : '';
}

// Deep get
function dg(obj, path, defv) {
  try {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) ?? defv;
  } catch (e) { return defv; }
}

window.ABM = window.ABM || {};
Object.assign(window.ABM, {
  mulberry32, seededShuffle, strSeed, escapeHtml,
  fmtDateTime, fmtTime, generateTokenString,
  toast, fireConfetti, setMsg, dg
});
