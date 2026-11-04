// Deck 8: understanding motors. How to read a motor curve, and what a current limit really does.
// Every curve is computed in this file, and every number on a slide is computed here or cited in SOURCES.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck8';

// First-order drivetrain model, moved from Deck 2 with its two plots. Both plots read from simulate().
// CIM data is WPILib DCMotor.getCIM(); R, Kt and Kv use the same formulas as the DCMotor constructor.
// Gearing, wheels and motor count are the KitBot's. The 50 kg mass is an assumption.
const CIM = { volts: 12, stallNm: 2.42, stallA: 133, freeA: 2.7, freeRpm: 5310 };
const R = CIM.volts / CIM.stallA;
const Kt = CIM.stallNm / CIM.stallA;
const Kv = (CIM.freeRpm * 2 * Math.PI / 60) / (CIM.volts - R * CIM.freeA);
const BOT = { motors: 4, gear: 8.45, wheelM: 0.0762, massKg: 50 };
const DT = 0.001;

function simulate({ volts, limitA = Infinity, seconds = 2 }) {
  let speed = 0, dist = 0;
  const out = [];
  for (let i = 0; i <= Math.round(seconds / DT); i++) {
    const t = i * DT;
    const motorRadS = speed * BOT.gear / BOT.wheelM;
    const amps = Math.max(-limitA, Math.min(limitA, (volts(t) - motorRadS / Kv) / R));
    if (i % 10 === 0) out.push({ t, speed, amps, dist });
    speed += (BOT.motors * BOT.gear * Kt * amps) / (BOT.wheelM * BOT.massKg) * DT;
    dist += speed * DT;
  }
  return out;
}
const speedPts = (run) => run.map((p) => [p.t, p.speed]);
const ampPts = (run) => run.map((p) => [p.t, p.amps]);
const peak = (run) => Math.round(Math.max(...run.map((p) => p.amps)));
const timeTo = (run, speed) => run.find((p) => p.speed >= speed).t.toFixed(2);

const LIMIT_A = 60;

// Voltage compensation: half stick on two batteries, with and without it.
const fresh = simulate({ volts: () => 0.5 * 12.8 });
const tired = simulate({ volts: () => 0.5 * 11.2 });
const compensated = simulate({ volts: () => 0.5 * 12 });
const spreadCm = Math.round((fresh.at(-1).dist - tired.at(-1).dist) * 100);

// Current limit: full stick from a stop.
const noLimit = simulate({ volts: () => 12, seconds: 1 });
const limited = simulate({ volts: () => 12, limitA: LIMIT_A, seconds: 1 });

const MODEL = 'four CIMs using the numbers in WPILib DCMotor.getCIM, 8.45:1 gearing, 6 inch wheels and an assumed 50 kg robot, with no friction, wheel slip or battery sag';

// Battery current in that same run: the SPARK's duty cycle times motor current (REV's formula).
const dutyOf = (p) => Math.min(1, (p.speed * BOT.gear / BOT.wheelM / Kv + p.amps * R) / CIM.volts);
const batteryPts = limited.map((p) => [p.t, p.amps * dutyOf(p)]);
const limitVolts = LIMIT_A * R; // Voltage that pushes the limit current through a stopped motor.
const limitBatteryA = LIMIT_A * limitVolts / CIM.volts;
const limitDuty = limitVolts / CIM.volts;
const motorW = LIMIT_A * limitVolts;

// The motor curve: straight lines between the four spec sheet numbers ---------------------------
const radS = (rpm) => rpm * 2 * Math.PI / 60;
const speeds = Array.from({ length: 101 }, (_, i) => (i / 100) * CIM.freeRpm);
const torqueAt = (rpm) => CIM.stallNm * (1 - rpm / CIM.freeRpm);
const ampsAt = (rpm) => CIM.stallA - (CIM.stallA - CIM.freeA) * (rpm / CIM.freeRpm);
const wattsOut = (rpm) => torqueAt(rpm) * radS(rpm);
const wattsIn = (rpm) => CIM.volts * ampsAt(rpm);
const wattsHeat = (rpm) => ampsAt(rpm) ** 2 * R;

const halfRpm = CIM.freeRpm / 2;
const peakW = CIM.stallNm * radS(CIM.freeRpm) / 4;
if (Math.abs(peakW - wattsOut(halfRpm)) > 1e-9) throw new Error('peak power should sit at half speed');
if (Math.max(...speeds.map(wattsOut)) > peakW) throw new Error('peak power should sit at half speed');
const stallW = wattsIn(0);
const halfIn = wattsIn(halfRpm), halfOut = wattsOut(halfRpm);
const quarterTicks = [0, 1, 2, 3, 4].map((q) => Math.round((q / 4) * CIM.freeRpm));
const asPercent = (fn) => { const top = Math.max(...speeds.map(fn)); return speeds.map((s) => [s, (fn(s) / top) * 100]); };
const asPoints = (fn) => speeds.map((s) => [s, fn(s)]);
const rpmToRadS = (2 * Math.PI) / 60;

