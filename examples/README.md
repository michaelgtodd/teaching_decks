# Example code

A complete WPILib 2026.2.1 project, built from the official Java command-based template.
Every code slide pulls from these files by `// #region name` markers, so what's on a slide is what compiles here.

- `src/main/java/frc/robot/deckN/` holds the code for deck N, one package per deck.
- `Main`, `Robot`, `RobotContainer`, `Constants`, `commands/` and `subsystems/` are the unchanged template.
- `vendordeps/` pins REVLib 2026.0.5, Phoenix 6 26.3.0, PathPlannerLib 2026.1.2, ChoreoLib 2026.0.3 and BLine-Lib 0.9.3.
- `WPILib-License.md` is the license the template files refer to.

## To build it

Open this `examples/` folder in WPILib VS Code and run **WPILib: Build Robot Code**.

From a terminal, with JDK 17: `./gradlew compileJava`. The first build needs internet to fetch the vendor libraries.
