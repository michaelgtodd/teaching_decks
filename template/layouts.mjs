// Slide layouts. Each returns { id, kind, notes, render(ctx) } and validates its own fit at build time,
// because nothing downstream checks layout: an over-long title fails the build rather than the talk.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { C, F, T, G, ICONS } from './theme.mjs';
import { esc, highlightLine } from './java.mjs';
import { qrSvg } from './qr.mjs';

const WIDTH = { sans: 0.54, display: 0.45, mono: 0.6 };
export class SlideError extends Error {}
const need = (ok, id, msg) => { if (!ok) throw new SlideError(`slide "${id}": ${msg}`); };

// Prose helpers ---------------------------------------------------------------------------------
const smart = (s) => s
  .replace(/(^|[\s(\[—–-])"/g, '$1“').replace(/"/g, '”')
  .replace(/(^|[\s(\[—–-])'/g, '$1‘').replace(/'/g, '’');
const plain = (s) => String(s).replace(/\*\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// **bold**, `code`, [text](url). Inline code can only change colour: spans may not change font.
export function rich(s, codeColor = C.blue) {
  let out = '';
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:[^)]+)\)/g;
  let last = 0;
  for (const m of String(s).matchAll(re)) {
    out += esc(smart(s.slice(last, m.index)));
    if (m[1] !== undefined) out += `<b>${rich(m[1], codeColor)}</b>`;
    else if (m[2] !== undefined) out += `<span style="color:${codeColor}">${esc(m[2])}</span>`;
    else out += `<a href="${esc(m[4])}">${esc(smart(m[3]))}</a>`;
    last = m.index + m[0].length;
  }
  return out + esc(smart(String(s).slice(last)));
}
const estLines = (s, w, fs, fam = 'sans') => {
  let lines = 0;
  for (const para of plain(s).split('\n')) lines += Math.max(1, Math.ceil((para.length * fs * WIDTH[fam] * 1.06) / w));
  return lines;
};
const checkWords = (id, s, w, fs) => {
  for (const word of plain(s).split(/\s+/)) need(word.length * fs * 0.56 <= w, id, `"${word}" is wider than its ${w}px box at ${fs}px; shorten it or widen the box`);
};
const estH = (s, w, fs, lh = 1.3, fam = 'sans') => estLines(s, w, fs, fam) * fs * lh;

// Shared chrome -------------------------------------------------------------------------------
const eyebrowHtml = (t, color) => `<p style="font-size:${T.small}px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${color}">${esc(smart(t))}</p>`;
function header(id, eyebrow, title, dark = false) {
  need(title, id, 'title is required');
  need(plain(title).length <= 54, id, `title is ${plain(title).length} chars; 54 max so it stays on one line`);
  need(eyebrow && plain(eyebrow).length <= 60, id, 'eyebrow is required (60 chars max)');
  return `<div style="display:flex;flex-direction:column;gap:6px">${eyebrowHtml(eyebrow, dark ? C.orangeBright : C.orange)}<h2 style="font-family:${F.display};font-size:${T.title}px;font-weight:600;line-height:1.1;color:${dark ? C.onDark : C.ink}">${rich(title)}</h2></div>`;
}
function footer(ctx, { dark, flag2027, id }) {
  const soft = dark ? C.onDarkSoft : C.soft;
  let html = `<p style="position:absolute;left:${G.pad}px;bottom:56px;width:420px;font-size:${T.small}px;color:${soft}">${esc(ctx.deck.label ?? `Deck ${ctx.deck.no}`)} · ${esc(smart(ctx.deck.short))}</p>`;
  if (flag2027) {
    need(plain(flag2027).length <= 72, id, 'flag2027 is 72 chars max');
    html += `<p style="position:absolute;left:560px;bottom:56px;width:1120px;font-size:${T.small}px;font-weight:600;color:${dark ? C.blueBright : C.blue}">2027: ${rich(flag2027, dark ? C.blueBright : C.blue)}</p>`;
  }
  html += `<p style="position:absolute;right:${G.pad}px;bottom:56px;width:100px;text-align:right;font-size:${T.small}px;color:${soft}">${ctx.index + 1}</p>`;
  return html;
}
const asideHtml = (notes) => (notes ? `<aside>${esc(smart(notes))}</aside>` : '');
function frame({ id, bg = C.paper, color = C.text, dark = false, body, notes, ctx, flag2027, backdrop = '', chrome = true, padding, justify, gap = G.gap }) {
  const pad = padding || `${G.top}px ${G.pad}px ${G.bottom}px`;
  return `<section id="${id}" data-transition="fade" style="background:${bg};color:${color};font-family:${F.body};padding:${pad};display:flex;flex-direction:column;gap:${gap}px${justify ? `;justify-content:${justify}` : ''}">
${backdrop}${body}${chrome ? footer(ctx, { dark, flag2027, id }) : ''}
${asideHtml(notes)}
</section>
`;
}
const HAZARD = `repeating-linear-gradient(45deg, ${C.amber} 0px, ${C.amber} 26px, ${C.ink} 26px, ${C.ink} 52px)`;
const blueprint = `<div style="position:absolute;left:0;top:0;width:1920px;height:1080px;background:repeating-linear-gradient(90deg, rgba(140,203,255,0.07) 0px, rgba(140,203,255,0.07) 2px, transparent 2px, transparent 96px)"></div><div style="position:absolute;left:0;top:0;width:1920px;height:1080px;background:repeating-linear-gradient(0deg, rgba(140,203,255,0.07) 0px, rgba(140,203,255,0.07) 2px, transparent 2px, transparent 96px)"></div>`;
const mk = (kind, spec, render) => { need(spec.id && /^[A-Za-z0-9_-]{1,64}$/.test(spec.id), spec.id || '?', 'id must match [A-Za-z0-9_-]{1,64}'); return { id: spec.id, kind, notes: spec.notes || '', section: spec.section, render }; };

// Structure slides ----------------------------------------------------------------------------
export function cover(spec) {
  const { title, subtitle, minutes, tag = 'WPILib 2026 · Java · Command-based' } = spec;
  need(plain(title).length <= 44, 'cover', `cover title is ${plain(title).length} chars; 44 max (two lines)`);
  return mk('cover', { id: 'cover', ...spec }, (ctx) => frame({
    id: spec.id || 'cover', bg: C.ink, color: C.onDark, chrome: false, notes: spec.notes, justify: 'center', gap: 32,
    padding: `${G.pad}px ${G.pad}px ${G.bottom}px`,
    backdrop: `${blueprint}<div style="position:absolute;left:0;top:1032px;width:1920px;height:48px;background:${HAZARD}"></div>`,
    body: `${eyebrowHtml(`${ctx.deck.label ?? `Deck ${ctx.deck.no} of ${ctx.deck.of}`} · FRC Java crash course`, C.orangeBright)}
<h1 style="font-family:${F.display};font-size:${T.display}px;font-weight:600;line-height:1.08;color:${C.onDark}">${rich(title)}</h1>
<p style="font-size:${T.lead}px;line-height:1.3;color:${C.onDarkSoft}">${rich(subtitle, C.blueBright)}</p>
<div style="display:flex;flex-direction:row;gap:20px;align-items:center">
${minutes ? `<p style="font-size:${T.small}px;font-weight:700;background:${C.orangeBright};color:${C.ink};padding:10px 22px;border-radius:6px">${minutes} min</p>` : ''}
<p style="font-size:${T.small}px;font-weight:600;color:${C.onDarkSoft}">${esc(tag)}</p></div>`,
  }));
}

export function sectionSlide(spec) {
  const { no, title, sub } = spec;
  need(spec.section, spec.id, 'sectionSlide needs `section`: one sentence describing the part it opens');
  need(plain(title).length <= 40, spec.id, 'section title is 40 chars max');
  return mk('section', spec, (ctx) => frame({
    id: spec.id, bg: C.ink, color: C.onDark, dark: true, ctx, notes: spec.notes, justify: 'center', gap: 20, backdrop: blueprint, flag2027: spec.flag2027,
    body: `${no ? eyebrowHtml(`Part ${no}`, C.orangeBright) : ''}<h2 style="font-family:${F.display};font-size:${T.display}px;font-weight:600;line-height:1.08;color:${C.onDark}">${rich(title)}</h2>
${sub ? `<p style="font-size:${T.lead}px;line-height:1.3;color:${C.onDarkSoft}">${rich(sub, C.blueBright)}</p>` : ''}`,
  }));
}

export function statement(spec) {
  const { text, sub, tone = 'accent' } = spec;
  const bg = { accent: C.orange, ink: C.ink, blue: C.blue }[tone];
  need(bg, spec.id, 'tone must be accent, ink or blue');
  need(estLines(text, 1560, T.statement, 'display') <= 4, spec.id, 'statement text runs over 4 lines; shorten it');
  const soft = tone === 'ink' ? C.onDarkSoft : '#FFF1E2';
  if (sub) need(estLines(sub, 1560, T.lead) <= 3, spec.id, 'statement sub runs over 3 lines');
  return mk('statement', spec, (ctx) => frame({
    id: spec.id, bg, color: C.onDark, dark: true, ctx, notes: spec.notes, justify: 'center', gap: 36, flag2027: spec.flag2027,
    body: `<h2 style="font-family:${F.display};font-size:${T.statement}px;font-weight:600;line-height:1.16;color:#FFFBF5">${rich(text, tone === 'ink' ? C.orangeBright : '#FFE7C7')}</h2>
${sub ? `<p style="font-size:${T.lead}px;line-height:1.35;color:${soft}">${rich(sub, tone === 'ink' ? C.blueBright : '#FFE7C7')}</p>` : ''}`,
  }));
}

// Content slides ------------------------------------------------------------------------------
export function lead(spec) {
  const { eyebrow, title, text, points = [] } = spec;
  need(estLines(text, G.contentW, T.lead) * T.lead * 1.35 + points.length * 70 <= G.bodyH, spec.id, 'lead text and points overflow');
  return mk('lead', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px">
<p style="font-size:${T.lead}px;line-height:1.35;color:${C.text}">${rich(text)}</p>
${points.map((p) => `<p style="font-size:${T.body}px;line-height:1.35;color:${C.soft};border-left:6px solid ${C.orange};padding:4px 0 4px 24px">${rich(p)}</p>`).join('\n')}</div>`,
  }));
}

export function points(spec) {
  const { eyebrow, title, items } = spec;
  need(items?.length >= 2 && items.length <= 6, spec.id, 'points takes 2 to 6 items');
  const fs = items.length > 4 ? 28 : T.body;
  const h = items.reduce((a, it) => a + estH(it, G.contentW - 60, fs, 1.35) + 22, 0);
  need(h <= G.bodyH, spec.id, `points overflow (${Math.round(h)}px of ${G.bodyH}); cut words or split the slide`);
  return mk('points', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
${items.map((it) => `<div style="display:flex;flex-direction:row;gap:28px;align-items:flex-start"><div style="flex:none;width:18px;height:18px;background:${C.orange};border-radius:3px;transform:translateY(12px)"></div><p style="flex:1;font-size:${fs}px;line-height:1.35;color:${C.text}">${rich(it)}</p></div>`).join('\n')}</div>`,
  }));
}

