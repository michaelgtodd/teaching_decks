# Mentor prep

What mentors do so that Deck 1 and the Setup lab run smoothly. None of this belongs on student slides.

## Weeks before

- Tell families what laptop is needed: 64-bit Windows 10 or 11, and no Arm laptops such as Snapdragon. A Mac runs WPILib but not Driver Station. If you're buying one, pick a laptop that runs Windows 11.
- Check school-managed laptops for install rights.
- Decide who holds the NI account, since each Game Tools download needs a login.
- Install everything on every laptop, or run Setup lab jobs 1 and 2 before Deck 1. Never install during Deck 1.
- After installing, open a project, run `WPILib: Open Project Information`, and check that it says 2026.2.1. Run the new installer over an older 2026 version.

**Install stick.** Shop Wi-Fi may not cope with 2.4 GB per laptop, and an event may have no internet.

| File | Notes |
|---|---|
| `WPILib_Windows-2026.2.1.iso` | 2.4 GB |
| VS Code archive | In the WPILib installer, choose Download VS Code archives to share with other computers |
| `ni-frc-2026-game-tools_26.0.0_offline.iso` | 1.39 GB. On the NI page, click Install Offline |
| REV Hardware Client 2 offline firmware | Get the "All versions" pack, then use Import Pack on the app's Downloads page |
| `REVLib-offline-v2026.0.5.zip` | Needed in Deck 1 |

## Robot, before Deck 1

The first half of Deck 1 runs in the simulator on any laptop. The second half needs a robot with one motor that can spin freely. Use the Setup lab slides as your checklist.

- **roboRIO:** check the type and the power connector, image it, and set the team number. Update roboRIO firmware only if it's brand new: version 5.0 or higher is fine.
- **Radios:**
  - Update to 2.0.1. WPILib's radio page says 1.3.0 is enough, but that's last year's rule, and Vivid-Hosting requires 2.0.0 for 2026 events.
  - Ignore Driver Station's `ERROR -44021 Radio Version`, which is a known bug.
  - Use the web option for 2.4 GHz Wi-Fi, not DIP switch 3.
- **SPARK MAX:**
  - Use the newest 26.x firmware. REVLib 2026 reports firmware 27 as too new.
  - Do Recovery Mode before setting IDs, because it erases settings.
  - Set unique IDs and motor types, click Persist Parameters, and label each one.
  - Leave the PDH ID at its default, with termination on.
- **Deck 1 motor:** the deck uses CAN ID 6, the KitBot feeder roller, in brushed mode. On a robot without that roller, pick one motor that can spin freely and change `kMotorId`. The code in `examples/frc/robot/deck1/` hasn't run on a real robot yet.
- **Check:** deploy it once, confirm three green lights, and hold A to spin the motor. Keep the team number, CAN IDs and radio key with the robot.

## Day of

- Write the team number and project folder on the board.
- Have ready: robot on blocks, charged battery, USB cables, a controller per group, power strips.
- Set up a help table for laptop problems, so nobody installs during the session.
- Print the links slide. Students with no phone can't scan a QR code, and installs happen on the laptop anyway.
- Deck 1 has a natural stop after the simulator exercise. The motor half needs REVLib installed, which needs internet or the offline zip, and a robot for each group.

## Before Deck 11 (PathPlanner)

- Install the PathPlanner app on each laptop: Microsoft Store, or `PathPlanner-Windows-v2026.1.2.zip` from the GitHub releases page for the install stick. The app's PathPlannerLib version and the vendordep should both be 2026.1.2.
- Run `cd examples && ./gradlew compileJava` once. The Deck 11 code, the Deck 12 code and Deck 2's sequence slides were written in a session that could not reach Gradle's servers, so they are checked against source but not compiled.
- Run the Deck 11 exercise yourself first: simulator, PathPlanner Telemetry on Simulator, First Auto in the chooser. Nobody has run it yet.
- The path and auto files in `examples/src/main/deploy/pathplanner/` were made in the real app. If a student's copy of `examples` is older than this, it won't have them.
- Deck 11's launcher is a stand-in with CAN IDs 5 and 6, brushed. It is not the KitBot's real mechanism, so don't deploy it to a robot as-is.

## Running the Setup lab

The slides only list the jobs and their steps. How to run them is here.

- Run it as a lab, not a talk. Each group takes one job with a mentor beside it and uses only that job's slides.
- Jobs 1 and 2 are for laptops and come before Deck 1. Jobs 3 to 5 make more sense after Deck 2, when a CAN ID means something.
- A mentor handles the NI login, confirms which roboRIO it is, checks the radio firmware file, runs SPARK Recovery Mode if needed, and confirms motor types.

## Fixes kept off the student slides

Work from the wire outward: USB first, then Ethernet, then Wi-Fi.

| What you see | Likely cause | Try this first |
|---|---|---|
| Communications stays red | Team number mismatch, or Wi-Fi in the way | Match the Driver Station Setup tab. Turn off other network adapters. |
| Deploy can't find the roboRIO | Firewall, or roboRIO team number not set | Turn off the firewall. Set the team number over USB. |
| Robot Code stays red | Nothing deployed, or the code crashed | Deploy again and read RioLog. Reboot the roboRIO. |
| Invalid RoboRIO Image Version | The image is too old for WPILib 2026 | Re-image with 2026 Game Tools. |
| Radio SYS light blinks slowly | Radio can't reach the access point | Power the access point. Match team number and key. |

- Over USB the roboRIO is at `172.22.11.2`.
- Ping `roboRIO-TEAM-FRC.local`, with no leading zeros in the team number, then `10.TE.AM.2`. If the address works and the name doesn't, the laptop can't resolve the name.
- Turn off other network adapters. Windows Firewall off is fine on the robot network, but turn it back on before going online.

## Test before you teach

- Give a wiped laptop to a real 14-year-old and watch them work through Deck 1.
- Check that the first build works with no internet on a laptop installed from the stick.
- Check that `Enter` disables when Driver Station isn't the active window. The docs only promise that for `Space`.
- Check whether an NI account has an age limit, and whether Game Tools needs an administrator.

## Later

- 2027 notes for mentors: Systemcore replaces the roboRIO, Java 25 replaces Java 17, the 2027 alphas need Windows 11, 2026 projects must be imported, and Shuffleboard and SmartDashboard are removed. Please keep the 2027 alphas off robot laptops for this course.
- Recheck docs links and QR codes after kickoff.
