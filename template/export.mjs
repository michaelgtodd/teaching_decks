// Exports every built deck as a plain web page and a PDF, so the decks open from ordinary
// GitHub links instead of Claude artifacts.
//
//   node template/build.mjs              first: deck.mjs -> project/
//   node template/export.mjs [deck…]     then:  project/ -> docs/decks/<name>/index.html
//   node template/export.mjs --pdf […]   also:  docs/pdf/<name>.pdf (needs Playwright + Chromium)
//
// The page renders the same slide files the artifact uses: each <section> is drawn on a
// 1920×1080 canvas and scaled to the window. The type's custom elements are replaced here:
// <x-icon> with icons.mjs, <x-connector> with an SVG path, <x-embed> with a sandboxed iframe,
// and /_blob/ image ids with the screenshots kept in the repo. <aside> becomes speaker notes.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';
import { iconSvg } from './icons.mjs';
import { C, F } from './theme.mjs';

const OUT = 'docs';
const SITE = 'https://michaelgtodd.github.io/teaching_decks';

// Uploaded artifact assets -> the same images kept in the repo.
const BLOBS = {
  fb5ec6ca52654483c427960412101194: 'decks/01-first-robot-program/images/new-project-creator.png',
  '53f653e4d8b06aac674addf3777f2872': 'decks/01-first-robot-program/images/new-project-creator.png',
  '679cb31e8995d7a87393ae5f9c3d5cf4': 'decks/01-first-robot-program/images/sim-gui-with-labels.png',
  '6ba9f00841ad94c2d5efc61afadc5b63': 'decks/01-first-robot-program/images/dependency-sidebar.png',
  e88cb65afbc22f3eccb0e3e3695d6768: 'decks/01-first-robot-program/images/ds-operation-tab.png',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

// ---------- custom elements ----------

function connector(tag) {
  const n = (k) => Number(attr(tag, k));
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map(n);
  if ([x1, y1, x2, y2].some(Number.isNaN)) return ''; // Flow connectors are not used by these decks.
  const style = attr(tag, 'style') || '';
  const color = (style.match(/(?:^|;)\s*color:\s*([^;]+)/) || [])[1] || C.ink;
  const w = Number((style.match(/border-width:\s*([\d.]+)px/) || [])[1] || 2);
  const dash = (style.match(/border-style:\s*(dashed|dotted)/) || [])[1];
  const route = attr(tag, 'route') || 'straight';
  const head = attr(tag, 'head') || 'end';
  const pts = [[x1, y1]];
  if (route === 'hv') pts.push([x2, y1]);
  else if (route === 'vh') pts.push([x1, y2]);
  else if (route === 'elbow') { const mx = (x1 + x2) / 2; pts.push([mx, y1], [mx, y2]); }
  pts.push([x2, y2]);
  // Arrowheads: a constant-size filled triangle; the line stops at its base.
  const L = 6 * w + 8, H = 4 * w + 6;
  const tri = ([ax, ay], [bx, by]) => {
    const d = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / d, uy = (by - ay) / d;
    const base = [bx - ux * L, by - uy * L];
    return { base, path: `M${bx},${by}L${base[0] - uy * H / 2},${base[1] + ux * H / 2}L${base[0] + uy * H / 2},${base[1] - ux * H / 2}Z` };
  };
  const heads = [];
  const line = pts.map((p) => [...p]);
  const hs = attr(tag, 'head-start') || (head === 'both' ? 'filled' : 'none');
  const he = attr(tag, 'head-end') || (head === 'both' || head === 'end' ? 'filled' : 'none');
  if (he !== 'none') { const t = tri(line[line.length - 2], line[line.length - 1]); heads.push(t.path); line[line.length - 1] = t.base; }
  if (hs !== 'none') { const t = tri(line[1], line[0]); heads.push(t.path); line[0] = t.base; }
  const da = dash === 'dashed' ? ` stroke-dasharray="${3 * w} ${2 * w}"` : dash === 'dotted' ? ` stroke-dasharray="${w} ${w}"` : '';
  return `<svg class="xc" viewBox="0 0 1920 1080" aria-hidden="true"><path d="M${line.map((p) => p.join(',')).join('L')}" fill="none" stroke="${color}" stroke-width="${w}"${da} stroke-linejoin="round"/>${heads.map((h) => `<path d="${h}" fill="${color}"/>`).join('')}</svg>`;
}

function transformSlide(html, deckDir) {
  const notes = unesc(((html.match(/<aside>([\s\S]*?)<\/aside>/) || [])[1] || '').trim());
  const images = new Set();
  let out = html.replace(/<aside>[\s\S]*?<\/aside>\s*/, '');
  out = out.replace(/<x-icon\b([^>]*)>\s*<\/x-icon>/g, (m, a) => `<x-icon${a}>${iconSvg(attr(a, 'name'))}</x-icon>`);
  out = out.replace(/<x-connector\b[^>]*>\s*<\/x-connector>/g, (m) => connector(m));
  out = out.replace(/<x-embed\b([^>]*)>([\s\S]*?)<\/x-embed>/g, (m, a, body) =>
    `<iframe class="xe" sandbox="allow-scripts" title="Animation" style="${attr(a, 'style') || ''};border:0" srcdoc="${esc(body)}"></iframe>`);
  // A figure may also name a file in its own deck folder: src="images/foo.png".
  out = out.replace(/(<img\b[^>]*\ssrc=")(images\/[A-Za-z0-9._-]+)"/g, (m, pre, rel) => {
    const file = join(deckDir, rel);
    if (!existsSync(file)) throw new Error(`${deckDir}: image ${rel} is missing`);
    images.add(file);
    return `${pre}${rel}"`;
  });
  out = out.replace(/\/_blob\/([0-9a-f]+)/g, (m, id) => {
    const file = BLOBS[id];
    if (!file) throw new Error(`${deckDir}: no repo image for /_blob/${id}; add it to BLOBS in template/export.mjs`);
    images.add(file);
    return `images/${basename(file)}`;
  });
  const left = out.match(/<x-(?!icon\b)[a-z]+/);
  if (left) throw new Error(`${deckDir}: ${left[0]} has no export rendering`);
  out = out.replace(/^<section\b/, '<section class="slide"');
  return { html: out, notes, images };
}

// ---------- page ----------

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0B141D;color:${C.onDark};font-family:${F.body};overflow:hidden}
#stage{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}
.slide{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;display:flex;flex-direction:column;visibility:hidden}
.slide.on{visibility:visible}
.slide *{box-sizing:border-box;margin:0;overflow-wrap:break-word}
.slide div{display:flex;flex-direction:column}
.slide h1{font-size:96px;font-weight:600;line-height:1.1}
.slide h2{font-size:64px;font-weight:600;line-height:1.15}
.slide h3{font-size:44px;font-weight:600;line-height:1.2}
.slide p{font-size:32px;font-weight:400;line-height:1.4}
.slide img{display:block}
.slide a{color:inherit}
.slide table{width:100%;border-collapse:collapse}
.slide th,.slide td{padding:.35em .6em;text-align:left;vertical-align:top;border-top:1px solid ${C.line}}
.slide th{font-weight:600}
.slide x-icon{display:block;flex:none}
.slide x-icon svg{display:block;width:100%;height:100%}
.slide svg.xc{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible;pointer-events:none}
#bar{position:fixed;left:0;right:0;bottom:0;height:52px;display:flex;align-items:center;gap:10px;padding:0 14px;background:rgba(11,20,29,.92);font-size:15px;transition:opacity .25s}
#bar.hide{opacity:0}
#bar a,#bar button,#bar select{font:inherit;color:${C.onDark};background:#1C3145;border:1px solid #31495F;border-radius:6px;padding:6px 10px;text-decoration:none;cursor:pointer}
#bar select{max-width:min(46vw,520px)}
#bar .sp{flex:1}
#bar a,#bar button{white-space:nowrap}
@media (max-width:720px){#bar select,#hp,#fs{display:none}#bar{gap:6px;padding:0 8px}}
#bar .n{min-width:64px;text-align:center;font-variant-numeric:tabular-nums}
#notes{position:fixed;left:0;right:0;bottom:52px;max-height:30vh;overflow:auto;padding:14px 22px;background:#12202E;border-top:1px solid #31495F;font-size:18px;line-height:1.5;color:${C.onDark};display:none;white-space:pre-wrap}
body.notes #notes{display:block}
#help{position:fixed;right:14px;bottom:64px;background:#12202E;border:1px solid #31495F;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.7;display:none}
body.help #help{display:block}
@media print{
  @page{size:1920px 1080px;margin:0}
  html,body{height:auto;overflow:visible;background:none}
  #bar,#notes,#help{display:none!important}
  #stage{position:static;transform:none!important;width:auto;height:auto}
  .slide{position:relative;visibility:visible;break-after:page}
  .slide:last-child{break-after:auto}
}`;

const JS = `
const slides=[...document.querySelectorAll('.slide')],notes=JSON.parse(document.getElementById('notes-data').textContent);
const stage=document.getElementById('stage'),bar=document.getElementById('bar'),sel=document.getElementById('jump'),nEl=document.getElementById('notes'),cnt=document.getElementById('n');
let i=0;
function fit(){const nh=document.body.classList.contains('notes')?nEl.offsetHeight:0,w=innerWidth,h=innerHeight-52-nh,s=Math.min(w/1920,h/1080);stage.style.transform='translate('+((w-1920*s)/2)+'px,'+((h-1080*s)/2)+'px) scale('+s+')';}
function go(k,push){i=Math.max(0,Math.min(slides.length-1,k));slides.forEach((s,j)=>s.classList.toggle('on',j===i));cnt.textContent=(i+1)+' / '+slides.length;sel.value=i;nEl.textContent=notes[i]||'(no notes)';fit();const h='#slide-'+(i+1);if(location.hash!==h)history[push?'pushState':'replaceState'](null,'',h);}
function fromHash(){const m=location.hash.match(/^#slide-(\\d+)$/);go(m?m[1]-1:0,false);}
document.getElementById('prev').onclick=()=>go(i-1,true);document.getElementById('next').onclick=()=>go(i+1,true);
sel.onchange=()=>go(+sel.value,true);
document.getElementById('nt').onclick=()=>{document.body.classList.toggle('notes');fit();};
document.getElementById('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
document.getElementById('hp').onclick=()=>document.body.classList.toggle('help');
addEventListener('keydown',e=>{if(e.target===sel||e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key;
 if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){go(i+1,true);e.preventDefault();}
 else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){go(i-1,true);e.preventDefault();}
 else if(k==='Home')go(0,true);else if(k==='End')go(slides.length-1,true);
 else if(k==='n'||k==='N'){document.body.classList.toggle('notes');fit();}
 else if(k==='f'||k==='F')document.getElementById('fs').click();
 else if(k==='?')document.body.classList.toggle('help');});
let tx=null;addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
addEventListener('touchend',e=>{if(tx===null)return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)go(i+(d<0?1:-1),true);tx=null;});
stage.addEventListener('click',e=>{if(e.target.closest('a'))return;go(i+(e.clientX>innerWidth/3?1:-1),true);});
let idle;addEventListener('mousemove',()=>{bar.classList.remove('hide');clearTimeout(idle);idle=setTimeout(()=>{if(document.fullscreenElement)bar.classList.add('hide')},2500);});
addEventListener('resize',fit);addEventListener('popstate',fromHash);fromHash();
document.fonts&&document.fonts.ready.then(fit);`;

// Fonts are served from docs/fonts/ (OFL, copied from github.com/google/fonts; see SOURCE.txt),
// so the pages and PDFs never depend on Google Fonts being reachable.
const LOCAL_FONTS = {
  Oswald: 'oswald/Oswald-wght.ttf',
  'Public Sans': 'public-sans/PublicSans-wght.ttf',
  'Roboto Mono': 'roboto-mono/RobotoMono-wght.ttf',
};

function fontFaces(faces, prefix, deck) {
  return Object.values(faces || {}).map((f) => {
    const file = LOCAL_FONTS[f.family];
    if (!file) throw new Error(`${deck}: no local copy of the "${f.family}" font; add it to docs/fonts/ and LOCAL_FONTS`);
    return `@font-face{font-family:"${f.family}";src:url("${prefix}fonts/${file}") format("truetype");font-weight:100 900;font-style:normal;font-display:block}`;
  }).join('\n');
}

function slideLabel(html, k) {
  const h = (html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) || [])[1] || '';
  const t = unesc(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  return `${k + 1}. ${t || 'Slide'}`;
}

function exportDeck(name) {
  const dir = join('decks', name);
  const index = JSON.parse(readFileSync(join(dir, 'project', 'deck.json'), 'utf8'));
  const slides = index.order.map((id) => {
    const raw = readFileSync(join(dir, 'project', 'slides', `${id}.html`), 'utf8').trim();
    if (/^<section[^>]*\shidden[\s>=]/.test(raw)) return null;
    return transformSlide(raw, dir);
  }).filter(Boolean);
  const out = join(OUT, 'decks', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const imgs = new Set(slides.flatMap((s) => [...s.images]));
  if (imgs.size) mkdirSync(join(out, 'images'), { recursive: true });
  for (const f of imgs) copyFileSync(f, join(out, 'images', basename(f)));

  const title = index.title;
  const pdf = `../../pdf/${name}.pdf`;
  const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<!-- Generated by template/export.mjs from decks/${name}/project/. Do not edit by hand. -->
<style>${fontFaces(index.faces, '../../', name)}
${CSS}</style></head>
<body>
<div id="stage">
${slides.map((s) => s.html).join('\n')}
</div>
<div id="notes" aria-live="polite"></div>
<div id="help">← → or click: change slide<br>N: speaker notes<br>F: full screen<br>Home / End: first / last<br>Print or the PDF button: whole deck</div>
<div id="bar"><a href="../../" title="All decks">All decks</a><button id="prev" aria-label="Previous slide">←</button><span class="n" id="n"></span><button id="next" aria-label="Next slide">→</button>
<select id="jump" aria-label="Go to slide">${slides.map((s, k) => `<option value="${k}">${esc(slideLabel(s.html, k))}</option>`).join('')}</select>
<span class="sp"></span><button id="nt">Notes</button><a href="${pdf}">PDF</a><button id="fs">Full screen</button><button id="hp" aria-label="Keys">?</button></div>
<script type="application/json" id="notes-data">${JSON.stringify(slides.map((s) => s.notes)).replace(/</g, '\\u003c')}</script>
<script>${JS}</script>
</body></html>
`;
  writeFileSync(join(out, 'index.html'), page);
  return { name, title, count: slides.length };
}

// ---------- landing page ----------

function deckMeta(name) {
  const src = readFileSync(join('decks', name, 'deck.mjs'), 'utf8');
  const no = (src.match(/^\s*no:\s*(\d+)/m) || [])[1];
  return { no: no ? Number(no) : null };
}

function landing(decks) {
  const row = (d) => `<tr><td>${d.no || ''}</td><td><a href="pdf/${d.name}.pdf">${esc(d.title)}</a></td><td>${d.count}</td></tr>`;
  const core = decks.filter((d) => d.no).sort((a, b) => a.no - b.no);
  const other = decks.filter((d) => !d.no);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FRC Java crash course decks</title>
<!-- Generated by template/export.mjs. Do not edit by hand. -->
<style>
body{margin:0;background:${C.paper};color:${C.text};font:18px/1.5 Arial,sans-serif}
main{max-width:860px;margin:0 auto;padding:48px 24px}
h1{font-size:34px;margin:0 0 8px;color:${C.ink}}h2{font-size:22px;margin:36px 0 8px;color:${C.ink}}
p{color:${C.soft};margin:0 0 16px}
table{width:100%;border-collapse:collapse;background:${C.card};border:1px solid ${C.line}}
td,th{padding:10px 12px;border-top:1px solid ${C.line};text-align:left}th{background:${C.ink};color:${C.onDark}}
td:first-child,td:nth-child(3){color:${C.soft};white-space:nowrap}
a{color:${C.blue}}
</style></head><body><main>
<h1>FRC Java crash course decks</h1>
<p>WPILib 2026, Java command-based. Each title opens the deck as a PDF. Source: <a href="https://github.com/michaelgtodd/teaching_decks">github.com/michaelgtodd/teaching_decks</a>.</p>
<table><tr><th>#</th><th>Deck (PDF)</th><th>Slides</th></tr>
${core.map(row).join('\n')}
</table>
<h2>Also</h2>
<table><tr><th></th><th>Page (PDF)</th><th>Slides</th></tr>
${other.map(row).join('\n')}
<tr><td></td><td><a href="arm-playground/">Arm PID playground</a> (interactive)</td><td></td></tr>
</table>
</main></body></html>
`;
}

// ---------- PDF ----------

async function pdfs(decks) {
  const require = createRequire(import.meta.url);
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch(proxy ? { proxy } : {});
  mkdirSync(join(OUT, 'pdf'), { recursive: true });
  for (const d of decks) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`file://${process.cwd()}/${OUT}/decks/${d.name}/index.html`, { waitUntil: 'networkidle' });
    // document.fonts.check() is true for a face that was never declared, so check each FontFace.
    const missing = await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
      return [...document.fonts].filter((f) => f.status !== 'loaded').map((f) => f.family);
    });
    if (missing.length) throw new Error(`${d.name}: fonts did not load (${missing.join(', ')}); the PDF would use fallbacks`);
    // A PDF freezes an <x-embed> wherever it is. Deck 6's gain cycle draws each set for 3 s and
    // then holds, so waiting past that prints the first set finished instead of half-drawn.
    await page.waitForTimeout((await page.$('iframe.xe')) ? 3500 : 400);
    await page.pdf({ path: join(OUT, 'pdf', `${d.name}.pdf`), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log(`pdf  ${d.name}`);
  }
  await browser.close();
}

// ---------- main ----------

const args = process.argv.slice(2);
const wantPdf = args.includes('--pdf');
const pick = args.filter((a) => !a.startsWith('--'));
const all = readdirSync('decks').filter((n) => existsSync(join('decks', n, 'project', 'deck.json'))).sort();
const names = pick.length ? pick : all;
const done = names.map((n) => ({ ...exportDeck(n), ...deckMeta(n) }));
done.forEach((d) => console.log(`page ${d.name}: ${d.count} slides`));
if (wantPdf) await pdfs(done);
// The landing page lists every deck that has a PDF, even when only some were re-exported.
const listed = all.filter((n) => existsSync(join(OUT, 'pdf', `${n}.pdf`))).map((n) => done.find((d) => d.name === n) || (() => {
  const idx = JSON.parse(readFileSync(join('decks', n, 'project', 'deck.json'), 'utf8'));
  return { name: n, title: idx.title, count: idx.order.length, ...deckMeta(n) };
})());
writeFileSync(join(OUT, 'index.html'), landing(listed));
console.log(`site ${SITE}/`);
