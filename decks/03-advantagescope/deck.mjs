// Deck 3: AdvantageScope. Both plots are simulated below, and the numbers on those slides are
// computed from the simulation rather than typed in. See SOURCES.md for every non-obvious claim.
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck3';

// Simulation 1: a KitBot-style launch on a good and a tired battery ------------------------------
// CIM numbers are WPILib's DCMotor.getCIM. Gearing and wheel are KitbotGearing.k8p45 and
// KitbotWheelSize.kSixInch. Mass and both batteries are assumptions, stated in the slide notes.
const CIM = { volts: 12, stallNm: 2.42, stallA: 133, freeA: 2.7, freeRadS: (5310 * 2 * Math.PI) / 60 };
const MOTOR_OHMS = CIM.volts / CIM.stallA;
const KT = CIM.stallNm / CIM.stallA;
const KV = CIM.freeRadS / (CIM.volts - MOTOR_OHMS * CIM.freeA);
const MOTORS = 4, MASS_KG = 50, GEARING = 8.45, WHEEL_M = 0.0762, LIMIT_A = 60;
const BROWNOUT_V = 6.3, RECOVER_V = 7.5; // roboRIO 1 stage 2 trigger, and the recovery voltage
const TIRED = { volts: 12.3, ohms: 0.035 }, FRESH = { volts: 12.9, ohms: 0.022 };

// One motor at a given bus voltage: voltage compensation, then the SPARK current limit.
function motor(busV, commandV, backV) {
  let duty = Math.min(1, commandV / busV);
  let amps = (duty * busV - backV) / MOTOR_OHMS;
  if (amps > LIMIT_A) {
    duty = Math.min(1, (backV + LIMIT_A * MOTOR_OHMS) / busV);
    amps = (duty * busV - backV) / MOTOR_OHMS;
  }
  return { amps, batteryAmps: MOTORS * duty * amps };
}
// The highest bus voltage where the battery and the motors agree on the current.
function busVoltage(battery, commandV, backV) {
  for (let v = battery.volts; v > 0.1; v -= 0.01) {
    if (battery.volts - battery.ohms * motor(v, commandV, backV).batteryAmps >= v) return v;
  }
  return 0.1;
}
// Full stick from a standstill at t = 0.5 s. Brownout state and the log both update every 20 ms.
function launch(battery) {
  const log = [];
  let speed = 0, enabled = true;
  for (let ms = 0; ms <= 2000; ms++) {
    const commandV = ms >= 500 ? 12 : 0, backV = ((speed / WHEEL_M) * GEARING) / KV;
    const driving = enabled && commandV > 0;
    const bus = driving ? busVoltage(battery, commandV, backV) : battery.volts;
    const m = driving ? motor(bus, commandV, backV) : { amps: 0, batteryAmps: 0 };
    if (ms % 20 === 0) {
      log.push({ t: ms / 1000, volts: bus, amps: m.batteryAmps });
      if (enabled && bus < BROWNOUT_V) enabled = false;
      else if (!enabled && bus > RECOVER_V) enabled = true;
    }
    speed += ((MOTORS * KT * m.amps * GEARING) / WHEEL_M / MASS_KG) * 0.001;
  }
  return log;
}
const tired = launch(TIRED), fresh = launch(FRESH);
const AMP_SCALE = 30;
const lowest = (log) => Math.min(...log.map((p) => p.volts));
const tiredLow = lowest(tired), freshLow = lowest(fresh);
const tiredPeakA = Math.max(...tired.map((p) => p.amps));
if (tiredLow >= BROWNOUT_V || freshLow <= BROWNOUT_V) throw new Error('brownout story no longer matches the simulation');

// Simulation 2: a second-order step response with a constant load --------------------------------
// x'' = wn^2 (setpoint - x) - 2 zeta wn x' - load. The load stops it short of the setpoint, the way
// a P-only controller stops short of a mechanism under a steady load. Logged every 20 ms like a robot.
const SETPOINT = 90, WN = 6, ZETA = 0.4, FINAL = 82;
function stepResponse() {
  const load = (SETPOINT - FINAL) * WN * WN, h = 0.0001, out = [];
  let x = 0, v = 0;
  for (let i = 0; i <= 30000; i++) {
    if (i % 200 === 0) out.push([i * h, x]);
    v += (WN * WN * (SETPOINT - x) - 2 * ZETA * WN * v - load) * h;
    x += v * h;
  }
  return out;
}
const response = stepResponse();
const crossing = (level) => {
  const i = response.findIndex(([, y]) => y >= level);
  const [t0, y0] = response[i - 1], [t1, y1] = response[i];
  return t0 + ((level - y0) / (y1 - y0)) * (t1 - t0);
};
const t10 = crossing(0.1 * FINAL), t90 = crossing(0.9 * FINAL), riseS = t90 - t10;
const peak = Math.max(...response.map(([, y]) => y));
const settleS = response.filter(([, y]) => Math.abs(y - FINAL) > 0.02 * FINAL).at(-1)[0];
const overshoot = peak - SETPOINT, steadyError = SETPOINT - response.at(-1)[1];

