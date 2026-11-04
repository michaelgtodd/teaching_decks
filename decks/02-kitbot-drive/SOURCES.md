# Deck 2 sources

Checked 2026-11-04. Code on slides compiles with `check-deck.sh 2` against WPILib 2026.2.1 and REVLib 2026.0.5, with no deprecation or removal warnings.

On 2026-11-04 the `current-limit` and `voltage-comp` slides moved to Deck 8, and `shaping`, `slew`, `feel-code` and the tuning exercise moved to Deck 9. Notes below about those topics remain as the record of what was checked.

## KitBot hardware and official code

- Four drivetrain motors, six total, one follower per side: [KitBot Java guide](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-java-guide.pdf), section 5.1.
- Six SPARK MAX, ~12.7 ft/s (3.87 m/s): [build instructions](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-build-instructions.pdf), Table 6 and the capabilities list. The build guide itself lists only the 2 superstructure CIMs; the drivetrain count comes from the Java guide.
- Official code: [2026-kitbot-code.zip](https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-code.zip), linked from the [FIRST KitBot page](https://www.firstinspires.org/resources/library/frc/kitbot). `DRIVE_MOTOR_CURRENT_LIMIT = 60`, `DRIVE_SCALING = .7`, `ROTATION_SCALING = .8`, `voltageCompensation(12)`, and the **left** leader inverted.
- 8.45:1 gearing and the 75% speed assumption behind 12.7 ft/s: [AM14U6 user guide, Jan 2025](https://s3.amazonaws.com/docusync-files/95749bc22a781ec35148e6ddbe875dd3284175bd040c26ec6443dc6654af6767/AM-14U6%20UserGuide_K25%20Jan%202025.pdf). This is the 2025 guide; AndyMark's 2026 page lists the ratio as selectable.

## WPILib (tag v2026.2.1 source, and docs)

- `arcadeDrive(x, z)` squares by default and applies a 0.02 deadband: `DifferentialDrive.java`, `RobotDriveBase.java`, and [drive classes](https://docs.wpilib.org/en/stable/docs/software/hardware-apis/motors/wpi-drive-classes.html).
- `copyDirectionPow` formula and `SlewRateLimiter` constructors: `MathUtil.java`, `SlewRateLimiter.java`, [slew rate limiter docs](https://docs.wpilib.org/en/stable/docs/software/advanced-controls/filters/slew-rate-limiter.html).
- 0.1 s motor safety expiration and "Output not updated often enough": `MotorSafety.java`. "Loop time of 0.02s overrun": `IterativeRobotBase.java`. "CommandScheduler loop overrun" and epochs printed by command name: `CommandScheduler.java`.
- Scheduler order, one command per subsystem: `CommandScheduler.java`, [what is command-based](https://docs.wpilib.org/en/stable/docs/software/commandbased/what-is-command-based.html).
- File roles: [structuring a project](https://docs.wpilib.org/en/stable/docs/software/commandbased/structuring-command-based-project.html).
- Creating a project, OneDrive warning: [creating a robot program](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/creating-robot-program.html). "Command Robot" label: `templates.json` at the tag.
- Vendor library labels: [3rd party libraries](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/3rd-party-libraries.html).
- Enter, Space, reboot after E-stop, USB Devices tab, Messages tab: [Driver Station](https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station.html).
- CIM numbers: `DCMotor.getCIM()`. R, Kt and Kv use the same formulas as the `DCMotor` constructor.

## REV

- LED patterns: [status LED](https://docs.revrobotics.com/brushless/spark-max/status-led).
- Sensor error expected with a brushed motor until configured, breakers versus current limits, default 80 A: [Make it Spin](https://docs.revrobotics.com/brushless/spark-max/gs/make-it-spin).
- Wrong motor type can cause damage: [operating modes](https://docs.revrobotics.com/brushless/spark-max/operating-modes), [configuring a SPARK](https://docs.revrobotics.com/revlib/spark/configuring-a-spark).
- SPARK can't detect motor type: [power and motor connections](https://docs.revrobotics.com/brushless/spark-max/specs/power-and-motor-connections).
- New SPARK defaults (CAN ID 0, brushless): [parameters](https://docs.revrobotics.com/brushless/spark-max/parameters), [control interfaces](https://docs.revrobotics.com/brushless/spark-max/control-interfaces).
- Persist timing, reset and persist purpose: [configuring a SPARK](https://docs.revrobotics.com/revlib/spark/configuring-a-spark), [configuring devices](https://docs.revrobotics.com/revlib/configuring-devices).
- REVLib 2026.0.5 firmware warning: [changelog](https://docs.revrobotics.com/revlib/install/changelog). Install URL: [installation](https://docs.revrobotics.com/revlib/install).
- Config pattern: `repos/REVrobotics/REVLib-Examples`, `Java/SPARK/Open Loop Arcade Drive`.

## SPARK firmware

- **Voltage compensation is on leaders only.** The [SPARK MAX 27.0.0 notes](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sm-27.0.0) (2026-10-29, a normal release) say it "Fixes follower mode voltage compensating the applied output twice when voltage compensation is enabled on both the leader and follower". We stay on 26.x this season, so the bug applies. FIRST's KitBot code sets compensation on its followers too, so this is a deliberate difference from it. The same notes also fix followers running "approximately 1% slower than the leader", which remains true on 26.x; the deck doesn't mention it.
- **Pick 26.1.5, not the newest version listed.** This matches Deck 1, and [SPARK MAX 26.1.5](https://github.com/REVrobotics/REV-Software-Binaries/releases/tag/sm-26.1.5) is the last 2026 version. **This advice is inferred.** 27.0.0 "Removes the position and velocity conversion factor parameters", which REVLib 2026 still uses, but REV doesn't state how REVLib 2026 behaves against 27.0.0. The KitBot code here uses no conversion factors, so it is less exposed, but one firmware answer across the course is simpler.
- **The tool is REV Hardware Client 2.** PLAN.md and FIRST's guide say "REV Hardware Client"; the current tool, per Deck 1's research, is [REV Hardware Client 2](https://docs.revrobotics.com/rev-hardware-client-2/guides/run-motor).

## Real symptoms

- CAN ID log lines, verbatim, from a team's March 2026 log (new SPARKs, IDs not set): [Chief Delphi 516263](https://www.chiefdelphi.com/t/robot-code-not-working-with-driver-station/516263). A forum post, but the text is a pasted log.
- F310 Mode light swaps left stick and D-pad: KitBot Java guide, section 3.7. XInput mode: [WPILib joystick docs](https://docs.wpilib.org/en/stable/docs/software/basic-programming/joystick.html). Replug after switching: [Chief Delphi 471254](https://www.chiefdelphi.com/t/how-to-setup-the-logitech-f310-controller-for-commandxboxcontroller/471254).
- `inverted()` has no effect on a follower; `follow(leader)` mirrors output: [SparkBaseConfig Javadoc](https://codedocs.revrobotics.com/java/com/revrobotics/spark/config/sparkbaseconfig).

## Simulated

All curves are computed in `deck.mjs`. Model: first-order DC motor, four CIMs, 8.45:1, 6 inch wheels, ideal supply, no friction, slip or sag. The 50 kg mass and the 12.8 V and 11.2 V batteries are assumptions, stated in the notes. Without friction the model tops out near 5.1 m/s, above FIRST's ~3.87 m/s achievable figure, so read shapes rather than exact values.

## Could not confirm

- **Whether `smartCurrentLimit` acts in brushed mode.** It compiles and FIRST's code sets it on brushed CIMs. REV's Javadoc says "used for brushless only", while REV's Make it Spin page says the 80 A default applies "for any motor that you use". The `sm-*` firmware notes through 27.0.0 don't mention it, and no REV statement settles it. The deck says so and tells teams to log `getOutputCurrent()`.
- **`codedocs.revrobotics.com` is unversioned** and now shows 2027 API (`setThrottle`, `org.wpilib`, `Signal<Double>`). Treat its method list with care for 2026. API shape here was settled by the compile, and its prose was used only for long-standing behaviour.
- **What exactly happens to a CIM in brushless mode.** REV documents the sensor error and damage risk, not the motor's behaviour, so the slide states only the LED symptoms.
- **F310 in D mode.** FIRST and WPILib say to use X. The exact symptom in D mode isn't documented by either; a forum post describes a 4-axis layout, which would leave `XboxController` axis 4 missing. The slide doesn't claim that.
- **Follower symptoms** are reasoned from the physics of two CIMs on one gearbox and REV's `follow` docs. A real case of a persisted follower setting stopping motors: [Chief Delphi 515542](https://www.chiefdelphi.com/t/brushed-cim-motors-with-sparkmax-motor-controllers/515542).
- **What "safe parameters" covers.** REV's docs don't list them, so the deck says only "a known state". This also means we can't confirm that the reset clears voltage compensation left on a follower by earlier code, such as FIRST's. It is the likely result, since the parameter has a default, but check it if you move a robot from that code.
- **The USB lock on the current client.** The [SPARK MAX troubleshooting page](https://docs.revrobotics.com/brushless/spark-max/troubleshooting) describes it as a safety feature inside the SPARK, so the note applies to REV Hardware Client 2, but the client's own Make it Spin page doesn't repeat it.
- **The `@NoDiscard` check on `Command`** exists in source, but `check-deck.sh` did not exercise the javac plugin, so the deck makes no claim about it.
- **`setCANTimeout(250)`.** FIRST's code sets it and REV's example does not. Left out of the baseline, since it isn't needed for correctness as far as we can tell.
- FIRST's zip imports `SparkBase.ResetMode` and `PersistMode`. These compile on 2026.0.5 but are marked for removal, so the deck uses `com.revrobotics.*`.
