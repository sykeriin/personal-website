/* Builds the Durva pixel sprites (32x48 px) from the hand-made head and torso in public/char/durva-idle.png.
   Arms and legs are redrawn from joint positions so every limb stays joined to the body in every frame. */
import fs from 'node:fs';
import zlib from 'node:zlib';

const DIR = new URL('../public/char/', import.meta.url);
const U = 24, W = 32, H = 48;

function readPng(file) {
  const b = fs.readFileSync(file); let p = 8, w = 0, h = 0; const idat = [];
  while (p < b.length) { const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8); if (type === 'IHDR') { w = b.readUInt32BE(p + 8); h = b.readUInt32BE(p + 12); } if (type === 'IDAT') idat.push(b.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; for (let x = 0; x < stride; x++) { const v = raw[y * (stride + 1) + 1 + x], a = x >= bpp ? out[y * stride + x - bpp] : 0, u = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
    out[y * stride + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + u : f === 3 ? v + ((a + u) >> 1) : v + (() => { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? u : c; })()) & 255; } }
  return { w, h, px: out };
}
const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
function toGrid(png) { const g = []; for (let y = 0; y < H; y++) { g.push([]); for (let x = 0; x < W; x++) { const i = ((y * U + 12) * png.w + x * U + 12) * 4; g[y].push(png.px[i + 3] < 128 ? null : hex(png.px[i], png.px[i + 1], png.px[i + 2])); } } return g; }

const base = toGrid(readPng(new URL('../../scripts/durva-src/durva-idle.png', DIR)));
const hpHead = toGrid(readPng(new URL('../../scripts/durva-src/durva-headphones.png', DIR)));
const SKIN = base[14][14], SKIN_D = base[24][10] || '#af8c66', PANTS = base[34][10], INK = base[34][7], SHOE = base[44][9], SOLE = base[46][9], HAIR = base[4][12], GOLD = base[26][16] || '#c4a23a';
const STICK = '#c4a23a';

const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

/* head and torso: rows 0..27, columns 8..24, optionally shifted down (when seated) */
function body(g, dy, hp, dx = 0) {
  for (let y = 0; y < 28; y++) for (let x = 8; x <= 24; x++) { let c = base[y][x]; if (hp && y < 18 && x >= 6) c = hpHead[y][x]; if (c && inb(x + dx, y + dy)) g[y + dy][x + dx] = c; }
  if (hp) for (let y = 0; y < 18; y++) for (const x of [6, 7, 25, 26]) { const c = hpHead[y][x]; if (c && inb(x + dx, y + dy)) g[y + dy][x + dx] = c; }
}
function blink(g, dy) { for (let x = 10; x <= 18; x++) if (g[11 + dy][x] === INK) g[11 + dy][x] = SKIN_D; }

function stampPath(mask, pts, r) {
  for (let s = 0; s < pts.length - 1; s++) { const [ax, ay] = pts[s], [bx, by] = pts[s + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 4));
    for (let i = 0; i <= n; i++) { const cx = ax + (bx - ax) * i / n, cy = ay + (by - ay) * i / n; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= r) mask.add(x + ',' + y); } }
}
function layer(g, mask, color, over = false, extra = {}) {
  const m = [...mask].map(k => k.split(',').map(Number));
  for (const [x, y] of m) g[y][x] = extra[x + ',' + y] || color;
  for (const [x, y] of m) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && !mask.has(nx + ',' + ny) && !g[ny][nx]) g[ny][nx] = INK; }
}
function ik(a, t, l1, l2, side, wx, wy) {
  let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy) || 1; const mx = l1 + l2 - .01; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - k * k)), bx = a[0] + dx * k / d, by = a[1] + dy * k / d, px = -dy / d * h, py = dx / d * h, e1 = [bx + px, by + py], e2 = [bx - px, by - py], sc = e => side * e[0] * wx + e[1] * wy;
  return { e: sc(e1) < sc(e2) ? e2 : e1, h: [a[0] + dx, a[1] + dy] };
}

function legs(g, p) {
  const hips = [[12, p.hy], [20, p.hy]];
  (p.top ? [1, 0] : [0, 1]).forEach(i => { const hp = hips[i], ft = p.f[i], side = i ? 1 : -1, kn = p.k && p.k[i] ? p.k[i] : (() => { const d = Math.hypot(ft[0] - hp[0], ft[1] - 3 - hp[1]), l = Math.max(d / 2 * 1.002, 5); return ik(hp, [ft[0], ft[1] - 3], l, l, side, 1, 0).e; })(), mask = new Set(), ex = {};
    stampPath(mask, [hp, kn, [ft[0], ft[1] - 3]], 2.6);
    for (let y = ft[1] - 2; y <= ft[1]; y++) for (let x = ft[0] - 3; x <= ft[0] + 3; x++) { if (!inb(x, y)) continue; mask.add(x + ',' + y); ex[x + ',' + y] = y === ft[1] ? SOLE : SHOE; }
    layer(g, mask, PANTS, false, ex); });
}
function arms(g, p) {
  const bx = p.bx || 0, sh = [[7.5 + bx, 19.5 + p.dy], [24.5 + bx, 19.5 + p.dy]];
  [0, 1].forEach(i => { const side = i ? 1 : -1, r = (() => { const d = Math.hypot(p.h[i][0] - sh[i][0], p.h[i][1] - sh[i][1]), l = p.al || Math.min(6.6, Math.max(d / 2 * 1.05, 4)); return ik(sh[i], p.h[i], l, l, side, 1, 1.5); })(), mask = new Set();
    stampPath(mask, [sh[i], r.e, r.h], 1.75); const hx = Math.round(r.h[0]), hy = Math.round(r.h[1]); for (let y = hy - 1; y <= hy + 1; y++) for (let x = hx - 1; x <= hx + 1; x++) if (inb(x, y)) mask.add(x + ',' + y);
    layer(g, mask, SKIN, true);
    if (p.stick && p.stick[i]) { const s = p.stick[i], sx = hx + (i ? -1 : 1), tip = [[sx, hy - 1], [sx + (i ? -1 : 1), hy - 2], [sx + (i ? -2 : 2), hy - 3], [sx + (i ? -3 : 3), hy - 4], [sx + (i ? -4 : 4), hy - 5]].slice(0, s); for (const [x, y] of tip) if (inb(x, y)) g[y][x] = STICK; } });
}

