// Deck 9: advanced controls. Driver feel, drivetrain feedforward, where the loop runs, S-curves.
// Every curve comes from the models below, and every number on a slide is read from their results,
// read from the Java, or listed in SOURCES.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck9';
const CT = 'Control theory';
const CODE = 'Programming';

const fix = (x, n = 1) => x.toFixed(n);
const must = (ok, why) => { if (!ok) throw new Error(`deck 9 story no longer matches the model: ${why}`); };

// Numbers that also live in the Java are read from it, so a slide can't drift from the code.
const JAVA = readFileSync(resolve(`${J}/Constants.java`), 'utf8');
const inGroup = (group) => JAVA.slice(JAVA.indexOf(`class ${group}`));
function java(group, name) {
  const m = inGroup(group).match(new RegExp(`double ${name} = (-?[0-9.]+)`));
  must(m, `${name} is not a plain number in ${group}`);
  return Number(m[1]);
}
function javaDeg(group, name) {
  const m = inGroup(group).match(new RegExp(`${name} = Units\\.degreesToRadians\\((-?[0-9.]+)\\)`));
  must(m, `${name} is not in degrees in ${group}`);
  return Number(m[1]);
}
const OP = 'OperatorConstants', SP = 'SpeedConstants', AC = 'ArmConstants';
const DEADBAND = java(OP, 'DEADBAND');
const DRIVE_SCALE = java(OP, 'DRIVE_SCALE');
const EXPONENT = java(OP, 'STICK_EXPONENT');
const SLEW_PER_S = java(OP, 'FORWARD_SLEW_PER_SEC');

// The stick -------------------------------------------------------------------------------------
// Same formulas as MathUtil.applyDeadband and MathUtil.copyDirectionPow, on inputs from 0 to 1.
const applyDeadband = (x, d) => (Math.abs(x) < d ? 0 : (1 + d / (1 - d)) * (x - d));
const curve = (exp) => Array.from({ length: 101 }, (_, i) => [i / 100, (i / 100) ** exp]);

// First-order drivetrain model from Deck 2, unchanged. Every curve on the slew slide comes from it.
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
// The limiter updates once per 20 ms loop, like the real SlewRateLimiter inside a command.
const slewed = (rate) => (t) => 12 * Math.min(1, (Math.floor(t / 0.02) + 1) * 0.02 * rate);
const speedPts = (run) => run.map((p) => [p.t, p.speed]);
const peakAmps = (run) => Math.round(Math.max(...run.map((p) => p.amps)));

const step = simulate({ volts: () => 12, seconds: 1.2 });
const slew3 = simulate({ volts: slewed(3), seconds: 1.2 });
const slew15 = simulate({ volts: slewed(1.5), seconds: 1.2 });

const MODEL = 'four CIMs from WPILib DCMotor.getCIM, 8.45:1 gearing, 6 inch wheels and an assumed 50 kg robot, with no friction, wheel slip or battery sag';

// The same robot with friction and a push, under a 20 ms loop. DriveSim.java does the same in Java.
const TRUE = {
  kS: java(SP, 'FRICTION_VOLTS'),
  kV: BOT.gear / (Kv * BOT.wheelM), // volts to hold 1 m/s: back-EMF through the gearing
  kA: (R * BOT.wheelM * BOT.massKg) / (BOT.motors * BOT.gear * Kt), // volts to add 1 m/s^2
};
const GAINS = { kS: java(SP, 'KS'), kV: java(SP, 'KV'), kA: java(SP, 'KA'), kP: java(SP, 'KP') };
must(fix(TRUE.kV, 2) === fix(GAINS.kV, 2), 'KV in Constants should round to the physics value');
must(fix(TRUE.kA, 2) === fix(GAINS.kA, 2), 'KA in Constants should round to the physics value');
must(TRUE.kS === GAINS.kS, 'KS in Constants should match the friction in the simulated robot');

const TEST_MPS = java(SP, 'TEST_SPEED_MPS');
const RAMP_MPS2 = java(SP, 'MAX_ACCEL_MPS2');
const PUSH_N = java(SP, 'PUSH_NEWTONS');
const STOPPED = java(SP, 'STOPPED_MPS');
const LOOP = 0.02;
const VOLTS_PER_NEWTON = ((R / BOT.motors) * BOT.wheelM) / (BOT.gear * Kt);

