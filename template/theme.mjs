// Design tokens. One palette and one type scale for every deck: "pit crew blueprint".
export const C = {
  ink: '#12202E', ink2: '#1C3145', inkLine: '#31495F',
  paper: '#F7F5EF', paper2: '#ECE8DD', card: '#FFFDF8', line: '#D9D3C4',
  text: '#1A2733', soft: '#45545F',
  onDark: '#F7F5EF', onDarkSoft: '#B9C7D3',
  orange: '#B8430A', orangeBright: '#FF9A52',
  blue: '#0B5CAD', blueBright: '#8CCBFF',
  green: '#2F8F5B',
  amber: '#F5B301',
  // Syntax colours, all >= 4.5:1 on ink.
  code: { fg: '#E6EDF3', kw: '#FF9A52', type: '#8CCBFF', str: '#A8DDA8', num: '#FFD77A', com: '#93A9BB', ann: '#CDB2FF', hl: '#2A4560' },
};

export const F = {
  display: "'Oswald', 'Trebuchet MS', sans-serif",
  body: "'Public Sans', Arial, sans-serif",
  mono: "'Roboto Mono', 'Courier New', monospace",
};

// Type scale (px). Nothing on a slide is under 24.
export const T = { display: 120, statement: 84, title: 64, lead: 40, body: 30, small: 24, code: 28, codeDense: 26 };

// Canvas geometry (px).
export const G = {
  W: 1920, H: 1080, pad: 128, top: 88, bottom: 160,
  contentW: 1664,
  // y where the body starts under the eyebrow + title header, and the height left for it.
  bodyTop: 232, bodyH: 684,
  gap: 28,
  splitLeft: 1090, splitRight: 534, splitGap: 40,
};

export const FACES = {
  oswald: { family: 'Oswald', href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400..700&display=swap' },
  'public-sans': { family: 'Public Sans', href: 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..700&display=swap' },
  'roboto-mono': { family: 'Roboto Mono', href: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400..700&display=swap' },
};

export const ICONS = 'Activity Book Chart Chat Check CheckCircle Clock Cloud Code Database Globe GraduationCap Home Key Lightbulb Lightning Link Lock PaperPlane Play Search Settings Star ThumbsUp Tool Trust Users Verified Warning Wrench'.split(' ');
