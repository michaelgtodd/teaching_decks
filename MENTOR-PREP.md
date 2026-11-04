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
| `REVLib-offline-v2026.0.5.zip` | Needed in Deck 2 |

## Robot, before Deck 1

Deck 1 needs one finished robot, because setup takes hours. Use the Setup lab slides as your checklist.

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
- **Demo:** load drive code and test it. The Deck 2 code in `examples/` hasn't run on a real robot yet.
- **Getting Started program:** it drives PWM ports, so a CAN robot stays still. Deck 1 tells students this is expected.
- **Check:** deploy it once and confirm three green lights. Keep the team number, CAN IDs and radio key with the robot.

## Day of

- Write the team number and project folder on the board.
- Have ready: robot on blocks, charged battery, USB cables, a controller per group, power strips.
- Set up a help table for laptop problems, so nobody installs during the session.
- Print the links slide. Students with no phone can't scan a QR code, and installs happen on the laptop anyway.
- Run Deck 1 in two sittings. "Build Successful" is the natural stop, and part 2 needs groups of 3 or 4.

## Fixes kept off the student slides

- Over USB the roboRIO is at `172.22.11.2`.
- Ping `roboRIO-TEAM-FRC.local`, with no leading zeros in the team number, then `10.TE.AM.2`. If the address works and the name doesn't, the laptop can't resolve the name.
- Turn off other network adapters. Windows Firewall off is fine on the robot network, but turn it back on before going online.
- A red **Communications** light with a good cable is usually a team number mismatch.

## Test before you teach

- Give a wiped laptop to a real 14-year-old and time them. Deck 1's 95 minutes is an estimate.
- Time the first build, and check that it works with no internet on a laptop installed from the stick.
- Check that `Enter` disables when Driver Station isn't the active window. The docs only promise that for `Space`.
- Check whether an NI account has an age limit, and whether Game Tools needs an administrator.

## Later

- 2027 notes for mentors: Systemcore replaces the roboRIO, Java 25 replaces Java 17, the 2027 alphas need Windows 11, 2026 projects must be imported, and Shuffleboard and SmartDashboard are removed. Please keep the 2027 alphas off robot laptops for this course.
- Recheck docs links and QR codes after kickoff.
