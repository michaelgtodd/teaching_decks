// Deck 4: driving the KitBot in the WPILib simulator, viewed in AdvantageScope.
import * as L from '../../template/layouts.mjs';

const J = 'examples/src/main/java/frc/robot/deck4';

// Straight-line drivetrain model, computed rather than drawn. With equal volts on both sides this is
// LinearSystemId.createDrivetrainVelocitySystem reduced to one state, because the moment of inertia cancels:
//   dv/dt = (2 / m) * (C1 * v + C2 * volts)
// Constants: DCMotor.getCIM(2) and the DifferentialDrivetrainSim kitbot values, all at WPILib v2026.2.1.
const CIMS = 2, NOMINAL = 12;
const R = NOMINAL / (133 * CIMS);                                  // rOhms
const KV = ((5310 * 2 * Math.PI) / 60) / (NOMINAL - R * 2.7 * CIMS); // KvRadPerSecPerVolt
const KT = (2.42 * CIMS) / (133 * CIMS);                           // KtNMPerAmp
const GEAR = 8.45, WHEEL_RADIUS = 3 * 0.0254;                      // KitbotGearing.k8p45, KitbotWheelSize.kSixInch
const C1 = -(GEAR * GEAR) * KT / (KV * R * WHEEL_RADIUS * WHEEL_RADIUS);
const C2 = (GEAR * KT) / (R * WHEEL_RADIUS);
const FT_PER_M = 3.28084, KG_PER_LB = 0.45359237, STEP = 0.02;

