// node fold.js <music.wav> <beatSeconds> <firstDownbeatSeconds> [fromBar-toBar ...]
// 1) Folds onsets onto one bar per section so you can SEE where the kick
//    (LOW) and snare/hats (HIGH) sit — confirms the tempo/downbeat from
//    music.js: in most pop/hip-hop, HIGH peaks on beats 2 and 4.
// 2) Chroma (harmony) similarity between every pair of bars: pairs >= 0.99
//    are safe splice points for shortening/lengthening the track on the bar line.
const fs = require("fs");
const [, , file, beatS, t0S, ...ranges] = process.argv;
const b = fs.readFileSync(file); let o = 12; while (b.toString("ascii", o, o + 4) !== "data") o += 8 + b.readUInt32LE(o + 4);
const len = b.readUInt32LE(o + 4); o += 8; const SR = 48000; const n = len / 4;
const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = (b.readInt16LE(o + i * 4) + b.readInt16LE(o + i * 4 + 2)) / 65536;
const BEAT = +beatS, BAR = BEAT * 4, T0 = +t0S; const NB = Math.floor((n / SR - T0) / BAR);
const hop = 240, F = Math.floor(n / hop); const lo = new Float32Array(F), hi = new Float32Array(F); let lp = 0, lp2 = 0; const a1 = Math.exp(-2 * Math.PI * 150 / SR), a2 = Math.exp(-2 * Math.PI * 5000 / SR);
for (let f = 0; f < F; f++) { let el = 0, eh = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { lp = a1 * lp + (1 - a1) * x[i]; lp2 = a2 * lp2 + (1 - a2) * x[i]; const h = x[i] - lp2; el += lp * lp; eh += h * h; } lo[f] = Math.sqrt(el / hop); hi[f] = Math.sqrt(eh / hop); }
const fl = (a) => { const r = new Float32Array(F); for (let f = 1; f < F; f++) r[f] = Math.max(0, Math.log(1e-4 + a[f]) - Math.log(1e-4 + a[f - 1])); return r; }; const fL = fl(lo), fH = fl(hi);
const BINS = 48; const fold = (fx, b0, b1) => { const r = new Array(BINS).fill(0); for (let k = b0; k < b1; k++) for (let q = 0; q < BINS; q++) { const f = Math.round((T0 + k * BAR + q * BAR / BINS) * SR / hop); let mx = 0; for (let j = -2; j <= 2; j++) mx = Math.max(mx, fx[f + j] || 0); r[q] += mx; } return r; };
const show = (name, r) => { const m = Math.max(...r) || 1; let l1 = "", l2 = ""; for (let q = 0; q < BINS; q++) { l1 += q % 12 === 0 ? "|" : q % 3 === 0 ? "." : " "; l2 += " .:-=+*#%@"[Math.min(9, Math.round(r[q] / m * 9))]; } const top = r.map((v, q) => [q, v]).sort((p, q) => q[1] - p[1]).slice(0, 6).map((v) => (v[0] / 12 + 1).toFixed(2)).join(" "); console.log(`${name}\n  ${l1}   (| = beat, . = 16th)\n  ${l2}\n  strongest positions (beat no.): ${top}`); };
const R = ranges.length ? ranges : [`1-${NB}`];
for (const r of R) { const [a, z] = r.split("-").map(Number); show(`LOW  bars ${a}-${z}`, fold(fL, a - 1, z)); show(`HIGH bars ${a}-${z}`, fold(fH, a - 1, z)); }
const chroma = (k) => { const s = Math.round((T0 + k * BAR) * SR), N = Math.round(BAR * SR); const c = new Array(12).fill(0); for (let m = 36; m < 72; m++) { const fr = 440 * Math.pow(2, (m - 69) / 12), w = 2 * Math.PI * fr / SR, cf = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let i = 0; i < N && s + i < n; i += 2) { const v = x[s + i] + cf * s1 - s2; s2 = s1; s1 = v; } c[m % 12] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - cf * s1 * s2)); } const nm = Math.hypot(...c) || 1; return c.map((v) => v / nm); };
const C = []; for (let k = 0; k < NB; k++) C.push(chroma(k));
const pairs = []; for (let i = 0; i < NB; i++) for (let j = i + 2; j < NB; j++) pairs.push([i + 1, j + 1, C[i].reduce((s, v, q) => s + v * C[j][q], 0)]);
pairs.sort((p, q) => q[2] - p[2]);
console.log(`\n${NB} whole bars. Most similar bar pairs (splice: play up to the end of bar A, continue from the start of bar B+1):`);
console.log(pairs.slice(0, 15).map((p) => `  ${p[0]}~${p[1]} ${p[2].toFixed(4)}`).join("\n"));
