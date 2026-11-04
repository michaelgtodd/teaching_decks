# Deck 4 sources

Checked 2026-11-04. Tags: WPILib `v2026.2.1`, AdvantageScope `v26.0.2`, frc-docs branch `stable`.
`frc-docs` `main` already describes 2027, so it was not used.

Code in `examples/src/main/java/frc/robot/deck4/` compiled with the approved `check-deck.sh 4` (WPILib 2026.2.1,
REVLib 2026.0.5, Phoenix 26.3.0) with no deprecation or removal warnings. Both exercise edits were also compiled,
then reverted: `this::slewedForward` as the first `driveArcade` argument, with `k5p95` and with `k12p75`.
Nothing has been run in simulation yet.

## Decision: how the simulator gets the motor outputs

**We save the outputs ourselves through `DifferentialDrive(DoubleConsumer, DoubleConsumer)`.** No vendor sim code.

Why not read them from the SPARK:

- REV: "additional code is required to update the applied output or position/velocity".
  https://docs.revrobotics.com/revlib/spark/sim/simulation-getting-started
- REV's Javadoc: `getAppliedOutput()` "will not be updated during simulation unless `SparkSim.iterate(...)` is called".
  https://codedocs.revrobotics.com/java/com/revrobotics/spark/sparkbase
  This site currently shows the 2027 API (`org.wpilib`, `setThrottle`), so treat it as supporting evidence only.
- `SparkMaxSim.iterate` needs a physics velocity fed back in and one sim object per controller. REV's getting-started
  and feature-overview pages use only brushless motors and never mention brushed mode.
  https://docs.revrobotics.com/revlib/spark/sim/revlib-simulation-feature-overview
- Nothing we found says whether `SparkBase.get()` reflects `set()` in 2026 without a sim object, or how it treats inversion.

Why saving them is safe on a real robot: the `MotorController` constructor is only
`this((double output) -> leftMotor.set(output), (double output) -> rightMotor.set(output))`, so the method-reference
version sends the same `set()` calls. The one difference: motors aren't added as Sendable children for LiveWindow.
https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/drive/DifferentialDrive.java

Sign convention: `arcadeDriveIK(1, 0)` gives left = 1, right = 1, and `setInputs` wants positive volts to mean forward on
each side. The saved value is taken before the SPARK applies `inverted(true)`, so neither side is negated. WPILib's
"you MUST negate the right voltage" note is about reading an inverted motor, which we don't do.
https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/drivesim-tutorial/updating-drivetrain-model.html

**Disabled needs handling by hand.** The scheduler cancels the default command on disable and `run()` has no `end`, so
nothing calls `set(0)`. `MotorSafety.check()` returns early when disabled. The saved outputs would therefore persist, and
the sim robot would keep driving. `simulationPeriodic()` zeroes the volts when `DriverStation.isDisabled()`.
https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/MotorSafety.java
https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibNewCommands/src/main/java/edu/wpi/first/wpilibj2/command/CommandScheduler.java

Brushed SPARK objects are still constructed in simulation. A 2024 bug aborted the program when you did this. REV's changelog
for 2024.2.1: "Fixes issue where initializing a SPARK Flex or MAX in brushed mode causes robot simulation to terminate."
https://docs.revrobotics.com/revlib/install/changelog
https://github.com/robotpy/robotpy-rev/issues/55

## KitBot values for `createKitbotSim`

The 2026 KitBot build PDF gives the AM14U6 chassis and "~12.7 feet per second (3.87 m/s)" but **not** the gearing or wheel size.
https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-build-instructions.pdf

Those come from AndyMark's user guide (Jan 10 2026): 8.45:1 "(included)", 12.7 ft/s, 6" HiGrip wheels. Footnote: "AM14U6 speed
estimation is based on calculations using 6" wheels, and one CIM motor per TB Mini S running at 4100 rpm, or 75% of free speed."
Check: 4100 / 8.45 x pi x 0.5 ft / 60 = 12.70 ft/s.
https://documents.andymark.com/ba4541200a971b9831639ab2d15fd7976e32a7bc67ccb858a5261d40d9ac33e3/am-14U6%20UserGuide%20Jan%2010%202026.pdf

So the values are `kDualCIMPerSide`, `k8p45`, `kSixInch`. **`k10p71` is wrong** even though its simulated top speed (13.3 ft/s)
looks closer to 12.7. AndyMark's product page says 8.46:1 in one place; the guide and the gear teeth give 8.45.
https://andymark.com/products/am14u6-6-wheel-drop-center-robot-drive-base-2025-frc-kit-of-parts-drive-base

`createKitbotSim` hard-codes 60 lb, a 26 inch track width and its own moment of inertia estimate. We left those alone.

## Physics and the plot

- `DCMotor.getCIM`: 12 V, 2.42 N m, 133 A, 2.7 A, 5310 rpm.
  https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/system/plant/DCMotor.java
- Drivetrain equation: `LinearSystemId.createDrivetrainVelocitySystem`. With equal volts it reduces to
  dv/dt = (2/m)(C1 v + C2 u), which `fullThrottle()` in `deck.mjs` steps every 20 ms with RK4. WPILib uses Dormand-Prince
  (`rkdp`). The difference is negligible for this one-state linear system, but the two were not compared numerically.
  https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/system/plant/LinearSystemId.java
