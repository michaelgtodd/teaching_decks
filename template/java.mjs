// Tiny syntax highlighter. Output is inline <span style="color"> only (the slide format has no classes).
// Same-colour neighbours are merged so a code block stays well under the 200-elements-per-slide limit.
import { C } from './theme.mjs';

const KW = new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws transient try var void volatile while record true false null'.split(' '));
const NBSP = ' ';
export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKEN = /(\/\/.*$)|(\/\*.*?(?:\*\/|$))|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)')|(@[A-Za-z_]\w*)|(\b\d[\d_]*(?:\.\d+)?[fFdDlL]?\b)|(\b[A-Za-z_]\w*\b)/g;
const HASH = /(#.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)/g;

function tokens(line, lang) {
  if (lang === 'text') return [[C.code.fg, line]];
  const out = []; let last = 0;
  const push = (color, t) => { if (t) out.push([color, t]); };
  const re = lang === 'shell' ? HASH : TOKEN;
  re.lastIndex = 0;
  for (const m of line.matchAll(re)) {
    push(C.code.fg, line.slice(last, m.index));
    if (lang === 'shell') {
      push(m[1] ? C.code.com : m[2] || m[3] ? C.code.str : C.code.num, m[0]);
    } else if (m[1] || m[2]) push(C.code.com, m[0]);
    else if (m[3] || m[4]) push(C.code.str, m[0]);
    else if (m[5]) push(C.code.ann, m[0]);
    else if (m[6]) push(C.code.num, m[0]);
    else {
      const w = m[7];
      if (lang === 'json') push(C.code.fg, w);
      else if (KW.has(w)) push(C.code.kw, w);
      else if (/^[A-Z][a-z0-9]/.test(w)) push(C.code.type, w);
      else push(C.code.fg, w);
    }
    last = m.index + m[0].length;
  }
  push(C.code.fg, line.slice(last));
  return out;
}

export function highlightLine(line, lang = 'java') {
  const lead = line.match(/^ */)[0].length;
  const body = line.slice(lead);
  const runs = [];
  for (const [color, t] of tokens(body, lang)) {
    const blank = /^\s*$/.test(t);
    const tail = runs[runs.length - 1];
    if (tail && (tail[0] === color || blank)) tail[1] += t;
    else runs.push([color, t]);
  }
  const fixSpaces = (s) => s.replace(/ {2,}/g, (m) => NBSP.repeat(m.length));
  const html = runs.map(([color, t]) => (color === C.code.fg ? esc(fixSpaces(t)) : `<span style="color:${color}">${esc(fixSpaces(t))}</span>`)).join('');
  return NBSP.repeat(lead) + html;
}
