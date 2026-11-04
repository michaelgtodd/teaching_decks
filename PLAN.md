# FRC Java crash course: plan

Seven mini decks for young FRC teams during a mixed workshop (CAD, electrical, programming).
Focus: **Java command-based only**, best practices, and **as much control theory as programming**.

## Target stack (pinned)

| Thing | Version | Notes |
|---|---|---|
| WPILib | **2026.2.1** (latest stable) | GradleRIO 2026.2.1, Java 17, roboRIO |
| REVLib | 2026.0.5 | vendordep `https://software-metadata.revrobotics.com/REVLib-2026.json` |
| Phoenix 6 | 26.3.0 | Latest in the WPILib vendor index on 2026-11-04 |
| Docs links | `docs.wpilib.org/en/stable/...` | `/en/2026/` does not exist yet. `stable` flips to 2027 at kickoff. |

**Decision from the lead mentor:** teach 2026 only. Systemcore kits are not out yet, so 2027 appears
*only* as brief notes on what is changing (the `flag2027` footer and one `change2027` slide per deck).
Never teach 2027 APIs. WPILib 2027 is at Alpha 8 (2026-10-30); treat all of it as subject to change.

## Decks

| # | Folder | Topic | Minutes | Slides |
|---|---|---|---|---|
| 1 | `01-install-and-first-setup` | Installing WPILib, first-time robot setup, QR codes to official docs | 30 | ~16 |
| 2 | `02-kitbot-drive` | Command-based basics, KitBot drivetrain, joystick | 45 | ~20 |
| 3 | `03-advantagescope` | Reading robot data live and from logs | 30 | ~15 |
| 4 | `04-sim-in-advantagescope` | Driving the WPILib simulator in AdvantageScope | 35 | ~16 |
| 5 | `05-elastic` | The Elastic dashboard: live data, choosers, tuning | 25 | ~14 |
| 6 | `06-arm-pid` | Control theory and a PID + feedforward arm | 50 | ~24 |
| 7 | `07-rev-vs-ctre` | REV vs CTRE motors and their on-board capabilities, 2026 | 30 | ~15 |

Every deck follows the same rhythm: cover, outcomes, content, at least one `gotcha`, one `practice`,
one `exercise`, one slide with eyebrow exactly `Control theory`, `change2027`, `recap`, `links` (QR codes).

## Verified facts all decks must agree on

Confirmed 2026-11-04 from primary sources. If you find one wrong, say so in your report.

**WPILib 2026**
- `Command.schedule()` is deprecated: use `CommandScheduler.getInstance().schedule(...)`.
- New: `Subsystem.idle()`, `MathUtil.copyDirectionPow`, 2D `applyDeadband`, a javac plugin catching common mistakes, Epilogue improvements, `DCMotor` entries for X44 and Minion.
- `DifferentialDrive(MotorController, MotorController)` and `(DoubleConsumer, DoubleConsumer)` both exist. `DifferentialDrivetrainSim.createKitbotSim(...)` exists. `ArmFeedforward(ks, kg, kv[, ka])` exists, with `calculate(positionRadians, velocity)`.
- `arcadeDrive(xSpeed, zRotation)`: +x is forward, +z rotation is counter-clockwise. Joystick Y is negative when pushed away, and X is positive to the right, so **both are negated**.
- Windows 10 and 11 (64-bit) are supported for 2026; Windows 10 may be dropped in 2027.
- `DifferentialDrive` does not invert a side for you. One side must be inverted in the motor config.

**2026 KitBot** (official FIRST Java guide, Rev. Feb 3 2026)
- AM14U6 chassis, tank drive, about 12.7 ft/s. **CIM (brushed) motors on SPARK MAX over CAN**, so `MotorType.kBrushed`. Six SPARK MAX total, 4 on the drivetrain.
- Project classes are `CANDriveSubsystem` and `CANFuelSubsystem`; two variants (class-based and inline). We teach inline: command factories on the subsystem.
- Split-stick arcade: left stick Y drives, right stick X turns. `CommandXboxController` on port 0.
- Logitech F310: back switch on `X`, and the Mode light off. With Mode on, the left stick and D-pad swap.
- Set CAN IDs in REV Hardware Client 2 over USB with the robot off, one SPARK at a time.
- CAN bus starts at the roboRIO and ends at a terminator (PDH termination on, or a 120 ohm resistor); yellow to yellow, green to green. Leave the PDH ID at its default.

**REVLib 2026**
- Packages: `com.revrobotics.spark.SparkMax`, `...spark.SparkLowLevel.MotorType`, `...spark.config.SparkMaxConfig`, `...spark.config.SparkBaseConfig.IdleMode`, `...spark.SparkClosedLoopController`, `...spark.SparkBase.ControlType`, `...spark.FeedbackSensor`, `...spark.ClosedLoopSlot`.
- `ResetMode` and `PersistMode` moved to `com.revrobotics.ResetMode` and `com.revrobotics.PersistMode`.
- `setReference()` is deprecated: use `setSetpoint()`.
- Feedforward moved on to the SPARK: `config.closedLoop.feedForward.kV(...)`, also `kS`, `kA`, `kG`, `kCos`, `kCosRatio`. kV is in volts per unit of velocity.
- MAXMotion renames: `cruiseVelocity`, `allowedProfileError`. SmartMotion is gone. `isAtSetpoint`, `setpoint` signals added. Regular PID can set allowed closed-loop error.
- `motor.configure(config, ResetMode.kResetSafeParameters, PersistMode.kPersistParameters)`.
- Creating a SPARK object no longer clears faults automatically.

**Phoenix 6 2026**
- `new Device(int)` and `new Device(int, String)` constructors are deprecated: use the `CANBus` overloads.
- Added `GravityArmPositionOffset`, error-based gain scheduling, `MotionMagicAtTarget`, Dynamic Motion Magic Expo, Kraken X44 sim, `HootAutoReplay`, Tuner X elevator generation. `OptimizeBusUtilization()` defaults to 4 Hz.
- Signal Logger auto-start: roboRIO 1 needs a flash drive, roboRIO 2 is on by default.

**Changing for 2027** (use for notes only; alpha, may change)
- Systemcore replaces the roboRIO; more CAN buses, onboard IMU. 2026 projects must be imported.
- Java 25. Packages move from `edu.wpi.first` to `org.wpilib`. Constants go to ALL_CAPS style.
- Shuffleboard, SmartDashboard, PathWeaver and RobotBuilder removed. **Elastic and AdvantageScope are the recommended dashboards.**
- Telemetry and Tunables APIs replace `SmartDashboard`, `SendableChooser` and `Sendable`; the chooser is `Selectable`.
- Commands v3 is new for Java (v2 remains). OpMode framework added. `robotInit()` removed, use the `Robot()` constructor.
- `set()` is renamed `setThrottle()` on motor controllers. `MotorControllerGroup` removed. `DriverStation` split up.
- Windows 11 is required for the 2027 alphas. Phoenix 6 removes the `int` and `String` device constructors.

## Build and verification

- `node template/build.mjs [deck]` builds and enforces fit limits.
- `node template/verify-qr.mjs` round-trips every QR. `node template/check-links.mjs [deck]` fetches every link.
- **Code on slides comes from `examples/`** through `src: {file, region}`, so one compile covers all of it. See `examples/README.md`.
- **`examples/` is a full WPILib 2026 project** built from the official template. See `examples/README.md`.

**Decision from the lead mentor:** Elastic replaces Shuffleboard as Deck 5, because Shuffleboard is deprecated and removed for 2027.
