# FRC Java crash course decks

Mini decks for young FRC teams: WPILib 2026, Java command-based only, with as much control theory as programming. Decks 1 to 7 are the core course, and Decks 8 to 10 go deeper. The Setup lab covers installing and first-time robot setup, and [MENTOR-PREP.md](MENTOR-PREP.md) is the mentor checklist. 2027 and Systemcore appear only as short notes on what's changing.

| # | Deck (PDF) | Slides | Present |
|---|---|---|---|
| 1 | [Your first robot program](docs/pdf/01-first-robot-program.pdf) | 25 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/01-first-robot-program/) |
| 2 | [KitBot drive: command-based Java and a joystick](docs/pdf/02-kitbot-drive.pdf) | 21 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/02-kitbot-drive/) |
| 3 | [AdvantageScope: see what your robot is doing](docs/pdf/03-advantagescope.pdf) | 18 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/03-advantagescope/) |
| 4 | [Driving the KitBot in the WPILib simulator](docs/pdf/04-sim-in-advantagescope.pdf) | 20 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/04-sim-in-advantagescope/) |
| 5 | [Elastic: your robot on a dashboard](docs/pdf/05-elastic.pdf) | 17 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/05-elastic/) |
| 6 | [Arm PID: control theory and a PID + feedforward arm](docs/pdf/06-arm-pid.pdf) | 33 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/06-arm-pid/) |
| 7 | [REV vs CTRE motors and controllers](docs/pdf/07-rev-vs-ctre.pdf) | 19 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/07-rev-vs-ctre/) |
| 8 | [Understanding motors: how to read a motor curve](docs/pdf/08-understanding-motors.pdf) | 20 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/08-understanding-motors/) |
| 9 | [Advanced controls: driver feel, feedforward and where loops run](docs/pdf/09-advanced-controls.pdf) | 20 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/09-advanced-controls/) |
| 10 | [Autonomous path planning libraries](docs/pdf/10-auto-path-planning.pdf) | 18 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/10-auto-path-planning/) |
| | **Total** | **211** | |
| Lab | [Setup lab: install the tools and set up a robot](docs/pdf/setup-lab.pdf) | 14 | [Web](https://michaelgtodd.github.io/teaching_decks/decks/setup-lab/) |

Extras: [Arm PID playground](https://michaelgtodd.github.io/teaching_decks/arm-playground/) (interactive sliders, source in `docs/arm-playground/`) and the [template gallery](docs/pdf/00-template-gallery.pdf) (every slide layout). All of it is listed at [michaelgtodd.github.io/teaching_decks/](https://michaelgtodd.github.io/teaching_decks/).

Each title opens the deck as a PDF, one slide per page. **Web** opens it as a page to present in the browser: arrow keys or a click change slides, N shows the speaker notes, F goes full screen, and `#slide-7` in the address opens slide 7. Everything here is public.

## Check before you teach

Nothing here has run on a real robot. The web pages and PDFs were checked as headless Chromium screenshots of every slide, but no one has presented them on a projector, and no one has opened the playground in a browser yet.

**Worth doing first**
- Work through [MENTOR-PREP.md](MENTOR-PREP.md). Deck 1 needs installed laptops, and a robot for its second half.
- Page through each deck once on the projector you will use. Layout was checked in screenshots, not on a real screen.
- Scan a few QR codes with a phone, from the back of the room. They pass a decoder check, but no phone has tried them.
- Download the PDFs if the shop wifi is unreliable. The web pages need no outside fonts, but they do need the network to load.

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
- All 55 QR codes round-trip through a separate decoder, and all 54 slide links return 200.
- The exported pages render every slide inside the 1920×1080 canvas with no text overflow, and each PDF has one page per slide.

Each deck's `SOURCES.md` lists its sources and anything unconfirmed. Deck 10's popularity numbers are our own count of public repos, and its plot comes from stored run data in `sim-runs.json`.

**Docs links use `docs.wpilib.org/en/stable`, because `/en/2026/` doesn't exist yet. `stable` moves to 2027 at kickoff, so links and QR codes may point at Systemcore pages after that.**

## Layout

- `decks/NN-name/deck.mjs` is the source for a deck. `project/` is generated from it.
- `docs/` is the GitHub Pages site: `docs/decks/` (one viewer page per deck), `docs/pdf/`, `docs/fonts/` (Oswald, Public Sans and Roboto Mono under the OFL, so nothing loads from Google) and the playground. `docs/decks/`, `docs/pdf/` and `docs/index.html` are generated: don't edit them by hand.
- `decks/setup-lab/` is the unnumbered Setup lab.
- `template/` holds the layouts, Java highlighter, QR encoder and build tools. `template/export.mjs` turns each deck's `project/` into the web page and PDF. `template/GUIDE.md` explains how to write a deck.
- `examples/` is a complete WPILib project. Every code slide pulls from it. Open it in WPILib VS Code to build it.
- `PLAN.md` holds the plan and the facts all decks share.

```
node template/build.mjs [deck]        # build decks and enforce fit limits
node template/export.mjs --pdf [deck] # web pages + PDFs in docs/ (PDFs need Playwright)
node template/verify-qr.mjs           # round-trip every QR code
node template/check-links.mjs [deck]  # fetch every link
cd examples && ./gradlew compileJava  # compile all example code (JDK 17)
```