export function cards(spec) {
  const { eyebrow, title, intro, items } = spec;
  const n = items?.length;
  need(n >= 2 && n <= 6, spec.id, 'cards takes 2 to 6 items');
  const cols = n === 4 ? 2 : n >= 5 ? 3 : n;
  const rows = Math.ceil(n / cols);
  const cardW = (G.contentW - (cols - 1) * 24) / cols;
  const areaH = G.bodyH - (intro ? estH(intro, G.contentW, T.body, 1.35) + G.gap : 0);
  const cardH = (areaH - (rows - 1) * 24) / rows;
  items.forEach((it, i) => {
    need(it.title && it.text, spec.id, `card ${i + 1} needs title and text`);
    if (it.icon) need(ICONS.includes(it.icon), spec.id, `unknown icon "${it.icon}"; choose from: ${ICONS.join(' ')}`);
    const inner = cardW - 64;
    checkWords(spec.id, it.title, inner, 34); checkWords(spec.id, it.text, inner, 28);
    const h = (it.icon ? 66 : 0) + estH(it.title, inner, 34, 1.2) + 14 + estH(it.text, inner, 28, 1.35) + 56;
    need(h <= cardH, spec.id, `card "${it.title}" needs ~${Math.round(h)}px, has ${Math.round(cardH)}; cut words`);
  });
  return mk('cards', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}${intro ? `<p style="font-size:${T.body}px;line-height:1.35;color:${C.soft}">${rich(intro)}</p>` : ''}
<div style="flex:1;display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px">
${items.map((it) => `<div style="display:flex;flex-direction:column;gap:14px;background:${C.card};padding:28px 32px;border:1px solid ${C.line};border-top:6px solid ${C.orange};border-radius:8px">
${it.icon ? `<x-icon name="${it.icon}" style="color:${C.orange};width:52px;height:52px"></x-icon>` : ''}<h3 style="font-family:${F.display};font-size:34px;font-weight:600;line-height:1.2;color:${C.ink}">${rich(it.title)}</h3>
<p style="font-size:28px;line-height:1.35;color:${C.soft}">${rich(it.text)}</p></div>`).join('\n')}</div>`,
  }));
}

function qrBlock(q, target, id) {
  need(q.url && /^https?:\/\//.test(q.url), id, 'QR needs a full url');
  need(q.label, id, 'QR needs a label');
  const { svg } = qrSvg(q.url, target, q.label);
  return `<div data-qr="${esc(q.url)}" style="display:flex;flex-direction:column;align-items:center;gap:10px">${svg}</div>`;
}
const shortUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export function steps(spec) {
  const { eyebrow, title, items, qr } = spec;
  need(items?.length >= 2 && items.length <= 6, spec.id, 'steps takes 2 to 6 items');
  const w = (qr ? G.contentW - 460 - 40 : G.contentW) - 92;
  const fs = 26;
  const h = items.reduce((a, it) => a + Math.max(68, estH(it.title, w, 30, 1.25) + (it.text ? estH(it.text, w, fs, 1.35) + 4 : 0)) + 14, 0);
  need(h <= G.bodyH, spec.id, `steps overflow (${Math.round(h)}px of ${G.bodyH}); cut words or split the slide`);
  const list = `<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
${items.map((it, i) => `<div style="display:flex;flex-direction:row;gap:28px;align-items:flex-start"><p style="flex:none;width:64px;height:64px;line-height:64px;text-align:center;font-family:${F.display};font-size:32px;font-weight:600;background:${C.ink};color:${C.onDark};border-radius:32px">${i + 1}</p><div style="flex:1;display:flex;flex-direction:column;gap:4px"><p style="font-size:30px;font-weight:700;line-height:1.25;color:${C.ink}">${rich(it.title)}</p>${it.text ? `<p style="font-size:${fs}px;line-height:1.35;color:${C.soft}">${rich(it.text)}</p>` : ''}</div></div>`).join('\n')}</div>`;
  const side = qr ? `<div style="flex:none;width:460px;display:flex;flex-direction:column;align-items:center;gap:12px;justify-content:center">${qrBlock(qr, 420, spec.id)}<p style="font-size:${T.small}px;font-weight:700;text-align:center;color:${C.ink}">${rich(qr.label)}</p><p style="font-size:${T.small}px;text-align:center;line-height:1.25;color:${C.soft}"><a href="${esc(qr.url)}">${esc(qr.short || 'Open the official docs')}</a></p></div>` : '';
  return mk('steps', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<div style="flex:1;display:flex;flex-direction:row;gap:40px">${list}${side}</div>`,
  }));
}

