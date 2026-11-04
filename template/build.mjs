// Builds decks/<name>/deck.mjs into decks/<name>/project/{deck.json,slides/*.html}.
// Usage: node template/build.mjs            all decks
//        node template/build.mjs 03-foo     one deck
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FACES } from './theme.mjs';
import { SlideError } from './layouts.mjs';

export const deck = (d) => d; // Identity helper so deck files read declaratively.
const TOTAL_DECKS = 7;
const stripSvg = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, '<svg></svg>').replace(/<x-embed[\s\S]*?<\/x-embed>/g, '<x-embed></x-embed>');

async function buildDeck(name) {
  const dir = join('decks', name);
  const file = resolve(dir, 'deck.mjs');
  const { default: d } = await import(pathToFileURL(file).href);
  const problems = [], warnings = [];
  for (const k of ['no', 'title', 'short', 'slides']) if (d[k] === undefined) problems.push(`deck is missing "${k}"`);
  const ids = new Set();
  const rendered = [];
  (d.slides || []).forEach((s, index) => {
    try {
      if (ids.has(s.id)) throw new SlideError(`duplicate slide id "${s.id}"`);
      ids.add(s.id);
      if (s.kind !== 'cover' && !s.notes) warnings.push(`slide "${s.id}" has no speaker notes`);
      if (s.notes && s.notes.length > 3900) throw new SlideError(`slide "${s.id}": notes are ${s.notes.length} chars; 4000 max`);
      const html = s.render({ deck: { ...d, of: d.of ?? TOTAL_DECKS }, index, total: d.slides.length });
      const elements = (stripSvg(html).match(/<[a-z][a-z0-9-]*[\s>]/g) || []).length;
      if (elements > 195) throw new SlideError(`slide "${s.id}": ${elements} elements; 200 max. Fewer code lines usually fixes it`);
      for (const m of html.matchAll(/<svg[\s\S]*?<\/svg>/g)) if (Buffer.byteLength(m[0]) > 52 * 1024) throw new SlideError(`slide "${s.id}": SVG over 52 KB`);
      rendered.push({ id: s.id, html, section: s.section });
    } catch (e) {
      if (e instanceof SlideError) problems.push(e.message); else throw e;
    }
  });
  if (problems.length) return { name, problems, warnings };

  const slidesDir = join(dir, 'project', 'slides');
  mkdirSync(slidesDir, { recursive: true });
  for (const f of readdirSync(slidesDir)) if (!ids.has(f.replace(/\.html$/, ''))) rmSync(join(slidesDir, f));
  rendered.forEach((r) => writeFileSync(join(slidesDir, `${r.id}.html`), r.html));

  const sections = { s0: { description: d.description || d.title, start: rendered[0].id } };
  rendered.filter((r) => r.section).forEach((r, i) => { sections[`s${i + 1}`] = { description: r.section, start: r.id }; });
  const indexPath = join(dir, 'project', 'deck.json');
  const at = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')).createdOnFiles?.at : null;
  writeFileSync(indexPath, `${JSON.stringify({
    v: 4, createdOnFiles: { v: 1, at: at || new Date().toISOString().replace(/\.\d+Z$/, 'Z') }, lists: 'css',
    title: d.title, cover: rendered[0].id, order: rendered.map((r) => r.id), sections, faces: FACES, designSystems: [],
  }, null, 2)}\n`);
  return { name, problems, warnings, count: rendered.length };
}

const args = process.argv.slice(2);
const names = args.length ? args : readdirSync('decks').filter((n) => existsSync(join('decks', n, 'deck.mjs'))).sort();
let failed = 0;
for (const n of names) {
  const r = await buildDeck(n);
  if (r.problems.length) { failed++; console.log(`FAIL ${n}`); r.problems.forEach((p) => console.log(`  x ${p}`)); } else console.log(`ok   ${n}: ${r.count} slides`);
  r.warnings.forEach((w) => console.log(`  ! ${w}`));
}
process.exit(failed ? 1 : 0);
