// Deck 12: vision for FRC in 2026. Every claim here is listed with its source in SOURCES.md.
import { readFileSync } from 'node:fs';
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck12';
const DECK = 'decks/12-vision';
const WPI = 'https://docs.wpilib.org/en/stable/docs';
const REF = {
  apriltag: { label: 'What Are AprilTags?', url: `${WPI}/software/vision-processing/apriltag/apriltag-intro.html` },
  estimators: { label: 'Pose Estimators', url: `${WPI}/software/advanced-controls/state-space/state-space-pose-estimators.html` },
  strategies: { label: 'Strategies for Vision Programming', url: `${WPI}/software/vision-processing/introduction/strategies-for-vision-programming.html` },
};

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

// Counts from our read of 2026 team repos. evidence.json holds the raw counts and the method.
const E = JSON.parse(readFileSync(`${DECK}/evidence.json`, 'utf8'));
const pct = (o) => (o.repos_pct < 1 ? o.repos_pct.toFixed(1) : Math.round(o.repos_pct));
const n = (o) => `${o.repos} (${pct(o)}%)`;
const F = E.files, C = E.code;
const N = E.robot_projects.toLocaleString('en-US');

// How far one vision measurement moves the estimate. This is WPILib's own formula from
// PoseEstimator.setVisionMeasurementStdDevs at v2026.2.1: K = q / (q + sqrt(q * r)), with
// q = (odometry std dev)^2 and r = (vision std dev)^2, which is odometry / (odometry + vision).
// Robot standing still, vision reporting the true pose once every 20 ms loop, estimate 1 m off.
const ODOMETRY_STD = 0.02; // DifferentialDrivePoseEstimator default for x and y, meters
const gain = (vision) => ODOMETRY_STD / (ODOMETRY_STD + vision);
const gapAfter = (vision, seconds) => (1 - gain(vision)) ** Math.round(seconds / 0.02);
const gapCurve = (vision) => Array.from({ length: 151 }, (_, i) => [i * 0.02, gapAfter(vision, i * 0.02)]);
const cm = (m) => Math.round(m * 100);

