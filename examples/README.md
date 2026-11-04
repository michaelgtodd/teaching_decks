# Example code

Every code slide pulls from these files by `// #region name` markers, so what's on the slide is what's here.
There is one package per deck under `frc.robot`.

## Status: not compiled yet

Each API call was checked against WPILib, REV and CTRE source or Javadoc, but no compiler has run on this code.

## To compile it (about 5 minutes on any machine with WPILib 2026)

1. In WPILib VS Code: **Create a new project**, Template, Java, Command Robot, team number 0.
2. Copy `examples/src/main/java/frc/robot/deck*` into that project's `src/main/java/frc/robot/`.
3. Manage Vendor Libraries: install **REVLib** and **CTRE Phoenix 6**.
4. Run **WPILib: Build Robot Code**.

The template's own `Robot.java` keeps using the template's `RobotContainer`, so these packages compile
alongside it without touching it.
