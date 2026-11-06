// Deck 11: PathPlanner step by step, on the Deck 10 tank drive. Sources are listed in SOURCES.md.
// Screenshots in images/ were taken from PathPlanner 2026.1.2 with this deck's settings, except
// vendor_dep_manager.png and telemetry.png, which come from the PathPlanner docs (MIT license).
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck11';
const PP = 'examples/src/main/deploy/pathplanner';
const SET = JSON.parse(readFileSync(`${PP}/settings.json`, 'utf8'));
const SHOT = 'Screenshot: PathPlanner 2026.1.2, with this deck’s KitBot settings.';
const DOCS = 'Image: PathPlanner docs, MIT license.';
const DOC = (page) => `https://pathplanner.dev/${page}.html`;

// The app's "Max Linear Acceleration", recomputed the way its source does it
// (lib/widgets/robot_config_settings.dart, _calculateMaxAccel) with WPILib's CIM model.
// Tank mode: two sides, two motors per side.
function accelLimit(s) {
  if (s.driveMotorType !== 'CIM') throw new Error('deck11: the slide assumes CIM motors');
  const n = 2, rpm = 5310, G = s.driveGearing, r = s.driveWheelRadius, V = 12;
  const stallT = 2.42 * n * G, stallI = 133 * n, freeI = 2.7 * n, freeW = (rpm * 2 * Math.PI / 60) / G;
  const R = V / stallI, kv = freeW / (V - R * freeI), kt = stallT / stallI;
  const current = (w) => -w / kv / R + V / R;
  const lossTorque = kt * Math.min(current(s.maxDriveSpeed / r), s.driveCurrentLimit * n);
  const grip = (s.wheelCOF * s.robotMass * 9.8) / 2;
  const motorTorque = kt * Math.min(stallI, s.driveCurrentLimit * n);
  const push = (motorTorque - lossTorque) / r;
  const force = Math.min(push, grip);
  const slipAmps = ((grip * r + lossTorque) / kt) / n;
  const freeSpeed = freeW * r;
  return { grip, motorTorque, lossTorque, push, force, accel: (force * 2) / s.robotMass, slipAmps, freeSpeed };
}
const A = accelLimit(SET);
const f1 = (x) => x.toFixed(1), f0 = (x) => x.toFixed(0), f2 = (x) => x.toFixed(2);

