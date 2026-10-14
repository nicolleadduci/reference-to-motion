// node mix.js <music.wav> <out.wav> <seconds> <beatSec> <firstDownbeatSec> [segments] [--lufs -14] [--ceil -1.2] [--fadeout 0.6]
// Builds the music bed on the track's own bar grid.
//   segments = comma list of "filmBar:trackBar" (1-indexed) where each
//   segment starts; default "1:1" = play straight. Example — a :60 film that
//   keeps bars 1-20, then jumps to track bar 25 for the track's real ending:
//     node mix.js music.wav public/mix.wav 60 0.64515 0.0225 1:1,21:25
//   Joins are 10 ms equal-power crossfades ON the bar line (pick joins
//   with fold.js: harmonically identical bars play as written).
// Gain is solved for the target integrated LUFS (BS.1770), then a
// look-ahead limiter holds the ceiling. AAC delivery reads ~0.7 dB hotter.
const fs = require("fs");
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const [inp, out, secs, beatS, t0S, segS] = args;
const SR = 48000, DUR = +secs, N = Math.round(DUR * SR), BAR = 4 * +beatS, T0 = +t0S;
const TARGET = opt("--lufs", -14), CEIL = opt("--ceil", -1.2), FADE_OUT = opt("--fadeout", 0.6), XF = 0.01, FADE_IN = 0.02;
const segs = (segS && !segS.startsWith("--") ? segS : "1:1").split(",").map((p) => p.split(":").map(Number)).map(([fb, tb]) => ({ film: (fb - 1) * BAR, track: T0 + (tb - 1) * BAR }));
const readWav = (p) => { const b = fs.readFileSync(p); let off = 12, fmt, start = 0, len = 0; while (off + 8 <= b.length) { const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4); if (id === "fmt ") fmt = { ch: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) }; else if (id === "data") { start = off + 8; len = size; break; } off += 8 + size + (size % 2); } const bps = fmt.bits / 8, n = Math.floor(len / (bps * fmt.ch)), ch = []; for (let c = 0; c < fmt.ch; c++) ch.push(new Float64Array(n)); for (let i = 0; i < n; i++) for (let c = 0; c < fmt.ch; c++) { const q = start + (i * fmt.ch + c) * bps; ch[c][i] = (bps === 2 ? b.readInt16LE(q) : b.readIntLE(q, 3)) / Math.pow(2, fmt.bits - 1); } if (fmt.rate !== SR) throw new Error("decode to 48 kHz first"); return { n, ch }; };
const mus = readWav(inp);
const at = (c, t) => { const j = Math.round(t * SR), ch = mus.ch[Math.min(c, mus.ch.length - 1)]; return j >= 0 && j < mus.n ? ch[j] : 0; };
const L = new Float64Array(N), R = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR; let k = 0; while (k + 1 < segs.length && t >= segs[k + 1].film - XF / 2) k++;
  const cur = segs[k], tc = cur.track + (t - cur.film); let l = at(0, tc), r = at(1, tc);
  if (k > 0 && t < cur.film + XF / 2) { const p = segs[k - 1], tp = p.track + (t - p.film), q = (t - (cur.film - XF / 2)) / XF; const wa = Math.cos(Math.PI / 2 * q), wb = Math.sin(Math.PI / 2 * q); l = wa * at(0, tp) + wb * l; r = wa * at(1, tp) + wb * r; }
  let g = 1; if (t < FADE_IN) g *= Math.sin(Math.PI / 2 * t / FADE_IN); if (DUR - t < FADE_OUT) g *= Math.sin(Math.PI / 2 * (DUR - t) / FADE_OUT);
  L[i] = g * l; R[i] = g * r;
}
const biquad = (x, B, A) => { const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = B[0] * x[i] + B[1] * x1 + B[2] * x2 - A[1] * y1 - A[2] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; };
const lufs = (chs) => { const w = chs.map((c) => biquad(biquad(c, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621])); const bs = Math.round(0.4 * SR), hop = Math.round(0.1 * SR), bl = []; for (let s = 0; s + bs <= w[0].length; s += hop) { let sum = 0; for (const c of w) for (let i = s; i < s + bs; i++) sum += c[i] * c[i]; bl.push(sum / bs); } const lk = (p) => -0.691 + 10 * Math.log10(p || 1e-20); let g = bl.filter((p) => lk(p) > -70); const rel = lk(g.reduce((a, c) => a + c, 0) / g.length) - 10; g = g.filter((p) => lk(p) > rel); return lk(g.reduce((a, c) => a + c, 0) / g.length); };
const gain = Math.pow(10, (TARGET - lufs([L, R])) / 20); for (let i = 0; i < N; i++) { L[i] *= gain; R[i] *= gain; }
const ceil = Math.pow(10, CEIL / 20); { let g = 1; for (let i = 0; i < N; i++) { let p = 0; for (let j = i; j < Math.min(N, i + 320); j += 8) p = Math.max(p, Math.abs(L[j]), Math.abs(R[j])); const want = p > ceil ? ceil / p : 1; g = want < g ? g + (want - g) * 0.35 : g + (want - g) * 0.0012; L[i] *= g; R[i] *= g; } }
const data = Buffer.alloc(N * 6); let o = 0; for (let i = 0; i < N; i++) for (const c of [L, R]) { data.writeIntLE(Math.round(Math.max(-1, Math.min(1, c[i])) * 8388607), o, 3); o += 3; }
const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 6, 28); h.writeUInt16LE(6, 32); h.writeUInt16LE(24, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(out, Buffer.concat([h, data]));
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
console.log(`wrote ${out}  ${DUR}s  ${lufs([L, R]).toFixed(1)} LUFS  peak ${(20 * Math.log10(pk)).toFixed(1)} dBFS  segments ${segs.map((s) => `${s.film.toFixed(3)}s<-track ${s.track.toFixed(3)}s`).join(", ")}`);
