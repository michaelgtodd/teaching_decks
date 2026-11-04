# Deck 3 sources

Checked 2026-11-04. Each claim names the place it was read from. "Source" means code at the stated tag.

## Versions

| Claim | Source |
|---|---|
| WPILib 2026.2.1 bundles AdvantageScope v26.0.0, not the latest v26.0.2 | `wpilibsuite/WPILibInstaller-Avalonia`, tag `v2026.2.1`, `scripts/versions.gradle`: `advantagescopeGitTag = 'v26.0.0'` |
| Menu labels and default preferences are the same in v26.0.0 and v26.0.2 | Diff of `src/main/electron/main.ts` labels and `DEFAULT_PREFS` at both tags |

## AdvantageScope labels and behaviour

All source links are `Mechanical-Advantage/AdvantageScope` at tag `v26.0.0`. Docs were read at tag `v26.0.2` and also at https://docs.advantagescope.org

| Claim | Source |
|---|---|
| `File` menu: `Open Log(s)...`, `Add New Log(s)...`, `Connect to Robot`, `Connect to Simulator`, `Download Logs...`, `Use USB roboRIO Address` | `src/main/electron/main.ts`. The docs misspell one as `Add News Log(s)...`; the source spelling is used. |
| The first submenu item reads `Default: NetworkTables 4`, where the docs just say `Default` | `main.ts` `sendAllPreferences`: `"Default: " + getLiveModeName(data.liveMode)`, run when a window becomes ready |
| `App` > `Show Preferences...`, or `AdvantageScope` > `Settings...` on macOS | `main.ts`; https://docs.advantagescope.org/overview/live-sources |
| The `File` menu is visible on Windows and Linux, as a custom title-bar menu | `www/hub.html` `.title-bar-menu` (`App, File, View, Tabs, Window, Help`) |
| Tab names | `src/shared/TabType.ts` `getDefaultTabTitle` |
| A new window opens the docs, Line Graph, 2D Field and 3D Field tabs, so Table and Console must be added with the + button | `src/hub/Tabs.ts` constructor; https://docs.advantagescope.org/overview/navigation |
| Sidebar, Tab Bar, Viewer Pane, Control Pane | https://docs.advantagescope.org/overview/navigation |
| `Left Axis`, `Right Axis`, `Discrete Fields` | `src/hub/controllers/LineGraphController.ts`, `LineGraphController_Config.ts` |
| Preferences labels `Robot Address`, `Robot Log Path`, `Live Mode` | `www/preferences.html` |
| Defaults: address `10.00.00.2`, path `/U/logs`, mode `Low Bandwidth`, source NetworkTables 4 | `src/shared/Preferences.ts` `DEFAULT_PREFS` |
| The window title shows `Searching` until connected | `src/hub/hub.ts`; https://docs.advantagescope.org/overview/live-sources |
| `Ctrl+K` connects to the robot | `main.ts` accelerators; https://docs.advantagescope.org/overview/navigation/keyboard |
| USB address `172.22.11.2`; simulator address `127.0.0.1` | https://docs.advantagescope.org/overview/live-sources |
| `Low Bandwidth` only fetches selected fields; `Logging` must not be used when bandwidth is limited | https://docs.advantagescope.org/overview/live-sources |
| The AdvantageKit source subscribes only to `/AdvantageKit/` and `/Tuning/`, so a plain robot looks empty | `src/hub/dataSources/nt4/NT4Source.ts` |
| Download error text `Failed to open log folder` and `No files found in folder` | `src/download.ts` |
| Log downloads use FTP in 2026 and the file picker takes `.wpilog`, `.hoot`, `.revlog` | `main.ts`; https://docs.advantagescope.org/whats-new |
| Unit names must be a suffix; `Volts` and `Amps` are recognised | https://docs.advantagescope.org/tab-reference/line-graph/units; `src/shared/units.ts` `getUnitForField` |
| NT values in a log sit under `NT`, and DS logs supply `/DSLog/BatteryVoltage` and `/DSLog/Status/Brownout` | `DataLogManager.startNtLog` prefix `NT:`; `src/hub/Sidebar.ts`; `src/hub/dataSources/dslog/dsLogWorker.ts` |

