# FRC Java crash course decks

Mini decks for young FRC teams: WPILib 2026, Java command-based only, with as much control theory as programming. Decks 1 to 7 are the core course, and Decks 8 to 10 go deeper. The Setup lab covers installing and first-time robot setup, and [MENTOR-PREP.md](MENTOR-PREP.md) is the mentor checklist. 2027 and Systemcore appear only as short notes on what's changing.

| # | Deck | Slides | Minutes |
|---|---|---|---|
| 1 | [Your first robot program](https://claude.ai/artifact/B3kP9E88gSG9nnMEskWSJ1), in two sittings | 20 | 95 |
| 2 | [KitBot drive: command-based Java and a joystick](https://claude.ai/artifact/GTK83fawoiqT1J83sS2YZS) | 21 | 35 |
| 3 | [AdvantageScope: see what your robot is doing](https://claude.ai/artifact/JaTKFBgGZosZcVh4rAZYfV) | 18 | 30 |
| 4 | [Driving the KitBot in the WPILib simulator](https://claude.ai/artifact/34wN5wfhF5zk26S62gMEP4) | 20 | 35 |
| 5 | [Elastic: your robot on a dashboard](https://claude.ai/artifact/WZPaHFuaBmtMtApk8vHWng) | 17 | 25 |
| 6 | [Arm PID: control theory and a PID + feedforward arm](https://claude.ai/artifact/Qz8eXkwsVK9YstL5HcFmhJ) | 33 | 45 |
| 7 | [REV vs CTRE motors and controllers](https://claude.ai/artifact/JuXBHuqkLPMZLFdaGe2tVr) | 19 | 30 |
| 8 | [Understanding motors: how to read a motor curve](https://claude.ai/artifact/B48BWKmNvk9TpxTMFg7GJM) | 20 | 30 |
| 9 | [Advanced controls: driver feel, feedforward and where loops run](https://claude.ai/artifact/YS56vBJqScFo9JWrXdnfQe) | 20 | 35 |
| 10 | [Autonomous path planning libraries](https://claude.ai/artifact/DdUaYbmE7fb19UkBPKJaEk) | 18 | 30 |
| | **Total** | **206** | **390** |
| Lab | [Setup lab: install the tools and set up a robot](https://claude.ai/artifact/LfS8WrtcswnGFNMLMatN1F), one job at a time | 17 | 2.5 to 4 hours |

Extras: [Arm PID playground](https://michaelgtodd.github.io/teaching_decks/arm-playground/) (interactive sliders, source in `docs/arm-playground/`) and the [template gallery](https://claude.ai/artifact/WzcPfnPBQ1gA6uvLpfdEji) (every slide layout).

This repo and the playground are public. The slide links above stay private to the owner until shared from each deck.

## Check before you teach

Nothing here has run on a real robot, and no one has viewed the slides, the animated embed or the playground in a browser yet.

**Worth doing first**
- Work through [MENTOR-PREP.md](MENTOR-PREP.md). Deck 1 needs a finished robot and installed laptops.
- Page through each deck once. Layout was checked by estimate only.
- Scan a few QR codes with a phone, from the back of the room. They pass a decoder check, but no phone has tried them.
- Export PDFs if the shop wifi is unreliable. Fonts load from the web.

**SPARK firmware**
- Use 2026 firmware (26.x) on every SPARK. REVLib 2026 reports firmware 27 as too new, and REVLib 2027 doesn't run on a roboRIO.
- Check that REV Hardware Client 2 can take a SPARK that's already on 27 back to 26.x.

**Arm (Decks 6 and 9)**
- The gains are for the example arm in simulation. A real arm starts lower.
- Deck 9's onboard arm hasn't run on hardware, and REVLib's simulator can't check its gravity term. Try it on a real arm with P at 0: it should barely drift near flat and near 45°.

**Motors (Deck 8)**
- `smartCurrentLimit` in brushed mode: FIRST's KitBot code sets it, but REV's Javadoc says "used for brushless only". Log `getOutputCurrent()` during a short, hard push on a real KitBot.

**Path planning (Deck 10)**
- Install Choreo through the VS Code Dependency Manager and confirm it offers 2026.0.3. The URL in Choreo's docs now serves a 2027 alpha.
- Prepare the exercise as in Deck 6: in a copy of `examples`, set `includeDesktopSupport` to true and make `Robot.java` create `frc.robot.deck10.RobotContainer`. Then run it once in the real Sim GUI.
- `firstAuto()` and `ChoreoPaths` need path files made in the apps, so `RobotContainer` doesn't call them.

**Smaller items**
- Confirm Elastic appears in the Driver Station `Dashboard Type` list, and try its submit button on a real setup (Deck 5).
- Using the microSD slot to identify a roboRIO 2 (Setup lab).
- The sign of `getAppliedOutput()` on an inverted SPARK (Deck 3).

## What was verified

- Every example compiles against WPILib 2026.2.1, REVLib 2026.0.5, Phoenix 26.3.0, PathPlannerLib 2026.1.2, ChoreoLib 2026.0.3 and BLine-Lib 0.9.3.
- The drivetrain, telemetry, roboRIO arms, speed loop, SysId routine and path followers ran in headless WPILib simulation. Results are in each deck's `SOURCES.md`.
- Not run: WPILib's Simulate Robot Code with its GUI for Decks 8 to 10, the path planning apps, and Choreo's solver.
- All 52 QR codes round-trip through a separate decoder, and all 54 slide links return 200.

Each deck's `SOURCES.md` lists its sources and anything unconfirmed. Deck 10's popularity numbers are our own count of public repos, and its plot comes from stored run data in `sim-runs.json`.

**Docs links use `docs.wpilib.org/en/stable`, because `/en/2026/` doesn't exist yet. `stable` moves to 2027 at kickoff, so links and QR codes may point at Systemcore pages after that.**

## Layout

- `decks/NN-name/deck.mjs` is the source for a deck. `project/` is generated from it.
- `docs/` is the GitHub Pages site, which only holds the playground.
- `decks/setup-lab/` is the unnumbered Setup lab.
- `template/` holds the layouts, Java highlighter, QR encoder and build tools. `template/GUIDE.md` explains how to write a deck.
- `examples/` is a complete WPILib project. Every code slide pulls from it. Open it in WPILib VS Code to build it.
- `PLAN.md` holds the plan and the facts all decks share.

```
node template/build.mjs [deck]        # build decks and enforce fit limits
node template/verify-qr.mjs           # round-trip every QR code
node template/check-links.mjs [deck]  # fetch every link
cd examples && ./gradlew compileJava  # compile all example code (JDK 17)
```