// Code ----------------------------------------------------------------------------------------
function loadCode(spec) {
  if (spec.src) {
    const text = readFileSync(resolve(spec.src.file), 'utf8').split('\n');
    const open = text.findIndex((l) => l.trim() === `// #region ${spec.src.region}`);
    need(open >= 0, spec.id, `no "// #region ${spec.src.region}" in ${spec.src.file}`);
    const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
    need(close > open, spec.id, `region ${spec.src.region} has no // #endregion`);
    const body = text.slice(open + 1, close).filter((l) => !/^\s*\/\/ #(end)?region/.test(l));
    const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return body.map((l) => l.slice(ind));
  }
  need(typeof spec.code === 'string', spec.id, 'give code (string) or src: {file, region}');
  return spec.code.replace(/^\n+|\n+$/g, '').split('\n');
}
function pane(spec, lines, { width, fs, maxLines, marks = {} }) {
  const { file, lang = 'java', highlight = [] } = spec;
  const lh = Math.round(fs * 1.42);
  const gutter = Object.keys(marks).length ? 2 : 0;
  const maxChars = Math.floor((width - 72 - 32) / (fs * 0.6)) - gutter;
  need(lines.length <= maxLines, spec.id, `code has ${lines.length} lines; ${maxLines} max here. Trim it or split across slides`);
  lines.forEach((l, i) => need(l.length <= maxChars, spec.id, `code line ${i + 1} is ${l.length} chars; ${maxChars} max at this size: "${l}"`));
  const rows = lines.map((l, i) => {
    const n = i + 1, m = marks[n];
    const g = gutter ? (m ? `<span style="color:${C.orangeBright}"><b>${m}</b></span> ` : '  ') : '';
    const hl = highlight.includes(n) || m;
    return `<p style="font-family:${F.mono};font-size:${fs}px;line-height:${lh}px;white-space:nowrap;color:${C.code.fg};padding:0 16px${hl ? `;background:${C.code.hl}` : ''}">${g}${l.length ? highlightLine(l, lang) : ' '}</p>`;
  }).join('');
  return `<div style="flex:1;display:flex;flex-direction:column;gap:10px;background:${C.ink};padding:22px 20px;border-radius:10px;overflow:hidden">${file ? `<p style="font-family:${F.mono};font-size:${T.small}px;color:${C.onDarkSoft};padding:0 16px 4px">${esc(file)}</p>` : ''}<div style="display:flex;flex-direction:column">${rows}</div></div>`;
}
export function code(spec) {
  const lines = loadCode(spec);
  const hasCap = !!spec.caption;
  if (hasCap) need(estLines(spec.caption, G.contentW, 28) <= 2, spec.id, 'caption is 2 lines max');
  const maxLines = hasCap ? 13 : 15;
  return mk('code', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, spec.eyebrow, spec.title)}${pane(spec, lines, { width: G.contentW, fs: T.code, maxLines })}${hasCap ? `<p style="font-size:28px;line-height:1.3;color:${C.soft}">${rich(spec.caption)}</p>` : ''}`,
  }));
}
function callouts(id, items, w, totalH) {
  need(items?.length >= 1 && items.length <= 4, id, 'callouts takes 1 to 4 items');
  const h = items.reduce((a, c) => a + estH(c.title, w - 56, 28, 1.2) + estH(c.text, w - 56, 26, 1.32) + 44, 0);
  need(h <= totalH, id, `callouts overflow (~${Math.round(h)}px of ${totalH}); cut words`);
  return items.map((c, i) => `<div style="display:flex;flex-direction:row;gap:16px;align-items:flex-start"><p style="flex:none;width:40px;height:40px;line-height:40px;text-align:center;font-size:24px;font-weight:700;background:${C.orange};color:#FFFBF5;border-radius:20px">${c.mark || i + 1}</p><div style="flex:1;display:flex;flex-direction:column;gap:4px"><p style="font-size:28px;font-weight:700;line-height:1.2;color:${C.ink}">${rich(c.title)}</p><p style="font-size:26px;line-height:1.32;color:${C.soft}">${rich(c.text)}</p></div></div>`).join('\n');
}
export function codeNotes(spec) {
  const lines = loadCode(spec);
  const marks = {};
  spec.callouts?.forEach((c, i) => { (Array.isArray(c.line) ? c.line : [c.line]).forEach((n) => { need(n >= 1 && n <= lines.length, spec.id, `callout ${i + 1} points at line ${n}, outside the code`); marks[n] = String(i + 1); }); });
  return mk('codeNotes', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, spec.eyebrow, spec.title)}<div style="flex:1;display:flex;flex-direction:row;gap:${G.splitGap}px">
<div style="flex:none;width:${G.splitLeft}px;display:flex;flex-direction:column">${pane(spec, lines, { width: G.splitLeft, fs: T.codeDense, maxLines: 16, marks })}</div>
<div style="flex:none;width:${G.splitRight}px;display:flex;flex-direction:column;justify-content:space-evenly">${callouts(spec.id, spec.callouts, G.splitRight, G.bodyH)}</div></div>`,
  }));
}