## WPILib

Source is `wpilibsuite/allwpilib` at tag `v2026.2.1`. Docs are `docs.wpilib.org/en/stable`.

| Claim | Source |
|---|---|
| Starting the tool from the command palette | https://docs.wpilib.org/en/stable/docs/software/dashboards/advantagescope.html |
| `10.TE.AM.2`; team 1212 is `10.12.12.2` | https://docs.wpilib.org/en/stable/docs/networking/networking-introduction/ip-configurations.html |
| Console output "does not scale" | https://docs.wpilib.org/en/stable/docs/software/telemetry/telemetry.html |
| 20 ms loop | `TimedRobot.kDefaultPeriod` |
| `periodic()` runs while disabled | `CommandScheduler.run()` returns early only when the scheduler itself is disabled |
| No telemetry is saved by default; `DataLogManager` records all NT changes; joystick logging needs `DriverStation.startDataLog` | https://docs.wpilib.org/en/stable/docs/software/telemetry/datalog.html |
| USB `logs` folder if attached, otherwise `/home/lvuser/logs`; FAT32 only; `FRC_TBD` naming and deletion | `DataLogManager.java`; same docs page |
| USB is checked once, when logging starts | `DataLogManager.makeLogDir`, called from `start` |
| Warning about roboRIO 1 internal storage | `DataLogManager.makeLogDir`: "Logging to RoboRIO 1 internal storage is not recommended!" |
| Logging pauses after 10 seconds with no Driver Station | `DataLogManager.logMain`: "pause logging after being disconnected for 10 seconds". This is in source, not the docs page. |
| Driver Station `Upload WPILogs` | https://docs.wpilib.org/en/stable/docs/software/telemetry/datalog-download.html |
| `@Logged`, `Epilogue.bind`, what gets logged, default NT backend, CAN reads causing overruns | https://docs.wpilib.org/en/stable/docs/software/telemetry/robot-telemetry-with-annotations.html |
| Epilogue is already enabled in the 2026 Java template | `wpilibsuite/vscode-wpilib` tag `v2026.2.1`, `resources/gradle/java/build.gradle`: `annotationProcessor wpi.java.deps.wpilibAnnotations()` |
| `arcadeDrive(x, z)` squares its inputs | `DifferentialDrive.arcadeDrive` passes `squareInputs = true` |
| `PowerDistribution` and `DifferentialDrive` are `Sendable`, so Epilogue logs them | Source of both classes; `epilogue-processor` `SendableHandler` |
| Brownout at 6.3 V (roboRIO 1), default 6.75 V (roboRIO 2), recovery above 7.5 V. The commonly quoted 6.8 V is stage 1, the 6 V rail. | https://docs.wpilib.org/en/stable/docs/software/roborio-info/roborio-brownouts.html |
| Battery internal resistance: ideal under 0.015 ohms, retire over 0.020 ohms | https://docs.wpilib.org/en/stable/docs/hardware/hardware-basics/robot-battery.html |
| Setpoint and process variable terms | https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/introduction-to-pid.html |

## Vendors

| Claim | Source |
|---|---|
| `getAppliedOutput()` and `getOutputCurrent()` return `double` in REVLib 2026 | Compiled against REVLib 2026.0.5; also `REVrobotics/REVLib-Examples` `Open Loop Arcade Drive`, updated January 2026 |
| REV StatusLogger is on by default, writes `.revlog`, and AdvantageScope converts it on open | https://docs.revrobotics.com/revlib/logs |
| `.revlog` files cannot be precisely synchronized with other sources | https://docs.advantagescope.org/more-features/urcl |
| CTRE Signal Logger writes `.hoot`, and non-Pro logs export a limited signal set | https://v6.docs.ctr-electronics.com/en/stable/docs/api-reference/api-usage/signal-logging.html |
| AdvantageScope asks for the CTRE license and warns `Limited Signals Available` | `main.ts`; https://docs.advantagescope.org/overview/log-files |

