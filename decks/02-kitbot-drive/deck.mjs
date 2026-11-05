// Deck 2: command-based Java and a joystick on the 2026 KitBot drivetrain.
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck2';
const DRIVE = `${J}/CANDriveSubsystem.java`;

export default {
  no: 2, short: 'KitBot drive', title: 'KitBot drive: command-based Java and a joystick', minutes: 35,
  description: 'Getting started with command-based Java and driving the 2026 KitBot from a gamepad.',
  slides: [
    L.cover({ title: 'KitBot drive: your first command-based robot', subtitle: 'From an empty project to a 2026 KitBot you drive with a gamepad', minutes: 35,
      notes: '(30 s) Today we start with an empty project and finish with a KitBot you can drive from a gamepad. You will learn how command-based code is organised, and meet one big idea from control theory: open loop. Everything here is for the 2026 season and the roboRIO.' }),

    L.points({ id: 'outcomes', eyebrow: 'Outcomes', title: 'What you will be able to do', items: [
      'Explain a **subsystem**, a **command**, a **trigger**, a **default command** and the **scheduler**.',
      'Build `CANDriveSubsystem` for the four CIM motors on the KitBot.',
      'Bind a gamepad, and run a safe first test with the wheels off the ground.',
      'Recognise five common bring-up mistakes from their symptoms.',
      'Explain open loop, and why a human driver can get away with it.',
    ], notes: '(30 s) Read these quickly. Point out that the last two are not extras. A team that can read symptoms fixes its robot in minutes, and a team that understands open loop knows why the robot drives differently on a tired battery. If you are short on time later, keep the first test and the gotchas, and shorten the code walk-through.' }),

    L.diagram({ id: 'model', eyebrow: 'Command-based', title: 'The five parts of a command-based robot', flag2027: 'Commands v3 is new for Java. The v2 you learn here remains.',
      caption: 'Schematic. The scheduler is the only part that runs anything.',
      nodes: [
        { id: 'trigger', x: 128, y: 451, w: 270, h: 170, label: 'Trigger', sub: 'when: a button or a condition', tone: 'blue' },
        { id: 'sched', x: 560, y: 410, w: 270, h: 252, label: 'Scheduler', sub: 'runs everything, every 20 ms', tone: 'ink' },
        { id: 'cmd', x: 1000, y: 290, w: 320, h: 170, label: 'Command', sub: 'what: one action', tone: 'accent' },
        { id: 'def', x: 1000, y: 612, w: 320, h: 170, label: 'Default command', sub: 'what to do when idle', tone: 'accent' },
        { id: 'sub', x: 1500, y: 410, w: 292, h: 252, label: 'Subsystem', sub: 'owns the hardware, one command at a time', tone: 'paper' },
      ],
      edges: [
        { from: 'trigger', to: 'sched', label: 'fires', lx: 398, ly: 494, lw: 162 },
        { from: 'sched', to: 'cmd', fromSide: 't', toSide: 'l', route: 'vh', label: 'runs it', lx: 710, ly: 335, lw: 280 },
        { from: 'sched', to: 'def', fromSide: 'b', toSide: 'l', route: 'vh', label: 'when the subsystem is free', lx: 700, ly: 708, lw: 300 },
        { from: 'cmd', to: 'sub', fromSide: 'r', toSide: 't', route: 'hv', label: 'requires', lx: 1340, ly: 335, lw: 290 },
        { from: 'def', to: 'sub', fromSide: 'r', toSide: 'b', route: 'hv', label: 'requires', lx: 1340, ly: 708, lw: 290 },
      ],
      notes: '(2.5 min) Five words. A subsystem owns hardware, here the drivetrain and its four motors. A command is one action, like "drive with the sticks". A trigger says when, like a button press. A default command is what a subsystem does when nothing else wants it. The scheduler runs all of this every 20 milliseconds. Think of a kitchen: the subsystem is the oven, a command is one dish, and only one dish fits at a time. A trigger is an order ticket, and the scheduler is the head chef. If a kid asks what happens when disabled: commands do not run while disabled unless you ask them to.' }),

    L.table({ id: 'layout', eyebrow: 'Project layout', title: 'The files in a command-based project', columns: ['File', 'Its job', 'Keep in mind'], widths: [35, 36, 29], fontSize: 28, rows: [
      ['Robot.java', 'Creates RobotContainer and runs the scheduler every loop', 'Keep it mostly empty'],
      ['RobotContainer.java', 'Creates subsystems and controllers, and binds them to commands', 'Most of your setup goes here'],
      ['Constants.java', 'Gives every number a name, grouped by subsystem', 'No logic in this file'],
      ['subsystems/CANDriveSubsystem.java', 'Owns the motors and offers commands', 'Nothing else touches the motors'],
    ], notes: '(1.5 min) This is the map. Robot.java is mostly plumbing, and the WPILib docs say to keep it nearly empty. RobotContainer is where you wire things together: it is the one file that knows about everything. Constants holds numbers with names. Subsystems hold hardware. The template also gives you a commands folder and an example subsystem, which you can delete once you have your own. CANDriveSubsystem is the name FIRST uses in the official KitBot code, so your project will look familiar to other teams.' }),

    L.steps({ id: 'project', eyebrow: 'Project setup', title: 'Creating the project and installing REVLib', items: [
      { title: 'Open the WPILib command palette', text: 'Press `Ctrl+Shift+P` and choose `WPILib: Create a new project`.' },
      { title: 'Choose Template, Java, Command Robot', text: 'The plain one, not the Skeleton: its comments are worth reading.' },
      { title: 'Set the folder, name and team number', text: 'Keep it out of OneDrive, then click **Generate Project**.' },
      { title: 'Install REVLib', text: '`Manage Vendor Libraries`, then `Install new libraries (online)`, then paste `https://software-metadata.revrobotics.com/REVLib-2026.json`' },
      { title: 'Build once', text: 'Run `WPILib: Build Robot Code` to prove the library is in.' },
      { title: 'Set up each SPARK in REV Hardware Client 2', text: 'Use 2026 firmware (26.x), then set the CAN ID and motor type.' },
    ], qr: { url: 'https://docs.revrobotics.com/revlib/install', label: 'REVLib install', short: 'docs.revrobotics.com: Installation' },
    notes: '(2 min) Drive this live if you can. OneDrive matters: its caching interferes with the build. We need REVLib because the SPARK MAX is a REV product and WPILib does not include its code. The online install is fine in this room, and the FIRST KitBot guide recommends the offline installer for the robot laptop. The Setup lab has the firmware steps: pick the newest 26.x, even if a newer version is listed.' }),

    L.codeNotes({ id: 'motors', eyebrow: 'CANDriveSubsystem', title: 'Step 1: create the motors', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'hardware' }, callouts: [
      { line: [3, 5, 7, 9], title: 'Brushed', text: 'CIMs have brushes. Tell the SPARK, because it can\'t detect that.' },
      { line: [2, 4, 6, 8], title: 'Private', text: 'Only this class touches the motors.' },
      { line: [11, 12], title: 'Leaders only', text: '`DifferentialDrive` gets one motor per side. Followers copy them.' },
    ], notes: '(1.5 min) The KitBot has six motors, and four of them are on the drivetrain, two CIMs per side. Each CIM has its own SPARK MAX over CAN. The IDs come from Constants, not typed numbers. Notice MotorType.kBrushed on all four. It is an easy one to get wrong, so we will look at what that looks like. DifferentialDrive turns "go forward and turn" into a left and a right output. It only needs the two leaders.' }),

    L.codeNotes({ id: 'config', eyebrow: 'CANDriveSubsystem', title: 'Step 2: build the config', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'config' }, callouts: [
      { line: [2, 3], title: 'Shared by all four', text: 'The current limit and brake mode.' },
      { line: 7, title: 'Leaders only', text: 'Voltage compensation. A follower mirrors the result, so it needs none.' },
      { line: 10, title: 'One side inverted', text: 'The sides face opposite ways, and nothing flips one for you.' },
      { line: [13, 15], title: 'Followers', text: 'Each one mirrors its leader. Set nothing else on direction.' },
    ], notes: '(2 min) A config is a list of settings, and apply copies one into another. All four SPARKs share the current limit and brake mode. Voltage compensation goes on the leaders only. A follower mirrors its leader\'s output, so it gets the compensated voltage anyway. Deck 8 explains what voltage compensation and the current limit do. The two sides are mirror images, so one must be inverted. FIRST inverts the left, but your gearboxes decide: if forward goes backward, invert the other side. Followers pick up the inversion from their leader, and calling inverted on a follower has no effect.' }),

    L.codeNotes({ id: 'apply', eyebrow: 'CANDriveSubsystem', title: 'Step 3: apply the config', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'apply' }, callouts: [
      { line: 3, title: 'Reset', text: 'Starts from a known state, so a swapped-in spare behaves.' },
      { line: 4, title: 'Persist', text: 'Saves to the SPARK, so settings survive a brownout or breaker trip.' },
      { line: [5, 6, 7, 8], title: 'Once, at startup', text: 'Saving takes time and blocks the SPARK. Never do it in a loop.' },
    ], notes: '(1 min) Building a config changes nothing on the robot. configure sends it to the SPARK. Reset matters at competition: if you swap in a spare with unknown settings, your code still sets it up correctly. Persist matters because a breaker trip or brownout can restart a SPARK mid-match, and without it the SPARK comes back without your settings. If a kid has seen other code: FIRST\'s KitBot zip imports these two modes from SparkBase. In REVLib 2026.0.5 that location is marked for removal, so we import them from com.revrobotics.' }),

    L.code({ id: 'factory', eyebrow: 'CANDriveSubsystem', title: 'Step 4: write the command factory', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'factory' }, highlight: [3, 4],
      caption: '`run()` makes a command that requires this subsystem. **Suppliers** let it re-read the stick on every loop.',
      notes: '(1 min) A factory is a method that builds a command. Two things to notice. The run helper repeats our lambda every loop, and it adds the subsystem requirement for us, so nothing else can drive at the same time. And the parameters are suppliers, not doubles. This method runs once at startup, so a plain double would freeze the stick value forever. A supplier is a little function we can call again for a fresh reading. Building a command does not run it. It has to be bound, which is the next step.' }),

    L.code({ id: 'bindings', eyebrow: 'RobotContainer', title: 'Step 5: bind the controller', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'bindings' }, highlight: [5, 6],
      caption: '**Minus signs:** match the stick to the robot. **Deadband:** ignore a stick that rests slightly off zero. **Scale:** tame the speed.',
      notes: '(2.5 min) Read one line from the inside out. Sticks read negative when pushed away, a leftover from flight simulators, but the robot calls forward positive, so we flip it. Pushing right reads positive, but arcadeDrive calls counter-clockwise positive, so a right push must be negative. That is why both have a minus. Left stick Y drives and right stick X turns: FIRST calls that split-stick arcade. The deadband ignores tiny values near center. The scale slows the robot down while people learn. It is the default command, so it runs whenever nothing else needs the drivetrain.' }),

    L.steps({ id: 'first-test', eyebrow: 'First test', title: 'First test: wheels off the ground', items: [
      { title: 'Prop the robot up', text: 'Wheels clear, hands clear. One person ready on `Enter` (disable). `Space` is E-stop.' },
      { title: 'Read the SPARK lights', text: 'Blue or yellow means brushed. Our code sets brake, so expect blue.' },
      { title: 'Check the controller', text: 'Driver Station USB Devices tab: slot 0, and the axes follow the sticks.' },
      { title: 'Enable Teleop and push forward gently', text: 'Both sides spin forward at the same speed.' },
      { title: 'Push the right stick right', text: 'Left wheels go forward, right wheels go back.' },
      { title: 'Let go, then check', text: 'Wheels stop. No red text in Messages. Nothing hot, and no bad smells.' },
    ], notes: '(2 min) Never skip this, even with code that worked yesterday. FIRST\'s own guide warns that a robot can move at unexpected speed or in unexpected directions. Use small stick movements. While it runs, the SPARK lights blink green or red with the output. If forward and turning are both backward, you inverted the wrong side, so invert the other one. After an E-stop the roboRIO must reboot before you can enable again, so use Enter for ordinary stops. When this passes, commit to git: now you have a version you know works.' }),

    L.gotcha({ id: 'gotcha-brushed', title: 'CIMs set to `kBrushless`',
      symptom: 'The SPARK light shows magenta or cyan, the brushless colours, and may blink orange and magenta for a sensor fault.',
      cause: 'A new SPARK ships set to brushless and can\'t detect the motor. In that mode it looks for a motor sensor a CIM doesn\'t have.',
      fix: 'Use `MotorType.kBrushed` in code, and set the motor type to brushed in REV Hardware Client 2. Look for blue or yellow.',
      notes: '(1 min) This is the first thing to check, and you can check it from across the room. Blue or yellow means brushed mode. Cyan or magenta means brushless mode. Orange and magenta blinking is REV\'s sensor fault, and REV says to expect it with a brushed motor until you set the type. REV also warns that the wrong type can damage the SPARK, the motor or both, so fix it before you keep testing. The reverse mistake matters too: never run a NEO in brushed mode. REV says that can permanently damage it.' }),

    L.gotcha({ id: 'gotcha-can-id', title: 'A CAN ID that does not match',
      symptom: 'The log shows `[Spark Max] IDs: 6, Unable to retrieve SPARK firmware version` and `timed out while waiting`. That motor stays still.',
      cause: 'No SPARK answers at the ID in `Constants`. Every new SPARK ships as ID 0, and each needs its own number.',
      fix: 'Set IDs in REV Hardware Client 2 over USB, robot off, one SPARK at a time. Then match `Constants`.',
      notes: '(1 min) Those lines are real, from a team\'s log in March 2026. They had new SPARKs and had not set the IDs. The full message tells you the fix: "Please verify the deviceID field matches the configured CAN ID of the controller, and that the controller is connected to the CAN Bus." Read red text slowly: it is usually telling you what to do. Two traps. If two IDs are swapped there is no error, and the wrong wheel just moves. And a SPARK that has been on the roboRIO\'s CAN bus will not run a motor over USB: disconnect CAN and power-cycle it first.' }),

    L.table({ id: 'symptoms', eyebrow: 'Common mistakes', title: 'Three more symptoms and what causes them', columns: ['What you see', 'Why it happens', 'The fix'], widths: [32, 36, 32], rows: [
      ['Push forward and the robot spins on the spot', 'No side is inverted, so the two sides drive opposite ways', 'Add inverted(true) on one leader. The KitBot uses the left.'],
      ['One side is weak, or motors run hot and a breaker trips', 'A follower is missing, follows the wrong leader, or is reversed, so two CIMs fight in one gearbox', 'Give each follower .follow(itsLeader), with no true.'],
      ['The left stick does nothing and the D-pad drives', 'The F310 Mode light is on, or the back switch is on D', 'Switch to X, Mode light off, replug. Check the USB Devices tab.'],
    ], notes: '(1.5 min) Row one: both sides get the same sign but face opposite ways, so the robot rotates. WPILib says it in nearly those words. Row two: two CIMs geared together must turn the same way. If they disagree they push against each other, so current climbs and the gearbox goes nowhere. Stop and fix that quickly. Row three comes straight from the FIRST guide: with the Mode light on, the left stick and D-pad swap. WPILib\'s XboxController expects the F310 in XInput mode, which is the X position. Unplug and replug after moving the switch.' }),

    L.practice({ id: 'no-blocking', title: 'Never make the loop wait', rule: 'No `while` loops or `Thread.sleep` in robot code.',
      why: 'Everything shares one 20 ms loop. If one command waits, every subsystem waits, and motor safety stops the drive.',
      code: `
// Wrong: the whole robot freezes for 2 seconds
Thread.sleep(2000);

// Right: the scheduler keeps looping while this runs
drive.driveArcade(() -> 0.5, () -> 0).withTimeout(2.0);`,
      notes: '(1 min) Imagine the head chef stops to watch one pot for two minutes. Nothing else in the kitchen happens. The same goes for your code: while a loop waits, no buttons are read and no motors are updated. You will see "Loop time of 0.02s overrun" and "CommandScheduler loop overrun". After 0.1 seconds without an update, motor safety stops the drive and reports "DifferentialDrive... Output not updated often enough." That safety feature is on your side. So describe what should happen over time, with decorators like withTimeout, and let the scheduler do the waiting.' }),

    L.table({ id: 'habits', eyebrow: 'Best practice', title: 'Five habits that keep robot code readable', columns: ['Habit', 'In practice', 'Why'], widths: [32, 34, 34], fontSize: 28, rows: [
      ['Constants, not magic numbers', 'LEFT_LEADER_ID, not 1', 'Swap a motor and change one line'],
      ['The subsystem owns its hardware', 'Motors are private', 'Every use goes through the subsystem'],
      ['Factories, not loose classes', 'drive.driveArcade(...)', 'Less code, and the requirement is automatic'],
      ['Name your commands', '.withName("Arcade Drive")', 'Logs show a name you can read'],
      ['Commit to git often', 'Commit after each thing works', 'You can always get back to working code'],
    ], notes: '(1.5 min) These cost seconds now and save hours at competition. Constants: at an event, when a SPARK dies and the spare has another ID, you change one line. Ownership: if motors are private, no command can sneak around the subsystem and its requirements. Factories: FIRST ships both styles, and the guide lists less boilerplate as a strength of inline commands. Its trade-off is real, so it is fine if classes make more sense to you at first. Names: when the scheduler reports a slow loop, it prints each command by name. Commit: small commits are your undo button.' }),

    L.diagram({ id: 'open-loop', eyebrow: 'Control theory', title: 'Open loop: you command voltage and hope', caption: 'Schematic. Solid arrows are this robot. Dashed arrows are what closed loop adds, in Deck 6.',
      nodes: [
        { id: 'stick', x: 128, y: 300, w: 260, h: 170, label: 'Stick', sub: 'what you want', tone: 'blue' },
        { id: 'code', x: 479, y: 300, w: 260, h: 170, label: 'Your code', sub: 'picks an output', tone: 'ink' },
        { id: 'spark', x: 830, y: 300, w: 260, h: 170, label: 'SPARK MAX', sub: 'sets a voltage', tone: 'ink' },
        { id: 'cim', x: 1181, y: 300, w: 260, h: 170, label: 'CIMs', sub: 'make torque', tone: 'paper' },
        { id: 'wheels', x: 1532, y: 300, w: 260, h: 170, label: 'Wheels', sub: 'speed depends on load', tone: 'paper' },
        { id: 'sensor', x: 1532, y: 600, w: 260, h: 150, label: 'Sensor', sub: 'not in this code', tone: 'ghost' },
      ],
      edges: [
        { from: 'stick', to: 'code' }, { from: 'code', to: 'spark' }, { from: 'spark', to: 'cim' }, { from: 'cim', to: 'wheels' },
        { from: 'wheels', to: 'sensor', fromSide: 'b', toSide: 't', dashed: true },
        { from: 'sensor', to: 'code', fromSide: 'l', toSide: 'b', route: 'hv', dashed: true, label: 'measured speed', lx: 820, ly: 626, lw: 400 },
      ],
      notes: '(1.5 min) Control theory is the study of making things do what you asked. This robot is open loop: we pick a voltage and never measure what happened. It is like setting the shower tap to the same spot every morning and hoping the water is right. Closed loop is feeling the water and adjusting. Battery level, carpet, weight and friction all change the real speed, and open-loop code cannot notice. That is fine for a human driver, because the driver is the feedback. It is why autonomous drive by time is rough. Deck 8 shows how motors behave, and Deck 9 shows how to make open-loop driving feel better.' }),

    L.exercise({ id: 'exercise', title: 'Change the drive scale', minutes: 5, tasks: [
      'Set `DRIVE_SCALE` to 0.4 in `Constants`, deploy, and drive a slow lap.',
      'Set it back to 0.7, deploy, and drive the same lap.',
      'Take turns, so everyone on the team drives.',
      'Commit your working code, with a message that says what it does.',
    ], done: 'everyone has driven the robot, and your working code is committed.',
    notes: '(5 min) Work in pairs with a mentor by the robot, in clear floor space, with someone ready on Enter. Keep the scale low until people are comfortable. Ask what changed between 0.4 and 0.7, and what stayed the same. Decks 8 and 9 go deeper for teams that want to know why the robot feels the way it does.' }),

    L.change2027({ id: 'change', items: [
      { now: 'roboRIO', next: 'Systemcore: 2026 projects must be imported' },
      { now: 'edu.wpi.first packages', next: 'org.wpilib packages' },
      { now: 'Motor controller set(0.5)', next: 'setThrottle(0.5)' },
      { now: 'Java 17', next: 'Java 25' },
      { now: 'Commands v2', next: 'v2 remains, and v3 is new for Java' },
    ], note: 'Alpha software, so this may change. Everything in this deck is correct for the 2026 roboRIO.',
    notes: '(30 s) This is a heads-up, not homework. You do not need to learn any of it today. Next year\'s software is still in alpha and could change. The ideas you learned today all carry over: subsystems, commands, one inverted side, open loop. Mostly the names change. Keep building for 2026.' }),

    L.recap({ id: 'recap', items: [
      'Say what a subsystem, command, trigger, default command and the scheduler each do.',
      'Build `CANDriveSubsystem`: brushed motors, followers, one inverted side, `configure()`.',
      'Bind a gamepad with flipped signs, a deadband and a scale, then test with wheels up.',
      'Read the symptoms: SPARK light colours, CAN ID errors, a spinning robot.',
      'Explain open loop, and why a human driver can get away with it.',
    ], next: 'Deck 3, where AdvantageScope shows you what your robot is thinking.',
    notes: '(30 s) Ask for one volunteer per line, in their own words. If nobody can explain open loop, go back to the shower tap. Before people leave, make sure every team has committed working code. Next time we stop guessing about what the robot is doing, because we will be able to see it.' }),

    L.links({ id: 'links', intro: 'Point your phone camera at a code.', items: [
      { label: 'Command-based basics', url: 'https://docs.wpilib.org/en/stable/docs/software/commandbased/what-is-command-based.html', short: 'docs.wpilib.org' },
      { label: 'Drive classes', url: 'https://docs.wpilib.org/en/stable/docs/software/hardware-apis/motors/wpi-drive-classes.html', short: 'docs.wpilib.org' },
      { label: 'SPARK MAX light patterns', url: 'https://docs.revrobotics.com/brushless/spark-max/status-led', short: 'docs.revrobotics.com' },
      { label: 'KitBot Java guide', url: 'https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-java-guide.pdf', short: 'FIRST KitBot resources' },
    ], notes: '(30 s) Leave this up during the break. The SPARK light chart is the one to print and tape near the pit. The KitBot guide also walks through the official code, so it is a good next read. The WPILib docs here are the stable version, which moves to 2027 at kickoff.' }),
  ],
};