export function compare(spec) {
  const { eyebrow, title, left, right } = spec;
  const colW = (G.contentW - 32) / 2;
  const side = (s, tone) => {
    need(s?.label, spec.id, 'compare side needs a label');
    const band = tone === 'good' ? C.blue : tone === 'bad' ? C.orange : C.ink;
    let inner;
    if (s.code !== undefined) {
      const ln = s.code.replace(/^\n+|\n+$/g, '').split('\n');
      inner = pane({ id: spec.id, lang: s.lang, highlight: s.highlight }, ln, { width: colW, fs: T.codeDense, maxLines: 13 });
    } else {
      need(s.items?.length, spec.id, 'compare side needs items or code');
      const h = s.items.reduce((a, it) => a + estH(it, colW - 112, 28, 1.32) + 16, 0);
      need(h <= G.bodyH - 90, spec.id, `compare side "${s.label}" overflows`);
      inner = `<div style="flex:1;display:flex;flex-direction:column;gap:16px;justify-content:space-evenly;background:${C.card};padding:24px 32px;border:1px solid ${C.line}">${s.items.map((it) => `<p style="font-size:28px;line-height:1.32;color:${C.text}">${rich(it)}</p>`).join('\n')}</div>`;
    }
    return `<div style="flex:1;display:flex;flex-direction:column"><p style="font-size:28px;font-weight:700;background:${band};color:#FFFBF5;padding:10px 28px;border-radius:8px 8px 0 0">${rich(s.label, '#FFE7C7')}</p>${inner}</div>`;
  };
  return mk('compare', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<div style="flex:1;display:flex;flex-direction:row;gap:32px">${side(left, left.tone || 'neutral')}${side(right, right.tone || 'neutral')}</div>`,
  }));
}

export function table(spec) {
  const { eyebrow, title, columns, rows, widths, caption, fontSize = 26 } = spec;
  need(columns?.length >= 2 && columns.length <= 6, spec.id, 'table takes 2 to 6 columns');
  need(rows?.length >= 1, spec.id, 'table needs rows');
  const ws = widths || columns.map(() => Math.floor(100 / columns.length));
  need(ws.length === columns.length && ws.reduce((a, b) => a + b, 0) === 100, spec.id, 'widths must have one per column and sum to 100');
  let h = 2.1 * fontSize;
  rows.forEach((r, ri) => {
    need(r.length === columns.length, spec.id, `row ${ri + 1} has ${r.length} cells, needs ${columns.length}`);
    let max = 1;
    r.forEach((cell, ci) => {
      const w = (G.contentW * ws[ci]) / 100 - fontSize * 1.2;
      checkWords(spec.id, cell, w, fontSize);
      max = Math.max(max, estLines(cell, w, fontSize));
    });
    h += max * fontSize * 1.34 + fontSize * 0.7;
  });
  const avail = G.bodyH - (caption ? 70 : 0);
  need(h <= avail, spec.id, `table needs ~${Math.round(h)}px of ${avail}; cut rows or words, or split it`);
  const cell = (tag, t, i, first) => `<${tag} style="${first ? `width:${ws[i]}%;` : ''}">${esc(smart(plain(t)))}</${tag}>`;
  return mk('table', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<table style="font-family:${F.body};font-size:${fontSize}px;color:${C.text};background:${C.card};border:1px solid ${C.line}">
<tr style="background:${C.ink}">${columns.map((c, i) => `<th style="width:${ws[i]}%;color:${C.onDark}">${esc(smart(c))}</th>`).join('')}</tr>
${rows.map((r, ri) => `<tr${ri % 2 ? ` style="background:${C.paper2}"` : ''}>${r.map((c) => `<td>${esc(smart(plain(c)))}</td>`).join('')}</tr>`).join('\n')}
</table>${caption ? `<p style="font-size:${T.small}px;line-height:1.3;color:${C.soft}">${rich(caption)}</p>` : ''}`,
  }));
}

