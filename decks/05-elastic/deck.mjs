// Deck 5: the Elastic dashboard. Every UI label is from Elastic v2026.1.1, the tag WPILib 2026.2.1 installs.
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck5';

// gotcha and practice take inline code only, so read the region here. The slide still shows compiled code.
function region(file, name) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const open = lines.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = lines.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  if (open < 0 || close < open) throw new Error(`no region ${name} in ${file}`);
  const body = lines.slice(open + 1, close);
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(indent)).join('\n');
}

// Computed, not drawn. A generic arm with no gravity under P-only control, stepping toward a 90 degree setpoint.
//   speed lags the commanded speed:  d(speed)/dt = (DEG_PER_S_PER_VOLT * volts - speed) / LAG_S
// Volts are clamped to +/- 12 and held between 20 ms control loops. The physics steps at 1 ms.
const SETPOINT = 90, DEG_PER_S_PER_VOLT = 15, LAG_S = 0.4, MAX_VOLTS = 12, LOOP_S = 0.02, STEP_S = 0.001, SECONDS = 4;
function armResponse(kP) {
  const points = [];
  let angle = 0, speed = 0, volts = 0;
  const stepsPerLoop = Math.round(LOOP_S / STEP_S);
  for (let i = 0; i <= Math.round(SECONDS / STEP_S); i++) {
    if (i % stepsPerLoop === 0) {
      volts = Math.max(-MAX_VOLTS, Math.min(MAX_VOLTS, kP * (SETPOINT - angle)));
      points.push([i * STEP_S, angle]);
    }
    speed += STEP_S * (DEG_PER_S_PER_VOLT * volts - speed) / LAG_S;
    angle += STEP_S * speed;
  }
  return points;
}
const LOW_KP = 0.04, MID_KP = 0.08, HIGH_KP = 0.5;
const low = armResponse(LOW_KP), mid = armResponse(MID_KP), high = armResponse(HIGH_KP);
const peakOver = (pts) => Math.round(Math.max(...pts.map(([, y]) => y)) - SETPOINT);
const secondsToNear = (pts) => pts.find(([, y]) => y >= 0.95 * SETPOINT)?.[0].toFixed(1);
const lastAngle = (pts) => Math.round(pts[pts.length - 1][1]);

