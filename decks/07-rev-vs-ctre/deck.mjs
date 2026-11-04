// Deck 7: REV vs CTRE. Every feature claim here is listed with its source in SOURCES.md.
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck7';

// `compare` takes code as a string, so read the same #regions a `code` slide would use.
function region(file, name) {
  const text = readFileSync(`${J}/${file}`, 'utf8').split('\n');
  const open = text.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  if (open < 0 || close < 0) throw new Error(`no region ${name} in ${file}`);
  const body = text.slice(open + 1, close);
  const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(ind)).join('\n');
}

// ---- Control theory plot: a simulated arm making a small correction at two loop rates. ---------
// Motor numbers are the NEO 2.0 spec table: 12 V, 5676 RPM free at 1.8 A, 3.75 N·m and 150 A at stall.
const VOLTS = 12, R = VOLTS / 150, KT = 3.75 / (150 - 1.8), KE = (VOLTS - 1.8 * R) / ((5676 * 2 * Math.PI) / 60);
const GEAR = 60, MASS = 2, ARM_M = 0.5, INERTIA = MASS * ARM_M * ARM_M, GRAVITY = 9.81, AMP_LIMIT = 40;
const FAST = { loopSeconds: 0.001, sensorAgeSeconds: 0.001 }, SLOW = { loopSeconds: 0.02, sensorAgeSeconds: 0.02 };

function simulateArm({ loopSeconds, sensorAgeSeconds, kP, startDeg = 45, goalDeg = 55, seconds = 0.8 }) {
  const h = 1e-4, goal = (goalDeg * Math.PI) / 180;
  const kG = ((MASS * GRAVITY * ARM_M) / GEAR / KT) * R; // Volts that hold the arm level.
  const ageSteps = Math.round(sensorAgeSeconds / h);
  const history = [];
  const points = [];
  let angle = (startDeg * Math.PI) / 180, speed = 0, volts = 0, nextTick = 0;
  for (let i = 0; i <= Math.round(seconds / h); i++) {
    const t = i * h;
    history.push(angle);
    if (t + 1e-9 >= nextTick) {
      const seen = history[Math.max(0, history.length - 1 - ageSteps)];
      volts = Math.max(-VOLTS, Math.min(VOLTS, kP * (goal - seen) + kG * Math.cos(seen)));
      nextTick += loopSeconds;
    }
    const amps = Math.max(-AMP_LIMIT, Math.min(AMP_LIMIT, (volts - KE * speed * GEAR) / R));
    speed += (((GEAR * KT * amps) - MASS * GRAVITY * ARM_M * Math.cos(angle)) / INERTIA) * h;
    angle += speed * h;
    if (i % 50 === 0) points.push([t, (angle * 180) / Math.PI]);
  }
  return points;
}
const overshoot = (pts, goal = 55) => Math.max(0, Math.max(...pts.map((p) => p[1])) - goal);
const settled = (pts, goal = 55, band = 0.5) => pts.reduce((last, p) => (Math.abs(p[1] - goal) > band ? p[0] : last), 0);

const KP = 24; // Volts per radian of error.
const onController = simulateArm({ ...FAST, kP: KP });
const onRio = simulateArm({ ...SLOW, kP: KP });
let KP_LOW = KP; // Lower the 50 Hz gain until it overshoots no more than the 1 kHz loop does.
while (overshoot(simulateArm({ ...SLOW, kP: KP_LOW })) > overshoot(onController)) KP_LOW -= 0.5;
const onRioLow = simulateArm({ ...SLOW, kP: KP_LOW });
// A full 45 degree move, for the notes: here the 12 V limit matters more than the loop rate.
let KP_BIG = KP;
const big = { startDeg: 0, goalDeg: 45, seconds: 1 };
const bigFast = simulateArm({ ...FAST, ...big, kP: KP });
while (overshoot(simulateArm({ ...SLOW, ...big, kP: KP_BIG }), 45) > overshoot(bigFast, 45)) KP_BIG -= 0.5;
const bigSlow = simulateArm({ ...SLOW, ...big, kP: KP_BIG });
const deg = (x) => x.toFixed(0);
const secs = (x) => x.toFixed(2);

