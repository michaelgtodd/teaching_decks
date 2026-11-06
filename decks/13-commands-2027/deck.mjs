// Deck 13: command-based changes coming in 2027. Every claim is listed with its source in SOURCES.md.
// 2027 code lives in examples-2027/ (WPILib v2027.0.0-alpha-8), which is not compiled: see its README.
import * as L from '../../template/layouts.mjs';

const J27 = 'examples-2027/src/main/java/frc/robot/deck13';
const J2 = 'examples/src/main/java/frc/robot/deck2';
const ALPHA = 'v2027.0.0-alpha-8';
const DOC = (page) => `https://docs.wpilib.org/en/latest/docs/software/commandbased/commands-v3/${page}.html`;

export default {
  no: 13, short: 'Commands in 2027', title: 'Command-based in 2027',
  description: 'What changes for command-based Java in 2027: Commands v3, written as one function per command, next to the v2 code from Deck 2.',
  slides: [
    L.cover({
      title: 'Command-based in 2027',
      subtitle: 'Commands v3, side by side with the v2 code you know',
      tag: 'WPILib 2027 alpha · Java · Command-based',
      notes: `WPILib 2027 keeps the command-based library from these decks, now called Commands v2, and adds a new one, Commands v3. This deck shows what is different, using Deck 2’s KitBot code rewritten in v3. Everything here was checked against WPILib ${ALPHA}, from October 2026. That is alpha software, so names can still change before kickoff. Check again when the 2027 release ships.`,
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers',
      text: 'v3 keeps commands, requirements and triggers. What changes is how you write a command.',
      points: [
        'What else changes for command code in 2027.',
        'The big idea: one function that runs top to bottom.',
        'Deck 2’s drive and timed autonomous, rewritten in v3.',
        'Priorities, cleanup and scopes, and two new mistakes to avoid.',
      ],
      notes: 'Most of what students learned in Decks 2 and 6 still holds: mechanisms own hardware, commands require them, one command per mechanism at a time, and triggers start commands. v3 changes how command logic is written and adds a few tools. v2 is still in 2027, so nothing in the earlier decks stops working as an idea.',
    }),

    L.table({
      id: 'what-changes', eyebrow: 'The big picture', title: 'What changes for command code in 2027',
      columns: ['In 2026', 'In 2027'], widths: [42, 58], fontSize: 28,
      rows: [
        ['Commands v2 only', 'v2 and the new v3. v3 is for Java only.'],
        ['edu.wpi.first.wpilibj2.command', 'org.wpilib.command2, or org.wpilib.command3'],
        ['Java 17', 'Java 25'],
        ['motor.set(0.5)', 'motor.setThrottle(0.5)'],
        ['SendableChooser for autos', 'Selectable, published with Tunables'],
        ['Test mode', 'Utility mode'],
      ],
      caption: `Checked against WPILib ${ALPHA}. Alpha software, so this can still change.`,
      ref: { label: 'Commands v3 Programming', url: DOC('index') },
      notes: 'v3 depends on a Java feature, so C++ and Python teams stay on v2. Both libraries move to new package names, as all of WPILib does in 2027. Motor controllers use setThrottle instead of set, which Deck 2’s 2027 slide mentioned. SendableChooser is gone from the 2027 source, and WPILib’s examples use Selectable instead. Test mode is now called Utility mode, so testInit becomes utilityInit. OpModes are also new in 2027, a way to choose autos and teleops from the Driver Station, but they are optional and beyond this deck.',
    }),

    L.compare({
      id: 'big-idea', eyebrow: 'The big idea', title: 'Four methods in v2, one function in v3',
      left: { label: 'Commands v2', items: [
        '`initialize()` runs once, at the start.',
        '`execute()` is called by the scheduler every 20 ms.',
        '`isFinished()` is checked every loop.',
        '`end(interrupted)` runs once, at the end.',
      ] },
      right: { label: 'Commands v3', tone: 'good', items: [
        '**One function** runs top to bottom, like normal Java.',
        '`coroutine.yield()` pauses until the next 20 ms loop.',
        'Reaching the end, or `return`, finishes the command.',
        '`whenExited(...)` holds cleanup that runs however it ends.',
      ] },
      notes: 'In v2, the scheduler calls your methods, and you split one action across four of them. New programmers often write a while loop inside execute and freeze the robot, because execute is supposed to return quickly. In v3, a command is one function. A loop is a normal loop, and the yield inside it hands control back to the scheduler until the next 20 ms tick. That is the coroutine: a function that can pause and pick up where it left off. The scheduler still runs many commands at once by taking turns.',
    }),

    L.codeNotes({
      id: 'first-command', eyebrow: 'Writing a v3 command', title: 'A v3 command reads in the order the robot acts', file: 'Feeder.java',
      src: { file: `${J27}/Feeder.java`, region: 'right' },
      callouts: [
        { line: [3, 4], title: 'run(...)', text: 'Requires this mechanism. `setThrottle` is 2027’s `set`.' },
        { line: 5, title: 'Wait for a sensor', text: 'Yields every loop until it is true.' },
        { line: 7, title: 'Cleanup', text: 'Runs however the command ends.' },
        { line: 8, title: 'A name is required', text: 'No name, no command: it won’t compile.' },
      ],
      notes: 'Read it top to bottom: start the roller, wait until the beam break sees a piece, and the command ends. waitUntil gives control back to the scheduler every loop while it waits, so the drive and everything else keep running. Every v3 command must have a name. The builder will not produce a command until named is called, so a missing name is a compile error, not a blank line in the logs. Whatever stops the roller goes in whenExited, which the next mistake explains.',
    }),

    L.table({
      id: 'mapping', eyebrow: 'From v2 to v3', title: 'The v2 words you know, in v3',
      columns: ['v2', 'v3', 'Note'], widths: [33, 37, 30], fontSize: 26,
      rows: [
        ['extends SubsystemBase', 'implements Mechanism', 'An interface now'],
        ['run(() -> ...)', 'runRepeatedly(() -> ...)', 'v2’s run repeats'],
        ['runOnce(() -> ...)', 'run(c -> ...) with no yield', 'Ends when it returns'],
        ['.withName("...")', '.named("...")', 'Required'],
        ['Commands.waitSeconds(1)', 'Command.waitFor(Seconds.of(1))', 'Times use units'],
        ['.finallyDo(...)', '.whenExited(...)', 'Runs however it ends'],
        ['CommandScheduler.getInstance()', 'Scheduler.getDefault()', 'Same job'],
        ['.asProxy()', 'coroutine.await(...)', 'Built in'],
      ],
      ref: { label: 'Migrating from Commands v2', url: DOC('migration-guide') },
      notes: 'Most of the change is vocabulary. A Mechanism is v2’s subsystem, but it is an interface, and it has no periodic method: call update code from robotPeriodic instead. Times in v3 are WPILib units, such as Seconds.of(1). Proxy commands existed in v2 to stop a group from owning every subsystem for its whole length. In v3, a command started with await owns its mechanism only while it runs, which is what proxies did. WPILib’s migration guide has every pair with examples.',
    }),

    L.gotcha({
      id: 'gotcha-run', title: '`run` means something different',
      symptom: 'A drive command copied from v2 moves for one loop, then stops. The command ends at once.',
      cause: 'v2’s `run` calls its code every 20 ms. v3’s `run` calls its function once, and a function with no loop ends right away.',
      fix: 'Use `runRepeatedly` where v2 used `run`, or write the loop yourself with `coroutine.yield()`.',
      code: `
run(() -> drive.arcadeDrive(f, r))           // v2: every 20 ms
run(c -> drive.arcadeDrive(f, r))            // v3: once, then ends
runRepeatedly(() -> drive.arcadeDrive(f, r)) // v3: every 20 ms`,
      notes: 'This is the trap most likely to catch a team porting Deck 2. Both versions have a method called run, and both compile, but they mean different things. In v3, run starts a coroutine command: the function runs once, and only a loop with a yield makes it last. runRepeatedly is the direct match for v2’s run. Read every run call when porting code, rather than changing imports and hoping.',
    }),

    L.code({
      id: 'mechanism', eyebrow: 'Writing a v3 command', title: 'Deck 2’s drive, as a mechanism', file: 'KitBotDrive.java',
      src: { file: `${J27}/KitBotDrive.java`, region: 'arcade' }, highlight: [3, 4, 5],
      caption: '`runRepeatedly` is v2’s `run`. The lowest priority lets any other command take the drive.',
      notes: 'This is Deck 2’s driveArcade factory. The suppliers work the same way: the sticks are read again every loop. Robot.java sets it as the drive’s default command, the same as Deck 2. WPILib’s docs advise giving default commands a priority below ordinary commands, because a default command’s priority becomes the lowest priority that can ever take the mechanism. The next slide explains priorities.',
    }),

    L.table({
      id: 'priority', eyebrow: 'Priorities', title: 'Priorities replace “interruptible or not”',
      columns: ['When a new command conflicts with a running one', 'What happens'], widths: [58, 42], fontSize: 28,
      rows: [
        ['The new one has a higher priority', 'It starts. The old one is cancelled.'],
        ['They have the same priority', 'It starts. The old one is cancelled.'],
        ['The new one has a lower priority', 'It is discarded. The old one keeps running.'],
      ],
      caption: 'The default priority is 0. `Command.LOWEST_PRIORITY` suits default commands and idles.',
      ref: { label: 'Migrating from Commands v2', url: DOC('migration-guide') },
      notes: 'In v2, a command was either always interruptible, the default, or never interruptible, with kCancelIncoming. v3 gives every command a whole number priority instead. Equal priority behaves like v2’s default: the newest command wins. A higher number protects a command from ordinary ones, which is useful for something like a homing routine that must finish. Commands inside a group inherit the group’s priority when it is higher than their own.',
    }),

    L.sectionSlide({ id: 'sequences-section', no: 1, title: 'Sequences and autonomous', section: 'Deck 2’s timed autonomous, three ways.', sub: 'The same routine in v2, in a v3 builder, and as v3 steps',
      notes: 'Deck 2 built a timed autonomous routine: drive forward, hold still, turn. Here it is again, once as students wrote it in Deck 2 and twice in v3.' }),

    L.code({
      id: 'v2-sequence', eyebrow: 'Deck 2, in v2', title: 'The routine students already wrote', file: 'deck2/DriveAutos.java',
      src: { file: `${J2}/DriveAutos.java`, region: 'sequence' }, highlight: [3, 4, 5, 6],
      caption: 'Deck 2’s code, unchanged: it compiles against WPILib 2026.',
      notes: 'This is the v2 version from Deck 2, with each step ended by withTimeout and the middle step driving at zero, so motor safety stays fed. Keep it in view: the next two slides do the same thing in v3.',
    }),

    L.code({
      id: 'v3-sequence', eyebrow: 'v3, builder', title: 'The same routine with v3’s builder', file: 'DriveAutos.java',
      src: { file: `${J27}/DriveAutos.java`, region: 'sequence' }, highlight: [3, 4, 5, 6, 7],
      caption: '`idleFor` holds still because `KitBotDrive` makes its idle drive at zero. The name ends the builder.',
      notes: 'Command.sequence works like v2’s Commands.sequence, except that it is a builder: it becomes a command only when it is named. driveFor is a small factory in KitBotDrive: runRepeatedly with a timeout. idleFor is built into every mechanism. By default it does nothing at all, which on a drivetrain would let motor safety cut the motors and print the same error as Deck 2’s waitSeconds mistake. So KitBotDrive overrides idle to drive at zero every loop.',
    }),

    L.code({
      id: 'v3-steps', eyebrow: 'v3, coroutine', title: 'The same routine as plain steps', file: 'DriveAutos.java',
      src: { file: `${J27}/DriveAutos.java`, region: 'coroutine' }, highlight: [3, 4, 5, 6, 7],
      caption: '`await` starts a command and waits for it to end. Any Java fits between steps.',
      notes: 'Here the routine is ordinary code: each await starts a command and pauses this one until that command ends. Between steps you can write any Java, such as an if that skips a step when a sensor says so, or a print. requiring(drive) keeps the drive owned for the whole routine. With noRequirements instead, the drive would be free between steps, so its default command, the gamepad drive, could run for a moment. Child commands may share the parent’s requirements in v3 without interrupting it.',
    }),

    L.table({
      id: 'compose', eyebrow: 'Sequences', title: 'Combining commands in v3',
      columns: ['Write this', 'It runs', 'It ends when'], widths: [42, 28, 30], fontSize: 26,
      rows: [
        ['Command.sequence(a, b).named(...)', 'each one in order', 'the last one ends'],
        ['coroutine.await(a)', 'a, and this waits', 'a ends'],
        ['Command.parallel(a, b).named(...)', 'a and b at once', 'both have ended'],
        ['Command.race(a, b).named(...)', 'a and b at once', 'either one ends'],
        ['Command.parallel(a).optional(b)', 'a and b at once', 'a ends, and b is cancelled'],
        ['coroutine.fork(a)', 'a in the background', 'this keeps going'],
        ['a.withTimeout(Seconds.of(2))', 'a for at most 2 seconds', 'a ends or the time is up'],
      ],
      ref: { label: 'Creating Commands', url: DOC('creating-commands') },
      notes: 'This is Deck 2’s table in v3 terms. A parallel group with optional members replaces v2’s deadlineFor: the required command sets the end, and the optional ones are cancelled then. fork starts a child command and carries on without waiting, and the child is cancelled if the parent ends first. awaitAll and awaitAny are the coroutine forms of parallel and race. Groups still need a name, or withAutomaticName, which joins the names of the commands inside.',
    }),

    L.gotcha({
      id: 'gotcha-cleanup', title: 'The roller keeps spinning after a cancel',
      symptom: 'Bound with `whileTrue`, the feeder keeps running after the driver lets go of the button.',
      cause: 'Cancelling stops the function where it is, inside `waitUntil`. The line that stops the motor never runs.',
      fix: 'Put stop code in `whenExited`, which runs however the command ends, as on the first command slide.',
      code: `
motor.setThrottle(FEED_SPEED);
coroutine.waitUntil(this::hasPiece); // cancelled while waiting here
motor.setThrottle(0.0);              // so this never runs`,
      notes: 'In v2, end ran whether a command finished or was interrupted, so cleanup in end always happened. In v3, a cancelled command is never resumed: the scheduler drops it at its last yield. Code after that point is skipped. whenExited runs on every kind of ending, and whenCanceled only on cancellation. Keep both to a single quick action, such as setting a motor to zero.',
    }),

    L.practice({
      id: 'practice-yield', title: 'Every loop yields',
      rule: 'Put `coroutine.yield()`, or a wait that yields, in every loop in a command.',
      why: 'A loop that never yields freezes the whole robot. WPILib’s compiler plugin turns a `while` loop with no yield into a build error.',
      code: `
while (!atTarget()) { drive.arcadeDrive(0.4, 0); }   // build error

while (!atTarget()) {
  drive.arcadeDrive(0.4, 0);
  coroutine.yield();                                 // one loop at a time
}`,
      notes: 'Commands take turns. A command keeps the robot’s only thread until it yields, so a loop with no yield means no other command, trigger or motor safety check runs, and the robot freezes. waitUntil, wait, await and park all yield for you. The WPILib javac plugin checks while loops in coroutine commands and fails the build when one has no yield, which catches the classic v2 mistake at compile time. It checks while loops, so write loops as while loops.',
    }),

    L.codeNotes({
      id: 'control-loop', eyebrow: 'Control theory', title: 'A feedback loop that reads like the math', file: 'Arm.java',
      src: { file: `${J27}/Arm.java`, region: 'hold' },
      callouts: [
        { line: 3, title: 'Reset', text: 'A fresh start for each run.' },
        { line: [5, 6], title: 'Measure, then feedforward', text: 'Gravity, from Deck 6.' },
        { line: 7, title: 'Feedback', text: 'P on the angle error.' },
        { line: 8, title: 'One sample', text: 'Each yield is one 20 ms step: the loop’s dt.' },
      ],
      notes: 'This is Deck 6’s arm loop in v3. Each pass through the while loop is one sample of a discrete-time controller: measure the angle, add the gravity feedforward, add P times the error, apply the voltage, and yield. The yield sets the sample period, 20 ms, and PIDController assumes the same 0.02 s by default, so its I and D terms use the right dt. In v2, the same lines sat inside execute. Here the setup, the loop and the cleanup read in order.',
    }),

    L.table({
      id: 'scopes', eyebrow: 'Scopes', title: 'Bindings and default commands now have a scope',
      columns: ['Made in', 'Lasts until'], widths: [45, 55], fontSize: 28,
      rows: [
        ['The Robot constructor', 'The robot code stops'],
        ['autonomousInit, by scheduling', 'Autonomous ends: the auto is cancelled'],
        ['An OpMode', 'That OpMode ends'],
        ['A running command', 'That command ends'],
      ],
      caption: 'When a scope ends, its trigger bindings are removed and its default commands are put back.',
      ref: { label: 'Scopes', url: DOC('scopes') },
      notes: 'A trigger binding made inside an autonomous command only exists while that command runs, so an action meant for one routine cannot fire at some other time in the match. A default command set inside a command lasts only as long as that command, then the earlier default comes back. WPILib’s v3 HatchBot example schedules its auto in autonomousInit and notes that it is cancelled automatically when autonomous ends. In v2 the template’s teleopInit had to cancel it.',
    }),

    L.code({
      id: 'robot', eyebrow: 'The robot class', title: 'Deck 2’s bindings and chooser, in v3', file: 'Robot.java',
      src: { file: `${J27}/Robot.java`, region: 'setup' }, highlight: [6, 8, 9, 10],
      caption: '`robotPeriodic` calls `Scheduler.getDefault().run()`. `autonomousInit` schedules the chosen auto.',
      notes: 'WPILib’s v3 examples build everything in the Robot class, with no RobotContainer, and this follows them. The drive’s default command and the deadband are Deck 2’s. faceDown is the bottom face button on any gamepad, which is A on an Xbox controller: CommandGamepad names buttons by position, so one class works for any controller. Selectable replaces SendableChooser, and Tunables.publish puts it on the dashboard.',
    }),

    L.practice({
      id: 'practice-priority', title: 'Default commands get the lowest priority',
      rule: 'Give every default command `Command.LOWEST_PRIORITY`. Raise the priority only for a command that must not be stopped.',
      why: 'A default command’s priority is the lowest that can ever take its mechanism. Set it high, and button commands are discarded.',
      notes: 'WPILib’s migration guide warns about this directly: default commands should sit below ordinary commands, and never above 0. Ordinary commands keep the default priority of 0. Use higher priorities rarely and on purpose, and write the reason in a comment, because priorities make it harder to see why a button seems to do nothing.',
    }),

    L.compare({
      id: 'choose', eyebrow: 'Choosing', title: 'v2 or v3 for your team in 2027',
      left: { label: 'Stay on v2', items: [
        '**Same as these decks:** only package names change.',
        '**Every language:** C++ and Python have only v2.',
        '**Known patterns:** years of examples and team code.',
      ] },
      right: { label: 'Try v3', items: [
        '**Reads like Java:** loops, ifs and waits, in order.',
        '**Safer by default:** required names, yield checks, priorities.',
        '**New in 2027:** alpha now, so check your libraries support it.',
      ] },
      notes: 'Both are part of WPILib 2027, and WPILib’s docs don’t tell teams which one to use. For a young Java team, the deciding questions are practical: which version your mentors can help with, and whether the libraries you rely on, such as PathPlanner, support v3 when the season starts. That was not checked for this deck. Whatever you pick, the ideas from Decks 2 and 6 carry over unchanged.',
    }),

    L.exercise({
      id: 'exercise', title: 'Port Deck 2 to v3, on paper first',
      tasks: [
        'Rewrite Deck 2’s `driveArcade` factory for v3, using the mapping table.',
        'Rewrite `forwardPauseTurn` as a coroutine with `coroutine.await`.',
        'Swap with a partner and check: every command named, every loop yields, cleanup in `whenExited`.',
        'Optional: build it in a 2027 alpha project and fix what the compiler reports.',
      ],
      done: 'both commands are written, and your partner found no `run` that should be `runRepeatedly`.',
      notes: 'Paper first, because a 2027 project needs the 2027 alpha installer, which most laptops won’t have yet. Compare with examples-2027 in the repo afterwards. That code was written against the alpha source but has not been compiled, so if the build in the optional task disagrees with it, the build wins.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'WPILib 2027 keeps v2 and adds v3, which is for Java only.',
        'A v3 command is one function: loops yield, return ends it.',
        '`runRepeatedly` is v2’s `run`. v3’s `run` runs its function once.',
        'Names are required, and stop code goes in `whenExited`.',
        'Priorities, scopes and `await` replace interrupt flags and proxies.',
      ],
      notes: `All of this is from WPILib ${ALPHA}. Before kickoff, check the release notes for anything that changed.`,
    }),

    L.links({
      id: 'links', title: 'Official docs',
      items: [
        { label: 'Commands v3', url: DOC('index'), short: 'docs.wpilib.org (latest)' },
        { label: 'Migrating from v2', url: DOC('migration-guide'), short: 'docs.wpilib.org (latest)' },
        { label: 'v3 design document', url: `https://github.com/wpilibsuite/allwpilib/blob/${ALPHA}/design-docs/commands-v3.md`, short: 'github.com/wpilibsuite' },
        { label: 'v3 HatchBot example', url: `https://github.com/wpilibsuite/allwpilib/tree/${ALPHA}/wpilibjExamples/src/main/java/org/wpilib/examples/hatchbotcmdv3`, short: 'github.com/wpilibsuite' },
      ],
      notes: 'The docs links go to WPILib’s latest docs, which cover 2027. The design document explains why v3 works the way it does. The HatchBot example is a complete small v3 robot, close in size to the KitBot.',
    }),
  ],
};
