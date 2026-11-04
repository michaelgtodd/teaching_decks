// Independent round-trip check: decodes each QR from the raw matrix, following the spec's
// reading procedure rather than sharing the encoder's helpers, and confirms the URL and all
// Reed-Solomon blocks. Usage: node template/verify-qr.mjs [url ...]  (no args = every link in every deck)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { qrMatrix } from './qr.mjs';

const EXP = new Array(512), LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

const CAP = { // version: [total codewords, [ecc per block, blocks]] for ECC level M, ISO table 9
  1:[26,[10,1]],2:[44,[16,1]],3:[70,[26,1]],4:[100,[18,2]],5:[134,[24,2]],6:[172,[16,4]],7:[196,[18,4]],8:[242,[22,4]],9:[292,[22,5]],10:[346,[26,5]],
  11:[404,[30,5]],12:[466,[22,8]],13:[532,[22,9]],14:[581,[24,9]],15:[655,[24,10]],
};
const ALIGN = {2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50],11:[6,30,54],12:[6,32,58],13:[6,34,62],14:[6,26,46,66],15:[6,26,48,70]};
const maskFn = [
  (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0, (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

export function decode(m) {
  const size = m.length, ver = (size - 17) / 4;
  // Finder patterns must be intact.
  for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const ring = x === 0 || x === 6 || y === 0 || y === 6, core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
    if (m[oy + y][ox + x] !== (ring || core)) throw new Error('finder damaged');
  }
  // Format info, both copies. Bit 14 is read first.
  const a = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];
  const b = [[8,size-1],[8,size-2],[8,size-3],[8,size-4],[8,size-5],[8,size-6],[8,size-7],[size-8,8],[size-7,8],[size-6,8],[size-5,8],[size-4,8],[size-3,8],[size-2,8],[size-1,8]];
  const read = (l) => l.reduce((v, [x, y]) => (v << 1) | (m[y][x] ? 1 : 0), 0); // lists are (x, y)
  const fa = read(a) ^ 0x5412, fb = read(b) ^ 0x5412;
  if (fa !== fb) throw new Error('format copies disagree');
  let rem = fa; for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
  if (rem !== 0) throw new Error('format BCH failed');
  const eclBits = fa >> 13, mask = (fa >> 10) & 7;
  if (eclBits !== 0) throw new Error('expected ECC level M');
  // Reserved map, rebuilt from the spec tables.
  const res = Array.from({ length: size }, () => new Array(size).fill(false));
  const box = (r0, c0, r1, c1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < size && c < size) res[r][c] = true; };
  box(0, 0, 8, 8); box(0, size - 8, 8, size - 1); box(size - 8, 0, size - 1, 8);
  box(6, 0, 6, size - 1); box(0, 6, size - 1, 6);
  const al = ALIGN[ver] || [];
  for (const r of al) for (const c of al) {
    if ((r < 9 && c < 9) || (r < 9 && c > size - 10) || (r > size - 10 && c < 9)) continue;
    box(r - 2, c - 2, r + 2, c + 2);
  }
  if (ver >= 7) { box(0, size - 11, 5, size - 9); box(size - 11, 0, size - 9, 5); }
  // Read codewords: right to left in pairs, alternating direction, skipping column 6.
  const bits = [];
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < size; k++) {
      const row = upward ? size - 1 - k : k;
      for (const c of [col, col - 1]) if (!res[row][c]) bits.push(m[row][c] !== maskFn[mask](row, c) ? 1 : 0);
    }
    upward = !upward;
  }
  const [total, [eccLen, nBlocks]] = CAP[ver];
  const cw = [];
  for (let i = 0; i < total; i++) cw.push(bits.slice(i * 8, i * 8 + 8).reduce((x, y) => (x << 1) | y, 0));
  // De-interleave.
  const nLong = (total - eccLen * nBlocks) % nBlocks, shortD = Math.floor((total - eccLen * nBlocks) / nBlocks);
  const blocks = Array.from({ length: nBlocks }, (_, i) => ({ d: new Array(shortD + (i >= nBlocks - nLong ? 1 : 0)), e: new Array(eccLen) }));
  let p = 0;
  for (let i = 0; i < shortD + 1; i++) for (const bl of blocks) if (i < bl.d.length) bl.d[i] = cw[p++];
  for (let i = 0; i < eccLen; i++) for (const bl of blocks) bl.e[i] = cw[p++];
  // Reed-Solomon: every syndrome must be zero.
  for (const bl of blocks) {
    const c = bl.d.concat(bl.e);
    for (let s = 0; s < eccLen; s++) {
      let v = 0;
      for (const w of c) v = (v === 0 ? 0 : EXP[LOG[v] + s]) ^ w;
      if (v !== 0) throw new Error('RS syndrome non-zero');
    }
  }
  // Parse byte mode.
  const data = blocks.flatMap((bl) => bl.d);
  const stream = data.flatMap((w) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (w >> i) & 1));
  const take = (() => { let i = 0; return (n) => { let v = 0; for (let k = 0; k < n; k++) v = (v << 1) | stream[i++]; return v; }; })();
  if (take(4) !== 4) throw new Error('not byte mode');
  const len = take(ver <= 9 ? 8 : 16);
  return new TextDecoder().decode(Uint8Array.from({ length: len }, () => take(8)));
}

function deckUrls() {
  const urls = new Set();
  if (!existsSync('decks')) return urls;
  for (const d of readdirSync('decks')) {
    const dir = join('decks', d, 'project', 'slides');
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) for (const x of readFileSync(join(dir, f), 'utf8').matchAll(/data-qr="([^"]+)"/g)) urls.add(x[1].replace(/&amp;/g, '&'));
  }
  return urls;
}
const list = process.argv.length > 2 ? process.argv.slice(2) : [...deckUrls()];
let bad = 0;
for (const u of list) {
  const { matrix, version, mask } = qrMatrix(u, 'M');
  try {
    const out = decode(matrix);
    if (out !== u) throw new Error(`decoded "${out}"`);
    console.log(`ok  v${version} m${mask} ${matrix.length}x${matrix.length}  ${u}`);
  } catch (e) { bad++; console.log(`BAD ${u}: ${e.message}`); }
}
console.log(`${list.length - bad}/${list.length} QR codes round-trip`);
process.exit(bad ? 1 : 0);