## 2027 (alpha, for notes only)

| Claim | Source |
|---|---|
| SmartDashboard removed, Telemetry API, Systemcore, recommended dashboards | `PLAN.md`; frc-docs `2027` branch `yearly-changelog.rst` |
| `org.wpilib.epilogue.Logged`, `org.wpilib.system.DataLogManager`, `/home/systemcore/logs` | `wpilibsuite/allwpilib` branch `main` |

## Simulated data

Both are computed in `deck.mjs`. The numbers on the slides are read from the results.

- **Control theory plot.** Second-order model `x'' = wn^2 (setpoint - x) - 2 zeta wn x' - load`, with `wn` 6 rad/s, `zeta` 0.4, and a constant load chosen to stop 8 degrees short of a 90 degree setpoint. Sampled every 20 ms. It is not a model of a real arm. Rise time is 10% to 90% of the final value and settling is a 2% band, the usual conventions: https://www.mathworks.com/help/control/ref/dynamicsystem.stepinfo.html
- **Brownout plot.** Four CIMs (`DCMotor.getCIM`), 8.45:1 and 6 inch wheels (`DifferentialDrivetrainSim`), a 60 A limit, and voltage compensation, on a battery modelled as a voltage behind a resistance. **Assumed, not measured:** 50 kg, and the batteries including wiring (12.3 V at 0.035 ohms, 12.9 V at 0.022 ohms). Brownout is checked every 20 ms, and motors coast when cut, although the code uses brake mode. The sawtooth rhythm comes from that 20 ms check and is not a measurement. The story itself is invented and the slide says so.

## Could not confirm

- **Sign of `getAppliedOutput()` on an inverted SPARK.** No 2026 source states it, so the exercise's done condition does not depend on it and the notes say the line "may" mirror.
- **SPARK current limit behaviour.** The model treats the limit as instant and exact, which the real firmware will not be.
- **Epilogue's generated output.** The compile check confirms it builds, but its output folder is deleted, so the logged path `/Robot/container/drive/...` comes from the docs pattern, not from running it.

## Notes for the lead

- **REV's online Javadoc now shows a 2027 API.** `codedocs.revrobotics.com` lists `getAppliedOutput()` as returning `Signal<Double>`, with `org.wpilib` types and SystemCore paths. It is not evidence for REVLib 2026, and I did not link it. This may affect Deck 7.
- **The AdvantageScope docs and app disagree in small ways.** The docs say "log folder" where the app says `Robot Log Path`, and `Default` where the menu says `Default: NetworkTables 4`. The slides use the app's labels.
- **Epilogue name clashes.** In 2026 the generated `Epilogue` class uses simple class names, so if another deck puts `@Logged` on a class named `Robot`, `RobotContainer` or `CANDriveSubsystem`, a whole-project build will fail. `@Logged(name = "...")` on that class fixes it. Today only deck 3 uses `@Logged`.

## Confirmed by running the code (2026-11-04)

Deck 3's `Robot` ran headless in simulation against WPILib 2026.2.1 and REVLib 2026.0.5, with the left stick held forward:
- Epilogue publishes `Robot/container/drive/BrownedOut`, `getLeftCurrentAmps`, `getRightCurrentAmps`, `Robot/container/PDH/...`, and `Robot/container/drive/drive/Left Motor Speed` and `Right Motor Speed`. These topic names have no leading slash.
- `Left Motor Speed` and `Right Motor Speed` read about 0.48, matching the "about 0.5, not 1" prediction in the exercise notes.
- `Drive/LeftAppliedOutput` and `Drive/RightAppliedOutput` read 0.0 throughout, with no `SparkMaxSim` in the project. The exercise now gives a no-robot path.

Still unconfirmed: the sign of `getAppliedOutput()` on an inverted SPARK on real hardware.
