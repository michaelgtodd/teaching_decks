# Deck 12 sources

Everything below was checked on **2026-11-06**. Prices, stock and library versions change quickly, so check again before reusing a claim.

## Versions pinned

| Thing | Version | Where it came from |
|---|---|---|
| WPILib | 2026.2.1 | `PLAN.md`; source read at tag `v2026.2.1` |
| PhotonLib | v2026.3.4 | WPILib vendor index file `2026/photonlib-v2026.3.4.json` in [wpilibsuite/vendor-json-repo](https://github.com/wpilibsuite/vendor-json-repo), copied unchanged to `examples/vendordeps/photonlib.json`. Its `jsonUrl` is `https://maven.photonvision.org/repository/internal/org/photonvision/photonlib-json/1.0/photonlib-json-1.0.json`. Tag `v2026.3.4`, 2026-04-10, is the newest 2026 release. A tag `v2026.7` (2026-03-31) exists on a side branch and is not in the vendor index, so it was ignored |
| LimelightHelpers | v1.14 | [release tag v1.14](https://github.com/LimelightVision/limelightlib-wpijava/releases), commit `523dfe0`, vendored into `frc/robot/deck12/LimelightHelpers.java` with only the package line and two self-imports changed, and its MIT license added as a header. `main` has one later commit (`919aa4b`) that returns an empty estimate in place of `null`; the deck uses the release, as Limelight's docs say to |
| QuestNav | 2026-2.2.0 docs | `docs/versioned_docs/version-2026-2.2.0` in [QuestNav/QuestNav](https://github.com/QuestNav/QuestNav). No code from it is in `examples/` |
| AdvantageKit vision template | v26.0.2 | `template_projects/sources/vision` in [Mechanical-Advantage/AdvantageKit](https://github.com/Mechanical-Advantage/AdvantageKit) |

## Compile check

**Checked against source, not compiled or run.** This session's network policy blocks every Maven host Gradle needs (services.gradle.org, frcmaven.wpi.edu, maven.photonvision.org, repo1.maven.org and others), so `./gradlew compileJava` could not run and no simulation was run. Instead:

- Every PhotonLib class, constructor and method used was checked in `photon-lib/src/main/java` and `photon-targeting/src/main/java` at PhotonVision tag `v2026.3.4`: `PhotonCamera(String)`, `getAllUnreadResults()`, `PhotonPoseEstimator(AprilTagFieldLayout, Transform3d)`, `estimateCoprocMultiTagPose`, `estimateLowestAmbiguityPose`, `EstimatedRobotPose.estimatedPose / timestampSeconds / targetsUsed`, `PhotonTrackedTarget.getFiducialId()`, `VisionSystemSim(String)`, `addAprilTags`, `addCamera(PhotonCameraSim, Transform3d)`, `update(Pose2d)`, `PhotonCameraSim(PhotonCamera, SimCameraProperties)`, and the `SimCameraProperties` setters, which return `this`.
- WPILib calls were checked at `v2026.2.1`: the five- and seven-argument `DifferentialDrivePoseEstimator` constructors, `update`, `addVisionMeasurement(Pose2d, double, Matrix)`, `getEstimatedPosition`, `AprilTagFieldLayout.loadField`, `getTagPose(int)`, `AprilTagFields.kDefaultField = k2026RebuiltWelded`, `k2026RebuiltAndymark`, `Rotation3d.kZero`, `Matrix.times(double)`, `Units.radiansToDegrees`.
- LimelightHelpers calls were checked in the vendored v1.14 file: `SetRobotOrientation(String, double x6)`, `getBotPoseEstimate_wpiBlue_MegaTag2(String)`, `PoseEstimate.pose / timestampSeconds / tagCount`.
- REVLib, Phoenix 6 and the drivetrain sim are copied from Deck 10, which was compiled and run.
- All seven files pass `javac` at the parse stage (`-XDshould-stop.ifNoError=PARSE`). Symbols were not resolved.

The lead should run `cd examples && ./gradlew compileJava` and the exercise before teaching. The exercise's `done` line describes what the code is built to do, not an observed run.

## What was computed

The `trust` plot is WPILib's own formula, not a simulation. `PoseEstimator.setVisionMeasurementStdDevs` at `v2026.2.1` sets the gain to `q / (q + sqrt(q * r))` with `q` the squared odometry standard deviation and `r` the squared vision one, which equals `odometry / (odometry + vision)`. `addVisionMeasurement` moves the estimate by that fraction of the gap (steps 4 to 7 in the source). The deck applies it 50 times a second to a robot standing still, starting 1 m off, with WPILib's default odometry value of 0.02 m. Results: K = 3.8% at 0.5 m; 14 cm left after 1 s and 2 cm after 2 s at 0.5 m; 47 cm left after 3 s at 4 m. Those numbers are computed in `deck.mjs`.

## Popularity evidence

Raw counts, method, limits and a per-repo record are in `evidence.json`. The scripts that made it are in `evidence-scripts/` (run in that order: `frame.py`, `trees.py`, `analyze.py`, `usage.py`, `evidence.py`).

**Method.** Deck 10 used GitHub repository search. Here, `search/repositories` returned HTTP 502 on every try, and the Git Trees API was closed to repos not attached to the session. So:

1. **Frame.** GitHub code search for files that every 2026 WPILib project has, using no vision term: `build.gradle` with `"edu.wpi.first.GradleRIO" "2026.2.1"` (split by `includeDesktopSupport = true` and `= false` to stay under the 1,000-result cap; the `true` half reported 1,050 and 1,000 were read), `2026.1.1`, `2026.1.1-beta-1`, `"frcYear": "2026" filename:WPILibNewCommands.json`, and `"WPILib-New-Commands" "2026" path:vendordeps`. Union: **1,889 repos, none of them forks**.
2. **Sample.** A seeded random **1,000** (`random.Random(2026)`).
3. **Trees.** Each repo read with `git clone --depth 1 --filter=blob:none` and `git ls-tree`. Only `vendordeps/*.json` and `build.gradle` were fetched. All 1,000 read.
4. **Robot project.** A `build.gradle` with GradleRIO 2026.x, a `vendordeps/` beside it with WPILib-New-Commands, and Java under `src/main/java`: **925 projects from 775 owners**.
5. **Code.** A second pass read every `.java` file of those projects, comments stripped, and looked for what the code creates or calls (see `evidence.json` `method` for each pattern).

| Measure | Repos (of 925) | Owners (of 775) |
|---|---|---|
| PhotonLib vendordep in the repo | 432 (47%) | 389 (50%) |
| `LimelightHelpers.java` in the repo | 280 (30%) | 259 (33%) |
| QuestNav vendordep | 34 (4%) | 31 (4%) |
| None of these three files | 316 (34%) | 274 (35%) |
| Code uses Limelight (LimelightHelpers call, AdvantageKit `VisionIOLimelight`, or `getTable("limelight`) | 312 (34%) | 285 (37%) |
| Code uses PhotonVision on the robot (`new PhotonCamera(` outside AdvantageKit's `VisionIOPhotonVision*` files, or `new VisionIOPhotonVision(`) | 299 (32%) | 274 (35%) |
| Code uses PhotonVision only in simulation | 52 (6%) | 49 (6%) |
| Code uses both Limelight and PhotonVision on the robot | 56 (6%) | 51 (7%) |
| Code creates `QuestNav` | 29 (3%) | 25 (3%) |
| Of those, also use Limelight or PhotonVision | 23 | |
| Code creates WPILib's `AprilTagDetector` | 3 (0.3%) | 3 (0.4%) |
| No camera code of these four kinds | 362 (39%) | 315 (41%) |
| Calls a PhotonVision or Limelight game-piece class method | 17 (2%) | 17 (2%) |
| Uses AdvantageKit | 478 (52%) | 417 (54%) |
| PhotonLib version v2026.3.4 / v2026.3.2 / v2026.2.2 | 116 / 88 / 71 | |

**Why two measures.** A file in a repo does not mean it is used. AdvantageKit's vision template (v26.0.2) contains both a Limelight IO and a PhotonVision IO, ships PhotonLib, and by default creates `VisionIOLimelight` on the real robot and `VisionIOPhotonVisionSim` in simulation. So "PhotonLib in the repo" overstates PhotonVision. Spot checks: `IronDogs-2773-2026/2773-2026` creates PhotonCameras; `DeepBlueRobotics/KitBot2026` calls LimelightHelpers; `CSK-Robotics/2026` has PhotonLib but its code calls only LimelightHelpers. All three were classified correctly.

**How rough it is.** It counts what is in a repo's default branch on 2026-11-06, not what ran at events. Code search indexes only some repos, so the frame is not every 2026 project, but the selection uses no vision term. Private repos are missing. Practice and prototype repos are included, and an owner can have several, so owners are listed. Template code that is present but never run still counts: for example, a swerve template that creates a `PhotonCamera` the team never plugs in. Other languages are out. `addVisionMeasurement` was also counted (595 repos), but the pattern matches method definitions in drive templates too, so it is not used on a slide.

**Polls.** No 2026 poll with results was found. A [Chief Delphi thread, "Photon Lib or Limelight", 2026-03-05](https://www.chiefdelphi.com/t/photon-lib-or-limelight/515605) is anecdote: posters cite cost and availability for PhotonVision, ease and popularity for Limelight, and disagree about Systemcore. A [2025 thread, "Limelight simulation?"](https://www.chiefdelphi.com/t/limelight-simulation/501690) has one team saying they used PhotonVision's simulator behind an interface for a Limelight robot. Neither is used for a number.

## WPILib

| Claim | Source |
|---|---|
| AprilTag basics: Michigan, 36h11 from 2024, 6x6 bits, 6.5 in body, ambiguity, 2D alignment needs no calibration | [What Are AprilTags?](https://docs.wpilib.org/en/stable/docs/software/vision-processing/apriltag/apriltag-intro.html), `stable` branch of frc-docs |
| `apriltag-robots.jpg` (790 x 400) | `source/docs/software/vision-processing/apriltag/images/apriltagrobots_overlay.jpg`, frc-docs `stable` at `4dff7c3`. CC BY 4.0 |
| Estimators are drop-in replacements for odometry; latency compensation; tuning advice for AprilTag poses (huge vision heading, scale x and y by distance) | [Pose Estimators](https://docs.wpilib.org/en/stable/docs/software/advanced-controls/state-space/state-space-pose-estimators.html) |
| Default std devs 0.02, 0.02, 0.01 and 0.1, 0.1, 0.1; 1.5 s buffer; gain formula; timestamp must be on the FPGA epoch | `DifferentialDrivePoseEstimator.java`, `PoseEstimator.java` at `v2026.2.1` |
| Two 2026 layouts, welded is the default | `AprilTagFields.java` at `v2026.2.1` |
| Vision on the roboRIO "can cause performance issues" | [Strategies for Vision Programming](https://docs.wpilib.org/en/stable/docs/software/vision-processing/introduction/strategies-for-vision-programming.html) |
| Systemcore is "the Limelight Systemcore", CM5, onboard IMU | frc-docs branch `2027`, `systemcore-info/systemcore-introduction.rst` |

## PhotonVision

| Claim | Source |
|---|---|
| Docs license CC BY 4.0 (code is GPL-3.0) | `docs/LICENSE` and `LICENSE` at `v2026.3.4` |
| `photonvision-multitag-ui.png` (1900 x 908) | `docs/source/docs/apriltag-pipelines/images/multitag-ui.png` at commit `a5be3d0`. It shows a 2024 field, said on the slide |
| Multi-tag: calibrate, 3D mode, "Do Multi-Target Estimation" on the Output tab, needs an accurate layout, two 2026 layouts and PhotonVision ships welded | `apriltag-pipelines/multitag.md` |
| Estimation strategies, multi-tag recommended, single-tag fallback | `programming/photonlib/robot-pose-estimator.md`; `photonlib-java-examples/poseest` at `v2026.3.4` |
| Strategy constructor and `update()` are `@Deprecated(forRemoval = true, since = "2026")` | `PhotonPoseEstimator.java` at `v2026.3.4` |
| Std devs 4, 4, 8 and 0.5, 0.5, 1 ("Fake values"), distance heuristic `1 + d²/30`, ignore one tag past 4 m | `poseest/.../Constants.java` and `Vision.java`. The deck keeps x and y and makes heading huge, per WPILib |
| Common hardware: Orange Pi 5 4GB, Raspberry Pi 5 2GB, OV9281 for tags, OV9782 for objects | `quick-start/common-setups.md` |
| Global shutter recommended in all cases | `hardware/selecting-hardware.md` |
| Images for Limelight 2, 2+, 3, 3G, 4 | `quick-start/quick-install.md` |
| Object detection on Orange Pi 5 and Rubik Pi 3; 2026 FUEL model, AGPL | `objectDetection/about-object-detection.md` |
| Install from the Dependency Manager; versions must match the coprocessor | `programming/photonlib/adding-vendordep.md`, `troubleshooting/common-errors.md` |
| Java sim scope; not thresholding or brightness; C++ has none | `simulation/simulation-java.md`, `simulation-cpp.md` |
| Web UI at port 5800 | `quick-start/networking.md` |
| Frame timestamps are in the robot's time base via time sync | `PhotonPipelineResult.getTimestampSeconds()` Javadoc |
| 2027 alpha tag `v2027.0.0-alpha-2`, 2026-05-27 | git tags |

## Limelight

`docs.limelightvision.io` and `limelightvision.io` could not be fetched from the shell. Pages were read with WebFetch through search results.

| Claim | Source |
|---|---|
| Model specs: sensors, FOV, LL4 and 3G OV9281 mono global shutter, LL3 and 3A OV5647 color rolling shutter | [Hardware Comparison](https://docs.limelightvision.io/docs/docs-limelight/getting-started/hardware-comparison) |
| Prices and stock on 2026-11-06: LL4 $449, LL3G $400, LL3 $400, LL3A $189, Hailo kits from $95, all "Sold out" | [limelightvision.io/collections/all](https://limelightvision.io/collections/all), [Limelight 4 page](https://limelightvision.io/products/limelight-4) |
| LL4: built-in IMU for MegaTag, Hailo-8 support not included, YOLOv8 80 FPS on Hailo, 20 FPS MobileNet on CPU | Limelight 4 product page |
| LL3A is for FTC, USB-C only | [Limelight 3A page](https://limelightvision.io/products/limelight-3a) |
| AndyMark lists LL4 at $439, out of stock | [AndyMark Limelight 4](https://cdn.andymark.com/products/limelight-4) |
| MegaTag2 needs heading every frame; use `botpose_orb_wpiblue`; example with 360°/s reject and 0.7, 0.7, 9999999; upload field map, set camera pose | [Robot Localization with MegaTag2](https://docs.limelightvision.io/docs/docs-limelight/pipeline-apriltag/apriltag-robot-localization-megatag2) |
| LimelightLib is "a single-file library": copy from the latest release | [LimelightLib](https://docs.limelightvision.io/docs/docs-limelight/apis/limelight-lib) |
| v1.14 returns `null` with no data; timestamp is NT arrival minus reported latency | `LimelightHelpers.java` at v1.14, `getBotPoseEstimate` |
| LimelightHelpers is MIT licensed | `LICENSE` in limelightlib-wpijava |

## QuestNav

| Claim | Source |
|---|---|
| Quest 3S recommended; VIO with cameras and IMU; up to 120 Hz; makers' claim of steadier tracking | `1-getting-started/1-about.md`, 2026-2.2.0 docs |
| Needs adapter, cable, power and a mount; vendordep installed by URL | `2-quick-start.mdx` |
| VIO drifts; reset at a known spot | `8-robot-code.mdx` |
| Sim needs a real headset pointed at the PC | `7-simulation.md` |
| AprilTag tracking is experimental on a branch | `docs/docs/4-apriltag-tracking/1-apriltag-overview.md` on `main` |
| Quest 3S 128 GB $349.99 from 2026-04-19 | [Meta: An Update on Meta Quest Pricing](https://www.meta.com/blog/update-meta-quest-pricing/) |

## AdvantageKit

| Claim | Source |
|---|---|
| Vision template creates `VisionIOLimelight` on the real robot and `VisionIOPhotonVisionSim` in sim | `RobotContainer.java` at `v26.0.2` |

## Could not confirm, so left out

- Prices for the Orange Pi 5, Raspberry Pi 5, OV9281 USB cameras, Rubik Pi 3, regulators and QuestNav adapters. No vendor page with a price could be read. The slides say "Hardware not priced here".
- Whether any Limelight model was in stock on a day other than 2026-11-06. The Limelight collection page summary and product page disagreed on the LL4 label once; a second read of the product page said "Sold out", which the deck uses.
- Any simulator for Limelight. None was found in Limelight's docs; the slide says "None in its docs".
- How vision will run on Systemcore in 2027. A Chief Delphi thread disagrees with itself, so the deck says it is not settled.
- Which 2026 events used the welded or AndyMark field. The gotcha says to find out.
- Any accuracy comparison between products. None is on a slide.
- That the exercise behaves as described. It was not run (see Compile check).
- Links on the `links` slide were not fetched by `check-links.mjs`; Node's fetch is blocked here. Their paths match the source files in frc-docs `stable`, PhotonVision's docs and QuestNav's README.
