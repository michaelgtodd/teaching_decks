# Deck 6 sources

Checked 2026-11-04. WPILib links are at tag `v2026.2.1`. The deck 6 package compiles with `check-deck.sh 6`
against WPILib 2026.2.1 and REVLib 2026.0.5, with no deprecation or removal warnings. That compile is the
authority for every class, method and enum name below.

**Warning for anyone checking REV names:** `codedocs.revrobotics.com` currently tracks REVLib 2027 alpha, not 2026.
It shows no conversion factors, `ControlType` under `SparkLowLevel`, and `Signal<Boolean>` return types. Trust the jar,
not that site, for 2026 signatures.

## The simulation

All curves come from `simulate()` in `deck.mjs`. Callout numbers are read from its results, and `must()` fails the build
if the story stops being true. `playground/index.html` contains the same block, byte for byte.

- NEO constants 12 V, 2.6 N·m, 105 A, 1.8 A, 5676 RPM, and the derivations of R, Kv and Kt:
  [DCMotor.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/system/plant/DCMotor.java)
- Plant, including `J = mL²/3` and `g = 9.8`:
  [SingleJointedArmSim.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpilibj/src/main/java/edu/wpi/first/wpilibj/simulation/SingleJointedArmSim.java),
  [LinearSystemId.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/system/plant/LinearSystemId.java)
- Controller. D acts on error, so a step causes a one-loop kick. The integrator is clamped to `min/ki`, `max/ki`:
  [PIDController.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/controller/PIDController.java)
- `trapezoid()` is a port of
  [TrapezoidProfile.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/trajectory/TrapezoidProfile.java).
  Order of operations follows
  [ProfiledPIDController.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/controller/ProfiledPIDController.java).

Simplifications, all deliberate:
- No friction, so kS is 0. No rotor inertia and no current limit, matching `SingleJointedArmSim`. Peak amps are model values
  a real SPARK would clip.
- The encoder reading is one loop old. Basis: REV's default absolute encoder status period is 20 ms (`SignalsConfig`, seen in a
  third-party mirror of 2026.0.5 source). `SparkSim` also applies output during `iterate()`, which gives the REV sim a similar one-loop lag.
- The ±0.2° noise is made up and seeded. It is labelled as fake on the slide.
- The 1 ms plot assumes no sensor filtering. REV's `averageDepth` and hall filtering would add delay we do not model.

Tuned result, for checking: kP 30, kD 1.2, kG 1.21, kV 1.19, profile 2.5 rad/s and 6 rad/s². From -30° to 45°: within 2° by
0.78 s, within 1° by 0.94 s, 1.2° overshoot, 4.8 V and 17 A peak, 0.005° final error. With no sensor delay: 0.80 s and 0.9° overshoot.

## Claims