export default {
  no: 3, short: 'AdvantageScope', title: 'AdvantageScope: see what your robot is doing', minutes: 30,
  description: 'Reading robot data live and from logs with AdvantageScope, and getting that data out of Java.',
  slides: [
    L.cover({
      title: 'AdvantageScope: see what your robot is doing', subtitle: 'Reading robot data live and from logs', minutes: 30,
      notes: 'Welcome back. In Deck 2 you built a drivetrain. Today we find out what it is really doing, using a program called AdvantageScope. It turns robot data into graphs you can read, while the robot runs or from a saved file afterwards. It comes with WPILib, so you already have it. At the end you will graph your own robot. (30 seconds)',
    }),
    L.cards({
      id: 'outcomes', eyebrow: 'Outcomes', title: 'What you will be able to do', items: [
        { icon: 'Link', title: 'Connect', text: 'Open AdvantageScope and connect it to a robot.' },
        { icon: 'Code', title: 'Publish', text: 'Send values out of your Java code so you can graph them.' },
        { icon: 'Database', title: 'Save', text: 'Record a log, get it off the robot, and open it.' },
        { icon: 'Activity', title: 'Read', text: 'Read a graph and say what the robot did, and how well.' },
      ],
      notes: 'Four things today. Connect, publish, save and read. The first three are about using the tool. The last one is the real skill. Reading a graph is how you will tune an arm in Deck 6, so we will spend real time on it. If you only remember one thing from today, make it this: when the robot does something odd, look at the data before you change the code. (1 minute)',
    }),
    L.compare({
      id: 'why', eyebrow: 'Why a data viewer', title: 'Print statements versus a data viewer',
      left: { label: 'Print statements', tone: 'bad', items: ['The robot loop runs 50 times a second, so lines fly past.', 'You see one number at a time, with no shape to it.', 'Two values are hard to match up at the same moment.'] },
      right: { label: 'A data viewer', tone: 'good', items: ['Every value becomes a line you can read at a glance.', 'Everything shares one clock, so causes line up with effects.', 'You can pause, zoom in, and look again after the match.'] },
      notes: 'Your robot code runs every 20 milliseconds. That is 50 times a second, so a stutter can come and go before your eyes catch it. Print statements are fine for a quick check, and everyone uses them. But the WPILib docs say it plainly: the console does not scale to rich data. A graph shows the shape of what happened, and it lets you compare two values at the same instant. (90 seconds)',
    }),
    L.steps({
      id: 'connect', eyebrow: 'Getting connected', title: 'Starting AdvantageScope and connecting to a robot', items: [
        { title: 'Open it', text: 'In WPILib VS Code: `Ctrl+Shift+P`, then `WPILib: Start Tool`, then `AdvantageScope`.' },
        { title: 'Set your robot address once', text: '`App` > `Show Preferences...` > `Robot Address`. Team 1212 is `10.12.12.2`.' },
        { title: 'Connect', text: '`File` > `Connect to Robot` > `Default: NetworkTables 4`, or press `Ctrl+K`.' },
        { title: 'Watch the window title', text: 'It says `Searching` until the robot answers.' },
        { title: 'On a USB cable?', text: '`File` > `Use USB roboRIO Address` switches to `172.22.11.2`.' },
      ], qr: { url: 'https://docs.advantagescope.org/overview/live-sources', label: 'Live Sources docs', short: 'docs.advantagescope.org' },
      notes: 'Do this live on the projector. The address pattern is 10.TE.AM.2, where TE.AM is your team number split up, so team 1212 is 10.12.12.2. On a Mac the settings are under AdvantageScope, then Settings. Connecting to the simulator is one menu away: File, Connect to Simulator. That uses 127.0.0.1, and Deck 4 covers it. WPILib 2026.2.1 bundles AdvantageScope v26.0.0, and these labels come from that version. (2 minutes)',
    }),
    L.diagram({
      id: 'window', eyebrow: 'The interface', title: 'The AdvantageScope window', nodes: [
        { id: 'side', x: 128, y: 232, w: 340, h: 608, label: 'Sidebar', sub: 'Every field the robot sends, in folders.', tone: 'ink' },
        { id: 'field', x: 150, y: 716, w: 296, h: 88, label: 'BatteryVolts', sub: 'a field', tone: 'blue', size: 24 },
        { id: 'bar', x: 560, y: 232, w: 1228, h: 56, label: 'Tab Bar: the + button adds a tab', tone: 'ink', size: 24 },
        { id: 't1', x: 560, y: 296, w: 236, h: 120, label: 'Line Graph', sub: 'values over time', tone: 'blue' },
        { id: 't2', x: 808, y: 296, w: 236, h: 120, label: 'Table', sub: 'each change', tone: 'blue' },
        { id: 't3', x: 1056, y: 296, w: 236, h: 120, label: 'Console', sub: 'messages', tone: 'blue' },
        { id: 't4', x: 1304, y: 296, w: 236, h: 120, label: 'Statistics', sub: 'histograms', tone: 'blue' },
        { id: 't5', x: 1552, y: 296, w: 236, h: 120, label: '2D Field', sub: 'robot position', tone: 'blue' },
        { id: 'view', x: 560, y: 432, w: 1228, h: 232, label: 'Viewer Pane', sub: 'Draws the data for the tab you picked.', tone: 'paper' },
        { id: 'ctrl', x: 560, y: 680, w: 1228, h: 160, label: 'Control Pane', sub: 'Drop fields here. On a Line Graph: `Left Axis`, `Discrete Fields`, `Right Axis`.', tone: 'paper' },
      ], edges: [{ from: 'field', to: 'ctrl', label: 'drag', lx: 468, ly: 716, lw: 92 }],
      caption: 'Schematic, not a screenshot. Part and tab names come from the AdvantageScope docs and source.',
      notes: 'Now open the real app and point at each part. The sidebar lists every field. Click an arrow to open a folder. The tab bar picks a view, and the book icon opens the docs offline. Drag a field from the sidebar to Left Axis and watch it scroll. Then click the plus button to add a Table tab for exact values and a Console tab for messages. Clicking a time on the graph selects that time on every tab. (3 minutes)',
    }),
    L.code({
      id: 'level1', eyebrow: 'Level 1: see it live', title: 'Publishing a value with SmartDashboard', file: 'CANDriveSubsystem.java',
      src: { file: `${J}/CANDriveSubsystem.java`, region: 'dashboard' }, highlight: [4, 5, 6],
      caption: 'The key becomes a field. In the sidebar, open `SmartDashboard`, then `Drive`.',
      flag2027: 'SmartDashboard is removed. A Telemetry API replaces it.',
      notes: 'This is the simplest way out of the robot. SmartDashboard is a small class that writes to NetworkTables, which is how the robot shares values over the network. periodic is the method every subsystem gets, and it runs every 20 milliseconds. Put the unit in the key, like BatteryVolts, and AdvantageScope labels the axis for you. Applied output is a fraction from minus 1 to 1, so it has no unit. This data is live only. Turn off the laptop and it is gone. (90 seconds)',
    }),
    L.code({
      id: 'level2', eyebrow: 'Level 2: save it to a file', title: 'Saving a log with DataLogManager', file: 'Robot.java',
      src: { file: `${J}/Robot.java`, region: 'datalog' }, highlight: [3, 6],
      caption: 'By default the robot saves nothing. These two lines change that. The last line is next.',
      notes: 'DataLogManager records every NetworkTables change to a .wpilog file on the robot. So everything from Level 1 is now saved, with no other changes. The second line adds the enabled state and joysticks, which is what lets you line up what the driver did with what the robot did. In a log, your values sit under NT, then SmartDashboard. A log is named FRC_TBD at first, and gets a date once the Driver Station connects. If a kid asks: logging runs on its own thread, so it costs very little. (90 seconds)',
    }),
    L.codeNotes({
      id: 'level3', eyebrow: 'Level 3: the 2026 best practice', title: 'Logging whole classes with Epilogue', file: 'CANDriveSubsystem.java',
      src: { file: `${J}/CANDriveSubsystem.java`, region: 'logged' }, callouts: [
        { line: 1, title: 'Tag the class', text: 'Tag `Robot` and `RobotContainer` too.' },
        { line: 3, title: 'One line starts it', text: '`Epilogue.bind(this)`, from the last slide.' },
        { line: [4, 8], title: 'Public, no arguments', text: 'These methods are logged for you, and so are fields.' },
        { line: 12, title: 'Pick a name', text: '`name` sets what you will see in the log.' },
      ],
      notes: 'Writing a line for every value gets tiring. Epilogue is built into WPILib for Java. Tag a class with @Logged and it generates the logging code when you build. The 2026 Java template already has this set up in build.gradle. By default it sends to NetworkTables, so Level 2 saves it too. Look under Robot, then container, then drive. Each tagged class has to be reachable from Robot. If a kid asks: lots of slow CAN reads can cause loop overruns, so log what you will use. (2 minutes)',
    }),
    L.steps({
      id: 'getlog', eyebrow: 'Logs', title: 'Getting a log off the robot', items: [
        { title: 'Best: a USB stick in the roboRIO', text: 'FAT32, in place before code starts. Logs go in a `logs` folder on the stick.' },
        { title: 'No stick?', text: 'Logs go to `/home/lvuser/logs`. WPILib warns against this on a roboRIO 1.' },
        { title: 'Copy it', text: 'Pull the stick with the robot off, or use `File` > `Download Logs...`.' },
        { title: 'Check the folder', text: '`Robot Log Path` starts as `/U/logs`, the stick. Change it for internal storage.' },
        { title: 'Open it', text: '`File` > `Open Log(s)...`. REV `.revlog` and CTRE `.hoot` files open the same way.' },
      ], qr: { url: 'https://docs.advantagescope.org/overview/log-files', label: 'Log Files docs', short: 'docs.advantagescope.org' },
      flag2027: 'Systemcore alphas log to /home/systemcore/logs without a stick.',
      notes: 'In the download window, pick your logs and click the down arrow. REV StatusLogger is on by default in 2026 and AdvantageScope converts its .revlog files, though they cannot be precisely synced with other logs. CTRE Signal Logger writes .hoot files. AdvantageScope asks you to accept the CTRE license first, and logs without Pro devices show fewer signals. The Driver Station can also copy logs: click the gear, then Upload WPILogs. (2 minutes)',
    }),
    L.plot({
      id: 'story', eyebrow: 'Worked example, not a real event', title: 'Reading a brownout from voltage and current',
      xLabel: 'Time (s)', yLabel: 'Volts, and amps divided by 30', xDomain: [0, 2], yDomain: [0, 14], xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 2, 4, 6, 8, 10, 12, 14],
      refs: [{ y: BROWNOUT_V, label: `Brownout line: ${BROWNOUT_V} V` }],
      series: [
        { name: 'Tired battery V', color: 'orange', points: tired.map((p) => [p.t, p.volts]) },
        { name: `Tired battery A ÷ ${AMP_SCALE}`, color: 'blue', points: tired.map((p) => [p.t, p.amps / AMP_SCALE]) },
        { name: 'Fresh battery V', color: 'green', dash: true, points: fresh.map((p) => [p.t, p.volts]) },
      ],
      callouts: [
        { title: 'The problem', text: 'The robot stutters on a hard launch.' },
        { title: 'Voltage', text: `Falls to ${tiredLow.toFixed(1)} V, under the line.` },
        { title: 'Current', text: `Jumps to about ${Math.round(tiredPeakA / 10) * 10} A at the same moment.` },
        { title: 'The fix', text: `A fresh battery stays above ${Math.floor(freshLow * 10) / 10} V here.` },
      ],
      notes: `This story is made up. Imagine a team raises DRIVE_SCALE to 1 and the robot stutters late in practice. Below ${BROWNOUT_V} V a roboRIO 1 cuts the motors, then they return above ${RECOVER_V} V. A roboRIO 2 defaults to 6.75. Simulated: 4 CIMs, 60 A limit, 50 kg, ${GEARING} to 1, 6 inch wheels, checked every 20 ms, motors coast when cut. Assumed batteries, including wiring: ${TIRED.volts} V with ${TIRED.ohms} ohms, ${FRESH.volts} V with ${FRESH.ohms}. In AdvantageScope, put voltage on Left Axis, current on Right Axis, and BrownedOut on Discrete Fields. The Driver Station log has voltage too, with no code. (2.5 minutes)`,
    }),
    L.practice({
      id: 'practice', title: 'What to log and how to name it',
      rule: 'Log inputs and outputs, put units in the names, and log more than you think you need.',
      why: 'You cannot record something after the match is over. Inputs are what the robot sensed. Outputs are what it asked for. With both, you can tell whether the code or the machine went wrong.',
      code: 'Drive/Left             // Left what? How big?\nDrive/LeftCurrentAmps  // Clear, and AdvantageScope labels the axis',
      notes: 'Here is why inputs and outputs both matter. If the stick said full forward and the motor output was zero, look at the code. If the output was full and nothing moved, look at the robot. A number with no unit is a guess, and the unit has to be the last word in the name for AdvantageScope to read it. Log generously, because disk space is cheap and a repeat of the problem is not. If you see loop overruns, trim the slow reads. (1 minute)',
    }),
    L.table({
      id: 'gotcha-live', eyebrow: 'Common mistake', title: 'When nothing shows up live',
      columns: ['What you see', 'Why it happens', 'The fix'], widths: [27, 39, 34], rows: [
        ['Title stuck on Searching', 'Wrong Robot Address. A new install starts at 10.00.00.2.', 'Set 10.TE.AM.2 with your own team number.'],
        ['Searching, on a USB cable', 'The USB address is not the radio address.', 'File > Use USB roboRIO Address.'],
        ['Searching, or an empty sidebar', 'Wrong mode: Connect to Simulator, or the AdvantageKit, Phoenix or RLOG source.', 'File > Connect to Robot > Default: NetworkTables 4.'],
        ['Connected, but your field is missing', 'The code never published it, or was never deployed.', 'Add the put to periodic() and deploy again.'],
      ],
      notes: 'Everyone hits these, usually at the worst moment. Work top to bottom. The AdvantageKit source only listens to AdvantageKit data, so a plain WPILib robot looks empty. If a field exists but its history is missing, that is Live Mode. The default, Low Bandwidth, only fetches a field after you pick it. Logging keeps everything, which is handy on the bench but should not be used when bandwidth is limited, like on a field. (90 seconds)',
    }),
    L.gotcha({
      id: 'gotcha-log', title: 'The log is empty or missing',
      symptom: '`Failed to open log folder` or `No files found in folder`, or a file with almost nothing in it.',
      cause: 'Logging never started, no Driver Station was connected, or `Robot Log Path` is the wrong folder.',
      fix: 'Call `DataLogManager.start()`, connect the Driver Station, and match the path to where logs really are.',
      notes: 'Three causes, in order. First, nothing is saved unless you start logging. Second, logging pauses after 10 seconds with no Driver Station, and any FRC_TBD file from a run that never connected is deleted the next time the code starts. So a bench test with no Driver Station can leave you nothing. Third, the path. No stick in the robot means your logs are in /home/lvuser/logs, but AdvantageScope looks in /U/logs until you change it. (1 minute)',
    }),
    L.plot({
      id: 'control-theory', eyebrow: 'Control theory', title: 'Reading a response on a line graph',
      xLabel: 'Time (s)', yLabel: 'Arm angle (degrees)', xDomain: [0, 3], yDomain: [0, 120], xTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yTicks: [0, 30, 60, 90, 120],
      refs: [{ y: SETPOINT, label: 'Setpoint' }, { y: FINAL, label: `Final value (error ${steadyError.toFixed(0)}°)` }, { y: peak, label: `Peak (overshoot ${overshoot.toFixed(0)}°)` }],
      series: [
        { name: 'Measurement', color: 'orange', points: response },
        { name: 'Rise time', color: 'blue', points: [[t10, 0], [t10, 14], [t90, 14], [t90, 0]], tag: { x: t90, y: 14, dx: 12, dy: -15 } },
        { name: 'Settling time', color: 'green', points: [[0, 32], [settleS, 32], [settleS, FINAL]], tag: { x: settleS / 2, y: 32, dx: -60, dy: -34 } },
      ],
      callouts: [
        { title: 'Rise time', text: `${riseS.toFixed(2)} s to go from 10% to 90%.` },
        { title: 'Overshoot', text: `Swings ${overshoot.toFixed(0)} degrees past the setpoint.` },
        { title: 'Settling time', text: `${settleS.toFixed(1)} s until it stays within 2%.` },
        { title: 'Steady-state error', text: `Stops ${steadyError.toFixed(0)} degrees short.` },
      ],
      notes: `The setpoint is where you asked to go. The measurement is where it really went. Every tuning job comes down to comparing those two lines. Think of a shower: you turn the tap, it goes too hot, then settles a bit too cool. Those four numbers name what you saw. Simulated: a second-order model with natural frequency ${WN} rad/s, damping ratio ${ZETA}, and a constant load, logged every 20 ms. It is not a real arm. Rise and settling are measured against the final value, and textbooks often measure overshoot that way too. Deck 6 tunes these numbers. (3 minutes)`,
    }),
    L.exercise({
      id: 'exercise', title: 'Graphing left and right applied output', minutes: 6, tasks: [
        'Copy `periodic()` from Level 1 into your `CANDriveSubsystem`, add the imports, and deploy.',
        'Put the robot on blocks, wheels off the floor. **No robot?** `getAppliedOutput()` reads 0 in the simulator, so run Level 3 and graph `Left Motor Speed` under `Robot/container/drive/drive`.',
        'Connect AdvantageScope, then open `SmartDashboard` and `Drive` in the sidebar.',
        'Drag `LeftAppliedOutput` and `RightAppliedOutput` to `Left Axis`.',
        'Enable. Push the left stick forward, then use the right stick to turn.',
      ], done: 'both lines follow the sticks, and they move differently when you turn.',
      notes: 'Ask for a guess first: what will full stick read? Most people say 1. It reads about 0.5, because DRIVE_SCALE is 0.7 and arcadeDrive squares its inputs by default, and 0.7 squared is 0.49. That is a real finding from a graph. One side is inverted in the config (the left, on the KitBot), so one line may mirror the other. If so, have them work out why. Teams with no robot free can pair up, or use the simulator: there, getAppliedOutput reads 0 because nothing is simulating the SPARK, so those two lines stay flat and that is not a bug. With the Level 3 Epilogue code, Left Motor Speed and Right Motor Speed carry real values in the simulator. Safety first: wheels off the floor, and someone on the Driver Station ready to disable. (6 minutes)',
    }),
    L.change2027({
      id: 'change2027', items: [
        { now: 'roboRIO, logs in /home/lvuser/logs', next: 'Systemcore, logs in /home/systemcore/logs' },
        { now: 'SmartDashboard.putNumber', next: 'SmartDashboard removed. A Telemetry API replaces it.' },
        { now: 'Packages under edu.wpi.first', next: 'Packages under org.wpilib, including Epilogue' },
        { now: 'AdvantageScope for debugging', next: 'AdvantageScope and Elastic are the recommended dashboards' },
      ], note: 'WPILib 2027 is in alpha, so any of this may change. Everything in this deck is right for 2026.',
      notes: 'This is a heads-up, not homework. Do not try any of it on your 2026 robot. The good news is that the skills carry over. AdvantageScope stays, and reading a graph does not change at all. Epilogue and DataLogManager both still exist in the alpha code, in new packages. Everything you learned today is what you should use on a roboRIO. (30 seconds)',
    }),
    L.recap({
      id: 'recap', items: [
        'Connect AdvantageScope and find your way around its window.',
        'Publish with `SmartDashboard`, save with `DataLogManager`, and tag classes with `@Logged`.',
        'Get a `.wpilog` off the robot and open it.',
        'Read a brownout from voltage and current.',
        'Name rise time, overshoot, settling time and steady-state error on a graph.',
      ], next: 'Deck 4 drives the simulator in AdvantageScope, with no robot needed.',
      notes: 'Quick check before we move on: ask someone what overshoot looks like on a graph, and someone else where a log goes when there is no USB stick. Next time something odd happens on your robot, open the data first. Deck 4 uses this same tool with a simulated robot, so you can practice all of this at home. (30 seconds)',
    }),
    L.links({
      id: 'links', intro: 'Point your phone camera at a code.', items: [
        { label: 'AdvantageScope docs', url: 'https://docs.advantagescope.org', short: 'docs.advantagescope.org' },
        { label: 'On-robot data logs', url: 'https://docs.wpilib.org/en/stable/docs/software/telemetry/datalog.html', short: 'docs.wpilib.org' },
        { label: 'Epilogue', url: 'https://docs.wpilib.org/en/stable/docs/software/telemetry/robot-telemetry-with-annotations.html', short: 'docs.wpilib.org' },
        { label: 'Brownouts', url: 'https://docs.wpilib.org/en/stable/docs/software/roborio-info/roborio-brownouts.html', short: 'docs.wpilib.org' },
      ],
      notes: 'These four pages are the official docs for everything today. AdvantageScope also has its docs built in: click the book icon in the tab bar and they work with no internet, which is handy at an event. Take a photo of this slide if you want them for later. Then get your robot on blocks and let us see some graphs. (30 seconds)',
    }),
  ],
};