// Recurring teaching slides: same look in every deck so kids learn to spot them ---------------------
export function gotcha(spec) {
  const { title, symptom, cause, fix, code: snippet } = spec;
  need(symptom && cause && fix, spec.id, 'gotcha needs symptom, cause and fix');
  const rows = [['What you see', symptom], ['Why it happens', cause], ['The fix', fix]];
  const w = G.contentW - 300;
  const h = rows.reduce((a, [, t]) => a + estH(t, w, T.body, 1.35) + 30, 0);
  need(h <= G.bodyH - (snippet ? 240 : 40), spec.id, `gotcha overflows (~${Math.round(h)}px)`);
  return mk('gotcha', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    backdrop: `<div style="position:absolute;left:0;top:0;width:1920px;height:30px;background:${HAZARD}"></div>`,
    body: `${header(spec.id, 'Common mistake', title)}<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;gap:12px">
${rows.map(([k, t], i) => `<div style="display:flex;flex-direction:row;gap:28px;align-items:flex-start;${i < 2 ? `border-bottom:1px solid ${C.line};` : ''}padding:0 0 14px"><p style="flex:none;width:270px;font-size:26px;font-weight:700;line-height:1.5;color:${i === 2 ? C.blue : C.orange}">${k}</p><p style="flex:1;font-size:${T.body}px;line-height:1.35;color:${C.text}">${rich(t)}</p></div>`).join('\n')}
${snippet ? pane({ id: spec.id }, snippet.replace(/^\n+|\n+$/g, '').split('\n'), { width: G.contentW, fs: T.codeDense, maxLines: 4 }) : ''}</div>`,
  }));
}

