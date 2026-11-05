// Deck 6: control theory and a PID + feedforward arm.
// Every curve comes from simulate() below, and every number in a callout is read from its result.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as L from '../../template/layouts.mjs';

const PLAYGROUND_URL = 'https://michaelgtodd.github.io/teaching_decks/arm-playground/';

const J = 'examples/src/main/java/frc/robot/deck6';
const PLAYGROUND_FILE = 'docs/arm-playground/index.html';

// #region sim
// The block between these markers is copied unchanged into docs/arm-playground/index.html.
// NEO constants from WPILib DCMotor.getNEO() at v2026.2.1.
const NEO = { volts: 12, stallTorque: 2.6, stallAmps: 105, freeAmps: 1.8, freeRpm: 5676 };
const OHMS = NEO.volts / NEO.stallAmps;
const FREE_RAD_S = (NEO.freeRpm * Math.PI) / 30;
const MOTOR_KV = FREE_RAD_S / (NEO.volts - OHMS * NEO.freeAmps); // rad/s per volt
const MOTOR_KT = NEO.stallTorque / NEO.stallAmps; // newton metres per amp

// The example arm: a uniform bar, the same shape SingleJointedArmSim assumes.
const ARM = { gearing: 60, lengthM: 0.8, massKg: 4, gravity: 9.8, minDeg: -30, maxDeg: 110 };
const MOI = (ARM.massKg * ARM.lengthM * ARM.lengthM) / 3; // SingleJointedArmSim.estimateMOI
const GRAVITY_TORQUE = ARM.massKg * ARM.gravity * (ARM.lengthM / 2); // newton metres when flat

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// Angular acceleration of the arm: motor torque through the gearbox, minus gravity, over inertia.
function armAccel(theta, omega, volts) {
  const amps = (volts - (ARM.gearing * omega) / MOTOR_KV) / OHMS;
  return (amps * MOTOR_KT * ARM.gearing - GRAVITY_TORQUE * Math.cos(theta)) / MOI;
}

// Port of WPILib TrapezoidProfile.calculate(t, current, goal).
function trapezoid(t, current, goal, maxV, maxA) {
  const flip = current.pos > goal.pos ? -1 : 1;
  const cur = { pos: current.pos * flip, vel: current.vel * flip };
  const end = { pos: goal.pos * flip, vel: goal.vel * flip };
  if (Math.abs(cur.vel) > maxV) cur.vel = Math.sign(cur.vel) * maxV;
  const cutBegin = cur.vel / maxA;
  const cutEnd = end.vel / maxA;
  const fullDist = (cutBegin * cutBegin * maxA) / 2 + (end.pos - cur.pos) + (cutEnd * cutEnd * maxA) / 2;
  let accelTime = maxV / maxA;
  let cruiseDist = fullDist - accelTime * accelTime * maxA;
  if (cruiseDist < 0) {
    accelTime = Math.sqrt(fullDist / maxA);
    cruiseDist = 0;
  }
  const endAccel = accelTime - cutBegin;
  const endCruise = endAccel + cruiseDist / maxV;
  const endDecel = endCruise + accelTime - cutEnd;
  let out = { pos: cur.pos, vel: cur.vel };
  if (t < endAccel) {
    out.vel += t * maxA;
    out.pos += (cur.vel + (t * maxA) / 2) * t;
  } else if (t < endCruise) {
    out.vel = maxV;
    out.pos += (cur.vel + (endAccel * maxA) / 2) * endAccel + maxV * (t - endAccel);
  } else if (t <= endDecel) {
    const left = endDecel - t;
    out.vel = end.vel + left * maxA;
    out.pos = end.pos - (end.vel + (left * maxA) / 2) * left;
  } else {
    out = { pos: end.pos, vel: end.vel };
  }
  return { pos: out.pos * flip, vel: out.vel * flip };
}

// One run of the arm. The controller is WPILib's: PIDController.calculate plus ArmFeedforward.
// The motor gets one voltage per loop, and the encoder reading is sensorLoops loops old.
function simulate({
  kP = 0, kI = 0, kD = 0, kG = 0, kV = 0,
  startDeg = ARM.minDeg, goalDeg = 45, seconds = 3,
  profile = null, noiseDeg = null, integratorCap = 1, blockedUntil = 0,
  loopSeconds = 0.02, sensorLoops = 1,
}) {
  const stepsPerLoop = Math.max(1, Math.round(loopSeconds / 0.001));
  const h = loopSeconds / stepsPerLoop;
  const loops = Math.round(seconds / loopSeconds);
  const goal = rad(goalDeg);
  let theta = rad(startDeg);
  let omega = 0;
  let error = 0;
  let total = 0;
  let setpoint = { pos: theta, vel: 0 };
  const seen = [];
  const out = [];
  for (let k = 0; k <= loops; k++) {
    seen.push(theta);
    const noise = noiseDeg ? rad(noiseDeg[k % noiseDeg.length]) : 0;
    const measured = seen[Math.max(0, seen.length - 1 - sensorLoops)] + noise;
    if (profile) setpoint = trapezoid(loopSeconds, setpoint, { pos: goal, vel: 0 }, profile.maxV, profile.maxA);
    else setpoint = { pos: goal, vel: 0 };
    const prevError = error;
    error = setpoint.pos - measured;
    const rate = (error - prevError) / loopSeconds;
    if (kI !== 0) total = clamp(total + error * loopSeconds, -integratorCap / kI, integratorCap / kI);
    const pidVolts = kP * error + kI * total + kD * rate;
    const ffVolts = kG * Math.cos(measured) + kV * setpoint.vel;
    const volts = clamp(ffVolts + pidVolts, -NEO.volts, NEO.volts);
    const t = k * loopSeconds;
    out.push({
      t, deg: deg(theta), radS: omega, volts, ffVolts, pidVolts,
      amps: (volts - (ARM.gearing * omega) / MOTOR_KV) / OHMS,
    });
    for (let i = 0; i < stepsPerLoop; i++) {
      const a1 = armAccel(theta, omega, volts);
      const a2 = armAccel(theta + (h / 2) * omega, omega + (h / 2) * a1, volts);
      const a3 = armAccel(theta + (h / 2) * (omega + (h / 2) * a1), omega + (h / 2) * a2, volts);
      const a4 = armAccel(theta + h * (omega + (h / 2) * a2), omega + h * a3, volts);
      theta += (h / 6) * (omega + 2 * (omega + (h / 2) * a1) + 2 * (omega + (h / 2) * a2) + (omega + h * a3));
      omega += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
      if (t < blockedUntil) { theta = rad(startDeg); omega = 0; }
      if (theta <= rad(ARM.minDeg)) { theta = rad(ARM.minDeg); omega = 0; }
      if (theta >= rad(ARM.maxDeg)) { theta = rad(ARM.maxDeg); omega = 0; }
    }
  }
  return out;
}
// #endregion

