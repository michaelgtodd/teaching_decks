// Deck 1: installing WPILib and setting up a robot for the first time.
// Every how-to slide carries a QR code to its official page. Claims are sourced in SOURCES.md.
import * as L from '../../template/layouts.mjs';

const WPI = 'https://docs.wpilib.org/en/stable/docs';
const Z2R = `${WPI}/zero-to-robot`;
const VH = 'https://frc-radio.vivid-hosting.net';
const REV = 'https://docs.revrobotics.com/rev-hardware-client-2';
const TUNER = 'https://v6.docs.ctr-electronics.com/en/stable/docs/tuner/';

export default {
  no: 1, short: 'Install and first setup', title: 'Install WPILib and set up your robot', minutes: 30,
  description: 'Install WPILib and the FRC tools, prepare the roboRIO, radio and motor controllers, then deploy and enable for the first time.',
  slides: [
    L.cover({
      title: 'Install WPILib and set up your robot',
      subtitle: 'From a fresh laptop to a robot that answers it',
      minutes: 30,
      notes: 'Welcome everyone. In the next 30 minutes we get your laptop ready and connect it to a robot. You were asked to install WPILib before today, so we start with a quick check. The how-to slides each have a QR code to the official page, so keep your phone handy. Scan the code rather than trusting a slide later on, because versions change.',
    }),

    L.cards({
      id: 'map', eyebrow: 'What you will set up', title: 'Set up six pieces, from laptop to robot',
      intro: 'By the end, your laptop can talk to your robot. Three pieces live on the laptop and three go on the robot.',
      items: [
        { title: 'WPILib 2026', text: 'VS Code, Java, robot libraries and tools. You write and deploy code here.' },
        { title: 'FRC Game Tools', text: 'Driver Station controls the robot. The Imaging Tool sets up its computer.' },
        { title: 'Vendor tools', text: 'REV Hardware Client 2 and [Phoenix Tuner X](' + TUNER + ') manage motor controllers.' },
        { title: 'roboRIO image', text: 'The operating system on the robot\'s computer. It must be redone every year.' },
        { title: 'Radio setup', text: 'Firmware, team number and a password, so laptop and robot can find each other.' },
        { title: 'Firmware and CAN IDs', text: 'Each motor controller gets current firmware and its own address number.' },
      ],
      notes: 'Two minutes. Think of setting up a new phone: an operating system, a network connection, then apps. The roboRIO is the computer on the robot, and its image is that operating system. Firmware is software that lives inside a device, like a radio or a motor controller. CAN is the wired network joining the roboRIO to motor controllers, and a CAN ID is each device\'s address on it. If a kid asks whether they need both vendor tools: no. REV parts use REV Hardware Client 2 and CTRE parts use Phoenix Tuner X.',
    }),

    L.steps({
      id: 'already-installed', eyebrow: 'Already installed?', title: 'Check your laptop before anything else',
      items: [
        { title: 'Open **2026 WPILib VS Code**', text: 'Use the desktop shortcut with the year, not your everyday VS Code.' },
        { title: 'Create an example project and build it', text: 'Run `WPILib: Build Robot Code`. You want Build Successful.' },
        { title: 'Run `WPILib: Open Project Information`', text: 'Project Version and WPILib Extension Version should say 2026.2.1.' },
        { title: 'Open **FRC Driver Station**', text: 'On the Diagnostics tab, DS Version should start with 26.' },
        { title: 'Open **REV Hardware Client 2**', text: 'A new app, not the old REV Hardware Client.' },
        { title: 'All good? Pair up with someone still installing' },
      ],
      qr: { url: `${Z2R}/step-2/`, label: 'Installing the software', short: 'docs.wpilib.org: Step 2, Installing Software' },
      notes: 'Three minutes, hands on. Start this now, and mentors, walk the room. Press Ctrl+Shift+P to find the WPILib commands. A failed check points to one of the next few slides. An older 2026 version is an easy fix: run the new installer over it. CTRE teams also check for Phoenix Tuner X, which lists Windows 11 only. Anyone who passes everything pairs up with someone still installing, because helping is the fastest way to learn this. If a kid asks about a Mac: WPILib works, but Driver Station and the Imaging Tool are Windows only.',
    }),

    L.steps({
      id: 'install-wpilib', eyebrow: 'Install: WPILib', title: 'Install WPILib 2026 on Windows',
      flag2027: 'Windows 11 is required for the 2027 alphas.',
      items: [
        { title: 'Download the Windows `.iso`', text: 'Version 2026.2.1, about 2.4 GB. Slow Wi-Fi? Ask a mentor for the USB stick.' },
        { title: 'Mount it, then run `WPILibInstaller.exe`', text: 'Right-click, Mount. Windows warning? More info, then Run anyway.' },
        { title: 'Press Start, then choose **Everything**', text: '**Install for this User** needs no administrator password.' },
        { title: 'Choose **Download for this computer only**', text: 'From a USB stick, choose **Select existing VS Code archive** instead.' },
        { title: 'Press Finish, then open **2026 WPILib VS Code**', text: 'It is a separate copy. Your everyday VS Code is not touched.' },
      ],
      qr: { url: `${Z2R}/step-2/wpilib-setup.html`, label: 'WPILib install guide', short: 'docs.wpilib.org: WPILib Installation Guide' },
      notes: 'One and a half minutes. This is the fallback for anyone who failed the check. You need 64-bit Windows 10 or 11. Arm laptops, like Snapdragon ones, are not supported, and Driver Station will not run on them either. Windows 10 works for 2026, but plan for Windows 11. You do not need to uninstall older years, because each year installs to its own folder. If a kid asks why VS Code is downloaded separately: licensing stops WPILib bundling it, so the installer fetches about 150 MB or uses an archive from the USB stick.',
    }),

    L.practice({
      id: 'install-stick', title: 'Keep an install stick in the toolbox',
      rule: 'Put the offline installers on a USB stick before you need them.',
      why: 'Shop Wi-Fi may not cope with 2.4 GB per laptop, and an event may have no internet at all. One mentor downloads once, and every laptop installs from the stick.',
      code: `
WPILib_Windows-2026.2.1.iso                 // WPILib, 2.4 GB
VS Code archive                             // saved by the WPILib installer
ni-frc-2026-game-tools_26.0.0_offline.iso   // Game Tools, 1.39 GB
REV Hardware Client 2, offline firmware     // the "All versions" pack
REVLib-offline-v2026.0.5.zip                // needed in deck 2`,
      notes: 'One minute. Mentors, here is the recipe. Run the WPILib installer once online and pick Download VS Code archives to share with other computers. Save that next to the iso. On the NI page, click Install Offline. On the REV download page, get an offline firmware pack, then use Import Pack on the app\'s Downloads page. Choose the All versions pack, because the REV slide needs a firmware that is not the newest. The last slide has a QR code for the official offline page. Check the shop Wi-Fi before the workshop.',
    }),

    L.steps({
      id: 'install-game-tools', eyebrow: 'Install: Game Tools', title: 'Install the FRC Game Tools',
      items: [
        { title: 'Find FRC Game Tools 2026 on the NI site', text: 'The guide links to it. You need an NI account to log in.' },
        { title: 'Click Download, or **Install Offline**', text: 'Install Offline gives you an `.iso` for other laptops.' },
        { title: 'Remove older years first', text: 'In Add or Remove Programs, uninstall NI Software.' },
        { title: 'Run the installer', text: 'From an `.iso`: mount it, then run `install.exe`.' },
        { title: 'Leave the Fast Startup screen as it is', text: 'Windows Fast Startup can cause problems imaging the roboRIO.' },
        { title: 'Reboot if asked', text: 'Then look for Driver Station and the Imaging Tool on the desktop.' },
      ],
      qr: { url: `${Z2R}/step-2/frc-game-tools.html`, label: 'Game Tools install guide', short: 'docs.wpilib.org: Installing the FRC Game Tools' },
      notes: 'One and a half minutes. Game Tools gives you the FRC Driver Station and the roboRIO Imaging Tool, plus the drivers for the roboRIO USB connection. It also installs the mDNS responder that lets your laptop find the robot by name. Uninstalling is only needed when you change years, not for an update within a year. The installer may ask to update .NET Framework: follow the prompts and reboot. If the Mount option is missing, 7-Zip can extract the iso. Mentors, one shared download saves time, since each download needs an NI login.',
    }),

    L.diagram({
      id: 'connections', eyebrow: 'How it connects', title: 'Follow the path from laptop to motor',
      caption: 'Schematic, with power left out. First tests use a USB or Ethernet cable, not Wi-Fi. Wiring is covered in the electrical workshop, and the last slide has its code.',
      nodes: [
        { id: 'laptop', x: 128, y: 250, w: 280, h: 130, label: 'Laptop', sub: 'Driver Station', tone: 'ink' },
        { id: 'ap', x: 560, y: 250, w: 270, h: 130, label: 'Access point', sub: 'VH-109 on wall power', tone: 'paper' },
        { id: 'robot', x: 1000, y: 250, w: 270, h: 130, label: 'Robot radio', sub: 'VH-109', tone: 'paper' },
        { id: 'rio', x: 1450, y: 250, w: 342, h: 130, label: 'roboRIO', sub: 'Runs your code', tone: 'accent' },
        { id: 'spark1', x: 1450, y: 480, w: 342, h: 120, label: 'SPARK MAX', sub: 'CAN ID 1', tone: 'blue' },
        { id: 'spark2', x: 1000, y: 480, w: 270, h: 120, label: 'SPARK MAX', sub: 'CAN ID 2', tone: 'blue' },
        { id: 'pdh', x: 560, y: 480, w: 270, h: 120, label: 'PDH', sub: 'CAN ends here', tone: 'paper' },
        { id: 'motor1', x: 1450, y: 690, w: 342, h: 110, label: 'Motor', tone: 'paper' },
        { id: 'motor2', x: 1000, y: 690, w: 270, h: 110, label: 'Motor', tone: 'paper' },
        { id: 'canNote', x: 128, y: 480, w: 372, h: 320, label: 'CAN', sub: 'The robot\'s wired network. Yellow to yellow, green to green. Each device needs its own ID.', tone: 'ghost' },
      ],
      edges: [
        { from: 'laptop', to: 'ap', label: 'Ethernet', lx: 414, ly: 268, lw: 140 },
        { from: 'ap', to: 'robot', label: '6 GHz Wi-Fi', dashed: true, lx: 836, ly: 268, lw: 158 },
        { from: 'robot', to: 'rio', label: 'Ethernet, RIO port', lx: 1276, ly: 244, lw: 168 },
        { from: 'rio', to: 'spark1', fromSide: 'b', toSide: 't', label: 'CAN', lx: 1632, ly: 412, lw: 80 },
        { from: 'spark1', to: 'spark2', fromSide: 'l', toSide: 'r' },
        { from: 'spark2', to: 'pdh', fromSide: 'l', toSide: 'r' },
        { from: 'spark1', to: 'motor1', fromSide: 'b', toSide: 't' },
        { from: 'spark2', to: 'motor2', fromSide: 'b', toSide: 't' },
      ],
      notes: 'Two minutes. Trace it with your finger. Your laptop talks by Ethernet to a radio on a wall, the access point. That talks by 6 GHz Wi-Fi to the radio on the robot, which plugs into the roboRIO. The roboRIO sends commands over CAN along a chain of motor controllers, ending at the Power Distribution Hub, or PDH, which needs its termination on. At events, the field\'s access point replaces yours. The electrical workshop covers wiring in depth, so we stop here. If a kid asks about the arrows: data flows both ways.',
    }),

    L.steps({
      id: 'image-rio1', eyebrow: 'Image the roboRIO', title: 'Image a roboRIO 1 with the Imaging Tool',
      flag2027: 'Systemcore replaces the roboRIO, so this step changes.',
      items: [
        { title: 'Check which roboRIO you have', text: 'A microSD card slot means roboRIO 2: use the next slide instead.' },
        { title: 'Connect the USB cable', text: 'Printer-style A to B cable, in the USB Device port. Never image over Ethernet.' },
        { title: 'Open the **roboRIO Imaging Tool**', text: 'It scans for your roboRIO. Nothing found? Try Run as Administrator.' },
        { title: 'Click **Format Target**', text: 'Enter your team number, select the latest image, click **Reformat**.' },
        { title: 'Wait 3 to 10 minutes', text: 'Click OK, then Close.' },
        { title: 'Press the **Reset** button', text: 'The new team number takes effect after the reboot.' },
      ],
      qr: { url: `${Z2R}/step-3/imaging-your-roborio.html`, label: 'roboRIO 1 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 1' },
      notes: 'One and a half minutes. The image and the firmware are different things. The image is the operating system, and you must update it every year. The firmware is only used in safe mode, and only a brand-new roboRIO needs it updated: version 5.0 or higher is fine. Check that the roboRIO power connector is secure before you start, all four screws. If imaging fails, try a different USB cable, turn off the firewall, or try another laptop. The official page lists more fixes. A roboRIO 2 needs the next slide.',
    }),

    L.steps({
      id: 'image-rio2', eyebrow: 'Image the roboRIO', title: 'Image a roboRIO 2 on a microSD card',
      flag2027: 'Systemcore replaces the roboRIO, so this step changes.',
      items: [
        { title: 'Find the image file', text: 'In the Imaging Tool, click the SD button. Use the newest `FRC_roboRIO2` zip.' },
        { title: 'Put the card in a USB reader on your laptop', text: 'A card of 2 GB or more is recommended.' },
        { title: 'Write it with balenaEtcher or Raspberry Pi Imager', text: 'The Imaging Tool cannot image a roboRIO 2 directly.' },
        { title: 'If Windows offers to format the card, say no', text: 'Formatting erases the image, and you would have to write it again.' },
        { title: 'Power off, insert the card, power on', text: 'A roboRIO 2 will not boot without it.' },
        { title: 'Set the team number', text: 'Imaging Tool: **Edit Startup Settings**, Team Number, **Apply**.' },
      ],
      qr: { url: `${Z2R}/step-3/roborio2-imaging.html`, label: 'roboRIO 2 imaging', short: 'docs.wpilib.org: Imaging your roboRIO 2' },
      notes: 'One and a half minutes. This is the biggest difference between the two. A roboRIO 2 boots from its microSD card, so we write the card on the laptop. The Imaging Tool only helps us find the file and set the team number. Writing the card does not set a team number, so step six is easy to miss. That step can be slow or hang: wait a few minutes, then reboot the roboRIO. The roboRIO Team Number Setter also works. Pulling the card while powered will hang the roboRIO but will not damage it.',
    }),

    L.steps({
      id: 'radio', eyebrow: 'Program the radio', title: 'Program the VH-109 from its web page',
      items: [
        { title: 'Connect to the **DS** port', text: 'Ethernet from your laptop. Power it by PoE adapter or 12 V. Wi-Fi off.' },
        { title: 'Open `http://radio.local/`', text: 'Page will not load? Run the Vivid-Hosting Network Assistant Tool.' },
        { title: 'Update the firmware to 2.0.1', text: 'File plus SHA-256 checksum, then Upload. Keep power on for 2 to 3 minutes.' },
        { title: 'Set up the robot radio', text: '**Robot Radio Mode**, team number, 6 GHz key, then Configure.' },
        { title: 'Set up a second radio as the access point', text: '**Access Point Mode**, same team number and key. Never on a battery.' },
        { title: 'At events, use the Radio Kiosk', text: 'This web page is for home. Official events program radios at a kiosk.' },
      ],
      qr: { url: `${VH}/overview/quick-start-guide`, label: 'VH-109 quick start', short: 'Vivid-Hosting: Quick Start Guide' },
      notes: 'Two minutes. There is no program to install: the radio serves its own web page. Pick the firmware file by what you have now. Radios on 1.2.x or newer use the file with FROM_1_2_X in its name, and older ones use the other file. Paste the SHA-256 key from that page into the Checksum box. It is finished when PWR is solid and SYS blinks slowly. The access point must use wall power, because using a battery is not legal and the radio turns its wireless off. If a kid asks why two radios: it matches the field best.',
    }),

    L.gotcha({
      id: 'radio-firmware', title: 'Update the radio even if WPILib says 1.3.0 is fine',
      symptom: 'The WPILib radio page says to skip the update at 1.3.0, so you skip it.',
      cause: '1.3.0 was the 2025 rule. For 2026 events, Vivid-Hosting requires 2.0.0, and the kiosk wants 2.0.1.',
      fix: 'Install 2.0.1 from the [firmware page](' + VH + '/overview/firmware-releases). Then ignore Driver Station `ERROR -44021 Radio Version`: it is a known bug.',
      notes: 'One minute. Anyone reading the WPILib page could fall into this one, so it is not your fault. When two official pages disagree about a product, trust the maker of that product. WPILib\'s own Known Issues page agrees with Vivid-Hosting here. Same for the error: it looks scary but does not affect connecting. One more change in 2.0.0: DIP switch 3 no longer turns on 2.4 GHz Wi-Fi. Use the Enable 2.4 GHz Wi-Fi option on the web page instead, even though older pages still mention the switch.',
    }),

    L.steps({
      id: 'rev-firmware-can', eyebrow: 'Motor controllers', title: 'Set firmware and CAN IDs in REV Hardware Client 2',
      items: [
        { title: 'Install **REV Hardware Client 2**', text: 'A new app. The old REV Hardware Client is end of life.' },
        { title: 'Robot off, USB into one SPARK', text: 'Only that SPARK gets power, so you cannot change the wrong one.' },
        { title: 'Update firmware: pick 26.1.5, not 27.0.0', text: 'REVLib 2026 expects 2026 firmware. "Outdated" device? Use Recovery Mode.' },
        { title: 'Set a unique CAN ID, 1 to 63', text: 'Match `Constants.java`. Leave the PDH ID at its default.' },
        { title: 'Set the motor type', text: 'Brushed for CIM, REV NEO Brushless for NEO. Brushed mode ruins a NEO.' },
        { title: 'Click **Persist Parameters**, then label the SPARK', text: 'Repeat for every SPARK on the robot.' },
      ],
      qr: { url: REV, label: 'REV Hardware Client 2', short: 'docs.revrobotics.com: REV Hardware Client 2' },
      notes: 'Two minutes. Slow down at step three. REV released 27.0.0 firmware on October 29, and it removes settings that REVLib 2026 still uses. This course uses REVLib 2026, so choose 26.1.5 from the version list. A SPARK Flex uses 26.1.6, and the PDH uses 26.1.3. Recovery Mode erases a device\'s settings, so do it before you set the ID. When all are done, power on with USB in any device and check they all appear under CAN Bus. CTRE teams do this in Phoenix Tuner X instead, which lists Windows 11 only.',
    }),

    L.steps({
      id: 'first-deploy', eyebrow: 'First deploy', title: 'Create a project, deploy it and connect',
      items: [
        { title: 'Create the project', text: '`Ctrl+Shift+P`, `WPILib: Create a new project`. Example, Java, Getting Started.' },
        { title: 'Type your team number, then **Generate Project**', text: 'Keep the folder off OneDrive. Then trust the authors when asked.' },
        { title: 'Connect by USB or Ethernet', text: 'Prove it on a cable before you try Wi-Fi.' },
        { title: 'Run `WPILib: Deploy Robot Code`', text: 'Wait for Build Successful. Never power off during a deploy.' },
        { title: 'Set your team number in Driver Station', text: 'Setup tab, then press Enter.' },
        { title: 'Look for three green lights', text: 'Communications, Robot Code and Joysticks.' },
      ],
      qr: { url: `${Z2R}/step-4/`, label: 'Program and run', short: 'docs.wpilib.org: Step 4, Programming your Robot' },
      notes: 'Two minutes. The team number is how WPILib finds your robot. If you typed it wrong, use WPILib: Set Team Number to fix it. Leave Enable Desktop Support unchecked for this project. The WPILib docs warn that OneDrive caching interferes with the build. Powering off during a deploy can corrupt the roboRIO, so wait for it to finish. The three lights mean: Communications, we can reach the roboRIO. Robot Code, our program is running. Joysticks, a controller is plugged in. Battery voltage should show as well. Red lights are on the troubleshooting slide coming up.',
    }),

    L.diagram({
      id: 'control-loop', eyebrow: 'Control theory', title: 'Sense, decide and act every 20 ms',
      caption: 'That is 50 loops a second. Each pass must finish quickly, because the next one is due 20 ms after this one started.',
      nodes: [
        { id: 'sense', x: 128, y: 290, w: 420, h: 170, label: 'Sense', sub: 'Read joysticks and sensors', tone: 'blue', size: 36 },
        { id: 'decide', x: 750, y: 290, w: 420, h: 170, label: 'Decide', sub: 'Your code picks an output', tone: 'ink', size: 36 },
        { id: 'act', x: 1372, y: 290, w: 420, h: 170, label: 'Act', sub: 'Send commands to motors', tone: 'accent', size: 36 },
        { id: 'world', x: 750, y: 610, w: 420, h: 170, label: 'The robot moves', sub: 'The sensors now read differently', tone: 'paper' },
      ],
      edges: [
        { from: 'sense', to: 'decide' },
        { from: 'decide', to: 'act' },
        { from: 'act', to: 'world', fromSide: 'b', toSide: 'r', route: 'vh' },
        { from: 'world', to: 'sense', fromSide: 'l', toSide: 'b', route: 'hv', label: 'Next loop', lx: 360, ly: 648, lw: 240 },
      ],
      notes: 'Two minutes. Driving a car works like this. Your eyes see the road, you decide, your hands move the wheel, the car moves, and you look again. Your robot program does the same, and TimedRobot runs it every 20 milliseconds by default. Because each loop sees the result of the last one, this is a feedback loop, and deck 6 builds on it. Never wait inside a periodic method. A long loop gives the warning, Loop time of 0.02s overrun. If a kid asks what happens then: the robot reacts late.',
    }),

    L.exercise({
      id: 'first-enable', title: 'Enable the robot with the safety checklist', minutes: 5,
      tasks: [
        'Lift the robot so the wheels touch nothing. Keep all hands clear of it.',
        'Choose one operator at the laptop, with a mentor beside them. Everyone else stands back.',
        'Check for three green lights and a battery voltage. Choose Teleoperated.',
        'Say "enabling" out loud, then click **Enable**. Press `Enter` to disable. `Space` is the E-stop.',
        'A CAN robot stays still here: this example drives PWM ports. Deck 2 makes it move.',
      ],
      done: 'The robot signal light blinks when enabled and goes solid after `Enter`.',
      notes: 'Five minutes. Mentors, get one robot imaged, configured and deployed before this session, since the setup takes much longer than five minutes. Practice pressing Enter before you ever click Enable, so it is a habit. Space is the emergency stop, and it works even when Driver Station is not the active window. After an E-stop, you must reboot the roboRIO before enabling again. Use this checklist every time, even when nothing should move, because old code may still be on the robot. If a kid asks why it stays still: the Getting Started code uses PWM, not CAN.',
    }),

    L.table({
      id: 'wont-connect', eyebrow: 'When it will not connect', title: 'Fix the most common connection failures',
      columns: ['What you see', 'Likely cause', 'Try this first'], widths: [31, 31, 38], fontSize: 24,
      rows: [
        ['Communications stays red', 'Team number mismatch, or Wi-Fi in the way', 'Match Driver Station Setup tab. Turn off other network adapters.'],
        ['Deploy cannot find the roboRIO', 'Firewall, or roboRIO team number not set', 'Turn off the firewall. Set the team number over USB.'],
        ['Robot Code stays red', 'Nothing deployed, or the code crashed', 'Deploy again and read RioLog. Reboot the roboRIO.'],
        ['Invalid RoboRIO Image Version', 'The image is too old for WPILib 2026', 'Re-image with 2026 Game Tools.'],
        ['Joysticks stays red', 'Controller not detected', 'Open the USB Devices tab. Press F1 to rescan.'],
        ['Radio SYS light blinks slowly', 'Radio cannot reach the access point', 'Power the access point. Match team number and key.'],
      ],
      caption: 'Work from the wire outward: USB first, then Ethernet, then Wi-Fi.',
      notes: 'One minute. Do not guess. Change one thing at a time, starting closest to the robot. Over USB the roboRIO is at 172.22.11.2, so it is the best first test. Then open a command prompt and ping roboRIO-TEAM-FRC.local with your team number, with no leading zeros. If that fails, ping 10.TE.AM.2. If the address works and the name does not, the laptop cannot resolve the name. Windows Firewall off is fine on the robot network, but turn it back on before you go online.',
    }),

    L.change2027({
      id: 'change-2027',
      items: [
        { now: 'roboRIO 1 or 2, imaged every year', next: 'Systemcore replaces the roboRIO' },
        { now: 'Windows 10 or 11', next: 'Windows 11 required for the 2027 alphas' },
        { now: 'Java 17', next: 'Java 25' },
        { now: 'Projects from 2025 are imported', next: '2026 projects must be imported too' },
        { now: 'Shuffleboard and SmartDashboard included', next: 'Removed: use Elastic or AdvantageScope' },
      ],
      note: 'WPILib 2027 is still in alpha, so this may change. Everything in this deck is correct for 2026.',
      notes: 'Thirty seconds. This is a heads-up, not homework. We are building on 2026 because Systemcore kits are not out yet. Please do not install the 2027 alphas on your robot laptop for this course. The most useful thing here for a team to act on is the Windows row: if you are choosing a laptop now, pick one that runs Windows 11. If a kid asks when Systemcore arrives: we do not have a date to give you, so watch the official WPILib news.',
    }),

    L.recap({
      id: 'recap',
      items: [
        'Check a laptop has the right tools, or install them.',
        'Image a roboRIO 1 or a roboRIO 2 the right way for each.',
        'Program a VH-109 radio and set up SPARK firmware and CAN IDs.',
        'Deploy code, read the Driver Station lights and enable safely.',
        'Work through a connection failure from the wire outward.',
      ],
      next: 'Deck 2: command-based basics and driving the KitBot.',
      notes: 'Thirty seconds. Ask for a show of hands on each one. Anyone unsure about a step can use its QR code, because each how-to slide stays useful after today. If your robot is not finished yet, that is normal: imaging, radio and firmware take longer than one session. Write down your team number, your CAN IDs and your radio key, and keep them with the robot. The next deck writes real code on top of this setup, so everything here needs to be working first.',
    }),

    L.links({
      id: 'links', intro: 'Point your phone camera at a code.',
      items: [
        { label: 'Zero to Robot', url: `${Z2R}/introduction.html`, short: 'docs.wpilib.org: Introduction' },
        { label: 'Robot wiring', url: `${Z2R}/step-1/intro-to-frc-robot-wiring.html`, short: 'docs.wpilib.org: Robot Wiring' },
        { label: 'Offline installs', url: `${Z2R}/step-2/offline-installation-preparations.html`, short: 'docs.wpilib.org: Offline Preparation' },
        { label: 'Status lights', url: `${WPI}/hardware/hardware-basics/status-lights-ref.html`, short: 'docs.wpilib.org: Status Light Reference' },
      ],
      notes: 'Thirty seconds. Leave this up while people pack away. Zero to Robot is the full official walkthrough that this deck follows. Robot wiring is the guide for the electrical workshop. Offline installs lists everything to put on the USB stick. Status lights explains every light on the robot, and it is the page to open when something blinks and you do not know why. Keep these bookmarked, and check them again after kickoff, because stable pages move on to 2027 then.',
    }),
  ],
};
