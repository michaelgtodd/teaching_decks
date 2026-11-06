// Deck 2: command-based Java and a joystick on the 2026 KitBot drivetrain.
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck2';
const DRIVE = `${J}/CANDriveSubsystem.java`;

export default {
  no: 2, short: 'KitBot drive', title: 'KitBot drive: command-based Java and a joystick',
  description: 'Getting started with command-based Java and driving the 2026 KitBot from a gamepad.',
  slides: [
    L.cover({ title: 'KitBot drive: your first command-based robot', subtitle: 'From an empty project to a 2026 KitBot you drive with a gamepad',
      notes: 'This deck starts with an empty project and ends with a KitBot driven from a gamepad. It covers how command-based code is organised, and one control theory idea: open loop. Everything here is for the 2026 season and the roboRIO.' }),

    L.points({ id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers', items: [
      'What a **subsystem**, a **command**, a **trigger**, a **default command** and the **scheduler** each do.',
      '`CANDriveSubsystem` for the four CIM motors on the KitBot.',
      'Binding a gamepad, and a safe first test with the wheels off the ground.',
      'Five common bring-up mistakes and their symptoms.',
      'Commands that run one after another, and a timed autonomous routine.',
      'Open loop, and why it works with a human driver.',
    ], notes: 'Symptoms identify most bring-up faults directly. Open loop explains why the robot drives differently on a worn battery.' }),

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
      notes: 'Five words. A subsystem owns hardware, here the drivetrain and its four motors. A command is one action, like "drive with the sticks". A trigger says when, like a button press. A default command is what a subsystem does when nothing else wants it. The scheduler runs all of this every 20 milliseconds. Commands do not run while disabled unless you ask them to.' }),

    L.table({ id: 'layout', eyebrow: 'Project layout', title: 'The files in a command-based project', columns: ['File', 'Its job', 'Keep in mind'], widths: [35, 36, 29], fontSize: 28, rows: [
      ['Robot.java', 'Creates RobotContainer and runs the scheduler every loop', 'Keep it mostly empty'],
      ['RobotContainer.java', 'Creates subsystems and controllers, and binds them to commands', 'Most of your setup goes here'],
      ['Constants.java', 'Gives every number a name, grouped by subsystem', 'No logic in this file'],
      ['subsystems/CANDriveSubsystem.java', 'Owns the motors and offers commands', 'Nothing else touches the motors'],
    ], notes: 'Robot.java is mostly boilerplate, and the WPILib docs say to keep it nearly empty. RobotContainer connects everything: it is the one file that references every subsystem and controller. Constants holds numbers with names. Subsystems hold hardware. The template also gives you a commands folder and an example subsystem, which you can delete once you have your own. CANDriveSubsystem is the name FIRST uses in the official KitBot code, so your project will look familiar to other teams.' }),

    L.steps({ id: 'project', eyebrow: 'Project setup', title: 'Creating the project and installing REVLib', items: [
      { title: 'Open the WPILib command palette', text: 'Press `Ctrl+Shift+P` and choose `WPILib: Create a new project`.' },
      { title: 'Choose Template, Java, Command Robot', text: 'The plain one, not the Skeleton: its comments are worth reading.' },
      { title: 'Set the folder, name and team number', text: 'Keep it out of OneDrive, then click **Generate Project**.' },
      { title: 'Install REVLib', text: '`Manage Vendor Libraries`, then `Install new libraries (online)`, then paste `https://software-metadata.revrobotics.com/REVLib-2026.json`' },
      { title: 'Build once', text: 'Run `WPILib: Build Robot Code` to prove the library is in.' },
      { title: 'Set up each SPARK in REV Hardware Client 2', text: 'Use 2026 firmware (26.x), then set the CAN ID and motor type.' },
    ], qr: { url: 'https://docs.revrobotics.com/revlib/install', label: 'REVLib install', short: 'docs.revrobotics.com: Installation' },
    notes: 'OneDrive\'s caching interferes with the build. REVLib is needed because the SPARK MAX is a REV product and WPILib does not include its code. The FIRST KitBot guide recommends the offline installer for the robot laptop. The Setup lab has the firmware steps: pick the newest 26.x, even if a newer version is listed.' }),

    L.codeNotes({ id: 'motors', eyebrow: 'CANDriveSubsystem', title: 'Step 1: create the motors', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'hardware' }, callouts: [
      { line: [3, 5, 7, 9], title: 'Brushed', text: 'CIMs have brushes. Tell the SPARK, because it can\'t detect that.' },
      { line: [2, 4, 6, 8], title: 'Private', text: 'Only this class touches the motors.' },
      { line: [11, 12], title: 'Leaders only', text: '`DifferentialDrive` gets one motor per side. Followers copy them.' },
    ], notes: 'The KitBot has six motors, and four of them are on the drivetrain, two CIMs per side. Each CIM has its own SPARK MAX over CAN. The IDs come from Constants, not typed numbers. Note MotorType.kBrushed on all four. A later slide shows what happens if it is wrong. DifferentialDrive turns "go forward and turn" into a left and a right output. It only needs the two leaders.' }),

    L.codeNotes({ id: 'config', eyebrow: 'CANDriveSubsystem', title: 'Step 2: build the config', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'config' }, callouts: [
      { line: [2, 3], title: 'Shared by all four', text: 'The current limit and brake mode.' },
      { line: 7, title: 'Leaders only', text: 'Voltage compensation. A follower mirrors the result, so it needs none.' },
      { line: 10, title: 'One side inverted', text: 'The sides face opposite ways, and nothing flips one for you.' },
      { line: [13, 15], title: 'Followers', text: 'Each one mirrors its leader. Set nothing else on direction.' },
    ], notes: 'A config is a list of settings, and apply copies one into another. All four SPARKs share the current limit and brake mode. Voltage compensation goes on the leaders only. A follower mirrors its leader\'s output, so it gets the compensated voltage anyway. Deck 8 explains what voltage compensation and the current limit do. The two sides are mirror images, so one must be inverted. FIRST inverts the left, but your gearboxes decide: if forward goes backward, invert the other side. Followers pick up the inversion from their leader, and calling inverted on a follower has no effect.' }),

    L.codeNotes({ id: 'apply', eyebrow: 'CANDriveSubsystem', title: 'Step 3: apply the config', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'apply' }, callouts: [
      { line: 3, title: 'Reset', text: 'Starts from a known state, so a swapped-in spare behaves.' },
      { line: 4, title: 'Persist', text: 'Saves to the SPARK, so settings survive a brownout or breaker trip.' },
      { line: [5, 6, 7, 8], title: 'Once, at startup', text: 'Saving takes time and blocks the SPARK. Never do it in a loop.' },
    ], notes: 'Building a config changes nothing on the robot. configure sends it to the SPARK. Reset matters at competition: if you swap in a spare with unknown settings, your code still sets it up correctly. Persist matters because a breaker trip or brownout can restart a SPARK mid-match, and without it the SPARK comes back without your settings. FIRST\'s KitBot zip imports these two modes from SparkBase. In REVLib 2026.0.5 that location is marked for removal, so we import them from com.revrobotics.' }),

    L.code({ id: 'factory', eyebrow: 'CANDriveSubsystem', title: 'Step 4: write the command factory', file: 'CANDriveSubsystem.java', src: { file: DRIVE, region: 'factory' }, highlight: [3, 4],
      caption: '`run()` makes a command that requires this subsystem. **Suppliers** let it re-read the stick on every loop.',
      notes: 'A factory is a method that builds a command. The run helper repeats our lambda every loop, and it adds the subsystem requirement for us, so nothing else can drive at the same time. The parameters are suppliers, not doubles. This method runs once at startup, so a plain double would freeze the stick value forever. A supplier is a little function we can call again for a fresh reading. Building a command does not run it. It has to be bound, which is the next step.' }),

    L.code({ id: 'bindings', eyebrow: 'RobotContainer', title: 'Step 5: bind the controller', file: 'RobotContainer.java', src: { file: `${J}/RobotContainer.java`, region: 'bindings' }, highlight: [5, 6],
      caption: '**Minus signs:** match the stick to the robot. **Deadband:** ignore a stick that rests slightly off zero. **Scale:** reduce the speed.',
      notes: 'Read one line from the inside out. Sticks read negative when pushed away, a leftover from flight simulators, but the robot calls forward positive, so we flip it. Pushing right reads positive, but arcadeDrive calls counter-clockwise positive, so a right push must be negative. That is why both have a minus. Left stick Y drives and right stick X turns: FIRST calls that split-stick arcade. The deadband ignores tiny values near center. The scale limits the top speed. It is the default command, so it runs whenever nothing else needs the drivetrain.' }),

    L.steps({ id: 'first-test', eyebrow: 'First test', title: 'First test: wheels off the ground', items: [
      { title: 'Prop the robot up', text: 'Wheels clear, hands clear. One person ready on `Enter` (disable). `Space` is E-stop.' },
      { title: 'Read the SPARK lights', text: 'Blue or yellow means brushed. Our code sets brake, so expect blue.' },
      { title: 'Check the controller', text: 'Driver Station USB Devices tab: slot 0, and the axes follow the sticks.' },
      { title: 'Enable Teleop and push forward gently', text: 'Both sides spin forward at the same speed.' },
      { title: 'Push the right stick right', text: 'Left wheels go forward, right wheels go back.' },
      { title: 'Let go, then check', text: 'Wheels stop. No red text in Messages. Nothing hot, and no bad smells.' },
    ], notes: 'FIRST\'s guide warns that a robot can move at unexpected speed or in unexpected directions. Use small stick movements. While it runs, the SPARK lights blink green or red with the output. If forward and turning are both backward, you inverted the wrong side, so invert the other one. After an E-stop the roboRIO must reboot before you can enable again, so use Enter for ordinary stops. When this passes, commit to git: now you have a version you know works.' }),

    L.gotcha({ id: 'gotcha-brushed', title: 'CIMs set to `kBrushless`',
      symptom: 'The SPARK light shows magenta or cyan, the brushless colours, and may blink orange and magenta for a sensor fault.',
      cause: 'A new SPARK ships set to brushless and can\'t detect the motor. In that mode it looks for a motor sensor a CIM doesn\'t have.',
      fix: 'Use `MotorType.kBrushed` in code, and set the motor type to brushed in REV Hardware Client 2. Look for blue or yellow.',
      notes: 'Blue or yellow means brushed mode. Cyan or magenta means brushless mode. Orange and magenta blinking is REV\'s sensor fault, and REV says to expect it with a brushed motor until you set the type. REV warns that the wrong type can damage the SPARK, the motor or both. Never run a NEO in brushed mode: REV says that can permanently damage it.' }),

    L.gotcha({ id: 'gotcha-can-id', title: 'A CAN ID that does not match',
      symptom: 'The log shows `[Spark Max] IDs: 6, Unable to retrieve SPARK firmware version` and `timed out while waiting`. That motor stays still.',
      cause: 'No SPARK answers at the ID in `Constants`. Every new SPARK ships as ID 0, and each needs its own number.',
      fix: 'Set IDs in REV Hardware Client 2 over USB, robot off, one SPARK at a time. Then match `Constants`.',
      notes: 'Those lines are real, from a team\'s log in March 2026. They had new SPARKs and had not set the IDs. The full message tells you the fix: "Please verify the deviceID field matches the configured CAN ID of the controller, and that the controller is connected to the CAN Bus." Two related problems. If two IDs are swapped there is no error, and the wrong wheel just moves. And a SPARK that has been on the roboRIO\'s CAN bus will not run a motor over USB: disconnect CAN and power-cycle it first.' }),

    L.table({ id: 'symptoms', eyebrow: 'Common mistakes', title: 'Three more symptoms and what causes them', columns: ['What you see', 'Why it happens', 'The fix'], widths: [32, 36, 32], rows: [
      ['Push forward and the robot spins on the spot', 'No side is inverted, so the two sides drive opposite ways', 'Add inverted(true) on one leader. The KitBot uses the left.'],
      ['One side is weak, or motors run hot and a breaker trips', 'A follower is missing, follows the wrong leader, or is reversed, so two CIMs fight in one gearbox', 'Give each follower .follow(itsLeader), with no true.'],
      ['The left stick does nothing and the D-pad drives', 'The F310 Mode light is on, or the back switch is on D', 'Switch to X, Mode light off, replug. Check the USB Devices tab.'],
    ], notes: 'Row one: both sides get the same sign but face opposite ways, so the robot rotates. WPILib says it in nearly those words. Row two: two CIMs geared together must turn the same way. If they disagree they push against each other, so current climbs and the gearbox goes nowhere. Stop and fix that. Row three comes straight from the FIRST guide: with the Mode light on, the left stick and D-pad swap. WPILib\'s XboxController expects the F310 in XInput mode, which is the X position. Unplug and replug after moving the switch.' }),

    L.practice({ id: 'no-blocking', title: 'Never make the loop wait', rule: 'No `while` loops or `Thread.sleep` in robot code.',
      why: 'Everything shares one 20 ms loop. If one command waits, every subsystem waits, and motor safety stops the drive.',
      code: `
// Wrong: the whole robot freezes for 2 seconds
Thread.sleep(2000);

// Right: the scheduler keeps looping while this runs
drive.driveArcade(() -> 0.5, () -> 0).withTimeout(2.0);`,
      notes: 'While a loop waits, no buttons are read and no motors are updated. You will see "Loop time of 0.02s overrun" and "CommandScheduler loop overrun". After 0.1 seconds without an update, motor safety stops the drive and reports "DifferentialDrive... Output not updated often enough." So describe what should happen over time, with decorators like withTimeout, and let the scheduler do the waiting.' }),

    L.code({ id: 'then', eyebrow: 'Sequences', title: 'One command that does three things in order', file: 'DriveAutos.java', src: { file: `${J}/DriveAutos.java`, region: 'then' }, highlight: [3, 4, 5],
      caption: '`withTimeout` ends each step. `andThen` starts the next step when the one before it ends.',
      notes: 'driveArcade never ends on its own, so withTimeout gives each step an end. andThen builds a sequence: when one step ends, the next one starts, in the same 20 ms loop. The middle step drives at zero, which holds the robot still and keeps the drive updated. Nothing here waits or sleeps. The scheduler keeps looping, reading buttons and updating every subsystem, while this command works through its steps. The method returns one command, so it can be bound to a button or used as an autonomous routine.' }),

    L.gotcha({ id: 'gotcha-wait', title: 'A `waitSeconds` step in a drive sequence',
      symptom: 'During the pause, the Driver Station shows `DifferentialDrive... Output not updated often enough.`',
      cause: '`Commands.waitSeconds` runs no drive code, so nothing updates the drive. After 0.1 s, motor safety stops it and reports the error.',
      fix: 'Hold the drive still with a step that drives at zero for the pause, as on the slide before.',
      code: `
// Error during the pause
forward.andThen(Commands.waitSeconds(1.0)).andThen(turn);`,
      notes: 'DifferentialDrive has motor safety turned on by default, with a 0.1 second limit. If arcadeDrive is not called within that time, WPILib stops the motors and prints the error. A wait command requires no subsystem and calls no drive code, so a pause made from it lets the limit run out. Driving at zero for the pause keeps calling arcadeDrive with zero, so the drive is updated every loop and stays still. The message text is from WPILib\'s MotorSafety class.' }),

    L.table({ id: 'compose', eyebrow: 'Sequences', title: 'Ways to combine commands', columns: ['Write this', 'It runs', 'It ends when'], widths: [34, 34, 32], fontSize: 28, rows: [
      ['a.andThen(b)', 'a, then b', 'b ends'],
      ['Commands.sequence(a, b, c)', 'each one in order', 'the last one ends'],
      ['a.alongWith(b)', 'a and b at the same time', 'both have ended'],
      ['a.raceWith(b)', 'a and b at the same time', 'either one ends'],
      ['a.deadlineFor(b)', 'a and b at the same time', 'a ends, and b is cancelled'],
      ['a.withTimeout(2.0)', 'a for at most 2 seconds', 'a ends or the time is up'],
      ['a.until(condition)', 'a', 'a ends or the condition is true'],
    ], ref: { label: 'Command Compositions', url: 'https://docs.wpilib.org/en/stable/docs/software/commandbased/command-compositions.html' },
    notes: 'Each line builds one new command out of others, so the results combine too: a sequence can contain a race, and so on. Commands that run at the same time must not require the same subsystem. The PathPlanner app uses the same four group names, sequential, parallel, deadline and race, so an auto drawn in Deck 11 is built from the same pieces.' }),

    L.code({ id: 'auto-sequence', eyebrow: 'Autonomous', title: 'An autonomous routine is one command', file: 'DriveAutos.java', src: { file: `${J}/DriveAutos.java`, region: 'sequence' }, highlight: [3, 4, 5, 6],
      caption: '`getAutonomousCommand()` in `RobotContainer` returns this. `Robot.java` runs it when autonomous starts and cancels it when teleop starts.',
      notes: 'Commands.sequence takes the steps as a list, which is easier to read and reorder than a chain of andThen calls. Every number comes from Constants, so tuning the routine means changing one line. The routine drives by time, so it is open loop: battery level and carpet change how far the robot goes. The template Robot.java already schedules whatever getAutonomousCommand returns in autonomousInit and cancels it in teleopInit. Deck 11 replaces the timed steps with paths that use encoders and a gyro.' }),

    L.practice({ id: 'fresh-commands', title: 'Build a new command for each use', rule: 'Call the factory again each time. One command object can go in only one group.',
      why: 'Reusing one makes WPILib throw: `Commands that have been composed may not be added to another composition or scheduled individually!`',
      code: `
// Wrong: one command object in two groups
Command fwd = drive.driveArcade(() -> 0.4, () -> 0.0).withTimeout(2.0);
Command autoA = Commands.sequence(fwd, Commands.print("A"));
Command autoB = Commands.sequence(fwd, Commands.print("B")); // throws
// Right: each call to the method makes a new command
Command autoC = DriveAutos.leaveAndTurn(drive);`,
      notes: 'When a command is put in a group, the scheduler marks it as composed. Putting the same object in a second group, or scheduling it alone, throws the error on the slide when the robot code starts. Factory methods avoid this, because each call returns a new command. That is one more reason the habits slide prefers factories.' }),

    L.table({ id: 'habits', eyebrow: 'Best practice', title: 'Five habits that keep robot code readable', columns: ['Habit', 'In practice', 'Why'], widths: [32, 34, 34], fontSize: 28, rows: [
      ['Constants, not magic numbers', 'LEFT_LEADER_ID, not 1', 'Swap a motor and change one line'],
      ['The subsystem owns its hardware', 'Motors are private', 'Every use goes through the subsystem'],
      ['Factories, not loose classes', 'drive.driveArcade(...)', 'Less code, and the requirement is automatic'],
      ['Name your commands', '.withName("Arcade Drive")', 'Logs show a name you can read'],
      ['Commit to git often', 'Commit after each thing works', 'You can always get back to working code'],
    ], notes: 'Constants: at an event, when a SPARK dies and the spare has another ID, you change one line. Ownership: if motors are private, no command can bypass the subsystem and its requirements. Factories: FIRST ships both styles, and the guide lists less boilerplate as a strength of inline commands. Classes also work. Names: when the scheduler reports a slow loop, it prints each command by name. Commit: small commits make it easy to return to working code.' }),

    L.diagram({ id: 'open-loop', eyebrow: 'Control theory', title: 'Open loop: voltage with no measurement', caption: 'Schematic. Solid arrows are this robot. Dashed arrows are what closed loop adds, in Deck 6.',
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
      notes: 'Control theory is the study of making a system do what you asked. This robot is open loop: the code picks a voltage and never measures what happened. Closed loop measures the result and adjusts. Battery level, carpet, weight and friction all change the real speed, and open-loop code cannot detect that. With a human driver, the driver supplies the feedback. In autonomous drive by time, nothing corrects the error. Deck 8 shows how motors behave, and Deck 9 shows how to make open-loop driving feel better.' }),

    L.exercise({ id: 'exercise', title: 'Change the drive scale', tasks: [
      'Set `DRIVE_SCALE` to 0.4 in `Constants`, deploy, and drive a slow lap.',
      'Set it back to 0.7, deploy, and drive the same lap.',
      'Commit your working code, with a message that says what it does.',
    ], done: 'both laps are driven, and your working code is committed.',
    notes: 'Use clear floor space, with one person ready on Enter. The scale changes top speed. Decks 8 and 9 explain why the robot feels the way it does.' }),

    L.exercise({ id: 'exercise-auto', title: 'Run the timed autonomous', tasks: [
      'Put the robot on blocks, wheels off the ground. Deploy.',
      'In Driver Station, choose **Autonomous** and enable. Watch the wheels.',
      'Set `PAUSE_SECONDS` to 2.0, deploy, and run it again.',
    ], done: 'the wheels drive forward, stop for two seconds, then turn, and the terminal prints Auto finished.',
    notes: 'One person stays ready on Enter to disable, and Space is the emergency stop. On blocks, "turn" means the left and right wheels spin opposite ways. The routine ends by itself after its last step. Then the default command, the gamepad drive, takes over again, so keep hands off the sticks.' }),

    L.change2027({ id: 'change', items: [
      { now: 'roboRIO', next: 'Systemcore: 2026 projects must be imported' },
      { now: 'edu.wpi.first packages', next: 'org.wpilib packages' },
      { now: 'Motor controller set(0.5)', next: 'setThrottle(0.5)' },
      { now: 'Java 17', next: 'Java 25' },
      { now: 'Commands v2', next: 'v2 remains, and v3 is new for Java' },
    ], note: 'Alpha software, so this may change. Everything in this deck is correct for the 2026 roboRIO.',
    notes: 'WPILib 2027 is still in alpha and could change. Subsystems, commands, one inverted side and open loop all carry over. Mostly the names change.' }),

    L.recap({ id: 'recap', items: [
      'What a subsystem, command, trigger, default command and the scheduler each do.',
      '`CANDriveSubsystem`: brushed motors, followers, one inverted side, `configure()`.',
      'A gamepad binding with flipped signs, a deadband and a scale, tested with wheels up.',
      'Sequences built with `andThen` and `Commands.sequence`, and a timed autonomous.',
      'Bring-up symptoms, and open loop: why it works with a human driver.',
    ], next: 'Deck 3: AdvantageScope shows what your robot is doing.',
    notes: 'Deck 3 uses this code to show what the robot is doing.' }),

    L.links({ id: 'links', items: [
      { label: 'Command-based basics', url: 'https://docs.wpilib.org/en/stable/docs/software/commandbased/what-is-command-based.html', short: 'docs.wpilib.org' },
      { label: 'Drive classes', url: 'https://docs.wpilib.org/en/stable/docs/software/hardware-apis/motors/wpi-drive-classes.html', short: 'docs.wpilib.org' },
      { label: 'SPARK MAX light patterns', url: 'https://docs.revrobotics.com/brushless/spark-max/status-led', short: 'docs.revrobotics.com' },
      { label: 'KitBot Java guide', url: 'https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-java-guide.pdf', short: 'FIRST KitBot resources' },
    ], notes: 'The SPARK light chart lists every status pattern. The KitBot guide walks through the official code. The WPILib docs here are the stable version, which moves to 2027 at kickoff.' }),
  ],
};