// Numbers the slides quote ---------------------------------------------------------------------
const fix = (x, n = 1) => x.toFixed(n);
const must = (ok, why) => { if (!ok) throw new Error(`deck 6 story no longer matches the simulation: ${why}`); };

const tail = (run, s = 0.5) => { const end = run[run.length - 1].t; return run.filter((x) => x.t >= end - s); };
const finalDeg = (run) => { const t = tail(run); return t.reduce((a, x) => a + x.deg, 0) / t.length; };
const peakDeg = (run) => Math.max(...run.map((x) => x.deg));
const swingDeg = (run) => { const t = tail(run).map((x) => x.deg); return Math.max(...t) - Math.min(...t); };
const peak = (run, key) => Math.max(...run.map((x) => Math.abs(x[key])));
// Time after which the arm stays within band degrees of the goal.
const settle = (run, goal, band = 2) => {
  for (let i = run.length - 1; i >= 0; i--) if (Math.abs(run[i].deg - goal) > band) return i === run.length - 1 ? Infinity : run[i + 1].t;
  return 0;
};
const degrees = (run) => run.map((x) => [x.t, x.deg]);
const every = (run, n) => run.filter((_, i) => i % n === 0);

// Holding volts, found by bisection on the model rather than from the formula.
function holdVolts(angleDeg) {
  let lo = -12, hi = 12;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (armAccel(rad(angleDeg), 0, mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

const GOAL = 45;
const KG_EXACT = holdVolts(0);
const TUNED = { kP: 30, kD: 1.2, kG: 1.21, kV: 1.19 };
const PROFILE = { maxV: 2.5, maxA: 6 };
const KV_EXACT = ARM.gearing / MOTOR_KV;
must(fix(KG_EXACT, 2) === fix(TUNED.kG, 2), 'kG should round to the physics value');
must(fix(KV_EXACT, 2) === fix(TUNED.kV, 2), 'kV should round to the physics value');

// Seeded so every build draws the same noise: uniform, +/- 0.2 degrees.
const NOISE = (() => { let s = 12345; return Array.from({ length: 251 }, () => { s = (s * 1664525 + 1013904223) % 4294967296; return (s / 4294967296 - 0.5) * 0.4; }); })();

const runs = {
  p4: simulate({ kP: 4 }),
  p8: simulate({ kP: 8 }),
  p30: simulate({ kP: 30 }),
  p50: simulate({ kP: 50 }),
  pd: simulate({ kP: 30, kD: 1.2 }),
  p8g: simulate({ kP: 8, kG: TUNED.kG }),
  pdg: simulate({ kP: 30, kD: 1.2, kG: TUNED.kG }),
  pdgBack: simulate({ kP: 30, kD: 1.2, kG: -TUNED.kG }),
  tuned: simulate({ ...TUNED, profile: PROFILE }),
  tunedNoDelay: simulate({ ...TUNED, profile: PROFILE, sensorLoops: 0 }),
  quiet: simulate({ kP: 30, kG: TUNED.kG, startDeg: GOAL, seconds: 2, noiseDeg: NOISE }),
  noisy: simulate({ kP: 30, kD: 1.2, kG: TUNED.kG, startDeg: GOAL, seconds: 2, noiseDeg: NOISE }),
  capped: simulate({ kP: 30, kI: 8, kD: 1.2, kG: TUNED.kG, seconds: 6, blockedUntil: 1.5 }),
  uncapped: simulate({ kP: 30, kI: 8, kD: 1.2, kG: TUNED.kG, seconds: 6, blockedUntil: 1.5, integratorCap: 12 }),
};

const sag = { p4: GOAL - finalDeg(runs.p4), p8: GOAL - finalDeg(runs.p8), pd: GOAL - finalDeg(runs.pd), back: GOAL - finalDeg(runs.pdgBack) };
const over = { p30: peakDeg(runs.p30) - GOAL, pd: peakDeg(runs.pd) - GOAL, tuned: peakDeg(runs.tuned) - GOAL, step: peakDeg(runs.pdg) - GOAL };
const hold8 = TUNED.kG * Math.cos(rad(finalDeg(runs.p8)));
const voltSpread = (run) => { const v = run.slice(5).map((x) => x.volts); return Math.max(...v) - Math.min(...v); };
const armSpread = (run) => { const v = run.slice(5).map((x) => x.deg); return Math.max(...v) - Math.min(...v); };
const sum = (run, key) => run.reduce((a, x) => a + Math.abs(x[key]), 0);
const ffShare = sum(runs.tuned, 'ffVolts') / (sum(runs.tuned, 'ffVolts') + sum(runs.tuned, 'pidVolts'));
const degS = (r) => (r * 180) / Math.PI;

must(sag.p4 > sag.p8 && sag.p8 > 5, 'more P should sag less, and kP 8 should visibly sag');
must(over.p30 > 15, 'kP 30 should overshoot badly');
must(swingDeg(runs.p50) > 20, 'kP 50 should still be swinging after 3 s');
must(swingDeg(runs.p30) < 1, 'kP 30 should settle');
must(over.pd < 1, 'D should remove the overshoot');
must(sag.pd > 1, 'P + D should still sag');
must(Math.abs(GOAL - finalDeg(runs.p8g)) < 0.1, 'kG should remove the sag');
must(peak(runs.tuned, 'volts') < 6, 'the profiled move should stay under the 6 V output clamp');
must(ffShare > 0.8, 'feedforward should do most of the work');
must(peakDeg(runs.uncapped) > peakDeg(runs.capped) + 10, 'the uncapped integrator should swing far past');


const n = {
  amps: GRAVITY_TORQUE / ARM.gearing / MOTOR_KT,
  motorTorque: GRAVITY_TORQUE / ARM.gearing,
  tunedSettle: settle(runs.tuned, GOAL),
  stepSettle: settle(runs.pdg, GOAL),
  stuck: finalDeg(runs.uncapped),
};

// Embed: the same runs, baked in at build time so the animation is this simulation --------------
const SETS = [
  { name: 'P only', gains: 'kP 8', run: runs.p8, says: `Stops ${fix(sag.p8)}° short` },
  { name: 'Too much P', gains: 'kP 50', run: runs.p50, says: `Still swinging ${fix(swingDeg(runs.p50), 0)}° wide after 3 s` },
  { name: 'P + D', gains: 'kP 30, kD 1.2', run: runs.pd, says: `Overshoot gone, ${fix(sag.pd)}° short` },
  { name: 'Add feedforward', gains: 'kP 30, kD 1.2, kG 1.21', run: runs.pdg, says: `On target, ${fix(over.step)}° overshoot, 12 V peak` },
  { name: 'Add a profile', gains: 'kP 30, kD 1.2, kG 1.21, kV 1.19', run: runs.tuned, says: `On target, ${fix(over.tuned)}° overshoot, ${fix(peak(runs.tuned, 'volts'))} V peak` },
];

function embedHtml() {
  const X0 = 720, X1 = 1630, Y0 = 130, Y1 = 580, D0 = -40, D1 = 80, PX = 300, PY = 400, LEN = 230;
  const sx = (t) => X0 + (t / 3) * (X1 - X0);
  const sy = (d) => Y1 - ((d - D0) / (D1 - D0)) * (Y1 - Y0);
  const end = SETS[SETS.length - 1];
  const tip = (d, l = LEN) => [PX + l * Math.cos(rad(d)), PY - l * Math.sin(rad(d))].map((v) => fix(v, 1)).join(' ');
  const pts = (r) => r.map((x) => `${fix(sx(x.t), 0)},${fix(sy(x.deg), 0)}`).join(' ');
  const hLine = (d, attrs = '') => `<line x1="${X0}" x2="${X1}" y1="${sy(d)}" y2="${sy(d)}" ${attrs}/>`;
  const data = SETS.map((s) => ({ n: s.name, g: s.gains, s: s.says, d: every(s.run, 1).map((x) => Math.round(x.deg * 10)) }));
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#F7F5EF;overflow:hidden}
svg{display:block;width:100%;height:100%}
text{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:24px;fill:#45545F}
.b{font-size:44px;font-weight:700;fill:#12202E}.m{font-size:30px;fill:#1A2733}.v{font-size:32px;font-weight:700;fill:#B8430A}
</style></head><body>
<svg viewBox="0 0 1664 650" role="img" aria-label="An arm moving to 45 degrees beside a plot of its angle, cycling through five sets of gains">
<text id="c" x="0" y="42">5 of 5</text>
<text id="n" class="b" x="96" y="46">${end.name}</text>
<text id="g" class="m" x="1664" y="42" text-anchor="end">${end.gains}</text>
<text id="s" class="v" x="0" y="94">${end.says}</text>
<line x1="${PX}" y1="${PY}" x2="${PX}" y2="630" stroke="#12202E" stroke-width="18"/>
<line x1="${PX - 270}" x2="${PX + 270}" y1="${PY}" y2="${PY}" stroke="#D9D3C4" stroke-width="2"/>
<text x="${PX + 276}" y="${PY + 8}" text-anchor="end" transform="translate(0,-16)">0° is flat</text>
<line x1="${PX}" y1="${PY}" x2="${tip(GOAL, 270).split(' ')[0]}" y2="${tip(GOAL, 270).split(' ')[1]}" stroke="#0B5CAD" stroke-width="4" stroke-dasharray="14 10"/>
<line id="a" x1="${PX}" y1="${PY}" x2="${tip(finalDeg(end.run)).split(' ')[0]}" y2="${tip(finalDeg(end.run)).split(' ')[1]}" stroke="#B8430A" stroke-width="22" stroke-linecap="round"/>
<circle cx="${PX}" cy="${PY}" r="20" fill="#12202E"/>
<text id="d" class="m" x="${PX}" y="620" dx="30">${fix(finalDeg(end.run), 0)}°</text>
<line x1="${X0}" x2="${X0}" y1="${Y0}" y2="${Y1}" stroke="#45545F" stroke-width="2"/>
${hLine(-30, 'stroke="#45545F" stroke-width="2"')}
${hLine(0, 'stroke="#D9D3C4" stroke-width="1"')}
${hLine(GOAL, 'stroke="#0B5CAD" stroke-width="3" stroke-dasharray="14 10"')}
<text x="${X0 - 12}" y="${sy(GOAL) + 8}" text-anchor="end">45°</text>
<text x="${X0 - 12}" y="${sy(0) + 8}" text-anchor="end">0°</text>
<text x="${X0 - 12}" y="${sy(-30) + 8}" text-anchor="end">-30°</text>
${[0, 1, 2, 3].map((t) => `<text x="${sx(t)}" y="${Y1 + 34}" text-anchor="middle">${t}</text>`).join('')}
<text x="${(X0 + X1) / 2}" y="${Y1 + 66}" text-anchor="middle">Time (s). Dashed: the setpoint</text>
<polyline id="p" points="${pts(end.run)}" fill="none" stroke="#B8430A" stroke-width="5" stroke-linejoin="round"/>
</svg>
<script>
var S=${JSON.stringify(data)},M=$('p'),A=$('a'),T=Date.now(),I=-1;
function $(i){return document.getElementById(i)}
function x(i){return ${X0}+i/150*${X1 - X0}}
function y(d){return ${Y1}-(d/10-(${D0}))/${D1 - D0}*${Y1 - Y0}}
function f(){
var e=(Date.now()-T)/1000,i=Math.floor(e/5)%S.length,c=S[i],u=e%5,k=Math.min(150,Math.floor(u*50)),p=[],a,j;
if(i!=I){I=i;$('c').textContent=(i+1)+' of '+S.length;$('n').textContent=c.n;$('g').textContent=c.g;$('s').textContent=c.s}
for(j=0;j<=k;j++)p.push(x(j).toFixed(0)+','+y(c.d[j]).toFixed(0));
M.setAttribute('points',p.join(' '));
a=c.d[k]/10*Math.PI/180;
A.setAttribute('x2',(${PX}+${LEN}*Math.cos(a)).toFixed(1));
A.setAttribute('y2',(${PY}-${LEN}*Math.sin(a)).toFixed(1));
$('d').textContent=(c.d[k]/10).toFixed(0)+'°'
}
setInterval(f,40);f()
</script></body></html>`;
}

// Pulls a region, minus blank lines, so practice snippets still come from code that compiles.
function region(file, name) {
  const text = readFileSync(resolve(J, file), 'utf8').split('\n');
  const open = text.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  const body = text.slice(open + 1, close);
  const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.filter((l) => l.trim()).map((l) => l.slice(ind)).join('\n');
}

const CT = 'Control theory';
const CODE = 'Programming';

export default {
  no: 6, short: 'Arm PID', title: 'Arm PID: control theory and a PID + feedforward arm',
  description: 'Open and closed loop, P, D, I, feedforward and motion profiles, then an arm subsystem on the roboRIO.',
  slides: [
    L.cover({ title: 'Arm PID: move it, hold it', subtitle: 'Control theory and Java for a single-jointed arm on a NEO',
      notes: 'This deck is half control theory and half Java, and the math is algebra. Each idea comes as a picture, then a formula. Every curve comes from a simulation of one arm.' }),

    L.cards({ id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers', items: [
      { icon: 'Lightbulb', title: 'Theory', text: 'What P, D, I and feedforward each do to an arm.' },
      { icon: 'Wrench', title: 'Tuning', text: 'A safe order: kG, then kS if needed, then kP, then kD.' },
      { icon: 'Code', title: 'Java', text: 'An arm subsystem on the roboRIO, then with a motion profile.' },
    ], notes: 'Three parts. The theory covers what each term does to an arm. The tuning order protects hardware. The Java is command-based, first on the roboRIO where every number can be logged, then with a motion profile.' }),

    L.compare({ id: 'open-closed', eyebrow: CT, title: 'Open loop and closed loop', left: { label: 'Open loop: no measurement', tone: 'neutral', items: ['The code picks an output and sends it.', 'Nothing measures the result.', 'A change in battery, friction or load goes uncorrected.'] }, right: { label: 'Closed loop: measure and correct', tone: 'good', items: ['The code sends an output and reads a sensor.', 'It compares the reading with the target and corrects.', 'That measurement is called **feedback**.'] },
      notes: 'Open loop means you pick an output and send it. It works until something changes. Closed loop means you measure the result and correct it, again and again. A robot arm needs closed loop, because battery voltage, friction and game pieces all change.' }),

    L.diagram({ id: 'feedback-loop', eyebrow: CT, title: 'The feedback loop', caption: '**Error = setpoint - measurement.** Everything in this deck is about what to do with that one number.', nodes: [
      { id: 'set', x: 128, y: 330, w: 250, h: 150, label: 'Setpoint', sub: 'where you want it', tone: 'blue' },
      { id: 'err', x: 468, y: 330, w: 230, h: 150, label: 'Error', sub: 'how far off', tone: 'paper', round: true },
      { id: 'ctl', x: 788, y: 330, w: 270, h: 150, label: 'Controller', sub: 'picks the volts', tone: 'ink' },
      { id: 'arm', x: 1218, y: 330, w: 330, h: 150, label: 'Motor and arm', sub: 'what really happens', tone: 'accent' },
      { id: 'enc', x: 788, y: 610, w: 270, h: 130, label: 'Encoder', sub: 'measures the angle', tone: 'paper' },
    ], edges: [
      { from: 'set', to: 'err' }, { from: 'err', to: 'ctl' }, { from: 'ctl', to: 'arm', label: 'volts', lx: 1018, ly: 356 , lw: 240 },
      { from: 'arm', to: 'enc', fromSide: 'b', toSide: 'r', route: 'vh' },
      { from: 'enc', to: 'err', fromSide: 'l', toSide: 'b', route: 'hv', label: 'measurement', lx: 400, ly: 690, lw: 230 },
    ], notes: 'Three terms. The setpoint is where you want the arm. The measurement is where the encoder says it is. The error is the gap between them. The controller turns error into volts, the arm moves, the encoder reads it, and around we go, every 20 milliseconds. All the math goes in the controller box. The rest of the theory is what to put in there.' }),

    L.table({ id: 'example-arm', eyebrow: CT, title: 'One example arm for the whole deck', columns: ['Part', 'Our numbers', 'What it sets'], widths: [18, 47, 35], rows: [
      ['Arm', `Uniform bar, ${ARM.lengthM} m long, ${ARM.massKg} kg`, `Inertia ${fix(MOI, 2)} kg m²`],
      ['Gearbox', `${ARM.gearing}:1`, 'Trades speed for torque'],
      ['Motor', `One NEO: ${NEO.volts} V, ${NEO.stallTorque} N·m and ${NEO.stallAmps} A at stall, ${NEO.freeRpm} RPM free`, 'How much push you get'],
      ['Sensor', 'Through-bore encoder on the arm shaft', 'Knows the angle at power-on'],
      ['Loop', 'New volts every 20 ms, reading one loop old', 'How late every decision is'],
      ['Travel', `Rests on a stop at ${ARM.minDeg}°, top stop at ${ARM.maxDeg}°. 0° is flat`, 'Where gravity pulls hardest'],
    ], caption: 'Every plot simulates this arm: DC motor, gearing, inertia and gravity, stepped at the 20 ms loop.',
      notes: `The motor numbers are the real NEO constants from WPILib's DCMotor class. The bar is uniform, the same shape WPILib's SingleJointedArmSim assumes, so your Java sim later matches these slides. We simulate the motor, the gearbox, the inertia and gravity, and we step it every 20 milliseconds like the robot. The encoder reading is one loop old because a SPARK sends it over CAN every 20 milliseconds by default. Real arms add friction, and this one has none.` }),

    L.plot({ id: 'p-sag', eyebrow: CT, title: 'P: push harder the farther away you are', alt: `Arm angle over 3 seconds moving to 45 degrees. kP 4 stops at ${fix(finalDeg(runs.p4))} degrees and kP 8 stops at ${fix(finalDeg(runs.p8))} degrees.`,
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees). Dashed: the setpoint', xDomain: [0, 3], yDomain: [-40, 60], xTicks: [0, 1, 2, 3], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [{ name: 'kP 4', color: 'orange', points: degrees(runs.p4) }, { name: 'kP 8', color: 'blue', dash: true, points: degrees(runs.p8) }],
      callouts: [
        { title: 'The rule', text: '`volts = kP × error`. More error, more volts.' },
        { title: 'The sag', text: `kP 8 stops at ${fix(finalDeg(runs.p8))}°, ${fix(sag.p8)}° short. kP 4 is ${fix(sag.p4)}° short.` },
        { title: 'Why it stays', text: `Holding there takes ${fix(hold8, 2)} V. P only makes volts from error, so some error has to stay.` },
      ], notes: `P is the simplest idea in control: the farther away you are, the harder you push. Gravity changes the result. The arm stops short and stays short. To hold still it needs ${fix(hold8, 2)} volts, and P can only make volts from error. So it settles where error times kP equals what gravity needs. Check it: ${fix(sag.p8, 1)} degrees is ${fix(rad(sag.p8), 3)} radians, times 8 is ${fix(hold8, 2)} volts.` }),

    L.plot({ id: 'too-much-p', eyebrow: CT, title: 'Too much P: overshoot, then shaking', alt: `Arm angle over 3 seconds. kP 30 swings to ${fix(peakDeg(runs.p30))} degrees then settles. kP 50 keeps swinging.`,
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees). Dashed: the setpoint', xDomain: [0, 3], yDomain: [-40, 80], xTicks: [0, 1, 2, 3], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [{ name: 'kP 30', color: 'orange', points: degrees(runs.p30) }, { name: 'kP 50', color: 'blue', dash: true, points: degrees(runs.p50) }],
      callouts: [
        { title: 'Less sag', text: `kP 30 ends ${fix(GOAL - finalDeg(runs.p30))}° short, so that worked.` },
        { title: 'New problem', text: `It swings to ${fix(peakDeg(runs.p30))}°, ${fix(over.p30)}° past the setpoint.` },
        { title: 'Too far', text: `kP 50 never settles. It is still swinging ${fix(swingDeg(runs.p50), 0)}° wide after 3 s.` },
      ], notes: 'So turn up P. The sag shrinks, and a new problem shows up. The arm is moving fast when it reaches the setpoint, and P only starts pushing back after it has gone past. Our reading is also a little late. At kP 50 each swing feeds the next one, and it never settles. On a real arm that can break a chain. This is the trade: more P means less sag and more shake. We need something that looks at speed.' }),

    L.plot({ id: 'p-plus-d', eyebrow: CT, title: 'D: reducing overshoot', alt: `Arm angle over 3 seconds. kP 30 overshoots to ${fix(peakDeg(runs.p30))} degrees. With kD 1.2 the peak is ${fix(peakDeg(runs.pd))} degrees.`,
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees). Dashed: the setpoint', xDomain: [0, 3], yDomain: [-40, 80], xTicks: [0, 1, 2, 3], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [{ name: 'kP 30', color: 'orange', points: degrees(runs.p30) }, { name: 'kP 30 + kD 1.2', color: 'blue', dash: true, points: degrees(runs.pd) }],
      callouts: [
        { title: 'The rule', text: '`volts = kD × how fast the error changes`.' },
        { title: 'When it acts', text: 'D subtracts volts while the arm closes in, before it reaches the setpoint.' },
        { title: 'What changed', text: `Overshoot drops from ${fix(over.p30)}° to ${fix(over.pd)}°. The arm still ends ${fix(sag.pd)}° short.` },
      ], notes: `D uses how fast the error is changing. When the arm closes in fast, D subtracts volts before it arrives. Overshoot falls from ${fix(over.p30)} degrees to ${fix(over.pd)}. The blue line still stops short, because once the arm stops moving, D adds nothing. Both runs use the same kP, so only D changed.` }),

    L.plot({ id: 'd-noise', eyebrow: CT, title: 'D multiplies sensor noise', alt: `Motor volts over 2 seconds while holding still with sensor noise. Without D the volts spread ${fix(voltSpread(runs.quiet), 2)} volts. With D they spread ${fix(voltSpread(runs.noisy), 2)} volts.`,
      xLabel: 'Time (s)', yLabel: 'Motor volts while holding at 45°', xDomain: [0, 2], yDomain: [0, 2], xTicks: [0, 1, 2], yTicks: [0, 0.5, 1, 1.5, 2],
      series: [{ name: 'kD 0', color: 'orange', points: runs.quiet.slice(5).map((x) => [x.t, x.volts]) }, { name: 'kD 1.2', color: 'blue', dash: true, points: runs.noisy.slice(5).map((x) => [x.t, x.volts]) }],
      callouts: [
        { title: 'Why', text: 'D divides a tiny change by 0.02 s. That is the same as multiplying it by 50.' },
        { title: 'The test', text: `We added ±0.2° of fake noise to the reading. The arm itself moved ${fix(armSpread(runs.noisy), 2)}°.` },
        { title: 'The result', text: `Volts spread ${fix(voltSpread(runs.quiet), 2)} V with no D and ${fix(voltSpread(runs.noisy), 2)} V with it. Use as little D as does the job.` },
      ], notes: `D looks at the change between two readings and divides by the loop time, which is 0.02 seconds. Dividing by 0.02 is multiplying by 50, so a tiny flicker in the encoder becomes a jump in volts. Here the arm is holding still, and we added fake noise to the reading. The volts spread ${fix(voltSpread(runs.quiet), 2)} volts without D and ${fix(voltSpread(runs.noisy), 2)} with it. Too much D and the motor buzzes or heats up.` }),

    L.plot({ id: 'i-windup', eyebrow: CT, title: 'I: the slow fix that can wind up', alt: `Arm angle over 6 seconds, held at the stop for 1.5 seconds and then released. With the I term limited to 12 volts it swings to ${fix(peakDeg(runs.uncapped))} degrees. With the 1 volt limit it swings to ${fix(peakDeg(runs.capped))} degrees.`,
      xLabel: 'Time (s). The arm is held at the stop until 1.5 s', yLabel: 'Arm angle (degrees). Dashed: the setpoint', xDomain: [0, 6], yDomain: [-40, 80], xTicks: [0, 1.5, 3, 4.5, 6], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [{ name: 'I limited to 12 V', color: 'orange', points: every(runs.uncapped, 2).map((x) => [x.t, x.deg]) }, { name: 'I limited to 1 V', color: 'blue', dash: true, points: every(runs.capped, 2).map((x) => [x.t, x.deg]) }],
      callouts: [
        { title: 'The idea', text: 'I adds up error over time. kI 8 here.' },
        { title: 'Windup', text: `Stuck for 1.5 s, the total grows. Let go and it swings to ${fix(peakDeg(runs.uncapped))}°.` },
        { title: 'Slow recovery', text: `4.5 s after release it is still ${fix(n.stuck - GOAL)}° high. WPILib limits I to ±1 by default.` },
      ], notes: `I adds up error over time. On a gravity arm it is rarely the right first move. Gravity changes with angle, so I would have to relearn the answer at every angle, slowly. Worse is windup. Here something holds the arm at the stop for a second and a half while the total keeps growing. When it lets go, the arm has to overshoot to bring the total back down. WPILib limits the I term to plus or minus 1 by default, the blue line. We widened it to 12 with setIntegratorRange for the orange one. There is a better fix for sag, coming next.` }),

    L.plot({ id: 'gravity-cos', eyebrow: CT, title: 'Gravity: volts to hold the arm at each angle', alt: 'Holding volts against arm angle from minus 90 to 90 degrees: a cosine curve peaking at 1.21 volts when flat.',
      xLabel: 'Arm angle (degrees from flat)', yLabel: 'Volts to hold the arm still', xDomain: [-90, 90], yDomain: [0, 1.4], xTicks: [-90, -45, 0, 45, 90], yTicks: [0, 0.4, 0.8, 1.2], refs: [{ y: KG_EXACT }],
      series: [{ name: 'Holding volts from the model', color: 'orange', points: Array.from({ length: 37 }, (_, i) => [-90 + i * 5, holdVolts(-90 + i * 5)]) }],
      callouts: [
        { title: 'Flat is hardest', text: `The bar sticks straight out, so gravity's lever is longest: ${fix(holdVolts(0), 2)} V.` },
        { title: 'The cosine', text: `At 45° it takes ${fix(holdVolts(45), 2)} V. Straight up it takes 0 V. Your calculator's cos does this.` },
        { title: 'Why 0° is flat', text: 'Then cos(0) = 1, and `kG` simply means "volts to hold it flat".' },
      ], notes: 'When the arm is flat, its weight acts farthest from the joint. Straight up, the weight sits over the joint. That distance is the cosine of the angle. We found these holding volts by searching the motor model at each angle, and they trace a cosine curve exactly. That is why flat is the sensible zero: cos of zero is one, so kG is one easy thing to measure, and WPILib expects it.' }),

    L.steps({ id: 'kg-physics', eyebrow: CT, title: `Where ${fix(KG_EXACT, 2)} volts comes from`, items: [
      { title: `Gravity torque when flat: ${fix(GRAVITY_TORQUE)} N·m`, text: `Mass × g × distance to the middle: ${ARM.massKg} × ${ARM.gravity} × ${ARM.lengthM / 2}.` },
      { title: `Torque at the NEO: ${fix(n.motorTorque, 3)} N·m`, text: `The gearbox divides it by ${ARM.gearing}.` },
      { title: `Current for that torque: ${fix(n.amps)} A`, text: `Divide by the NEO's ${fix(MOTOR_KT, 4)} N·m per amp.` },
      { title: `Volts to push that current: ${fix(KG_EXACT, 2)} V`, text: `Multiply by the NEO's ${fix(OHMS, 3)} ohms. The motor is not turning, so it makes no voltage of its own.` },
    ], notes: `Four steps, only multiply and divide. Gravity pulls with ${fix(GRAVITY_TORQUE)} newton metres when the arm is flat. The gearbox divides that by 60. The NEO's torque constant turns torque into amps, and its resistance turns amps into volts. The resistance and torque constant come straight from the stall numbers in WPILib: 12 volts over 105 amps, and 2.6 newton metres over 105 amps. So kG is ${fix(KG_EXACT, 2)} volts. On a real arm you measure it, but this tells you what size to expect.` }),

    L.plot({ id: 'add-feedforward', eyebrow: CT, title: 'Feedforward: add the volts you already know', alt: `Arm angle over 3 seconds with kP 8. Without kG it stops at ${fix(finalDeg(runs.p8))} degrees. With kG it reaches ${fix(finalDeg(runs.p8g))} degrees.`,
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees). Dashed: the setpoint', xDomain: [0, 3], yDomain: [-40, 70], xTicks: [0, 1, 2, 3], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [{ name: 'kP 8', color: 'orange', points: degrees(runs.p8) }, { name: 'kP 8 + kG 1.21', color: 'blue', dash: true, points: degrees(runs.p8g) }],
      callouts: [
        { title: 'The rule', text: '`volts = kG × cos(angle)`, added before PID runs.' },
        { title: 'Same gentle P', text: `kP 8 alone ends at ${fix(finalDeg(runs.p8))}°. With kG it ends at ${fix(finalDeg(runs.p8g))}°, after a ${fix(peakDeg(runs.p8g) - GOAL)}° overshoot.` },
        { title: 'Why it works', text: 'The volts go in before any error appears.' },
      ], notes: `Feedback waits for an error. Feedforward uses what you already know. We know gravity, so we add the holding volts up front and PID never has to fight it. With the same gentle kP 8, the sag is gone: ${fix(sag.p8)} degrees down to ${fix(Math.abs(GOAL - finalDeg(runs.p8g)), 2)}. kP did not change. It does overshoot by ${fix(peakDeg(runs.p8g) - GOAL)} degrees, and that is a job for D and, soon, a profile. It also lets kP stay low.` }),

    L.statement({ id: 'core-idea', text: 'Feedforward does the work. PID cleans up.', sub: 'Feedforward is the volts you can predict. PID handles only what you could not.',
      notes: 'This is the main rule of the deck. Predict what you can with feedforward, and let PID fix the small error left over. Making PID do everything leads to a shaking arm. REV\'s own tuning guide and the WPILib arm tutorial both say the same.' }),

    L.cards({ id: 'ks-kv', eyebrow: CT, title: 'The rest of feedforward: kS and kV', intro: '`ArmFeedforward(kS, kG, kV)` adds all three. You already know the middle one.', items: [
      { icon: 'Lightning', title: 'kS: friction', text: 'The volts needed to overcome friction and start moving.' },
      { icon: 'Settings', title: 'kG: gravity', text: `${fix(TUNED.kG, 2)} V × cos(angle) on our arm.` },
      { icon: 'Activity', title: 'kV: speed', text: `Back-EMF grows with speed. Our arm takes ${fix(TUNED.kV, 2)} V per rad/s of speed.` },
    ], notes: `kS covers friction: the small voltage needed to start moving. Our simulated arm has no friction, so kS is zero here, and your real arm will need some. kV covers speed. A spinning motor generates a voltage against its supply, called back-EMF, so going faster takes more volts. That one also comes from physics: the gear ratio 60 divided by the NEO's speed constant of ${fix(MOTOR_KV, 1)} rad/s per volt gives ${fix(KV_EXACT, 2)}. kV needs a target speed, and a setpoint jump does not have one. That leads to the next slide.` }),

    L.plot({ id: 'motion-profile', eyebrow: CT, title: 'Motion profiles: do not jump the setpoint', alt: `Arm speed over 2 seconds. Jumping the setpoint peaks at ${fix(degS(peak(runs.pdg, 'radS')), 0)} degrees per second. The trapezoid profile rises, cruises near ${fix(degS(PROFILE.maxV), 0)} degrees per second, and falls.`,
      xLabel: 'Time (s)', yLabel: 'Arm speed (degrees per second)', xDomain: [0, 2], yDomain: [-100, 500], xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 100, 200, 300, 400, 500],
      series: [{ name: 'Setpoint jump', color: 'orange', points: runs.pdg.filter((x) => x.t <= 2).map((x) => [x.t, degS(x.radS)]) }, { name: 'Trapezoid profile', color: 'blue', dash: true, points: runs.tuned.filter((x) => x.t <= 2).map((x) => [x.t, degS(x.radS)]) }],
      callouts: [
        { title: 'The jump', text: `${fix(peak(runs.pdg, 'volts'), 0)} V and ${fix(peak(runs.pdg, 'amps'), 0)} A at once. Hard on chain, gears and battery.` },
        { title: 'The trapezoid', text: `Speed up, cruise, slow down. ${fix(peak(runs.tuned, 'volts'))} V and ${fix(peak(runs.tuned, 'amps'), 0)} A at most.` },
        { title: 'Who did the work', text: `Over this move, feedforward supplied ${fix(ffShare * 100, 0)}% of the volts.` },
      ], notes: `A motion profile moves the setpoint smoothly, so the arm gets a sequence of small, reachable goals. Plot speed against time and you get a trapezoid: up, flat, down. WPILib's TrapezoidProfile does this with a top speed and an acceleration, here ${PROFILE.maxV} rad/s and ${PROFILE.maxA} rad/s squared. The jump pulls ${fix(peak(runs.pdg, 'amps'), 0)} amps in this model, which has no current limit. A real SPARK would clip that. Now the profile gives kV a target speed, and feedforward does ${fix(ffShare * 100, 0)} percent of the work.` }),

    L.embed({ id: 'gain-cycle', eyebrow: CT, title: 'Five gain sets on one arm', height: 650, html: embedHtml(),
      notes: `This animation replays the same simulation as the plots. A PDF shows one frame, so here is the whole cycle. P only, kP 8: ${SETS[0].says}. Too much P, kP 50: ${SETS[1].says}. P plus D, kP 30 and kD 1.2: ${SETS[2].says}. Add kG 1.21: ${SETS[3].says}. Add a profile and kV 1.19: ${SETS[4].says}.` }),

    L.steps({ id: 'tuning-recipe', eyebrow: CT, title: 'Tuning steps, in order', items: [
      { title: 'kG first', text: 'All gains at 0. Raise kG until the arm stays where you leave it.' },
      { title: 'kS, only if needed', text: 'If the arm sticks and then jumps, add a small kS.' },
      { title: 'Raise kP', text: 'Start low and raise it in steps. Stop when it starts to overshoot.' },
      { title: 'Add kD', text: 'Add D until the overshoot goes. If the motor buzzes, back off.' },
      { title: 'Test with small, safe moves', text: 'Try 10° before 90°. Hand on the disable key, every time.' },
    ], notes: 'Feedforward first, because it is the part you can get right without any oscillation. To measure kG and kS on a real arm, REV\'s guide says: find V1, the most volts that do not lift it, and V2, the fewest that do not drop it. Then kS is V1 minus V2, over 2, and kG is V2 plus kS. Do not leave an arm hanging on motor power for long while you do this, because it heats up. Only then touch kP and kD.' }),

    L.exercise({ id: 'playground-exercise', title: 'Test gains in the arm playground', tasks: [
      PLAYGROUND_URL ? `Scan the Arm playground QR on the last slide, or open \`${PLAYGROUND_FILE}\` from the repo.` : `Open \`${PLAYGROUND_FILE}\` from the repo in any browser.`,
      'Press **P only**. Write down how far short the arm stops.',
      'Press **Too much P**, then slide kP down until the shaking stops.',
      'Find your own gains. Turn on the profile if you want it.',
    ], done: 'the status line reads **Settled** and you can read your gains as Java constants.',
      notes: 'This page simulates the same arm, with the same physics, in a browser with nothing to install. The status line reports the result. Settled means within 1 degree, under 2 degrees of overshoot, and not shaking.' }),

    L.sectionSlide({ id: 'code-section', title: 'Now the Java', sub: 'The same arm, written two ways', section: 'Programming the arm', notes: 'The arm is built two ways. First, PID and feedforward on the roboRIO, because you can see and log every number. Second, the same thing with a motion profile. Both share the same config, and all the code is in the deck 6 package of the examples project, which compiles against WPILib 2026.2.1 and REVLib 2026.0.5.' }),

    L.practice({ id: 'units-boundary', title: 'One unit in Java, convert at the boundary', rule: 'Pick one unit for all your Java: radians. Convert once, where the code meets the hardware.', why: 'The SPARK reports rotations, so `ArmUnits` is the only class that converts. Hold the arm flat and save the raw reading as `ENCODER_FLAT_ROTATIONS`.', code: region('ArmUnits.java', 'boundary'), flag2027: 'REVLib alphas drop conversion factors too. Native units carry over.',
      notes: 'A unit mistake can drive an arm into its stops. The rule: one unit in Java, converted in one place. The through-bore reports rotations from 0 to 1. Subtract the flat reading, turn it into radians, and angleModulus makes below flat negative. The gear ratio lives here too: the NEO turns 60 times per arm turn. We set no conversion factors on the SPARK, so it reports plain rotations. Wire the through-bore to the data port with the Absolute Encoder Adapter. If you own a V2 through-bore, also apply REV\'s V2 preset.' }),

    L.code({ id: 'rio-loop', eyebrow: CODE, title: 'The loop on the roboRIO', file: 'ArmSubsystem.java', src: { file: `${J}/ArmSubsystem.java`, region: 'loop' }, highlight: [2, 10, 11, 13],
      notes: 'Four parts: motor, encoder, PID, feedforward. Note kBrushless. The KitBot CIMs were brushed, but a NEO is brushless, and REV warns that brushed mode will permanently damage it. The core is driveToTarget. Feedforward gives the volts for gravity, PID gives the volts for the error, and we add them and clamp. The clamp limits the output. We use setVoltage because our gains are in volts, so a worn battery does not change them. We hand the measured angle to feedforward because gravity acts on where the arm is, not where the setpoint is.' }),

    L.codeNotes({ id: 'commands', eyebrow: CODE, title: 'Command factories: moveTo and holdPosition', file: 'ArmSubsystem.java', src: { file: `${J}/ArmSubsystem.java`, region: 'commands' }, callouts: [
      { line: [2, 3], title: 'atGoal', text: 'A `Trigger` that needs 0.1 s near the goal, so one lucky reading does not count.' },
      { line: [6, 7], title: 'Clamp the goal', text: 'A bad setpoint gets stopped here, before the motor sees it.' },
      { line: 8, title: 'Start clean', text: 'Sync the encoders, reset PID, then loop until `atGoal`.' },
      { line: [13, 14], title: 'Hold', text: 'Keep the last goal if the arm got there. If not, hold where it is.' },
    ], notes: 'Same inline style as deck 2: the subsystem makes its own commands. moveTo clamps the goal, gets ready, runs the loop, and ends when the arm arrives. Getting ready copies the true angle into the NEO\'s encoder, because the soft limits use it and it forgets at power-off. holdPosition keeps the last goal if the arm reached it, and otherwise holds where the arm is right now. Both commands require the arm, so they can never fight each other. moveTo ends so the default command can take over, which is next.' }),

    L.code({ id: 'bindings', eyebrow: CODE, title: 'A default command that holds, and triggers', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'bindings' }, highlight: [4, 11], caption: 'The bumper fires only when the driver presses it **and** the arm has arrived.',
      notes: 'The default command runs whenever nothing else needs the arm. If the arm is not at its last goal when you enable, it holds where it is, so it does not jump to an old goal. That is a safety feature. Buttons start moves with onTrue, and each move ends by itself, so the default takes over. The last line shows that a Trigger can watch the arm, and you can combine it with a button using and. Here it just prints, but on a robot that is your shooter or claw.' }),

    L.codeNotes({ id: 'profiled', eyebrow: CODE, title: 'Add a profile with ProfiledPIDController', file: 'ProfiledArmSubsystem.java', src: { file: `${J}/ProfiledArmSubsystem.java`, region: 'loop' }, callouts: [
      { line: [4, 5], title: 'The trapezoid', text: `Top speed ${PROFILE.maxV} rad/s, acceleration ${PROFILE.maxA} rad/s².` },
      { line: 10, title: 'One step', text: 'Each loop, the setpoint moves a little toward the goal.' },
      { line: [11, 12], title: 'kV gets a speed', text: 'The profile knows the target speed, so feedforward can use it.' },
    ], notes: `Only a few lines change. PIDController becomes ProfiledPIDController, which owns a TrapezoidProfile. calculate moves the setpoint one step and runs PID against it. getSetpoint gives the target speed, which goes to kV. Call reset with the real angle when each move starts, or the profile starts from wherever it last stopped. Expect this move, from ${ARM.minDeg} to ${GOAL} degrees, to stay within 2 degrees of the goal after ${fix(n.tunedSettle, 2)} seconds, peaking at ${fix(peak(runs.tuned, 'volts'))} volts. That is under the 6 volt clamp.` }),

    L.practice({ id: 'safety', title: 'Safety goes in before tuning', rule: 'Add soft limits, a current limit and an output clamp first. Keep people clear and a hand on the disable key.', why: 'Start with low gains. On the Driver Station, Enter disables and Space is the emergency stop.', code: region('ArmConfig.java', 'soft'),
      notes: 'Before tuning, add soft limits, a current limit and an output clamp. REV suggests 40 to 60 amps for a NEO, and the default is 80. One person keeps a hand on the disable key, and everyone else stands clear.' }),

    L.code({ id: 'sim-setup', eyebrow: CODE, title: 'Tune without risking hardware', file: 'ArmSimModel.java', src: { file: `${J}/ArmSimModel.java`, region: 'physics' }, flag2027: 'SmartDashboard is removed. Telemetry replaces putData.', caption: '`update()` feeds the SPARK\'s volts in and the angle back out. `SmartDashboard.putData("Arm", mechanism)` publishes the drawing.',
      notes: 'This is a simulated arm in Java with the same numbers as our slides, so what you see in sim should look like the plots. SingleJointedArmSim takes the motor, gearing, inertia, length, angle limits, a gravity switch and a starting angle. Mechanism2d is the stick drawing. Each loop, update passes the simulated SPARK\'s applied volts to the physics, then gives the angle back to the simulated encoder. To watch it, open the Mechanism tab in AdvantageScope and drag in the Arm entry, or use the Mechanism2d widget in the sim GUI.' }),

    L.exercise({ id: 'sim-exercise', title: 'Tune the arm in the simulator', tasks: [
      'In `Constants.java`, set `KP` to 2 and `KD`, `KG`, `KV` to 0. Run **Simulate Robot Code**.',
      'Enable, press Y, and watch the arm in AdvantageScope or the sim GUI. It sags.',
      'Follow the tuning steps: set `KG`, then `KV`, then raise `KP`, then add `KD`.',
    ], done: 'Y moves the arm to 45° and it holds within 2°, with no shaking.',
      notes: 'Setup: in a copy of the examples project, make Robot.java create frc.robot.deck6.RobotContainer, and check that it runs on the keyboard or a gamepad. Change only the gains in Constants: stop the simulator, edit, run again. The Y button runs the move, using the profiled subsystem. Swapping the subsystem for ArmSubsystem in RobotContainer shows the setpoint jump.' }),

    L.gotcha({ id: 'gotcha-runaway', title: 'The arm runs away at full speed', symptom: 'You enable, and the arm slams to a stop as fast as it can go.', cause: 'Motor and encoder disagree on direction. Moving "toward" the goal makes the error bigger, so P pushes harder.', fix: 'Robot disabled: lift the arm by hand. The angle must go up. Then at about 1 V: the arm must rise. Flip `ENCODER_INVERTED` or `MOTOR_INVERTED`.',
      notes: 'Feedback only works if pushing up makes the reading go up. If they disagree, the error grows until the arm hits something. Check both directions before you enable a closed loop: by hand with the robot disabled for the encoder, then at a very low voltage with the arm clear for the motor. In REVLib both are config settings: inverted on the motor config and inverted on absoluteEncoder.' }),

    L.table({ id: 'gotcha-table', eyebrow: 'Common mistakes', title: 'Five more gotchas, by symptom', fontSize: 24, columns: ['What you see', 'Why it happens', 'The fix'], widths: [36, 34, 30], rows: [
      ['Ask for 45 and the arm drives to its top limit', 'Wrong units: 45 radians is about 7 turns', 'Use Units.degreesToRadians'],
      ['Arm leans on a stop and the motor gets hot', 'Setpoint out of range, so error never reaches 0', 'Clamp goals to the soft limits'],
      ['Always off by the same ratio', 'Gear ratio wrong in ArmUnits', 'Turn the arm 90° by hand and check'],
      ['Correct at first, off after a restart', 'Relative encoder, no homing: it reads 0 at power-on', 'Use the absolute encoder, or home on a stop'],
      [`Arm sags more with kG, ${fix(sag.back)}° not ${fix(sag.pd)}°`, 'kG sign backwards: up is negative in your code', 'Make up positive and keep kG positive'],
    ], caption: 'And I windup: if the arm overshoots after being stuck, cap I with `setIntegratorRange` or leave it out.',
      notes: `Units: 45 means 45 radians, and our clamp sends the arm to the soft limit. Range: the goal is past a stop, so the motor pushes forever. Ratio: the NEO's encoder and soft limits depend on it. Homing: a relative encoder reads zero wherever it wakes up. Sign: our arm with kG backwards sagged ${fix(sag.back)} degrees, twice the ${fix(sag.pd)} from no kG.` }),

    L.change2027({ id: 'change-2027', items: [
      { now: 'roboRIO runs the 20 ms loop', next: 'Systemcore replaces the roboRIO' },
      { now: 'Java 17', next: 'Java 25' },
      { now: 'edu.wpi.first imports', next: 'org.wpilib imports' },
      { now: 'SmartDashboard.putData for Mechanism2d', next: 'Telemetry and Tunables replace it' },
      { now: 'REVLib 2026 still has conversion factors', next: 'REVLib alphas drop them: use native units' },
    ], note: 'The theory does not change. Gravity still follows a cosine. All 2027 details are alpha and may change.',
      notes: 'For 2027 the control hardware and some names change, and the REV note comes from their current API docs. This deck avoids conversion factors, so that part carries forward. P, D, feedforward and profiles work the same on any controller. WPILib 2027 is still in alpha.' }),

    L.recap({ id: 'recap', items: [
      'Why P alone sags, and why too much P shakes.',
      'D reduces overshoot and multiplies noise.',
      'Feedforward for what you can predict: `kG × cos(angle)`, with 0° at flat.',
      'Tuning in order with small, safe moves: kG, kS, kP, kD.',
      'An arm subsystem with a motion profile.',
    ], next: 'Deck 7 compares REV and CTRE motors and what they can do on board.',
      notes: 'Deck 7 compares REV and CTRE, including their onboard closed loops.' }),

    L.links({ id: 'links', items: [
      { label: 'Tuning a vertical arm', url: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/tuning-vertical-arm.html', short: 'docs.wpilib.org' },
      { label: 'Trapezoidal profiles', url: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/controllers/trapezoidal-profiles.html', short: 'docs.wpilib.org' },
      { label: 'SPARK feedforward', url: 'https://docs.revrobotics.com/revlib/spark/closed-loop/feed-forward-control', short: 'docs.revrobotics.com' },
      ...(PLAYGROUND_URL ? [{ label: 'Arm playground', url: PLAYGROUND_URL, short: 'Interactive arm simulation' }] : []),
    ], notes: 'WPILib\'s vertical arm tutorial has its own interactive simulation. The trapezoidal profile page has the full API. REV\'s feed forward page covers how to measure kG on a real arm.' }),
  ],
};

// For checks in tooling. The builder only reads the default export.
export const simulation = { simulate, runs, finalDeg, peakDeg, swingDeg, settle, peak, TUNED, PROFILE, GOAL, KG_EXACT, KV_EXACT, n };