// Lower voltage scales free speed and stall torque together, so the line keeps its slope.
const torqueLine = (volts) => [[0, CIM.stallNm * (volts / CIM.volts)], [CIM.freeRpm * (volts / CIM.volts), 0]];
const LOAD_NM = 0.6; // A round example, picked for the plot.
const rpmAtLoad = (volts) => CIM.freeRpm * (volts / CIM.volts - LOAD_NM / CIM.stallNm);
const loadA = LOAD_NM / Kt; // DCMotor.getCurrent(torqueNm)

// Real motors. The numbers are WPILib DCMotor at v2026.2.1 ---------------------------------------
const MOTORS = [
  { name: 'CIM', freeRpm: 5310, freeA: 2.7, stallNm: 2.42, stallA: 133 },
  { name: 'NEO', freeRpm: 5676, freeA: 1.8, stallNm: 2.6, stallA: 105 },
  { name: 'NEO Vortex', freeRpm: 6784, freeA: 3.6, stallNm: 3.6, stallA: 211 },
  { name: 'Kraken X60', freeRpm: 6000, freeA: 2, stallNm: 7.09, stallA: 366 },
];
const motorPeakW = (m) => m.stallNm * radS(m.freeRpm) / 4;
const ampsAtPeak = (m) => (m.stallA + m.freeA) / 2;
const nmPerAmp = (m) => m.stallNm / m.stallA;
const [mCim, mNeo, mVortex, mKraken] = MOTORS;

// KitBot gearing, worked by hand ------------------------------------------------------------------
const wheelRpm = CIM.freeRpm / BOT.gear;
const wheelNm = CIM.stallNm * BOT.gear;
const wheelTurnM = 2 * Math.PI * BOT.wheelM;
const wheelTurnIn = 6 * Math.PI;
const topMs = (wheelRpm / 60) * wheelTurnM;
const topFts = topMs / 0.3048;
const FIRST_MS = 3.87, FIRST_FTS = 12.7; // KitBot build guide: "~12.7 feet per second (3.87 m/s)"
const realShare = Math.round((FIRST_MS / topMs) * 100);
const wpilibSimMs = 5.118; // Measured: DifferentialDrivetrainSim.createKitbotSim, 12 V for 10 s
const altMs = 3.956; // Measured: MotorCheck's expression, run in a JUnit test with withReduction(10.71)
if (Math.abs(altMs - (CIM.freeRpm / 10.71 / 60) * wheelTurnM) > 0.001) throw new Error('MotorCheck answer drifted');
if (Math.abs(wpilibSimMs - (12 * Kv * BOT.wheelM) / BOT.gear) > 0.001) throw new Error('sim top speed drifted');

// Battery: a voltage behind a resistance, and the same two batteries as Deck 3 --------------------
const FRESH = { volts: 12.9, ohms: 0.022 }, TIRED = { volts: 12.3, ohms: 0.035 };
const BROWNOUT_V = 6.3, ROBORIO2_V = 6.75;
const sagLine = (b) => { const end = Math.min(400, b.volts / b.ohms); return [[0, b.volts], [end, b.volts - b.ohms * end]]; };
const ampsAtBrownout = (b) => (b.volts - BROWNOUT_V) / b.ohms;

// All four CIMs at full stick from a stop. With a limit, the SPARKs cut duty until motor current holds.
function launch(b, limitA = Infinity) {
  const n = BOT.motors;
  if (limitA !== Infinity) {
    const motorV = limitA * R;
    const disc = b.volts ** 2 - 4 * b.ohms * n * limitA * motorV;
    if (disc >= 0) {
      const bus = (b.volts + Math.sqrt(disc)) / 2;
      if (motorV <= bus) return { bus, amps: (n * limitA * motorV) / bus, motorA: limitA };
    }
  }
  const bus = b.volts / (1 + (n * b.ohms) / R);
  return { bus, amps: (n * bus) / R, motorA: bus / R };
}
const freshRaw = launch(FRESH), tiredRaw = launch(TIRED);
const freshLimit = launch(FRESH, LIMIT_A), tiredLimit = launch(TIRED, LIMIT_A);
if (freshRaw.bus <= BROWNOUT_V || tiredRaw.bus >= BROWNOUT_V) throw new Error('battery story no longer matches the model');
if (Math.abs(tiredLimit.bus - tiredRaw.bus) > 1e-9) throw new Error('tired battery story no longer matches the model');

// Choosing a limit: the current where the wheels slip. Same steps as DriveLimits.slipAmps ---------
const GRIP = 1, GRAVITY = 9.81;
const slipForceN = GRIP * BOT.massKg * GRAVITY;
const slipMotorNm = (slipForceN * BOT.wheelM) / (BOT.motors * BOT.gear);
const slipA = slipMotorNm / Kt;

// The gotcha layout takes a string, so this reads the same compiled region a src would.
function region(file, name) {
  const text = readFileSync(resolve(file), 'utf8').split('\n');
  const open = text.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  if (open < 0 || close < 0) throw new Error(`no region ${name} in ${file}`);
  const body = text.slice(open + 1, close);
  const indent = Math.min(...body.map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(indent)).join('\n');
}

