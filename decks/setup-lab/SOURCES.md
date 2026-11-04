# Setup lab sources

On 2026-11-04 this material moved out of Deck 1 into the Setup lab after a newcomer review. Slide ids below are from that deck, so some have since been split or renamed. Items now in `MENTOR-PREP.md`, such as the radio firmware warning and the 2027 notes, are kept here as the record of what was checked. Getting Started has no `Constants.java`, so the CAN ID step now says to write the IDs down instead.

Later on 2026-11-04 the deck was cut to a task list and steps. `wont-connect` moved to `MENTOR-PREP.md`, `write-it-down` became steps on `radio-modes` and `spark-settings`, and `recap` was removed. Install, imaging and radio durations were removed from the slides, along with the job time table.

Checked 2026-11-04. Pages under `docs.wpilib.org/en/stable` are the 2026 docs until `stable` flips to 2027 at kickoff.
Abbreviation: `Z2R` = `https://docs.wpilib.org/en/stable/docs/zero-to-robot`.

## Where the sources disagree (resolved)

| Topic | Stale source | What the deck says | Why |
|---|---|---|---|
| Radio firmware | `Z2R/step-3/radio-programming.html`: skip if at 1.3.0 or later | Install 2.0.1 | [Vivid-Hosting firmware releases](https://frc-radio.vivid-hosting.net/overview/firmware-releases): at least 2.0.0 for 2026 events. [Firmware changelog](https://frc-radio.vivid-hosting.net/advanced-topics/firmware-changelog): 2.0.1 is the kiosk minimum. [WPILib Known Issues](https://docs.wpilib.org/en/stable/docs/yearly-overview/known-issues.html): "2.0.1 is the latest current version and is required by the programming kiosk". |
| 2.4 GHz Wi-Fi | WPILib radio page and [Practicing At Home](https://frc-radio.vivid-hosting.net/overview/practicing-at-home): DIP switch 3 | Notes only: use the "Enable 2.4 GHz Wi-Fi" option | Firmware changelog for 2.0.0: "Removed 2.4 GHz DIP Switch functionality", "Added 'Enable 2.4 GHz Wi-Fi' configuration option". The option is listed on [Programming Your Radio At Home](https://frc-radio.vivid-hosting.net/overview/programming-your-radio-at-home). |
| REV tool | The brief, PLAN.md and the [FIRST KitBot Java guide](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-java-guide.pdf) section 3.4: "REV Hardware Client" | REV Hardware Client 2 | [RHC1 overview](https://docs.revrobotics.com/rev-hardware-client): "has reached end of life". [RHC1 SPARK MAX page](https://docs.revrobotics.com/rev-hardware-client/ion/spark-max): REVLib 2026 users "must use REV Hardware Client 2". |
| VS Code offline button | WPILib docs say "Create VS Code archives..." and "Create VS Code zip..." | "Download VS Code archives to share..." | Exact string in [VSCodePageViewModel.cs at v2026.2.1](https://github.com/wpilibsuite/WPILibInstaller-Avalonia/blob/v2026.2.1/WPILibInstaller-Avalonia/ViewModels/VSCodePageViewModel.cs). |
| Vivid-Hosting links | WPILib links to `/miscellaneous/firmware-releases` and `/miscellaneous/network-assistant-tool` | Uses `/overview/...` paths | The old paths redirect there. |

## SPARK firmware 27.0.0 (read this one)

- [SPARK MAX 27.0.0](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sm-27.0.0) was published 2026-10-29 as a normal release (also `sf-27.0.0` for SPARK Flex). It "Removes the position and velocity conversion factor parameters for all sensors".
- [RHC2 1.4.4](https://rhc2.revrobotics.com/download/download.html), same date: "Removes conversion factors to match SPARK and encoder firmware".
- REVLib 2026 uses those parameters: [REV's 2026 StarterBot Configs.java](https://github.com/REVrobotics/2026-REV-ION-FRC-StarterBot/blob/main/src/main/java/frc/robot/Configs.java) calls `.positionConversionFactor(...)`.
- [REVLib changelog](https://docs.revrobotics.com/revlib/install/changelog) 2026.0.5: "Adds warning for SPARK devices not on 2026 firmware".
- [RHC2 Recovery Mode](https://docs.revrobotics.com/rev-hardware-client-2/rhc2/recovery): the version menu "will automatically select the most up-to-date firmware", and other versions can be selected.
- Last 2026 versions: [SPARK MAX 26.1.5](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sm-26.1.5), [SPARK Flex 26.1.6](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sf-26.1.6), [PDH 26.1.3](https://docs.revrobotics.com/ion-control/pdh/power-distribution-hub-firmware-changelog).

The deck therefore tells students to pick the newest 26.x. REVLib 2026.0.5 treats firmware year 27 as too new. `c_Spark_Create_Inplace` in `libREVLibDriver.so` returns `kFirmwareTooNew` for any year above 26 and sends the error text to the Driver Station. `SparkLowLevel.java` then carries on without throwing ("Don't throw for 2026 season"). Read from the library on 2026-11-04, not run against real firmware.

## Claims by slide

| Slide | Claim | Source |
|---|---|---|
| already-installed | Shortcut is named `2026 WPILib VS Code` | [InstallPageViewModel.cs at v2026.2.1](https://github.com/wpilibsuite/WPILibInstaller-Avalonia/blob/v2026.2.1/WPILibInstaller-Avalonia/ViewModels/InstallPageViewModel.cs), line 941 (`{frcYear} WPILib VS Code`) |
| already-installed | "Project Version" and "WPILib Extension Version" labels | [projectinfo.ts at v2026.2.1](https://github.com/wpilibsuite/vscode-wpilib/blob/v2026.2.1/vscode-wpilib/src/projectinfo.ts) |
| already-installed, map | 2026.2.1 is the newest stable WPILib | [allwpilib releases](https://github.com/wpilibsuite/allwpilib/releases): newer tags are 2027 alphas only |
| install-wpilib | Size, installer labels, separate VS Code, Windows 10/11 64-bit, no Arm, about 150 MB VS Code download | `Z2R/step-2/wpilib-setup.html` |
| install-wpilib | Driver Station does not run on Arm | [Driver Station best practices](https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station-best-practices.html) |
| install-stick | Game Tools ISO name and 1.39 GB size | [NI download page](https://www.ni.com/en/support/downloads/drivers/download.frc-game-tools.html) metadata |
| install-stick | Offline firmware packs, "All versions" label, Import Pack | [RHC2 download page](https://rhc2.revrobotics.com/download/download.html) |
| install-stick | `REVLib-offline-v2026.0.5.zip` | [REVLib install](https://docs.revrobotics.com/revlib/install) |
| install-stick | Event venues likely have no internet | Driver Station best practices |
| install-game-tools | All steps; NI login; Fast Startup | `Z2R/step-2/frc-game-tools.html` |
| install-game-tools | mDNS responder and USB drivers come from Game Tools | [Networking basics](https://docs.wpilib.org/en/stable/docs/networking/networking-introduction/networking-basics.html), [roboRIO network troubleshooting](https://docs.wpilib.org/en/stable/docs/networking/networking-introduction/roborio-network-troubleshooting.html) |
| connections | VH-109 port names | [Ports](https://frc-radio.vivid-hosting.net/tech-specs/ports) |
| connections | CAN yellow to yellow, green to green, ending at a terminator | [CAN wiring basics](https://docs.wpilib.org/en/stable/docs/hardware/hardware-basics/can-wiring-basics.html), KitBot guide 3.4 |
| image-rio1 | All steps; image yearly; firmware only for new units, 5.0 minimum, used only in safe mode | `Z2R/step-3/imaging-your-roborio.html` |
| image-rio2 | All steps; direct imaging unsupported; do not format; team number not set by writing | `Z2R/step-3/roborio2-imaging.html` |
| image-rio2 | Setting properties may be slow or hang | WPILib Known Issues |
| radio | Connection, power and firmware steps | [Quick Start Guide](https://frc-radio.vivid-hosting.net/overview/quick-start-guide), [Upgrading Firmware](https://frc-radio.vivid-hosting.net/overview/upgrading-firmware), `Z2R/step-3/radio-programming.html` |
| radio | Field names; kiosk at events | Programming Your Radio At Home |
| radio | Two firmware files by current version | Firmware releases |
| radio | Access point mode: no battery; wireless is disabled if one is detected | [Wiring Your Radio](https://frc-radio.vivid-hosting.net/overview/wiring-your-radio), Practicing At Home, [LED Status Indications](https://frc-radio.vivid-hosting.net/overview/led-status-indications) |
| radio-firmware | 1.3.0 was the 2025 requirement | [Vivid-Hosting FAQ](https://frc-radio.vivid-hosting.net/overview/support/frequently-asked-questions) |
| radio-firmware | `ERROR -44021 Radio Version` is a harmless bug | WPILib Known Issues |
| rev-firmware-can | Robot off, one SPARK at a time, PDH ID stays default, CAN Bus check | KitBot guide section 3.4 |
| rev-firmware-can | CAN ID 1 to 63, set first; Persist Parameters; REV NEO Brushless | [RHC2 Make it Spin!](https://docs.revrobotics.com/rev-hardware-client-2/guides/run-motor) |
| rev-firmware-can | Firmware 26.x needed; Outdated REV Device; Recovery Mode erases settings | [RHC2 overview](https://docs.revrobotics.com/rev-hardware-client-2), Recovery Mode |
| rev-firmware-can | Brushed mode damages a brushless motor | [SPARK MAX basic configurations](https://docs.revrobotics.com/brushless/spark-max/gs/basic-config) |
| map, already-installed, rev-firmware-can | Phoenix Tuner X lists Windows 11 (21H2+), not Windows 10 | [Phoenix Tuner X](https://v6.docs.ctr-electronics.com/en/stable/docs/tuner/) |
| first-deploy | Project window fields, OneDrive warning, trust prompt | `Z2R/step-4/creating-test-drivetrain-program-cpp-java-python.html` |
| first-deploy | Deploy command; do not power off during a deploy | [Building and Deploying](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/deploying-robot-code.html) |
| first-deploy | Team number in the Setup tab; the three indicators | `Z2R/step-4/running-test-program.html`, [Driver Station](https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station.html) |
| control-loop | 20 ms default period | [TimedRobot.java at v2026.2.1](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/TimedRobot.java) line 69, [Creating a Robot Program](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/creating-robot-program.html) |
| control-loop | "Loop time of 0.02s overrun" | [IterativeRobotBase.java at v2026.2.1](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/IterativeRobotBase.java) line 436 |
| first-enable | Wheels clear, hands clear, others aware | KitBot guide 3.4, RHC2 Make it Spin! |
| first-enable | Enter, Space and E-stop reboot | Driver Station page |
| first-enable | Light is solid when disabled, blinks when enabled | [Status Light Reference](https://docs.wpilib.org/en/stable/docs/hardware/hardware-basics/status-lights-ref.html) |
| first-enable | Getting Started example uses `PWMSparkMax` on ports 0 and 1 | `Z2R/step-4/creating-test-drivetrain-program-cpp-java-python.html` |
| wont-connect | Team number, adapters, firewall, ping order, 172.22.11.2 | roboRIO network troubleshooting, [Windows Firewall](https://docs.wpilib.org/en/stable/docs/networking/networking-introduction/windows-firewall-configuration.html) |
| wont-connect | Reboot when no code is reported on a roboRIO 2 | WPILib Known Issues |
| wont-connect | "Invalid RoboRIO Image Version!" text | [InvalidImageException.java at v2026.2.1](https://github.com/wpilibsuite/GradleRIO/blob/v2026.2.1/src/main/java/edu/wpi/first/gradlerio/deploy/roborio/InvalidImageException.java). Valid images are `2026_v1.2` and `2026_v2.*`, in [WPIExtension.java](https://github.com/wpilibsuite/GradleRIO/blob/v2026.2.1/src/main/java/edu/wpi/first/gradlerio/wpi/WPIExtension.java) line 32 |
| wont-connect | F1 rescan, USB Devices tab | Driver Station page |
| wont-connect | SYS 1 Hz blink means it cannot reach 10.xx.yy.4 | LED Status Indications |
| change-2027 | All rows | PLAN.md, "Changing for 2027" |

The safety wording "say enabling out loud" and "one operator, with a mentor beside them" is our own good practice, not quoted from a source.

## Could not confirm

1. **What RHC2 1.4.4 offers by default for a SPARK MAX.** The app's firmware list could not be inspected without running it, so "the newest choice is 27.0.0" is inferred. Check this on a real laptop.
2. **Whether REVLib 2026.0.5 fails on 27.0.0 firmware.** REV states no compatibility rule. The evidence above points to a mismatch, but it may only warn. No REV page says 27.x is for 2027 only. Downgrading from 27.0.0 to 26.1.5 is also untested.
3. **"DS Version starts with 26."** Inferred from the NI package version (26.0.0) and a forum post of Driver Station 26.0. No primary source shows the string.
4. **microSD slot as the way to tell a roboRIO 2.** Comes from the roboRIO 2.0 spec diagram listing the slot, and the WPILib boot description. No official "how to tell them apart" page was found.
5. **The exact RHC2 screens.** REV's RHC2 "Make it Spin!" page is adapted from the old client, and we have no verified screenshots, so the deck has no images.
6. **NI-PAL security notice.** The NI download page shows a critical notice for "NI driver software 2026 Q2 or earlier". The [NI advisory](https://www.ni.com/en/support/documentation/supplemental/26/required-ni-pal-security-update.html) does not mention FRC Game Tools, so whether Game Tools 2026 is affected is unknown. It is left off the slides.