function make(p) {
  const g = blank(); p = { dy: 0, hy: 28, f: [[11, 46], [21, 46]], ...p };
  legs(g, p); body(g, p.dy, p.hp, p.bx || 0); arms(g, p); if (p.blink) blink(g, p.dy);
  return p.flip ? g.slice().reverse() : g;
}

/* hands are in sprite pixels: x 0..31, y 0..47 */
const HANG = [[5.5, 28], [26.5, 28]];
const FRAMES = {
  idle: {}, idle2: { blink: true },
  walk1: { f: [[11, 46], [22, 42]], h: [[6, 29], [26, 27]] }, walk2: { f: [[10, 42], [21, 46]], h: [[6, 27], [26, 29]] },
  wave1: { h: [[5.5, 28], [27, 11]] }, wave2: { h: [[5.5, 28], [29, 14]] },
  point: { h: [[1, 15], [26.5, 28]] },
  headphones: { hp: true, h: [[5.5, 28], [24, 15]] },
  guard: { h: [[11, 21], [21, 21]] },
  guitar1: { f: [[11, 46], [21, 46]], h: [[12, 27], [30, 19]] }, guitar2: { f: [[11, 46], [21, 46]], h: [[12, 30], [30, 19]] },
  dL: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[11, 33], [27, 21]], stick: [3, 4] },
  dR: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[5, 21], [21, 33]], stick: [4, 3] },
  dK: { dy: 6, hy: 34, f: [[10, 46], [22, 43]], k: [[10, 40], [22, 39]], h: [[4, 24], [28, 24]], stick: [4, 4] },
  dance1: { f: [[11, 46], [21, 44]], h: [[3, 12], [27, 27]] }, dance2: { f: [[11, 46], [21, 46]], h: [[3, 20], [29, 20]] },
  dance3: { f: [[11, 44], [21, 46]], h: [[5, 27], [29, 12]] },
  six1: { dy: 12, hy: 40, f: [[4, 46], [27, 46]], k: [[7, 43], [25, 43]], h: [[7, 45], [24, 38]] }, six2: { dy: 12, hy: 40, f: [[26, 46], [6, 46]], k: [[24, 43], [8, 43]], h: [[8, 38], [25, 45]] },
  hand1: { flip: true, al: 10, f: [[7, 46], [25, 46]], h: [[9, 0], [23, 0]] }, hand2: { flip: true, al: 10, f: [[12, 46], [20, 46]], h: [[9, 0], [23, 0]] },
  step1: { f: [[6, 46], [24, 46]], bx: -1, h: [[3, 26], [29, 20]] }, step2: { f: [[8, 46], [26, 46]], bx: 1, h: [[3, 20], [29, 26]] },
  cross1: { top: 1, f: [[19, 46], [12, 46]], bx: 1, h: [[3, 22], [29, 27]] }, cross2: { top: 0, f: [[19, 46], [12, 46]], bx: -1, h: [[3, 27], [29, 22]] },
  head1: { flip: true, f: [[12, 46], [20, 46]], h: [[7, 28], [25, 28]] }, head2: { flip: true, f: [[5, 46], [27, 46]], h: [[3, 26], [29, 26]] },
  jump: { f: [[11, 41], [21, 41]], h: [[2, 11], [30, 11]] },
  sit: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[10, 34], [22, 34]] }
};
for (const [name, p] of Object.entries(FRAMES)) { p.h = p.h || HANG; }

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function encode(g) {
  const raw = Buffer.alloc(H * (W * 4 + 1)); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = g[y][x], i = y * (W * 4 + 1) + 1 + x * 4; if (c) { raw[i] = parseInt(c.slice(1, 3), 16); raw[i + 1] = parseInt(c.slice(3, 5), 16); raw[i + 2] = parseInt(c.slice(5, 7), 16); raw[i + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const [name, p] of Object.entries(FRAMES)) fs.writeFileSync(new URL(`durva-${name}.png`, DIR), encode(make(p)));
console.log('wrote', Object.keys(FRAMES).length, 'frames');
