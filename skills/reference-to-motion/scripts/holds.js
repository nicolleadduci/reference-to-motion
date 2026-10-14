// node holds.js <a.raw> [b.raw] [--w 384 --h 216 --from 0]
// One raw dump: lists STILL stretches (>= 12 frames where almost nothing
// changes) — the safe places to add or remove time when retiming a cut.
// Two dumps: per-frame mean difference between two renders of the same
// cut (prove a change touched only what it should; ~0.01 = identical).
const fs = require("fs");
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? +a[i + 1] : d; };
const files = a.filter((x, i) => !x.startsWith("--") && !(i > 0 && a[i - 1].startsWith("--")));
const W = opt("--w", 384), H = opt("--h", 216), FROM = opt("--from", 0), FS = W * H * 3;
const A = fs.readFileSync(files[0]); const n = Math.floor(A.length / FS);
if (files[1]) {
  const B = fs.readFileSync(files[1]); const m = Math.min(n, Math.floor(B.length / FS)); let sum = 0, mx = 0, at = 0; const bad = [];
  for (let f = 0; f < m; f++) { let d = 0; for (let j = f * FS; j < (f + 1) * FS; j += 5) d += Math.abs(A[j] - B[j]); d /= FS / 5; sum += d; if (d > mx) { mx = d; at = f; } if (d > 1) bad.push(f); }
  console.log(`frames ${m}  mean diff ${(sum / m).toFixed(3)}  max ${mx.toFixed(2)} at f${at + FROM}  frames > 1.0: ${bad.length}${bad.length ? ` (first ${bad[0] + FROM}, last ${bad[bad.length - 1] + FROM})` : ""}`);
} else {
  let s = -1; const out = [];
  for (let i = 1; i <= n; i++) { let c = 0; if (i < n) for (let j = 0; j < FS; j++) if (Math.abs(A[i * FS + j] - A[(i - 1) * FS + j]) > 12) c++; const still = i < n && c < 40; if (still && s < 0) s = i; if (!still && s >= 0) { if (i - s >= 12) out.push(`  f${s + FROM}-${i - 1 + FROM} (${i - s} frames)`); s = -1; } }
  console.log(`still stretches:\n${out.join("\n")}`);
}
