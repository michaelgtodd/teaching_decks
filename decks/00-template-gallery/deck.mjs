// One of every layout. Agents and authors copy from here; it is also a smoke test for the template.
import * as L from '../../template/layouts.mjs';

const curve = (f) => Array.from({ length: 61 }, (_, i) => [i / 20, f(i / 20)]);
const J = 'examples/src/main/java/frc/robot/deck2';

export default {
  no: 0, short: 'Template gallery', title: 'Template gallery: every slide layout',
  description: 'Every layout in the shared deck template, shown once.',
  slides: [
    L.cover({ title: 'Template gallery', subtitle: 'Every slide layout the decks are built from' }),
    L.sectionSlide({ id: 'section', no: 1, title: 'A section divider', sub: 'Opens a part of the deck', section: 'Text layouts', notes: 'Section slides split a deck into parts.' }),
    L.statement({ id: 'statement', text: 'One idea, in **big letters**, once or twice a deck.', sub: 'The accent slide, for one key sentence.', notes: 'Statement slide.' }),
    L.lead({ id: 'lead', eyebrow: 'Layout: lead', title: 'A short paragraph with supporting points', text: 'A lead slide holds one idea in a sentence or two, for when a list would chop the reasoning up.', points: ['A supporting point sits underneath it.', 'Inline `code` turns blue, and **bold** works too.'], notes: 'Lead slide.' }),
    L.points({ id: 'points', eyebrow: 'Layout: points', title: 'A short list when the items really are parallel', items: ['**Subsystems** own hardware.', '**Commands** say what to do with it.', '**Triggers** decide when.'], notes: 'Points slide.' }),
    L.cards({ id: 'cards', eyebrow: 'Layout: cards', title: 'Two to six cards', items: [
      { icon: 'Wrench', title: 'Subsystem', text: 'One class per mechanism. It owns the motors.' },
      { icon: 'PaperPlane', title: 'Command', text: 'One action, with a start, a loop and an end.' },
      { icon: 'Lightning', title: 'Trigger', text: 'Connects a button or a condition to a command.' },
    ], notes: 'Cards slide.' }),
    L.steps({ id: 'steps', eyebrow: 'Layout: steps', title: 'Numbered steps, with an optional QR code', items: [
      { title: 'Download the installer', text: 'Grab the 2026 WPILib release for Windows.' },
      { title: 'Run it', text: 'Pick "Everything" so VS Code comes along.' },
      { title: 'Check it', text: 'Open WPILib VS Code from the desktop shortcut.' },
    ], qr: { url: 'https://docs.wpilib.org/en/stable/docs/zero-to-robot/step-2/wpilib-setup.html', label: 'WPILib install guide', short: 'docs.wpilib.org: WPILib Installation' }, notes: 'Steps slide with a QR code.' }),
    L.sectionSlide({ id: 'section2', no: 2, title: 'Code layouts', section: 'Code layouts', notes: 'Code comes straight from compiled source files.' }),
    L.code({ id: 'code', eyebrow: 'Layout: code', title: 'Full-width code', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'bindings' }, highlight: [5, 6], caption: 'Pulled by region from a real file in `examples/`.', notes: 'Code slide.' }),
    L.codeNotes({ id: 'codeNotes', eyebrow: 'Layout: codeNotes', title: 'Code with numbered callouts', file: 'CANDriveSubsystem.java', src: { file: `${J}/CANDriveSubsystem.java`, region: 'hardware' }, callouts: [
      { line: 1, title: 'Brushed', text: 'CIMs are brushed motors.' },
      { line: 12, title: 'Two leaders', text: 'Followers copy their leader.' },
    ], notes: 'Code with callouts.' }),
    L.compare({ id: 'compare', eyebrow: 'Layout: compare', title: 'Side by side', left: { label: 'Not this', tone: 'bad', code: 'while (!atGoal()) {\n  motor.set(0.5);\n}' }, right: { label: 'This', tone: 'good', code: 'run(() -> motor.set(0.5))\n    .until(this::atGoal);' }, notes: 'Compare slide.' }),
    L.table({ id: 'table', eyebrow: 'Layout: table', title: 'A table with a caption', columns: ['Motor', 'Type', 'SPARK MAX setting'], widths: [30, 30, 40], rows: [['CIM', 'Brushed', 'kBrushed'], ['NEO', 'Brushless', 'kBrushless']], caption: 'Rows stripe automatically.', notes: 'Table slide.' }),
    L.sectionSlide({ id: 'section3', no: 3, title: 'Recurring layouts', section: 'Recurring slides', notes: 'These repeat across every deck.' }),
    L.gotcha({ id: 'gotcha', title: 'The robot spins in circles', symptom: 'Push forward and the robot turns on the spot.', cause: 'Both sides run the same direction, but the motors face opposite ways.', fix: 'Invert one side in its config: `.inverted(true)`.', notes: 'Gotcha slide.' }),
    L.practice({ id: 'practice', title: 'Keep numbers in Constants', rule: 'Every CAN ID, limit and gain gets a name in `Constants.java`.', why: 'When a motor is swapped at competition you change one line, and the code explains itself.', notes: 'Practice slide.' }),
    L.exercise({ id: 'exercise', title: 'Make it drive', tasks: ['Add `driveArcade` to your subsystem.', 'Set it as the default command.', 'Deploy with the wheels off the ground.'], done: 'Push the stick forward and both sides spin forward.', notes: 'Exercise slide.' }),
    L.plot({ id: 'plot', eyebrow: 'Layout: plot', title: 'A chart with callouts', xLabel: 'Time (s)', yLabel: 'Arm angle (degrees)', xDomain: [0, 3], yDomain: [0, 120], xTicks: [0, 1, 2, 3], yTicks: [0, 30, 60, 90, 120], refs: [{ y: 90, label: 'Setpoint' }],
      series: [{ name: 'P only', color: 'orange', points: curve((t) => 90 * (1 - Math.exp(-2 * t) * Math.cos(6 * t))), tag: { x: 1.6, y: 112, dy: -10 } }, { name: 'P + D', color: 'blue', dash: true, points: curve((t) => 90 * (1 - Math.exp(-5 * t))), tag: { x: 0.9, y: 56, dy: 8 } }],
      callouts: [{ title: 'Overshoot', text: 'Too much P swings past the target.' }, { title: 'Damping', text: 'D brakes as the error shrinks.' }], notes: 'Plot slide. These gallery curves are illustrative only.' }),
    L.diagram({ id: 'diagram', eyebrow: 'Layout: diagram', title: 'Blocks and arrows', nodes: [
      { id: 'a', x: 128, y: 400, w: 300, h: 150, label: 'Setpoint', sub: 'where we want to be', tone: 'blue' },
      { id: 'b', x: 620, y: 400, w: 300, h: 150, label: 'Controller', tone: 'ink' },
      { id: 'c', x: 1110, y: 400, w: 300, h: 150, label: 'Arm', tone: 'paper' },
      { id: 'd', x: 620, y: 650, w: 300, h: 120, label: 'Encoder', tone: 'accent' },
    ], edges: [
      { from: 'a', to: 'b', label: 'goal' }, { from: 'b', to: 'c', label: 'volts' },
      { from: 'c', to: 'd', fromSide: 'b', toSide: 'r', route: 'vh' }, { from: 'd', to: 'b', fromSide: 't', toSide: 'b', label: 'measured', lx: 800, ly: 590, lw: 180 },
    ], notes: 'Diagram slide.' }),
    L.change2027({ id: 'change', items: [{ now: 'Shuffleboard', next: 'Removed: use Elastic' }, { now: 'edu.wpi.first packages', next: 'org.wpilib packages' }], note: 'Everything here is still true for the 2026 roboRIO.', notes: 'Change slide.' }),
    L.recap({ id: 'recap', items: ['Making a slide from a layout.', 'Letting the build catch overflow.'], next: 'The real decks.', notes: 'Recap slide.' }),
    L.links({ id: 'links', items: [
      { label: 'Zero to Robot', url: 'https://docs.wpilib.org/en/stable/docs/zero-to-robot/introduction.html' },
      { label: 'Command-based', url: 'https://docs.wpilib.org/en/stable/docs/software/commandbased/index.html' },
      { label: 'AdvantageScope', url: 'https://docs.advantagescope.org' },
    ], notes: 'Links slide with QR codes.' }),
  ],
};