// Friction and the push each cost volts. Same rule as DriveSim.afterLosses.
function afterLosses(volts, speed, pushN) {
  const drive = volts - pushN * VOLTS_PER_NEWTON;
  if (Math.abs(speed) > STOPPED) return drive - TRUE.kS * Math.sign(speed);
  return Math.abs(drive) > TRUE.kS ? drive - TRUE.kS * Math.sign(drive) : 0;
}
// One 20 ms loop of the robot, in 1 ms steps, holding the volts constant.
function advance(speed, volts, pushN) {
  let v = speed, dist = 0;
  for (let i = 0; i < 20; i++) {
    const motorRadS = v * BOT.gear / BOT.wheelM;
    const amps = (afterLosses(volts, v, pushN) - motorRadS / Kv) / R;
    v += ((BOT.motors * BOT.gear * Kt * amps) / (BOT.wheelM * BOT.massKg)) * DT;
    dist += Math.abs(v) * DT;
  }
  return { speed: v, dist };
}
// Port of SimpleMotorFeedforward.calculateWithVelocities at v2026.2.1.
function feedforward({ kS, kV, kA }, last, next) {
  if (kA < 1e-9) return kS * Math.sign(next) + kV * next;
  const A = -kV / kA, B = 1 / kA, Ad = Math.exp(A * LOOP);
  const Bd = A > -1e-9 ? B * LOOP : ((Ad - 1) / A) * B;
  return kS * Math.sign(last) + (next - Ad * last) / Bd;
}
// holdSpeed from VelocityDriveSubsystem: the goal ramps up, and the push arrives at 2 s.
function speedRun({ kS = 0, kV = 0, kA = 0, kP = 0, seconds = 4, pushAt = 2 }) {
  let speed = 0, goal = 0, last = 0;
  const out = [];
  for (let k = 0; k < Math.round(seconds / LOOP); k++) {
    const t = k * LOOP;
    const next = goal + Math.max(-RAMP_MPS2 * LOOP, Math.min(RAMP_MPS2 * LOOP, TEST_MPS - goal));
    const ffVolts = feedforward({ kS, kV, kA }, last, next);
    const volts = Math.max(-12, Math.min(12, ffVolts + kP * (next - speed)));
    out.push({ t, speed, volts, ffVolts });
    speed = advance(speed, volts, t >= pushAt ? PUSH_N : 0).speed;
    goal = next;
    last = next;
  }
  return out;
}
const atTime = (run, t) => run[Math.round(t / LOOP)].speed;
const FF = { kS: GAINS.kS, kV: GAINS.kV, kA: GAINS.kA };
const pOnly = speedRun({ kP: GAINS.kP });
const ffOnly = speedRun({ ...FF });
const ffP = speedRun({ ...FF, kP: GAINS.kP });
const before = 1.98, after = 3.98; // just before the push, and long after it
const spd = {
  pBefore: atTime(pOnly, before), pAfter: atTime(pOnly, after),
  ffBefore: atTime(ffOnly, before), ffAfter: atTime(ffOnly, after),
  bothBefore: atTime(ffP, before), bothAfter: atTime(ffP, after),
};
const speedSeries = (run) => run.map((x) => [x.t, x.speed]);

// What the real Java did in headless WPILib simulation. See SOURCES.md for how it was run.
const MEASURED = { pBefore: 1.318, pAfter: 1.211, ffBefore: 1.996, ffAfter: 1.615, bothBefore: 1.999, bothAfter: 1.892 };
Object.entries(MEASURED).forEach(([k, v]) => must(Math.abs(spd[k] - v) < 0.01, `${k}: model ${fix(spd[k], 3)}, Java ${v}`));
must(spd.pBefore < TEST_MPS - 0.5, 'P alone should stop well short of the goal');
must(spd.ffBefore - spd.ffAfter > 0.3, 'feedforward alone should lose speed to the push');
must(spd.bothBefore - spd.bothAfter < 0.15, 'feedforward plus P should barely lose speed');

// Where a cubed, scaled stick first beats friction, in this model.
const firstMoveStick = (() => {
  const curved = (TRUE.kS / 12 / DRIVE_SCALE) ** (1 / EXPONENT);
  return curved * (1 - DEADBAND) + DEADBAND;
})();

// SysId's two tests on the same robot, then SysId's own fit. Defaults are from SysIdRoutine.Config.
const SYSID = { rampVPerS: 1, stepVolts: 7, slowSeconds: 6, fastSeconds: 1.5 };
function sysIdTest(voltsAt, seconds) {
  let speed = 0, distance = 0;
  const rows = [];
  for (let k = 0; k < Math.round(seconds / LOOP); k++) {
    const u = voltsAt(k * LOOP);
    const r = advance(speed, u, 0);
    rows.push({ v: speed, u, next: r.speed });
    speed = r.speed;
    distance += r.dist;
  }
  return { rows, distance, peak: Math.max(...rows.map((x) => x.next)) };
}
const slowTest = sysIdTest((t) => SYSID.rampVPerS * t, SYSID.slowSeconds);
const fastTest = sysIdTest(() => SYSID.stepVolts, SYSID.fastSeconds);
function fitSysId(rows) {
  // Least squares on next = alpha * v + beta * u + gamma * sign(v), as the SysId tool does.
  const a = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  rows.filter((r) => r.v > 0.05).forEach((r) => {
    const x = [r.v, r.u, 1];
    for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) a[i][j] += x[i] * x[j]; a[i][3] += x[i] * r.next; }
  });
  for (let p = 0; p < 3; p++) {
    let m = p;
    for (let i = p; i < 3; i++) if (Math.abs(a[i][p]) > Math.abs(a[m][p])) m = i;
    [a[p], a[m]] = [a[m], a[p]];
    for (let i = 0; i < 3; i++) if (i !== p) { const f = a[i][p] / a[p][p]; for (let j = p; j < 4; j++) a[i][j] -= f * a[p][j]; }
  }
  const [alpha, beta, gamma] = [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
  return { kV: (1 - alpha) / beta, kS: -gamma / beta, kA: ((alpha - 1) * LOOP) / (beta * Math.log(alpha)) };
}
const fit = fitSysId([...slowTest.rows, ...fastTest.rows]);
must(Math.abs(fit.kV - TRUE.kV) < 0.02 && Math.abs(fit.kA - TRUE.kA) < 0.02 && Math.abs(fit.kS - TRUE.kS) < 0.05, 'the fit should recover the model');
// The real SysIdRoutine in the same headless run. See SOURCES.md.
const JAVA_FIT = { kS: 1.027, kV: 2.337, kA: 0.556 };
must(Math.abs(fit.kS - JAVA_FIT.kS) < 0.05 && Math.abs(fit.kV - JAVA_FIT.kV) < 0.02 && Math.abs(fit.kA - JAVA_FIT.kA) < 0.02, 'the Java and model fits should agree');
const slowPts = slowTest.rows.filter((r) => r.v <= 2).map((r) => [r.v, r.u]); // the plot's x axis stops at 2
const fitLine = [[0, fit.kS], [2, fit.kS + 2 * fit.kV]];