// Full throttle from a standstill, stepped every 20 ms with RK4. Returns [seconds, ft/s] points.
function fullThrottle(pounds, seconds) {
  const mass = pounds * KG_PER_LB;
  const accel = (v) => (2 / mass) * (C1 * v + C2 * NOMINAL);
  const points = [[0, 0]];
  let v = 0;
  for (let i = 1; i <= Math.round(seconds / STEP); i++) {
    const k1 = accel(v), k2 = accel(v + (STEP / 2) * k1), k3 = accel(v + (STEP / 2) * k2), k4 = accel(v + STEP * k3);
    v += (STEP / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    points.push([i * STEP, v * FT_PER_M]);
  }
  return points;
}
const TOP_SPEED = ((-C2 * NOMINAL) / C1) * FT_PER_M; // ft/s, where acceleration reaches zero
const TOP = TOP_SPEED.toFixed(1);
const FIRST_KICK_G = ((2 / (60 * KG_PER_LB)) * C2 * NOMINAL / 9.80665).toFixed(0);

export default {
  no: 4, of: 7, short: 'Sim in AdvantageScope', title: 'Driving the KitBot in the WPILib simulator', minutes: 35,
  description: 'Hook up the WPILib simulator and drive the KitBot around a 2D field in AdvantageScope with no robot.',
  slides: [
    L.cover({ title: 'Drive the KitBot with no robot', subtitle: 'The WPILib simulator, a little physics, and AdvantageScope', minutes: 35,
      notes: "Welcome. Today you drive the KitBot you coded in Deck 2, and you don't need a robot, just your laptop. This takes about 35 minutes, and about eight of those are you driving. Have your Deck 2 project open in WPILib VS Code. If yours isn't finished, pair up with someone whose is, or ask a mentor for a copy." }),

    L.points({ id: 'outcomes', eyebrow: 'Outcomes', title: 'By the end of this deck you can', items: [
      'Explain what a simulator can and can\'t teach you.',
      'Add a small physics model to your Deck 2 drivetrain.',
      '**Drive the KitBot around a 2D field** with a controller or keyboard.',
      'Describe what the model calculates every 20 milliseconds.',
    ], notes: "Here's what you'll be able to do by the end. The big one is in bold: a robot moving on a 2D field with nothing but a laptop and a controller or keyboard. The first and last items are about understanding. A simulator is a tool, and you need to know when to trust it. Timing: one minute." }),

    L.compare({ id: 'why', eyebrow: 'Why simulate', title: 'What a simulator gives you, and what it leaves out',
      left: { label: 'What you get', tone: 'good', items: [
        '**No robot:** test code at home on a laptop.',
        '**No risk:** a wrong sign can\'t hit anything.',
        '**No waiting** for the mechanical team to finish.',
        '**Rough physics:** close enough to learn from.',
      ] },
      right: { label: 'What it leaves out', tone: 'bad', items: [
        '**Carpet:** the wheels never slip.',
        '**Wear:** gearboxes and belts stay perfect.',
        '**Battery sag:** our simulated battery stays at 12 V.',
        '**Walls:** the robot drives straight through them.',
      ] },
      notes: "Start with why. You can test code at home, a bad sign can't break anything, and programmers don't have to wait for the robot. Now be honest about the right column. There's no carpet, no wear, and a battery that stays at 12 volts. WPILib can add some of that, like BatterySim, but it doesn't come for free. A sim tests your logic and gives rough physics. If a kid asks whether it's useless, say no: it finds most sign mistakes before the robot touches the floor." }),

    L.diagram({ id: 'pipeline', eyebrow: 'The plan', title: 'One path from your stick to the field',
      nodes: [
        { id: 'stick', x: 128, y: 270, w: 300, h: 130, label: 'Stick or keys', sub: '`Joystick[0]`', tone: 'paper' },
        { id: 'cmd', x: 508, y: 270, w: 300, h: 130, label: 'Your command', sub: 'same as Deck 2', tone: 'ink' },
        { id: 'save', x: 888, y: 270, w: 300, h: 130, label: 'Save the outputs', sub: 'new code', tone: 'accent' },
        { id: 'spark', x: 1268, y: 270, w: 524, h: 130, label: 'SPARK MAX and CIMs', sub: 'real robot only', tone: 'ghost' },
        { id: 'note', x: 128, y: 560, w: 680, h: 130, label: 'In simulation, no motors are attached', sub: 'so a physics model stands in for them', tone: 'ghost' },
        { id: 'sim', x: 888, y: 560, w: 300, h: 130, label: 'DriveSim', sub: 'new code: the physics', tone: 'accent' },
        { id: 'pose', x: 1248, y: 560, w: 230, h: 130, label: 'SimPose', sub: 'new data', tone: 'accent' },
        { id: 'as', x: 1538, y: 560, w: 254, h: 130, label: 'AdvantageScope', sub: '2D Field tab', tone: 'blue' },
      ],
      edges: [
        { from: 'stick', to: 'cmd' }, { from: 'cmd', to: 'save' }, { from: 'save', to: 'spark' },
        { from: 'save', to: 'sim', fromSide: 'b', toSide: 't', label: 'saved outputs', lx: 1052, ly: 460, lw: 200 },
        { from: 'sim', to: 'pose' }, { from: 'pose', to: 'as' },
      ],
      caption: 'Schematic. A **pose** is where the robot is and which way it faces.',
      notes: "This is the whole plan, so keep it in mind during the code slides. Your stick goes into the same command as Deck 2. That output used to go only to the SPARK MAX controllers. Now we also save a copy. On a real robot the motors move. In simulation nothing is attached, so DriveSim works out what the robot would do and publishes a pose. AdvantageScope draws it. The orange boxes are everything we add today." }),

    L.codeNotes({ id: 'sim-model', eyebrow: 'Step 1: the model', title: 'Build a KitBot out of math', file: 'DriveSim.java',
      src: { file: `${J}/DriveSim.java`, region: 'sim' },
      callouts: [
        { line: [3, 4], title: 'Match the real KitBot', text: '2 CIMs per side, 8.45:1 gearing, 6 inch wheels.' },
        { line: [6, 7, 8], title: 'Publish the pose', text: 'NetworkTables carries it to AdvantageScope.' },
        { line: [11, 12], title: 'Step time forward', text: 'Give it volts, then move ahead 20 ms.' },
        { line: 13, title: 'Share the result', text: 'Each step sends the new pose.' },
      ],
      notes: "This is the model, and it's short. createKitbotSim builds a physics model of the kit drivetrain. We tell it two CIMs per side, 8.45 to 1 gearing and six inch wheels, the standard setup in AndyMark's AM14U6 guide. The null means no fake sensor noise. StructPublisher sends the pose the way AdvantageScope's docs recommend. step does the work: feed in volts, move time forward, publish. If a kid asks about Field2d: it works too, but struct data is what AdvantageScope asks for first." }),

    L.codeNotes({ id: 'capture', eyebrow: 'Step 2: the outputs', title: 'Save each output on its way to the motors', file: 'CANDriveSubsystem.java',
      src: { file: `${J}/CANDriveSubsystem.java`, region: 'capture' },
      flag2027: '`set()` becomes `setThrottle()`',
      callouts: [
        { line: [2, 3], title: 'Our own copy', text: 'A SPARK\'s applied output needs extra REV code to update in sim.' },
        { line: 6, title: 'Methods, not motors', text: '`DifferentialDrive` calls these with each output.' },
        { line: [10, 15], title: 'The robot is unchanged', text: 'The real motors get the same `set()` call.' },
      ],
      notes: "Deck 2 gave DifferentialDrive two motors. It has a second constructor that takes two methods, and the motor version just calls this one, so the robot behaves the same. Each method saves the output, then sends it on. Why not ask the SPARK? REV's docs say applied output needs extra sim code, and they don't cover brushed mode, which is what CIMs use. Saving it ourselves is simple and needs nothing from REV. Bonus: forward is positive on both sides, because the SPARK flips one side later." }),

    L.codeNotes({ id: 'sim-periodic', eyebrow: 'Step 3: the sim loop', title: 'Step the model in `simulationPeriodic()`', file: 'CANDriveSubsystem.java',
      src: { file: `${J}/CANDriveSubsystem.java`, region: 'simperiodic' },
      callouts: [
        { line: [2, 3], title: 'Sim only', text: 'On the roboRIO this stays null.' },
        { line: [5, 6], title: 'Called for you', text: 'The scheduler runs it every loop, only in sim.' },
        { line: [7, 8], title: 'Output to volts', text: 'Deck 2 set 12 V compensation, so 0.5 means 6 V.' },
        { line: 11, title: 'Stop when disabled', text: 'Without this, the robot keeps driving after you disable it.' },
      ],
      notes: "Every subsystem can have simulationPeriodic. The command scheduler calls it every loop, but only in simulation, so on the roboRIO this never runs. We turn output into volts: Deck 2 turned on voltage compensation at 12 volts, so 0.5 means 6 volts. Now the sneaky part. On a real robot, disabling stops the motors. Our saved numbers don't know that, and Motor Safety does nothing while disabled. Without this if statement, the sim robot keeps driving after you disable it. Test that yourself later." }),

    L.steps({ id: 'run', eyebrow: 'Run it', title: 'Start the simulator from VS Code', items: [
      { title: 'Check Desktop Support is on', text: 'In `build.gradle`: `includeDesktopSupport = true`.' },
      { title: 'Run `WPILib: Simulate Robot Code`', text: 'Press `Ctrl+Shift+P` and type it. Don\'t use the run button by the WPILib logo.' },
      { title: 'Keep **Sim GUI** selected and press **Ok**', text: 'The Simulation GUI window opens.' },
      { title: 'Find the **Robot State** window', text: 'Its labels work like the Driver Station mode buttons.' },
    ], qr: { url: 'https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/introduction.html', label: 'WPILib simulation intro', short: 'docs.wpilib.org: Introduction to Robot Simulation' },
      notes: "Let's run it. Follow along. First check desktop support, because simulating needs it. If it says false, change it to true. Then open the command palette and run WPILib: Simulate Robot Code. Don't use the little run button beside the WPILib logo: the docs warn it doesn't set simulation up properly. Keep Sim GUI selected and press Ok. A new window appears. Find Robot State. Stay out of Teleoperated until the next slide. If the build fails, read the first error in the terminal." }),

    L.steps({ id: 'driver', eyebrow: 'Run it', title: 'Put a driver on `Joystick[0]`', items: [
      { title: 'Drag your device onto `Joystick[0]`', text: 'Drag from **System Joysticks** to **Joysticks**. No controller? Use **Keyboard 0**.' },
      { title: 'Xbox controller: check **Map gamepad**', text: 'It keeps the right stick on axis 4, like the Driver Station.' },
      { title: 'Keyboard: add a right stick', text: '**DS** menu, **Keyboard 0 Settings**. Under **Axes**, set **Count** to 5.' },
      { title: 'Keyboard: set the keys for **Axis 4**', text: '**Increase** is D, **Decrease** is A. W and S already drive.' },
      { title: 'Click **Teleoperated** in Robot State', text: 'Now push forward.' },
    ], qr: { url: 'https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/simulation-gui.html', label: 'Sim GUI docs', short: 'docs.wpilib.org: Simulation User Interface' },
      notes: "The code reads joystick 0, so something has to be there. Drag your device onto Joystick[0]. Xbox controller: make sure Map gamepad is ticked. Keyboard: Keyboard 0 comes with W and S, but our code reads turning from axis 4, and the keyboard starts with only three axes. Raise the count to 5, then set keys for Axis 4. Setting a key removes it from its old axis. Then click Teleoperated. If W works but turning doesn't, the console says joystick axis 4 isn't available. The docs QR has a picture of this setup." }),

    L.steps({ id: 'advantagescope', eyebrow: 'See it', title: 'Connect AdvantageScope and add the field', items: [
      { title: 'Open AdvantageScope', text: 'WPILib command palette: **Start Tool**, then **AdvantageScope**.' },
      { title: 'Connect to the simulator', text: '`File` > `Connect to Simulator` > `Default`, or `Ctrl+Shift+K`.' },
      { title: 'Add a **2D Field** tab', text: 'Use the plus button in the tab bar.' },
      { title: 'Pick the 2026 field', text: 'Use the **Field** list in the panel under the view.' },
      { title: 'Drag `SimPose` onto **Poses**', text: 'Find it in the sidebar. A robot appears near the blue end.' },
    ], qr: { url: 'https://docs.advantagescope.org/tab-reference/2d-field', label: '2D Field docs', short: 'docs.advantagescope.org: 2D Field' },
      flag2027: 'field origin moves to the center of the field',
      notes: "Keep the simulator running. Start AdvantageScope. File, Connect to Simulator, Default. You don't need an address, because it looks on your own computer. Open a 2D Field tab, pick the 2026 field, and drag SimPose from the sidebar onto Poses. Use the search box if you can't see it. If 2026 isn't in the list: season fields download in the background when AdvantageScope is online, and with no internet you can use Evergreen. Now put the windows side by side and click the Sim GUI before you drive." }),

    L.gotcha({ id: 'gotcha-still', title: 'The robot ignores you',
      symptom: 'You press keys or move the stick, and the robot sits still.',
      cause: 'Robot State isn\'t on **Teleoperated**, `Joystick[0]` is empty, or another window has keyboard focus.',
      fix: 'Click **Teleoperated**. Drag your device onto `Joystick[0]`. Click the Sim GUI window before you use the keys.',
      notes: "Everyone hits this one, so work down the list. Is Robot State on Teleoperated? Is something on Joystick[0]? Using a keyboard? Check which window you clicked last. Keys go to the window with focus, and the Sim GUI reads them through its own window. Click AdvantageScope and your keys stop working until you click back. Your code is fine. Side-by-side windows help. If driving works and only turning is dead, go back and set up Axis 4." }),

    L.gotcha({ id: 'gotcha-wrong-way', title: 'The robot drives the wrong way',
      symptom: 'You push forward and the robot backs up, spins, or crosses the screen the wrong way.',
      cause: '**Backs up:** a stick isn\'t negated. **Spins:** one side has a flipped sign. **Wrong way on screen:** check the view first, because heading 0 faces the red wall.',
      fix: 'Negate both sticks in `RobotContainer`. Pass both saved outputs to `setInputs` with no minus signs.',
      notes: "Three problems look like wrong way. Backing up means the stick sign is missing: pushing away reads negative, so Deck 2 negates it. Spinning means one side has the wrong sign. WPILib's docs say to negate an inverted right side, but we saved the output before the SPARK inverts it, so both go in unchanged. Last, check the view: AdvantageScope can rotate the field. Good news: a stick mistake you find here is one you won't meet on the real robot." }),

    L.gotcha({ id: 'gotcha-empty', title: 'AdvantageScope shows nothing',
      symptom: 'The simulator is running, but the field is empty or the title bar says "Searching".',
      cause: '"Searching" means it hasn\'t found the simulator. An empty field means the tab hasn\'t been told what to draw.',
      fix: 'Use `Connect to Simulator`, not `Connect to Robot`. Then drag `SimPose` onto **Poses**.',
      notes: "Check the title bar first. If it says Searching, AdvantageScope hasn't found the simulator. Make sure you chose Connect to Simulator and that the simulator is still running. It keeps retrying, so it will connect once the code is up. If it's connected and the field is empty, the tab doesn't know what to draw, so drag SimPose to Poses. If a kid scrolled the timeline and it looks frozen: scrolling left leaves live time, and scrolling all the way right comes back." }),

    L.practice({ id: 'practice', title: 'Keep sim code out of the real robot\'s path',
      rule: 'Keep sim code in `simulationPeriodic()` and `DriveSim`. Drive the same commands in sim and on the robot.',
      why: 'Your commands never ask whether they are in a simulator, so what you test is what runs on the robot. Code that never runs on the roboRIO can\'t break it at an event.',
      notes: "Look back at what we changed. The commands didn't change at all, and neither did RobotContainer. The physics lives in one class that's only built in simulation. That matters for two reasons. What you test is what runs on the robot, so passing in sim means something. And code that never runs on the roboRIO can't break it at an event. Avoid checks like 'if simulation' inside commands. If a command acts differently in sim, you've stopped testing your real code." }),

    L.diagram({ id: 'plant', eyebrow: 'Control theory', title: 'The plant model: what runs every 20 ms',
      nodes: [
        { id: 'volts', x: 128, y: 270, w: 226, h: 180, label: 'Volts', sub: 'from your code', tone: 'blue' },
        { id: 'motor', x: 416, y: 270, w: 226, h: 180, label: 'Motor', sub: 'volts become torque', tone: 'ink' },
        { id: 'gear', x: 704, y: 270, w: 226, h: 180, label: 'Gearing', sub: '8.45 times the torque', tone: 'ink' },
        { id: 'mass', x: 992, y: 270, w: 226, h: 180, label: 'Mass', sub: 'force becomes acceleration', tone: 'ink' },
        { id: 'speed', x: 1280, y: 270, w: 226, h: 180, label: 'Speed', sub: 'one for each side', tone: 'ink' },
        { id: 'pose', x: 1566, y: 270, w: 226, h: 180, label: 'Pose', sub: 'speed added up over time', tone: 'blue' },
        { id: 'back', x: 700, y: 590, w: 520, h: 130, label: 'Back-EMF', sub: 'a spinning motor pushes back against the battery', tone: 'accent' },
      ],
      edges: [
        { from: 'volts', to: 'motor' }, { from: 'motor', to: 'gear' }, { from: 'gear', to: 'mass' }, { from: 'mass', to: 'speed' }, { from: 'speed', to: 'pose' },
        { from: 'speed', to: 'back', fromSide: 'b', toSide: 'r', route: 'vh' },
        { from: 'back', to: 'motor', fromSide: 'l', toSide: 'b', route: 'hv' },
      ],
      caption: 'Schematic. Not in this model: friction, tire slip, current limits and battery sag.',
      notes: "Control theory calls the thing you're controlling the plant. A model is math that predicts it. Follow the chain. Volts go into the motor and become torque. Gearing multiplies torque by 8.45 and cuts speed by the same amount. Force on the robot's mass gives acceleration, and speed adds up into a pose. Now the loop at the bottom: a spinning motor acts like a generator and pushes back, which is called back-EMF. Faster motor, less push. The whole chain steps every 20 milliseconds." }),

    L.plot({ id: 'full-throttle', eyebrow: 'Control theory', title: 'Full throttle from a standstill', xLabel: 'Time (s)', yLabel: 'Speed (ft/s)',
      xDomain: [0, 1.5], yDomain: [0, 20], xTicks: [0, 0.5, 1, 1.5], yTicks: [0, 5, 10, 15, 20],
      refs: [{ y: TOP_SPEED, label: `Model top speed: ${TOP} ft/s` }, { y: 12.7, label: 'AndyMark estimate: 12.7 ft/s' }],
      series: [
        { name: '60 lb (createKitbotSim)', color: 'orange', points: fullThrottle(60, 1.5) },
        { name: '120 lb (what if)', color: 'blue', dash: true, points: fullThrottle(120, 1.5) },
      ],
      callouts: [
        { title: 'It flattens out', text: 'Back-EMF grows with speed, so the push fades.' },
        { title: 'Mass changes the time', text: 'Double the mass, double the time. Same top speed.' },
        { title: `Why ${TOP}, not 12.7?`, text: 'The 12.7 assumes CIMs loaded down to 4100 rpm. This model has no friction.' },
      ],
      notes: `This was computed, not drawn: WPILib's drivetrain equation with DCMotor.getCIM(2) constants, 8.45 to 1, six inch wheels and 12 volts held steady, stepped every 20 ms. Speed rises fast, then flattens as back-EMF grows. You'll see that shape all over control theory. The model tops out at ${TOP} feet per second. AndyMark's 12.7 assumes CIMs at 4100 rpm, about 75 percent of free speed. The first step asks for about ${FIRST_KICK_G} g, which real tires and our 60 amp limit wouldn't allow. createKitbotSim assumes 60 pounds; 120 is a what-if.` }),

    L.exercise({ id: 'exercise', title: 'Drive a figure-8, then change the robot', minutes: 8, tasks: [
      'Drive a figure-8. Then time one full-stick trip across the field.',
      'In `DriveSim`, change `k8p45` to `k5p95` or `k12p75`. Time the same trip.',
      'Change it back. In `RobotContainer`, pass `this::slewedForward` to `driveArcade`.',
      'Slam the stick from stop to full. Watch how the start changes.',
    ], done: 'you have two trip times and can say what the limiter did.',
      notes: "Eight minutes, and mentors walk the room. Deck 2 scaled the stick to 0.7 and arcadeDrive squares that, so full stick is about 0.49, or about 8 feet per second. Time the same trip before changing anything. Gearing changes top speed: 5.95 is faster, 12.75 is slower. Then try the slew rate limiter, which limits how fast a number can change, so it softens a hard start. Done early? Ask what they'd expect on a real robot, and why." }),

    L.change2027({ id: 'change', items: [
      { now: 'edu.wpi.first packages', next: 'org.wpilib packages' },
      { now: 'Motor set()', next: 'Motor setThrottle()' },
      { now: 'AdvantageScope field origin at the blue wall corner', next: 'Default origin at the center of the field' },
      { now: 'Java 17 on the roboRIO', next: 'Java 25 on Systemcore' },
    ], note: 'Alpha notes that may change. Everything in this deck is right for 2026.',
      notes: "Quick heads-up, not homework. Everything you learned today is right for 2026 robots. These are alpha notes for 2027, so they may change. Packages get new names, motor set becomes setThrottle, and Java moves to version 25 on the new Systemcore controller. AdvantageScope's 2027 versions default to a field origin at the center, so a start pose like ours would need new numbers. Don't write any 2027 code this season." }),

    L.recap({ id: 'recap', items: [
      'A simulator tests your logic and rough physics, not carpet, wear or battery sag.',
      '`DriveSim` turns saved outputs into a pose every 20 ms.',
      '`simulationPeriodic()` runs only in simulation, so the robot path stays clean.',
      'AdvantageScope draws `SimPose` on the 2D Field tab.',
    ], next: 'Deck 5: Elastic, the dashboard for your drivers.',
      notes: "Read these back, and ask for a hand if anyone isn't sure about one. The main idea: you added a few lines to a real drivetrain and got a robot you can drive anywhere, running your real commands. Keep this project, because you can test every new command this way, even with no robot around. Next is Deck 5, on Elastic, the dashboard your drivers will use." }),

    L.links({ id: 'links', intro: 'Point your phone camera at a code.', items: [
      { label: 'Simulation intro', url: 'https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/introduction.html', short: 'docs.wpilib.org' },
      { label: 'Drivetrain sim tutorial', url: 'https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/drivesim-tutorial/index.html', short: 'docs.wpilib.org' },
      { label: 'AdvantageScope live sources', url: 'https://docs.advantagescope.org/overview/live-sources', short: 'docs.advantagescope.org' },
      { label: 'REVLib simulation', url: 'https://docs.revrobotics.com/revlib/spark/sim/simulation-getting-started', short: 'docs.revrobotics.com' },
    ], notes: "Point your phone at these. Left to right: WPILib's simulation intro, its step-by-step drivetrain simulation tutorial, AdvantageScope's guide to live connections, and REV's simulation docs for the SPARK features we skipped today. The WPILib tutorial goes further than we did, with simulated encoders and a gyro. That's a great next step once your robot has those sensors." }),
  ],
};
