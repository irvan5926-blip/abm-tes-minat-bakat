/**
 * Sanity test untuk logika pengacakan & skoring.
 *
 * Tidak menyentuh SpreadsheetApp / GAS API - hanya membuktikan algoritma
 * Mulberry32, generatePairs28_, kategoriIQ_, dan classifyBakat_ bekerja
 * sesuai harapan saat dijalankan dengan Node.js standar:
 *
 *     node tests/test_scoring.js
 */

'use strict';

let pass = 0, fail = 0;
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.log('  ✗ ' + msg + '\n      actual:   ' + a + '\n      expected: ' + e); }
}

// ---------------- Mulberry32 ----------------
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
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

console.log('1. PRNG deterministik');
const a = seededShuffle([1,2,3,4,5,6,7,8], 42);
const b = seededShuffle([1,2,3,4,5,6,7,8], 42);
eq(a, b, 'shuffle deterministik dengan seed sama');
const c = seededShuffle([1,2,3,4,5,6,7,8], 43);
const sameAB = JSON.stringify(a) === JSON.stringify(c);
eq(sameAB, false, 'shuffle berbeda dengan seed berbeda');
eq(a.slice().sort((x,y)=>x-y), [1,2,3,4,5,6,7,8], 'shuffle adalah permutasi');

// ---------------- generatePairs28 ----------------
function generatePairs28(letters) {
  const pairs = [];
  const n = letters.length;
  for (let d = 1; d < n; d++) {
    for (let i = 0; i + d < n; i++) {
      pairs.push([letters[i], letters[i + d]]);
    }
  }
  return pairs;
}

console.log('\n2. Round-robin 28 pasang');
const letters = ['A','B','C','D','E','F','G','H'];
const pairs = generatePairs28(letters);
eq(pairs.length, 28, '8 huruf -> C(8,2) = 28 pasang');
// Tiap huruf muncul tepat 7 kali (sekali dengan setiap huruf lain)
const counts = {};
letters.forEach(l => counts[l] = 0);
pairs.forEach(p => { counts[p[0]]++; counts[p[1]]++; });
const allSeven = letters.every(l => counts[l] === 7);
eq(allSeven, true, 'tiap huruf muncul 7 kali');
eq(pairs[0], ['A','B'], 'pasangan pertama: A-B');
eq(pairs[27], ['A','H'], 'pasangan terakhir: A-H (jarak 7)');

// ---------------- classifyBakat & kategoriIQ ----------------
function classifyBakat(s) {
  if (s < 40) return 'Rendah';
  if (s > 70) return 'Tinggi';
  return 'Sedang';
}
function kategoriIQ(iq) {
  if (iq >= 130) return 'Sangat Superior';
  if (iq >= 120) return 'Superior';
  if (iq >= 110) return 'Di atas Rata-rata';
  if (iq >= 90)  return 'Rata-rata';
  if (iq >= 80)  return 'Di bawah Rata-rata';
  if (iq >= 70)  return 'Borderline';
  return 'Rendah';
}

console.log('\n3. Klasifikasi bakat');
eq(classifyBakat(30), 'Rendah', 'skor 30 -> Rendah');
eq(classifyBakat(40), 'Sedang', 'skor 40 -> Sedang');
eq(classifyBakat(70), 'Sedang', 'skor 70 -> Sedang');
eq(classifyBakat(71), 'Tinggi', 'skor 71 -> Tinggi');

console.log('\n4. Kategori IQ');
eq(kategoriIQ(135), 'Sangat Superior', 'IQ 135');
eq(kategoriIQ(125), 'Superior', 'IQ 125');
eq(kategoriIQ(115), 'Di atas Rata-rata', 'IQ 115');
eq(kategoriIQ(100), 'Rata-rata', 'IQ 100');
eq(kategoriIQ(85), 'Di bawah Rata-rata', 'IQ 85');
eq(kategoriIQ(75), 'Borderline', 'IQ 75');
eq(kategoriIQ(65), 'Rendah', 'IQ 65');

// ---------------- IQ Formula ----------------
function predictIQ(meanScore) {
  let iq = Math.round(70 + 0.6 * meanScore);
  return Math.max(50, Math.min(150, iq));
}

console.log('\n5. Formula prediksi IQ');
eq(predictIQ(50), 100, 'mean 50 -> IQ 100 (rata-rata populasi)');
eq(predictIQ(0), 70, 'mean 0 -> IQ 70 (borderline lower)');
eq(predictIQ(100), 130, 'mean 100 -> IQ 130 (sangat superior)');
eq(predictIQ(75), 115, 'mean 75 -> IQ 115');

console.log('\n=========================================');
console.log('  PASS: ' + pass + ',  FAIL: ' + fail);
console.log('=========================================');
process.exit(fail === 0 ? 0 : 1);