export function practice(spec) {
  const { title, rule, why, code: snippet } = spec;
  need(rule && why, spec.id, 'practice needs rule and why');
  need(estLines(rule, G.contentW - 80, T.lead) <= 3, spec.id, 'practice rule is 3 lines max');
  need(estLines(why, G.contentW, T.body) <= (snippet ? 3 : 7), spec.id, 'practice why is too long');
  return mk('practice', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, 'Best practice', title)}<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;gap:20px">
<p style="font-size:${T.lead}px;font-weight:600;line-height:1.3;color:${C.ink};background:${C.card};border-left:10px solid ${C.blue};padding:26px 36px">${rich(rule)}</p>
<p style="font-size:${T.body}px;line-height:1.35;color:${C.soft}">${rich(why)}</p>
${snippet ? pane({ id: spec.id }, snippet.replace(/^\n+|\n+$/g, '').split('\n'), { width: G.contentW, fs: T.codeDense, maxLines: 7 }) : ''}</div>`,
  }));
}

export function exercise(spec) {
  const { title, minutes, tasks, done } = spec;
  need(tasks?.length >= 1 && tasks.length <= 5, spec.id, 'exercise takes 1 to 5 tasks');
  need(minutes && done, spec.id, 'exercise needs minutes and done');
  const h = tasks.reduce((a, t) => a + estH(t, G.contentW - 80, T.body, 1.35) + 14, 0) + 120;
  need(h <= G.bodyH, spec.id, `exercise overflows (~${Math.round(h)}px)`);
  return mk('exercise', spec, (ctx) => frame({
    id: spec.id, bg: C.blue, color: C.onDark, dark: true, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `<div style="display:flex;flex-direction:row;justify-content:space-between;align-items:flex-end"><div style="display:flex;flex-direction:column;gap:6px">${eyebrowHtml('Exercise', '#FFE7C7')}<h2 style="font-family:${F.display};font-size:${T.title}px;font-weight:600;line-height:1.1;color:#FFFBF5">${rich(title, '#FFE7C7')}</h2></div><p style="flex:none;font-size:${T.lead}px;font-weight:700;background:${C.ink};color:#FFFBF5;padding:10px 28px;border-radius:8px">${minutes} min</p></div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
${tasks.map((t, i) => `<div style="display:flex;flex-direction:row;gap:24px;align-items:flex-start"><p style="flex:none;width:44px;font-family:${F.display};font-size:34px;font-weight:600;line-height:1.2;color:#FFE7C7">${i + 1}.</p><p style="flex:1;font-size:${T.body}px;line-height:1.35;color:#FFFBF5">${rich(t, '#FFE7C7')}</p></div>`).join('\n')}</div>
<p style="font-size:${T.body}px;font-weight:600;line-height:1.3;background:${C.ink};color:#FFFBF5;padding:18px 28px;border-radius:8px">Done when: ${rich(done, C.blueBright)}</p>`,
  }));
}

export function demo(spec) {
  const { title, show } = spec;
  need(show?.length >= 2 && show.length <= 5, spec.id, 'demo takes 2 to 5 show items');
  const h = show.reduce((a, t) => a + estH(t, G.contentW - 80, T.body, 1.35) + 14, 0);
  need(h <= G.bodyH - 60, spec.id, 'demo overflows');
  return mk('demo', spec, (ctx) => frame({
    id: spec.id, bg: C.ink, color: C.onDark, dark: true, ctx, notes: spec.notes, flag2027: spec.flag2027, backdrop: blueprint,
    body: `<div style="display:flex;flex-direction:row;gap:24px;align-items:center"><x-icon name="Play" style="color:${C.orangeBright};width:64px;height:64px"></x-icon>${header(spec.id, 'Live demo', title, true)}</div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
${show.map((t) => `<p style="font-size:${T.body}px;line-height:1.35;color:${C.onDark};border-left:6px solid ${C.orangeBright};padding:4px 0 4px 26px">${rich(t, C.blueBright)}</p>`).join('\n')}</div>`,
  }));
}

export function recap(spec) {
  const { title = 'What this deck covered', items, next } = spec;
  need(items?.length >= 2 && items.length <= 5, spec.id, 'recap takes 2 to 5 items');
  const h = items.reduce((a, t) => a + estH(t, G.contentW - 84, T.body, 1.35) + 18, 0) + (next ? 100 : 0);
  need(h <= G.bodyH, spec.id, 'recap overflows');
  return mk('recap', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, 'Recap', title)}<div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
${items.map((t) => `<div style="display:flex;flex-direction:row;gap:24px;align-items:flex-start"><x-icon name="CheckCircle" style="flex:none;color:${C.blue};width:48px;height:48px"></x-icon><p style="flex:1;font-size:${T.body}px;line-height:1.35;color:${C.text}">${rich(t)}</p></div>`).join('\n')}</div>
${next ? `<p style="font-size:28px;font-weight:600;line-height:1.3;color:${C.onDark};background:${C.ink};padding:16px 28px;border-radius:8px">Next: ${rich(next, C.blueBright)}</p>` : ''}`,
  }));
}

