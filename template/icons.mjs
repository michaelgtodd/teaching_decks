// SVG artwork for <x-icon name="…">, used by export.mjs to render decks outside Claude.
// 24×24 stroke icons, drawn in currentColor. Only the names the decks use are filled in;
// the rest of the type's icon set falls back to a plain circle.
const P = {
  Activity: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
  Chart: '<path d="M3 3v18h18"/><path d="M8 17v-5"/><path d="M13 17V8"/><path d="M18 17v-9"/>',
  Check: '<path d="M4 12.5l5 5L20 6.5"/>',
  CheckCircle: '<circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/>',
  Clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6.5V12l3.5 2"/>',
  Code: '<path d="M8 6l-6 6 6 6"/><path d="M16 6l6 6-6 6"/>',
  Database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  Lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5C7 13.3 6 11.5 6 9.5a6 6 0 0 1 12 0c0 2-1 3.8-2.5 5-.6.5-1 1.3-1 2V17h-5v-.5c0-.7-.4-1.5-1-2z"/>',
  Lightning: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  Link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.5 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.7-1.6"/>',
  PaperPlane: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  Play: '<path d="M7 4.5v15l12-7.5z"/>',
  Settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  Users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M16 4.2a4 4 0 0 1 0 7.6"/><path d="M19 14.3A6 6 0 0 1 22 20v1"/>',
  Warning: '<path d="M12 3L2 21h20z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
  Wrench: '<path d="M14.7 6.3a4 4 0 0 0 5.2 5.2L21 10.4a6 6 0 0 1-7.9 4.7L6.5 21.7a2.1 2.1 0 0 1-3-3l6.6-6.6A6 6 0 0 1 14.8 4l-1.1 1.1z"/>',
};

export function iconSvg(name) {
  const body = P[name] ?? '<circle cx="12" cy="12" r="9"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
