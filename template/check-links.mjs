// Fetches every link in the built decks and reports anything that isn't a 200.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const found = new Map();
const only = process.argv.slice(2);
for (const d of readdirSync('decks')) {
  if (only.length && !only.includes(d)) continue;
  const dir = join('decks', d, 'project', 'slides');
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/(?:href|data-qr)="(https?:[^"]+)"/g)) {
      const u = m[1].replace(/&amp;/g, '&');
      if (!found.has(u)) found.set(u, []);
      found.get(u).push(`${d}/${f}`);
    }
  }
}
let bad = 0;
for (const [u, where] of found) {
  let status;
  try {
    const r = await fetch(u.split('#')[0], { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'deck-link-check' } });
    status = r.status;
  } catch (e) { status = e.name; }
  if (status !== 200) { bad++; console.log(`${status}  ${u}  (${where[0]})`); }
}
console.log(`${found.size - bad}/${found.size} links OK`);
process.exit(bad ? 1 : 0);
