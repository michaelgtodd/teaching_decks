// Deck 1: a first command-based program, built by following WPILib's own documentation.
// Each slide's `ref` names the WPILib page it comes from. Claims are sourced in SOURCES.md.
// Screenshots are from the WPILib docs (CC BY 4.0). Copies are in images/, and the slides use the uploaded assets.
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const WPI = 'https://docs.wpilib.org/en/stable/docs';
const CB = `${WPI}/software/commandbased`;
const VS = `${WPI}/software/vscode-overview`;
const REF = {
  wpilib: { label: 'What is WPILib?', url: `${WPI}/software/what-is-wpilib.html` },
  what: { label: 'What Is "Command-Based" Programming?', url: `${CB}/what-is-command-based.html` },
  scheduler: { label: 'The Command Scheduler', url: `${CB}/command-scheduler.html` },
  structure: { label: 'Structuring a Command-Based Robot Project', url: `${CB}/structuring-command-based-project.html` },
  create: { label: 'Creating your Test Drivetrain Program', url: `${WPI}/zero-to-robot/step-4/creating-test-drivetrain-program-cpp-java-python.html` },
  subsystems: { label: 'Subsystems', url: `${CB}/subsystems.html` },
  commands: { label: 'Commands', url: `${CB}/commands.html` },
  triggers: { label: 'Binding Commands to Triggers', url: `${CB}/binding-commands-to-triggers.html` },
  vendor: { label: '3rd Party Libraries', url: `${VS}/3rd-party-libraries.html` },
  sim: { label: 'Simulation Specific User Interface Elements', url: `${WPI}/software/wpilib-tools/robot-simulation/simulation-gui.html` },
  deploy: { label: 'Building and Deploying Robot Code', url: `${VS}/deploying-robot-code.html` },
  run: { label: 'Running your Test Program', url: `${WPI}/zero-to-robot/step-4/running-test-program.html` },
};
const SHOT = 'Screenshot: WPILib documentation, CC BY 4.0.';

// Code on the slides is the compiled code in examples/, shown under the package names of a real project.
const J = 'examples/src/main/java/frc/robot/deck1';
function region(file, name) {
  const text = readFileSync(`${J}/${file}`, 'utf8').split('\n');
  const open = text.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  if (open < 0 || close < 0) throw new Error(`no region ${name} in ${file}`);
  const body = text.slice(open + 1, close);
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(indent)).join('\n').replaceAll('frc.robot.deck1', 'frc.robot');
}

// A headless WPILib run of the code in examples/. See SOURCES.md.
const RUN = JSON.parse(readFileSync('decks/01-first-robot-program/sim-run.json', 'utf8'));
const SPEED = RUN.held;
const END = RUN.samples.at(-1).ms;
const onAt = RUN.samples.find((s) => s.output > 0).ms;
const offAt = RUN.samples.find((s) => s.ms > onAt && s.output === 0).ms;
if (onAt - RUN.pressMs > RUN.loopMs || offAt - RUN.releaseMs > RUN.loopMs) throw new Error('the run no longer matches the slide');
if (RUN.afterDisable !== 0) throw new Error('disabling should stop the motor');
const buttonLine = [[0, 0], [RUN.pressMs, 0], [RUN.pressMs, 1], [RUN.releaseMs, 1], [RUN.releaseMs, 0], [END, 0]];
const outputLine = RUN.samples.flatMap((s, i) => (i ? [[s.ms, RUN.samples[i - 1].output], [s.ms, s.output]] : [[s.ms, s.output]]));

const IMG = {
  creator: '/_blob/fb5ec6ca52654483c427960412101194',
  sim: '/_blob/679cb31e8995d7a87393ae5f9c3d5cf4',
  vendor: '/_blob/6ba9f00841ad94c2d5efc61afadc5b63',
  ds: '/_blob/e88cb65afbc22f3eccb0e3e3695d6768',
};

