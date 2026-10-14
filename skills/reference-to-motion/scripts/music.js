// node music.js <music.wav> [beatSeconds] [downbeatOffsetBeats]
// Tempo, beat phase, downbeat and a per-bar energy map, for cutting picture
// to the track. Decode first: $FF -i track.mp3 -ac 2 -ar 48000 -c:a pcm_s16le music.wav
// Prints the top tempo candidates. DO NOT trust the top one blindly: bass
// lines alias (a 93 BPM track read as 124 = 3:4). Pick the candidate whose
// grid puts snare/hats on beats 2 and 4 — confirm with fold.js — then
// re-run with that beat length as the 2nd argument.
const fs = require("fs");
const b = fs.readFileSync(process.argv[2]);
let o = 12; while (b.toString("ascii", o, o + 4) !== "data") o += 8 + b.readUInt32LE(o + 4);
const len = b.readUInt32LE(o + 4); o += 8; const SR = 48000; const n = len / 4;
const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = (b.readInt16LE(o + i * 4) + b.readInt16LE(o + i * 4 + 2)) / 65536;
const hop = 480, F = Math.floor(n / hop); const lo = new Float32Array(F), hi = new Float32Array(F), all = new Float32Array(F);
let lp = 0, lp2 = 0; const a1 = Math.exp(-2 * Math.PI * 150 / SR), a2 = Math.exp(-2 * Math.PI * 4000 / SR);
for (let f = 0; f < F; f++) { let el = 0, eh = 0, ea = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { lp = a1 * lp + (1 - a1) * x[i]; lp2 = a2 * lp2 + (1 - a2) * x[i]; const h = x[i] - lp2; el += lp * lp; eh += h * h; ea += x[i] * x[i]; } lo[f] = Math.sqrt(el / hop); hi[f] = Math.sqrt(eh / hop); all[f] = Math.sqrt(ea / hop); }
const flux = new Float32Array(F); for (let f = 1; f < F; f++) flux[f] = Math.max(0, Math.log(1e-4 + lo[f]) - Math.log(1e-4 + lo[f - 1])) + Math.max(0, Math.log(1e-4 + hi[f]) - Math.log(1e-4 + hi[f - 1]));
console.log(`duration ${(n / SR).toFixed(2)} s`);
let cand = []; for (let bpm = 60; bpm <= 200; bpm += 0.05) { const lag = 60 / bpm * 100; let s = 0; for (let f = 0; f + 4 * lag < F - 1; f++) { const g = flux[f]; if (g <= 0) continue; for (let k = 1; k <= 4; k++) { const p = f + k * lag, i0 = Math.floor(p), fr = p - i0; s += g * (flux[i0] * (1 - fr) + flux[i0 + 1] * fr); } } cand.push([bpm, s]); }
cand.sort((p, q) => q[1] - p[1]); const top = []; for (const c of cand) { if (top.every((t) => Math.abs(t[0] - c[0]) > 1.5)) top.push(c); if (top.length === 6) break; }
console.log("tempo candidates (BPM:score):", top.map((v) => `${v[0].toFixed(2)}:${v[1].toFixed(0)}`).join("  "));
const BEAT = +process.argv[3] || 60 / top[0][0]; const lagF = BEAT * 100;
let bp = 0, bs = -1; for (let ph = 0; ph < lagF; ph += 0.25) { let s = 0; for (let k = 0; ph + k * lagF < F - 1; k++) s += flux[Math.round(ph + k * lagF)]; if (s > bs) { bs = s; bp = ph; } }
const ph = bp / 100;
const m4 = [0, 0, 0, 0]; for (let k = 0; ph + k * BEAT < n / SR - 0.05; k++) { const f = Math.round((ph + k * BEAT) * 100); let mx = 0; for (let j = -3; j <= 3; j++) { const v = Math.max(0, Math.log(1e-4 + (lo[f + j] || 0)) - Math.log(1e-4 + (lo[f + j - 1] || 0))); mx = Math.max(mx, v); } m4[k % 4] += mx; }
const off = process.argv[4] !== undefined ? +process.argv[4] : m4.indexOf(Math.max(...m4));
const T0 = ph + off * BEAT, BAR = BEAT * 4;
console.log(`using beat ${BEAT.toFixed(5)} s (${(60 / BEAT).toFixed(2)} BPM)  first beat ${ph.toFixed(4)} s`);
console.log(`low-end onset by beat position mod 4: ${m4.map((v) => v.toFixed(1)).join(" ")}  -> downbeat offset ${off} beat(s), first downbeat ${T0.toFixed(4)} s`);
for (const fps of [24, 25, 30, 60]) console.log(`  at ${fps} fps: beat ${(BEAT * fps).toFixed(4)} f, bar ${(BAR * fps).toFixed(3)} f`);
const db = (v) => (20 * Math.log10(v + 1e-6)).toFixed(1);
const rms = (arr, t0, t1) => { let s = 0, c = 0; for (let f = Math.max(0, Math.round(t0 * 100)); f < Math.min(F, Math.round(t1 * 100)); f++) { s += arr[f] * arr[f]; c++; } return Math.sqrt(s / Math.max(1, c)); };
console.log("\nbar  start(s)  all   low   high  | onset strength per half beat (look for drops, fills, accents)");
for (let k = 0; T0 + k * BAR < n / SR; k++) { const s = T0 + k * BAR; const pb = []; for (let q = 0; q < 8; q++) { const f = Math.round((s + q * BEAT / 2) * 100); let mx = 0; for (let j = -3; j <= 3; j++) mx = Math.max(mx, flux[f + j] || 0); pb.push(mx.toFixed(1).padStart(4)); }
  console.log(String(k + 1).padStart(3), s.toFixed(3).padStart(8), db(rms(all, s, s + BAR)).padStart(6), db(rms(lo, s, s + BAR)).padStart(5), db(rms(hi, s, s + BAR)).padStart(6), " |", pb.join(" ")); }
