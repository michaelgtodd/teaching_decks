// Deck 1: a newcomer's first program. Laptops are already installed.
// Installing and setting up a robot live in decks/setup-lab.
import * as L from '../../template/layouts.mjs';

const WPI = 'https://docs.wpilib.org/en/stable/docs';
const Z2R = `${WPI}/zero-to-robot`;
const P1 = 'Part 1: meet the robot';
const P2 = 'Part 2: send your code';

export default {
  no: 1, short: 'Your first robot program', title: 'Your first robot program',
  description: 'Meet the robot, get your laptop ready, send code to the robot and turn it on safely.',
  slides: [
    L.cover({
      title: 'Your first robot program',
      subtitle: 'Send code to a robot and turn it on safely',
      notes: 'There are two parts. Part one covers the robot and your laptop. Part two sends code to the robot and turns it on safely.',
    }),

    L.points({
      id: 'watch-it-move', eyebrow: P1, title: 'What moves a robot', section: 'Part 1: meet the robot and get your laptop ready.',
      items: [
        'Every move a robot makes comes from code that a person wrote.',
        'A driver\'s controller sends input to that code.',
        'This deck gets code onto a robot. Driving comes in Deck 2.',
      ],
      notes: 'Between the controller and the wheels is code. A driver moves a stick, the code reads it, and the code decides what the motors do.',
    }),

    L.cards({
      id: 'five-parts', eyebrow: P1, title: 'Five parts of a robot',
      items: [
        { title: 'Battery', text: 'Gives the robot its power.' },
        { title: 'roboRIO', text: 'The computer on the robot. Your code runs here.' },
        { title: 'Radio', text: 'Lets the robot talk to a laptop without wires.' },
        { title: 'Motor controller', text: 'Feeds a motor the right amount of power.' },
        { title: 'Motor', text: 'Spins to turn the wheels.' },
      ],
      notes: 'The motor controllers on a KitBot are called SPARK MAX.',
    }),

    L.diagram({
      id: 'message-chain', eyebrow: P1, title: 'How a message reaches a wheel',
      caption: 'In this deck a USB cable takes the place of the radio.',
      nodes: [
        { id: 'laptop', x: 128, y: 330, w: 260, h: 190, label: 'Laptop', sub: 'you ask for something', tone: 'ink' },
        { id: 'radio', x: 479, y: 330, w: 260, h: 190, label: 'Radio', sub: 'carries the message', tone: 'paper' },
        { id: 'rio', x: 830, y: 330, w: 260, h: 190, label: 'roboRIO', sub: 'your code decides', tone: 'accent' },
        { id: 'controller', x: 1181, y: 330, w: 260, h: 190, label: 'Motor controller', sub: 'sets the power', tone: 'blue' },
        { id: 'motor', x: 1532, y: 330, w: 260, h: 190, label: 'Motor', sub: 'turns the wheel', tone: 'paper' },
      ],
      edges: [
        { from: 'laptop', to: 'radio' }, { from: 'radio', to: 'rio' }, { from: 'rio', to: 'controller' }, { from: 'controller', to: 'motor' },
      ],
      notes: 'These are parts from the last slide, plus your laptop. You ask for something on the laptop. The radio carries that message to the robot. The roboRIO runs your code, which decides what to do. The motor controller sets the power, and the motor turns the wheel. A USB cable replaces the radio in this deck, because a cable is simpler to get working.',
    }),

    L.cards({
      id: 'two-apps', eyebrow: P1, title: 'Two apps do almost everything',
      intro: 'WPILib is the toolkit for programming FRC robots, and we write our code in the Java language.',
      items: [
        { title: 'VS Code', text: 'You write your code here, then send it to the robot.' },
        { title: 'Driver Station', text: 'You start and stop the robot here.' },
      ],
      notes: 'VS Code is where code gets written. Driver Station is how you start and stop the robot. WPILib is a toolkit that handles communication with the robot hardware. Java is the programming language.',
    }),

    L.cards({
      id: 'three-words', eyebrow: P1, title: 'Three words: build, deploy, enable',
      items: [
        { title: 'Build', text: 'Your laptop checks your code and gets it ready.' },
        { title: 'Deploy', text: 'Your laptop sends the code to the robot.' },
        { title: 'Enable', text: 'You tell the robot it may run your code.' },
      ],
      notes: 'They always go in that order. A robot that is not enabled will not move, even with code on it. That is a safety feature.',
    }),

    L.steps({
      id: 'open-apps', eyebrow: P1, title: 'Open both apps on your laptop',
      items: [
        { title: 'Open **2026 WPILib VS Code**', text: 'Look for the desktop icon with 2026 in its name.' },
        { title: 'Open **FRC Driver Station**', text: 'Its icon is on the desktop too.' },
      ],
      qr: { url: `${Z2R}/step-2/`, label: 'Installing the software', short: 'docs.wpilib.org: Step 2, Installing Software' },
      notes: 'Driver Station runs only on Windows. The QR code links to the install steps.',
    }),

    L.gotcha({
      id: 'two-vs-codes', title: 'The WPILib commands are missing',
      symptom: 'You press `Ctrl+Shift+P`, type `WPILib`, and nothing shows up.',
      cause: 'You opened your everyday VS Code. WPILib comes with its own separate copy.',
      fix: 'Close it and open the one with 2026 in its name.',
      notes: 'If you already had VS Code on your laptop, you now have two copies. They look almost the same. Only the 2026 copy has the WPILib tools. Ctrl+Shift+P opens a search box for commands.',
    }),

    L.steps({
      id: 'make-project', eyebrow: P1, title: 'Make your first project',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Create a new project**.' },
        { title: 'Choose **Example**, **Java**, **Getting Started**', text: 'That is a small ready-made program.' },
        { title: 'Pick a folder outside OneDrive', text: 'Name your project and tick **Create a New Folder**.' },
        { title: 'Type your team number', text: 'This is how your laptop finds the robot.' },
        { title: 'Click **Generate Project**, then open it', text: 'If asked whether you trust the authors, say yes.' },
      ],
      qr: { url: `${Z2R}/step-4/`, label: 'Program and run', short: 'docs.wpilib.org: Step 4, Programming your Robot' },
      notes: 'OneDrive gets in the way of the build, so use a plain folder. This is a small example program, and this deck sends it to a robot.',
    }),

    L.steps({
      id: 'build-it', eyebrow: P1, title: 'Build your project',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Build Robot Code**.' },
        { title: 'Wait for it to finish' },
        { title: 'Look for **Build Successful**', text: 'It appears in the panel at the bottom of VS Code.' },
      ],
      notes: 'This is the build step. Your laptop checks the code and gets it ready. No robot is needed. The output scrolls past, and the line that matters is Build Successful at the end. Red text means the build failed.',
    }),

    L.steps({
      id: 'cable-first', eyebrow: P2, title: 'Connect with a cable first', section: 'Part 2: send your code to the robot.',
      items: [
        { title: 'Turn the robot on', text: 'Stay clear of the wheels from now on.' },
        { title: 'Plug the USB cable into the robot', text: 'It connects your laptop to the roboRIO.' },
        { title: 'Plug in your game controller', text: 'It goes in your laptop.' },
      ],
      notes: 'A cable takes the radio out of the picture, so there is less to check if something goes wrong. Keep hands off the wheels while the robot is on.',
    }),

    L.steps({
      id: 'deploy', eyebrow: P2, title: 'Send your code to the robot',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Deploy Robot Code**.' },
        { title: 'Wait for **Build Successful**', text: 'Your laptop builds, then sends the code.' },
        { title: 'Leave the robot on until it finishes', text: 'Then your code is on the robot.' },
      ],
      notes: 'This is the deploy step. Your laptop builds the code again and sends it down the cable to the roboRIO. Do not turn the robot off during a deploy, because that can damage the software on the roboRIO.',
    }),

    L.cards({
      id: 'three-lights', eyebrow: P2, title: 'Three green lights mean it worked',
      intro: 'In Driver Station, open the **Setup** tab, type your team number and press Enter.',
      items: [
        { title: 'Communications', text: 'Your laptop can reach the robot.' },
        { title: 'Robot Code', text: 'Your program is running on the robot.' },
        { title: 'Joysticks', text: 'Your game controller is plugged in.' },
      ],
      notes: 'Driver Station needs your team number too, so it knows which robot to look for. The three lights are in the middle of the window. Green means that part is working. The next slide covers a red light.',
    }),

    L.steps({
      id: 'red-light', eyebrow: P2, title: 'If a light is red',
      items: [
        { title: '**Communications** is red', text: 'Check the cable, then the team number.' },
        { title: '**Robot Code** is red', text: 'Deploy again.' },
        { title: '**Joysticks** is red', text: 'Plug in the controller and press `F1`.' },
      ],
      qr: { url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, label: 'Status lights', short: 'docs.wpilib.org: Status Light Reference' },
      notes: 'Fix the top one first, because the robot code light cannot go green if the laptop cannot reach the robot. F1 tells Driver Station to look for controllers again.',
    }),

    L.practice({
      id: 'stop-keys', title: 'Learn the stop keys first',
      rule: 'Find the stop keys before you ever enable a robot.',
      why: '`Enter` disables the robot. `Space` is the emergency stop.',
      notes: 'Enter stops the robot and lets you start it again. Space is the emergency stop, and it works even if you clicked on another window. After an emergency stop, the roboRIO has to reboot before the robot can run again, so use Enter unless it is an emergency.',
    }),

    L.exercise({
      id: 'turn-it-on', title: 'Turn the robot on safely',
      tasks: [
        'Check: wheels off the ground, hands clear.',
        'One person at the laptop. Everyone else stands back.',
        'Choose **Teleoperated**, say "enabling" out loud, then click **Enable**.',
        'Watch the robot signal light blink, then press `Enter`.',
      ],
      done: 'The light blinks when enabled and goes solid after `Enter`. Nothing spins: this code is not set up for these motors.',
      notes: 'Nothing will spin, because this code is not set up for these motors. A blinking robot signal light means the robot is enabled. Teleoperated means driver control. Saying "enabling" warns everyone nearby. Use this checklist every time, because old code may still be on the robot.',
    }),

    L.diagram({
      id: 'sense-decide-act', eyebrow: 'Control theory', title: 'Your robot senses, decides and acts',
      caption: 'It does this 50 times a second.',
      nodes: [
        { id: 'sense', x: 128, y: 290, w: 420, h: 170, label: 'Sense', sub: 'Read the controller and sensors', tone: 'blue', size: 36 },
        { id: 'decide', x: 750, y: 290, w: 420, h: 170, label: 'Decide', sub: 'Your code picks what to do', tone: 'ink', size: 36 },
        { id: 'act', x: 1372, y: 290, w: 420, h: 170, label: 'Act', sub: 'Tell the motors what to do', tone: 'accent', size: 36 },
        { id: 'world', x: 750, y: 610, w: 420, h: 170, label: 'The robot moves', sub: 'Now there is more to sense', tone: 'paper' },
      ],
      edges: [
        { from: 'sense', to: 'decide' },
        { from: 'decide', to: 'act' },
        { from: 'act', to: 'world', fromSide: 'b', toSide: 'r', route: 'vh' },
        { from: 'world', to: 'sense', fromSide: 'l', toSide: 'b', route: 'hv', label: 'Next loop', lx: 360, ly: 648, lw: 240 },
      ],
      notes: 'While enabled, robot code runs this loop 50 times every second: read inputs, decide, set outputs. The robot moves, and the next loop reads the result. Control theory is the study of these loops.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'Opening WPILib VS Code.',
        'Making and building a project.',
        'Sending code to a robot.',
        'Reading the three lights.',
        'Starting and stopping a robot safely.',
      ],
      next: 'Deck 2 makes the robot drive.',
      notes: 'Deck 2 writes the code that makes the robot drive.',
    }),

    L.links({
      id: 'links',
      items: [
        { label: 'Zero to Robot', url: `${Z2R}/introduction.html`, short: 'docs.wpilib.org: Introduction' },
        { label: 'Robot wiring', url: `${Z2R}/step-1/intro-to-frc-robot-wiring.html`, short: 'docs.wpilib.org: Robot Wiring' },
        { label: 'Driver Station', url: `${WPI}/software/driverstation/driver-station.html`, short: 'docs.wpilib.org: Driver Station' },
        { label: 'Status lights', url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, short: 'docs.wpilib.org: Status Light Reference' },
      ],
      notes: 'Zero to Robot is the full official walkthrough. Robot wiring covers the electrical side. The Driver Station page explains every button in that app. Status lights explains every light on the robot.',
    }),
  ],
};
