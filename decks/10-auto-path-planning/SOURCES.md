# Deck 10 sources

Everything below was checked on **2026-11-04**. These libraries change quickly, so check again before reusing a claim.

## Versions pinned

| Thing | Version | Where it came from |
|---|---|---|
| WPILib | 2026.2.1 | `PLAN.md` |
| PathPlannerLib | 2026.1.2 | [official vendordep](https://3015rangerrobotics.github.io/pathplannerlib/PathplannerLib.json), [release](https://github.com/mjansen4857/pathplanner/releases/tag/v2026.1.2), and the WPILib vendor index |
| ChoreoLib | 2026.0.3 | WPILib vendor index file `2026/ChoreoLib-2026.0.3.json`, [release](https://github.com/SleipnirGroup/Choreo/releases/tag/v2026.0.3). **Not** the live URL in Choreo's docs: see below |
| BLine-Lib | v0.9.3 | [release](https://github.com/edanliahovetsky/BLine-Lib/releases/tag/v0.9.3), published 2026-11-03. `BLine-Lib.json` at that tag |

### Why `examples/vendordeps/ChoreoLib2026.json` is not the file from Choreo's docs

`https://choreo.autos/lib/ChoreoLib2026.json`, the URL in the [2026.0.3 docs](https://github.com/SleipnirGroup/Choreo/blob/v2026.0.3/docs/choreolib/getting-started.md), now serves `2027.0.0-alpha-3` while still saying `frcYear: 2026`. A [commit on 2026-09-11](https://github.com/SleipnirGroup/Choreo/commits/main/choreolib/vendor_jsons/ChoreoLib2026.json) ("Systemcore transitional release") pointed it at the alpha, and the `main` docs now show `ChoreoLib2027Alpha.json`. The WPILib vendor index still serves 2026.0.3, so the deck says to install from the Dependency Manager, and the pinned file is the vendor index copy.

## Compile check

`scratchpad/deck10/check-deck.sh 10` compiles `frc/robot/deck10/` against WPILib 2026.2.1, REVLib 2026.0.5, Phoenix 26.3.0, PathPlannerLib 2026.1.2, ChoreoLib 2026.0.3 and BLine-Lib v0.9.3 with `-Xlint:deprecation -Xlint:removal`. Result: compiles, no warnings. A throwaway copy of the whole `examples/` project also builds with `./gradlew compileJava` with the three new vendordeps, including Decks 8 and 9. This is the authority for every class, method and signature on the code slides. It caught one wrong guess while writing (`Trajectory.getTotalTime()` does not exist).

## What was run

A headless harness in `scratchpad/deck10/sim` runs the same `CommandScheduler` steps as `Robot.java`, paced at the real 20 ms, on a fresh copy of `frc/robot/deck10/`. The sim is `DifferentialDrivetrainSim.createKitbotSim` as in Deck 4, with `EncoderSim` and `Pigeon2SimState` as sensors. Constants were changed by editing `Constants.java` and rebuilding, the way a student does.

| Slide | Run | Result |
|---|---|---|
| `feedback` plot, `sim-runs.json` | WPILib S-curve, no feedback, healthy | Peak 0.286 m from the plan, ends (5.005, 5.004) |
| `feedback` plot | No feedback, `LEFT_SIDE_STRENGTH` 0.9 | Peak 0.807 m, ends (4.513, 5.642) at 29° |
| `feedback` plot | Feedback on, 0.9 | Peak 0.021 m, ends (5.010, 5.004) |
| `exercise` | `RobotContainer` default auto (PathPlanner), healthy | 0.009 m |
| `exercise` | 0.9, feedback on | 0.006 m |
| `exercise` | 0.9, feedback off | 0.562 m |
| `exercise` notes | Same, alliance Red 1 | 0.009 m. The path is flipped, so `TargetPose` shows on the red side, and the robot's real motion is the same |
| `exercise` | Same, with an empty deploy folder, as in `examples/` | 0.009 m, no navgrid error |
| `timed` | `TimedAuto.driveForward` | 2.52 m in the sim. The sim has no carpet, so this number does not carry to a real robot |
| `gotcha-start` | Sim robot started 10° crooked | True end (4.791, 5.507), 0.55 m off. Odometry says (5.010, 4.999) |
| `gotcha-start` notes | Sim robot started 0.5 m forward | True end (5.510, 4.999). Odometry says (5.011, 4.999) |
| `pathplanner` | `firstAuto()` with `.auto` and `.path` files from PathPlanner's own Java example at v2026.1.2, renamed | Ran to the end on a tank drive. Named command and event marker fired. At most 0.13 m from target against odometry |
| `choreo` | `toHubAndLaunch()` | Marker and `done` triggers fired. Ended (4.999, 4.998). See limits below |
| `bline` | `BLinePaths.toHub` on `SwerveStandIn` | Finished, event fired, ended 0.029 m from the goal. The stand-in applies speeds perfectly, so this proves the API and not tracking |

The simulated kV of 2.35 V per m/s was measured with a step test: 2.345 at 3, 6, 9 and 12 V.

### Limits of those runs

- **No solver run.** The Choreo app was not run, because a solver binary is outside the approved downloads. `toHub.traj` is the WPILib S-curve written into Choreo's schema 3, on top of Choreo's own `test-jsons/trajectory/3/differential.traj`. That tests ChoreoLib's loader, `AutoFactory`, `AutoRoutine` and triggers, and says nothing about solved paths. Choreo's own test file, which is 2 m in 1.33 s from a different robot's config, made the simulated KitBot swing about 30° near the end. That was not investigated.
- **No GUI run.** Neither the PathPlanner app, the Choreo app, BLine Web, the Sim GUI, nor AdvantageScope was opened. `Robot State`, `Autonomous` and `Connect to Simulator` labels come from Deck 4. Only `Alliance Station` and `Blue 1` were checked here, in source (`glass/src/lib/native/cpp/other/FMS.cpp`).
- **No real robot.** Nothing here has run on hardware. The two sensor choices (a through-bore on the roboRIO DIO, a Pigeon 2) are examples that compile. `ENCODER_CYCLES_PER_WHEEL_TURN` depends on which shaft the encoder reads.
- **Fast-time runs lie.** With `SimHooks` stepping faster than real time, the Pigeon sim lags and the robot appears to spin. Pacing at 20 ms fixes it. Students run in real time, so this only affects anyone writing a similar harness.

## Popularity evidence

**Method.** GitHub repository search for `rebuilt in:name language:Java` and `frc in:name language:Java`, in weekly windows from 2025-11-15 to 2026-04-30, gave 1,358 repos, none of them forks. REBUILT is the 2026 game. Each repo's full file tree was then read through the Git Trees API. A repo counts as a robot project if it has a `vendordeps/` folder with `WPILibNewCommands`, and a `build.gradle`: **1,257 projects from 1,027 owners**. Selection is by name and date, so it does not depend on which library a repo uses.

| Measure | Repos (of 1,257) | Owners (of 1,027) |
|---|---|---|
| PathPlanner vendordep | 887 (71%) | 768 (75%) |
| Choreo vendordep | 178 (14%) | 160 (16%) |
| BLine vendordep | 15 (1%) | 15 (1%) |
| None of the three | 309 (25%) | 277 (27%) |
| Own PathPlanner `.path` or `.auto` | 704 (56%) | 642 (63%) |
| Own Choreo `.traj` | 127 (10%) | 112 (11%) |
| BLine vendordep and a path JSON | 14 (1%) | |
| Both PathPlanner and Choreo files | 54 (4%) | 48 (5%) |
| Choreo `.traj` with no ChoreoLib, so followed by PathPlannerLib | 28 (2%) | 26 (3%) |

"Own" leaves out names starting `Example`, `New Path` or `New Auto`, which templates and the app create. 81 repos had only those names. A team that really used a path called `New Path` is missed, so this leans low.

**How rough it is.** It counts what is in a repo, not what ran at events. Private repos and repos with other names are missing. Prototype and practice repos are included, and one team can own several, which is why owners are listed. An owner is usually a team, but it can be a student's own account. Other languages are out, which fits a Java course. It can't see WPILib's own tools, because they need no vendordep. Code search for `TrajectoryGenerator` is too thin to measure them, and PathWeaver can't be measured from `.wpilib.json` either: in a sample of 30 of the 70 repos with those files, nearly all were PathPlanner's `generatedJSON` folder.

**Cross-check.** A second frame was sampled separately, to see whether the name filter drove the result: `2026 in:name language:Java`, created 2026-01-10 to 2026-02-06, 5,561 repos, most of them not FRC. A seeded random 1,200 were read, capped to protect the shared API budget, giving 320 robot projects, 199 of them new. PathPlanner 72%, Choreo 17%, BLine 1%, none 23%, a ratio of 4.3 to 1. The 199 new repos alone: 70%, 18%, 2%, 24%, a ratio of 4 to 1. So the two frames agree, and the deck says four to five times.

**Why not `gh search code`.** It was tried first and was not used. Totals are estimates that go up when a query gets stricter: `"PathplannerLib" path:vendordeps` gave 335, while adding `"frcYear" "2026"` gave 519, with `incomplete_results: false`. Its coverage is also uneven by library: it found only 133 of the 887 PathPlanner repos above (15%), but 103 of the 178 Choreo repos (58%). So its roughly 1.4 to 1 ratio is an artifact, and the direct read's 4 to 5 times is the better figure.

**Polls.** No 2026 poll with results was found. A [2025 Chief Delphi poll](https://www.chiefdelphi.com/t/what-do-you-use-for-autonomous/497145) has the right options, but its vote counts were not readable by the tools here. Threads agree with the pattern but are anecdotes: [Most optimal pathing for REBUILT](https://www.chiefdelphi.com/t/most-optimal-autonomous-pathing-software-for-rebuilt/512363), ["Top-Tier" teams using PathPlanner](https://www.chiefdelphi.com/t/top-tier-teams-using-pathplanner-this-season/518672), [Autonomous Development?](https://www.chiefdelphi.com/t/autonomous-development/518886).

## PathPlanner

| Claim | Source |
|---|---|
| Created by Team 3015; Bézier curves; event markers; AD* pathfinding; hot reload | [Home.md at v2026.1.2](https://github.com/mjansen4857/pathplanner/blob/v2026.1.2/Writerside/topics/Home.md) |
| Install through the WPILib Vendor Dependency Manager | [Getting Started](https://pathplanner.dev/pplib-getting-started.html) |
| Tank through `PPLTVController`; four required methods; flip supplier | [Build an Auto](https://pathplanner.dev/pplib-build-an-auto.html), compile |
| `PPLTVController extends LTVUnicycleController` | `javap` on the 2026.1.2 jar |
| Pathfinding needs `navgrid.json`, and is harder on differential drive | [Pathfinding](https://pathplanner.dev/pplib-pathfinding.html) |
| Paths from code with `waypointsFromPoses` | [Create a Path On-the-fly](https://pathplanner.dev/pplib-create-a-path-on-the-fly.html), run |
| Trajectory generated on the robot in `initialize()` | `FollowPathCommand.java` at v2026.1.2 |
| Named commands, event markers, zones, triggers | [Named Commands](https://pathplanner.dev/pplib-named-commands.html), [Triggers](https://pathplanner.dev/pplib-triggers.html), run |
| Can load Choreo trajectories, no code change in GUI autos | [Choreo Interop](https://pathplanner.dev/pplib-choreo-interop.html) |
| One main developer: 1,040 commits, next highest 16 | [contributors](https://github.com/mjansen4857/pathplanner/graphs/contributors) |

## Choreo

| Claim | Source |
|---|---|
| Time-optimal; swerve or differential | [docs home](https://choreo.autos/) |
| Mathematically optimal path through waypoints, subject to constraints | [Editing Paths](https://choreo.autos/usage/editing-paths/) |
| Robot config inputs, accuracy matters | [Robot Configuration](https://choreo.autos/document-settings/robot-configuration/) |
| The follower is left to the user; examples for swerve and differential | [ChoreoLib getting started](https://choreo.autos/choreolib/getting-started/) |
| `AutoFactory`, `AutoRoutine`, `atTime`, `done`; triggers are WPILib `Trigger` | [AutoFactory](https://choreo.autos/choreolib/auto-factory/), `javap`, run |
| No runtime path generation: ChoreoLib has only loading and following classes | `choreolib/src/main/java` at v2026.0.3. PathPlanner's interop page also calls them "pre-generated" |
| Two main developers: 448 and 318 commits | [contributors](https://github.com/SleipnirGroup/Choreo/graphs/contributors) |
| One team measured paths about 6 to 11% faster | [Chief Delphi, 2026-08-12, post 4](https://www.chiefdelphi.com/t/choreo-vs-pathplanner/523324). An experiment by one team, which says they did not follow through on it |

## BLine

| Claim | Source |
|---|---|
| Point-to-point suite for holonomic drivetrains | [docs home](https://docs.bline.run/) |
| "a holonomic drivetrain, such as swerve or mecanum" | [Prerequisites](https://docs.bline.run/getting-started/prerequisites/) |
| Follows path progress, not a clock. Does not avoid obstacles | Same page |
| PID on remaining distance, handoff radius, cross-track; no feedforward from a plan | `FollowPath.java` class doc at v0.9.3. A search of that file finds no feedforward term |
| Paths can be built at schedule time from a live pose | [Follow Paths](https://docs.bline.run/lib/follow-path/) |
| Event triggers exist at v0.9.3 | `Path.EventTrigger`, `FollowPath.registerEventTrigger`, run. The January announcement said there were none, so that post is out of date |
| Student author, Team 2638, announced 2026-01-05 | [Chief Delphi](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778), `LICENSE` |
| Not in the WPILib vendor index; installed by URL; jars from JitPack | WPILib `vendordep-marketplace/2026.json`, [README](https://github.com/edanliahovetsky/BLine-Lib/blob/v0.9.3/README.md) |
| Fast tuning is the authors' own claim | Same post. The deck says so |

## WPILib

| Claim | Source |
|---|---|
| LTV replaced Ramsete | [LTV Unicycle Controller](https://docs.wpilib.org/en/stable/docs/software/advanced-controls/trajectories/ltv.html) |
| `RamseteController` deprecated for removal | `RamseteController.java` at `v2026.2.1` |
| Swerve notice, pointing to Choreo and PathPlanner | [Path Planning](https://docs.wpilib.org/en/stable/docs/software/pathplanning/index.html) |
| PathWeaver is deprecated | [PathWeaver docs](https://docs.wpilib.org/en/stable/docs/software/pathplanning/pathweaver/index.html), [archived repo](https://github.com/wpilibsuite/PathWeaver) |
| Dependency Manager is the panel name | [3rd Party Libraries](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/3rd-party-libraries.html) |
| SysId measures drivetrain gains | [System Identification](https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/index.html) |
| Sim GUI FMS model defaults to Red 1 | `simulation/halsim_gui/src/main/native/cpp/DriverStationGui.cpp`, `FMSSimModel::FMSSimModel()` at `v2026.2.1` |

## KitBot

| Claim | Source |
|---|---|
| No encoder or gyro in the guide, the build instructions or the code | Searched FIRST's KitBot Java guide (Rev. Feb 3 2026), build guide and both code variants for encoder, gyro, navX, IMU and Pigeon: no hits |
| Timed auto: `driveArcade(...).withTimeout(.25)` | FIRST's KitBot code, `Autos.java` |
| ToughBox Mini S "includes holes for optional encoders" | AndyMark AM14U6 2026 guide |

## Could not confirm, so left out

- That any named top team uses a given library. Forum posts disagree with each other.
- Real tracking accuracy for any library. No library's accuracy is compared on a slide.
- How much use BLine has had since the 2026 season. The sample covers repos created before May 2026, and its docs name six teams without counts.
