# Deck 1 sources

Rebuilt 2026-11-04 after a newcomer review. Installing and robot setup moved to `decks/setup-lab/`, and mentor prep moved to `MENTOR-PREP.md`. The Setup lab's `SOURCES.md` keeps the full record of those claims.

| Slide | Claim | Source |
|---|---|---|
| open-apps | Desktop shortcut named 2026 WPILib VS Code, separate from everyday VS Code | [WPILib Installation Guide](https://docs.wpilib.org/en/stable/docs/zero-to-robot/step-2/wpilib-setup.html) |
| two-vs-codes | `Ctrl+Shift+P`, then `WPILib` | [Creating a Robot Program](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/creating-robot-program.html) |
| two-vs-codes | The symptom that WPILib commands are missing in everyday VS Code | Inferred: the extension installs into the separate copy |
| make-project | Create a new project, Example, Java, Create a New Folder, Team Number, Generate Project, OneDrive warning | Creating a Robot Program |
| make-project | Getting Started is an example, with only `Main.java` and `Robot.java` | [wpilibjExamples at v2026.2.1](https://github.com/wpilibsuite/allwpilib/tree/v2026.2.1/wpilibjExamples/src/main/java/edu/wpi/first/wpilibj/examples/gettingstarted) |
| make-project | The trust prompt | VS Code behavior. The WPILib page doesn't mention it |
| three-lights | Setup tab, team number, and what each light means | [Driver Station](https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station.html) |
| red-light | `F1` rescans joysticks | Driver Station |
| stop-keys | `Enter` disables, `Space` is E-stop, Space works without window focus, reboot after E-stop | Driver Station |
| turn-it-on | Signal light solid when disabled, blinking when enabled | [Status Light Reference](https://docs.wpilib.org/en/stable/docs/hardware/hardware-basics/status-lights-ref.html) |
| turn-it-on | Getting Started drives `PWMSparkMax` on ports 0 and 1, so a CAN robot stays still | wpilibjExamples at v2026.2.1 |
| sense-decide-act | 20 ms default period, so 50 loops a second | [TimedRobot.java at v2026.2.1](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/TimedRobot.java) |

## Not confirmed

- **Timing.** The 95 minutes and the per-slide cues are the review's estimates, not measurements.
- **No photos.** The deck has no photos of robot parts, so mentors point at the real robot.
