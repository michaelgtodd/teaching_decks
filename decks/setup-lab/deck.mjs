// Setup lab: installing the tools and setting up a robot for the first time.
// A task list, then the steps for each task, with a QR code to the official page.
// Slides say what to do and nothing else: no time estimates, no reassurance, no advice on running the session.
// How to run it is in MENTOR-PREP.md. Claims are sourced in SOURCES.md.
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
  description: 'Install WPILib and the Game Tools, then image the roboRIO, program the radios and set up the motor controllers.',
  slides: [
    L.cover({
      title: 'Setup lab: tools and robot',
      subtitle: 'WPILib, Game Tools, roboRIO, radios and SPARK MAX',
    }),

    L.steps({
      id: 'jobs', eyebrow: 'Setup', title: 'What has to be done',
      items: [
        { title: 'Install WPILib', text: 'Each laptop.' },
        { title: 'Install the FRC Game Tools', text: 'Each laptop.' },
        { title: 'Image the roboRIO' },
        { title: 'Program the radios', text: 'Both radios.' },
        { title: 'Set up the motor controllers', text: 'Every SPARK MAX.' },
      ],
      notes: 'Jobs 1 and 2 are for laptops. Jobs 3 to 5 are for the robot. A KitBot has six SPARK MAX.',
    }),

    L.steps({
      id: 'get-wpilib', eyebrow: J1, title: 'Get the WPILib installer',
      items: [
        { title: 'Download the Windows `.iso`', text: 'Version 2026.2.1, from the link or the install USB stick.' },
        { title: 'Right-click it and choose **Mount**' },
        { title: 'Run `WPILibInstaller.exe`', text: 'If Windows warns you, click More info, then Run anyway.' },
      ],
      qr: { url: `${Z2R}/step-2/wpilib-setup.html`, label: 'WPILib install guide', short: 'docs.wpilib.org: WPILib Installation Guide' },
      notes: 'Requires 64-bit Windows 10 or 11. Arm laptops, like Snapdragon ones, are not supported. If Mount is missing, extract the file with 7-Zip. Older WPILib years can stay installed.',
    }),

    L.steps({
      id: 'run-wpilib', eyebrow: J1, title: 'Run the WPILib installer',
      items: [
        { title: 'Press **Start**, then choose **Everything**' },
        { title: 'Choose **Install for this User**' },
        { title: 'Choose **Download for this computer only**', text: 'From a USB stick, choose **Select existing VS Code archive**.' },
        { title: 'Press **Finish**, then open **2026 WPILib VS Code**' },
      ],
      notes: 'WPILib installs its own copy of VS Code, separate from any VS Code already on the laptop.',
    }),

    L.steps({
      id: 'game-tools', eyebrow: J2, title: 'Install the FRC Game Tools',
      items: [
        { title: 'Find FRC Game Tools 2026 on the NI site', text: 'Log in with an NI account.' },
        { title: 'Click **Download**', text: 'From a USB stick, mount the `.iso` and run `install.exe`.' },
        { title: 'Click Yes and Next through the screens', text: 'Accept the license. On Fast Startup, change nothing and click Next.' },
        { title: 'Reboot if asked', text: 'Then find **FRC Driver Station** on the desktop.' },
      ],
      qr: { url: `${Z2R}/step-2/frc-game-tools.html`, label: 'Game Tools install guide', short: 'docs.wpilib.org: Installing the FRC Game Tools' },
      notes: 'Game Tools includes Driver Station and the roboRIO Imaging Tool. Both run on Windows only. When changing years, uninstall NI Software in Add or Remove Programs first. If the installer asks to update .NET Framework, follow the prompts, reboot, then run the installer again.',
    }),

    L.cards({
      id: 'which-rio', eyebrow: J3, title: 'Find out which roboRIO you have',
      intro: 'Look for a microSD card slot.',
      items: [
        { title: 'No card slot: roboRIO 1', text: 'Use the next slide, and skip the one after.' },
        { title: 'Card slot: roboRIO 2', text: 'Skip the next slide.' },
      ],
      notes: 'Imaging installs the operating system on the roboRIO, once a year. Check that the roboRIO power connector is secure first.',
    }),

    L.steps({
      id: 'image-rio1', eyebrow: J3, title: 'Image a roboRIO 1',
      items: [
        { title: 'Robot on, then connect the USB cable', text: 'The printer-style cable goes in the USB Device port.' },
        { title: 'Open the **roboRIO Imaging Tool**', text: 'Nothing found? Try Run as Administrator.' },
        { title: 'Click **Format Target**', text: 'Enter your team number, pick the latest image, click **Reformat**.' },
        { title: 'Wait for it to finish', text: 'Click OK, then Close.' },
        { title: 'Press the **Reset** button' },
      ],
      qr: { url: `${Z2R}/step-3/imaging-your-roborio.html`, label: 'roboRIO 1 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 1' },
      notes: 'Reformat wipes the roboRIO and installs a fresh image. Image over USB, never Ethernet. If imaging fails, try a different USB cable, turn off the firewall, or try another laptop. roboRIO firmware is separate from the image, and only a brand-new roboRIO needs it updated.',
    }),

    L.steps({
      id: 'image-rio2', eyebrow: J3, title: 'Image a roboRIO 2',
      items: [
        { title: 'Find the image file', text: 'In the Imaging Tool, click the SD button. Use the newest `FRC_roboRIO2` zip.' },
        { title: 'Put the card in a USB reader on your laptop', text: 'A card of 2 GB or more is recommended.' },
        { title: 'Write it with balenaEtcher or Raspberry Pi Imager', text: 'If Windows offers to format the card, say no.' },
        { title: 'Power off, insert the card, power on' },
        { title: 'Set the team number', text: 'Imaging Tool: **Edit Startup Settings**, Team Number, **Apply**.' },
      ],
      qr: { url: `${Z2R}/step-3/roborio2-imaging.html`, label: 'roboRIO 2 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 2' },
      notes: 'Writing the card does not set a team number. Setting the team number can hang. If it does, restart the roboRIO.',
    }),

    L.steps({
      id: 'radio-connect', eyebrow: J4, title: 'Connect to the radio',
      items: [
        { title: 'Plug Ethernet into the port marked **DS**', text: 'The other end goes in your laptop.' },
        { title: 'Power the radio', text: 'Use the PoE adapter or 12 V.' },
        { title: 'Turn off your laptop\'s Wi-Fi' },
        { title: 'Open `http://radio.local/`', text: 'Will not load? Run the Vivid-Hosting Network Assistant Tool.' },
      ],
      qr: { url: `${VH}/overview/quick-start-guide`, label: 'VH-109 quick start', short: 'Vivid-Hosting: Quick Start Guide' },
      notes: 'The radio model is the VH-109. There are two: one goes on the robot, and one is the access point.',
    }),

    L.steps({
      id: 'radio-update', eyebrow: J4, title: 'Update the radio firmware',
      items: [
        { title: 'Get firmware 2.0.1', text: 'Radios on 1.2.x or newer use the file with `FROM_1_2_X` in its name.' },
        { title: 'Paste its SHA-256 key into the **Checksum** box' },
        { title: 'Click **Upload**', text: 'Keep the power on until it finishes.' },
        { title: 'Wait for the **PWR** light to go solid', text: 'The **SYS** light then blinks slowly.' },
        { title: 'Repeat on the second radio' },
      ],
      qr: { url: `${VH}/overview/firmware-releases`, label: 'Radio firmware', short: 'Vivid-Hosting: Firmware Releases' },
      notes: 'Each file on the firmware page is for radios on a certain version. The SYS light blinks slowly here because the radio has nothing to connect to yet.',
    }),

    L.steps({
      id: 'radio-modes', eyebrow: J4, title: 'Set up the two radios',
      items: [
        { title: 'First radio: choose **Robot Radio Mode**', text: 'Enter your team number and 6 GHz key, then click Configure.' },
        { title: 'Second radio: choose **Access Point Mode**', text: 'Use the same team number and key.' },
        { title: 'Power the access point from the wall', text: 'Not from a battery.' },
        { title: 'Write down the 6 GHz key', text: 'Keep it with the robot.' },
      ],
      notes: 'The 6 GHz key is the password the two radios share. The robot radio goes on the robot, and the access point plugs into your laptop. On battery the access point turns its wireless off. At official events, radios are programmed at the Radio Kiosk.',
    }),

    L.steps({
      id: 'spark-update', eyebrow: J5, title: 'Update a SPARK MAX',
      items: [
        { title: 'Install **REV Hardware Client 2**', text: 'Not the old REV Hardware Client.' },
        { title: 'Turn the robot off' },
        { title: 'Plug USB into one SPARK MAX' },
        { title: 'Update the firmware', text: 'Pick the newest 26.x, even if a newer version is listed.' },
      ],
      qr: { url: REV, label: 'REV Hardware Client 2', short: 'docs.revrobotics.com: REV Hardware Client 2' },
      notes: 'If the app says Outdated, use Recovery Mode. It erases the settings, so do it before the next slide. CTRE motor controllers use Phoenix Tuner X instead.',
    }),

    L.steps({
      id: 'spark-settings', eyebrow: J5, title: 'Give each SPARK MAX its settings',
      items: [
        { title: 'Give it a CAN ID from 1 to 63', text: 'Every SPARK MAX gets a different ID.' },
        { title: 'Set the motor type', text: 'Brushed for CIM, REV NEO Brushless for NEO. Brushed mode can ruin a NEO.' },
        { title: 'Click **Persist Parameters**' },
        { title: 'Label it and write down its ID, then do the next one' },
        { title: 'Check that they all show up', text: 'Power on, USB in any one, then look under **CAN Bus**.' },
      ],
      notes: 'The code in Deck 2 uses these CAN IDs. Leave the power hub\'s ID at its default.',
    }),

    L.links({
      id: 'links', eyebrow: 'Reference',
      items: [
        { label: 'Zero to Robot', url: `${Z2R}/introduction.html`, short: 'docs.wpilib.org: Introduction' },
        { label: 'Robot wiring', url: `${Z2R}/step-1/intro-to-frc-robot-wiring.html`, short: 'docs.wpilib.org: Robot Wiring' },
        { label: 'Offline installs', url: `${Z2R}/step-2/offline-installation-preparations.html`, short: 'docs.wpilib.org: Offline Preparation' },
        { label: 'Status lights', url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, short: 'docs.wpilib.org: Status Light Reference' },
      ],
      notes: 'Zero to Robot is the full official walkthrough. Robot wiring covers the electrical side. Offline installs lists the files for the USB stick. Status lights explains every light on the robot.',
    }),
  ],
};
