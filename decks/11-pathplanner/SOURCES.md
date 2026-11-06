# Deck 11 sources

Checked 2026-11-06 against PathPlanner and PathPlannerLib **v2026.1.2**, the newest tag in `mjansen4857/pathplanner`, and WPILib **v2026.2.1**.

## How the screenshots were made

Every image except two was taken from the real PathPlanner 2026.1.2 Linux build (`PathPlanner-Linux-v2026.1.2.zip` from the GitHub release), run on a virtual display and driven by synthetic mouse and keyboard input. The app opened a copy of `examples/` and saved everything shown, so the files in `examples/src/main/deploy/pathplanner/` are the app's own output, not hand-written:

- `settings.json`: Holonomic Mode off, default constraints 2.0 m/s and 1.5 m/s², and the robot config on the `robot-config` slide.
- `paths/Drive to Hub.path`: (1.6, 6.4) at −45° to (3.3, 4.7) at −27°, control lengths 1.0 m, with the `spinUp` marker at 0.5 running the named command `spinUp`.
- `paths/Back Off.path`: (3.3, 4.7) at 153° to (1.8, 5.6) at 150°, reversed.
- `autos/First Auto.auto`: `Drive to Hub`, named command `launch`, `Back Off`; `resetOdom: true`.
- `navgrid.json`: the 2026 default the app wrote when it switched to the Rebuilt field.

The app was asked to switch to the 2026 field and did; App Settings shows "Rebuilt". The window is 1280×720 because the virtual display had no window manager to maximize it. The `robot-config` screenshot still shows the app's starting Example Path in the background; it was deleted afterwards.