export function links(spec) {
  const { eyebrow = 'Reference', title = 'Official docs', intro, items } = spec;
  need(items?.length >= 1 && items.length <= 4, spec.id, 'links takes 1 to 4 QR items');
  const size = { 1: 500, 2: 460, 3: 420, 4: 360 }[items.length];
  const w = (G.contentW - (items.length - 1) * 24) / items.length;
  items.forEach((q) => { need(plain(q.label).length * 28 * 0.56 <= 2 * (w - 40), spec.id, `label "${q.label}" too long`); });
  return mk('links', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}${intro ? `<p style="font-size:${T.body}px;line-height:1.3;color:${C.soft}">${rich(intro)}</p>` : ''}
<div style="flex:1;display:flex;flex-direction:row;gap:24px;align-items:center;justify-content:center">
${items.map((q) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:12px">${qrBlock(q, size, spec.id)}<p style="font-size:28px;font-weight:700;line-height:1.2;text-align:center;color:${C.ink}">${rich(q.label)}</p><p style="font-size:${T.small}px;line-height:1.25;text-align:center;color:${C.soft}"><a href="${esc(q.url)}">${esc(q.short || shortUrl(q.url).split('/')[0])}</a></p></div>`).join('\n')}</div>`,
  }));
}

export function change2027(spec) {
  const { title = 'What changes for 2027', items, note } = spec;
  need(items?.length >= 2 && items.length <= 6, spec.id, 'change2027 takes 2 to 6 items');
  return table({
    id: spec.id, eyebrow: 'Next season', title, notes: spec.notes,
    columns: ['In 2026 (what we teach)', 'Changing for 2027'], widths: [50, 50],
    rows: items.map((i) => [i.now, i.next]), caption: note,
  });
}

// Diagrams and charts -------------------------------------------------------------------------
const TONES = {
  ink: { bg: C.ink, fg: C.onDark, sub: C.onDarkSoft, border: C.ink },
  paper: { bg: C.card, fg: C.ink, sub: C.soft, border: C.line },
  accent: { bg: C.orange, fg: '#FFFBF5', sub: '#FFE7C7', border: C.orange },
  blue: { bg: C.blue, fg: '#FFFBF5', sub: '#D6EAFF', border: C.blue },
  ghost: { bg: 'transparent', fg: C.ink, sub: C.soft, border: C.inkLine },
};
const sidePoint = (n, side) => ({
  l: [n.x, n.y + n.h / 2], r: [n.x + n.w, n.y + n.h / 2], t: [n.x + n.w / 2, n.y], b: [n.x + n.w / 2, n.y + n.h],
}[side]);

// Coordinates are in slide px. Usable area: x 128..1792, y 232..916.
export function diagram(spec) {
  const { eyebrow, title, nodes, edges = [], caption } = spec;
  need(nodes?.length >= 2, spec.id, 'diagram needs nodes');
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  nodes.forEach((n) => {
    need(n.x >= 128 && n.x + n.w <= 1792 && n.y >= 232 && n.y + n.h <= (caption ? 840 : 916), spec.id, `node ${n.id} is outside the body area`);
    const fs = n.size || 28;
    const h = estH(n.label, n.w - 32, fs, 1.2) + (n.sub ? estH(n.sub, n.w - 32, 24, 1.2) : 0) + 16;
    need(h <= n.h, spec.id, `node ${n.id} text needs ~${Math.round(h)}px, box is ${n.h}px`);
    checkWords(spec.id, n.label, n.w - 32, fs);
  });
  const pinned = nodes.length + edges.length + edges.filter((e) => e.label).length;
  need(pinned <= 24, spec.id, `diagram has ${pinned} pinned parts; 24 max`);
  return mk('diagram', spec, (ctx) => {
    const nodeHtml = nodes.map((n) => {
      const t = TONES[n.tone || 'paper'], fs = n.size || 28, round = n.round ? `border-radius:${Math.min(n.w, n.h) / 2}px` : 'border-radius:8px';
      return `<div style="position:absolute;left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;background:${t.bg};border:2px solid ${t.border};${round};padding:6px 14px"><p style="font-size:${fs}px;font-weight:700;line-height:1.2;text-align:center;color:${t.fg}">${rich(n.label, t.sub)}</p>${n.sub ? `<p style="font-size:24px;line-height:1.2;text-align:center;color:${t.sub}">${rich(n.sub, t.sub)}</p>` : ''}</div>`;
    }).join('\n');
    const edgeHtml = edges.map((e) => {
      const a = byId[e.from], b = byId[e.to];
      need(a && b, spec.id, `edge ${e.from} to ${e.to} names an unknown node`);
      const [x1, y1] = sidePoint(a, e.fromSide || 'r'), [x2, y2] = sidePoint(b, e.toSide || 'l');
      const dash = e.dashed ? ';border-style:dashed' : '';
      let h = `<x-connector x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" head="end" route="${e.route || 'straight'}" style="color:${e.color || C.ink};border-width:3px${dash}"></x-connector>`;
      if (e.label) {
        const lx = e.lx ?? (x1 + x2) / 2 - 120, ly = e.ly ?? (y1 + y2) / 2 - 42;
        h += `<p style="position:absolute;left:${lx}px;top:${ly}px;width:${e.lw || 240}px;font-size:24px;line-height:1.2;text-align:center;color:${C.soft}">${rich(e.label)}</p>`;
      }
      return h;
    }).join('\n');
    return frame({
      id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
      body: `${header(spec.id, eyebrow, title)}${caption ? `<p style="position:absolute;left:128px;top:852px;width:1664px;font-size:28px;line-height:1.3;color:${C.soft}">${rich(caption)}</p>` : ''}${edgeHtml}\n${nodeHtml}`,
    });
  });
}