const WIRE = 'Command-based';
const FIRST = 'First program';
const MOTOR = 'One motor';
const ROBOT = 'On the robot';

export default {
  no: 1, short: 'Your first robot program', title: 'Your first robot program',
  description: 'A first command-based Java program, built from WPILib\'s template by following WPILib\'s documentation.',
  slides: [
    L.cover({
      title: 'Your first robot program',
      subtitle: 'A command-based Java program, built from WPILib\'s template',
      notes: 'This deck follows WPILib\'s documentation to build one small command-based Java program. The footer of each slide names the WPILib page it comes from, and the links slide has QR codes to the main ones. WPILib must already be installed, which the Setup lab covers.',
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers',
      text: 'One small program: hold a button and a motor spins. It starts from WPILib\'s Command Robot template, the base for every project in these decks.',
      points: [
        'How WPILib and command-based code fit together.',
        'A new project from the Command Robot template.',
        'A first binding, tested in the simulator with no robot.',
        'One subsystem and one motor, running on a robot.',
      ],
      notes: 'The first version of the program only prints a message, so it runs on any laptop. The second version needs a robot with one motor that can spin freely, on a SPARK MAX over CAN. Deck 2 uses the same parts to drive the KitBot.',
    }),

    L.diagram({
      id: 'wpilib', eyebrow: 'WPILib', title: 'Your code and WPILib run on the roboRIO', ref: REF.wpilib,
      caption: '"The standard software library provided for teams to write code for their FRC robots."',
      nodes: [
        { id: 'vscode', x: 128, y: 262, w: 340, h: 150, label: 'VS Code', sub: 'write, build and deploy', tone: 'paper' },
        { id: 'ds', x: 128, y: 560, w: 340, h: 150, label: 'Driver Station', sub: 'enable, and send controller input', tone: 'paper' },
        { id: 'rio', x: 640, y: 262, w: 450, h: 448, label: 'roboRIO', sub: 'your Java program, running on WPILib', tone: 'accent', size: 40 },
        { id: 'spark', x: 1242, y: 406, w: 250, h: 160, label: 'SPARK MAX', sub: 'sets the motor power', tone: 'blue' },
        { id: 'motor', x: 1562, y: 406, w: 230, h: 160, label: 'Motor', tone: 'paper' },
      ],
      edges: [
        { from: 'vscode', to: 'rio', route: 'elbow', label: 'deploy', lx: 472, ly: 296, lw: 110 },
        { from: 'ds', to: 'rio', route: 'elbow', label: 'enable', lx: 472, ly: 594, lw: 110 },
        { from: 'rio', to: 'spark', label: 'CAN', lx: 1104, ly: 442, lw: 124 },
        { from: 'spark', to: 'motor' },
      ],
      notes: 'WPILib is a library: ready-made Java classes for the control system, including sensors, motor controllers and the Driver Station. Code is not compiled on the robot. Your laptop builds it, which WPILib calls cross-compilation, and then deploys it to the roboRIO. The roboRIO runs the program. Driver Station stays connected to enable the robot and to send controller input. The SPARK MAX is a motor controller on the CAN bus.',
    }),

    L.cards({
      id: 'parts', eyebrow: WIRE, title: 'The parts of a command-based program', ref: REF.what,
      intro: 'WPILib builds the pattern around two core abstractions: **commands** and **subsystems**.',
      items: [
        { icon: 'PaperPlane', title: 'Command', text: 'An action the robot can take. It runs when scheduled, until interrupted or finished.' },
        { icon: 'Wrench', title: 'Subsystem', text: 'Robot hardware that operates together. Only one command can use it at a time.' },
        { icon: 'Lightning', title: 'Trigger', text: 'An event, such as a button press. Binding a command to it schedules that command.' },
        { icon: 'Settings', title: 'CommandScheduler', text: 'The WPILib class that runs commands. Scheduling a command adds it to the running list.' },
      ],
      notes: 'In this deck\'s program, the subsystem is RollerSubsystem, which contains one motor. The command is spinCommand, which turns that motor on and off. The trigger is the A button. The scheduler comes from WPILib and needs no changes. WPILib describes command-based as one possible design pattern, and a very effective one: the code tends to be clean, extensible and easy to reuse from year to year.',
    }),

    L.compare({
      id: 'declarative', eyebrow: WIRE, title: 'Command-based code declares what should happen', ref: REF.what,
      left: { label: 'Checking the button every loop', tone: 'neutral', code: `
if (condition.get()) {
  if (!pressed) {
    piston.set(
        DoubleSolenoid.Value.kForward);
    pressed = true;
  }
} else {
  pressed = false;
}` },
      right: { label: 'Declaring it once', tone: 'good', code: `
new Trigger(condition::get)
    .onTrue(Commands.runOnce(
        () -> piston.set(
            DoubleSolenoid.Value.kForward)));` },
      notes: 'Both sides come from WPILib\'s docs, with longer lines wrapped, and both do the same thing: fire a piston when a condition becomes true. On the left, the code checks the condition every loop and tracks whether it has already acted. On the right, the connection is declared once at startup. WPILib calls this declarative programming: the library does the work of checking the button and scheduling the command.',
    }),

    L.diagram({
      id: 'scheduler', eyebrow: 'Control theory', title: 'The scheduler reads, decides and acts every 20 ms', ref: REF.scheduler,
      caption: 'The four steps are WPILib\'s Scheduler Run Sequence. Step 2 reads the buttons and starts bound commands. Step 3 runs every scheduled command.',
      nodes: [
        { id: 's1', x: 128, y: 262, w: 370, h: 190, label: 'Step 1: subsystems', sub: 'each `periodic()` runs', tone: 'paper' },
        { id: 's2', x: 559, y: 262, w: 370, h: 190, label: 'Step 2: poll triggers', sub: 'read the buttons, start bound commands', tone: 'blue' },
        { id: 's3', x: 990, y: 262, w: 370, h: 190, label: 'Step 3: run commands', sub: 'each `execute()`, then `isFinished()`', tone: 'accent' },
        { id: 's4', x: 1421, y: 262, w: 371, h: 190, label: 'Step 4: default commands', sub: 'schedule them for idle subsystems', tone: 'paper' },
        { id: 'run', x: 500, y: 590, w: 920, h: 150, label: '`CommandScheduler.getInstance().run()`', sub: 'called from `robotPeriodic()` in Robot.java, every 20 ms', tone: 'ink' },
      ],
      edges: [
        { from: 's1', to: 's2' }, { from: 's2', to: 's3' }, { from: 's3', to: 's4' },
        { from: 's4', to: 'run', fromSide: 'b', toSide: 'r', route: 'vh' },
        { from: 'run', to: 's1', fromSide: 'l', toSide: 'b', route: 'hv' },
      ],
      notes: 'A control system repeats one loop: read inputs, decide, act. In a command-based program, that loop is CommandScheduler.run, which TimedRobot calls from robotPeriodic every 20 milliseconds. WPILib says this call is required: without it, the command framework does not run. The template already includes it, so nothing needs adding. A command bound to a button runs its initialize method inside step 2, when its trigger is polled. The command in this deck sets the motor at that point.',
    }),

    L.figure({
      id: 'create', eyebrow: 'Project', title: 'Creating a project from the Command Robot template', ref: REF.create,
      intro: 'In **2026 WPILib VS Code**, press `Ctrl+Shift+P`, type `WPILib` and choose **Create a new project**. Fill in the form, click **Generate Project**, open the project, and click **Yes I trust the authors**.',
      src: IMG.creator, alt: 'The WPILib New Project Creator in VS Code, with eight numbered fields.', width: 1441, height: 1155, credit: SHOT, inline: true,
      items: [
        { mark: 1, title: 'Project type', text: 'Template' },
        { mark: 2, title: 'Language', text: 'Java' },
        { mark: 3, title: 'Project base', text: 'Command Robot' },
        { mark: 4, title: 'Base folder', text: 'any folder outside OneDrive' },
        { mark: 5, title: 'Project name', text: 'your choice' },
        { mark: 6, title: 'Create a new folder', text: 'leave it ticked' },
        { mark: 7, title: 'Team number', text: 'your team\'s number' },
        { mark: 8, title: 'Enable Desktop Support', text: 'tick it' },
      ],
      notes: 'Ctrl+Shift+P opens the command palette, and every WPILib command starts with WPILib. WPILib\'s own walkthrough picks the Getting Started example here. This deck picks the Command Robot template, because every deck in this course is command-based. The team number is how the laptop finds the robot when deploying. WPILib warns that projects on OneDrive are not supported, because its caching interferes with the build. The simulator needs Desktop Support.',
    }),

    L.table({
      id: 'template', eyebrow: 'Project', title: 'The files in a command-based project', ref: REF.structure,
      columns: ['In src/main/java/frc/robot', 'What it is for', 'In this deck'], widths: [31, 39, 30], fontSize: 28,
      rows: [
        ['Main.java', 'The main robot application', 'WPILib says not to touch it'],
        ['Robot.java', 'Main control flow, and the scheduler call', 'No changes'],
        ['RobotContainer.java', 'Holds subsystems, commands and button bindings', 'Both programs go here'],
        ['Constants.java', 'Globally accessible constants', 'The motor ID and speed'],
        ['subsystems/', 'Your subsystem classes', 'RollerSubsystem'],
        ['commands/', 'Your command classes', 'Not needed in this deck'],
      ],
      notes: 'This is WPILib\'s standard structure, and every project in these decks follows it. WPILib recommends declaring subsystems as private fields in RobotContainer, and that is also where button bindings go. It also says that large amounts of robot code in Robot.java work against the declarative design. The template creates ExampleSubsystem, ExampleCommand and Autos to show the pattern. They do not touch any hardware, so they can stay for now.',
    }),

    L.table({
      id: 'java-terms', eyebrow: FIRST, title: 'Java terms used in this deck', fontSize: 28,
      columns: ['Term', 'What it is', 'Example in the template'], widths: [16, 46, 38],
      rows: [
        ['class', 'A named block of code, usually one per file', 'RobotContainer'],
        ['field', 'A value that a class keeps', 'm_driverController'],
        ['method', 'A named action, called with parentheses', 'configureBindings()'],
        ['import', 'Tells a file where to find a class', 'import ...button.Trigger;'],
        ['lambda', 'Code passed to a method, to run later', '() -> { }'],
      ],
      notes: 'Java runs a program by calling methods on objects, and a dot joins the two: m_driverController.b() calls the method b on the object m_driverController. A semicolon ends a statement. Capital letters matter, so Commands and commands are different names. The m_ prefix is WPILib\'s naming style for fields.',
    }),

    L.code({
      id: 'first-line', eyebrow: FIRST, title: 'One binding in RobotContainer', ref: REF.triggers, file: 'RobotContainer.java',
      code: region('HelloRobotContainer.java', 'bindings'), highlight: [10, 11, 12],
      caption: 'Add `import edu.wpi.first.wpilibj2.command.Commands;` at the top of the file. `.a()` is a Trigger for the A button, and `onTrue` schedules the command once per press.',
      notes: 'configureBindings is where the template sets up triggers, and its first two bindings are WPILib\'s examples. m_driverController is the Xbox controller the template created on port 0. The method a returns a Trigger for the A button. onTrue binds a command to that trigger. Commands.print is one of WPILib\'s ready-made commands: it prints a string and ends immediately. The binding is declared once, when the program starts.',
    }),

    L.figure({
      id: 'simulate', eyebrow: FIRST, title: 'Running the program in the simulator', ref: REF.sim,
      intro: 'Run `WPILib: Simulate Robot Code`, keep **Sim GUI** selected and press **Ok**.',
      src: IMG.sim, alt: 'The WPILib Simulation GUI with seven numbered windows, including Robot State, System Joysticks and Joysticks.', width: 1282, height: 752, credit: `${SHOT} Robot State now also has a Disconnected row.`,
      items: [
        { mark: 3, title: 'System Joysticks', text: 'Drag **Keyboard 0** from this window.' },
        { mark: 6, title: 'Joysticks', text: 'Drop it on `Joystick[0]`, which is port 0.' },
        { mark: 1, title: 'Robot State', text: 'Click **Teleoperated**.' },
        { mark: 'Z', title: 'The Z key', text: 'Click the simulator window, then press Z. Keyboard 0 sends button 1, the A button, and `Hello, robot` prints in the VS Code terminal.' },
      ],
      notes: 'The simulator runs your program on the laptop, with no robot. Use the command palette entry: WPILib warns that the run button beside its logo does not set up simulation properly. Until a controller is on port 0, the terminal repeats a warning that button 1 on port 0 is not available. Most commands do not run while disabled, so Robot State goes on Teleoperated, although Commands.print is an exception. Keyboard 0 maps Z, X, C and V to buttons 1 to 4, and an Xbox controller\'s A, B, X and Y are buttons 1 to 4. Keys go to the window with focus. The message prints once per press, even with the key held, because onTrue schedules only when the button changes.',
    }),

    L.gotcha({
      id: 'gotcha-import', title: 'The build fails with `cannot find symbol`',
      symptom: '`error: cannot find symbol`, pointing at `Commands`, then `BUILD FAILED`.',
      cause: 'Java only knows a class if the file imports it, and this file has no import for `Commands`.',
      fix: 'Add the import at the top of the file. The first error names the file and the line.',
      code: `
RobotContainer.java:37: error: cannot find symbol
        .onTrue(Commands.print("Hello, robot"));
                ^
  symbol:   variable Commands`,
      notes: 'This is the compiler output when the import is missing. The line number depends on the file. VS Code underlines the word in red before you build, and pressing Ctrl+. on it offers to add the import. A missing semicolon gives the error "\';\' expected", with an arrow at the spot. When a build prints several errors, fix the first one and build again, because later errors often come from the first.',
    }),

    L.exercise({
      id: 'exercise-hello', title: 'Print from two buttons',
      tasks: [
        'Add the import and the binding, then run `WPILib: Simulate Robot Code`.',
        'Drag **Keyboard 0** onto `Joystick[0]` and click **Teleoperated**.',
        'Press **Z** and read the message in the VS Code terminal.',
        'Close the simulator. Add a binding on `.x()` with a different message.',
        'Run it again. On Keyboard 0, the **C** key is the X button.',
      ],
      done: 'Z and C print two different messages.',
      notes: 'On Keyboard 0, Z is A, X is B, C is X and V is Y. The template already binds the B button, so this exercise uses X for the second message. A running simulator keeps the old code, so close it before running the changed program.',
    }),

    L.figure({
      id: 'vendordep', eyebrow: MOTOR, title: 'REVLib: the vendor library for a SPARK MAX', ref: REF.vendor,
      intro: 'A vendor dependency is how a vendor adds its library to a robot project. WPILib does not include code for the SPARK MAX.',
      src: IMG.vendor, alt: 'The WPILib Dependency Manager in VS Code, listing available vendor libraries with Install buttons.', width: 523, height: 910,
      credit: 'WPILib documentation, CC BY 4.0. Versions shown are older.',
      items: [
        { mark: 1, title: 'Open the Dependency Manager', text: 'Click the WPILib logo in the activity bar, on the left of VS Code.' },
        { mark: 2, title: 'Find REVLib', text: 'Scroll down the Available Dependencies list.' },
        { mark: 3, title: 'Click Install', text: 'The library\'s file is copied into this project\'s `vendordeps` folder.' },
        { mark: 4, title: 'Click back in the editor', text: 'VS Code builds the project when the panel loses focus.' },
      ],
      notes: 'Vendor dependencies are installed per project, so each new project needs REVLib added once. This step needs internet. REV is the vendor of the SPARK MAX, and CTRE devices use a different library, Phoenix 6. Deck 7 compares the two.',
    }),

    L.practice({
      id: 'constants', title: 'Give every number a name in Constants', ref: REF.structure,
      rule: 'Put CAN IDs and speeds in `Constants.java`, not in the middle of the code.',
      why: 'The template includes this class for robot-wide constants. Add this inside it, and set `kMotorId` to the CAN ID of your SPARK MAX.',
      code: region('Constants.java', 'roller'),
      notes: 'WPILib says constants should be public static final, so they are visible everywhere and cannot change. It also recommends a static import of the inner class, so other files can write kMotorId. The next slide does that. The k prefix is WPILib\'s naming style for constants. A value then changes in one place, and its name says what it means. Motor ID 6 is the feeder roller in FIRST\'s 2026 KitBot code. Any one motor that can spin freely works, as long as the ID matches the one set in REV Hardware Client 2.',
    }),

    L.codeNotes({
      id: 'subsystem', eyebrow: MOTOR, title: 'A subsystem with one motor', ref: REF.subsystems, file: 'subsystems/RollerSubsystem.java',
      code: region('RollerSubsystem.java', 'subsystem'),
      callouts: [
        { line: 7, title: 'SubsystemBase', text: 'WPILib\'s recommended base class. It registers the subsystem with the scheduler.' },
        { line: [8, 9], title: 'Private hardware', text: 'Only this class can use the motor. A CIM is `kBrushed`.' },
        { line: 11, title: 'A command factory', text: 'A method that returns a command. WPILib ends these names in `Command`.' },
        { line: [13, 14], title: 'startEnd', text: 'First lambda when scheduled, second when canceled.' },
      ],
      notes: 'WPILib\'s docs recommend private hardware: outside code uses robot actions, not devices. The two () -> pieces are lambdas: code passed to a method to run later. WPILib\'s docs say interrupted where this slide says canceled, for the same event. startEnd also makes the command require this subsystem. set takes a value from -1 to 1. A NEO would be kBrushless, and REV warns that brushed mode can permanently damage a NEO.',
    }),

    L.code({
      id: 'binding', eyebrow: MOTOR, title: 'Binding the motor to the A button', ref: REF.triggers, file: 'RobotContainer.java',
      code: `import frc.robot.subsystems.RollerSubsystem;

${region('RobotContainer.java', 'field')}

private void configureBindings() {
  // The template's two bindings stay here.

  ${region('RobotContainer.java', 'binding').split('\n').join('\n  ')}
}`,
      highlight: [1, 5, 10, 11],
      caption: 'This replaces the `Hello, robot` line. `whileTrue` schedules the command on press and cancels it on release.',
      notes: 'The subsystem is a private field, as WPILib recommends. new RollerSubsystem creates it once, when the program starts. The binding has the same shape as the first program: a trigger, a binding method and a command. spinCommand builds the command, and whileTrue decides when it runs.',
    }),

    L.table({
      id: 'bindings', eyebrow: MOTOR, title: 'Three trigger bindings from WPILib', ref: REF.triggers, fontSize: 28,
      columns: ['Binding', 'When the button is pressed', 'When it is released'], widths: [24, 42, 34],
      rows: [
        ['onTrue', 'Schedules the command', 'Nothing: the command runs until it ends'],
        ['whileTrue', 'Schedules the command', 'Cancels the command'],
        ['toggleOnTrue', 'Schedules it, or cancels it if running', 'Nothing'],
      ],
      caption: '`Commands.print` ends by itself, so `onTrue` suits it. A `startEnd` command never ends by itself, so it needs `whileTrue`.',
      notes: 'A startEnd command has no end condition. Bound with onTrue, this motor would keep spinning after the button was released, until the robot was disabled. With whileTrue, releasing the button cancels the command, and canceling runs its second lambda, which sets the motor to 0. WPILib does not recommend toggles for driver control, because the driver has to keep track of the robot state.',
    }),

    L.exercise({
      id: 'exercise-motor', title: 'Add the motor to the program',
      tasks: [
        'Install **REVLib** from the Dependency Manager.',
        'Add `RollerConstants` inside `Constants`, with your SPARK MAX\'s CAN ID.',
        'Right-click the `subsystems` folder, choose **Create a new class/command**, then **Subsystem**. Name it `RollerSubsystem`.',
        'Keep its `package` line, and replace the rest with the subsystem code.',
        'Add the field and the `whileTrue` binding, then run `WPILib: Build Robot Code`.',
      ],
      done: 'the terminal shows `BUILD SUCCESSFUL`.',
      notes: 'Build Robot Code compiles the program without needing a robot. If the build cannot find com.revrobotics, REVLib is not installed in this project. For any other error, read the first one, as on the earlier common mistake slide.',
    }),

    L.plot({
      id: 'timing', eyebrow: 'Control theory', title: 'The program reads the button once every 20 ms', ref: REF.scheduler,
      alt: `The button goes to 1 at ${RUN.pressMs} ms and back to 0 at ${RUN.releaseMs} ms. The motor output follows in steps, rising to ${SPEED} at ${onAt} ms and falling to 0 at ${offAt} ms.`,
      xLabel: 'Time (ms). Ticks are scheduler loops.', yLabel: 'Button (0 or 1) and motor output', xDomain: [0, END], yDomain: [0, 1.2], xTicks: RUN.samples.map((s) => s.ms), yTicks: [0, SPEED, 1],
      series: [
        { name: 'Button', color: 'orange', points: buttonLine },
        { name: 'Motor output', color: 'blue', dash: true, points: outputLine },
      ],
      callouts: [
        { title: 'Press', text: `Pressed at ${RUN.pressMs} ms. The ${onAt} ms loop sets the output to ${SPEED}.` },
        { title: 'Release', text: `Released at ${RUN.releaseMs} ms. The ${offAt} ms loop sets it to 0.` },
        { title: 'Sample time', text: `A change waits for the next loop, up to ${RUN.loopMs} ms.` },
        { title: 'Open loop', text: 'The code sets an output. Nothing measures the roller.' },
      ],
      notes: `This data is from a WPILib simulation of this deck's code, with the button changed at ${RUN.pressMs} and ${RUN.releaseMs} milliseconds. A digital control loop only reads its inputs at each tick, and the time between ticks is called the sample time. The output changes on the first loop after the button changes, so the program is at most ${RUN.loopMs} milliseconds late. On a robot, the connection from Driver Station and the CAN bus add a little more. set(${SPEED}) asks for ${Math.round(SPEED * 100)} percent of battery voltage. Nothing measures what the roller does, which is called open loop. Deck 2 covers it, and Deck 6 closes the loop with a sensor.`,
    }),

    L.steps({
      id: 'deploy', eyebrow: ROBOT, title: 'Deploying the program to the roboRIO',
      items: [
        { title: 'Turn the robot on', text: 'Stay clear of moving parts from now on.' },
        { title: 'Connect the laptop to the roboRIO', text: 'USB or Ethernet.' },
        { title: 'Plug the controller into the laptop' },
        { title: 'Run `WPILib: Deploy Robot Code`', text: 'It builds if needed, then sends the program.' },
        { title: 'Look for `BUILD SUCCESSFUL`', text: 'Keep the robot on until then.' },
      ],
      qr: { url: REF.deploy.url, label: 'Building and deploying', short: 'docs.wpilib.org: Building and Deploying Robot Code' },
      notes: 'The SPARK MAX must already have its CAN ID and motor type set, which is Job 5 of the Setup lab. The team number in the project is how VS Code finds the robot. WPILib warns against powering off during a deploy: interrupting it can corrupt the roboRIO filesystem, and the roboRIO then needs re-imaging. After a successful deploy, RioLog opens with the program\'s console output, and the program stays on the roboRIO until the next deploy.',
    }),

    L.figure({
      id: 'operate', eyebrow: ROBOT, title: 'Running the robot from Driver Station', ref: REF.run, stack: true,
      src: IMG.ds, alt: 'The FRC Driver Station Operation tab, with Robot Mode marked 1 and Enable and Disable marked 2.', width: 1026, height: 234,
      credit: `${SHOT} The lights are red here because no robot is connected.`,
      items: [
        { title: 'FRC Driver Station', text: 'Open it, and enter your team number on the Setup tab (gear icon).' },
        { title: 'Three green lights', text: 'Communications, Robot Code and Joysticks.' },
        { mark: 1, title: 'Robot Mode', text: 'Choose **TeleOperated**.' },
        { mark: 2, title: 'Enable, Disable', text: '`Enter` disables. `Space` is the emergency stop.' },
      ],
      notes: 'This follows WPILib\'s sequence in Running your Test Program: confirm the battery voltage, confirm the three lights are green, choose Teleop, enable, then disable. Communications means the laptop can reach the roboRIO. Robot Code means the program is running. Joysticks means a controller is plugged in, and F1 makes Driver Station look for controllers again. Space works even if another window has focus. After an emergency stop the roboRIO must reboot before the robot can be enabled again, so use Enter for ordinary stops.',
    }),

    L.exercise({
      id: 'exercise-robot', title: 'Spin the motor',
      tasks: [
        'Deploy the program, open Driver Station and get three green lights.',
        'Stand clear of the motor and anything it drives.',
        'Choose **TeleOperated**, say "enabling" out loud, then click **Enable**.',
        'Hold **A**, then release it.',
        'Press `Enter` to disable.',
      ],
      done: 'the motor spins only while A is held.',
      notes: 'Saying "enabling" warns everyone nearby. Disabling also cancels the command, which sets the output to 0. A negative kSpeed spins the motor the other way. If nothing moves, check that Driver Station shows Teleoperated Enabled and that the controller is in slot 0 of the USB tab. An error naming a CAN ID means no SPARK MAX answered at that ID, and Deck 2 covers that error.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'WPILib, commands, subsystems, triggers and the `CommandScheduler`.',
        'A project from the Command Robot template, and the files in it.',
        'A binding tested in the simulator.',
        'A subsystem with one motor, using a vendor library.',
        'Deploying the program and running it from Driver Station.',
      ],
      next: 'Deck 2 uses the same parts to drive the KitBot from a gamepad.',
      notes: 'Deck 2 builds a larger subsystem from the same parts: four motors, a default command and the gamepad sticks.',
    }),

    L.links({
      id: 'links',
      items: [
        { label: 'Create a project', url: REF.create.url, short: 'docs.wpilib.org: Zero to Robot, Step 4' },
        { label: 'What is command-based', url: REF.what.url, short: 'docs.wpilib.org: Command-Based Programming' },
        { label: 'Binding to triggers', url: REF.triggers.url, short: 'docs.wpilib.org: Binding Commands to Triggers' },
        { label: 'Running the program', url: REF.run.url, short: 'docs.wpilib.org: Running your Test Program' },
      ],
      notes: 'These are the main WPILib pages behind this deck. Zero to Robot Step 4 is WPILib\'s own walkthrough, which uses the Getting Started example rather than the Command Robot template. The command-based pages cover everything in this deck in more depth. Text and screenshots from the WPILib docs are used under CC BY 4.0, and are copyright FIRST and other WPILib contributors.',
    }),
  ],
};
