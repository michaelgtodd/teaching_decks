# Deck 8 sources

Checked 2026-11-04. Code on slides compiles with `check-deck.sh 8` against WPILib 2026.2.1 and REVLib 2026.0.5, with no deprecation or removal warnings.

## Motor numbers

- CIM, NEO, NEO Vortex and Kraken X60 numbers on the `real-numbers` table are `DCMotor.getCIM`, `getNEO`, `getNeoVortex` and `getKrakenX60` at tag v2026.2.1, and a headless run printed the same values.
- R, Kt and Kv use the formulas in the `DCMotor` constructor.
- REV's own tables agree on the four numbers. [NEO V1.1](https://docs.revrobotics.com/brushless/neo/v1.1): 5676 RPM, 1.8 A, 105 A, 2.6 Nm, 406 W. [NEO Vortex](https://docs.revrobotics.com/brushless/neo/vortex): 6784 RPM, 3.6 A, 211 A, 3.6 Nm, 640 W.
- Peak power on the slides is computed as stall torque × free speed ÷ 4. That gives 386 W for the NEO against REV's 406 W, and the notes say so. The Vortex matches (639 W against 640 W).
- The Kraken row is the non-FOC entry. WPILib's comment cites `store.ctr-electronics.com/announcing-kraken-x60/`, which returned 404 when fetched today, so the row rests on WPILib. A search snippet of WCP's motor performance page shows the same numbers, but that page was not opened.

## KitBot

- ~12.7 ft/s (3.87 m/s): FIRST's [KitBot build instructions](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-build-instructions.pdf), "geared for a top achievable speed of ~12.7 feet per second (3.87 m/s)".
- 8.45:1 and 6 inch wheels: the deck brief, Deck 2, and `KitbotGearing.k8p45` and `KitbotWheelSize.kSixInch` in `DifferentialDrivetrainSim`. 10.71:1 in the exercise is `KitbotGearing.k10p71`.
- 60 A on the drivetrain, and the reason: FIRST's [KitBot code](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-code.zip), `DRIVE_MOTOR_CURRENT_LIMIT = 60`, commented as a reasonable maximum to reduce the likelihood of tripping breakers or damaging CIMs. The feeder and launcher also use 60 A.
- Voltage compensation: FIRST's KitBot code, as in Deck 2.
- FIRST does not say why its 12.7 ft/s is below the free-speed math. AndyMark's user guide bases that figure on a CIM at 4100 RPM (see Deck 4's `SOURCES.md`). Friction and sag as part of the reason are our reasoning.

## Battery, brownouts and breakers

