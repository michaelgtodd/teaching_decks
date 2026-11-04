// Deck 1: a newcomer's first session, in two sittings. Laptops are already installed.
// Installing and setting up a robot live in decks/setup-lab. Mentor prep is in MENTOR-PREP.md.
import * as L from '../../template/layouts.mjs';

const WPI = 'https://docs.wpilib.org/en/stable/docs';
const Z2R = `${WPI}/zero-to-robot`;
const P1 = 'Part 1: meet the robot';
const P2 = 'Part 2: send your code';

export default {
  no: 1, short: 'Your first robot program', title: 'Your first robot program', minutes: 95,
  description: 'Meet the robot, get your laptop ready, send code to the robot and turn it on safely.',
  slides: [
    L.cover({
      title: 'Your first robot program',
      subtitle: 'Today your code reaches a real robot.',
      minutes: 95,
      notes: 'Welcome, everyone. You do not need any experience for today. We have one goal: by the end, code you made is running on a real robot. There are two parts, with a break between them. In part one you meet the robot and get your laptop ready. In part two your group sends code to the robot and turns it on safely. Mentors: part one takes about 45 minutes and part two about 50, so do not run them back to back. Timing: 1 minute.',
    }),

    L.demo({
      id: 'watch-it-move', title: 'Watch a robot move', section: 'Part 1: meet the robot and get your laptop ready.',
      show: [
        'A mentor drives the robot around the room.',
        'Every move comes from code that a person wrote.',
        'Today your code gets onto a robot. Next session, it drives.',
      ],
      notes: 'Start with the fun part. Drive the robot around for a minute, and let the students get close enough to hear it. Then stop and ask what they think is happening between the controller and the wheels. Take a few guesses. Nobody needs the right answer yet. The point is that a person wrote the code doing this, and they can too. Mentors: this needs the prepared robot from the prep list. Timing: 3 minutes.',
    }),

    L.cards({
      id: 'five-parts', eyebrow: P1, title: 'Find five parts on the robot',
      intro: 'The robot is off. Walk up to it and point to each part.',
      items: [
        { title: 'Battery', text: 'Gives the robot its power.' },
        { title: 'roboRIO', text: 'The computer on the robot. Your code runs here.' },
        { title: 'Radio', text: 'Lets the robot talk to a laptop without wires.' },
        { title: 'Motor controller', text: 'Feeds a motor the right amount of power.' },
        { title: 'Motor', text: 'Spins to turn the wheels.' },
      ],
      notes: 'Get everyone around the robot with the power off. Read one card at a time, and have someone point to that part before you move on. Touching is fine while it is off. Our motor controllers are called SPARK MAX, and you will hear that name a lot. Do not explain wiring here, because the electrical workshop covers it. If a kid asks what a word means, that is a great question, so stop and answer it. Timing: 6 minutes.',
    }),

    L.diagram({
      id: 'message-chain', eyebrow: P1, title: 'How a message reaches a wheel',
      caption: 'Today a USB cable takes the place of the radio.',
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
      notes: 'These are the same parts you just found, plus your laptop. Trace it with your finger, left to right. You ask for something on the laptop. The radio carries that message to the robot. The roboRIO runs your code, which decides what to do. The motor controller sets the power, and the motor turns the wheel. Today we use a USB cable in place of the radio, because a cable is simpler to get working. Timing: 3 minutes.',
    }),

    L.cards({
      id: 'two-apps', eyebrow: P1, title: 'Two apps do almost everything',
      intro: 'WPILib is the toolkit for programming FRC robots, and we write our code in the Java language.',
      items: [
        { title: 'VS Code', text: 'You write your code here, then send it to the robot.' },
        { title: 'Driver Station', text: 'You start and stop the robot here.' },
      ],
      notes: 'Only two apps today. VS Code is where code gets written. Driver Station is how you start and stop the robot, a bit like the key and the brake in a car. You will see the names WPILib and Java a lot. WPILib is a toolkit that does the hard parts of talking to the robot. Java is the language we write in. If a kid asks about other apps: we will meet those later. Timing: 2 minutes.',
    }),

    L.cards({
      id: 'three-words', eyebrow: P1, title: 'Three words you will use all day',
      items: [
        { title: 'Build', text: 'Your laptop checks your code and gets it ready.' },
        { title: 'Deploy', text: 'Your laptop sends the code to the robot.' },
        { title: 'Enable', text: 'You tell the robot it may run your code.' },
      ],
      notes: 'Think about an app on a phone. Build is finishing the app. Deploy is installing it on the phone. Enable is tapping it to start. They always go in that order. Say each word out loud together, because you will hear them all day. A robot that is not enabled will not move, even with code on it. That is a safety feature. Timing: 2 minutes.',
    }),

    L.steps({
      id: 'open-apps', eyebrow: P1, title: 'Open both apps on your laptop',
      items: [
        { title: 'Open **2026 WPILib VS Code**', text: 'Look for the desktop icon with 2026 in its name.' },
        { title: 'Open **FRC Driver Station**', text: 'Its icon is on the desktop too.' },
        { title: 'Cannot find one? Raise your hand', text: 'A mentor will sort it out. You did nothing wrong.' },
      ],
      qr: { url: `${Z2R}/step-2/`, label: 'Installing the software', short: 'docs.wpilib.org: Step 2, Installing Software' },
      notes: 'Hands on, and mentors walk the room. Everyone should have both apps open before we move on. If a laptop is missing something, send it to the help table and let that student share a neighbor\'s screen, so nobody falls behind. Do not start an install during this session, because it takes far too long. Driver Station needs Windows, so anyone on a Mac pairs up. Timing: 8 minutes.',
    }),

    L.gotcha({
      id: 'two-vs-codes', title: 'The WPILib commands are missing',
      symptom: 'You press `Ctrl+Shift+P`, type `WPILib`, and nothing shows up.',
      cause: 'You opened your everyday VS Code. WPILib comes with its own separate copy.',
      fix: 'Close it and open the one with 2026 in its name.',
      notes: 'This one catches a lot of people, so it is not your fault. If you already had VS Code on your laptop, you now have two copies. They look almost the same. Only the 2026 copy has the WPILib tools. Ctrl+Shift+P opens a search box for commands, and we will use it all day. Timing: 1 minute.',
    }),

    L.steps({
      id: 'make-project', eyebrow: P1, title: 'Make your first project',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Create a new project**.' },
        { title: 'Choose **Example**, **Java**, **Getting Started**', text: 'That is a small ready-made program.' },
        { title: 'Pick the folder on the board', text: 'Name your project and tick **Create a New Folder**.' },
        { title: 'Type the team number on the board', text: 'This is how your laptop finds the robot.' },
        { title: 'Click **Generate Project**, then open it', text: 'If asked whether you trust the authors, say yes.' },
      ],
      qr: { url: `${Z2R}/step-4/`, label: 'Program and run', short: 'docs.wpilib.org: Step 4, Programming your Robot' },
      notes: 'Go through this one step at a time, and wait for the room after each step. Write the team number and the folder on the board first. Use a plain folder, not OneDrive, because OneDrive gets in the way of the build. You are not writing code yet. This is a small program that someone wrote as an example, and you will send it to a robot. Mentors, walk the room. Timing: 10 minutes.',
    }),

    L.steps({
      id: 'build-it', eyebrow: P1, title: 'Build your project',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Build Robot Code**.' },
        { title: 'Wait', text: 'The first build takes a while. That is normal.' },
        { title: 'Look for **Build Successful**', text: 'It appears in the panel at the bottom of VS Code.' },
      ],
      notes: 'Remember the three words: this is build. Your laptop checks the code and gets it ready. No robot is needed for this step. Lots of text will scroll past, and you do not need to read it. You only need the words Build Successful at the end. If you see red text instead, raise your hand. Mentors, give each laptop time to finish before moving on, because every student can win this one. Timing: 6 minutes.',
    }),

    L.statement({
      id: 'laptop-ready', text: 'Your laptop is ready.',
      sub: 'You made a project and built it. That is the end of part one. Take a break.',
      notes: 'Make this a real win. Every laptop in the room should have reached Build Successful. Say well done and stop here. Part two needs a robot and small groups, and it works best in a fresh sitting. Timing: 1 minute.',
    }),

    L.steps({
      id: 'cable-first', eyebrow: P2, title: 'Connect with a cable first', section: 'Part 2: send your code to the robot, in groups of 3 or 4.',
      items: [
        { title: 'A mentor turns the robot on', text: 'Stay clear of the wheels from now on.' },
        { title: 'Plug the USB cable into the robot', text: 'A mentor will show you the port.' },
        { title: 'Plug in your game controller', text: 'It goes in your laptop.' },
      ],
      notes: 'Welcome back. Split into groups of 3 or 4, with one laptop per group and a mentor nearby. Each group gets a turn at the robot. We start on a cable because it takes the radio out of the picture: if something goes wrong, there is less to check. Once it works on a cable, Wi-Fi is the easy part. Robot on means the rules change, so keep hands off the wheels. Timing: 3 minutes.',
    }),

    L.steps({
      id: 'deploy', eyebrow: P2, title: 'Send your code to the robot',
      items: [
        { title: 'Press `Ctrl+Shift+P`, then type `WPILib`', text: 'Choose **Deploy Robot Code**.' },
        { title: 'Wait for **Build Successful**', text: 'Your laptop builds, then sends the code.' },
        { title: 'Leave the robot on until it finishes', text: 'Then your code is on the robot.' },
      ],
      notes: 'This is the second word: deploy. Your laptop builds the code again and sends it down the cable to the roboRIO. This is the moment your code reaches a real robot, so point that out. Nobody turns the robot off during a deploy, because that can damage the software on the roboRIO. If it fails, raise your hand and a mentor will help. Timing: 4 minutes.',
    }),

    L.cards({
      id: 'three-lights', eyebrow: P2, title: 'Three green lights mean it worked',
      intro: 'In Driver Station, open the **Setup** tab, type your team number and press Enter.',
      items: [
        { title: 'Communications', text: 'Your laptop can reach the robot.' },
        { title: 'Robot Code', text: 'Your program is running on the robot.' },
        { title: 'Joysticks', text: 'Your game controller is plugged in.' },
      ],
      notes: 'Driver Station needs your team number too, so it knows which robot to look for. Then look at the three lights in the middle of the window. Each one answers a question. Can the laptop reach the robot? Is the program running? Is a controller plugged in? Green means yes. Show the room where the lights are on a real screen. A red light does not mean you broke anything. The next slide says what to do. Timing: 4 minutes.',
    }),

    L.steps({
      id: 'red-light', eyebrow: P2, title: 'If a light is red',
      items: [
        { title: '**Communications** is red', text: 'Check the cable, then ask a mentor.' },
        { title: '**Robot Code** is red', text: 'Deploy again.' },
        { title: '**Joysticks** is red', text: 'Plug in the controller and press `F1`.' },
      ],
      qr: { url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, label: 'Status lights', short: 'docs.wpilib.org: Status Light Reference' },
      notes: 'Everyone gets a red light sooner or later. Asking a mentor counts as a step, and it is a good one. Fix the top one first, because the robot code light cannot go green if the laptop cannot reach the robot. F1 tells Driver Station to look for controllers again. Mentors, the deeper network fixes are on your prep list. Timing: 2 minutes.',
    }),

    L.practice({
      id: 'stop-keys', title: 'Learn the stop keys first',
      rule: 'Find the stop keys before you ever enable a robot.',
      why: '`Enter` disables the robot. `Space` is the emergency stop. Put a finger on `Enter` and press it three times, so your hand knows where it is.',
      notes: 'We do this before anyone enables, and with the robot still disabled. Enter stops the robot and lets you start it again. Space is the emergency stop. It works even if you clicked on another window. After an emergency stop, the roboRIO has to reboot before the robot can run again, so use Enter unless it is an emergency. Good drivers build this habit on day one. Timing: 3 minutes.',
    }),

    L.exercise({
      id: 'turn-it-on', title: 'Turn the robot on safely', minutes: 15,
      tasks: [
        'A mentor checks: wheels off the ground, hands clear.',
        'One person sits at the laptop. Everyone else stands back and watches the light.',
        'Choose **Teleoperated**, say "enabling" out loud, then click **Enable**.',
        'Watch the robot signal light blink, then press `Enter`.',
        'Swap, so everyone gets a turn.',
      ],
      done: 'The light blinks when enabled and goes solid after `Enter`. Nothing spins today, and that is correct.',
      notes: 'Before anyone enables, point to the robot signal light. Then say this: nothing will spin today, and that is correct. This practice code is not set up for our motors. The win is the blinking light, because it means your robot is listening to your laptop. Teleoperated means driver control. Saying enabling out loud warns everyone nearby. Use this checklist every time, even when nothing should move, because old code may still be on the robot. Timing: 15 minutes.',
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
      notes: 'Now that everyone has turned on a robot, here is what it was doing while that light blinked. Driving a car works the same way. Your eyes see the road, you decide, your hands move the wheel, the car moves, and you look again. Your robot does that loop 50 times every second. This idea is called control theory, and we will come back to it. Timing: 3 minutes.',
    }),

    L.recap({
      id: 'recap', title: 'What you did today',
      items: [
        'You opened WPILib VS Code.',
        'You made and built a project.',
        'You sent code to a robot.',
        'You read the three lights.',
        'You started and stopped a robot safely.',
      ],
      next: 'Next session, Deck 2 makes the robot drive.',
      notes: 'Read these out, because they are all things the students really did. That is a lot for a first day, so tell them so. Next session we write code that makes the robot drive. Timing: 1 minute.',
    }),

    L.links({
      id: 'links', intro: 'Point your phone camera at a code.',
      items: [
        { label: 'Zero to Robot', url: `${Z2R}/introduction.html`, short: 'docs.wpilib.org: Introduction' },
        { label: 'Robot wiring', url: `${Z2R}/step-1/intro-to-frc-robot-wiring.html`, short: 'docs.wpilib.org: Robot Wiring' },
        { label: 'Driver Station', url: `${WPI}/software/driverstation/driver-station.html`, short: 'docs.wpilib.org: Driver Station' },
        { label: 'Status lights', url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, short: 'docs.wpilib.org: Status Light Reference' },
      ],
      notes: 'Leave this up while people pack away. Zero to Robot is the full official walkthrough. Robot wiring goes with the electrical workshop. The Driver Station page explains every button in that app. Status lights explains every light on the robot, and it is the page to open when something blinks and you do not know why. Timing: 1 minute.',
    }),
  ],
};
