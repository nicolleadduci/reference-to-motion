/**
 * ITU-R BS.1770-4 integrated + short-term loudness for a 16- or 24-bit
 * PCM WAV. Dependency-free, so loudness can be measured even with an ffmpeg
 * build whose loudnorm prints nothing (e.g. Remotion's bundled one).
 *
 *   node scripts/lufs.js <file.wav>
 */
const fs = require("fs");

const file = process.argv[2];
const b = fs.readFileSync(file);

// walk the chunk list rather than assuming a 44-byte header
let off = 12;
let fmt = null;
let dataStart = 0;
let dataLen = 0;
while (off + 8 <= b.length) {
  const id = b.toString("ascii", off, off + 4);
  const size = b.readUInt32LE(off + 4);
  if (id === "fmt ") {
    fmt = {
      channels: b.readUInt16LE(off + 10),
      rate: b.readUInt32LE(off + 12),
      bits: b.readUInt16LE(off + 22),
    };
  } else if (id === "data") {
    dataStart = off + 8;
    dataLen = size;
    break;
  }
  off += 8 + size + (size % 2);
}

const { channels: CH, rate: SR, bits } = fmt;
const bps = bits / 8;
const n = Math.floor(dataLen / (bps * CH));
const scale = Math.pow(2, bits - 1);
const sample = (i, c) => {
  const p = dataStart + (i * CH + c) * bps;
  return (bps === 2 ? b.readInt16LE(p) : b.readIntLE(p, 3)) / scale;
};

/** Direct-form-1 biquad. */
const biquad = (x, B, A) => {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = B[0] * x[i] + B[1] * x1 + B[2] * x2 - A[1] * y1 - A[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};

// K-weighting at 48 kHz: high-shelf then high-pass.
const B1 = [1.53512485958697, -2.69169618940638, 1.19839281085285];
const A1 = [1, -1.69065929318241, 0.73248077421585];
const B2 = [1.0, -2.0, 1.0];
const A2 = [1, -1.99004745483398, 0.99007225036621];

const weighted = [];
for (let c = 0; c < CH; c++) {
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = sample(i, c);
  weighted.push(biquad(biquad(x, B1, A1), B2, A2));
}

const lk = (p) => -0.691 + 10 * Math.log10(p || 1e-20);

/** Mean square over a window, summed across channels (unity weights). */
const power = (s, len) => {
  let sum = 0;
  for (const ch of weighted) {
    for (let i = s; i < s + len; i++) sum += ch[i] * ch[i];
  }
  return sum / len;
};

// Integrated: 400ms blocks, 75% overlap, absolute then relative gating.
const bs = Math.round(0.4 * SR);
const hop = Math.round(0.1 * SR);
const blocks = [];
for (let s = 0; s + bs <= n; s += hop) blocks.push(power(s, bs));

let gated = blocks.filter((p) => lk(p) > -70);
const relGate = lk(gated.reduce((a, c) => a + c, 0) / gated.length) - 10;
gated = gated.filter((p) => lk(p) > relGate);
const I = lk(gated.reduce((a, c) => a + c, 0) / gated.length);

// Short-term: 3s window, reported per second so the arrangement is visible.
const sw = Math.round(3 * SR);
const shortTerm = [];
for (let t = 0; t * SR + sw <= n; t++) shortTerm.push(lk(power(t * SR, sw)));

let peak = 0;
for (let i = 0; i < n; i++)
  for (let c = 0; c < CH; c++) peak = Math.max(peak, Math.abs(sample(i, c)));

console.log(`${file}`);
console.log(`  ${(n / SR).toFixed(3)}s  ${SR}Hz  ${CH}ch  ${bits}-bit`);
console.log(`  Integrated : ${I.toFixed(1)} LUFS`);
console.log(`  Peak       : ${(20 * Math.log10(peak)).toFixed(1)} dBFS`);
console.log(
  `  Short-term : ${shortTerm.map((v) => v.toFixed(0)).join(" ")} (per second)`,
);