| Claim | Source |
|---|---|
| kG 1.21 V and kV 1.19 are physics values | Derived from DCMotor. `must()` checks that the constants round to them |
| Feedback-only is not viable on an arm; feedforward plus feedback is | [WPILib: Tuning a Vertical Arm](https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/tuning-vertical-arm.html) |
| I is rarely recommended; use feedforward for steady-state error | [REV: Getting Started with PID Tuning](https://docs.revrobotics.com/revlib/spark/closed-loop/getting-started-with-pid-tuning) |
| WPILib limits the I term to ±1 by default | `m_minimumIntegral`, `m_maximumIntegral` in PIDController.java |
| `ArmFeedforward` takes its angle from horizontal | [ArmFeedforward.java](https://github.com/wpilibsuite/allwpilib/blob/v2026.2.1/wpimath/src/main/java/edu/wpi/first/math/controller/ArmFeedforward.java) |
| We pass the measured angle, where the Javadoc says setpoint | Our choice: gravity acts on the real arm, and REV's kCos uses the read position. Without a profile the setpoint jumps, so it would be wrong |
| kCos, kCosRatio, zero at flat, kG for elevators only, measuring V1 and V2 | [REV: Feed Forward Control](https://docs.revrobotics.com/revlib/spark/closed-loop/feed-forward-control) |
| kV is not applied in position mode; kCos applies in position and MAXMotion position | FeedForwardConfig Javadoc |
| Onboard loop updates every 1 ms; MAXMotion profile every 10 ms | [REV: Closed Loop Control](https://docs.revrobotics.com/revlib/spark/closed-loop), [MAXMotion](https://docs.revrobotics.com/revlib/spark/closed-loop/maxmotion-position-control) |
| Units table: p per rotation, d per (rotation/ms), velocity in RPM | [REV: Units](https://docs.revrobotics.com/revlib/spark/closed-loop/units) |
| Soft limit names, and that they follow the selected sensor | REV `Java/SPARK/Limits` example, SoftLimitConfig Javadoc, and the compile |
| `setSetpoint`, `ControlType.kPosition`, `kMAXMotionPositionControl`, `cruiseVelocity`, `allowedProfileError` | REV `Java/SPARK/Closed Loop Control` and `Java/SPARK/MAXMotion` examples, and the compile |
| NEO current limit 40 to 60 A, default 80 A | [REV: Make it Spin](https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin) |
| Brushed mode permanently damages a brushless motor | [REV: Basic Configurations](https://docs.revrobotics.com/brushless/spark-max/gs/basic-config) |
| Absolute Encoder Adapter, REV-11-3326; data port wiring | [REV: Data Port](https://docs.revrobotics.com/brushless/spark-max/specs/data-port) |
| V2 through-bore needs its pulse settings; preset `REV_ThroughBoreEncoderV2` | REVLib 2026 changelog, and `Configs.java` in the 2026 StarterBot |
| Enter disables, Space is emergency stop | [WPILib: Driver Station](https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station.html) |
| `SparkMaxSim.iterate` takes velocity in post-conversion units | [REV: Simulation](https://docs.revrobotics.com/revlib/spark/sim/simulation-getting-started) and mirrored `SparkSim` source |
| AdvantageScope Mechanism tab | [docs.advantagescope.org](https://docs.advantagescope.org/tab-reference/mechanism) |
| Mechanism2d and `putData` | [WPILib: Mechanism2d](https://docs.wpilib.org/en/stable/docs/software/dashboards/glass/mech2d-widget.html), `armsimulation` example |

## SPARK firmware 27 and why this deck uses native units

Primary source: [SPARK MAX firmware 27.0.0](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sm-27.0.0), a normal release
from 2026-10-29. SPARK Flex has a matching `sf-27.0.0`. Latest 2026 firmware is `sm-26.1.5` and `sf-26.1.6`. The notes say it removes
position and velocity conversion factors for all sensors, reports native units, and removes the duty cycle zero centered parameter.

**Inference, not a REV statement:** REV does not say how REVLib 2026 behaves against firmware 27. That code using conversion factors
could be off by about 6.28 is our reading of the notes. The deck's advice to stay on 26.1.5 or 26.1.6 this season follows from that.

What we did about it:
- No conversion factors and no `zeroCentered`. `ArmUnits` does all conversion in Java. Unit factor 1.0 is the 26.x default, so this reads
  the same on 26.x and 27.x.
- The RIO versions read the through-bore directly, so their V/rad gains are unchanged from the simulation.
- The SPARK loop runs on the NEO's main encoder in NEO rotations. kCos needs 0 at flat, and a through-bore without zero centering
  wraps to about 0.92 just below flat. That would break position PID, and soft limits too (a forward limit of 0.28 blocks a reading of 0.92).
  REV's docs describe zeroing from an absolute encoder with an initialization sequence.
- SPARK gains scale by `(1/12) × (2π/60)` from V/rad: 30 V/rad would be 0.26 duty cycle per NEO rotation.
- REVLib 2027 alphas also drop conversion factors (`AbsoluteEncoderConfig` on codedocs has no conversion factor methods).

**Possible bug on 26.x.** Firmware 27 lists "Fixes closed loop control using the wrong sensor after a reboot when the closed loop sensor
is not the main encoder and idle mode is brake, the motor is inverted, or the control type is not duty cycle". An arm with an absolute
encoder in brake mode matches that condition, and we tell teams to stay on 26.1.5. The 26.x notes do not mention it and REV documents no
workaround, so this is a possibility, not a fact. Our onboard version uses the main encoder, so the condition does not match it. However, a
reboot zeroes that encoder, so `SparkArmSubsystem` and the RIO versions watch `getStickyWarnings().hasReset`. The safety slide asks teams
to power-cycle the SPARK with the arm safe and confirm it still reads and holds.

Firmware 27 also lists "Fixes kS causing motor output when the velocity setpoint is 0". We set no onboard kS, so this does not affect the code.

## Could not confirm

- **Nothing here has run on hardware or in the Java simulator.** The code compiles, but it has not been executed.
- **`kCosRatio` for a primary encoder.** REV's shorthand says it is "simply" the gear reduction, which could read as 60. REV also says it "is multiplied
  by" the read position and "must convert" position into mechanism rotations, which gives 1/60. We use 1/60. The third-party code found uses factors that already yield
  arm rotations with ratio 1, which fits. No example with a raw reduction was found. Verify on an arm by checking holding at flat and at 45°.
- **kCos units.** REV's feed forward page and Javadoc say volts. REV's Units table says "Volts per Rotation". We follow the first two.
- **SPARK kD.** The Units table implies a factor of 1000 against a per-second gain. We did not rely on that: `SPARK_KD` starts at 0, and the slide says to retune.
- **`hasReset` behaviour.** The Javadoc lists the field without describing it. Whether a rebooted SPARK keeps its setpoint is also undocumented, so the
  reboot code holds in place, and the power-cycle test is what actually proves it.
- **The `inverted` Javadoc note** on `AbsoluteEncoderConfig` says it applies to brushed mode only. REV's StarterBot comments and MAXSwerve template use it on
  brushless motors for direction, so we teach it. Check direction by hand either way, as the gotcha says.
- **`Trigger.and` with a debounced Trigger** is confirmed by source only, not by running it.
- **The sim GUI's Mechanism2d steps.** Notes stay generic because the exact menu path was not confirmed for 2026.
- **The slides and playground were not seen in a browser.** None is installed here. The builder checked fit. The playground and embed scripts were run
  against a stub DOM in Node, with presets, sliders, toggles, pointer drag and copy all exercised, and the embed run through a full cycle. Layout has not been checked by eye.
- **Two facts come from third-party mirrors of REVLib source** (the 20 ms default period, and `SparkSim` behaviour), because REV does not publish it. Names were confirmed by the compile.

## Confirmed by running the code (2026-11-04)

All three arm versions ran headless against WPILib 2026.2.1 and REVLib 2026.0.5, using `SingleJointedArmSim` with the deck's gains, from -30 to 45 degrees.

| Version | Within 2° | Within 1° | Overshoot | Steady error |
|---|---|---|---|---|
| `ArmSubsystem` | 0.50 s | 0.56 s | 1.16° | 0.005° |
| `ProfiledArmSubsystem` | 0.82 s | 0.98 s | 1.19° | 0.005° |
| `SparkArmSubsystem`, kPosition | never | never | 3.76° | 3.76° |

The deck's JS model for the profiled move gave 0.78 s, 0.94 s, 1.2° and 0.005°, so it agrees with the Java to within two 20 ms steps.

**The onboard version's error comes from REVLib's simulator, not the configured ratio.** Predicted and measured:
- With `kCosRatio(1.0 / 60)`, a 45° goal settles at 48.76° and an 80° goal at 91.94°, which is what you get if the cosine term stays near 1.
- With `kCosRatio(360.0 / 60)`, reading the angle as degrees, they settle at 44.59° and 79.42°.

REV's [Feed Forward Control](https://docs.revrobotics.com/revlib/spark/closed-loop/feed-forward-control) page says the ratio "must convert your motor's selected feedback sensor's position into Rotations of the mechanism", so `1 / 60` stays. A public report of the same simulator behavior on 2027 alphas: [SystemcoreTesting #425](https://github.com/wpilibsuite/SystemcoreTesting/issues/425).

**Still unconfirmed:** kCos on real hardware. Nothing here has run on a real SPARK.
