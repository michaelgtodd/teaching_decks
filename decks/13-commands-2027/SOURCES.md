# Deck 13 sources

Checked 2026-11-06 against WPILib **v2027.0.0-alpha-8** (tag dated 2026-10-24, the newest 2027 tag; no beta yet) and the WPILib docs source (`wpilibsuite/frc-docs`, commit `03e2018`, 2026-11-04), which is what docs.wpilib.org/en/latest serves.

## Code

The v3 code is in `examples-2027/src/main/java/frc/robot/deck13/`. **It has not been compiled or run.** `examples-2027/` is not a buildable project, because v3 needs the 2027 libraries and Java 25, and this session could not reach any Maven server anyway. Every call was checked by hand against the source at the tag, and the patterns follow WPILib's own v3 examples, `wpilibjExamples/.../hatchbotcmdv3` and `.../rebuiltcmdv3`. The v2 code on `v2-sequence` is Deck 2's `DriveAutos.java`.

| API used | Source at v2027.0.0-alpha-8 |
|---|---|
| `Mechanism` is an interface: `run(Consumer<Coroutine>)`, `runRepeatedly(Runnable)`, `idle()` (lowest priority, parks), `idleFor(Time)` = `idle().withTimeout(...)`, `setDefaultCommand` | `commandsv3/.../command3/Mechanism.java` |
| `Command.noRequirements(body)`, `Command.requiring(...).executing(...)`, `sequence`, `parallel` (all required), `race` (all optional), `waitFor(Time)`, `waitUntil`, `withTimeout(Time)` (a race with `waitFor`), `LOWEST_PRIORITY = Integer.MIN_VALUE`, default priority 0 | `Command.java` |
| Builder stages: `whenCanceled`, `whenExited`, `withPriority`, `until`, `named` (only `named` produces a `Command`) | `NeedsNameBuilderStage.java`, `StagedCommandBuilder.java` |
| `ParallelGroupBuilder.optional(...)`: "will be canceled once all required commands have finished"; `withAutomaticName()` | `ParallelGroupBuilder.java`, `SequentialGroupBuilder.java` |
| `Coroutine.yield`, `park`, `fork`, `await`, `awaitAll`, `awaitAny`, `wait(Time)`, `waitUntil` | `Coroutine.java` |
| `onCancel` / `onExit` hooks; a cancelled command is never re-mounted | `Command.java` Javadoc; `design-docs/commands-v3.md`, "Command Function Bodies" |
| `Scheduler.getDefault()`, `schedule`, `run`, `cancelAll` | `Scheduler.java` |
| `Trigger.onTrue`, `whileTrue`, …; `CommandGamepad(int)`, `faceDown()`, `getLeftY()`, `getRightX()` | `Trigger.java`, `button/CommandGamepad.java` |
| `MotorController.setThrottle`, `setVoltage(double)`; no `stopMotor()` on the interface | `wpilibj/.../hardware/motor/MotorController.java` |
| `DifferentialDrive(MotorController, MotorController)`, `arcadeDrive(double, double)`, `stopMotor()` calls `feed()` | `wpilibj/.../drive/DifferentialDrive.java` |
| `RobotDriveBase extends MotorSafety` and calls `setSafetyEnabled(true)`; same "Output not updated often enough" message as 2026 | `RobotDriveBase.java`, `MotorSafety.java` |
| `PIDController(kp, ki, kd)` uses a 0.02 s period; `MathUtil.applyDeadband` | `wpimath/.../controller/PIDController.java`, `.../util/MathUtil.java` |
| `Selectable` (`add`, `addDefault`, `getSelected`) and `Tunables.publish` | `tunables/.../tunable/Selectable.java`, `Tunables.java`; used the same way in `hatchbotcmdv3/Robot.java` |
| `TimedRobot` has `utilityInit`/`utilityPeriodic` and no `testInit` | `wpilibj/.../framework/IterativeRobotBase.java` |
| `PWMSparkMax(int)` with `setThrottle` | `drivers/.../motor/PWMSparkMax.java`, as in `hatchbotcmdv3` |
| An auto scheduled in `autonomousInit` "will be automatically canceled when the autonomous mode ends" | Comment in `hatchbotcmdv3/Robot.java` |
| Commands v2 continues as `org.wpilib.command2` | `commandsv2/src/main/java/org/wpilib/command2/` |
| No `SendableChooser` anywhere in the 2027 tree | `git ls-tree` at the tag |
| Java 25 | The repo's GitHub Actions workflows use `java-version: 25` (one job also tests 26). Deck 2's 2027 slide says the same. |

## Claims from the docs and design doc

| Claim | Source |
|---|---|
| v3 is Java only; C++ and Python "can continue to use Commands v2" | [Commands v3 Programming](https://docs.wpilib.org/en/latest/docs/software/commandbased/commands-v3/index.html) |
| v3's `run` "acts like runOnce if the command body never yields"; `runRepeatedly` "corresponds with v2's run factory"; no `periodic()` on mechanisms | Migration guide, "Subsystems Become Mechanisms" |
| Names are required | Migration guide, "The Big Shift"; design doc, "Forced Naming" |
| Priority rules (higher or equal interrupts, lower is discarded), children inherit a higher parent priority, defaults "never above 0" | Migration guide, "Priorities" |
| `await` replaces proxies; children may share the parent's requirements without interrupting it | Migration guide, "Proxy Commands And Smart Requirements" |
| The javac plugin "detects while loops without a call to a yielding method and flags them with a compilation error" | Migration guide warning; `javacPlugin/.../CoroutineYieldInLoopDetector.java` ("a compiler error will be emitted"), which checks `while` loops only |
| Scopes: global, OpMode, command; bindings removed and defaults restored when a scope exits | Design doc, "Scoping" and "Command scopes"; [Scopes](https://docs.wpilib.org/en/latest/docs/software/commandbased/commands-v3/scopes.html) |
| fork: children cancelled with the parent | [Creating Commands](https://docs.wpilib.org/en/latest/docs/software/commandbased/commands-v3/creating-commands.html) |
| Why v3 exists: students write `while` loops inside `execute()` | Design doc, "Problem Statement" |
| OpModes allow selection at the Driver Station | `design-docs/opmodes.md`, Summary and Motivation |

## Unconfirmed

- **Anything about the 2027 release.** All of this is alpha-8. Names, packages and behaviour can change before the 2027 release.
- **`faceDown()` is A on an Xbox controller.** The 2027 `Gamepad` docs only say "Face Down button". WPILib's v3 HatchBot comments pair `faceRight()` with Circle and `faceLeft()` with Square, so the buttons are named by position, and the bottom one is A on an Xbox pad and Cross on a PlayStation pad.
- **Whether a project can use v2 and v3 together.** Neither the docs nor the design doc say, so the deck doesn't.
- **Which vendor libraries support v3** (PathPlannerLib, REVLib, Phoenix) for 2027. Not checked; the `choose` slide says to check.
- **WPILib's recommendation.** The docs don't tell teams which version to use, so the `choose` slide only lists facts.
- **The REVLib 2027 API.** Not used: the motor controllers are passed into each mechanism, and `Robot.java` uses WPILib's `PWMSparkMax`, as WPILib's own v3 examples do.
- Links: the four docs pages appear in the frc-docs source and in web search results for docs.wpilib.org/en/latest. The two GitHub links point at paths that exist at the tag. `check-links.mjs` could not run from this session. All QR codes round-trip through `verify-qr.mjs`.