// Deck 6's example arm ---------------------------------------------------------------------------
// NEO constants from WPILib DCMotor.getNEO() at v2026.2.1.
const NEO = { volts: 12, stallTorque: 2.6, stallAmps: 105, freeAmps: 1.8, freeRpm: 5676 };
const OHMS = NEO.volts / NEO.stallAmps;
const FREE_RAD_S = (NEO.freeRpm * Math.PI) / 30;
const MOTOR_KV = FREE_RAD_S / (NEO.volts - OHMS * NEO.freeAmps); // rad/s per volt
const MOTOR_KT = NEO.stallTorque / NEO.stallAmps; // newton metres per amp

// A uniform bar, the same shape SingleJointedArmSim assumes.
const ARM = { gearing: java(AC, 'GEAR_RATIO'), lengthM: java(AC, 'ARM_LENGTH_METERS'), massKg: java(AC, 'ARM_MASS_KG'), gravity: 9.8, minDeg: -30, maxDeg: 110 };
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

// P on Deck 6's arm. The motor gets one voltage per loop, and the encoder reading is one loop old.
function armRun({ kP, startDeg = ARM.minDeg, goalDeg = 45, seconds = 3, loopSeconds = 0.02 }) {
  const stepsPerLoop = Math.max(1, Math.round(loopSeconds / 0.001));
  const h = loopSeconds / stepsPerLoop;
  const goal = rad(goalDeg);
  let theta = rad(startDeg), omega = 0;
  const seen = [], out = [];
  for (let k = 0; k <= Math.round(seconds / loopSeconds); k++) {
    seen.push(theta);
    const measured = seen[Math.max(0, seen.length - 2)];
    const volts = clamp(kP * (goal - measured), -NEO.volts, NEO.volts);
    out.push({ t: k * loopSeconds, deg: deg(theta) });
    for (let i = 0; i < stepsPerLoop; i++) {
      const a1 = armAccel(theta, omega, volts);
      const a2 = armAccel(theta + (h / 2) * omega, omega + (h / 2) * a1, volts);
      const a3 = armAccel(theta + (h / 2) * (omega + (h / 2) * a1), omega + (h / 2) * a2, volts);
      const a4 = armAccel(theta + h * (omega + (h / 2) * a2), omega + h * a3, volts);
      theta += (h / 6) * (omega + 2 * (omega + (h / 2) * a1) + 2 * (omega + (h / 2) * a2) + (omega + h * a3));
      omega += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
      if (theta <= rad(ARM.minDeg)) { theta = rad(ARM.minDeg); omega = 0; }
      if (theta >= rad(ARM.maxDeg)) { theta = rad(ARM.maxDeg); omega = 0; }
    }
  }
  return out;
}
const GOAL = 45;
const HOT_KP = 50;
const slowLoop = armRun({ kP: HOT_KP });
const fastLoop = armRun({ kP: HOT_KP, loopSeconds: 0.001 });
const lastHalfSecond = (run) => { const end = run[run.length - 1].t; return run.filter((x) => x.t >= end - 0.5); };
const swingDeg = (run) => { const d = lastHalfSecond(run).map((x) => x.deg); return Math.max(...d) - Math.min(...d); };
const finalDeg = (run) => { const d = lastHalfSecond(run); return d.reduce((a, x) => a + x.deg, 0) / d.length; };
const settle = (run, goal, band = 2) => {
  for (let i = run.length - 1; i >= 0; i--) if (Math.abs(run[i].deg - goal) > band) return i === run.length - 1 ? Infinity : run[i + 1].t;
  return 0;
};
const fastSettle = settle(fastLoop, GOAL);
must(swingDeg(slowLoop) > 20, `kP ${HOT_KP} at 20 ms should still be swinging after 3 s`);
must(swingDeg(fastLoop) < 1, `kP ${HOT_KP} at 1 ms should settle`);

const SPARK_P_EQUIVALENT = (30 / NEO.volts) * ((2 * Math.PI) / ARM.gearing); // Deck 6's kP 30

// Trapezoid and S-curve --------------------------------------------------------------------------
// Port of WPILib TrapezoidProfile.calculate(t, current, goal), as in Deck 6.
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
const PROFILE = { maxV: java(AC, 'MAX_VELOCITY_RAD_PER_S'), maxA: java(AC, 'MAX_ACCEL_RAD_PER_S2') };
const SWING = { from: javaDeg(AC, 'SOFT_MIN_RAD'), to: javaDeg(AC, 'SOFT_MAX_RAD') };
const JERK = 30; // rad/s^3, picked for this example: the push builds over MAX_ACCEL / JERK seconds
const JERK_S = PROFILE.maxA / JERK;
const PROFILE_DT = 0.001;
const trapSpeeds = (() => {
  const start = { pos: rad(SWING.from), vel: 0 }, goal = { pos: rad(SWING.to), vel: 0 };
  const out = [];
  for (let k = 0; k <= Math.round(3 / PROFILE_DT); k++) out.push(trapezoid(k * PROFILE_DT, start, goal, PROFILE.maxV, PROFILE.maxA).vel);
  return out;
})();
// Limiting jerk is the same as averaging the trapezoid's speed over a window MAX_ACCEL / JERK wide.
const sCurveSpeeds = (() => {
  const w = Math.round(JERK_S / PROFILE_DT);
  let sum = 0;
  return trapSpeeds.map((v, k) => { sum += v - (k >= w ? trapSpeeds[k - w] : 0); return sum / w; });
})();
const moveTime = (speeds) => { let i = speeds.length - 1; while (i > 0 && speeds[i] < 1e-6) i--; return (i + 1) * PROFILE_DT; };
const distance = (speeds) => speeds.reduce((a, v) => a + v * PROFILE_DT, 0);
const trapTime = moveTime(trapSpeeds), sCurveTime = moveTime(sCurveSpeeds);
must(Math.abs(distance(trapSpeeds) - distance(sCurveSpeeds)) < 1e-3, 'both profiles should cover the same distance');
must(Math.abs(sCurveTime - trapTime - JERK_S) < 0.005, 'the S-curve should take one jerk window longer');
must(Math.max(...sCurveSpeeds) > PROFILE.maxV - 1e-6, 'this move should still reach cruise speed');
const profilePts = (speeds) => speeds.filter((_, k) => k % 10 === 0).slice(0, 181).map((v, i) => [i * 0.01, deg(v)]);

