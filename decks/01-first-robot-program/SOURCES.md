# Deck 1 sources

Rebuilt 2026-11-05 to follow WPILib's own documentation. Earlier versions are in git history. Docs were read from the `stable` branch of `wpilibsuite/frc-docs`, and code from `wpilibsuite/allwpilib` at `v2026.2.1`.

## Reuse of WPILib material

The WPILib docs are "licensed under a Creative Commons Attribution 4.0 International License", copyright 2026 FIRST and other WPILib Contributors (`source/conf.py`). These images are unmodified copies in `images/`, and each carries a credit line on its slide.

| Image | Slide | Source in frc-docs |
|---|---|---|
| `new-project-creator.png` | create | `source/docs/software/vscode-overview/images/creating-robot-program/` |
| `sim-gui-with-labels.png` | simulate | `source/docs/software/wpilib-tools/robot-simulation/images/` |
| `dependency-sidebar.png` | vendordep | `source/docs/software/vscode-overview/images/3rd-party-libraries/` |
| `ds-operation-tab.png` | operate | `source/docs/software/driverstation/images/driver-station/` |

`dependency-sidebar.png` shows older library versions, and the slide says so. The Driver Station image shows no robot connected, and the slide says so.

`declarative` uses WPILib's two code samples from "What Is Command-Based Programming?", with long lines wrapped to fit. The caption on `wpilib` quotes "What is WPILib?".

## Slides and sources

| Slide | Claim | Source |
|---|---|---|
| wpilib | Standard library; classes for sensors, motor controllers, Driver Station | What is WPILib? |
| wpilib | Built on the laptop, called cross-compilation | Building and Deploying Robot Code |
| parts | Commands, subsystems, one command per subsystem | What Is "Command-Based" Programming?, Subsystems |
| declarative | Declarative programming | What Is "Command-Based" Programming?, Binding Commands to Triggers |
| scheduler | Four steps, `run()` required in `robotPeriodic()`, 20 ms | The Command Scheduler. `Robot.java` in the commandbased template |
| create | Field names and numbers, OneDrive warning, Desktop Support | Creating your Test Drivetrain Program. Project base name from `templates.json` |
| template | File roles, private subsystem fields | Structuring a Command-Based Robot Project |
| first-line | Template's `configureBindings()` text, `Commands.print` | `RobotContainer.java` in the template, Commands |
| simulate | Sim GUI steps and windows, run button warning, Desktop Support | Simulation GUI page, Introduction to Robot Simulation |
| simulate | Z, X, C and V are buttons 1 to 4 on Keyboard 0 | `simulation/halsim_gui/.../DriverStationGui.cpp` |
| simulate | A is button 1 | `XboxController.java` (generated) |
| simulate | `Commands.print` runs while disabled | `PrintCommand.java`: `runsWhenDisabled()` returns true |
| simulate | Joystick button warning on port 0 | `DriverStation.java` |
| simulate | Robot State has a Disconnected row the screenshot lacks | `DriverStationGui.cpp` |
| simulate | Output appears in the integrated terminal | `vscode-wpilib/src/java/simulate.ts`: `console: 'integratedTerminal'` |
| vendordep | Vendor dependency definition, Dependency Manager steps, build on focus loss | 3rd Party Libraries |
| vendordep | REVLib is in the 2026 list | WPILib's 2026 vendordep listing |
| constants | `public static final`, static import | Structuring a Command-Based Robot Project |
| constants | ID 6 is the KitBot feeder, brushed | FIRST 2026 KitBot Java code, `Constants.java` and `CANFuelSubsystem.java` |
| subsystem | `SubsystemBase`, private hardware, factory naming, `startEnd` | Subsystems, Organizing Command-Based Robot Projects, Commands |
| subsystem | `Create a new class/command`, `Subsystem` | `vscode-wpilib` `package.nls.json`, `commands.json` |
| bindings | Binding behavior, toggles not recommended | Binding Commands to Triggers |
| deploy | Deploy steps, power-off warning, RioLog | Building and Deploying Robot Code |
| operate | Sequence, team number, lights, key commands | Running your Test Program, FRC Driver Station |

## What was run

- `examples/.../deck1/` compiles against WPILib 2026.2.1 and REVLib 2026.0.5.
- `gotcha-import`: the compiler output is real, from removing the import. The `';' expected` text in the notes is also real.
- A headless JUnit run of the deck's code with `XboxControllerSim` and `DriverStationSim`, stepping `CommandScheduler.run()` at 20 ms:
  - `HelloRobotContainer` printed `Hello, robot` once per press, with the button held for five loops.
  - `RobotContainer` set `SparkMax.get()` to 0.3 on the first loop after the press and to 0 on the first loop after release. The results are in `sim-run.json`, which the `timing` plot reads.
  - Disabling with the button held took the output to 0.

## Not confirmed

- **Not run on a real robot.** The headless run has no SPARK MAX attached, and `get()` reports the commanded value.
- **The Simulation GUI was not opened.** The steps come from the docs and source.
- **`Ctrl+.` in `gotcha-import`** is VS Code's standard Quick Fix key. The Java import suggestion was not tried in WPILib's VS Code.
- **The Dependency Manager list** was checked from WPILib's listing, not in VS Code.