export default {
  no: 11, short: 'PathPlanner', title: 'PathPlanner step by step',
  description: 'Setting up the PathPlanner app and PathPlannerLib for a tank drive, drawing paths and an auto, attaching commands, and running it in the simulator.',
  slides: [
    L.cover({
      title: 'PathPlanner step by step',
      subtitle: 'Set it up, draw an auto, attach commands, and run it',
      notes: 'Deck 10 compared the path libraries and picked PathPlanner for most young teams. This deck walks through using it from start to finish on the Deck 10 tank drive: the app, the settings, two paths, an auto with commands, the code, and a run in the simulator. Every screenshot was taken from PathPlanner 2026.1.2 with the settings shown, except two from the PathPlanner docs, which are marked.',
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers',
      text: 'PathPlanner is two pieces: an app where you draw autos, and a library that runs them on the robot.',
      points: [
        'Installing both, and the settings a tank drive needs.',
        'Drawing paths, and building them into an auto.',
        'Attaching commands to paths, four different ways.',
        'The robot code, and a test in the simulator.',
      ],
      notes: 'The app is a desktop program. The library, PathPlannerLib, is a vendor dependency in your robot project. The app saves files into your project, and the library reads them on the robot. Commands are the same commands from Deck 2: the library runs them at the right moments in an auto.',
    }),

    L.diagram({
      id: 'two-parts', eyebrow: 'How it fits together', title: 'The app writes files, and the library runs them',
      caption: 'Schematic. The files travel to the roboRIO when you deploy, like the rest of src/main/deploy.',
      nodes: [
        { id: 'app', x: 128, y: 300, w: 380, h: 190, label: 'PathPlanner app', sub: 'on your laptop: draw paths and autos', tone: 'blue' },
        { id: 'files', x: 640, y: 300, w: 420, h: 190, label: 'deploy/pathplanner/', sub: 'settings.json, paths/*.path, autos/*.auto', tone: 'paper' },
        { id: 'lib', x: 1192, y: 300, w: 600, h: 190, label: 'PathPlannerLib', sub: 'on the robot: builds and follows each auto', tone: 'ink' },
        { id: 'code', x: 1192, y: 620, w: 600, h: 170, label: 'Your robot code', sub: 'configures it and registers command names', tone: 'accent' },
      ],
      edges: [
        { from: 'app', to: 'files', label: 'saves', lx: 520, ly: 350, lw: 110 },
        { from: 'files', to: 'lib', label: 'reads', lx: 1072, ly: 350, lw: 110 },
        { from: 'code', to: 'lib', fromSide: 't', toSide: 'b' },
      ],
      notes: 'The app never talks to your code directly. It saves plain files into src/main/deploy/pathplanner in your robot project. Deploying copies the deploy folder to the roboRIO, and PathPlannerLib reads the files there. Your code does two jobs: it tells the library how to drive your robot, and it gives every command name in the app a real command. Commit these files to git with the rest of the project.',
    }),

    L.table({
      id: 'needs', eyebrow: 'What you need first', title: 'Four methods the drivetrain must already have',
      columns: ['Method', 'What it does', 'Needs'], widths: [24, 46, 30], fontSize: 28,
      rows: [
        ['getPose()', 'Where the robot thinks it is on the field', 'Encoders, a gyro, odometry'],
        ['resetPose(pose)', 'Tells odometry where the robot is', 'Odometry'],
        ['getSpeeds()', 'How fast the robot is moving, robot-relative', 'Encoders'],
        ['driveSpeeds(speeds)', 'Drives at a forward speed and turn rate', 'Wheel speed control'],
      ],
      caption: 'Deck 10’s CANDriveSubsystem has all four. This deck reuses it. A stock KitBot has no encoders or gyro.',
      notes: 'A path follower compares where the robot should be with where it is, so it needs to measure position. That takes wheel encoders and a gyro, combined by odometry. Deck 10 covered this, and its drivetrain adds those sensors to the KitBot and passes the four methods to PathPlannerLib. Robot-relative speeds mean forward and turning speeds as the robot sees them, not along the field. Without sensors, start with the timed autonomous from Deck 2.',
    }),

    L.steps({
      id: 'install', eyebrow: 'Install', title: 'Install the app and the library',
      items: [
        { title: 'Install the PathPlanner app', text: 'From the Microsoft Store for automatic updates, or from the GitHub releases page.' },
        { title: 'Open WPILib VS Code', text: 'Open your robot project.' },
        { title: 'Add PathPlannerLib', text: 'WPILib logo in the activity bar, then find PathplannerLib under Available Dependencies and click Install.' },
        { title: 'Build once', text: 'Run WPILib: Build Robot Code to prove the library is in.' },
      ],
      qr: { url: DOC('pplib-getting-started'), label: 'PathPlannerLib install', short: 'pathplanner.dev' },
      notes: 'The app and the library are installed separately. The app runs on Windows, macOS and Linux. The GitHub releases page has every platform and any pre-release. The library is a vendor dependency, installed the same way as REVLib in Deck 1. The Dependency Manager offers the version made for this season, 2026.1.2 at the time of writing. The app warns you when the library in your project is older than the app.',
    }),

    L.figure({
      id: 'vendordep', eyebrow: 'Install', title: 'PathPlannerLib in the Dependency Manager',
      src: 'images/vendor_dep_manager.png', alt: 'The WPILib Vendor Dependencies panel in VS Code, listing PathplannerLib among installed dependencies.', width: 990, height: 1234,
      credit: `${DOCS} The versions shown are from 2025.`,
      items: [
        { title: 'Installed Dependencies', text: 'PathplannerLib appears here once it is installed.' },
        { title: 'Available Dependencies', text: 'Install it from this list the first time.' },
        { title: 'Update All', text: 'Moves every library to its newest version for the season.' },
      ],
      ref: { label: 'PathPlannerLib: Getting Started', url: DOC('pplib-getting-started') },
      notes: 'This image is from the PathPlanner docs, taken in 2025, so the version numbers are older than what you will see. The panel itself looks the same in 2026. Installing a library adds a JSON file to the vendordeps folder in your project. That file is how Gradle knows to download the library when it builds.',
    }),

    L.figure({
      id: 'open-project', eyebrow: 'The app', title: 'Open your robot project',
      src: 'images/start-page.png', alt: 'The PathPlanner 2026.1.2 start page with an Open Robot Project button over a blurred 2026 field.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Open Robot Project', text: 'Pick the folder that holds build.gradle.' },
        { title: 'Where files go', text: 'The app creates src/main/deploy/pathplanner inside that folder.' },
        { title: 'The 2026 field', text: 'If it offers the 2026 field image, choose Yes.' },
      ],
      ref: { label: 'Getting Started', url: DOC('gui-getting-started') },
      notes: 'The folder you pick is the root of your robot project, the same folder you open in VS Code. Picking a subfolder is a common mistake: the files then end up somewhere deploy does not copy. The first time a project opens in a new season, the app offers to switch to that season’s field and reset the navigation grid. The navigation grid is only used for pathfinding, which this deck does not cover.',
    }),

    L.figure({
      id: 'app-settings', eyebrow: 'Settings, part 1', title: 'App settings: tank mode and safe default limits',
      src: 'images/app-settings.png', alt: 'PathPlanner App Settings: max velocity 2.0, max acceleration 1.5, field image Rebuilt, Holonomic Mode off.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Holonomic Mode off', text: 'A tank drive cannot move sideways. Leave it on only for swerve.' },
        { title: 'Default constraints', text: '2 m/s and 1.5 m/s² for new paths: slow on purpose.' },
        { title: 'Field image', text: 'Rebuilt is the 2026 field.' },
        { title: 'Hot Reload', text: 'Keep it off at events.' },
      ],
      ref: { label: 'Settings', url: DOC('gui-settings') },
      notes: 'Settings opens from the menu at the top left. Holonomic mode is on by default, and it is for drivetrains that can move in any direction while facing any way, such as swerve. Turning it off swaps module offsets for a trackwidth and adds a Reversed option to paths. Default constraints are copied into every new path. Start slow and raise them once paths run well. Hot reload pushes path edits to a running robot. The docs ask teams to turn it off at competition, so a stray edit cannot reach the robot.',
    }),

    L.figure({
      id: 'robot-config', eyebrow: 'Settings, part 2', title: 'Robot config: the numbers that limit every path',
      src: 'images/robot-config.png', alt: 'PathPlanner Robot Config with the KitBot values and a computed max linear acceleration of 11.2 m/s².', width: 1280, height: 720,
      credit: SHOT,
      inline: true,
      items: [
        { title: 'Mass', text: `${SET.robotMass} kg, which is 60 lb` },
        { title: 'MOI', text: `${SET.robotMOI} kg·m², WPILib’s KitBot estimate` },
        { title: 'Trackwidth', text: `${f2(SET.robotTrackwidth)} m, which is 26 in` },
        { title: 'Wheels', text: `${SET.driveWheelRadius} m radius, ${SET.driveGearing}:1` },
        { title: 'True max speed', text: `${SET.maxDriveSpeed} m/s, 85% of free speed` },
        { title: 'Motor', text: `CIM, ${SET.driveCurrentLimit} A limit` },
        { title: 'Bumpers', text: 'for the drawing only' },
      ],
      ref: { label: 'Robot Config', url: DOC('robot-config') },
      notes: `Mass, MOI and trackwidth match WPILib’s KitBot simulator, so the app agrees with the simulator from Deck 4. MOI, the moment of inertia, measures how hard the robot is to spin. True max drive speed should be measured: drive straight as fast as possible on a full battery. Without a robot, the docs say to use about 85 percent of free speed, here ${f2(A.freeSpeed)} m/s. Wheel COF stays at the default 1.2 until you measure it. The current limit matches the code. Bumper sizes only change the drawing. These values are saved to settings.json, and the code reads them.`,
    }),

    L.steps({
      id: 'accel-limit', eyebrow: 'Control theory', title: `Where “Max Linear Acceleration: ${f1(A.accel)}” comes from`,
      items: [
        { title: `Grip: ${f0(A.grip)} N per side`, text: `Wheel friction × weight on that side: ${SET.wheelCOF} × ${SET.robotMass} kg × 9.8 ÷ 2.` },
        { title: `Motors: ${f0(A.push)} N per side`, text: `Two CIMs at ${SET.driveCurrentLimit} A give ${f1(A.motorTorque)} N·m at the wheel. ${f1(A.lossTorque)} N·m goes to friction, judged from true max speed. Divide by the wheel radius.` },
        { title: `The smaller one wins: ${f0(A.force)} N`, text: `Two sides push ${f0(2 * A.force)} N on ${SET.robotMass} kg: ${f1(A.accel)} m/s².` },
        { title: `Slip above ${f0(A.slipAmps)} A`, text: 'The app’s Max Optimal Current Limit: past it, the wheels slip instead of pushing harder.' },
      ],
      notes: `These numbers are computed in this deck’s source from the same formula the app uses, with WPILib’s CIM motor model, and they match the screenshot. Force per side is the smaller of two limits: what the motors can push, and what the carpet can hold before the wheels slip. At true max speed, the motors are only fighting friction, so the current they draw there tells the app how much torque friction eats. That is why true max speed matters. ${f1(A.accel)} m/s² is the robot’s ceiling. The 1.5 m/s² path limit sits far below it, so the path sets the pace, not the motors.`,
    }),

    L.figure({
      id: 'project-browser', eyebrow: 'The app', title: 'Paths on the left, autos on the right',
      src: 'images/project-browser.png', alt: 'The PathPlanner project browser with paths Back Off and Drive to Hub, and an auto named First Auto.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Path', text: 'One continuous motion from a start to an end.' },
        { title: 'Auto', text: 'A whole routine: paths and commands in order.' },
        { title: 'The + buttons', text: 'Make a new path or auto. Click a name to rename it.' },
        { title: 'The ⋮ menu', text: 'Duplicate or delete.' },
      ],
      ref: { label: 'Project Browser', url: DOC('gui-project-browser') },
      notes: 'Each path is one piece of motion, such as start to hub. An auto strings paths and commands together, so one path can be reused in many autos. The file names match the names on the cards, and robot code loads them by those names, so pick clear names early. New projects get an Example Path, which we deleted. The button at the bottom right manages named commands across the whole project.',
    }),

    L.figure({
      id: 'path-editor', eyebrow: 'Drawing a path', title: 'Drive to Hub: two waypoints and a curve',
      src: 'images/path-editor.png', alt: 'The PathPlanner path editor showing Drive to Hub, a curve from the upper left toward the blue hub, and the editor panel.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Waypoints', text: 'Green is the start, red the end. Double-click the field to add one.' },
        { title: 'Heading', text: 'The direction of travel through a point.' },
        { title: 'Control points', text: 'The grey dots. Drag them to bend the curve.' },
        { title: 'Time estimate', text: 'About 2.65 s with these limits.' },
      ],
      ref: { label: 'Editing Paths and Autos', url: DOC('gui-editing-paths-and-autos') },
      notes: 'Drive to Hub starts at x 1.6 m, y 6.4 m, heading minus 45 degrees, and ends at 3.3 by 4.7, heading minus 27 degrees, which points at the hub at about 4.6 by 4.0. The field origin is the corner of the blue alliance wall, and you always draw on the blue side. The code mirrors paths for red. Exact numbers can be typed in the Waypoints tree. A tank drive faces the way it travels, so a heading also sets which way the robot points. The outline drawn on the path is the robot, from the bumper settings.',
    }),

    L.figure({
      id: 'reversed', eyebrow: 'Drawing a path', title: 'Back Off: the same robot, driving backward',
      src: 'images/path-reversed.png', alt: 'The path editor showing Back Off with the Reversed box ticked and RVD at the top of the panel.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Starts where the last path ended', text: '3.3 m by 4.7 m, so the robot needs no jump.' },
        { title: 'Reversed', text: 'Tick it to drive backward. The panel then shows RVD.' },
        { title: 'Tank only', text: 'Reversed appears with Holonomic Mode off.' },
      ],
      notes: 'After launching, the robot backs away from the hub, still facing it. Its start matches the end of Drive to Hub, because the robot will be exactly there when this path begins. Headings here are the direction of travel, so they point away from the hub, at 153 and 150 degrees, while the robot faces the other way. PathPlanner can also link two waypoints by name, so moving one moves the other in every path.',
    }),

    L.sectionSlide({ id: 'commands-section', no: 1, title: 'Commands and paths', section: 'Attaching commands to paths and autos.', sub: 'Four ways to make the robot do something along the way',
      notes: 'A path only moves the robot. Scoring, intaking and launching are commands, and this part covers how they run with paths.' }),

    L.table({
      id: 'four-ways', eyebrow: 'Commands and paths', title: 'Four ways to run a command with a path',
      columns: ['Where', 'When it runs', 'Set up in', 'In this deck'], widths: [27, 31, 20, 22], fontSize: 26,
      rows: [
        ['Named command in an auto', 'Between paths. The next step waits for it.', 'The app', 'launch'],
        ['Event marker with a command', 'At a point on a path, while it keeps driving', 'The app', 'spinUp'],
        ['Event trigger', 'When the robot passes a marker by name', 'Java', 'EventTrigger'],
        ['Java composition', 'Anywhere, with Deck 2’s andThen and friends', 'Java', 'firstAutoInCode'],
      ],
      caption: 'All four end up as ordinary WPILib commands, from the same factory methods.',
      notes: 'The first two are the usual way: draw them in the app and register the names in code. A named command in an auto runs between paths, and the auto moves on only when it ends. A marker command runs alongside the path, so the robot keeps moving. Event triggers bind a command to a marker by its name in Java, and can do more, such as running only while the robot is inside a zone. Java composition skips the app’s auto and builds the routine from paths in code. Use one way per marker, not two.',
    }),

    L.figure({
      id: 'marker', eyebrow: 'Commands and paths', title: 'An event marker runs spinUp while the robot drives',
      src: 'images/event-marker.png', alt: 'The Event Markers tree with a marker named spinUp at position 0.50 and a named command spinUp attached.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Marker name', text: 'spinUp: also the name an event trigger would use.' },
        { title: 'Position 0.50', text: 'Halfway between waypoint 0 and waypoint 1.' },
        { title: 'The + button', text: 'Named Command, then type spinUp and press Enter.' },
        { title: 'Zoned Event', text: 'A start and an end position instead of one point.' },
      ],
      ref: { label: 'Editing Paths and Autos', url: DOC('gui-editing-paths-and-autos') },
      notes: 'The orange pin on the curve is the marker. Position counts waypoints: 0 is the start, 1 the next waypoint, so 0.5 is partway between them. When the robot passes it, PathPlannerLib schedules the attached command and keeps driving. The app saves a new command name only after you press Enter. When the path ends, PathPlannerLib ends every command its markers started, so a marker command should finish quickly or be fine to stop. spinUp starts the flywheel and ends at once, so the flywheel keeps spinning.',
    }),

    L.figure({
      id: 'auto-menu', eyebrow: 'Building an auto', title: 'What an auto can hold',
      src: 'images/auto-add-menu.png', alt: 'The auto editor add menu: Follow Path, Named Command, Wait Command, and four command group types.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Follow Path', text: 'Drive one of your paths.' },
        { title: 'Named Command', text: 'Run a command your code registered.' },
        { title: 'Wait Command', text: 'Pause for a set time.' },
        { title: 'Groups', text: 'Sequential, parallel, deadline and race, as in Deck 2.' },
      ],
      notes: 'The + at the top of the auto’s Sequential Group opens this menu. Every auto is a sequential group, so steps run top to bottom, and each step starts when the one before it ends. The four group types are WPILib’s command groups from Deck 2 and follow the same rules. In a deadline group, the first command is the deadline. A parallel group lets the robot drive a path while an intake runs, for example.',
    }),

    L.figure({
      id: 'auto', eyebrow: 'Building an auto', title: 'First Auto: drive, launch, back off',
      src: 'images/auto-editor.png', alt: 'The auto editor for First Auto: Drive to Hub, then the named command launch, then Back Off, with Reset Odometry ticked.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Drive to Hub', text: 'Its spinUp marker fires on the way.' },
        { title: 'launch', text: 'A named command. Back Off waits for it.' },
        { title: 'Back Off', text: 'Reversed, away from the hub.' },
        { title: 'Reset Odometry', text: 'Ticked: the robot starts at the first path’s start.' },
      ],
      notes: 'The simulated driving time is about 4.88 seconds, not counting the one-second launch. Reset Odometry tells PathPlannerLib to set the robot’s pose to the start of the first path when the auto begins. That only works if the robot really is placed there, which is Deck 10’s gotcha about start poses. The pin drawn on the first path is the spinUp marker.',
    }),

    L.figure({
      id: 'names', eyebrow: 'Building an auto', title: 'Every name the code must register',
      src: 'images/manage-events.png', alt: 'The Manage Events dialog listing spinUp and launch.', width: 1280, height: 720,
      credit: SHOT,
      items: [
        { title: 'Manage Events', text: 'The button at the bottom right of the project browser.' },
        { title: 'spinUp and launch', text: 'Every command name used in any path or auto.' },
        { title: 'Rename here', text: 'Changes the name everywhere it is used.' },
      ],
      notes: 'This list is the checklist for your code: each name here needs one registerCommand call with exactly the same spelling and capitals. Renaming in this dialog updates every path and auto, but not your Java, so change the code too. If you delete a name that is still in use, the app marks the cards that now have an empty command.',
    }),

    L.sectionSlide({ id: 'code-section', no: 2, title: 'The robot code', section: 'Configuring PathPlannerLib and registering commands.', sub: 'Deck 10’s drivetrain, plus a stand-in launcher',
      notes: 'The code lives in examples, in the frc.robot.deck11 package. It reuses the Deck 10 drivetrain, which has the sensors a path follower needs.' }),

    L.code({
      id: 'launcher', eyebrow: 'The commands', title: 'The two commands the names point to', file: 'Launcher.java',
      src: { file: `${J}/Launcher.java`, region: 'commands' }, highlight: [3, 8, 9, 10],
      caption: 'Ordinary factories from Deck 2. PathPlanner only decides when they run.',
      notes: 'The launcher is a stand-in with two motors, a flywheel and a feeder. Use your robot’s real mechanism. spinUp sets the flywheel and ends at once, which suits a marker: it ends before the path does, so nothing gets cut off. launch feeds for one second, then stops both motors whether it ends or is cancelled, because of finallyDo. The auto waits for launch to end before Back Off starts.',
    }),

    L.code({
      id: 'load', eyebrow: 'PathPlannerLib', title: 'Load the settings the app saved', file: 'PathPlannerSetup.java',
      src: { file: `${J}/PathPlannerSetup.java`, region: 'load' }, highlight: [3],
      caption: '`fromGUISettings()` reads `deploy/pathplanner/settings.json`: the numbers from the Robot Config slide.',
      notes: 'The robot settings live in one place, the app, and the code reads them from the file. If the file is missing, for example because the project was never opened in the app, this reports an error on the Driver Station and returns false instead of crashing the robot code. A crash at startup would leave the robot unable to drive at all. RobotContainer then builds an auto chooser with only None in it.',
    }),

    L.codeNotes({
      id: 'configure', eyebrow: 'PathPlannerLib', title: 'Tell PathPlannerLib how to drive this robot', file: 'PathPlannerSetup.java',
      src: { file: `${J}/PathPlannerSetup.java`, region: 'configure' },
      callouts: [
        { line: [2, 3, 4, 5], title: 'The four methods', text: 'From the needs slide.' },
        { line: 6, title: 'The tank follower', text: '`PPLTVController`, run every 20 ms.' },
        { line: 8, title: 'Draw on blue', text: 'True on red: paths are mirrored.' },
      ],
      notes: 'This runs once. PPLTVController is the follower for differential drives, built on WPILib’s LTV controller. It compares where the trajectory says the robot should be with getPose and adjusts the speeds. The alliance supplier is checked when each path starts, so the same autos work from either side. The last argument makes path commands require the drive.',
    }),

    L.code({
      id: 'setup', eyebrow: 'RobotContainer', title: 'Register names, then build the chooser', file: 'RobotContainer.java',
      src: { file: `${J}/RobotContainer.java`, region: 'setup' }, highlight: [5, 6, 9],
      caption: '`getAutonomousCommand()` returns `autoChooser.getSelected()`.',
      notes: 'Order matters. buildAutoChooser loads every auto file at that moment, and each named command is looked up as the auto is built. So every registerCommand call must come before it. The chooser has one entry per auto file, plus None as the default, and appears on the dashboard as Auto Chooser, in Elastic from Deck 5 for example. Loading every auto at startup also avoids a delay when autonomous begins, which the PathPlanner docs recommend.',
    }),

    L.gotcha({
      id: 'gotcha-register', title: 'The auto drives, but never launches',
      symptom: 'Drive to Hub and Back Off run, the launcher never moves, and the Driver Station shows a PathPlanner warning.',
      cause: '`registerCommand` ran after `buildAutoChooser()`, or the spelling differs from the app.',
      fix: 'Register every name first, spelled exactly as in Manage Events.',
      code: `
PathPlanner attempted to create a command 'launch' that has not
been registered with NamedCommands.registerCommand`,
      notes: 'When PathPlannerLib builds an auto and meets a name nobody registered, it prints this warning and puts in a command that does nothing, so the rest of the auto still runs. That makes the mistake easy to miss: the robot drives correctly and only the mechanism stays still. Names are case sensitive, so launch and Launch are different. Read the Driver Station messages after every deploy. The warning text is from NamedCommands.java in PathPlannerLib 2026.1.2.',
    }),

    L.code({
      id: 'in-code', eyebrow: 'Commands and paths', title: 'The same auto, written in Java', file: 'PathPlannerSetup.java',
      src: { file: `${J}/PathPlannerSetup.java`, region: 'in-code' }, highlight: [6, 7, 8, 9, 10],
      notes: 'This is the fourth way: load paths by file name and compose them with Deck 2’s tools. It builds the same routine as First Auto. resetOdom does what the Reset Odometry box does, and mirrors the pose for red. followPath still fires the spinUp marker, as long as spinUp was registered before the path file loads. Use this when a routine needs logic the app cannot draw, such as choosing a path from a sensor. Otherwise the app is easier to read and change.',
    }),

    L.practice({
      id: 'practice-names', title: 'Treat path and command names as code',
      rule: 'Pick clear names once. Rename only in the app, then fix the Java in the same commit.',
      why: 'The code loads paths by file name and commands by name. A rename on one side breaks the other without a build error.',
      notes: 'Renaming a path renames its file, and an auto in the app follows along, but Java that loads Drive to Hub by name does not. Renaming a command in Manage Events updates the app, not your registerCommand calls. Neither mistake stops the build. Commit the deploy/pathplanner folder with the code that uses it, so a teammate who checks out the project gets both halves together.',
    }),

    L.figure({
      id: 'telemetry', eyebrow: 'Testing', title: 'Telemetry: the target and the real robot',
      src: 'images/telemetry.png', alt: 'PathPlanner telemetry page with the field preview and three graphs: robot velocity, angular velocity and path inaccuracy.', width: 1266, height: 713,
      credit: `${DOCS} An older season’s field.`,
      items: [
        { title: 'Field preview', text: 'The path, the target pose in grey and the real pose in white.' },
        { title: 'Velocity graphs', text: 'Commanded and actual, straight and turning.' },
        { title: 'Path inaccuracy', text: 'How far the robot is from the target, 0 to 1 m.' },
        { title: 'Simulator or Robot', text: 'A switch on the page. Simulator connects to 127.0.0.1.' },
      ],
      ref: { label: 'Telemetry', url: DOC('gui-telemetry') },
      notes: 'The telemetry page is in the app’s menu. PathPlannerLib publishes the data whenever a path is running, with no extra code. This image is from the PathPlanner docs and shows an older field. Path inaccuracy is the distance between where the robot should be and where it is, which is the error the follower corrects. A steadily growing error points to a drivetrain problem, such as a wrong trackwidth, slipping wheels or a weak side, not to the path.',
    }),

    L.exercise({
      id: 'exercise', title: 'Run First Auto in the simulator',
      tasks: [
        'In a copy of `examples`, set `includeDesktopSupport` to true. Make `Robot.java` create `frc.robot.deck11.RobotContainer`.',
        'Run **WPILib: Simulate Robot Code**. In PathPlanner, open **Telemetry** and choose **Simulator**.',
        'In Elastic, set **Auto Chooser** to First Auto. In the Sim GUI, click **Autonomous**.',
        'In the app, give Drive to Hub its own max acceleration of 1.0 m/s². Restart the simulation and run it again.',
      ],
      done: 'the robot drives to the hub and backs off, with no PathPlanner warnings, and the second run takes longer.',
      notes: 'This uses the Deck 4 simulator through Deck 10’s drivetrain, which simulates the encoders and gyro. Path files deploy to the simulator from src/main/deploy just as they do to a robot. The last task changes one path’s max acceleration in the app: untick Use Default Constraints in Global Constraints first. With hot reload off, restart the simulation to pick up the change. This exercise has not yet been run on a real machine, so check it once before teaching.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'The app saves files into deploy/pathplanner, and PathPlannerLib runs them.',
        'Tank drive: Holonomic Mode off, real robot numbers, slow default limits.',
        'Paths are pieces of motion. An auto strings paths and commands together.',
        'Commands join paths four ways: auto steps, markers, event triggers and Java.',
        'Register every name before building autos, spelled exactly as in the app.',
      ],
      next: 'Deck 12 covers vision, which corrects the pose every path depends on.',
      notes: 'Everything PathPlanner does rests on getPose being right. Odometry drifts during a match, and vision is how teams correct it, which is the next deck.',
    }),

    L.links({
      id: 'links', title: 'Official docs',
      items: [
        { label: 'PathPlanner app', url: DOC('gui-getting-started'), short: 'pathplanner.dev' },
        { label: 'Robot config', url: DOC('robot-config'), short: 'pathplanner.dev' },
        { label: 'Build an auto', url: DOC('pplib-build-an-auto'), short: 'pathplanner.dev' },
        { label: 'Named commands', url: DOC('pplib-named-commands'), short: 'pathplanner.dev' },
      ],
      notes: 'These are the PathPlanner docs pages this deck follows: the app, the robot settings, configuring AutoBuilder, and named commands. The docs also cover event triggers, pathfinding and Choreo paths, which go beyond this deck.',
    }),
  ],
};