export default {
  no: 9, short: 'Advanced controls', title: 'Advanced controls: driver feel, feedforward and where loops run', minutes: 35,
  description: 'Input shaping, drivetrain feedforward and closed-loop speed, SysId, loops on the controller, and S-curve motion.',
  slides: [
    L.cover({ title: 'Advanced controls', subtitle: 'Driver feel, drivetrain feedforward, where the loop runs, and smoother motion', minutes: 35,
      notes: '(30 s) This is the deeper deck, and you still need no math past algebra. You have driven a robot and tuned an arm. Today we make the driving feel good, make the drivetrain hit the speed you asked for, decide where a control loop should run, and smooth out motion. Every idea starts as a picture, then the numbers. Everything here is for the 2026 season and the roboRIO.' }),

    L.cards({ id: 'outcomes', eyebrow: 'Today', title: 'What you can do after this deck', items: [
      { icon: 'Settings', title: 'Shape the stick', text: 'Add a deadband, a curve and a slew-rate limit, in the right order.' },
      { icon: 'Lightning', title: 'Predict the volts', text: 'Use kS, kV and kA on a drivetrain, and know what SysId measures.' },
      { icon: 'Clock', title: 'Place the loop', text: 'Choose between 20 ms on the roboRIO and 1 ms on the controller.' },
      { icon: 'Activity', title: 'Smooth the motion', text: 'Tell an S-curve from a trapezoid, and know what comes after PID.' },
    ], notes: '(30 s) Four parts, and the first two get the most time. Part one is what a driver feels, and it ends with hands on a robot. Part two is the same control theory as the arm, on a drivetrain, and it ends in the simulator. Parts three and four are shorter. If you are short on time, keep both exercises and shorten the S-curve.' }),

    L.plot({ id: 'deadband', section: 'Driver feel: deadband, stick curves, slew-rate limits and their order', eyebrow: CT, title: 'A deadband ignores a stick that rests off zero',
      alt: `Output against stick position near center. Both lines stay at zero up to ${DEADBAND}. A plain cut-off then jumps to ${DEADBAND}. applyDeadband rises smoothly from zero.`,
      xLabel: 'Stick position', yLabel: 'Output', xDomain: [0, 0.4], yDomain: [0, 0.4], xTicks: [0, DEADBAND, 0.2, 0.3, 0.4], yTicks: [0, 0.1, 0.2, 0.3, 0.4],
      series: [
        { name: 'Plain cut-off', color: 'orange', points: [[0, 0], [DEADBAND, 0], [DEADBAND, DEADBAND], [0.4, 0.4]], tag: { x: 0.1, y: 0.25, w: 200 } },
        { name: 'applyDeadband', color: 'blue', dash: true, points: Array.from({ length: 41 }, (_, i) => [i / 100, applyDeadband(i / 100, DEADBAND)]), tag: { x: 0.26, y: 0.14, w: 240 } },
      ],
      callouts: [
        { title: 'What it does', text: `Anything under ${DEADBAND} becomes 0, so a resting stick can't creep the robot.` },
        { title: 'No jump', text: `Past ${DEADBAND}, \`applyDeadband\` starts again from 0.` },
        { title: 'The cut-off', text: `A plain \`if\` leaps from 0 to ${fix(DEADBAND * 100, 0)}% of full output.` },
        { title: 'Full stick', text: `Both still reach ${fix(applyDeadband(1, DEADBAND), 0)} at the top of the stick.` },
      ],
      notes: `(1 min) Picture the free play in a bike's brake lever: you move it a little and nothing happens yet. A deadband builds that in on purpose. A gamepad stick rarely rests at exactly zero, and without a deadband a resting stick can creep the robot. These lines are exact math, the same formula as MathUtil.applyDeadband. Look at the orange jump: a plain if statement goes from nothing to ${fix(DEADBAND * 100, 0)} percent in one step. applyDeadband starts again from zero, so the first bit of real movement is gentle.` }),

    L.plot({ id: 'shaping', eyebrow: CT, title: 'Input shaping gives the stick fine control', xLabel: 'Stick position', yLabel: 'Output', xDomain: [0, 1], yDomain: [0, 1], xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 0.25, 0.5, 0.75, 1],
      alt: 'Three stick curves. Linear, squared and cubed all reach full output at full stick, and curves with higher exponents stay lower through the middle of the travel.',
      series: [
        { name: 'Linear', color: 'orange', points: curve(1), tag: { x: 0.42, y: 0.62 } },
        { name: 'Squared', color: 'blue', dash: true, points: curve(2), tag: { x: 0.46, y: 0.42 } },
        { name: 'Cubed', color: 'green', points: curve(3), tag: { x: 0.78, y: 0.3 } },
      ],
      callouts: [
        { title: 'Half stick', text: `Linear gives ${0.5 ** 1 * 100}%, squared ${0.5 ** 2 * 100}% and cubed ${0.5 ** 3 * 100}%.` },
        { title: 'Full stick', text: 'All three still reach 100%, so you keep your top speed.' },
        { title: 'Already squared', text: '`arcadeDrive` squares its inputs unless you pass `false`.' },
        { title: 'Scale goes first', text: `Deck 2's is squared too: ${DRIVE_SCALE} becomes ${fix(DRIVE_SCALE ** 2, 2)} at full stick.` },
      ],
      notes: `(1.5 min) Think of a car's accelerator: the first bit of travel is gentle. Input shaping does that to a stick, changing what the stick means without changing its range. Most driving happens at small movements, and a curve spreads your fingers over more of that part of the stick. These curves are exact math, the same formula as MathUtil.copyDirectionPow. Here is a surprise from Deck 2: the scale happens before arcadeDrive squares the value, so ${DRIVE_SCALE} turns into ${fix(DRIVE_SCALE ** 2, 2)} at full stick. FIRST's KitBot code does the same, and it is fine for a first drive. Now you know where your top speed went.` }),

    L.plot({ id: 'slew', eyebrow: CT, title: 'A slew-rate limit trades snap for smoothness', xLabel: 'Time after full stick (s)', yLabel: 'Simulated robot speed (m/s)', xDomain: [0, 1.2], yDomain: [0, 6], xTicks: [0, 0.3, 0.6, 0.9, 1.2], yTicks: [0, 2, 4, 6],
      alt: 'Simulated robot speed after a full-stick start, with no limit and with slew-rate limits of 3 and 1.5 per second. Stronger limits reach top speed later.',
      series: [
        { name: 'No limiter', color: 'orange', points: speedPts(step), tag: { x: 0.08, y: 5.1 } },
        { name: 'Limit 3/s', color: 'blue', dash: true, points: speedPts(slew3), tag: { x: 0.47, y: 3.55, w: 130 } },
        { name: 'Limit 1.5/s', color: 'green', points: speedPts(slew15), tag: { x: 0.72, y: 2.6 } },
      ],
      callouts: [
        { title: 'What it does', text: `\`SlewRateLimiter(${SLEW_PER_S})\` lets the value change ${SLEW_PER_S} per second: 0 to full in 1/${SLEW_PER_S} s.` },
        { title: 'Peak current', text: `${peakAmps(step)} A, then ${peakAmps(slew3)} A, then ${peakAmps(slew15)} A per CIM.` },
        { title: 'Why it feels better', text: 'A gentler shove means less wheel slip and less tipping.' },
        { title: 'The cost', text: 'The robot responds later, and that includes stopping.' },
      ],
      notes: `(1.5 min) Think of pressing a pedal smoothly instead of stamping on it. A slew-rate limiter is a speed limit on how fast a number may change. You keep your top speed and take longer to reach it. This plot is simulated, not measured: ${MODEL}. The limiter updates every 20 ms. Warn them about stopping: while the limiter catches up, the robot keeps going for a moment after the stick is released. If a kid asks: the SPARK has openLoopRampRate too, but it can't tell forward from turning.` }),

    L.codeNotes({ id: 'feel-code', eyebrow: CT, title: 'The order of the stick steps matters', file: 'FeelRobotContainer.java', src: { file: `${J}/FeelRobotContainer.java`, region: 'feel' }, callouts: [
      { line: [3, 10], title: 'Deadband first', text: 'Throw away drift before anything else sees it.' },
      { line: [4, 11], title: 'Then the curve', text: '`copyDirectionPow` keeps the sign, so reverse works.' },
      { line: [5, 12], title: 'Scale, then limit', text: `Now ${DRIVE_SCALE} stays ${DRIVE_SCALE} at full stick, and the limiter sees the final value.` },
    ], notes: '(1 min) Order matters, so read it top to bottom. Flip the sign, drop the deadband, apply the curve, scale, and limit last so the limiter sees the final value. A plain power would lose the sign, because a negative number squared is positive, and the robot could not reverse. The limiter is a field, not a local variable, because it has to remember its last value. Call it once per loop, which a supplier does for you. Turning gets a curve but no limiter, like the example in the WPILib docs.' }),

    L.exercise({ id: 'exercise', title: 'Tune the drive feel', minutes: 10, tasks: [
      'Add the shaping from the last slide, using `MathUtil.copyDirectionPow`.',
      'Stop it being squared twice: call `drive.arcadeDrive(x, z, false)`.',
      'Try exponents 1, 2 and 3. Creep along a tape line with each one.',
      `Add \`new SlewRateLimiter(${SLEW_PER_S})\` on forward, then try 1.5. Watch the stop.`,
      'Put your best numbers in `Constants`, then commit.',
    ], done: 'a new driver creeps 2 m down the tape and stops within a hand\'s width of the mark.',
    notes: '(10 min) Work in pairs with a mentor by the robot, in clear floor space, with someone ready on Enter. Keep DRIVE_SCALE low until people are comfortable. One driver should try every setting, so you compare the settings and not the people. Have them say out loud what changed. Ask them to notice the bottom of the cubed stick: it may feel dead. We explain why next. The answer is in FeelRobotContainer, and CANDriveSubsystem has driveArcadeRaw for task 2. No robot free? Do tasks 1 and 2 now, and test when a robot opens up.' }),

    L.cards({ id: 'ff-terms', section: 'Drivetrain feedforward and closed-loop speed', eyebrow: CT, title: 'Three gains predict the volts a drivetrain needs', intro: '`Volts = kS + kV × speed + kA × acceleration`. Deck 6 did this for an arm.', items: [
      { icon: 'Wrench', title: 'kS: the first shove', text: `A heavy box won't slide until you push hard enough. We assume ${fix(TRUE.kS, 0)} V of friction.` },
      { icon: 'Activity', title: 'kV: the steady push', text: `A spinning motor pushes back, so speed costs volts: ${fix(TRUE.kV, 2)} V per m/s.` },
      { icon: 'Lightning', title: 'kA: the extra push', text: `A loaded cart fights you while it gains speed: ${fix(TRUE.kA, 2)} V per m/s².` },
    ], notes: `(1.5 min) Feedforward is the volts you can predict. To cruise at ${TEST_MPS} m/s this robot needs ${fix(TRUE.kS, 0)} plus ${fix(TEST_MPS * GAINS.kV, 2)}, so ${fix(GAINS.kS + TEST_MPS * GAINS.kV, 2)} volts. kV comes from the motor data, gearing and wheels, and kA adds the assumed 50 kg. kS is our assumption: WPILib's docs say it is nearly impossible to model, so it must be measured. Remember the dead spot at the bottom of a cubed stick? Volts below kS only fight friction. In this model, with a ${DRIVE_SCALE} scale, the robot would not move until ${fix(firstMoveStick * 100, 0)} percent stick.` }),

    L.plot({ id: 'ff-plot', eyebrow: CT, title: 'Feedforward does the work and P fixes the miss', xLabel: 'Time (s). A push starts at 2 s.', yLabel: 'Simulated robot speed (m/s)', xDomain: [0, 4], yDomain: [0, 2.5], xTicks: [0, 1, 2, 3, 4], yTicks: [0, 0.5, 1, 1.5, 2, 2.5],
      alt: `Simulated speed with a ${TEST_MPS} meter per second goal and a push at 2 seconds. P alone stops near ${fix(spd.pBefore, 1)}. Feedforward alone reaches the goal, then falls to ${fix(spd.ffAfter, 1)} under the push. Feedforward plus P stays near ${fix(spd.bothAfter, 1)}.`,
      refs: [{ y: TEST_MPS, label: `Goal: ${TEST_MPS} m/s` }],
      series: [
        { name: 'P only', color: 'orange', points: speedSeries(pOnly), tag: { x: 1.15, y: 1.22, w: 140 } },
        { name: 'Feedforward only', color: 'blue', dash: true, points: speedSeries(ffOnly), tag: { x: 2.6, y: 1.55, w: 280 } },
        { name: 'Feedforward + P', color: 'green', points: speedSeries(ffP), tag: { x: 2.6, y: 1.85, w: 280 } },
      ],
      callouts: [
        { title: 'P only', text: `Stops at ${fix(spd.pBefore, 2)} m/s. P makes no volts unless it is still wrong.` },
        { title: 'Feedforward only', text: `On the goal, but it can't see the push: ${fix(spd.ffAfter, 2)} m/s.` },
        { title: 'Both', text: `Feedforward carries the speed and P fights the push: ${fix(spd.bothAfter, 2)} m/s.` },
      ],
      notes: `(1.5 min) Think of a shower: you know roughly where the tap goes, then you adjust by feel. Feedforward is knowing, and P is feeling. The goal ramps to ${TEST_MPS} m/s, then an assumed ${PUSH_N} newton push arrives, like a defender leaning on you. P alone has to stay wrong to make any volts, so it stops short. Feedforward alone lands on the goal but cannot see the push. Together you get both. This is simulated, with an assumed ${fix(TRUE.kS, 0)} volt of friction, and our real Java landed within 0.01 m/s of the model in the WPILib simulator.` }),

    L.plot({ id: 'sysid', eyebrow: CT, title: 'SysId measures your gains from two simple tests', xLabel: 'Robot speed (m/s)', yLabel: 'Volts in the simulated slow test', xDomain: [0, 2], yDomain: [0, 6], xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 2, 4, 6],
      alt: `Volts against speed during a simulated slow ramp. Nothing moves until about ${fix(fit.kS, 0)} volt, then the points follow a straight line with a slope of ${fix(fit.kV, 2)} volts per meter per second.`,
      refs: [{ y: fit.kS, label: 'kS: it starts moving' }],
      series: [
        { name: 'Slow test', color: 'orange', points: slowPts, tag: { x: 0.45, y: 4.3, w: 180 } },
        { name: 'Straight-line fit', color: 'blue', dash: true, points: fitLine, tag: { x: 1.05, y: 2.75, w: 240 } },
      ],
      callouts: [
        { title: 'The slow test', text: `Volts creep up ${SYSID.rampVPerS} V per second, so almost none go to speeding up.` },
        { title: 'Slope: kV', text: `Each m/s took ${fix(fit.kV, 2)} V. The model's true value is ${fix(TRUE.kV, 2)}.` },
        { title: 'Start: kS', text: `The line starts at ${fix(fit.kS, 2)} V. The true value is ${fix(TRUE.kS, 2)}.` },
        { title: 'The fast test', text: `A ${SYSID.stepVolts} V step shows the extra volts to speed up: kA ${fix(fit.kA, 2)}.` },
      ],
      notes: `(1.5 min) Think of a check-up at the doctor: a few set tests, and out come your numbers. This plot is simulated: the model runs SysId's two tests, then the same kind of fit SysId does. The routine runs four tests, slow and fast, forward and back, and logs them. The SysId app reads the log and gives you the gains. Our real SysIdRoutine, on the simulated robot, found ${JAVA_FIT.kS.toFixed(2)}, ${JAVA_FIT.kV.toFixed(2)} and ${JAVA_FIT.kA.toFixed(2)}. The slow test here used ${fix(slowTest.distance, 1)} m, so use the floor, not blocks: WPILib says a drive needs 10 to 20 feet. Hold the button to run, so letting go stops it. Treat suggested P and D gains as a starting point.` }),

    L.codeNotes({ id: 'speed-loop', eyebrow: CODE, title: 'One speed loop runs each side of the drivetrain', file: 'SpeedLoop.java', src: { file: `${J}/SpeedLoop.java`, region: 'loop' }, callouts: [
      { line: [4, 5], title: 'Feedforward', text: 'Two goals in a row give it the speed and the acceleration.' },
      { line: 7, title: 'P', text: `Works on what is left. \`KP\` is ${fix(GAINS.kP, 0)} volts per m/s of error.` },
      { line: 8, title: 'Remember the goal', text: 'This is why each side gets its own object.' },
      { line: [9, 10], title: 'Add, then clamp', text: `Volts add together, and a motor only gets ${java(SP, 'MAX_VOLTS')}.` },
    ], notes: '(1.5 min) First, the hardware. A speed loop needs a sensor, and FIRST\'s KitBot code reads no encoders, so you add one per side. Our example uses a REV Through Bore Encoder on each wheel shaft, wired to the roboRIO, so this loop runs in Java every 20 ms. The stick now asks for meters per second instead of a share of the battery. VelocityDriveSubsystem makes one SpeedLoop per side, feeds it each encoder\'s rate, and sends the volts with setVoltage. With kS in the loop, the dead spot is gone: in the simulator, a 0.3 stick creeps along at 0.05 m/s. The sysid section is ready to copy for your own robot.' }),

    L.gotcha({ id: 'gotcha-encoder', title: 'One side of the drive runs away',
      symptom: 'You enable the speed loop, and one side slams to full speed. The robot spins or curves hard.',
      cause: 'The sides are mirror images, so one encoder counts backward. Speeding up looks like slowing down, so P pushes harder.',
      fix: 'Disabled, wheels up: turn each wheel forward by hand. Both speeds must rise. If one falls, flip it with `setReverseDirection`.',
      notes: '(1 min) Deck 6 showed this on an arm, and a drivetrain has a new way to get it, because the two sides face opposite ways. We tried it in the simulator: with the left encoder counting backward, the left side ran to full speed while the right side held the goal. Feedback only works if pushing forward makes the reading go up. So check both sides before the first closed-loop enable, every time an encoder is changed. Keep someone ready on Enter, and start with the wheels off the ground.' }),

    L.exercise({ id: 'sim-exercise', title: 'Tune the speed loop in the simulator', minutes: 5, tasks: [
      'In `Constants.java`, set `KS`, `KV` and `KA` to 0. Run **Simulate Robot Code**.',
      `Enable and hold A: the goal is ${TEST_MPS} m/s. Note where \`Drive/Left speed (mps)\` stops.`,
      'Put back `KV`, then `KS`, then `KA`. Hold A after each one.',
      'Hold A and Y. Y is a simulated push. Raise `KP` until the push barely matters.',
    ], done: `with A and Y held, \`Drive/Left speed (mps)\` stays within 0.05 of ${TEST_MPS} m/s.`,
    notes: '(5 min) Mentors, set this up first. In a copy of the examples project, make Robot.java create frc.robot.deck9.VelocityRobotContainer, and check that it runs on the keyboard or a gamepad. Students change only the gains in Constants: stop the simulator, edit, run again. We ran these steps. P alone stops near 1.3 m/s. KV brings it to 1.88 and KS to 2.00. With the push, KP 6 sits 0.11 below the goal and KP 16 is the first whole number within 0.05. The Java only ever talks to the simulated drivetrain here, which is why this is safe to break.' }),

    L.plot({ id: 'onboard-faster', section: 'Where the loop runs', eyebrow: CODE, title: 'An onboard loop decides faster, on fresher data',
      alt: `Simulated arm angle over 3 seconds at kP ${HOT_KP}. The 20 millisecond loop keeps swinging. The 1 millisecond loop settles in ${fix(fastSettle, 2)} seconds.`,
      xLabel: 'Time (s)', yLabel: 'Simulated arm angle, degrees. Dashed: setpoint', xDomain: [0, 3], yDomain: [-40, 80], xTicks: [0, 1, 2, 3], yTicks: [-30, 0, 45], refs: [{ y: GOAL }],
      series: [
        { name: '20 ms loop on the roboRIO', color: 'orange', points: slowLoop.map((x) => [x.t, x.deg]) },
        { name: '1 ms loop on the SPARK', color: 'blue', dash: true, points: fastLoop.filter((_, i) => i % 20 === 0).map((x) => [x.t, x.deg]) },
      ],
      callouts: [
        { title: 'roboRIO', text: 'Decides every 20 ms, using a reading that came over CAN.' },
        { title: 'SPARK', text: 'REV updates the loop every 1 ms, with the encoder wired right to it.' },
        { title: 'Same gains', text: `At kP ${HOT_KP} the 20 ms loop shakes. The 1 ms loop settles in ${fix(fastSettle, 2)} s.` },
      ],
      notes: `(1.5 min) Picture steering a car while looking away and glancing back every few seconds. Every decision is late, so you over-correct. Now look at the road all the time. This is Deck 6's arm at the same kP ${HOT_KP}, with the loop running every millisecond instead of every 20. It still overshoots, but it settles in ${fix(fastSettle, 2)} seconds. REV's docs say the onboard loop updates every 1 ms. The encoder plugs straight into the SPARK, so nothing waits on CAN, and your code only sends a new goal. This plot is our model, with no sensor filtering, so treat it as the idea and not a promise for your robot.` }),

    L.codeNotes({ id: 'spark-config', eyebrow: CODE, title: 'The arm loop can move onto the SPARK MAX', file: 'SparkArmSubsystem.java', src: { file: `${J}/SparkArmSubsystem.java`, region: 'device' }, callouts: [
      { line: 4, title: 'Native units', text: `\`p\` is duty cycle per NEO rotation. kP 30 is ${fix(SPARK_P_EQUIVALENT, 2)}. Start low.` },
      { line: 7, title: 'kCos, not kG', text: 'WPILib\'s `kG` is REV\'s `kCos`. REV\'s `kG` is for elevators.' },
      { line: 8, title: 'kCosRatio', text: `NEO rotations to arm rotations: \`1 / ${ARM.gearing}\`. The sensor must read 0 at flat.` },
      { line: [14, 15], title: 'Send it once', text: 'Goals are in NEO rotations. One message over CAN, then the SPARK does the work.' },
    ], notes: '(1.5 min) This is Deck 6\'s arm with the loop handed to the SPARK. Think of giving someone a destination instead of calling out every turn. REV multiplies kCos by the cosine of the arm position, and position times kCosRatio must give arm rotations. So flat must read zero, and below flat must read negative. A through-bore wraps there, so this loop uses the NEO\'s encoder, with the true angle copied in. Watch the names: WPILib kG means REV kCos. Gains change units too: error is in NEO rotations and output is duty cycle, a share of full output, so 30 volts per radian becomes 30 over 12, times 2 pi over 60. Retune D from low.' }),

    L.practice({ id: 'where-loop', title: 'Learn the loop in Java, then move it', rule: 'Get a new loop right on the roboRIO, then move it to the controller.',
      why: 'Java loops are easy to log, change and try in the simulator. A controller loop is quicker and fresher, but its gains use other units, so you tune it again.',
      notes: '(1 min) This is about learning order, not about which is better. REV\'s docs recommend doing as much as you can on the motor controller, and for a fast mechanism like a shooter wheel you will want that. But while you are learning, seeing the loop matters more. In Java you can log every term and break it safely in the simulator, as you just did. Once you understand it, move it. Think of training wheels: useful first, and you take them off on purpose.' }),

    L.plot({ id: 'scurve', section: 'Smoother motion and what comes next', eyebrow: CT, title: 'An S-curve rounds off the corners of a trapezoid',
      alt: `Planned arm speed for a swing from ${SWING.from} to ${SWING.to} degrees. The trapezoid has sharp corners and takes ${fix(trapTime, 2)} seconds. The S-curve rounds them and takes ${fix(sCurveTime, 2)} seconds.`,
      xLabel: 'Time (s)', yLabel: 'Planned arm speed (degrees per second)', xDomain: [0, 1.8], yDomain: [0, 180], xTicks: [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8], yTicks: [0, 60, 120, 180],
      series: [
        { name: 'Trapezoid', color: 'orange', points: profilePts(trapSpeeds), tag: { x: 0.2, y: 165, w: 150 } },
        { name: 'S-curve', color: 'blue', dash: true, points: profilePts(sCurveSpeeds), tag: { x: 1.3, y: 62, w: 150 } },
      ],
      callouts: [
        { title: 'Trapezoid', text: 'The push switches on and off at once. Those are the sharp corners.' },
        { title: 'S-curve', text: `The push builds over ${fix(JERK_S, 1)} s. How fast it builds is called jerk.` },
        { title: 'The cost', text: `This swing takes ${fix(sCurveTime, 2)} s, not ${fix(trapTime, 2)} s.` },
        { title: 'Where to find it', text: 'CTRE\'s Motion Magic adds it when you set jerk. `TrapezoidProfile` and MAXMotion stay trapezoids.' },
      ],
      notes: `(1 min) A good elevator eases into its start and stop. A jerky one throws your stomach around. Deck 6's trapezoid is speed against time, and its corners are moments when the push changes all at once. These are the planned speeds for Deck 6's arm, computed, with a jerk we picked for the example: ${JERK} rad/s cubed. The S-curve covers the same distance and takes longer. Chains and tall arms like gentle corners. Start with a trapezoid, and reach for an S-curve only if a mechanism shakes at the corners.` }),

    L.lead({ id: 'next', eyebrow: 'Where to go next', title: 'State-space and LQR are the next step up',
      text: '**State-space control** describes a mechanism with a small math model, and `kV` and `kA` are already one. **LQR** then picks the feedback gains from how much error and how many volts you will accept.',
      points: [
        '**The picture:** sport and eco modes in a car. You choose the trade-off, not the pedal position.',
        '**You have met it:** SysId uses LQR for the P and D gains it suggests.',
        '**WPILib\'s advice:** pick the easiest strategy that works on the field.',
      ],
      notes: '(1 min) This is a pointer, not a lesson. LQR stands for Linear-Quadratic Regulator, and it uses matrices, so explore it with a mentor. With PID you turn dials until it feels right. With LQR you say how far off you can tolerate and how many volts you want to spend, and the math picks the gains. If you use SysId, you are already using it. WPILib\'s own advice is to pick the easiest strategy that works, so finish feedforward and PID first. The state-space link on the last slide starts from PID and builds up.' }),

    L.recap({ id: 'recap', items: [
      'Build the stick chain in order: sign, deadband, curve, scale, slew limit.',
      'Explain kS, kV and kA, and what SysId\'s two tests measure.',
      'Drive by speed with feedforward plus P, and check encoder direction first.',
      'Decide where a loop belongs: 20 ms on the roboRIO or 1 ms on the controller.',
      'Say how an S-curve differs from a trapezoid, and what state-space adds.',
    ], next: 'Deck 10 compares the autonomous path planning libraries.',
    notes: '(30 s) Ask for one volunteer per line, in their own words. If nobody can say what kV means, go back to the picture of the steady push. Before people leave, make sure every team has committed the drive settings they liked. Everything today builds on Decks 2 and 6, so if something felt fast, those are the places to go back to.' }),

    L.links({ id: 'links', intro: 'Point your phone camera at a code.', items: [
      { label: 'Feedforward in WPILib', url: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/controllers/feedforward.html', short: 'docs.wpilib.org' },
      { label: 'System identification', url: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/introduction.html', short: 'docs.wpilib.org' },
      { label: 'SPARK closed loop', url: 'https://docs.revrobotics.com/revlib/spark/closed-loop', short: 'docs.revrobotics.com' },
      { label: 'State-space intro', url: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/state-space/state-space-intro.html', short: 'docs.wpilib.org' },
    ], notes: '(30 s) Leave this up during the break. Start with the feedforward page, then System identification when you have encoders on your robot. The REV page is the reference for loops on the SPARK. The state-space page is for later, with a mentor. The WPILib docs here are the stable version, which moves to next season at kickoff.' }),
  ],
};

// For checks in tooling. The builder only reads the default export.
export const simulation = { step, slew3, slew15, pOnly, ffOnly, ffP, spd, fit, TRUE, slowTest, fastTest, slowLoop, fastLoop, fastSettle, trapSpeeds, sCurveSpeeds, trapTime, sCurveTime, firstMoveStick };
