// node cuts.js <small.rgb> <w> <h> <fps>
// Reads a tiny raw RGB dump of the reference (e.g. 96x54) and prints:
//   hard cuts (with shot lengths), motion runs (moves/transitions and how
//   long they take), and activity per half second. Writes <raw>.diff.json.
// Make the dump:  $FF -i ref.mp4 -an -vf scale=96:54 -pix_fmt rgb24 -c:v rawvideo -f image2pipe small.rgb
const fs = require("fs");
const [, , p, w = 96, h = 54, fps = 30] = process.argv;
const W = +w, H = +h, FPS = +fps, FS = W * H * 3;
const b = fs.readFileSync(p);
const n = Math.floor(b.length / FS);
const d = [0];
for (let i = 1; i < n; i++) { let s = 0; const a = i * FS, c = (i - 1) * FS; for (let k = 0; k < FS; k++) s += Math.abs(b[a + k] - b[c + k]); d.push(s / FS); }
fs.writeFileSync(p + ".diff.json", JSON.stringify(d));
const mean = (i) => { let r = 0, g = 0, bl = 0; const a = i * FS; for (let k = 0; k < FS; k += 3) { r += b[a + k]; g += b[a + k + 1]; bl += b[a + k + 2]; } const N = W * H; return "#" + [r / N, g / N, bl / N].map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""); };
console.log(`frames ${n}  (${(n / FPS).toFixed(2)} s at ${FPS} fps)`);
// hard cut: one-frame spike well above its neighbours
const cuts = [];
for (let i = 1; i < n; i++) { const nb = []; for (let j = Math.max(1, i - 6); j < Math.min(n, i + 7); j++) if (j !== i) nb.push(d[j]); nb.sort((x, y) => x - y); const med = nb[nb.length >> 1] || 0; if (d[i] > 14 && d[i] > 3.5 * med + 4) cuts.push([i, d[i], med]); }
console.log(`\nHARD CUTS: ${cuts.length}${cuts.length ? "" : "  (none: every scene change is a move, morph or wipe)"}`);
let prev = 0; for (const [i, v, m] of cuts) { console.log(`  f${String(i).padStart(5)} ${(i / FPS).toFixed(2).padStart(6)}s  shot len ${((i - prev) / FPS).toFixed(2)}s  diff ${v.toFixed(1)} (local ${m.toFixed(1)})  new ground ${mean(i)}`); prev = i; }
if (cuts.length) console.log(`  last shot len ${((n - prev) / FPS).toFixed(2)}s`);
// motion runs: diff > 0.25, merging gaps of <= 3 frames
const runs = []; let st = -1, gap = 0;
for (let i = 1; i < n; i++) { if (d[i] > 0.25) { if (st < 0) st = i; gap = 0; } else if (st >= 0 && ++gap > 3) { runs.push([st, i - gap]); st = -1; } }
if (st >= 0) runs.push([st, n - 1]);
console.log(`\nMOTION RUNS: ${runs.length}  (start frame, length, peak — read each with a close-up sheet)`);
for (const [a, z] of runs) { const seg = d.slice(a, z + 1); const pk = Math.max(...seg); console.log(`  f${String(a).padStart(5)}-${String(z).padEnd(5)} ${(a / FPS).toFixed(2).padStart(6)}s  len ${String(z - a + 1).padStart(3)}f  peak ${pk.toFixed(1)} @f${a + seg.indexOf(pk)}`); }
const holds = []; for (let i = 0; i < runs.length; i++) { const s = i ? runs[i - 1][1] + 1 : 0, e = runs[i][0] - 1; if (e - s >= 6) holds.push(e - s + 1); }
if (holds.length) { holds.sort((x, y) => x - y); console.log(`\nHOLDS between moves: ${holds.length}, median ${(holds[holds.length >> 1] / FPS).toFixed(2)}s, min ${(holds[0] / FPS).toFixed(2)}s, max ${(holds[holds.length - 1] / FPS).toFixed(2)}s`); }
let line = "\nACTIVITY per 0.5 s (mean frame diff):"; const half = Math.round(FPS / 2);
for (let s = 0; s * half < n; s++) { const seg = d.slice(s * half, s * half + half); line += (s % 10 === 0 ? `\n ${String(s / 2).padStart(5)}s ` : " ") + (seg.reduce((a, x) => a + x, 0) / seg.length).toFixed(1).padStart(4); }
console.log(line);
