# Deck 9 sources

Checked 2026-11-04. Stack: WPILib 2026.2.1, REVLib 2026.0.5, Java 17, roboRIO.
Docs links use `docs.wpilib.org/en/stable`, which moves to the next season at kickoff.

## What was moved, and from where

| Slide | From (commit 715467a) | Changed |
|---|---|---|
| `shaping` | Deck 2 `shaping` | Plot paths identical. Label moved off its curve. Notes reordered, picture first. |
| `slew` | Deck 2 `slew` | Plot paths identical. Label moved off its curve. Axis says simulated. The note about the three-argument `SlewRateLimiter` is gone (see "Corrected" below). |
| `feel-code` | Deck 2 `feel-code` | Region unchanged, title and third callout reworded. |
| `exercise` | Deck 2 `exercise` | Tasks unchanged. Notes point at the dead spot in the cubed stick. |
| `onboard-faster` | Deck 6 `onboard-faster` | Plot paths identical. Axis says simulated. Title reworded, notes open with a picture. |
| `spark-config` | Deck 6 `spark-config` | Region unchanged. Title and fourth callout reworded. Notes shortened, picture first. |

Deck 6's `simulate()` was trimmed to what this plot uses, so `armRun` here is P only. Its output
matches the original path for path.

## Models

- **Drivetrain.** `simulate()` is Deck 2's, unchanged: four CIMs (`DCMotor.getCIM`), 8.45:1, 6 inch
  wheels, an assumed 50 kg, no friction, slip or sag. It drives only the `slew` plot.
- **Drivetrain with friction.** `speedRun`, `advance` and `afterLosses` add an assumed 1 V of friction
  and an assumed 80 N push. `kV` is gearing over motor Kv and wheel radius. `kA` is motor resistance
  times wheel radius and mass, over motor count, gearing and Kt. `DriveSim.java` does the same in Java.
- **SysId.** `sysIdTest` runs the default ramp and step, stopped at 6 s and 1.5 s to fit the floor.
  `fitSysId` is least squares on next speed against speed, volts and sign of speed, the form the SysId
  tool uses, with kV, kS and kA recovered from the three coefficients.
- **Arm.** Deck 6's arm: NEO (`DCMotor.getNEO`), 60:1, uniform 0.8 m, 4 kg bar. The encoder reading is
  one loop old. It has no sensor filtering, so `onboard-faster` shows the idea and not a robot result.
- **S-curve.** `TrapezoidProfile` port from Deck 6, then a moving average of speed over
  max acceleration divided by jerk, which caps jerk and keeps the distance. The swing is the arm's soft
  limits, -25 to 100 degrees. The jerk of 30 rad/s cubed was picked for the example.

`deck.mjs` reads gains, limits and stick settings from `Constants.java`, and fails the build if the
model stops agreeing with them or with the measured results below.

## Measured by running the code

Headless WPILib simulation of the `deck9` package: `HAL.initialize`, `SimHooks.pauseTiming`,
`DriverStationSim` enabled, `CommandScheduler.run` every 20 ms. Students' gain changes were made by
editing `Constants.java`, as the exercise does.

| Run | Result | Used on |
|---|---|---|
| `holdSpeed(2)`, gains as shipped, push at 2 s | 1.999 m/s, then 1.892 | `ff-plot` |
| KP 0 | 1.996 m/s, then 1.615 | `ff-plot` |
| KS, KV, KA all 0 | 1.318 m/s, then 1.211 | `ff-plot`, `sim-exercise` |
| KS and KA 0 | 1.879 m/s | `sim-exercise` notes |
| KA 0 | 1.999 m/s | `sim-exercise` notes |
| KP 15 and KP 16, with the push | 1.948 and 1.951 m/s | `sim-exercise` notes, done check |
| `VelocityRobotContainer`, simulated gamepad: A, then A and Y | 1.999, then 1.892 m/s, both sides | `sim-exercise` |
| Same, full stick | 3.498 m/s | |
| Same, 0.3 stick | 0.048 m/s at 1.11 V | `speed-loop` notes |
| Same, full turn | +2.798 and -2.798 m/s | |
| Left encoder reporting the wrong sign | Left 4.69 m/s at 12 V, right holds 1.999 | `gotcha-encoder` |
| Real `SysIdRoutine`, all four tests, then the same fit in Java | kS 1.027, kV 2.337, kA 0.556 | `sysid` notes |
| The same slow test, 6 s | 4.81 m, peak 2.02 m/s | `sysid` notes (model gives 4.83 m) |
| `FeelRobotContainer`, simulated gamepad, full stick | 0.700 output, reached in 0.24 s | `feel-code` |

