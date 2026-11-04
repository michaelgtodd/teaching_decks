# FRC Java crash course decks

Seven mini decks for young FRC teams: WPILib 2026, Java command-based only, with as much control theory as programming. 2027 and Systemcore appear only as short notes on what's changing.

| # | Deck | Slides | Minutes |
|---|---|---|---|
| 1 | [Install WPILib and set up your robot](https://claude.ai/artifact/B3kP9E88gSG9nnMEskWSJ1) | 19 | 30 |
| 2 | [KitBot drive: command-based Java and a joystick](https://claude.ai/artifact/GTK83fawoiqT1J83sS2YZS) | 26 | 45 |
| 3 | [AdvantageScope: see what your robot is doing](https://claude.ai/artifact/JaTKFBgGZosZcVh4rAZYfV) | 18 | 30 |
| 4 | [Driving the KitBot in the WPILib simulator](https://claude.ai/artifact/34wN5wfhF5zk26S62gMEP4) | 20 | 35 |
| 5 | [Elastic: your robot on a dashboard](https://claude.ai/artifact/WZPaHFuaBmtMtApk8vHWng) | 17 | 25 |
| 6 | [Arm PID: control theory and a PID + feedforward arm](https://claude.ai/artifact/Qz8eXkwsVK9YstL5HcFmhJ) | 36 | 50 |
| 7 | [REV vs CTRE motors and controllers](https://claude.ai/artifact/JuXBHuqkLPMZLFdaGe2tVr) | 19 | 30 |
| | **Total** | **155** | **245** |

Extras: [Arm PID playground](https://claude.ai/artifact/GpGsATVF1vZ9P3kZYbxoiH) (interactive sliders, source in `decks/06-arm-pid/playground/`) and the [template gallery](https://claude.ai/artifact/WzcPfnPBQ1gA6uvLpfdEji) (every slide layout).

The deck links are private to the owner until shared. **Share the playground before class**, or the QR code in Deck 6 won't open for students.

## Check before you teach

Nothing here has run on a real robot, and no one has viewed the slides, the animated embed or the playground in a browser yet.

**Worth doing first**
- Page through each deck once. Layout was checked by estimate only.
- Scan a few QR codes with a phone, from the back of the room. They pass a decoder check, but no phone has tried them.
- Export PDFs if the shop wifi is unreliable. Fonts load from the web.

**SPARK firmware (Decks 1, 2, 6, 7)**
- Firmware 27.0.0 shipped on 2026-10-29 and removes conversion factors. The decks say to stay on 26.1.5 (MAX) and 26.1.6 (Flex). That advice is inferred: REV doesn't state how REVLib 2026 behaves on 27.0.0.
- Check what REV Hardware Client 2 offers by default, and whether downgrading a SPARK that's already on 27 works.

**Arm (Deck 6)**
- `kCosRatio(1.0 / 60)` follows REV's docs, but it hasn't run on hardware. REVLib's simulator reads that angle as degrees, so test it on the real arm: with P at 0, the arm should barely drift near flat and near 45°.
- Firmware 27 lists a fix for closed loop using the wrong sensor after a reboot. 26.x may have that bug, so power-cycle a SPARK and confirm the arm still behaves before trusting an onboard loop with a non-primary sensor.
- The gains are for the example arm in simulation. A real arm starts lower.

**Elastic (Deck 5)**
- FIRST's KitBot guide says to Tab out of a box. In Elastic 2026.1.1's source, only Enter or the submit button sends a value, and Enter disables an enabled robot, so the deck teaches the submit button. Try it on a real setup.
- Confirm Elastic appears in the Driver Station `Dashboard Type` list.

**Smaller items**
- `smartCurrentLimit` in brushed mode: FIRST's KitBot code sets it, but REV's Javadoc says "used for brushless only". Measure it (Deck 2).
- Driver Station version text and using the microSD slot to identify a roboRIO 2 (Deck 1).
- The sign of `getAppliedOutput()` on an inverted SPARK (Deck 3).
- Deck 1's Getting Started program uses PWM, so a CAN robot won't move with it. Prepare one robot ahead of time.

## What was verified

- Every example compiles against WPILib 2026.2.1, REVLib 2026.0.5 and Phoenix 26.3.0.
- The drivetrain, telemetry and all three arm versions ran in headless WPILib simulation. Results are in each deck's `SOURCES.md`.
- All 42 QR codes round-trip through a separate decoder, and all 44 slide links return 200.

Each deck's `SOURCES.md` lists its sources and anything unconfirmed.

**Docs links use `docs.wpilib.org/en/stable`, because `/en/2026/` doesn't exist yet. `stable` moves to 2027 at kickoff, so links and QR codes may point at Systemcore pages after that.**

## Layout

- `decks/NN-name/deck.mjs` is the source for a deck. `project/` is generated from it.
- `template/` holds the layouts, Java highlighter, QR encoder and build tools. `template/GUIDE.md` explains how to write a deck.
- `examples/` is a complete WPILib project. Every code slide pulls from it. Open it in WPILib VS Code to build it.
- `PLAN.md` holds the plan and the facts all decks share.

```
node template/build.mjs [deck]        # build decks and enforce fit limits
node template/verify-qr.mjs           # round-trip every QR code
node template/check-links.mjs [deck]  # fetch every link
cd examples && ./gradlew compileJava  # compile all example code (JDK 17)
```
