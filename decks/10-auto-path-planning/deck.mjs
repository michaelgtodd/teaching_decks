// Deck 10: autonomous path planning libraries. Every claim here is listed with its source in SOURCES.md.
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck10';
const DECK = 'decks/10-auto-path-planning';

// `practice` takes code as a string, so read the same #regions a `code` slide would use.
function region(file, name) {
  const text = readFileSync(`${J}/${file}`, 'utf8').split('\n');
  const open = text.findIndex((l) => l.trim() === `// #region ${name}`);
  const close = text.findIndex((l, i) => i > open && l.trim() === '// #endregion');
  if (open < 0 || close < 0) throw new Error(`no region ${name} in ${file}`);
  const body = text.slice(open + 1, close);
  const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(ind)).join('\n');
}

// Plot data is a real run of frc.robot.deck10 in the WPILib simulator, not a drawing. See SOURCES.md.
const RUNS = JSON.parse(readFileSync(`${DECK}/sim-runs.json`, 'utf8'));
const cm = (m) => (m * 100).toFixed(0);

export default {
  no: 10, short: 'Auto path planning', title: 'Autonomous path planning libraries', minutes: 30,
  description: 'What a path follower does, what it needs from your robot, how PathPlanner, Choreo, BLine and WPILib compare in 2026, and how a young team can choose.',
  slides: [
    L.cover({
      title: 'Autonomous path planning libraries',
      subtitle: 'What each one does in 2026, and how to choose',
      minutes: 30,
      notes: 'Welcome. In the autonomous period the robot drives itself, with no driver. Today we look at the libraries FRC teams use to make a robot follow a path. I will also tell you what I would do in your place, because a list of options does not help much on a Saturday at the shop. Facts here were checked on November 4, 2026, so look again before kickoff. Timing: 30 minutes, including a 6 minute exercise in the simulator.',
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Outcomes', title: 'What you will be able to do',
      text: 'A path library makes your robot drive a planned curve by itself. Today you learn what it does, what it needs, and which one to pick.',
      points: [
        'Explain a path follower using the words from Deck 6.',
        'Say what your robot needs before any library can help.',
        'Tell PathPlanner, Choreo, BLine and WPILib\'s tools apart.',
        'Choose the right next step for your team.',
      ],
      notes: '(1 min) Here is the plan. First, what a path follower really does, because it is Deck 6 again with a moving setpoint. Then what your robot must have first, and I will be honest about the KitBot. Then the libraries, one at a time, and a table to compare them. We finish with a way to choose, and an exercise in the simulator from Deck 4. A vendor library, or vendordep, is code from outside WPILib that you add to your project. If a kid asks which library is best, say "best for which robot?" and hold that thought.',
    }),

    L.table({
      id: 'evidence', eyebrow: 'Evidence', title: 'What 1,257 team repos from 2026 actually use',
      columns: ['Library', 'Has the vendordep', 'Has its own path files'], widths: [36, 32, 32], fontSize: 26,
      rows: [
        ['PathPlanner', '887 repos (71%)', '704 repos (56%)'],
        ['Choreo', '178 repos (14%)', '127 repos (10%)'],
        ['BLine', '15 repos (1%)', '14 repos (1%)'],
        ['None of these three', '309 repos (25%)', 'Not counted'],
        ['WPILib\'s own tools', 'No vendordep to count', 'Not counted'],
      ],
      caption: 'Our count, Nov 2026, and rough: public Java repos with "rebuilt" or "frc" in the name, made Nov 2025 to Apr 2026. It shows what is in a repo, not what ran at events.',
      notes: '(1.5 min) "Popular" should mean something, so we counted. We read the file list of 1,257 public Java robot projects from the 2026 season. PathPlanner is four to five times as common as Choreo. BLine is new, and small so far. A quarter have none of the three. Two numbers overlap: 54 repos have both PathPlanner and Choreo paths. This is rough. Some repos are prototypes, private repos are missing, and we skipped default file names like New Path. WPILib\'s own tools need no vendordep, so this method can\'t see them. We found no 2026 poll with results.',
    }),

    L.diagram({
      id: 'theory', eyebrow: 'Control theory', title: 'What a path follower does 50 times a second',
      caption: '**Error = plan - pose.** A pose is a position on the field plus the way the robot faces.',
      nodes: [
        { id: 'plan', x: 128, y: 380, w: 300, h: 170, label: 'Trajectory', sub: 'where to be, and how fast, at each moment', tone: 'blue' },
        { id: 'ff', x: 540, y: 262, w: 320, h: 130, label: 'Feedforward', sub: 'the speed the plan asks for', tone: 'paper' },
        { id: 'fb', x: 540, y: 500, w: 320, h: 130, label: 'Feedback', sub: 'fixes the pose error', tone: 'paper' },
        { id: 'add', x: 950, y: 395, w: 140, h: 140, label: 'Add', tone: 'ink', round: true },
        { id: 'wheels', x: 1180, y: 380, w: 270, h: 170, label: 'Wheel control', sub: 'Deck 6: volts for that speed', tone: 'paper' },
        { id: 'robot', x: 1540, y: 380, w: 252, h: 170, label: 'Robot', sub: 'what really happens', tone: 'accent' },
        { id: 'odo', x: 1040, y: 680, w: 410, h: 130, label: 'Odometry', sub: 'where the robot thinks it is', tone: 'paper' },
      ],
      edges: [
        { from: 'plan', to: 'ff', route: 'elbow' },
        { from: 'plan', to: 'fb', route: 'elbow' },
        { from: 'ff', to: 'add', route: 'hv', toSide: 't' },
        { from: 'fb', to: 'add', route: 'hv', toSide: 'b' },
        { from: 'add', to: 'wheels' },
        { from: 'wheels', to: 'robot' },
        { from: 'robot', to: 'odo', fromSide: 'b', toSide: 'r', route: 'vh' },
        { from: 'odo', to: 'fb', fromSide: 'l', toSide: 'b', route: 'hv', label: 'measurement', lx: 600, ly: 760, lw: 240 },
      ],
      notes: '(2 min) Deck 6 gave you a loop: setpoint, measurement, error. A path follower is the same loop, except the setpoint moves. The trajectory is the plan: at 1.2 seconds, be here, going this fast. Feedforward sends the speed the plan already asks for. Feedback looks at the gap between the plan and where odometry says you are, and adds a small correction. Then each wheel side gets its own smaller loop, just like your arm. All of it runs every 20 milliseconds. Remember the Deck 6 line: feedforward does the work, PID cleans up. If a kid asks, yes, a loop inside a loop is normal.',
    }),

    L.codeNotes({
      id: 'wpilib', eyebrow: 'WPILib: built in, no app', title: 'The whole follower fits on one slide',
      src: { file: `${J}/WpilibPaths.java`, region: 'follow' }, file: 'deck10/WpilibPaths.java',
      callouts: [
        { line: 3, title: 'The follower', text: '`LTVUnicycleController` is WPILib\'s follower for tank drives.' },
        { line: 7, title: 'Start at the start', text: 'Tell odometry the robot is at the first point.' },
        { line: 10, title: 'Ask the plan', text: 'Where should I be now, and how fast?' },
        { line: 12, title: 'Feedforward plus feedback', text: 'The planned speed, plus a fix for the pose error.' },
      ],
      notes: '(2 min) This is WPILib alone: no vendor library, no app. TrajectoryGenerator takes a start, an end, points to pass through and speed limits. This command follows the result. Read the two middle lines out loud: ask the plan where to be, then ask the follower for speeds. WPILib\'s docs say LTV replaced Ramsete, so old tutorials may show that name. PathPlanner\'s tank follower is built on this same class. With no app, you type every waypoint. That is a good way to learn, and a slow way to build ten autos. The docs point swerve teams to Choreo or PathPlanner.',
    }),

    L.plot({
      id: 'feedback', eyebrow: 'Control theory', title: 'What feedback adds when the robot is not perfect',
      alt: `Distance from the plan over about 3 seconds in simulation. With a weak left side and no feedback it grows to ${cm(RUNS.ffWeak.maxErrorM)} cm. With feedback it stays near ${cm(RUNS.fbWeak.maxErrorM)} cm.`,
      xLabel: 'Time (s)', yLabel: 'Distance from the plan (m)', xDomain: [0, 3], yDomain: [0, 0.9], xTicks: [0, 1, 2, 3], yTicks: [0, 0.2, 0.4, 0.6, 0.8],
      series: [
        { name: 'No feedback, weak side', color: 'orange', points: RUNS.ffWeak.points },
        { name: 'With feedback, weak side', color: 'blue', points: RUNS.fbWeak.points },
        { name: 'No feedback, healthy', color: 'green', dash: true, points: RUNS.ffHealthy.points },
      ],
      callouts: [
        { title: 'Healthy, no feedback', text: `Lags up to ${cm(RUNS.ffHealthy.maxErrorM)} cm, then catches up.` },
        { title: 'Weak side, no feedback', text: `Ends ${cm(RUNS.ffWeak.maxErrorM)} cm off, turned ${RUNS.ffWeak.end.deg.toFixed(0)} degrees.` },
        { title: 'Weak side, with feedback', text: `Never more than ${cm(RUNS.fbWeak.maxErrorM)} cm off.` },
      ],
      notes: `(1.5 min) This is a real run of this deck's code in the WPILib simulator: an S-curve of about 3 meters, at up to 2 meters per second. "Weak side" means the left side gets 90 percent of its volts, like a stiff gearbox. Green is a healthy robot on feedforward alone. It falls ${cm(RUNS.ffHealthy.maxErrorM)} cm behind while speeding up, then catches up. Orange is the same code with the weak side: it ends ${cm(RUNS.ffWeak.maxErrorM)} cm off. Blue adds feedback, and stays within ${cm(RUNS.fbWeak.maxErrorM)} cm. This is a simulator, so a real robot will be messier. Feedback can also only fix what your sensors can see. You will run this yourself soon.`,
    }),

    L.table({
      id: 'needs', eyebrow: 'What you need first', title: 'Every library needs these, and a stock KitBot has none',
      columns: ['You need', 'What it does', 'Stock 2026 KitBot'], widths: [24, 40, 36], fontSize: 26,
      rows: [
        ['Wheel encoders', 'Measure how far each side rolled', 'None. CIMs have no built-in encoder'],
        ['Gyro', 'Measures which way the robot points', 'None in the build or the code'],
        ['Odometry', 'Turns those into a pose on the field', 'Nothing to feed it'],
        ['Tuned drivetrain', 'Drives at the speed you ask for', 'Not yet: stick to volts, nothing measured'],
      ],
      caption: 'You can add them. The KitBot gearboxes have holes for optional encoders. Measure kV and kS with WPILib\'s SysId tool.',
      notes: '(1.5 min) Here is the honest part. Every library today needs a pose, and a pose comes from sensors. Encoders measure wheel travel. A gyro measures heading. Odometry combines them into a position on the field. The KitBot uses brushed CIMs, which have no encoder inside, and FIRST\'s KitBot guide and code use no encoder or gyro. Tuned means the robot really drives at the speed you ask for. So on a stock KitBot, no path library can work yet. If a kid asks about NEOs: brushless motors report their own rotation, so you would still need the gyro.',
    }),

    L.practice({
      id: 'timed', title: 'Start with a timed auto',
      rule: 'Get a timed auto working first. It needs no sensors and no library.',
      why: 'FIRST\'s KitBot code works this way. This one moved 2.5 m in our simulator, but carpet and battery change that, so measure on a real floor.',
      code: region('TimedAuto.java', 'timed'),
      notes: '(1.5 min) This is a complete autonomous routine: drive for a set time, stop, then launch. FIRST\'s own KitBot code does the same thing with withTimeout, so you already know the tools. It gives you a working auto on day one. The weakness is that time can\'t see the floor. Your robot does not know how far it went, so a different carpet or a tired battery changes the result. Keep it short, start from the same spot every match, and test on a real floor. Only move on to paths when your robot can measure itself. Timing cue: about 12 minutes in.',
    }),

    L.compare({
      id: 'draw-vs-solve', eyebrow: 'PathPlanner and Choreo', title: 'One lets you draw the path, one solves it',
      left: { label: 'PathPlanner: you shape the curve', tone: 'neutral', items: [
        'Drag **Bézier curves** in an app. That is a smooth line you bend with handles.',
        'The timing is worked out on the robot, from your speed limits.',
        'It can plan around obstacles during a match.',
        'The follower comes with the library.',
      ] },
      right: { label: 'Choreo: a solver finds the fastest path', tone: 'good', items: [
        'Place waypoints and limits in an app, and a solver does the rest.',
        'The fastest path your drivetrain can do, saved to a fixed file.',
        'Better robot numbers give better paths: mass, motors, gearing.',
        'You write the follower yourself.',
      ] },
      notes: '(2 min) This is the big difference today. In PathPlanner you are the artist: you bend the curve until it looks right, and the robot works out the timing from your limits. In Choreo you say where to go and what the robot can do, and a solver computes the fastest path. A solver is a program that searches for the best answer. It runs on your laptop before the match, so the path is fixed. One team on Chief Delphi tried it and reported paths about 6 to 11 percent faster. That is one team\'s test, not a rule. PathPlanner can also load Choreo paths, so you can add one to the other.',
    }),

    L.codeNotes({
      id: 'pathplanner', eyebrow: 'PathPlanner 2026.1.2', title: 'PathPlanner: set it up once, then run what you drew',
      src: { file: `${J}/PathPlannerPaths.java`, region: 'configure' }, file: 'deck10/PathPlannerPaths.java',
      callouts: [
        { line: [3, 4, 5, 6], title: 'Four things you provide', text: 'Get pose, reset pose, read speeds, drive at speeds.' },
        { line: 7, title: 'Follower included', text: '`PPLTVController` for tank. Swerve uses `PPHolonomicDriveController`.' },
        { line: 9, title: 'Draw on blue', text: 'It flips your paths to the red side when it should.' },
        { line: [13, 14], title: 'Run what you drew', text: 'Register command names first, then load the auto.' },
      ],
      notes: '(1.5 min) You call configure once, from the drive subsystem or RobotContainer. It needs four things from your code, and you can see them at the top. Those are the same four jobs odometry and wheel control already do. Then you draw paths and autos in the PathPlanner app, and they land in your deploy folder. Install the library from the WPILib Dependency Manager in VS Code. An event marker is a point on a path that runs a command, such as starting the launcher. The command name in the app must match the name you registered. You can also build paths in code, which is what the exercise does.',
    }),

    L.code({
      id: 'choreo', eyebrow: 'Choreo 2026.0.3', title: 'Choreo: you write the follower, then wire the routine',
      src: { file: `${J}/ChoreoPaths.java`, region: 'slide' }, file: 'deck10/ChoreoPaths.java', highlight: [2, 3, 4, 5, 6, 12, 13],
      notes: '(1.5 min) The top half is the job PathPlanner does for you. Choreo hands you one sample per loop, and you decide how to follow it. This one uses the same LTV follower as before. We hand this method to an AutoFactory, along with get pose and reset pose. The bottom half is the part teams like. A routine is a set of triggers, the same Trigger class you bind buttons with. When the routine starts, reset odometry and run the path. At the spinUp marker, placed in the Choreo app, start the launcher. When the path is done, launch. Install it from the WPILib Dependency Manager too.',
    }),

    L.codeNotes({
      id: 'bline', eyebrow: 'BLine 0.9.3: newest of the four', title: 'BLine: PID loops chase targets, with no timed plan',
      src: { file: `${J}/BLinePaths.java`, region: 'builder' }, file: 'deck10/BLinePaths.java',
      callouts: [
        { line: [6, 7, 8], title: 'Three PID loops', text: 'Speed along the path, heading, and staying on the line.' },
        { line: [12, 13, 15], title: 'Straight legs', text: 'The robot heads for each target, then hands off to the next.' },
        { line: 14, title: 'Events', text: 'They fire part way along a leg.' },
        { line: 3, title: 'Holonomic only', text: 'That means no tank. This code uses a swerve stand-in.' },
      ],
      notes: '(1 min) BLine works differently. There is no trajectory with times in it. It reads the live pose, and PID loops drive toward the next target along straight legs, so it has no feedforward from a plan. Its authors say it tunes quickly, and that is their claim, not ours. It was started by a student on Team 2638, and was announced in January 2026, so it is the newest here. It works only on holonomic drivetrains, which means swerve, so a KitBot can\'t use it. It is not in the WPILib vendor list, so you paste a URL to install it. We ran this code against a stand-in, not a real drivetrain.',
    }),

    L.table({
      id: 'side-by-side', eyebrow: 'Side by side', title: 'The four options in 2026', flag2027: 'PathPlanner, Choreo and BLine all have 2027 work under way.',
      columns: ['', 'PathPlanner', 'Choreo', 'BLine', 'WPILib tools'], widths: [17, 22, 22, 21, 18], fontSize: 22,
      rows: [
        ['Paths are', 'Curves you draw', 'Solved for speed', 'Straight legs', 'Splines from code'],
        ['Made in', 'App or code', 'App, before the match', 'App or code', 'Code'],
        ['Drivetrains', 'Tank, swerve', 'Tank, swerve', 'Swerve, no tank', 'Tank; for swerve, docs point to others'],
        ['During a match', 'Avoids obstacles, or paths from code', 'No new paths', 'Paths from code', 'Paths from code'],
        ['Events', 'Markers, zones, triggers', 'Markers, triggers', 'Event triggers', 'None: use command groups'],
        ['You write', 'Four methods', 'Pose, reset and the follower', 'Four methods, 3 PID loops', 'All of it'],
        ['Made by', 'Team 3015; one main developer', 'SleipnirGroup; two main developers', 'Team 2638 student; one main developer', 'WPILib project'],
      ],
      caption: 'WPILib\'s older app, PathWeaver, is deprecated, so do not start with it.',
      notes: '(1.5 min) Photograph this one. Read down a column to learn a library, and across a row to compare. Three rows matter most for a young team. Drivetrains: BLine has no tank support. During a match: only PathPlanner can plan around obstacles while driving, and Choreo paths are fixed before the match. You write: PathPlanner asks for the least. "Made by" is worth a look too. These are mostly volunteers and students, so read their docs, say thank you, and report bugs kindly. Everything here comes from the 2026 releases we checked.',
    }),

    L.diagram({
      id: 'choose', eyebrow: 'How to choose', title: 'Start here: our recommendation for a young team',
      nodes: [
        { id: 'sensors', x: 128, y: 250, w: 400, h: 150, label: 'Encoders and a gyro?', tone: 'ghost' },
        { id: 'tuned', x: 650, y: 250, w: 400, h: 150, label: 'Drivetrain tuned?', sub: 'Odometry matches a tape measure', tone: 'ghost' },
        { id: 'pp', x: 1172, y: 250, w: 620, h: 150, label: 'PathPlanner', sub: 'Tank or swerve. Most teams, most help.', tone: 'accent' },
        { id: 'timed', x: 128, y: 560, w: 400, h: 150, label: 'Timed auto', sub: 'Valid today. Add sensors after.', tone: 'ink' },
        { id: 'sysid', x: 650, y: 560, w: 400, h: 150, label: 'Run SysId', sub: 'Then test one straight path', tone: 'paper' },
        { id: 'limit', x: 1172, y: 540, w: 620, h: 120, label: 'Autos work, and path speed is your limit?', tone: 'ghost' },
        { id: 'choreo', x: 1172, y: 770, w: 620, h: 120, label: 'Add Choreo', sub: 'PathPlanner can load its paths', tone: 'blue' },
      ],
      edges: [
        { from: 'sensors', to: 'tuned', label: 'yes', lx: 529, ly: 278, lw: 120 },
        { from: 'tuned', to: 'pp', label: 'yes', lx: 1051, ly: 278, lw: 120 },
        { from: 'sensors', to: 'timed', fromSide: 'b', toSide: 't', label: 'no', lx: 340, ly: 460, lw: 80 },
        { from: 'tuned', to: 'sysid', fromSide: 'b', toSide: 't', label: 'no', lx: 862, ly: 460, lw: 80 },
        { from: 'pp', to: 'limit', fromSide: 'b', toSide: 't', label: 'later', lx: 1494, ly: 450, lw: 100 },
        { from: 'limit', to: 'choreo', fromSide: 'b', toSide: 't', label: 'yes', lx: 1494, ly: 695, lw: 80 },
      ],
      notes: '(1.5 min) Here is our advice. Stock KitBot: stay left. A good timed auto beats a broken path. Once you add sensors, tune the drivetrain, then check odometry with a tape measure: roll the robot 3 meters and read the pose. Then use PathPlanner. Most teams use it, so help is easy to find, it works on tank and swerve, and the follower is included. Add Choreo only when your autos work and path speed is what is holding you back. PathPlanner can load Choreo paths, and 28 repos in our sample had Choreo paths without ChoreoLib. A swerve team can try BLine, but it is not where I would start. WPILib alone is great for learning.',
    }),

    L.gotcha({
      id: 'gotcha-start', title: 'The path is perfect, in the wrong place',
      symptom: 'The curve looks right and the logs say the robot hit its target, but the real robot misses.',
      cause: 'Resetting odometry tells the robot where it is, and it believes you. It can\'t tell you placed it wrong.',
      fix: 'Measure your starting pose, and line up the same way every match. In sim, 10° crooked ended 55 cm off.',
      notes: '(1 min) We tried it in the simulator. Starting the robot 10 degrees crooked, it ended 55 cm from the goal, while odometry reported it was within about 1 cm. Starting 50 cm too far forward, it ended 50 cm off in the same way. The robot followed the path perfectly, in its own mind. Odometry only measures change from where you said it started. So your starting spot is part of your code. Choose something on the field you can line up against, and practice it.',
    }),

    L.exercise({
      id: 'exercise', title: 'Follow a path, then break it on purpose', minutes: 6,
      tasks: [
        'Run `WPILib: Simulate Robot Code`. In AdvantageScope, drag `SimPose` and `TargetPose` onto **Poses**.',
        'Click **Autonomous** in Robot State. When the robot stops, read `Path ended` in the VS Code terminal.',
        'In `Constants`, set `LEFT_SIDE_STRENGTH` to `0.9`. Run it again and read the number.',
        'Now also set `USE_FEEDBACK` to `false`. Run it again and read the number.',
      ],
      done: 'you have three end errors and can say what feedback did.',
      notes: '(6 min) Mentors, set this up first. In a copy of the examples project, set includeDesktopSupport to true and make Robot.java create frc.robot.deck10.RobotContainer. Students edit only Constants.java. This uses PathPlanner on a simulated KitBot with sensors added, and the path is built in code, so no app is needed. We got about 0.01, then 0.01, then 0.56 meters. If TargetPose appears on the far side of the field, open the FMS window and set Alliance Station to Blue 1. Done early? Change the end point in Constants, and watch the curve change.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'A follower is Deck 6 with a moving setpoint: feedforward from a plan, feedback on pose error.',
        'No encoders and gyro means no path following, so start with a timed auto.',
        'PathPlanner draws paths, Choreo solves them, BLine chases targets, and WPILib gives you the parts.',
        'For most young teams: timed auto, then PathPlanner, then Choreo when speed is your limit.',
      ],
      notes: '(30 sec) Read these back, and ask for a hand if anyone is unsure about one. The first one is the important one: these libraries are not magic, they are the control loop you already know, running on a moving setpoint. Take the next step your robot is ready for.',
    }),

    L.links({
      id: 'links', title: 'Official docs',
      items: [
        { label: 'PathPlanner', url: 'https://pathplanner.dev/home.html', short: 'pathplanner.dev' },
        { label: 'Choreo', url: 'https://choreo.autos/', short: 'choreo.autos' },
        { label: 'BLine', url: 'https://docs.bline.run/', short: 'docs.bline.run' },
        { label: 'WPILib trajectories', url: 'https://docs.wpilib.org/en/stable/docs/software/pathplanning/trajectory-tutorial/index.html', short: 'docs.wpilib.org: Trajectory Tutorial' },
      ],
      notes: '(30 sec) Point your phone at these. Each one is the official docs for its library. The WPILib link is the trajectory tutorial, which walks through characterizing a drivetrain and following a path from start to finish, so it is useful even if you end up with PathPlanner. Install libraries from the WPILib Dependency Manager in VS Code, the panel behind the WPILib logo, rather than from links in a forum post or a tutorial. It offers the versions made for this season.',
    }),
  ],
};