- Results: top speed 5.12 m/s (16.8 ft/s) at 12 V, time constant 0.13 s at 60 lb, first-step acceleration about 4 g.
- The model has no friction: free current only adjusts Kv, so the model free speed is 5420 rpm against the published 5310.
- 120 lb is a what-if, not a measured KitBot weight. We found no published KitBot weight.
- `update()` integrates the state; `setInputs` clamps to `RobotController.getBatteryVoltage()`, which defaults to 12.0 V in
  simulation (`RoboRioDataInternal.h`). Sag needs `BatterySim`, which we don't use. There is no wall or collision code in the class.
- Full stick is 0.49 output, not 1.0: `DRIVE_SCALE` 0.7, then two-argument `arcadeDrive` squares its inputs. That gives 8.2 ft/s.

## Pose publishing

Struct, not `Field2d`. AdvantageScope: "Geometry data should be published as a byte-encoded struct or protobuf", and its Java example
uses `getStructTopic("MyPose", Pose2d.struct).publish()`. It offers `Field2d` as an alternative, and marks the legacy number array format deprecated.
https://docs.advantagescope.org/tab-reference/2d-field

## Sim GUI labels

- `WPILib: Simulate Robot Code`, `Sim GUI`, `Ok`, the run-button warning, Desktop Support, `includeDesktopSupport`:
  https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/introduction.html
- Robot State, System Joysticks, Joysticks, Map gamepad, Keyboard 0, DS menu, `Keyboard 0 Settings`, axes 1 and 4 for split sticks:
  https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/simulation-gui.html
- From source, `DriverStationGui.cpp`: mode labels (`Disconnected`, `Disabled`, `Autonomous`, `Teleoperated`, `Test`); `Joystick[0]`
  (via `NameSetting`); settings labels `Axes`, `Count`, `Axis 4`, `Increase`, `Decrease`. Keyboard 0 defaults: 3 axes, A/D on axis 0,
  W/S on axis 1 (W negative), E/R on axis 2. Assigning a key clears its other uses. Map gamepad is set automatically for names that
  start with "Xbox" or contain "pad", and the mapped layout puts right X on axis 4.
  https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/simulation/halsim_gui/src/main/native/cpp/DriverStationGui.cpp
- `getRightX` is axis 4 (`XboxController.Axis.kRightX`). A missing axis prints "Joystick axis 4 on port 0 not available, check if
  controller is plugged in" (`DriverStation.java`).

## AdvantageScope labels

- `File` > `Connect to Simulator` > `Default`, "Searching" in the window title, automatic reconnect, timeline unlock:
  https://docs.advantagescope.org/overview/live-sources
- `Ctrl+Shift+K`: https://docs.advantagescope.org/overview/navigation/keyboard
- **Start Tool**, then **AdvantageScope**: https://docs.wpilib.org/en/stable/docs/software/dashboards/advantagescope.html
- Plus button, sidebar search box: https://docs.advantagescope.org/overview/navigation
- `Poses` and the Field setting: https://docs.advantagescope.org/tab-reference/2d-field. `Field` label and the `FRC Fields` group: `www/hub.html` at `v26.0.2`.
- Season fields download in the background when online; Evergreen is bundled; `Asset Download Status...`:
  https://docs.advantagescope.org/more-features/custom-assets
- Blue Wall is the FRC default 2023 to 2026, with +X toward the red wall; Center/Red is the default from 2027:
  https://docs.advantagescope.org/more-features/coordinate-systems

## Could not confirm

1. **Nothing has run.** A brushed `SparkMax` in simulation, `set()` and `configure()` are supported by REV's docs and changelog, but
   are compiled only, not run. If REVLib misbehaves at startup, that is the first place to look.
2. **Window focus is not in any WPILib doc.** The source reads `io.KeysDown` from ImGui, and the sim GUI runs on GLFW. That keys reach only
   the focused window is ordinary desktop behaviour, not something WPILib states. We did not find a primary source saying so for this
   window. Confirm it in the live run.
3. **The exact 2026 field name** in AdvantageScope's list. The asset exists (`Field2d_2026FRCFieldV2`), but its display name is inside a zip we
   did not download, so the slide says "the 2026 field".
4. **Which mode Robot State shows at startup.** `dsAttached` defaults to false in the HAL, so it may be Disconnected or Disabled. Slides say
   "isn't on Teleoperated" instead of naming one.
5. **Whether `includeDesktopSupport` is true in a student's project.** It depends on a checkbox at project creation, so the slide says to check it.
6. **The default 2D field orientation.** Slides say "near the blue end" and "faces the red wall", not left or right.
7. **PLAN.md is right but easy to misread.** "About 12.7 ft/s" is a loaded estimate, not free speed. The model shows 16.8 ft/s at full voltage.

## Confirmed by running the code (2026-11-04)

Deck 4's code ran headless against WPILib 2026.2.1 and REVLib 2026.0.5, using the synced baseline (left side inverted, `TURN_SCALE` 0.8):
- Brushed SPARK MAX objects construct and run in simulation without a crash, closing the open question above.
- Disabled with the stick held: pose stays at (2.0, 4.0).
- Full forward settles at 2.464 m/s.
- Full right stick turns clockwise at about 585 degrees per second.
- Disabling while driving falls to 0.036 m/s within 0.5 s.