export default {
  no: 7, short: 'REV vs CTRE', title: 'REV vs CTRE motors and controllers', minutes: 30,
  description: 'What REV and CTRE motors, controllers and tools do on their own in 2026, and how a young team can choose.',
  slides: [
    L.cover({
      title: 'REV vs CTRE motors and controllers',
      subtitle: 'What each one does on its own in 2026, and how to choose',
      minutes: 30,
      notes: 'Welcome to the last deck of the core course. You have used a SPARK MAX on the KitBot and written PID for an arm. Today we look at what the motor controller can do by itself, from both big vendors. This is not a sales pitch, and I will not tell you which one to buy. By the end you should be able to weigh it up for your own team. Facts here were checked on November 4, 2026, so look again before you buy. Timing: 30 minutes.',
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Outcomes', title: 'What you will be able to do',
      text: 'In Deck 2 you met a SPARK MAX. In Deck 6 you ran PID on the roboRIO. Today that loop moves onto the motor controller.',
      points: [
        'Match a motor to a controller that really works with it.',
        'Explain why a fast loop on the controller beats a slow one on the roboRIO.',
        'Read the same arm in REVLib and in Phoenix 6.',
        'Say what costs money, and choose for your own team.',
      ],
      notes: 'Here is the plan. First, what each vendor sells, and which parts work together. Then the control theory reason to run a loop on the controller. Then what each controller does for you, what costs money, and the same arm written both ways. A quick word: an "ecosystem" just means one vendor\'s motors, controllers, sensors, library and setup app, which are designed to work together. Timing: 1 minute. If a kid asks which is better, say "better for what?" and hold that thought until the end.',
    }),

    L.table({
      id: 'ecosystems', eyebrow: 'Hardware', title: 'The two ecosystems at a glance',
      columns: ['', 'REV', 'CTRE'], widths: [20, 40, 40], fontSize: 24,
      rows: [
        ['Motors on sale', 'NEO 2.0, NEO 550, NEO Vortex', 'Kraken X60, Kraken X44, Minion'],
        ['Controllers', 'SPARK MAX, SPARK Flex', 'Talon FX, Talon FXS'],
        ['Built in or separate', 'Separate. SPARK Flex docks straight onto a Vortex', 'A Kraken has a Talon FX built in. Minion uses a separate Talon FXS'],
        ['Encoders', 'Through Bore Encoder V2, MAXSpline Encoder (wired or CAN)', 'CANcoder (CAN)'],
        ['Other sensors', 'Color Sensor V3, 2m Distance Sensor', 'Pigeon 2 (IMU), CANrange (distance), CANdi (inputs on CAN)'],
        ['Setup app', 'REV Hardware Client 2', 'Phoenix Tuner X'],
        ['2026 software', 'REVLib 2026.0.5, with 2026 firmware', 'Phoenix 6 26.3.0, with 2026 firmware'],
      ],
      caption: 'Checked 2026-11-04. NEO V1.1 is discontinued and Falcon 500 is out of stock, but both are still legal if you own them.',
      notes: 'Read across each row. The big split is built in versus separate. A Kraken is a motor with its controller inside, so there are fewer wires, and only two power leads and CAN. A NEO needs a SPARK next to it. An absolute encoder remembers its position after power off, which is what an arm wants. Note the app: the old REV Hardware Client reached end of life, so use Hardware Client 2. The last row is the matched set for 2026 robots. Krakens are designed by WestCoast Products with CTRE control technology, and run the CTRE software. Timing: 2 minutes.',
    }),

    L.table({
      id: 'pairing', eyebrow: 'Hardware', title: 'Which motor works with which controller',
      columns: ['Motor', 'SPARK MAX', 'SPARK Flex', 'Talon FXS', 'Talon FX'], widths: [26, 20, 18, 22, 14], fontSize: 24,
      rows: [
        ['NEO V1.1, NEO 550', 'Yes', 'With Flex Dock', 'Yes', 'No'],
        ['NEO 2.0', 'Yes', 'With Flex Dock', 'Not listed by CTRE', 'No'],
        ['NEO Vortex', 'With Solo Adapter', 'Docks directly', 'With Solo Adapter', 'No'],
        ['Minion', 'Not documented', 'Not documented', 'Yes', 'No'],
        ['Kraken X60, X44, Falcon', 'No', 'No', 'No', 'Built in'],
        ['Brushed, such as CIM', 'Yes', 'With Flex Dock', 'Yes', 'No'],
      ],
      caption: 'Tell the controller what is attached. Brushed Mode with a brushless motor connected permanently damages the motor. A Talon FXS will not drive until you pick its motor in `MotorArrangement`.',
      notes: 'This is the slide to photograph. A Talon FX only ever drives the motor it is built into, and the game manual says so too. Talon FXS is the flexible one: Minion, NEO, NEO 550, Vortex with a Solo Adapter, and most brushed motors. NEO 2.0 is not on CTRE\'s list. Some teams report it works, but that is forum talk, so bench test first. A Vortex on a SPARK MAX only gets 42 counts per revolution. Remember the KitBot: CIMs are brushed, so kBrushed. Getting this wrong can destroy a motor. Timing: 2 minutes.',
    }),

    L.plot({
      id: 'theory', eyebrow: 'Control theory', title: 'Why a 1 kHz loop beats a 50 Hz loop',
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees)', xDomain: [0, 0.8], yDomain: [44, 60],
      xTicks: [0, 0.2, 0.4, 0.6, 0.8], yTicks: [45, 50, 55, 60], refs: [{ y: 55, label: 'Target' }],
      series: [
        { name: '1 kHz', color: 'orange', points: onController },
        { name: '50 Hz, same gain', color: 'blue', dash: true, points: onRio },
        { name: '50 Hz, lower gain', color: 'green', points: onRioLow },
      ],
      callouts: [
        { title: 'Same gain at 50 Hz', text: `The arm swings ${deg(overshoot(onRio))}° past and takes ${secs(settled(onRio))} s to settle.` },
        { title: 'Lower gain at 50 Hz', text: `The swing goes away, but settling takes ${secs(settled(onRioLow))} s.` },
        { title: 'Same gain at 1 kHz', text: `No big swing, and it settles in ${secs(settled(onController))} s.` },
      ],
      notes: `Think of a shower. If hot water takes ages to arrive, you over-turn the tap. Delay makes a controller overshoot. This is a simulation, not a robot: a 2 kg arm, 0.5 m long, 60:1 on a NEO 2.0, a 40 A limit, kG feedforward and P only, nudged from 45 to 55 degrees. The 1 kHz loop sees a 1 ms old angle. We assume 50 Hz sees a 20 ms old angle. Same gain is ${KP} volts per radian. Lower gain is ${KP_LOW}, set to overshoot no more than the 1 kHz curve. On a full 45 degree move the 12 V limit matters more, so the gap shrinks to ${secs(settled(bigFast, 45, 1))} s against ${secs(settled(bigSlow, 45, 1))} s. Timing: 3 minutes.`,
    }),

    L.table({
      id: 'closed-loop', eyebrow: 'On the controller', title: 'Closed loop on the controller',
      columns: ['', 'SPARK', 'Talon'], widths: [17, 41, 42], fontSize: 24,
      rows: [
        ['Modes', 'Position, velocity, current, MAXMotion', 'Position, velocity, Motion Magic, in volts or duty cycle'],
        ['Loop rate', 'Every 1 ms', '1 kHz, so also every 1 ms'],
        ['Feedforward', 'kS, kV, kA, plus an arbitrary term from your code', 'kS, kV, kA, plus a FeedForward term in the request'],
        ['Gravity', 'kG for elevators. kCos with kCosRatio for arms', 'kG with GravityType. GravityArmPositionOffset shifts the arm angle'],
        ['Gain slots', '4, chosen in setSetpoint', '3, plus simple gain scheduling on error'],
        ['Arrived?', 'isAtSetpoint()', 'ClosedLoopError, and MotionMagicAtTarget for the profile'],
        ['Following', 'config.follow(leader, invert), set on the follower', 'Follower request: copies the leader\'s output type'],
      ],
      caption: 'Arm gravity works the same way on both: the sensor must read 0 when the arm is level.',
      notes: 'This is the Deck 6 arm, moved onto the controller. On the roboRIO you wrote ArmFeedforward with kS, kG and kV. Both controllers now have those terms built in. On REV, kG means an elevator, and arms use kCos. On CTRE, one kG and you choose Arm_Cosine. A gain slot is a saved set of gains you can switch between. Watch the units: SPARK kP outputs duty cycle, while a Talon voltage request outputs volts, so the same number means different things. One REV note: firmware 27.0.0 lists a fix for followers running about 1% slow, so test two-motor mechanisms on 26.x. Timing: 2 minutes.',
    }),

    L.compare({
      id: 'profiles', eyebrow: 'On the controller', title: 'Motion profiles on the controller',
      left: {
        label: 'MAXMotion (REV)',
        items: [
          '**Position:** a trapezoid. Speed up, cruise, slow down.',
          'You set cruise velocity, max acceleration and allowed profile error.',
          'Drift too far off the plan and the SPARK makes a new plan from where it is.',
          '**Velocity:** ramps to a speed at your max acceleration.',
        ],
      },
      right: {
        label: 'Motion Magic (CTRE)',
        items: [
          '**Motion Magic:** a trapezoid, or a smoother S-curve if you set jerk.',
          '**Velocity:** ramps to a speed at your acceleration, with optional jerk.',
          '**Expo:** an exponential curve from kV and kA that fits what the motor can do.',
          '**Dynamic:** change the limits in every request. Needs Pro and a CANivore.',
        ],
      },
      notes: 'A motion profile is a plan for the whole move, not just the end point. Without one, PID sees a big error and slams the motor. With one, the controller feeds PID a target that moves smoothly. Plot speed against time and you get a trapezoid: up, flat, down. Jerk is how fast acceleration changes, and limiting it rounds the corners. All of this runs on the controller, so you send one target and it does the rest. MAXMotion updates its profile every 10 ms and its PID every 1 ms. MAXMotion velocity ignores cruise velocity. Timing: 2 minutes.',
    }),

    L.table({
      id: 'limits', eyebrow: 'On the controller', title: 'Limits and protection',
      columns: ['', 'SPARK', 'Talon'], widths: [17, 41, 42], fontSize: 24,
      rows: [
        ['Motor current', 'Smart Current Limit. Holds phase current. Default 80 A', 'Stator limit. Default 120 A, on'],
        ['Battery current', 'No separate setting', 'Supply limit. Default 70 A, then 40 A after 1 s, on'],
        ['Soft limits', 'Forward and reverse, in softLimit', 'Forward and reverse, in SoftwareLimitSwitch. Position targets get capped to them'],
        ['Limit switches', 'Wired to the data port', 'Talon FXS: wired. Kraken X60: none, so use a CANcoder, CANdi or CANrange'],
        ['Battery sag', 'voltageCompensation holds output steady', 'Voltage requests do this, up to what the battery gives'],
      ],
      caption: 'Brownout is the same on both. Below 6.3 V (roboRIO 1) or 6.75 V (roboRIO 2 default), the roboRIO sends CAN motor controllers an explicit disable.',
      notes: 'Two words. Stator current is the current inside the motor, and it makes torque and heat. Supply current is what comes out of the battery. SPARK Smart Current Limit holds phase current, which is the motor side. A soft limit is a position the controller refuses to drive past, so your code cannot push an arm through the frame. It only works if your zero is right. SPARK also has a blunt current chop as a backstop. Brownout is the roboRIO protecting itself, so if you see it often, check the battery and wiring first. Timing: 90 seconds.',
    }),

    L.practice({
      id: 'practice', title: 'Run the loop on the controller, limit every motor',
      rule: 'If timing matters, run the loop on the controller. On every motor, set a current limit.',
      why: 'The controller reads a wired sensor directly, every millisecond. And the 80 A SPARK default is twice the top of REV\'s suggested range for a NEO 550, which is 20 A to 40 A.',
      code: `
// SPARK
config.smartCurrentLimit(40);
// Talon FX
config.CurrentLimits.StatorCurrentLimit = 40;
config.CurrentLimits.StatorCurrentLimitEnable = true;`,
      notes: 'This is true for both vendors. The roboRIO should say where to go, and the controller should do the fast work of getting there. Pick the limit for the motor and the job, not one number for the whole robot. REV publishes suggested ranges, and CTRE suggests finding your stator limit by testing. A limit is also why a stalled intake gets warm instead of dying. Forty amps here is just an example. A real arm may want less, and a drivetrain may want more. Timing: 1 minute.',
    }),

    L.diagram({
      id: 'cost', eyebrow: 'Cost', title: 'Free features and paid features',
      nodes: [
        { id: 'rev', x: 128, y: 240, w: 1664, h: 120, tone: 'ink', label: 'REV: one tier', sub: 'REVLib, Hardware Client 2, StatusLogger, MAXMotion and simulation. REV\'s docs list no paid software.' },
        { id: 'free', x: 128, y: 384, w: 401, h: 440, tone: 'paper', label: 'Phoenix 6: free', sub: 'Volt and duty cycle closed loops. Motion Magic, Velocity and Expo. Swerve API. Tuner X. Simulation. Limited log export.' },
        { id: 'can', x: 549, y: 384, w: 401, h: 440, tone: 'ghost', label: 'CANivore: hardware', sub: 'A second CAN bus for CTRE devices, with CAN FD and CANivore timestamps.' },
        { id: 'pro', x: 970, y: 384, w: 401, h: 440, tone: 'blue', label: 'Pro license', sub: 'FOC and torque control on Talon FX. FOC gives about 15% more peak power. FusedCANcoder, SyncCANcoder, full log export, hoot replay.' },
        { id: 'both', x: 1391, y: 384, w: 401, h: 440, tone: 'accent', label: 'Pro and CANivore', sub: 'Timesync, device timestamps, Dynamic Motion Magic, full differential control.' },
      ],
      caption: 'Without Pro, a request with EnableFOC falls back to normal drive, but TorqueCurrentFOC will not run. A Season Pass covers 100 devices for one team number. Pro features are free in simulation.',
      notes: 'Let\'s be exact, because people argue about this. FOC, field oriented control, times the motor\'s magnetic field more cleverly, for about 15 percent more peak power. Talon FXS does not support it. A CANivore is a USB box that adds a second, faster CAN bus, and it costs money but needs no license. The free tier runs a very good robot, so don\'t feel you must buy Pro. Fused CANcoder blends the absolute sensor with the motor\'s fast sensor. A license matches the firmware year, so check before you rely on an old one. Timing: 2 minutes.',
    }),

    L.table({
      id: 'tools', eyebrow: 'Tools', title: 'Logging, tools and simulation',
      columns: ['', 'REV', 'CTRE'], widths: [17, 41, 42], fontSize: 24,
      rows: [
        ['Automatic log', 'StatusLogger: on by default, writes .revlog', 'Signal Logger: writes .hoot. Auto-starts on roboRIO 2, or roboRIO 1 with a USB drive'],
        ['Read it', 'Opens directly in AdvantageScope', 'AdvantageScope or Tuner X. Export without Pro is a limited signal list'],
        ['SysId', 'WPILib SysId', 'WPILib SysId, fed by Signal Logger'],
        ['Setup app', 'Hardware Client 2: firmware, CAN IDs, run and plot motors, zero encoders', 'Tuner X: firmware, configs, plots, self test, log tools'],
        ['Generates', 'No code generator. Templates for MAXSwerve and EasySwerve', 'Swerve project, Elevator subsystem, CANdle subsystem'],
        ['Simulation', 'SparkMaxSim and SparkFlexSim run closed loop and MAXMotion', 'SimState classes for every Phoenix 6 device'],
      ],
      notes: 'Logging is the flight recorder from Deck 3, and both vendors now do it for you. REV StatusLogger is new for 2026 and needs no code. CTRE logs every status signal with CAN timestamps, and free users can export key signals like position, velocity and current. Tuner X is ahead on generating code: it can build a full swerve project. That swerve API needs all Phoenix devices. REV gives you template projects instead. Hardware Client 2 is a separate install from the old client. Simulation connects to Deck 4, and both plug into WPILib physics. We ran the REV simulator for Deck 6 but not the CTRE one, so this is not a head-to-head test. Timing: 90 seconds.',
    }),

    L.compare({
      id: 'arm-setup', eyebrow: 'Same job, both vendors', title: 'Arm setup: sensor, gains and gravity',
      left: { label: 'REVLib 2026', tone: 'neutral', code: region('RevArm.java', 'sensor'), highlight: [12] },
      right: { label: 'Phoenix 6 2026', tone: 'neutral', code: region('CtreArm.java', 'sensor'), highlight: [8, 9, 10] },
      notes: 'Here is the same arm, with an absolute encoder on the arm shaft. On the left, a Through Bore Encoder is wired to the SPARK. On the right, a CANcoder talks over CAN, free as RemoteCANcoder. Its readings arrive over the bus, and Pro\'s FusedCANcoder blends in the fast motor sensor. Highlighted lines are gravity. kCosRatio is 1 because the encoder turns once per arm rotation. We set no conversion factors, because SPARK firmware 27 removes them. Safety: SPARK MAX 27.0.0 lists a fix for closed loop using the wrong sensor after a reboot, in a setup like this one. On 26.1.5, test a reboot before you trust it. Gains are starting guesses. Timing: 1 minute.',
    }),

    L.compare({
      id: 'arm-move', eyebrow: 'Same job, both vendors', title: 'Arm move: profile and command',
      left: { label: 'REVLib 2026', tone: 'neutral', code: `${region('RevArm.java', 'profile')}\n\n${region('RevArm.java', 'move')}` },
      right: { label: 'Phoenix 6 2026', tone: 'neutral', code: `${region('CtreArm.java', 'profile')}\n\n${region('CtreArm.java', 'move')}` },
      notes: 'Both commands look nearly the same. Convert degrees to rotations in Java, send one target, then wait until the arm arrives. Nothing loops on the roboRIO, unlike your Deck 6 subsystem. Velocity units differ: REV uses RPM, CTRE uses rotations per second. These are the same motion. Not on the slide: on REV, configure with PersistMode saves settings so they survive a brownout. On CTRE, apply saves them and resets anything you left out. This arm rests just above level, because the SPARK reading wraps at 0. We left out kS because firmware 27 changes how it acts at a zero velocity setpoint. Timing: 1 minute.',
    }),

    L.gotcha({
      id: 'gotcha', title: 'Newest firmware is not always the right firmware',
      symptom: 'A SPARK shows "Outdated REV Device", REVLib says the firmware is too old or too new, or Phoenix reports a firmware version error.',
      cause: 'On both vendors, firmware and library are a matched pair for each season. The newest firmware listed can be for next season.',
      fix: 'For 2026, pick the newest 26.x in Hardware Client 2, and the 2026 firmware year in Tuner X.',
      notes: 'Both vendors work this way. Hardware Client 2 needs 26.x or newer, so a SPARK on 2025 firmware goes through Recovery Mode once. There, the version menu automatically picks the most up-to-date firmware, so stop and choose yours. On CTRE, the status code says firmware and API major versions must match, and Tuner X has a year selector. Its changelog already lists 26.70 firmware, for a 2027 alpha API that does not support the roboRIO. New Talon FX built after April 2026 need 26.3.0.0 or newer. Timing: 1 minute.',
    }),

    L.cards({
      id: 'choose', eyebrow: 'Decision', title: 'How a young team can choose',
      items: [
        { icon: 'Chart', title: 'Budget', text: 'Count whole systems. A Kraken includes its controller. A NEO needs a SPARK, and a Minion needs a Talon FXS.' },
        { icon: 'Wrench', title: 'What you own', text: 'Start from your shelf. KitBot SPARK MAX controllers, NEO V1.1 and Falcon 500 are all still legal.' },
        { icon: 'Users', title: 'Who can help', text: 'Choose what your mentors, or a team nearby, can debug with you at an event.' },
        { icon: 'Link', title: 'Mixing is allowed', text: 'R504 lists both vendors and one project can use both libraries. You pay with two apps and two update routines.' },
      ],
      notes: 'There is no winner here. REV gives you everything with no paid tier, separate parts, and encoders that wire straight to the controller. CTRE gives you built-in controllers, code generators and deep logging, and some features cost extra. Check today\'s store pages for prices, because they change. Mixing is legal and practical: a Talon FXS can even drive a NEO. Just know that following stays within a vendor, SPARKs stay on the roboRIO CAN bus, and Phoenix swerve needs all CTRE. The best motor is the one your team can keep running. Timing: 2 minutes.',
    }),

    L.exercise({
      id: 'exercise', title: 'Pick the parts for one mechanism', minutes: 4,
      tasks: [
        'Choose one mechanism: an arm, a shooter or an intake.',
        'Pick a motor and a controller. Check them on the pairing table.',
        'Write down its current limit and where its sensor plugs in.',
        'Open `RevArm.java` or `CtreArm.java` and find the gravity lines.',
      ],
      done: 'your group can name the motor, controller, current limit and sensor, and point to the gravity lines.',
      notes: 'Work in pairs. Mix programmers with electrical students if you can, since the sensor question is partly theirs. There is no single right answer, and a team that picks REV and a team that picks CTRE can both be correct. Walk around and ask "why that one?" If a group finishes early, have them work out the same pick with the other vendor and list what changes. Back in four minutes. Timing: 4 minutes.',
    }),

    L.change2027({
      id: 'change2027',
      items: [
        { now: 'SPARK firmware 26.x, conversion factors', next: 'Shipped already: firmware 27.0.0, conversion factors gone' },
        { now: 'Phoenix firmware for 2026', next: 'Alpha: Phoenix 26.70 needs 26.70.x firmware, no roboRIO' },
        { now: 'new TalonFX(id, bus) on a roboRIO', next: 'Alpha: int and String constructors go. CANBus takes a CANPort' },
        { now: 'new SparkMax(id, type)', next: 'Alpha: constructors take a WPILib CANPort' },
        { now: 'REV getters return plain values', next: 'Alpha: getters return a Signal, so call .get()' },
        { now: 'motor.set() on a Talon', next: 'Alpha: renamed setThrottle()' },
      ],
      note: 'Firmware 27.0.0 is a normal REV release from 2026-10-29. Alpha items may change: REVLib 2027.0.0-alpha-7, Phoenix 6 26.70.0-alpha-2.',
      notes: 'This is a heads-up, not homework. One item is already real: REV released SPARK firmware 27.0.0 on October 29. Positions are in native sensor units, and velocity is in units per minute. That is why our arm uses rotations and converts in Java, so it does not depend on conversion factors. Everything marked alpha is for Systemcore, the controller replacing the roboRIO, and may change. Systemcore has more CAN buses, so every device must say which bus it is on, which is why we used CANBus today. If you search REV\'s online Java docs, you may land on this alpha API, so trust your installed library. Timing: 1 minute.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'Match a motor to a controller that really works with it.',
        'Explain why a 1 kHz loop on the controller beats a 50 Hz loop on the roboRIO.',
        'Read the same arm in REVLib and in Phoenix 6.',
        'Say what needs Phoenix Pro or a CANivore, and what does not.',
        'Choose for your team from budget, parts and mentors.',
      ],
      next: 'That ends the core course. Decks 8 to 10 go deeper.',
      notes: 'That is the core course. You installed the tools, drove a KitBot, read logs, ran the simulator, built dashboards, tuned an arm, and now you know what the hardware does for you. If you only remember one thing from today, make it this: let the controller run the fast loop, and put a current limit on every motor. Decks 8 to 10 go deeper for teams that want more: motors, advanced controls and autonomous path planning. Thank you for working so hard. Timing: 30 seconds.',
    }),

    L.links({
      id: 'links', intro: 'These change every season, so check them before you buy.',
      items: [
        { label: 'SPARK closed loop', url: 'https://docs.revrobotics.com/revlib/spark/closed-loop', short: 'docs.revrobotics.com' },
        { label: 'REV Hardware Client 2', url: 'https://docs.revrobotics.com/rev-hardware-client-2/rhc2/overview', short: 'docs.revrobotics.com' },
        { label: 'Phoenix 6 free and Pro', url: 'https://v6.docs.ctr-electronics.com/en/stable/docs/migration/new-to-phoenix.html', short: 'v6.docs.ctr-electronics.com' },
        { label: 'Talon FXS motors', url: 'https://v6.docs.ctr-electronics.com/en/stable/docs/hardware-reference/talonfxs/index.html', short: 'v6.docs.ctr-electronics.com' },
      ],
      notes: 'Scan these before you leave. The first two are REV: closed loop, and the Hardware Client 2 install page, which you need for 2026 firmware. The next two are CTRE: the exact table of free and Pro features, and the list of motors a Talon FXS can drive. Vendors update these pages often, and this deck is a snapshot from November 2026. Also read the motor rules in the Game Manual when the new one comes out at kickoff. Timing: 30 seconds.',
    }),
  ],
};