export default {
  no: 5, short: 'Elastic', title: 'Elastic: your robot on a dashboard',
  description: 'Using the Elastic dashboard bundled with WPILib 2026 to see data, pick an auto, tune a value and keep a layout.',
  slides: [
    L.cover({ title: 'Elastic: your robot on a dashboard', subtitle: 'See live data, pick an auto and tune a value from the laptop',
      notes: 'This is Elastic, the dashboard that comes with WPILib 2026. The exercise builds a driver tab, on a robot or in the simulator from Deck 4.' }),

    L.cards({ id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers', items: [
      { icon: 'Activity', title: 'Read the robot', text: 'Send numbers from Java and watch them live in Elastic.' },
      { icon: 'Play', title: 'Pick an auto', text: 'Give the drive team an auto chooser on the laptop.' },
      { icon: 'Settings', title: 'Tune a value', text: 'Change a number from the dashboard safely, and see what it does.' },
      { icon: 'Database', title: 'Keep your layout', text: 'Save the layout in your repo and load it from the robot.' },
    ], notes: 'The auto chooser is the one every team needs, because the drive team picks an auto before each match. Everything here uses Elastic version 2026.1.1, the one the WPILib 2026 installer gives you.' }),

    L.diagram({ id: 'networktables', eyebrow: 'What a dashboard is for', title: 'NetworkTables: values shared by robot and laptop', nodes: [
      { id: 'write', x: 128, y: 370, w: 360, h: 110, label: 'Robot code writes', sub: '`putNumber`', tone: 'ink' },
      { id: 'read', x: 128, y: 590, w: 360, h: 110, label: 'Robot code reads', sub: '`getNumber`', tone: 'ink' },
      { id: 'book', x: 620, y: 248, w: 680, h: 100, label: 'NetworkTables', sub: 'shared keys and values, hosted by the robot', tone: 'accent' },
      { id: 'line1', x: 620, y: 380, w: 680, h: 90, label: '`Battery (V)`: 12.4', tone: 'paper' },
      { id: 'line2', x: 620, y: 490, w: 680, h: 90, label: '`Auto`: Do nothing', tone: 'paper' },
      { id: 'line3', x: 620, y: 600, w: 680, h: 90, label: '`Drive Scale`: 0.7', tone: 'paper' },
      { id: 'show', x: 1432, y: 370, w: 360, h: 110, label: 'Elastic shows it', sub: 'as a widget', tone: 'blue' },
      { id: 'type', x: 1432, y: 590, w: 360, h: 110, label: 'You change it', sub: 'in Elastic', tone: 'blue' },
    ], edges: [
      { from: 'write', to: 'line1' }, { from: 'line1', to: 'show' },
      { from: 'type', to: 'line3', fromSide: 'l', toSide: 'r' }, { from: 'line3', to: 'read', fromSide: 'l', toSide: 'r' },
    ], caption: 'Each line is a key and a value. Either side can write, and both see the change.',
    notes: 'A dashboard is a program on the laptop that shows what is going on inside the robot. Drivers need a few values during a match, and programmers need many more. Both come through NetworkTables, a set of values hosted by the robot. The robot writes a value and Elastic reads it. You change a value in Elastic and the robot reads that. Each entry has a key, which is its name, and a value. These values are examples. The robot program hosts NetworkTables, so it restarts when the code restarts.' }),

    L.steps({ id: 'open-connect', eyebrow: 'Getting started', title: 'Open Elastic and connect it to the robot', items: [
      { title: 'Open Elastic', text: 'Driver Station gear tab: set **Dashboard Type** to Elastic. Or VS Code: WPILib logo, **Start Tool**, **Elastic**.' },
      { title: 'Open the network settings', text: 'Click **Settings**, then the **Network** tab.' },
      { title: 'At a robot with the Driver Station running', text: 'Set **IP Address Mode** to **Driver Station**. This is the default.' },
      { title: 'Without the Driver Station, or in simulation', text: '**Team Number (10.TE.AM.2)** with your **Team Number**, or **localhost (127.0.0.1)** for the simulator.' },
      { title: 'Check the bottom of the window', text: '**Network Tables: Connected** means Elastic has reached the robot.' },
    ], qr: { url: 'https://frc-elastic.gitbook.io/docs/getting-started/connecting-to-your-robot', label: 'Connecting to your robot', short: 'frc-elastic.gitbook.io' },
    notes: 'Two ways to open it. The KitBot guide uses the Dashboard Type dropdown on the Driver Station gear tab, and then Elastic opens with the Driver Station. WPILib docs use VS Code: press Ctrl+Shift+P or click the WPILib logo, choose Start Tool, then Elastic. Driver Station mode is the easiest, because Elastic asks the Driver Station where the robot is. Ctrl+K and Ctrl+Shift+K are shortcuts for robot and simulator. If your Driver Station does not list Elastic, use Start Tool.' }),

    L.diagram({ id: 'interface', eyebrow: 'The Elastic window', title: 'The window: tabs, a grid and the Add Widget button', nodes: [
      { id: 'menu', x: 128, y: 232, w: 760, h: 66, label: 'File · Edit · Help · Settings', tone: 'ink', size: 26 },
      { id: 'add', x: 904, y: 232, w: 324, h: 66, label: '+ Add Widget', tone: 'accent', size: 26 },
      { id: 'tabs', x: 128, y: 314, w: 1100, h: 66, label: 'Teleoperated · Autonomous · +', tone: 'blue', size: 26 },
      { id: 'w1', x: 128, y: 396, w: 354, h: 150, label: 'Text Display', sub: 'a number you can edit' },
      { id: 'w2', x: 501, y: 396, w: 354, h: 150, label: 'Voltage View', sub: 'a bar for the battery' },
      { id: 'w3', x: 874, y: 396, w: 354, h: 150, label: 'ComboBox Chooser', sub: 'your auto picker' },
      { id: 'grid', x: 128, y: 562, w: 1100, h: 150, label: 'The grid', sub: 'Drag a widget to move it. Drag an edge to resize it.', tone: 'ghost' },
      { id: 'foot', x: 128, y: 728, w: 1100, h: 60, label: 'Network Tables: Connected', tone: 'ink', size: 24 },
      { id: 'n1', x: 1268, y: 232, w: 524, h: 150, label: 'Add Widget', sub: 'Expand **SmartDashboard**, then drag a value onto the grid.', tone: 'ghost' },
      { id: 'n2', x: 1268, y: 396, w: 524, h: 150, label: 'Right-click a widget', sub: '**Show As** changes its type. **Edit Properties** has the rest.', tone: 'ghost' },
      { id: 'n3', x: 1268, y: 562, w: 524, h: 100, label: 'Right-click a tab', sub: 'Rename, Duplicate or Close.', tone: 'ghost' },
      { id: 'n4', x: 1268, y: 678, w: 524, h: 110, label: 'Edit, Lock Layout', sub: 'Stops widgets moving at a match.', tone: 'ghost' },
    ], caption: 'Schematic, not a screenshot.',
    notes: 'Elastic starts with two empty tabs, Teleoperated and Autonomous. Click Add Widget, expand SmartDashboard, then click and drag each value onto the grid. Those are the KitBot guide steps. Green outline means it fits, red means it does not. Drag an edge to resize. Right-click, Show As, to change the type. The Layouts tab in that dialog has List Layout, for grouping tiles. Lock Layout stops widgets moving, and you can still use them.' }),

    L.codeNotes({ id: 'publish', eyebrow: 'Sending data from Java', title: 'Send data with SmartDashboard', file: 'CANDriveSubsystem.java', src: { file: `${J}/CANDriveSubsystem.java`, region: 'publish' }, callouts: [
      { line: 3, title: 'A subsystem widget', text: 'It shows the running command, so name yours with `withName`.' },
      { line: 4, title: 'A command button', text: 'Click it to run the command on an enabled robot.' },
      { line: 9, title: 'Every 20 ms', text: 'Send a few useful values. Put the rest in logs.' },
      { line: 11, title: 'Units in the name', text: '`Battery (V)` needs no explanation at a match.' },
    ], flag2027: '`SmartDashboard` is replaced by the Telemetry and Tunables APIs.',
    notes: 'SmartDashboard is the Java class that writes to NetworkTables, and it is the 2026 way to do this. putNumber sends one number. putData sends a whole object with its own widget. Without withName a command shows up as something like RunCommand. Elastic asks for new values about every 60 ms by default, so a dashboard number will not update any faster however often you send it. Every extra value is work inside your 20 ms loop. A slash in a key makes a folder.' }),

    L.codeNotes({ id: 'chooser', eyebrow: 'Autonomous', title: 'An auto chooser with SendableChooser', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'chooser' }, callouts: [
      { line: 5, title: 'A safe default', text: 'If nobody picks, the robot does nothing.' },
      { line: 8, title: 'Send it once', text: 'Drag `Auto` out of **SmartDashboard** in Add Widget.' },
      { line: 13, title: 'Read it late', text: 'Calling `getSelected()` here means the last pick wins.' },
    ], flag2027: '`SendableChooser` is replaced by `Selectable`.',
    notes: 'Every team needs this. A chooser is a list of commands with names. Robot.java calls getAutonomousCommand when auto starts, so the pick is read at the last moment. If you read getSelected in a constructor, you only ever get the default. In Elastic this appears as a ComboBox Chooser. A green check means the robot has your pick. A red exclamation mark means it does not. Elastic re-sends your pick after a code restart.' }),

    L.gotcha({ id: 'live-tuning', title: 'Live tuning: Enter disables an enabled robot',
      symptom: 'You type a new value into a box, press Enter, and the enabled robot stops.',
      cause: 'Enter is the Driver Station shortcut for Disable, even while you are typing.',
      fix: 'Robot enabled? Click the box\'s submit button: **Show Submit Button** in **Edit Properties**.',
      code: region(`${J}/RobotContainer.java`, 'tuning'), flag2027: 'The Tunables API replaces `SmartDashboard` for typed-in values.',
      notes: 'The code makes a box you can type in. With the robot disabled, Enter is fine. With it enabled, use the submit button.' }),

    L.plot({ id: 'tune-gain', eyebrow: 'Control theory', title: 'Tuning a gain live from a graph', xLabel: 'Time (s)', yLabel: 'Arm angle (degrees)', xDomain: [0, 4], yDomain: [0, 120], xTicks: [0, 1, 2, 3, 4], yTicks: [0, 30, 60, 90, 120], refs: [{ y: SETPOINT, label: 'Setpoint' }],
      series: [
        { name: `kP ${LOW_KP}`, color: 'orange', points: low, tag: { x: 2.3, y: 52, dy: 0, w: 150 } },
        { name: `kP ${MID_KP}`, color: 'blue', dash: true, points: mid, tag: { x: 1.6, y: 76, dy: 0, w: 150 } },
        { name: `kP ${HIGH_KP}`, color: 'green', points: high, tag: { x: 1.2, y: 116, dy: 0, w: 150 } },
      ], callouts: [
        { title: 'One change at a time', text: 'Change one gain, then look. Change two and you cannot tell which one helped.' },
        { title: 'A manual loop', text: 'Read the graph, decide, change the gain, then read it again.' },
        { title: `Too low, then too high`, text: `kP ${LOW_KP} reaches only ${lastAngle(low)} degrees in ${SECONDS} s. kP ${HIGH_KP} swings ${peakOver(high)} degrees past.` },
        { title: 'Send the gains', text: '`SmartDashboard.putData("Arm PID", pid)`' },
      ], notes: `These curves are simulated, not measured. The model is an arm with no gravity: ${DEG_PER_S_PER_VOLT} degrees per second per volt, a ${LAG_S} second lag, a ${MAX_VOLTS} volt limit and a 20 ms control loop, using only P to reach ${SETPOINT} degrees. A control loop measures, compares and corrects. When you tune, you are part of a loop too. PIDController is Sendable, so Elastic shows boxes for kP, kI, kD and Setpoint. Click Publish Values to send them. Enter does not. Put a Graph of the angle beside it. Deck 6 goes deeper.` }),

    L.compare({ id: 'driver-debug', eyebrow: 'Best practice', title: 'A clean driver tab and a noisy debug tab', left: { label: 'Driver tab: a quick glance', tone: 'good', items: [
      'Battery and the auto chooser, drawn large.',
      'Nothing you need to read twice.',
      'Layout locked for matches.',
    ] }, right: { label: 'Debug tab: everything', tone: 'neutral', items: [
      'Motor outputs, gains and graphs.',
      'Subsystem widgets and command names.',
      'Keys with units, like `Left Output (%)`.',
    ] }, notes: 'The WPILib docs note that when the drive team looks at the dashboard, their focus leaves the match. LEDs on the robot are often a better way to tell the driver something. Elastic gives you two tabs to start, and the plus button adds more. The exercise builds both.' }),

    L.practice({ id: 'layout-on-robot', title: 'Keep the layout on the robot',
      rule: 'Put the layout file in your deploy folder, so it lives in the repo and on the robot.',
      why: '**Save** keeps it inside Elastic on one laptop. **Save As** writes a `.json` file you can commit. **Download From Robot** gives any laptop the same layout.',
      code: region(`${J}/RobotContainer.java`, 'serve'),
      notes: 'With the layout on the robot, any laptop can connect and press Ctrl+D to load it. Elastic lists every json file in the top of the deploy folder. Overwrite replaces tabs with the same name, and Merge adds new widgets into free space. Open Layout loads a json file from the laptop. One note: Elastic docs still say Export Layout, but the 2026.1.1 menu says Save As.' }),

    L.codeNotes({ id: 'notifications', eyebrow: 'Elastic extras', title: 'Driver notifications and tab switching', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'alerts' }, callouts: [
      { line: 1, title: 'Copy the helper', text: 'Add `Elastic.java` from Elastic\'s repo to your `util` folder.' },
      { line: 3, title: 'A popup', text: 'A level, a title and text. It shows for 3 s by default.' },
      { line: 9, title: 'Wait a moment', text: 'The battery must stay low for 2 s, so a quick dip is ignored.' },
      { line: [12, 14], title: 'Switch tabs', text: '`selectTab` takes a tab name. No match means no change.' },
    ], notes: 'These two extras need one file, Elastic.java, from the elasticlib folder of Elastic\'s repo. Elastic docs suggest a folder called util, and you may need to change the package line at the top. Our own helper, once, wraps runOnce with ignoringDisable so it also works while disabled. The tab names here are the two Elastic starts with, and they must match yours exactly. These work only in Elastic. withNoAutoDismiss keeps a popup on screen.' }),

    L.table({ id: 'symptoms', eyebrow: 'Common mistake', title: 'Six symptoms and where they come from', columns: ['What you see', 'Why', 'Fix'], widths: [27, 39, 34], rows: [
      ['A typed value snaps back at once', 'putNumber in periodic writes over the box every 20 ms', 'setDefaultNumber once, then getNumber'],
      ['A typed value is gone after a code restart', 'NetworkTables starts empty and Elastic does not re-send it', 'Copy good values into Constants.java'],
      ['A widget is blank', 'An old layout: the key was renamed, or never sent', 'Remove it and drag in the new key'],
      ['A number never changes', 'The code sent it once, from a constructor', 'Send it from periodic'],
      ['Every widget looks dimmed', 'Elastic is disconnected', 'Read the bottom bar, then IP Address Mode'],
      ['The chooser shows a red mark', 'The robot lacks your pick. In 2026.1.1, Show As on a chooser stops it sending', 'Leave it as ComboBox Chooser'],
    ], notes: 'The first two look alike. putNumber writes every time it runs, while setDefaultNumber writes only into an empty box. Neither saves a typed value through a code restart, because Elastic does not send it back. The KitBot guide gives the fix: put a value you like into Constants. Advanced teams can use setPersistent, but then putNumber at startup would still overwrite it. The chooser bug is fixed in Elastic 2026.1.2, which WPILib 2026.2.1 does not install.' }),

    L.exercise({ id: 'exercise', title: 'Build a driver tab and save it', tasks: [
      'Add the `Battery (V)`, `Left Output (%)` and `Auto` code, then deploy or simulate.',
      'Click **Add Widget**, expand **SmartDashboard**, and drag `Battery (V)` and `Auto` to **Teleoperated**.',
      'Right-click `Battery (V)`, then **Show As**, **Voltage View**.',
      'Click **+**, rename the new tab `Debug`, and drag `Left Output (%)` onto it.',
      '**File**, **Save As**, into `src/main/deploy/elastic-layout.json`.',
    ], done: '`Auto` shows a green check, and the file is in your deploy folder.', notes: 'With no robot, use the simulator with localhost. Rename a tab by right-clicking it and choosing Rename. Voltage View runs from 4 to 13 volts by default. In simulation the battery number may not change. Do not press Enter on an enabled robot.' }),

    L.change2027({ id: 'change', items: [
      { now: 'Older tutorials show Shuffleboard', next: 'Removed for 2027, so those steps do not apply' },
      { now: 'Elastic comes with WPILib', next: 'One of two recommended dashboards, with AdvantageScope' },
      { now: 'SmartDashboard.putNumber and putData', next: 'Telemetry and Tunables APIs' },
      { now: 'SendableChooser', next: 'Selectable' },
    ], note: 'Everything in this deck is correct for 2026. WPILib 2027 is still in alpha, so details may change.',
    notes: 'Elastic is one of the two dashboards WPILib recommends for 2027. The Java you send data with will change: the Telemetry and Tunables APIs take over from SmartDashboard, and Selectable takes over from SendableChooser. Use this deck for 2026, because Systemcore kits are not out yet.' }),

    L.recap({ id: 'recap', items: [
      'Sending data with `SmartDashboard` and viewing it in Elastic.',
      'An auto chooser with a safe default.',
      'Tuning with the submit button, never Enter on an enabled robot.',
      'Changing one gain at a time and watching the graph.',
      'Keeping the layout in the deploy folder, so it lives on the robot.',
    ], next: 'Deck 6 tunes an arm with PID and feedforward.', notes: 'Deck 6 uses this same dashboard and graph to tune an arm.' }),

    L.links({ id: 'links', items: [
      { label: 'Elastic docs', url: 'https://frc-elastic.gitbook.io/docs', short: 'frc-elastic.gitbook.io' },
      { label: 'Layouts from the robot', url: 'https://frc-elastic.gitbook.io/docs/additional-features-and-references/remote-layout-downloading', short: 'Remote Layout Downloading' },
      { label: 'Notifications and tabs', url: 'https://frc-elastic.gitbook.io/docs/additional-features-and-references/robot-notifications-with-elasticlib', short: 'ElasticLib' },
      { label: 'NetworkTables', url: 'https://docs.wpilib.org/en/stable/docs/software/networktables/networktables-intro.html', short: 'docs.wpilib.org' },
    ], notes: 'The Elastic docs can lag behind the app, so a menu label may differ from 2026.1.1. The ElasticLib page covers everything else notifications can do.' }),
  ],
};