`vendor_dep_manager.png` and `telemetry.png` come from the PathPlanner docs (`Writerside/images/` at v2026.1.2), MIT license ([LICENSE](https://github.com/mjansen4857/pathplanner/blob/v2026.1.2/LICENSE)). They show 2025 versions and an older field, and each slide says so. The Telemetry page could not show live data here because no simulator could run (see below), so the docs image is used for the connected view.

## Robot config values

| Value | Source |
|---|---|
| Mass 27.216 kg (60 lb), trackwidth 26 in | `DifferentialDrivetrainSim.createKitbotSim` at WPILib v2026.2.1 hard-codes `Units.lbsToKilograms(60)` and `Units.inchesToMeters(26)` |
| MOI 0.862 kg·m² | Same method: `12.5 / 2.2 × (10 in)²` for the battery plus `(2.8 × 2 / 2.2 + 2.0) × (13 in)²` for the gearboxes = 0.8622 |
| Wheel radius 0.0762 m, 8.45:1, CIM, 60 A | Deck 10 `Constants.java`, which match Deck 2 and FIRST's 2026 KitBot code (Deck 2 SOURCES.md) |
| True max speed 4.26 m/s | 85% of free speed, as [Robot Config](https://pathplanner.dev/robot-config.html) advises when it can't be measured. Free speed = 5310 rpm (`DCMotor.getCIM`) ÷ 8.45 × 2π × 0.0762 m ÷ 60 = 5.014 m/s |
| Wheel COF 1.2 | The app's default, left alone; the docs say to measure it |
| Bumpers are display only | [Robot Config](https://pathplanner.dev/robot-config.html): "only for visualization purposes in the PathPlanner GUI and are not used in PathPlannerLib" |

## Control theory slide (`accel-limit`)

`deck.mjs` recomputes the app's readouts from `settings.json` using the formula in `lib/widgets/robot_config_settings.dart` (`_calculateMaxAccel`) at v2026.1.2, with WPILib's CIM constants (12 V, 2.42 N·m, 133 A, 2.7 A, 5310 rpm). It gives 11.18 m/s² and 61.9 A, matching the app's "11.2M/S²" and "62A" in the screenshot. In tank mode the app uses two motors per side and two sides. The "loss" torque is the motor torque at the current drawn at true max speed and 12 V, which the app subtracts before comparing with grip.

## PathPlannerLib API (source at v2026.1.2)

| Claim | Source |
|---|---|
| `AutoBuilder.configure(Supplier<Pose2d>, Consumer<Pose2d>, Supplier<ChassisSpeeds>, BiConsumer<ChassisSpeeds, DriveFeedforwards>, PathFollowingController, RobotConfig, BooleanSupplier, Subsystem...)` | `auto/AutoBuilder.java` |
| `PPLTVController(0.02)` for differential drives | [Build an Auto](https://pathplanner.dev/pplib-build-an-auto.html), LTV (Differential) tab |
| `RobotConfig.fromGUISettings()` reads `deploy/pathplanner/settings.json`, throws `IOException, ParseException`; unknown motor throws `IllegalArgumentException` | `config/RobotConfig.java` |
| `buildAutoChooser()` throws if AutoBuilder isn't configured, builds a `PathPlannerAuto` for every file at call time, default option "None" | `auto/AutoBuilder.java`, `buildAutoChooserWithOptionsModifier` |
| Unregistered name: warning "PathPlanner attempted to create a command '…' that has not been registered with NamedCommands.registerCommand" and `Commands.none()` | `auto/NamedCommands.java`, `getCommand` |
| Register named commands before creating any path or auto | [Named Commands](https://pathplanner.dev/pplib-named-commands.html) |
| `EventTrigger(String)` | `events/EventTrigger.java`; [Triggers](https://pathplanner.dev/pplib-triggers.html) |
| `PathPlannerPath.fromPathFile(String)`, `getStartingDifferentialPose()`; file version must be 2025.x (the app writes `"version": "2025.0"`) | `path/PathPlannerPath.java` |
| `AutoBuilder.resetOdom(Pose2d)` flips the pose when the flip supplier is true; `followPath(PathPlannerPath)` | `auto/AutoBuilder.java` |
| The follower builds its trajectory from the `RobotConfig` | `commands/FollowPathCommand.java` (`getIdealTrajectory(robotConfig)`) |
| Telemetry published by path commands | `commands/FollowPathCommand.java` calls `PPLibTelemetry`; app `lib/pages/telemetry_page.dart` sets `127.0.0.1` for Simulator |
| Load autos at startup to avoid delays | [Build an Auto](https://pathplanner.dev/pplib-build-an-auto.html), Load an Auto warning |

## PathPlanner app (docs and source at v2026.1.2)

| Claim | Source |
|---|---|
| Microsoft Store for auto-updates, GitHub releases for manual installs | [Getting Started](https://pathplanner.dev/gui-getting-started.html) |
| Open the robot project root | [Getting Started](https://pathplanner.dev/gui-getting-started.html) |
| Holonomic mode, hot reload "PLEASE … disable this at competition", default constraints | [Settings](https://pathplanner.dev/gui-settings.html) |
| Waypoints, control points, double-click to add, heading, ideal starting and goal end states | [Editing Paths and Autos](https://pathplanner.dev/gui-editing-paths-and-autos.html) |
| Marker commands end when the path ends; autos are a sequential group; deadline uses the first command; press Enter to save a new name | Same page |
| Cards, rename by clicking the name, Manage Events button | [Project Browser](https://pathplanner.dev/gui-project-browser.html) |
| Telemetry graphs and their ranges | [Telemetry](https://pathplanner.dev/gui-telemetry.html) |
| PathPlannerLib through the Vendor Dependency Manager | [PathPlannerLib Getting Started](https://pathplanner.dev/pplib-getting-started.html) |
| Every UI label on a slide (Holonomic Mode, Reversed, RVD, Zoned Event, Reset Odometry, Manage Events, Simulator, Robot) | Read off the screenshots |

## Links

Web search confirmed these pages exist on pathplanner.dev with the expected titles: `gui-editing-paths-and-autos`, `gui-project-browser`, `pplib-named-commands`, `pplib-build-an-auto`, `pplib-triggers`, `pplib-getting-started`. The other four (`robot-config`, `gui-getting-started`, `gui-settings`, `gui-telemetry`) follow the same rule, a Writerside topic file name in lower case, and appear in the site's navigation, but this session could not fetch them: pathplanner.dev was not reachable from the shell, so `check-links.mjs` could not run. All QR codes round-trip through `verify-qr.mjs`.

## Not compiled, not run

- **The Java in `frc/robot/deck11/` has not been compiled.** This session's network policy blocked every Maven server Gradle needs (`services.gradle.org`, `frcmaven.wpi.edu`, `repo1.maven.org`, `maven.revrobotics.com`, `maven.ctr-electronics.com`). Every PathPlannerLib and WPILib call was checked by hand against the source at the tags above. Run `cd examples && ./gradlew compileJava` before teaching.
- **The exercise has not been run.** Nobody has run First Auto in the WPILib simulator, opened the Telemetry page against it, or tried the 1.0 m/s² change. The paths were checked against the field drawing only: they were not checked for collisions with real 2026 field elements beyond the app's drawing.
- **`Launcher` is a stand-in.** Its CAN IDs, brushed motor type and speeds are examples, not FIRST's KitBot mechanism.
- **The robot's start pose** (1.6, 6.4) was chosen to clear the drawing of the field. Whether it is a legal starting position under the 2026 manual was not checked. The notes tell teams to use where their robot really starts.
