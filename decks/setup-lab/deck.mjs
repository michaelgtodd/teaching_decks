// Setup lab: installing the tools and setting up a robot for the first time.
// A hands-on lab in small groups, one job at a time, with a QR code to the official page for each job.
// Mentor prep is in MENTOR-PREP.md. Claims are sourced in SOURCES.md.
import * as L from '../../template/layouts.mjs';

const WPI = 'https://docs.wpilib.org/en/stable/docs';
const Z2R = `${WPI}/zero-to-robot`;
const VH = 'https://frc-radio.vivid-hosting.net';
const REV = 'https://docs.revrobotics.com/rev-hardware-client-2';
const J1 = 'Job 1: install WPILib';
const J2 = 'Job 2: install Game Tools';
const J3 = 'Job 3: image the roboRIO';
const J4 = 'Job 4: program the radios';
const J5 = 'Job 5: set up the motor controllers';

export default {
  no: 0, label: 'Setup lab', short: 'Install and robot setup', title: 'Setup lab: install the tools and set up a robot',
  description: 'A hands-on lab: install WPILib and the Game Tools, then image the roboRIO, program the radios and set up the motor controllers.',
  slides: [
    L.cover({
      title: 'Setup lab: tools and robot',
      subtitle: 'One job at a time, with a mentor beside you',
      notes: 'This is a lab, not a talk. Do not present it from start to finish. Each group takes one job, works through only those slides at its own pace, and has a mentor beside it. Jobs 1 and 2 are for laptops, and they come before Deck 1. Jobs 3 to 5 set up the robot. They make more sense after Deck 2, when a CAN ID means something to the students.',
    }),

    L.table({
      id: 'jobs', eyebrow: 'How this lab works', title: 'Five jobs, one at a time',
      columns: ['Job', 'What it sets up', 'Rough time'], widths: [40, 34, 26], fontSize: 28,
      rows: [
        ['1. Install WPILib', 'Each laptop', '20 to 40 min'],
        ['2. Install Game Tools', 'Each laptop', '30 to 60 min'],
        ['3. Image the roboRIO', 'The robot computer', '20 to 30 min'],
        ['4. Program the radios', 'Two radios', '30 to 45 min'],
        ['5. Set up the motor controllers', 'Six SPARK MAX', '45 to 60 min'],
      ],
      caption: 'Times are estimates. Pick one job and ignore the rest of the slides.',
      notes: 'Choose a job and stay on it. You do not need to know anything about the other jobs today. These times are estimates, not measurements, so time your first run and adjust. The six SPARK MAX is the KitBot count. Downloads are the slowest part on shop Wi-Fi, so use the USB stick from the prep list if you have one.',
    }),

    L.steps({
      id: 'get-wpilib', eyebrow: J1, title: 'Get the WPILib installer',
      items: [
        { title: 'Download the Windows `.iso`', text: 'Version 2026.2.1, about 2.4 GB. Or use a mentor\'s USB stick.' },
        { title: 'Right-click it and choose **Mount**', text: 'An `.iso` is a file that acts like a disc.' },
        { title: 'Run `WPILibInstaller.exe`', text: 'If Windows warns you, click More info, then Run anyway.' },
      ],
      qr: { url: `${Z2R}/step-2/wpilib-setup.html`, label: 'WPILib install guide', short: 'docs.wpilib.org: WPILib Installation Guide' },
      notes: 'WPILib is the toolkit for programming FRC robots. It comes with its own copy of VS Code, the app where you write code. You need 64-bit Windows 10 or 11. Arm laptops, like Snapdragon ones, are not supported. If the Mount option is missing, 7-Zip can extract the file. You do not need to remove older years, because each year installs to its own folder.',
    }),

    L.steps({
      id: 'run-wpilib', eyebrow: J1, title: 'Run the WPILib installer',
      items: [
        { title: 'Press **Start**, then choose **Everything**', text: 'That installs all the tools you will need.' },
        { title: 'Choose **Install for this User**', text: 'This needs no administrator password.' },
        { title: 'Choose **Download for this computer only**', text: 'From a USB stick, choose **Select existing VS Code archive**.' },
        { title: 'Press **Finish**, then open **2026 WPILib VS Code**', text: 'It is a separate copy. Your everyday VS Code is not touched.' },
      ],
      notes: 'The installer fetches VS Code separately, about 150 MB, unless you use the archive on the USB stick. If a kid asks why: licensing stops WPILib from bundling it. When the app opens, this job is done. Do not worry if it looks empty. You will make a project in Deck 1.',
    }),

    L.steps({
      id: 'game-tools', eyebrow: J2, title: 'Install the FRC Game Tools',
      items: [
        { title: 'Find FRC Game Tools 2026 on the NI site', text: 'The QR code goes to the guide. You log in with an NI account.' },
        { title: 'Click **Download**', text: 'From a USB stick, mount the `.iso` and run `install.exe`.' },
        { title: 'Click Yes and Next through the screens', text: 'Accept the license. On Fast Startup, change nothing and click Next.' },
        { title: 'Reboot if asked', text: 'Then find **FRC Driver Station** on the desktop.' },
      ],
      qr: { url: `${Z2R}/step-2/frc-game-tools.html`, label: 'Game Tools install guide', short: 'docs.wpilib.org: Installing the FRC Game Tools' },
      notes: 'Game Tools gives you Driver Station, the app that starts and stops the robot, and the Imaging Tool for job 3. A mentor should handle the NI login. If you are changing years, uninstall NI Software in Add or Remove Programs first. The installer may ask to update .NET Framework: follow the prompts, reboot, then run the installer again. Driver Station and the Imaging Tool run on Windows only.',
    }),

    L.cards({
      id: 'which-rio', eyebrow: J3, title: 'Find out which roboRIO you have',
      intro: 'Imaging installs the operating system on the robot computer. Do it once a year. First, look for a microSD card slot.',
      items: [
        { title: 'No card slot: roboRIO 1', text: 'Use the next slide, and skip the one after.' },
        { title: 'Card slot: roboRIO 2', text: 'Skip the next slide.' },
      ],
      notes: 'Think of setting up a new phone: the operating system goes on first. Here "image" has nothing to do with pictures. It means a copy of the operating system. You only need one of the next two slides, so ignore the other. Check that the roboRIO power connector is secure before you start. A mentor should confirm which roboRIO you have.',
    }),

    L.steps({
      id: 'image-rio1', eyebrow: J3, title: 'Image a roboRIO 1',
      items: [
        { title: 'Robot on, then connect the USB cable', text: 'The printer-style cable goes in the USB Device port.' },
        { title: 'Open the **roboRIO Imaging Tool**', text: 'Nothing found? Try Run as Administrator.' },
        { title: 'Click **Format Target**', text: 'Enter your team number, pick the latest image, click **Reformat**.' },
        { title: 'Wait 3 to 10 minutes', text: 'Click OK, then Close.' },
        { title: 'Press the **Reset** button', text: 'The roboRIO restarts with your team number.' },
      ],
      qr: { url: `${Z2R}/step-3/imaging-your-roborio.html`, label: 'roboRIO 1 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 1' },
      notes: 'Reformat wipes the roboRIO and installs a fresh copy, which is what we want. Always image over USB, never Ethernet. If imaging fails, try a different USB cable, turn off the firewall, or try another laptop. The official page lists more fixes. Mentors: the roboRIO firmware is a different thing from the image, and only a brand-new roboRIO needs it updated.',
    }),

    L.steps({
      id: 'image-rio2', eyebrow: J3, title: 'Image a roboRIO 2',
      items: [
        { title: 'Find the image file', text: 'In the Imaging Tool, click the SD button. Use the newest `FRC_roboRIO2` zip.' },
        { title: 'Put the card in a USB reader on your laptop', text: 'A card of 2 GB or more is recommended.' },
        { title: 'Write it with balenaEtcher or Raspberry Pi Imager', text: 'If Windows offers to format the card, say no.' },
        { title: 'Power off, insert the card, power on', text: 'A roboRIO 2 will not start without it.' },
        { title: 'Set the team number', text: 'Imaging Tool: **Edit Startup Settings**, Team Number, **Apply**.' },
      ],
      qr: { url: `${Z2R}/step-3/roborio2-imaging.html`, label: 'roboRIO 2 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 2' },
      notes: 'A roboRIO 2 starts from its microSD card, so we write the card on the laptop. The Imaging Tool only helps us find the file and set the team number. Formatting the card would erase the image, which is why you say no. Writing the card does not set a team number, so the last step is easy to miss. It can be slow: wait a few minutes, then restart the roboRIO.',
    }),

    L.steps({
      id: 'radio-connect', eyebrow: J4, title: 'Connect to the radio',
      items: [
        { title: 'Plug Ethernet into the port marked **DS**', text: 'The other end goes in your laptop.' },
        { title: 'Power the radio', text: 'Use the PoE adapter, which sends power down the cable, or 12 V.' },
        { title: 'Turn off your laptop\'s Wi-Fi', text: 'So the laptop only talks to the radio.' },
        { title: 'Open `http://radio.local/`', text: 'Will not load? Run the Vivid-Hosting Network Assistant Tool.' },
      ],
      qr: { url: `${VH}/overview/quick-start-guide`, label: 'VH-109 quick start', short: 'Vivid-Hosting: Quick Start Guide' },
      notes: 'The radio is how the robot talks to a laptop without wires. Our radio model is the VH-109. There is no program to install, because the radio serves its own web page, like a home router does. You need two radios: one goes on the robot, and one stays on a table as the access point. Do this job with one radio, then repeat it with the other.',
    }),

    L.steps({
      id: 'radio-update', eyebrow: J4, title: 'Update the radio firmware',
      items: [
        { title: 'Get firmware 2.0.1', text: 'A mentor picks the right file from the QR code\'s page.' },
        { title: 'Paste its SHA-256 key into the **Checksum** box', text: 'That code proves the file downloaded correctly.' },
        { title: 'Click **Upload**', text: 'Keep the power on for 2 to 3 minutes.' },
        { title: 'Wait for the **PWR** light to go solid', text: 'The **SYS** light then blinks slowly.' },
      ],
      qr: { url: `${VH}/overview/firmware-releases`, label: 'Radio firmware', short: 'Vivid-Hosting: Firmware Releases' },
      notes: 'Firmware is software that lives inside a device. Each file on the firmware page is for radios on a certain version, so a mentor picks it: radios on 1.2.x or newer use the file with FROM_1_2_X in its name. Do not turn the radio off during the update. A slowly blinking SYS light is normal here, because this radio has nothing to connect to yet.',
    }),

    L.steps({
      id: 'radio-modes', eyebrow: J4, title: 'Set up the two radios',
      items: [
        { title: 'First radio: choose **Robot Radio Mode**', text: 'Enter your team number and 6 GHz key, then click Configure.' },
        { title: 'Second radio: choose **Access Point Mode**', text: 'Use the same team number and key.' },
        { title: 'Keep the access point on wall power', text: 'It stays on a table, and never runs from a battery.' },
      ],
      notes: 'The 6 GHz key is the password the two radios share, so write it down. The robot radio goes on the robot. The access point plugs into your laptop, and it stands in for the field at home. Using a battery on the access point is not legal, and the radio turns its wireless off. At official events, radios are programmed at a table called the Radio Kiosk, so you do not need this page there.',
    }),

    L.steps({
      id: 'spark-update', eyebrow: J5, title: 'Update a SPARK MAX',
      items: [
        { title: 'Install **REV Hardware Client 2**', text: 'A new app. Do not use the old REV Hardware Client.' },
        { title: 'Turn the robot off', text: 'USB gives you all the power you need here.' },
        { title: 'Plug USB into one SPARK MAX', text: 'Only that one gets power, so you cannot change the wrong one.' },
        { title: 'Update the firmware', text: 'Pick the newest 26.x, even if a newer version is listed.' },
      ],
      qr: { url: REV, label: 'REV Hardware Client 2', short: 'docs.revrobotics.com: REV Hardware Client 2' },
      notes: 'A SPARK MAX is our motor controller: it feeds a motor the right amount of power. This course uses 2026 software, which needs 2026 firmware. If the app says Outdated, a mentor uses Recovery Mode, which erases the settings, so do that before the next slide. Teams using CTRE motor controllers do this job in Phoenix Tuner X instead.',
    }),

    L.steps({
      id: 'spark-settings', eyebrow: J5, title: 'Give each SPARK MAX its settings',
      items: [
        { title: 'Give it a CAN ID from 1 to 63', text: 'CAN is the wired network to the motors. The ID is its address.' },
        { title: 'Set the motor type', text: 'Read the motor: Brushed for CIM, REV NEO Brushless for NEO.' },
        { title: 'Click **Persist Parameters**', text: 'That saves the settings onto the SPARK MAX.' },
        { title: 'Label it with its ID, then do the next one', text: 'Every SPARK MAX gets a different ID.' },
        { title: 'Check that they all show up', text: 'Power on, USB in any one, then look under **CAN Bus**.' },
      ],
      notes: 'Think of the CAN ID as a house number: your code uses it to send a message to the right motor controller. Write every ID down, because your code needs the same numbers in Deck 2. Leave the power hub\'s ID at its default. Ask a mentor if you are unsure of the motor type, because brushed mode can ruin a NEO. It takes a while, but after the first one the rest go faster.',
    }),

    L.practice({
      id: 'write-it-down', title: 'Write it down and keep it with the robot',
      rule: 'Keep your team number, CAN IDs and 6 GHz key with the robot.',
      why: 'Put them on a card in the robot\'s toolbox. You will need them again when a part breaks at an event, and that is the worst time to guess.',
      notes: 'You have just done the slowest part of owning a robot, so well done. Every number you chose matters later. If a SPARK MAX dies at a competition, the spare needs the same CAN ID. Keep the card with the robot, not in someone\'s head. Mentors: before you call the robot ready, deploy a known-good program and check for three green lights in Driver Station.',
    }),

    L.table({
      id: 'wont-connect', eyebrow: 'If something goes wrong', title: 'Fix the most common connection failures',
      columns: ['What you see', 'Likely cause', 'Try this first'], widths: [31, 31, 38], fontSize: 24,
      rows: [
        ['Communications stays red', 'Team number mismatch, or Wi-Fi in the way', 'Match Driver Station Setup tab. Turn off other network adapters.'],
        ['Deploy cannot find the roboRIO', 'Firewall, or roboRIO team number not set', 'Turn off the firewall. Set the team number over USB.'],
        ['Robot Code stays red', 'Nothing deployed, or the code crashed', 'Deploy again and read RioLog. Reboot the roboRIO.'],
        ['Invalid RoboRIO Image Version', 'The image is too old for WPILib 2026', 'Re-image with 2026 Game Tools.'],
        ['Radio SYS light blinks slowly', 'Radio cannot reach the access point', 'Power the access point. Match team number and key.'],
      ],
      caption: 'Work from the wire outward: USB first, then Ethernet, then Wi-Fi.',
      notes: 'Do not guess. Change one thing at a time, starting closest to the robot. RioLog is the window that shows messages from your code. Over USB the roboRIO is at 172.22.11.2, so it is the best first test. Windows Firewall off is fine on the robot network, but turn it back on before you go online. Mentors, the deeper network steps are on the prep list.',
    }),

    L.recap({
      id: 'recap', title: 'What this lab sets up',
      items: [
        'Laptops with WPILib and the FRC Game Tools.',
        'A roboRIO with this year\'s operating system.',
        'Two radios with your team number.',
        'SPARK MAX controllers with 2026 firmware and their own CAN IDs.',
      ],
      next: 'Next: send your code to this robot.',
      notes: 'If you did one job today, that is a good day. Nobody needs to do all five. Check the job off on the board so the next group knows what is left. Imaging, radios and firmware take longer than one session, and that is normal.',
    }),

    L.links({
      id: 'links', intro: 'Point your phone camera at a code.',
      items: [
        { label: 'Zero to Robot', url: `${Z2R}/introduction.html`, short: 'docs.wpilib.org: Introduction' },
        { label: 'Robot wiring', url: `${Z2R}/step-1/intro-to-frc-robot-wiring.html`, short: 'docs.wpilib.org: Robot Wiring' },
        { label: 'Offline installs', url: `${Z2R}/step-2/offline-installation-preparations.html`, short: 'docs.wpilib.org: Offline Preparation' },
        { label: 'Status lights', url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, short: 'docs.wpilib.org: Status Light Reference' },
      ],
      notes: 'Zero to Robot is the full official walkthrough that this lab follows. Robot wiring goes with the electrical workshop. Offline installs lists everything for the USB stick. Status lights explains every light on the robot. Keep these bookmarked, and check them again after kickoff, because these pages move on to 2027 then.',
    }),
  ],
};