const SERIES = { orange: C.orange, blue: C.blue, green: C.green, ink: C.ink };
export function plot(spec) {
  const { eyebrow, title, series, refs = [], xLabel, yLabel, xDomain, yDomain, xTicks, yTicks, callouts: cs } = spec;
  const W = cs ? G.splitLeft : G.contentW, H = 620, L = 96, R = 30, Tp = 44, B = 82;
  need(series?.length >= 1 && series.length <= 3, spec.id, 'plot takes 1 to 3 series');
  need(xLabel && yLabel && xDomain && yDomain && xTicks && yTicks, spec.id, 'plot needs xLabel, yLabel, xDomain, yDomain, xTicks, yTicks');
  const sx = (x) => L + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - L - R);
  const sy = (y) => H - B - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * (H - Tp - B);
  const clip = (y) => Math.max(yDomain[0], Math.min(yDomain[1], y));
  series.forEach((s) => need(SERIES[s.color], spec.id, 'series color must be orange, blue, green or ink'));
  let svg = `<svg aria-label="${esc(spec.alt || title)}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px">`;
  yTicks.forEach((t) => { svg += `<line x1="${L}" x2="${W - R}" y1="${sy(t).toFixed(1)}" y2="${sy(t).toFixed(1)}" stroke="${C.line}" stroke-width="1"/>`; });
  svg += `<line x1="${L}" x2="${L}" y1="${Tp}" y2="${H - B}" stroke="${C.soft}" stroke-width="2"/><line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="${C.soft}" stroke-width="2"/>`;
  refs.forEach((r) => { svg += `<line x1="${L}" x2="${W - R}" y1="${sy(r.y).toFixed(1)}" y2="${sy(r.y).toFixed(1)}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="10 8"/>`; });
  series.forEach((s) => {
    const d = s.points.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(clip(y)).toFixed(1)}`).join('');
    svg += `<path d="${d}" fill="none" stroke="${SERIES[s.color]}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="16 10"' : ''}/>`;
  });
  svg += '</svg>';
  const label = (x, y, w, t, align = 'center', extra = '') => `<p style="position:absolute;left:${Math.round(x)}px;top:${Math.round(y)}px;width:${w}px;font-size:24px;line-height:1.2;text-align:${align};color:${C.soft}${extra}">${t}</p>`;
  const labels = [
    ...xTicks.map((t) => label(sx(t) - 50, H - B + 8, 100, esc(String(t)))),
    ...yTicks.map((t) => label(0, sy(t) - 15, L - 12, esc(String(t)), 'right')),
    label(L, 0, 600, esc(smart(yLabel)), 'left', ';font-weight:600'),
    label(L, H - 32, W - L - R, esc(smart(xLabel)), 'center', ';font-weight:600'),
    ...refs.filter((r) => r.label).map((r) => label(r.lx ?? W - R - 310, sy(r.y) - 34, 300, esc(smart(r.label)), 'right', `;color:${C.ink}`)),
    ...series.filter((s) => s.tag).map((s) => label(sx(s.tag.x) + (s.tag.dx || 0), sy(s.tag.y) + (s.tag.dy || 0), s.tag.w || 240, esc(smart(s.name)), s.tag.align || 'left', `;color:${C.text};font-weight:600`)),
  ];
  need(labels.length <= 24, spec.id, 'plot has too many labels');
  const legend = `<div style="display:flex;flex-direction:row;gap:32px;align-items:center;height:36px">${series.map((s) => `<div style="display:flex;flex-direction:row;gap:12px;align-items:center"><div style="flex:none;width:36px;height:5px;background:${SERIES[s.color]}"></div><p style="font-size:24px;color:${C.text}">${esc(smart(s.name))}${s.dash ? ' (dashed)' : ''}</p></div>`).join('')}</div>`;
  const chart = `<div style="flex:none;width:${W}px;display:flex;flex-direction:column;gap:8px">${legend}<div style="position:relative;width:${W}px;height:${H}px">${svg}${labels.join('')}</div></div>`;
  return mk('plot', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<div style="flex:1;display:flex;flex-direction:row;gap:${G.splitGap}px">${chart}${cs ? `<div style="flex:none;width:${G.splitRight}px;display:flex;flex-direction:column;justify-content:space-evenly">${callouts(spec.id, cs, G.splitRight, G.bodyH)}</div>` : ''}</div>`,
  }));
}

// A self-running animation. Viewers cannot click into it, and PDF/PPTX exports flatten it.
export function embed(spec) {
  const { eyebrow, title, html, height = 650 } = spec;
  need(Buffer.byteLength(html) <= 16 * 1024, spec.id, `embed is ${Buffer.byteLength(html)} bytes; 16 KB max`);
  need(height <= 676, spec.id, 'embed height is 676 max');
  return mk('embed', spec, (ctx) => frame({
    id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027,
    body: `${header(spec.id, eyebrow, title)}<x-embed style="position:absolute;left:128px;top:${G.bodyTop}px;width:1664px;height:${height}px">${html}</x-embed>`,
  }));
}

// Escape hatch: hand-written slide body in the format's subset. Use only when no layout fits.
export function raw(spec) {
  need(spec.body, spec.id, 'raw needs body');
  return mk('raw', spec, (ctx) => frame({ id: spec.id, ctx, notes: spec.notes, flag2027: spec.flag2027, body: `${header(spec.id, spec.eyebrow, spec.title)}${spec.body}` }));
}
