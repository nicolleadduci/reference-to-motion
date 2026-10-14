// node crop.js <out.png> <W> file.rgb:x:y:w:h [file.rgb:x:y:w:h ...]
// Stacks native-resolution crops of full-size raw frames (W wide) so type,
// UI and edges can be read at 1:1. Grab a frame:
//   $FF -ss <sec> -i ref.mp4 -frames:v 1 -pix_fmt rgb24 -c:v rawvideo -f image2pipe 400.rgb
const fs = require("fs");
const [, , out, w, ...specs] = process.argv; const W = +w;
const parts = specs.map((s) => { const [f, x, y, cw, ch] = s.split(":"); return { b: fs.readFileSync(f), x: +x, y: +y, w: +cw, h: +ch }; });
const SW = Math.max(...parts.map((p) => p.w)), SH = parts.reduce((s, p) => s + p.h + 6, 0);
const img = Buffer.alloc(SW * SH * 3, 128); let oy = 0;
for (const p of parts) { for (let y = 0; y < p.h; y++) p.b.copy(img, (oy + y) * SW * 3, ((p.y + y) * W + p.x) * 3, ((p.y + y) * W + p.x + p.w) * 3); oy += p.h + 6; }
require("./png").writePng(out, img, SW, SH);