export default {
  no: 12, short: 'Vision', title: 'Vision: AprilTags and camera choices',
  description: 'What a camera does for an FRC robot in 2026, how WPILib fuses camera poses with odometry, what teams use, and how a young team can choose.',
  slides: [
    L.cover({
      title: 'Vision: AprilTags and camera choices',
      subtitle: 'What FRC teams use in 2026, and how to choose',
      notes: 'Vision means a camera on the robot, plus software that finds things in its images. This deck covers what vision does in 2026, how its results reach your code, the products teams use, what team code actually contains, and a recommendation. Facts were checked on November 6, 2026. Prices and stock change, so check them again before you buy.',
    }),

    L.lead({
      id: 'outcomes', eyebrow: 'Overview', title: 'What this deck covers',
      text: 'A camera that sees AprilTags can tell your robot where it is on the field. This deck covers how that works, what teams use, and how to choose.',
      points: [
        'What vision does on an FRC robot.',
        'How WPILib combines camera poses with odometry.',
        'Limelight, PhotonVision, QuestNav and WPILib compared.',
        'What 2026 team code uses, and a recommendation.',
      ],
      notes: 'This deck builds on Deck 10. There, odometry estimated the robot\'s pose from encoders and a gyro. A pose is a position on the field plus the direction the robot faces. Odometry drifts, because wheels slip. Vision corrects it. The deck then compares the products, counts what 2026 team repositories contain, and ends with a recommendation and an exercise in the simulator.',
    }),

    L.figure({
      id: 'apriltags', eyebrow: 'AprilTags', title: 'An AprilTag is a printed square with an ID',
      src: 'images/apriltag-robots.jpg', alt: 'Small wheeled robots in a park, each with black and white AprilTags on its sides, and one large tag in the corner.', width: 790, height: 400, stack: true,
      credit: 'Image: WPILib documentation, CC BY 4.0.',
      items: [
        { title: 'An ID', text: 'The black and white squares encode a number.' },
        { title: 'A known place', text: 'Each 2026 field tag has a known pose. WPILib ships the layout.' },
        { title: 'Four corners', text: 'From the corners, a calibrated camera finds its own pose.' },
      ],
      ref: REF.apriltag,
      notes: 'AprilTags were made at the University of Michigan for robot localization. Since 2024, FIRST uses the 36h11 family: a 6 by 6 grid of bits inside a border. The printed tag body is 6.5 inches. WPILib\'s AprilTagFieldLayout class holds the pose of every tag on the field. A camera finds a tag, decodes its ID, and measures its four corners. With a calibrated camera, the corners give the camera\'s pose relative to the tag. Add the tag\'s known place on the field and where the camera sits on the robot, and you get the robot\'s pose on the field.',
    }),

    L.cards({
      id: 'jobs', eyebrow: 'What vision does', title: 'Three jobs a camera does on an FRC robot',
      items: [
        { icon: 'Globe', title: 'Find the robot\'s pose', text: 'Work out the robot\'s pose from AprilTags, and use it to correct odometry. The main use in 2026.' },
        { icon: 'Search', title: 'Aim at a tag', text: 'Turn until a tag sits in the middle of the image. No calibration needed.' },
        { icon: 'Star', title: 'Find game pieces', text: 'A neural network draws a box around each FUEL it sees. Needs extra hardware.' },
      ],
      ref: REF.apriltag,
      notes: 'The first job is the one most of this deck covers. The second is simpler: WPILib\'s docs call it 2D alignment, and it only needs the tag\'s position in the image. The third is object detection. A neural network is a program trained on example images. PhotonVision ships a model that detects FUEL, the 2026 game piece, and runs it on an Orange Pi 5 or a Rubik Pi 3. A Limelight 4 runs detection faster with a Hailo-8 accelerator, sold separately. In our count of team code, game-piece detection calls were rare, in about 2 percent of repos.',
    }),

    L.diagram({
      id: 'fusion', eyebrow: 'Control theory', title: 'How a camera pose corrects odometry',
      caption: '**Latency compensation:** each correction is applied at the moment the frame was taken, then carried forward.',
      nodes: [
        { id: 'cam', x: 128, y: 262, w: 330, h: 160, label: 'Camera frame', sub: 'taken at time t, arrives later', tone: 'blue' },
        { id: 'tags', x: 560, y: 262, w: 330, h: 160, label: 'Pose from tags', sub: 'where the robot was at time t', tone: 'paper' },
        { id: 'gap', x: 992, y: 262, w: 330, h: 160, label: 'Gap at time t', sub: 'vision minus the estimate then', tone: 'ink' },
        { id: 'move', x: 1424, y: 262, w: 368, h: 160, label: 'Move part way', sub: 'by a fraction K of the gap', tone: 'accent' },
        { id: 'wheels', x: 128, y: 600, w: 330, h: 160, label: 'Wheels and gyro', sub: 'every 20 ms', tone: 'paper' },
        { id: 'hist', x: 992, y: 600, w: 330, h: 160, label: 'Pose history', sub: 'the last 1.5 seconds', tone: 'paper' },
        { id: 'now', x: 1424, y: 600, w: 368, h: 160, label: 'Estimate now', sub: 'getEstimatedPosition()', tone: 'paper' },
      ],
      edges: [
        { from: 'cam', to: 'tags' },
        { from: 'tags', to: 'gap' },
        { from: 'gap', to: 'move' },
        { from: 'wheels', to: 'hist', label: 'odometry', lx: 600, ly: 630, lw: 240 },
        { from: 'hist', to: 'gap', fromSide: 't', toSide: 'b', label: 'estimate at t', lx: 1170, ly: 490, lw: 230 },
        { from: 'hist', to: 'now', label: 'replay', lx: 1322, ly: 630, lw: 102 },
        { from: 'move', to: 'now', fromSide: 'b', toSide: 't', label: 'fix', lx: 1620, ly: 490, lw: 80 },
      ],
      ref: REF.estimators,
      notes: 'This is WPILib\'s pose estimator, from its source. Odometry runs every loop and the estimator keeps the last 1.5 seconds of poses. A camera frame arrives late: it took time to capture, process and send. So the estimator looks up where it thought the robot was at the moment the frame was taken, measures the gap to the vision pose, and moves only part of the way. Then it replays the odometry since that moment. This is why every vision pose comes with a timestamp. A measurement older than 1.5 seconds is ignored.',
    }),

    L.plot({
      id: 'trust', eyebrow: 'Control theory', title: 'How much one vision pose moves the estimate',
      alt: `Distance between the estimate and the true pose, starting at 1 m, over 3 seconds, with one vision pose every 20 ms. With vision standard deviation 0.1 m it reaches almost zero in about half a second. With 0.5 m it is ${cm(gapAfter(0.5, 1))} cm after 1 second. With 4 m it is still ${cm(gapAfter(4, 3))} cm after 3 seconds.`,
      xLabel: 'Time (s)', yLabel: 'Estimate\'s distance from the true pose (m)', xDomain: [0, 3], yDomain: [0, 1], xTicks: [0, 1, 2, 3], yTicks: [0, 0.25, 0.5, 0.75, 1],
      series: [
        { name: 'Vision std dev 0.1 m', color: 'orange', points: gapCurve(0.1) },
        { name: '0.5 m', color: 'blue', points: gapCurve(0.5) },
        { name: '4 m', color: 'green', points: gapCurve(4) },
      ],
      callouts: [
        { title: 'The fraction K', text: `K = odometry / (odometry + vision). With 0.02 m and 0.5 m, K is ${(100 * gain(0.5)).toFixed(1)}%.` },
        { title: '0.5 m: several tags', text: `${cm(gapAfter(0.5, 1))} cm left after 1 s, ${cm(gapAfter(0.5, 2))} cm after 2 s.` },
        { title: '4 m: one far tag', text: `Still ${cm(gapAfter(4, 3))} cm off after 3 s.` },
      ],
      ref: REF.estimators,
      notes: `This is computed from WPILib's formula, not simulated. A standard deviation says how spread out a measurement's noise is: bigger means trust it less. The estimator starts 1 meter off, the robot stands still, and a vision pose arrives every 20 ms. Each pose moves the estimate by K of the gap. K depends on both numbers: WPILib's default odometry value is 0.02 m, and you give the vision value with each pose. 0.5 and 4 are the multi-tag and one-tag values in PhotonVision's example. Small numbers snap the estimate to vision, noise included. Big ones barely move it.`,
    }),

    L.table({
      id: 'evidence', eyebrow: 'Evidence', title: `What ${N} team repos from 2026 actually contain`,
      columns: ['Option', 'Its library is in the repo', 'The robot code uses it'], widths: [34, 33, 33], fontSize: 30,
      rows: [
        ['Limelight', `${n(F.llhelpers)}: LimelightHelpers`, n(C.ll)],
        ['PhotonVision', `${n(F.photon)}: PhotonLib`, n(C.pv_real)],
        ['QuestNav', n(F.quest), n(C.quest)],
        ['WPILib\'s detector on the roboRIO', 'Built in: nothing to count', n(C.rio_apriltag)],
        ['No camera code at all', 'Not counted', n(C.none)],
      ],
      caption: `Our count, Nov 2026, and rough: a random ${E.sample.size.toLocaleString('en-US')} public repos found by code search, ${N} of them 2026 Java robot projects. It shows code, not what ran at events.`,
      notes: `We read the files of ${N} public Java robot projects from the 2026 season. In the code, Limelight and PhotonVision are about even, and ${pct(C.none)} percent have no camera code. PhotonLib is in far more repos than use it, because templates include it. AdvantageKit's vision template runs Limelight on the robot and PhotonVision only in simulation. ${C.pv_sim_only.repos} repos use PhotonVision only that way. ${C.pv_real_and_ll.repos} repos use both. Private repos are missing, and template code still counts. We found no 2026 poll with results.`,
    }),

    L.table({
      id: 'options', eyebrow: 'Side by side', title: 'Four ways to see AprilTags in 2026', fontSize: 26,
      columns: ['', 'Limelight 4', 'PhotonVision', 'QuestNav', 'WPILib on roboRIO'], widths: [15, 22, 24, 21, 18],
      rows: [
        ['You buy', 'One camera with a computer inside', 'A coprocessor and USB cameras', 'A Meta Quest 3S, an Ethernet adapter, a mount', 'A USB camera'],
        ['Prices we confirmed', '$449, sold out on Nov 6', 'Software free. Hardware not priced here', 'Headset $349.99', 'No extra computer'],
        ['It finds', 'Tags, and game pieces', 'Tags, and game pieces on some boards', 'Its own motion, not tags', 'Tags'],
        ['Code', 'LimelightHelpers: one file you copy', 'PhotonLib vendordep', 'QuestNav vendordep, by URL', 'Built into WPILib'],
        ['Simulation', 'None in its docs', 'Simulates the camera in Java', 'Needs the real headset', 'None we found'],
      ],
      caption: 'WPILib\'s docs warn that vision on the roboRIO can slow down your robot program.',
      notes: 'A coprocessor is a small extra computer on the robot, such as an Orange Pi 5. PhotonVision\'s docs list it and the Raspberry Pi 5, with OV9281 cameras for AprilTags. We could not confirm their prices on a vendor page, so none are shown. Limelight 4 detects game pieces with its CPU, or faster with a Hailo-8 add-on. PhotonVision detects them on an Orange Pi 5 or Rubik Pi 3. QuestNav uses the headset\'s own tracking, which drifts, so you reset it at a known spot. Its makers say it tracks more steadily than other options. That is their claim.',
    }),

    L.table({
      id: 'limelights', eyebrow: 'Limelight models', title: 'The Limelight models listed in 2026', fontSize: 24,
      columns: ['Model', 'Camera sensor', 'Field of view', 'limelightvision.io, Nov 6'], widths: [18, 40, 20, 22],
      rows: [
        ['Limelight 4', 'Mono, global shutter, built-in IMU', '82° x 56.2°', '$449, sold out'],
        ['Limelight 3G', 'Mono, global shutter', '82° x 56.2°', '$400, sold out'],
        ['Limelight 3', 'Color, rolling shutter', '62.5° x 48.9°', '$400, sold out'],
        ['Limelight 3A', 'Color, rolling shutter. Made for FTC, USB only', '54.5° x 42°', '$189, sold out'],
      ],
      caption: 'A global shutter takes the whole image at once, so tags smear less while the robot moves.',
      notes: 'Limelight\'s hardware comparison page lists these models, and the store listed these prices on November 6, 2026, all marked sold out. Stock changes, so check before you plan around one. AndyMark also lists the Limelight 4, at $439 and out of stock. An IMU measures rotation, like a gyro. The Limelight 4 uses its built-in IMU for MegaTag2. PhotonVision\'s docs recommend global shutter cameras in all cases. The 3G and 4 use the OV9281 sensor, the same chip PhotonVision lists for AprilTags.',
    }),

    L.cards({
      id: 'more', eyebrow: 'Other options', title: 'Three more options teams use',
      items: [
        { icon: 'Tool', title: 'PhotonVision on a Limelight', text: 'PhotonVision publishes images for Limelight 2, 2+, 3, 3G and 4. Your code then uses PhotonLib.' },
        { icon: 'Activity', title: 'QuestNav', text: 'A Meta Quest headset tracks its own motion with cameras and an IMU. Reset it at a known spot.' },
        { icon: 'Code', title: 'WPILib on the roboRIO', text: '`AprilTagDetector` runs inside your robot program, on a USB camera. No coprocessor.' },
      ],
      notes: `Flashing means replacing a device's operating system. PhotonVision's install page has an image for each Limelight model, so a team with a Limelight can switch software. In our count, ${n(C.quest)} repos create a QuestNav object, and most of those also use a camera. Its docs say AprilTag tracking is experimental, on a separate branch. WPILib's own AprilTag detector was used in only ${C.rio_apriltag.repos} repos in our count. WPILib's docs warn that vision on the roboRIO can slow the robot program, so it suits learning more than matches.`,
    }),

    L.codeNotes({
      id: 'estimator', eyebrow: 'Pose estimator', title: 'Swap odometry for a pose estimator',
      src: { file: `${J}/CANDriveSubsystem.java`, region: 'estimator' }, file: 'deck12/CANDriveSubsystem.java',
      callouts: [
        { line: [3, 4, 5, 6], title: 'Same inputs as odometry', text: 'Kinematics, gyro, both wheel distances, and a starting pose.' },
        { line: [9, 10], title: 'A door for cameras', text: 'Any camera class calls this. The drivetrain does not care which camera.' },
        { line: 11, title: 'Pose, time, trust', text: 'A pose, when the frame was taken, and three standard deviations.' },
      ],
      ref: REF.estimators,
      notes: 'This is Deck 10\'s drivetrain with one change. DifferentialDriveOdometry becomes DifferentialDrivePoseEstimator, and periodic() still calls update() every loop with the gyro and both wheel distances. WPILib\'s docs call the estimators drop-in replacements for odometry. If you never add a vision pose, it behaves like odometry. The new method is the door that camera code uses. Keeping it on the drivetrain means the Limelight and PhotonVision classes in this deck both feed the same estimator, and you can switch between them without touching the drivetrain.',
    }),

    L.codeNotes({
      id: 'photonlib', eyebrow: 'PhotonLib v2026.3.4', title: 'PhotonVision: read every frame, then send a pose',
      src: { file: `${J}/PhotonVisionCamera.java`, region: 'periodic' }, file: 'deck12/PhotonVisionCamera.java',
      callouts: [
        { line: 2, title: 'Every new frame', text: 'All frames since the last loop, oldest first, so none are skipped.' },
        { line: [3, 5], title: 'All tags, then one', text: 'Multi-tag uses every visible tag. If it is empty, use the clearest single tag.' },
        { line: 13, title: 'How much to trust it', text: 'More for many close tags, less for one far tag, or skip it.' },
        { line: 15, title: 'When, not now', text: 'The time the frame was taken, already on the robot\'s clock.' },
      ],
      notes: 'This follows PhotonVision\'s own pose example. The PhotonPoseEstimator is built with two things: the field layout, and a Transform3d that says where the camera sits on the robot. Each method name is a strategy. PhotonVision\'s docs recommend coprocessor multi-tag for all teams, with a single-tag fallback. Ambiguity means a tag that could be seen from two different places, as WPILib\'s AprilTag page explains, so the lowest-ambiguity tag is the clearest. Install PhotonLib from the WPILib Dependency Manager. Its version must match the PhotonVision version on your coprocessor.',
    }),

    L.figure({
      id: 'photon-ui', eyebrow: 'PhotonVision web UI', title: 'Multi-tag is a switch on the coprocessor',
      src: 'images/photonvision-multitag-ui.png', alt: 'The PhotonVision dashboard with two camera views of AprilTags, Processing Mode set to 3D, Do Multi-Target Estimation on, and a multi-tag pose table using tags 3 and 4.', width: 1900, height: 908, stack: true,
      credit: 'Screenshot: PhotonVision documentation, CC BY 4.0. It shows a 2024 field; the steps are the same.',
      items: [
        { title: 'Calibrate, then 3D', text: 'Set Processing Mode to 3D.' },
        { title: 'Turn it on', text: '**Do Multi-Target Estimation**, on the Output tab.' },
        { title: 'Check the result', text: 'A multi-tag pose table appears under Targets.' },
      ],
      notes: 'Calibrating means showing the camera a printed pattern so PhotonVision can measure its lens. Pose estimation needs it. Then set the pipeline to 3D and turn on multi-target estimation. The coprocessor also needs the right field layout: PhotonVision ships with the welded 2026 layout. Without multi-tag turned on here, the multi-tag method in your code returns nothing and the code falls back to one tag. You open this page in a browser on the robot network, at port 5800.',
    }),

    L.codeNotes({
      id: 'limelight', eyebrow: 'LimelightHelpers v1.14', title: 'Limelight: send the heading, get a MegaTag2 pose',
      src: { file: `${J}/LimelightCamera.java`, region: 'megatag2' }, file: 'deck12/LimelightCamera.java',
      callouts: [
        { line: [2, 3, 4], title: 'Heading first', text: 'MegaTag2 needs the robot\'s heading every loop.' },
        { line: [5, 6], title: 'Blue origin', text: 'Limelight says to always use the wpiBlue pose for FRC.' },
        { line: [7, 10], title: 'Skip bad frames', text: 'No data, no tags, or turning faster than 360° a second.' },
        { line: [13, 14, 15], title: 'Into the same door', text: 'Its own timestamp, and a huge heading number.' },
      ],
      notes: 'This follows the Java example on Limelight\'s MegaTag2 page. MegaTag2 assumes your code knows the heading, from a gyro, and uses it to give a good pose from even one tag. The 360 degrees per second check comes from that example. The huge third number means vision never changes the heading: the gyro keeps it. LimelightHelpers is one Java file you copy into your project from Limelight\'s GitHub releases. This version returns null when no Limelight is on the network, so check for null. Set the camera\'s position on the robot and upload the field map in the Limelight web UI.',
    }),

    L.code({
      id: 'sim', eyebrow: 'Simulation', title: 'PhotonLib simulates the camera in Java',
      src: { file: `${J}/PhotonVisionCamera.java`, region: 'sim' }, file: 'deck12/PhotonVisionCamera.java', highlight: [2, 3, 10, 14],
      notes: 'VisionSystemSim is a pretend field with every 2026 tag on it. PhotonCameraSim is a pretend camera with a resolution, field of view, frame rate and delay that you choose. Every loop, the sim is told where the robot really is, and it works out which tags the camera would see. Your real PhotonVision code then runs unchanged. That true pose comes from the drivetrain simulator in Deck 10, not from the estimate. PhotonVision\'s docs say the sim does not model camera brightness or thresholding. We did not find a simulator in Limelight\'s docs. QuestNav\'s simulation needs a real headset on the network.',
    }),

    L.compare({
      id: 'old-photonlib', eyebrow: 'Older tutorials', title: 'Older PhotonLib code uses a deprecated API',
      left: { label: 'Before 2026: deprecated for removal', tone: 'bad', code: 'new PhotonPoseEstimator(layout,\n    PoseStrategy\n        .MULTI_TAG_PNP_ON_COPROCESSOR,\n    robotToCamera);\n\nestimator.update(result);' },
      right: { label: '2026: two arguments, then a method', tone: 'good', code: 'new PhotonPoseEstimator(layout,\n    robotToCamera);\n\nestimator\n    .estimateCoprocMultiTagPose(result);' },
      notes: 'Most PhotonVision tutorials and many team repos were written before 2026. In PhotonLib 2026, the constructor that takes a PoseStrategy and the update method are marked deprecated for removal. Your code still builds, with warnings, but a later release can delete them. The 2026 way is the two-argument constructor, then calling the method for the strategy you want. Even PhotonVision\'s own multi-tag page still names the old strategy, so trust the Javadoc and the example code over older prose.',
    }),

    L.practice({
      id: 'practice', title: 'Trust a vision pose only as much as it deserves',
      rule: 'Scale x and y trust with how many tags and how far away. Make the heading number huge, so the gyro keeps the heading.',
      why: 'WPILib\'s docs say this for AprilTag poses. One far tag is noisy, and at full trust its noise becomes your pose.',
      code: region('Constants.java', 'stddevs'),
      ref: REF.estimators,
      notes: 'These are the starting values in this deck\'s code. The camera class multiplies them by one plus the distance squared over 30, as PhotonVision\'s example does, and ignores a single tag farther than 4 meters. PhotonVision\'s example calls its numbers fake values to tune on a real robot. Limelight\'s MegaTag2 example uses 0.7, 0.7 and a huge heading number. To tune, log the vision poses and the estimate, drive past tags, and see which values give a steady estimate that still corrects.',
    }),

    L.gotcha({
      id: 'gotcha-layout', title: 'The wrong 2026 field layout',
      symptom: 'Vision poses land away from where the robot really is, even with a good calibration.',
      cause: 'REBUILT has two field layouts, welded and AndyMark. WPILib\'s default and PhotonVision ship with welded.',
      fix: 'Use the layout for the field you are on, in your code and on the coprocessor.',
      code: 'AprilTagFieldLayout.loadField(\n    AprilTagFields.k2026RebuiltAndymark);',
      notes: 'PhotonVision\'s multi-tag page warns that differences between the layout and the real tag positions cause error in the pose. In WPILib 2026, AprilTagFields has k2026RebuiltWelded and k2026RebuiltAndymark, and the default field is welded. The layout matters in two places: the PhotonPoseEstimator in your code, and the field layout on the PhotonVision coprocessor for multi-tag. Limelight uses the field map you upload. Find out which field your event uses before you arrive.',
    }),

    L.gotcha({
      id: 'gotcha-time', title: 'A vision pose stamped with the time now',
      symptom: 'Vision corrections look right while the robot is still. While it drives, they pull the estimate backward.',
      cause: '`Timer.getFPGATimestamp()` was passed in place of the frame\'s timestamp, so the gap is measured at the wrong moment.',
      fix: 'Pass `est.timestampSeconds` from PhotonLib, or `mt2.timestampSeconds` from LimelightHelpers.',
      ref: REF.estimators,
      notes: 'The frame shows where the robot was when it was taken. Stamped with the time now, the estimator compares it with where the robot is now. When the robot is still, those are the same place. When it drives, the vision pose looks behind, so each correction pulls the estimate back. Both libraries give a timestamp on the robot\'s FPGA clock, which is what WPILib\'s estimator expects. PhotonLib syncs the clocks for you. LimelightHelpers subtracts the Limelight\'s reported latency from the time the data arrived.',
    }),

    L.diagram({
      id: 'choose', eyebrow: 'How to choose', title: 'Start here: our recommendation for a young team',
      nodes: [
        { id: 'odo', x: 128, y: 250, w: 400, h: 150, label: 'Odometry works?', sub: 'Encoders and a gyro, as in Deck 10', tone: 'ghost' },
        { id: 'buy', x: 650, y: 250, w: 440, h: 150, label: 'Can you get a Limelight 4?', sub: 'Budget and stock', tone: 'ghost' },
        { id: 'll', x: 1212, y: 250, w: 580, h: 150, label: 'Limelight 4 with MegaTag2', sub: 'One box: power and Ethernet. Least setup.', tone: 'accent' },
        { id: 'fix', x: 128, y: 530, w: 400, h: 150, label: 'Fix odometry first', sub: 'Vision corrects a pose. It needs one.', tone: 'ink' },
        { id: 'pv', x: 650, y: 530, w: 440, h: 150, label: 'PhotonVision', sub: 'Orange Pi 5 and an OV9281 camera', tone: 'blue' },
        { id: 'sim', x: 1212, y: 530, w: 580, h: 150, label: 'Either way: start in simulation', sub: 'PhotonLib\'s camera sim needs no hardware', tone: 'paper' },
        { id: 'later', x: 128, y: 770, w: 1664, h: 110, label: 'Later: a second camera, game-piece detection, or QuestNav', tone: 'ghost' },
      ],
      edges: [
        { from: 'odo', to: 'buy', label: 'yes', lx: 529, ly: 278, lw: 120 },
        { from: 'buy', to: 'll', label: 'yes', lx: 1091, ly: 278, lw: 120 },
        { from: 'odo', to: 'fix', fromSide: 'b', toSide: 't', label: 'no', lx: 340, ly: 440, lw: 80 },
        { from: 'buy', to: 'pv', fromSide: 'b', toSide: 't', label: 'no', lx: 882, ly: 440, lw: 80 },
      ],
      notes: `Stock KitBot: fix odometry first, because a camera pose corrects an estimate you already have. Then, if you can get a Limelight 4, it has the fewest parts and the least setup, and many teams use it. If not, PhotonVision is free software and equally common in our count, and simulation is built in. Before buying anything, learn the code in simulation. The drivetrain code is the same either way, so you can change cameras later. QuestNav is newer and less common, in ${pct(C.quest)} percent of repos.`,
    }),

    L.exercise({
      id: 'exercise', title: 'Watch a camera correct a wrong pose',
      tasks: [
        'In a copy of `examples/`, make `Robot.java` create `frc.robot.deck12.RobotContainer`. Run `WPILib: Simulate Robot Code`.',
        'In AdvantageScope, drag `SimPose` and `EstimatedPose` onto **Poses**. The estimate starts 1 m to the side.',
        'Enable **Teleoperated** and drive until the camera faces a tag.',
        'In `Constants`, set `USE_VISION` to `false`. Run it again and drive the same way.',
      ],
      done: 'with vision on, `EstimatedPose` closes the gap while a tag is in view. With it off, the gap stays.',
      notes: 'Setup: set includeDesktopSupport to true in build.gradle, as in Deck 10. PhotonLib is already in the vendordeps folder. The robot really starts at (2, 4) facing the red alliance, and the estimate believes (2, 5). The simulated camera sits 0.3 m forward and faces forward, so turn until tags are ahead of it. Drive with a keyboard joystick, as in Deck 4. Watch how fast the gap closes with many tags, and with one far tag. The trust slide explains the difference.',
    }),

    L.change2027({
      id: 'change',
      items: [
        { now: 'roboRIO, with vision on a separate device', next: 'Systemcore, made by Limelight, with an onboard IMU' },
        { now: 'PhotonLib v2026.3.4', next: 'PhotonVision has 2027 alpha releases' },
        { now: '`edu.wpi.first` packages in vision libraries', next: '`org.wpilib` packages, so each library needs a 2027 build' },
      ],
      note: 'All of it is alpha. Everything on the other slides is for 2026 and the roboRIO.',
      notes: 'WPILib\'s 2027 docs describe Systemcore as the Limelight Systemcore, built on a Raspberry Pi Compute Module 5, with an onboard IMU. How vision will run on or beside it is not settled yet. PhotonVision tagged v2027.0.0-alpha-2 in May 2026. Every library that uses WPILib classes needs a 2027 build because the packages move. Teach and build with 2026 tools until the kits ship.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'Vision finds the robot\'s pose from AprilTags, and WPILib\'s pose estimator uses it to correct odometry.',
        'Standard deviations set how far each pose moves the estimate. Timestamps place it in time.',
        `In 2026 team code, Limelight and PhotonVision are about even, and ${pct(C.none)}% have no camera code.`,
        'For a young team: odometry first, then a Limelight 4 or PhotonVision, learning in simulation first.',
      ],
      notes: 'Vision is a measurement that feeds the same estimator odometry does. The product you choose changes the setup and the cost, not the idea.',
    }),

    L.links({
      id: 'links', title: 'Official docs',
      items: [
        { label: 'PhotonVision', url: 'https://docs.photonvision.org/', short: 'docs.photonvision.org' },
        { label: 'Limelight', url: 'https://docs.limelightvision.io/', short: 'docs.limelightvision.io' },
        { label: 'QuestNav', url: 'https://questnav.gg/', short: 'questnav.gg' },
        { label: 'WPILib pose estimators', url: REF.estimators.url, short: 'docs.wpilib.org: Pose Estimators' },
      ],
      notes: 'Each one is the official docs for its product. The WPILib link is the pose estimator page, which explains standard deviations and has the advice on AprilTag poses. Install PhotonLib from the WPILib Dependency Manager in VS Code, and copy LimelightHelpers from Limelight\'s GitHub releases, rather than from a forum post or a tutorial.',
    }),
  ],
};