- Brownout at 6.3 V, roboRIO 2 default 6.75 V, recovery above 7.5 V, CAN motor controllers sent a disable, 40 to 50 A per motor at wheel slip: [roboRIO brownouts](https://docs.wpilib.org/en/stable/docs/software/roborio-info/roborio-brownouts.html).
- A battery as a voltage behind a resistance: `BatterySim` in WPILib.
- 120 A main breaker, PDH 40 A channels: [hardware overview](https://docs.wpilib.org/en/stable/docs/controls-overviews/control-system-hardware.html). 40 A breakers on the KitBot: [robot wiring](https://docs.wpilib.org/en/stable/docs/zero-to-robot/step-1/intro-to-frc-robot-wiring.html).
- Breakers trip at a temperature after a set time: [REV Make it Spin](https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin). "So spikes get through" is our reading of that.

## Motor current and battery current

- Smart Current Limit holds phase current, and the 80 A default: [REV Make it Spin](https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin).
- "Average Input Current = Average Phase Current x Duty Cycle", torque follows phase current: [REV locked rotor testing](https://docs.revrobotics.com/brushless/neo/locked-rotor-testing).
- NEO tests ran through a 40 A breaker that "did not trip during any of the tests", and that page graphs limits up to 80 A: same page.
- `getOutputCurrent()` is the current to the motor phases, and can differ from what a PDP reads: [SPARK MAX troubleshooting](https://docs.revrobotics.com/brushless/spark-max/troubleshooting). The deck applies this to the PDH, which measures the same side of the controller.
- Stator and supply current on Talon FX: Deck 7.

## Choosing a limit

- 40 to 60 A for a NEO, 20 to 40 A for a NEO 550: [REV Make it Spin](https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin).
- NEO 550 stall results (20 A survived 220 s, 40 A about 27 s, 60 A about 5.5 s, 80 A about 2 s) and the warning that the times are not guaranteed: [REV locked rotor testing](https://docs.revrobotics.com/brushless/neo/locked-rotor-testing). That test used a 200 A, 12 V DC supply.
- Start drive motors at 20 A and raise it until the wheels break traction: [REV FAQ](https://docs.revrobotics.com/brushless/home/faq).
- Stall heat "can permanently damage a motor in a fraction of a second if not managed correctly": REV locked rotor testing.
- The wheel slip method is ours. **Assumed:** grip of 1.0 and 50 kg. That 60.8 A lands near FIRST's 60 A is a coincidence of those assumptions, and FIRST does not give this as its reason.

## Measured by running code

Run in a private copy of the headless harness, with JUnit under WPILib 2026.2.1 and REVLib 2026.0.5.

| Slide claim | Result |
|---|---|
| `MotorCheck.print()` at 8.45:1 | `5.01 m/s`, `133 A per CIM, 532 A for four` |
| Same `DCMotor` expression at 10.71:1 | 3.956 m/s |
| `DriveLimits.slipAmps()` | 60.77 A |
| `DCMotor.getCurrent(0.6)` | 32.98 A |
| `DifferentialDrivetrainSim.createKitbotSim` at 12 V | 5.118 m/s at 8.45:1, 4.038 m/s at 10.71:1 |
| `CANDriveSubsystem` (deck8) constructs and runs `periodic()` in simulation | No errors |
| `SparkSim`, brushed CIM stalled, `smartCurrentLimit(60)` | 60.00 A at applied output 0.451 |

The 0.451 matches the deck's 45% duty and 27 A. `SparkSim` drifted to 61.28 A at the 100th step, which was not investigated.

## Computed and simulated

All curves are computed in `deck.mjs`.

- **`curve`, `power`, `heat`:** straight lines between the four `DCMotor` numbers, on an ideal 12 V supply. Heat is current squared × R.
- **`voltage-curves`:** free speed and stall torque scaled by voltage. The 0.6 Nm load is a round example we picked.
- **`battery`:** a voltage behind a resistance, using Deck 3's two assumed batteries including wiring (12.9 V at 0.022 ohms, 12.3 V at 0.035 ohms). If Deck 3 changes them, change `FRESH` and `TIRED` here. Launch numbers assume four stopped CIMs and no other load.
- **`two-currents`, `current-limit`, `voltage-comp`:** `simulate()`, first-order DC motor, four CIMs, 8.45:1, 6 inch wheels, ideal supply, no friction, slip or sag. The 50 kg mass and the 12.8 V and 11.2 V batteries are assumptions, stated in the notes.

## Moved from Deck 2

`current-limit` and `voltage-comp`, with `simulate()` and its constants, come from commit 715467a. The plotted SVG paths of both slides were compared with that commit's built slides and are identical. Changes: the fourth `current-limit` callout and both sets of notes.

## Could not confirm

- **Whether `smartCurrentLimit` acts on real hardware in brushed mode.** FIRST sets it on brushed CIMs. REV's Javadoc for 2026.0.5 says "used for brushless only", while REV's Make it Spin page says the 80 A default applies "for any motor that you use". `SparkSim` holds a brushed CIM at the limit, but that is a simulator and not firmware. No REV statement settles it. The `current-limit` slide says to measure, and the Javadoc wording stays off the slides.
- **`WPILib: Simulate Robot Code` printing `MotorCheck` to the console.** `print()` was run through JUnit, not through a `simulateJava` session. That command was denied and not retried.
- **The AM14U6 user guide**, which Deck 2 cites for 8.45:1, returned 403 today, so neither the ratio nor its speed assumption was rechecked here.
- **The curves against a dyno.** They are straight-line models from published numbers.

## Left off the slides on purpose

- The Javadoc conflict above, and why voltage compensation is on leaders only.
- No 2027 slide. The brief made it optional, and the physics doesn't change. `docs.wpilib.org/en/stable` and `github.wpilib.org/allwpilib/docs/release` both move at the 2027 kickoff, so recheck the links then.