export default {
  no: 8, short: 'Understanding motors', title: 'Understanding motors: how to read a motor curve', minutes: 30,
  description: 'Reading motor curves, gearing, heat, battery sag, current limits and voltage compensation, using the KitBot.',
  slides: [
    L.cover({ title: 'Understanding motors: read the curve', subtitle: 'Why your robot speeds up, slows down, heats up and browns out', minutes: 30,
      notes: '(30 s) You have driven a KitBot. Today we look at the part that moves it. By the end you can read a motor curve, the chart every motor maker publishes. You will also know why a battery sags, and what a current limit really does. The math is multiplying and dividing. Everything here is for the 2026 season and the roboRIO.' }),

    L.points({ id: 'outcomes', eyebrow: 'Outcomes', title: 'What you will be able to do', items: [
      'Say what **voltage** does to a motor, and what **current** does.',
      'Read free speed, free current, stall torque and stall current off a motor curve.',
      'Work out a robot\'s top speed from its gearing, by hand.',
      'Explain why a stalled motor heats up, and why the battery sags.',
      'Tell **motor current** from **battery current**, and choose a current limit.',
    ], notes: '(30 s) Read these quickly. The second one is the goal of the session: if you can find those four numbers on a chart, you can read any motor. The last one is where most teams get confused, so we build up to it slowly. Everything uses the KitBot, because you already know how it feels to drive one. If you are short on time, keep the curve slides and the current limit slides.' }),

    L.diagram({ id: 'model', eyebrow: 'Mental model', title: 'Voltage sets speed, current sets torque',
      caption: 'Schematic. The loop settles when push-back leaves just enough current to carry the load.',
      nodes: [
        { id: 'volts', x: 128, y: 290, w: 300, h: 170, label: 'Voltage', sub: 'how fast it wants to spin', tone: 'blue' },
        { id: 'back', x: 556, y: 290, w: 300, h: 170, label: 'Minus push-back', sub: 'it is also a generator', tone: 'ghost' },
        { id: 'amps', x: 984, y: 290, w: 300, h: 170, label: 'Current', sub: 'whatever gets through', tone: 'accent' },
        { id: 'torque', x: 1492, y: 290, w: 300, h: 170, label: 'Torque', sub: 'how hard it twists', tone: 'ink' },
        { id: 'speed', x: 984, y: 610, w: 300, h: 170, label: 'Speed', sub: 'climbs as torque beats the load', tone: 'paper' },
      ],
      edges: [
        { from: 'volts', to: 'back' }, { from: 'back', to: 'amps' },
        { from: 'amps', to: 'torque' },
        { from: 'torque', to: 'speed', fromSide: 'b', toSide: 'r', route: 'vh', label: 'torque spins it up', lx: 1330, ly: 640, lw: 300 },
        { from: 'speed', to: 'back', fromSide: 'l', toSide: 'b', route: 'hv', label: 'more speed, more push-back', lx: 590, ly: 716, lw: 380 },
      ],
      notes: '(2 min) Here is the whole deck on one slide. Voltage is how fast the motor wants to spin. Current is how hard it is pushing. The surprise is the second box: a spinning motor is also a generator, so it pushes back against the battery. The proper name is back EMF. Stopped, nothing pushes back, so lots of current flows. As speed climbs, push-back grows and current falls. Think of starting a bike in a high gear: a huge shove at first, then less and less as you get moving. If a kid asks: yes, that loop is real feedback, built into the physics.' }),

    L.plot({ id: 'curve', eyebrow: 'Motor curves', title: 'Anatomy of a motor curve: a CIM at 12 V', xLabel: 'Speed (RPM)', yLabel: 'Percent of each line\'s maximum', xDomain: [0, CIM.freeRpm], yDomain: [0, 100], xTicks: quarterTicks, yTicks: [0, 25, 50, 75, 100],
      alt: 'Motor curve for a CIM. Torque and current fall in a straight line from their stall values at zero speed to almost nothing at free speed. Power is a hump that peaks at half speed.',
      series: [
        { name: 'Torque', color: 'orange', points: asPercent(torqueAt), tag: { x: 3000, y: 34 } },
        { name: 'Current', color: 'blue', dash: true, points: asPercent(ampsAt), tag: { x: 250, y: 66 } },
        { name: 'Power', color: 'green', points: asPercent(wattsOut), tag: { x: 3900, y: 92 } },
      ],
      callouts: [
        { title: 'Stall: left edge', text: `Stuck at 0 RPM: **${CIM.stallNm} Nm** of torque and **${CIM.stallA} A**.` },
        { title: 'Free speed: right edge', text: `**${CIM.freeRpm} RPM** with nothing attached, and no torque left.` },
        { title: 'Free current', text: `**${CIM.freeA} A** at free speed. That just beats friction.` },
        { title: 'Two straight lines', text: 'Current makes torque, so the two fall together.' },
      ],
      notes: `(2 min) This is a motor curve, for the CIM on your KitBot. Speed runs along the bottom. Each line is a percent of its own biggest value, because they have different units. Now find four numbers. Left edge: stall, the motor is stuck, ${CIM.stallNm} newton metres and ${CIM.stallA} amps. Right edge: free speed, ${CIM.freeRpm} RPM, and ${CIM.freeA} amps. Those come from WPILib's DCMotor class, and the lines are drawn straight between them, so this is a model and not a test result. If you find a chart with different axes, look for the same four numbers at the ends of its lines.` }),

    L.plot({ id: 'power', eyebrow: 'Motor curves', title: 'Peak power sits at half speed', xLabel: 'Speed (RPM)', yLabel: 'Power out (W)', xDomain: [0, CIM.freeRpm], yDomain: [0, 400], xTicks: quarterTicks, yTicks: [0, 100, 200, 300, 400], refs: [{ y: peakW, label: `Peak: ${Math.round(peakW)} W` }],
      alt: `Power out of a CIM against speed. It is zero at stall and at free speed, and peaks at about ${Math.round(peakW)} watts at half speed.`,
      series: [{ name: 'Power out of one CIM', color: 'orange', points: asPoints(wattsOut), tag: { x: 2150, y: 250, w: 280 } }],
      callouts: [
        { title: 'The formula', text: `Power = torque × speed, with speed in radians per second (RPM × ${rpmToRadS.toFixed(3)}).` },
        { title: 'Stall', text: 'All torque, no speed: 0 W.' },
        { title: 'Free speed', text: 'All speed, no torque: 0 W.' },
        { title: 'Half speed', text: `Half of each: ${(CIM.stallNm / 2).toFixed(2)} Nm × ${Math.round(radS(halfRpm))} rad/s = **${Math.round(peakW)} W**.` },
      ],
      notes: `(1.5 min) Power is how fast a motor does work. It is torque times speed, in radians per second. At stall you have torque but no speed, so zero. At free speed you have speed but no torque, also zero. Torque falls as speed rises, so the biggest product is in the middle: half torque times half speed. For a CIM that is ${Math.round(peakW)} watts at ${Math.round(halfRpm)} RPM. Try a kid's guess: at three quarters speed you get three quarters of the speed but one quarter of the torque, ${Math.round(wattsOut(CIM.freeRpm * 0.75))} watts. Peak power is not a place to sit, as we will see when we look at heat.` }),

    L.plot({ id: 'voltage-curves', eyebrow: 'Control theory', title: 'Voltage slides the curve, load picks the point', xLabel: 'Speed (RPM)', yLabel: 'Torque (Nm)', xDomain: [0, CIM.freeRpm], yDomain: [0, 2.5], xTicks: quarterTicks, yTicks: [0, 0.5, 1, 1.5, 2, 2.5], refs: [{ y: LOAD_NM, label: `Load: ${LOAD_NM} Nm` }],
      alt: 'Torque against speed for a CIM at 12, 9 and 6 volts. The three straight lines are parallel. A flat load line crosses them at three different speeds.',
      series: [
        { name: '12 V', color: 'orange', points: torqueLine(12), tag: { x: 2900, y: 1.5 } },
        { name: '9 V', color: 'blue', dash: true, points: torqueLine(9), tag: { x: 1300, y: 1.55 } },
        { name: '6 V', color: 'green', points: torqueLine(6), tag: { x: 150, y: 0.92 } },
      ],
      callouts: [
        { title: 'Your stick', text: '`set(0.5)` on a 12 V battery gives the motor 6 V.' },
        { title: 'Same slope', text: 'Less voltage moves the line down. Its shape stays.' },
        { title: 'Load picks the point', text: `The motor runs where the lines cross: ${Math.round(rpmAtLoad(12))} RPM at 12 V, ${Math.round(rpmAtLoad(6))} RPM at 6 V.` },
        { title: 'Same torque, same amps', text: `That ${LOAD_NM} Nm takes ${Math.round(loadA)} A on all three lines.` },
      ],
      notes: `(1.5 min) This is the mental model drawn as a chart. Each line is the same CIM at a different voltage, so moving the stick slides the whole line. The flat dashed line is an example load we picked, ${LOAD_NM} newton metres. A motor settles where its line crosses the load. Look along the dashed line: same torque, same current, about ${Math.round(loadA)} amps, at three different speeds. Voltage changed the speed. The load decided the current. That is why a robot pushing a wall pulls huge current while going nowhere. In control theory this is the plant: what the motor does with the voltage you send it.` }),

    L.table({ id: 'real-numbers', eyebrow: 'Motor curves', title: 'Reading real numbers: four FRC motors', columns: ['Motor', 'Free speed (RPM)', 'Free current (A)', 'Stall torque (Nm)', 'Stall current (A)', 'Peak power (W)'], widths: [24, 16, 15, 15, 15, 15], fontSize: 28,
      rows: MOTORS.map((m) => [m.name, String(m.freeRpm), String(m.freeA), String(m.stallNm), String(m.stallA), String(Math.round(motorPeakW(m)))]),
      caption: 'From WPILib `DCMotor` at v2026.2.1. The Kraken row is the non-FOC entry. Peak power here is stall torque × free speed ÷ 4.',
      notes: `(1.5 min) Same four numbers, four motors. Ask: which is strongest? Kraken, at ${mKraken.stallNm} newton metres. Which uses the least current for its torque? NEO, at ${nmPerAmp(mNeo).toFixed(3)} newton metres per amp against ${nmPerAmp(mCim).toFixed(3)} for a CIM. Stall current is a warning, not a target. Peak power sits at half speed, so it takes about half of stall current: ${Math.round(ampsAtPeak(mCim))} amps for a CIM and ${Math.round(ampsAtPeak(mKraken))} for a Kraken. A 40 amp breaker won't let you stay there. REV quotes 406 watts for the NEO, and ours is the straight-line estimate. FOC, in Deck 7, is a second set of Kraken numbers.` }),

    L.steps({ id: 'gearing', eyebrow: 'Gearing', title: 'Gearing trades speed for torque: the KitBot', items: [
      { title: 'Start at the motor', text: `${CIM.freeRpm} RPM free speed and ${CIM.stallNm} Nm stall torque.` },
      { title: 'Divide speed by the ratio', text: `${CIM.freeRpm} ÷ ${BOT.gear} = **${Math.round(wheelRpm)} wheel RPM**.` },
      { title: 'Multiply torque by the ratio', text: `${CIM.stallNm} × ${BOT.gear} = **${wheelNm.toFixed(1)} Nm** per CIM at the wheels.` },
      { title: 'One wheel turn rolls one circumference', text: `6 in × π = ${wheelTurnIn.toFixed(2)} in, which is ${wheelTurnM.toFixed(3)} m.` },
      { title: 'Turns per second × distance per turn', text: `${Math.round(wheelRpm)} ÷ 60 × ${wheelTurnM.toFixed(3)} = **${topMs.toFixed(1)} m/s** (${topFts.toFixed(1)} ft/s).` },
      { title: 'Compare with the real robot', text: `FIRST quotes ~${FIRST_FTS} ft/s (${FIRST_MS} m/s), ${realShare}% of this free-speed math.` },
    ], notes: `(2 min) Do this on a whiteboard with them. A gearbox is like the low gear on a bike: your legs spin more, and each push counts for more. ${BOT.gear} to 1 means the wheel turns once for every ${BOT.gear} motor turns. Speed goes down by ${BOT.gear}, torque goes up by ${BOT.gear}. Power stays about the same, apart from losses. Then one wheel turn rolls the robot one circumference. We get ${topMs.toFixed(1)} metres per second. Free speed means no load at all. AndyMark's 12.7 feet per second estimate assumes a loaded CIM at 4100 RPM instead of 5310. Friction and a sagging battery are part of why. Hand math gives you the ceiling.` }),

    L.plot({ id: 'heat', eyebrow: 'Heat', title: 'A stalled motor turns all its power into heat', xLabel: 'Speed (RPM)', yLabel: 'Power (W), one CIM at 12 V', xDomain: [0, CIM.freeRpm], yDomain: [0, 1600], xTicks: quarterTicks, yTicks: [0, 400, 800, 1200, 1600],
      alt: 'Power into a CIM, heat in its windings and power out, against speed. At stall all of the power in becomes heat. Heat falls fast as speed rises.',
      series: [
        { name: 'Power in', color: 'orange', points: asPoints(wattsIn), tag: { x: 2100, y: 1150 } },
        { name: 'Heat', color: 'blue', dash: true, points: asPoints(wattsHeat), tag: { x: 330, y: 620 } },
        { name: 'Power out', color: 'green', points: asPoints(wattsOut), tag: { x: 2900, y: 470 } },
      ],
      callouts: [
        { title: 'At stall', text: `${CIM.volts} V × ${CIM.stallA} A = **${Math.round(stallW)} W** in, and nothing out.` },
        { title: 'Where it goes', text: 'No push-back, so only the copper windings hold the current back. They heat up.' },
        { title: 'At half speed', text: `${Math.round(halfIn)} W in, ${Math.round(halfOut)} W out: ${Math.round((halfOut / halfIn) * 100)}% useful.` },
        { title: 'Current squared', text: 'Half the current means a quarter of the heat.' },
      ],
      notes: `(1.5 min) Computed from the CIM numbers on an ideal 12 volt supply. Power in is volts times amps. Heat in the windings is current squared times resistance, ${R.toFixed(3)} ohms for a CIM. Power out is the hump from before. Near free speed, the little that goes in mostly beats friction. At stall no work comes out, so all ${Math.round(stallW)} watts become heat in a small motor. That is the same job a space heater does. Current squared is the key: heat grows much faster than current, so a modest cut in current saves a lot of heat. REV warns stall heat can damage a motor in a fraction of a second if it is not managed.` }),

    L.plot({ id: 'battery', eyebrow: 'Battery and breakers', title: 'Battery sag and brownouts', xLabel: 'Total current from the battery (A)', yLabel: 'Battery voltage (V)', xDomain: [0, 400], yDomain: [0, 14], xTicks: [0, 100, 200, 300, 400], yTicks: [0, 2, 4, 6, 8, 10, 12, 14], refs: [{ y: BROWNOUT_V, label: `Brownout: ${BROWNOUT_V} V` }],
      alt: 'Battery voltage falls in a straight line as current rises. The tired battery starts lower, falls faster and reaches the brownout line first.',
      series: [
        { name: `Fresh: ${FRESH.volts} V, ${FRESH.ohms} ohms`, color: 'orange', points: sagLine(FRESH), tag: { x: 165, y: 12.4, w: 340 } },
        { name: `Tired: ${TIRED.volts} V, ${TIRED.ohms} ohms`, color: 'blue', dash: true, points: sagLine(TIRED), tag: { x: 12, y: 5.9, w: 340 } },
      ],
      callouts: [
        { title: 'Sag', text: 'Every amp drops voltage inside the battery.' },
        { title: 'Brownout', text: `Below ${BROWNOUT_V} V a roboRIO 1 cuts the motors. A roboRIO 2 defaults to ${ROBORIO2_V} V.` },
        { title: 'Full stick from a stop', text: `No limit, fresh battery: ${Math.round(freshRaw.amps)} A, down to ${freshRaw.bus.toFixed(1)} V.` },
        { title: 'Breakers', text: '120 A main, 40 A per motor. They trip on heat after a delay, so spikes get through.' },
      ],
      notes: `(1.5 min) Computed: each battery is a voltage behind a resistance, the same idea as WPILib's BatterySim, with wiring included. The two batteries are assumptions, the same two as Deck 3. A battery is not a perfect 12 volts: pull more current and the voltage drops. The tired one hits the line at about ${Math.round(ampsAtBrownout(TIRED))} amps, the fresh one at about ${Math.round(ampsAtBrownout(FRESH))}. Our launch number assumes four CIMs and no slip. A brownout is the roboRIO protecting itself: motors stop, then return above 7.5 volts. Breakers protect wires and watch heat over time, so they can't stop a sag. The next slides can.` }),

    L.plot({ id: 'two-currents', eyebrow: 'Current', title: 'Motor current and battery current are different', xLabel: 'Time after full stick (s)', yLabel: 'Current per CIM (A)', xDomain: [0, 1], yDomain: [0, 80], xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 20, 40, 60, 80], refs: [{ y: LIMIT_A, label: `Limit: ${LIMIT_A} A` }],
      alt: `Simulated current in one CIM after a full-stick start with a ${LIMIT_A} amp limit. Motor current holds at the limit while battery current climbs from about ${Math.round(limitBatteryA)} amps to meet it, then both fall together.`,
      series: [
        { name: 'Motor current', color: 'orange', points: ampPts(limited), tag: { x: 0.02, y: 69, w: 220 } },
        { name: 'Battery current', color: 'blue', dash: true, points: batteryPts, tag: { x: 0.08, y: 26, w: 240 } },
      ],
      callouts: [
        { title: 'Motor current', text: 'In the windings. It makes torque and heat.' },
        { title: 'Battery current', text: 'In the wires and breakers. It sags the battery.' },
        { title: 'A gearbox for electricity', text: `${CIM.volts} V × ${Math.round(limitBatteryA)} A in, ${limitVolts.toFixed(1)} V × ${LIMIT_A} A out. Same power.` },
        { title: 'What the SPARK limits', text: 'Motor current. `getOutputCurrent()` reads it too.' },
      ],
      notes: `(2 min) Simulated, not measured: the model from the next slide. A motor controller is a gearbox for electricity. You just saw a gearbox trade speed for torque; a SPARK trades volts for amps. At a stop it switches on ${Math.round(limitDuty * 100)}% of the time, so the motor sees ${limitVolts.toFixed(1)} volts, and ${LIMIT_A} amps in the motor is only ${Math.round(limitBatteryA)} amps from the battery. Both are about ${Math.round(motorW)} watts. REV's rule: battery current equals motor current times duty cycle. REV calls motor current phase current. It stress-tested NEOs up to 80 amp limits behind a 40 amp breaker, and the breaker never tripped. If a kid asks: Talon FX calls these stator and supply current.` }),

    L.plot({ id: 'current-limit', eyebrow: 'Control theory', title: 'What a current limit protects', xLabel: 'Time after full stick (s)', yLabel: 'Current per CIM (A)', xDomain: [0, 1], yDomain: [0, 140], xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 35, 70, 105, 140], refs: [{ y: LIMIT_A, label: `Limit: ${LIMIT_A} A` }],
      alt: 'Simulated current in one CIM after a full-stick start. Without a limit it peaks at 133 amps. With a limit it holds at 60 amps, then falls.',
      series: [
        { name: 'No limit', color: 'orange', points: ampPts(noLimit), tag: { x: 0.1, y: 122 } },
        { name: 'With limit', color: 'blue', dash: true, points: ampPts(limited), tag: { x: 0.42, y: 46 } },
      ],
      callouts: [
        { title: 'The spike', text: `A stopped motor pushes nothing back, so the model starts at ${peak(noLimit)} A.` },
        { title: 'What it protects', text: 'Breakers, battery voltage and CIM heat.' },
        { title: 'The cost', text: `3 m/s takes ${timeTo(limited, 3)} s, not ${timeTo(noLimit, 3)} s.` },
        { title: 'Measure it', text: 'This is a model. Log `getOutputCurrent()` during a short, hard push.' },
      ],
      notes: `(1.5 min) Simulated, not measured. The model is ${MODEL}. The limit is an ideal clamp. The SPARK turns its output down until motor current holds. You pay in acceleration, because less current means less torque, but top speed stays. With battery sag added, this launch stays at about ${freshLimit.bus.toFixed(1)} volts on the fresh battery, not ${freshRaw.bus.toFixed(1)}. A tired battery still falls to ${tiredLimit.bus.toFixed(1)}, so a limit doesn't replace a charged battery. FIRST uses ${LIMIT_A} A to reduce breaker trips and CIM damage. A setting is a request, so check your own log.` }),

    L.codeNotes({ id: 'choose-limit', eyebrow: 'Current', title: 'Choosing a limit: stop where the wheels slip', file: 'DriveLimits.java', src: { file: `${J}/DriveLimits.java`, region: 'choose' }, callouts: [
      { line: 3, title: 'Grip sets the force', text: `Grip × weight. Our ${GRIP.toFixed(1)} and ${BOT.massKg} kg are assumptions.` },
      { line: [4, 5], title: 'Back through the gearing', text: `Shared by ${BOT.motors} CIMs, divided by ${BOT.gear}.` },
      { line: 6, title: 'Torque to amps', text: `${Math.round(slipA)} A per CIM. More just spins the wheels.` },
      { line: 11, title: 'Set the limit', text: `FIRST's ${LIMIT_A} A is close to our number.` },
    ], notes: `(1.5 min) Here is one way to pick a number: ask what the motor needs to do. A drivetrain can only push until the wheels slip, so that force sets the job. Divide it through the gearing to get torque at one motor, then let DCMotor turn torque into amps. We get ${slipA.toFixed(1)} amps. Any more makes heat and wheel spin, not push. WPILib notes many teams gear to slip at 40 to 50 amps per motor. REV's FAQ suggests starting drive motors at 20 amps and raising it until the wheels break traction. For an arm, start from holding torque at the motor instead, as in Deck 6, and add some margin.` }),

    L.plot({ id: 'voltage-comp', eyebrow: 'Control theory', title: 'Voltage compensation makes output repeatable', xLabel: 'Time (s)', yLabel: 'Robot speed (m/s), half stick', xDomain: [0, 2], yDomain: [0, 3], xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 1, 2, 3],
      alt: 'Simulated speed at half stick for two batteries. The compensated curve sits between them and does not depend on the battery.',
      series: [
        { name: '12.8 V, no comp', color: 'orange', points: speedPts(fresh), tag: { x: 1.1, y: 2.98 } },
        { name: '11.2 V, no comp', color: 'blue', points: speedPts(tired), tag: { x: 1.1, y: 2.28 } },
        { name: 'Compensated to 12 V', color: 'green', dash: true, points: speedPts(compensated), tag: { x: 0.62, y: 1.7, w: 300 } },
      ],
      callouts: [
        { title: 'Without it', text: '`set(0.5)` means half of whatever the battery has right now.' },
        { title: `${spreadCm} cm apart`, text: 'That is the gap after 2 s between these two batteries.' },
        { title: 'With it', text: 'The SPARK scales output to 12 V, so both batteries match.' },
        { title: 'The cost', text: 'A little top speed on a full battery. It can\'t add volts.' },
      ],
      notes: `(1 min) Simulated, not measured: the same model as the current limit chart. The two battery voltages are examples we picked. This goes back to the mental model. Voltage sets speed, so if the battery changes, your speed changes. Half stick on 12.8 volts is 6.4 volts, and on 11.2 volts it is 5.6. Voltage compensation makes half mean 6 volts on either. It does not close the loop: the code still has no idea how fast the robot is going. But the same command now does nearly the same thing, which matters most in autonomous. FIRST's KitBot code turns it on for this reason.` }),

    L.gotcha({ id: 'gotcha-readings', title: 'Comparing a motor limit with a PDH reading',
      symptom: `The motor is stalled at a ${LIMIT_A} A limit, but its PDH channel shows about ${Math.round(limitBatteryA)} A. One of them looks wrong.`,
      cause: '`getOutputCurrent()` is motor current. The PDH measures battery current. At low speed they are far apart.',
      fix: 'Compare `getOutputCurrent()` with your limit, and the PDH with your breaker. Log both.',
      code: region(`${J}/CANDriveSubsystem.java`, 'log'),
      notes: `(1 min) Both numbers are right. This is the two-currents chart, seen on a real dashboard. Those ${LIMIT_A} and ${Math.round(limitBatteryA)} amps come from our model for a stalled CIM; yours will differ a little. The applied output line is the duty cycle, so you can check it yourself: multiply it by motor current and you get close to the PDH number. Put these four lines in periodic in your drive subsystem, and watch them in Elastic or AdvantageScope. The PDH channel number depends on your wiring, so look at which slot your SPARK uses.` }),

    L.practice({ id: 'every-motor', title: 'A limit for every motor', rule: 'Give every motor its own limit, chosen for its job.',
      why: 'REV suggests 40 to 60 A for a NEO and 20 to 40 A for a NEO 550. FIRST uses 60 A on KitBot CIMs. In REV\'s stall test a NEO 550 lasted about 27 s at 40 A, and about 2 s at 80 A, the SPARK default.',
      notes: '(30 s) This goes for every motor on the robot, not just the drivetrain. The 80 amp default suits some motors, but not a small one like a NEO 550. REV\'s test held the motor stalled at each limit, and warns those times are not guaranteed, so leave a wide margin. A mechanism that can jam, like an intake or an arm against a hard stop, needs the most care. You can raise a limit later if your logs show the mechanism needs it. Replacing a burnt motor at an event takes much longer.' }),

    L.code({ id: 'check-code', eyebrow: 'WPILib', title: 'Checking your math with `DCMotor`', file: 'MotorCheck.java', src: { file: `${J}/MotorCheck.java`, region: 'check' }, highlight: [3, 6, 7],
      caption: '`withReduction()` gears the motor down, so `freeSpeedRadPerSec` is now wheel speed. Radians per second × radius = metres per second.',
      notes: '(1 min) WPILib already knows these motors. getCIM(2) means two CIMs in one gearbox, which is one side of the KitBot. withReduction applies your ratio, and hands back a new DCMotor with the speed divided and the torque multiplied, the two steps you did by hand. getCurrent with speed zero and 12 volts asks the stall question. You can swap in getNEO or getKrakenX60 and compare motors without touching a robot. The next slide is your turn, so try the paper part before you run this.' }),

    L.exercise({ id: 'exercise', title: 'Predict the KitBot, then check it', minutes: 5, tasks: [
      'Cover the gearing slide. Work out top speed at **8.45:1** from the curve.',
      'Now do **10.71:1**, another ratio WPILib lists for the KitBot chassis.',
      'Write down stall current at 12 V for one CIM, then for all four.',
      'Call `MotorCheck.print()` in `RobotContainer`, then run `WPILib: Simulate Robot Code`.',
      'Set `GEARING` to 10.71 and run it again. Compare with your paper.',
    ], done: `your paper matches the console to two digits, and you can say why FIRST's ${FIRST_MS} m/s is lower.`,
    notes: `(5 min) Work in pairs. Paper first, so the console is the check and not the answer. Answers, from running this DCMotor math: ${topMs.toFixed(2)} m/s, ${altMs.toFixed(2)} m/s, ${CIM.stallA} A, and ${CIM.stallA * BOT.motors} A. Copy the constants from deck8/Constants.java too. Four stalled CIMs can't really pull ${CIM.stallA * BOT.motors} A, because the battery sags first, so ask why. Early finishers: WPILib's DifferentialDrivetrainSim tops out at ${wpilibSimMs.toFixed(2)} m/s at 8.45:1, a little above free speed. Why? It has no friction, so nothing uses the free current. Then try getNEO(2) in place of getCIM(2).` }),

    L.recap({ id: 'recap', items: [
      'Say it: **voltage sets speed, current sets torque**, and the load decides the current.',
      'Find free speed, free current, stall torque and stall current on any motor curve.',
      'Work out top speed by hand, and say why peak power sits at half speed.',
      'Explain stall heat, battery sag and brownouts in your own words.',
      'Tell motor current from battery current, choose a limit, and check it in your logs.',
    ], next: 'Deck 9: driver feel, feedforward and where loops run.',
    notes: '(30 s) Ask for one volunteer per line, in their own words. If nobody can say why a stalled motor gets hot, go back to the push-back loop, because everything else follows from it. Before people leave, ask each team to read their own robot\'s current limits out of their code and say why each number is there. If they can\'t say, that is their next job.' }),

    L.links({ id: 'links', intro: 'Point your phone camera at a code.', items: [
      { label: 'Brownouts and current draw', url: 'https://docs.wpilib.org/en/stable/docs/software/roborio-info/roborio-brownouts.html', short: 'docs.wpilib.org' },
      { label: 'SPARK MAX current limits', url: 'https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin', short: 'docs.revrobotics.com' },
      { label: 'Locked rotor testing', url: 'https://docs.revrobotics.com/brushless/neo/locked-rotor-testing', short: 'docs.revrobotics.com' },
      { label: 'DCMotor Java docs', url: 'https://github.wpilib.org/allwpilib/docs/release/java/edu/wpi/first/math/system/plant/DCMotor.html', short: 'github.wpilib.org' },
    ], notes: '(30 s) Leave this up during the break. The brownout page has a good section on planning a power budget, which is a nice next step for a team that keeps browning out. The REV test data shows how fast a stalled motor fails, and is worth reading before you design an arm. Print the brownout page for your pit if you can.' }),
  ],
};
