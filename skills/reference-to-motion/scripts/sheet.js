// node sheet.js <raw rgb> <out.png> <startFrame> <step> <count> [cols=6] [w=384] [h=216]
// Contact sheet of a raw RGB dump, each tile stamped with its frame number.
// Overview: step = fps/2 (one frame every half second). Transitions: step 1-2.
// Make the dump:  $FF -i in.mp4 -an -vf scale=384:216 -pix_fmt rgb24 -c:v rawvideo -f image2pipe mid.rgb
const fs = require("fs"), zlib = require("zlib");
const [, , raw, out, s0, st, cnt, cl, w, h] = process.argv;
const W = +(w || 384), H = +(h || 216), FS = W * H * 3;
const start = +s0, step = +st, count = +cnt, cols = +(cl || 6), rows = Math.ceil(count / cols), G = 4;
const SW = cols * (W + G) + G, SH = rows * (H + G) + G;
const img = Buffer.alloc(SW * SH * 3, 40); const fd = fs.openSync(raw, "r"); const fb = Buffer.alloc(FS);
const F = { 0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001001001", 8: "111101111101111", 9: "111101111001111" };
for (let i = 0; i < count; i++) {
  const f = start + i * step; if (fs.readSync(fd, fb, 0, FS, f * FS) < FS) break;
  const cx = G + (i % cols) * (W + G), cy = G + Math.floor(i / cols) * (H + G);
  for (let y = 0; y < H; y++) fb.copy(img, ((cy + y) * SW + cx) * 3, y * W * 3, (y + 1) * W * 3);
  const s = String(f), sc = 3;
  for (let y = 0; y < 5 * sc + 4; y++) for (let x = 0; x < s.length * 4 * sc + 4; x++) { const o = ((cy + y) * SW + cx + x) * 3; img[o] = img[o + 1] = img[o + 2] = 0; }
  [...s].forEach((ch, ci) => { const g = F[ch]; for (let k = 0; k < 15; k++) if (g[k] === "1") { const gx = k % 3, gy = Math.floor(k / 3); for (let a = 0; a < sc; a++) for (let bb = 0; bb < sc; bb++) { const o = ((cy + 2 + gy * sc + a) * SW + cx + 2 + ci * 4 * sc + gx * sc + bb) * 3; img[o] = 255; img[o + 1] = 255; img[o + 2] = 0; } } });
}
require("./png").writePng(out, img, SW, SH);
