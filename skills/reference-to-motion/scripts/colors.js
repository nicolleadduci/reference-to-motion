// node colors.js <W> <H> frame.rgb [frame.rgb ...]
// For full-resolution raw frames: dominant colours (grounds), saturated
// accents, and a grain reading (spatial std in the flattest 200x200 patch;
// < 0.6 means no grain, 1.5+ means visible grain). Pass two consecutive
// frames of a still hold to also get temporal noise (animated grain).
const fs = require("fs");
const [, , w, h, ...files] = process.argv; const W = +w, H = +h;
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const bins = (b, sat) => { const m = new Map(); for (let i = 0; i < b.length; i += 3) { const r = b[i], g = b[i + 1], bl = b[i + 2]; if (sat && Math.max(r, g, bl) - Math.min(r, g, bl) < 50) continue; const k = (r >> 3) << 10 | (g >> 3) << 5 | (bl >> 3); let e = m.get(k); if (!e) m.set(k, (e = [0, 0, 0, 0])); e[0]++; e[1] += r; e[2] += g; e[3] += bl; } return [...m.values()].sort((p, q) => q[0] - p[0]); };
const flat = (b) => { let best = [1e9, 0, 0]; for (let y0 = 0; y0 + 200 <= H; y0 += 100) for (let x0 = 0; x0 + 200 <= W; x0 += 100) { let s = 0, s2 = 0, n = 0; for (let y = y0; y < y0 + 200; y += 2) for (let x = x0; x < x0 + 200; x += 2) { const v = b[(y * W + x) * 3 + 1]; s += v; s2 += v * v; n++; } const m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m)); if (sd < best[0]) best = [sd, x0, y0]; } return best; };
let prev = null;
for (const f of files) {
  const b = fs.readFileSync(f);
  console.log(`\n${f}`);
  console.log("  dominant:", bins(b, false).slice(0, 6).map((e) => `${hex([e[1] / e[0], e[2] / e[0], e[3] / e[0]])} ${(e[0] / (W * H) * 100).toFixed(1)}%`).join("  "));
  console.log("  accents: ", bins(b, true).slice(0, 5).map((e) => `${hex([e[1] / e[0], e[2] / e[0], e[3] / e[0]])} n=${e[0]}`).join("  ") || "none");
  const [sd, x0, y0] = flat(b); console.log(`  grain: flattest patch at ${x0},${y0} std ${sd.toFixed(2)}`);
  if (prev) { let t = 0, n = 0; for (let y = y0; y < y0 + 200; y++) for (let x = x0; x < x0 + 200; x++) { t += Math.abs(b[(y * W + x) * 3 + 1] - prev[(y * W + x) * 3 + 1]); n++; } console.log(`  temporal noise vs previous file: ${(t / n).toFixed(3)} (≈0 = static or no grain)`); }
  prev = b;
}