The model and the Java agree to within 0.01 m/s at every point in the first three rows.

`SparkArmSubsystem` was compiled but not run. The `onboard-faster` plot is the JS model of a 1 ms P
loop, not that class.

## Claims and where they come from

| Claim | Source |
|---|---|
| `applyDeadband` rescales, `copyDirectionPow` keeps the sign | `MathUtil.java` at `v2026.2.1` |
| `arcadeDrive(x, z)` squares its inputs by default | `DifferentialDrive.java` at `v2026.2.1` |
| The slew limiter goes on forward, not turning | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/filters/slew-rate-limiter.html |
| Volts = kS + kV × speed + kA × acceleration | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/introduction.html |
| kS is nearly impossible to model and must be measured | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/controllers/feedforward.html |
| Quasistatic and dynamic tests, forward and back. 1 V/s and 7 V defaults | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/creating-routine.html and `SysIdRoutine.java` at `v2026.2.1` |
| A drive needs 10 to 20 feet and can't be measured on blocks | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/running-routine.html |
| Suggested P and D gains come from LQR and are a starting point | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/analyzing-gains.html |
| `calculateWithVelocities` and the plain `calculate(velocity)` | `SimpleMotorFeedforward.java` at `v2026.2.1` |
| FIRST's KitBot code reads no encoders | The word does not appear in any `.java` file in FIRST's 2026 KitBot code zip, or in its Java or build guides |
| Through Bore Encoder: 2048 cycles per turn | https://docs.revrobotics.com/rev-crossover-products/sensors/tbe/specs |
| The SPARK's loop updates every 1 ms. REV recommends as much on the controller as possible | https://docs.revrobotics.com/revlib/spark/closed-loop |
| WPILib's `kG` is REV's `kCos`, and `kCosRatio` | https://docs.revrobotics.com/revlib/spark/closed-loop/feed-forward-control |
| WPILib ships `TrapezoidProfile` and `ExponentialProfile`, no S-curve | `wpimath` trajectory package at `v2026.2.1` |
| MAXMotion position mode is trapezoidal | `MAXMotionConfig.java`, REVLib 2026.0.5 |
| Setting jerk turns Motion Magic into an S-curve, and it takes longer | https://v6.docs.ctr-electronics.com/en/stable/docs/api-reference/device-specific/talonfx/motion-magic.html |
| Pick the easiest strategy that works on the field | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/picking-control-strategy.html |
| State-space, LQR, and that kV and kA are already a model | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/state-space/state-space-intro.html |

## Corrected while moving

Deck 2's `slew` notes said the three-argument `SlewRateLimiter` helps with stopping. It sets separate
rates for rising and falling values, so a slow rise and a fast fall help when stopping from forward
and do the opposite in reverse. That sentence was dropped.

## Assumptions and things not confirmed

- **Nothing here has run on a real robot.** All results are simulated. Friction, the push, the mass, the
  spin inertia and the track width are assumed.
- 1 V of kS is an assumed value, not a measurement of a KitBot.
- `DriveSim` uses the full `DifferentialDrivetrainSim` constructor because `createKitbotSim` fixes the
  mass at 60 lb, which would not match the 50 kg model.
- The simulator does not model `Encoder.setReverseDirection`, so the backward-encoder run was made by
  flipping the sign in a temporary copy of `DriveSim`. Students must check direction on the real robot.
- `kCosRatio` follows REV's docs and has not been checked on hardware.
- Whether a Through Bore Encoder physically fits a KitBot wheel shaft was not checked. The example
  only assumes one encoder per side on the wheel shaft.
- The SysId app itself was not run, because it is a desktop tool. The fit here uses its method on the
  same data, without its filtering or its motion threshold.
