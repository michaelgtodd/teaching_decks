# 2027 examples (Deck 13)

Commands v3 versions of the Deck 2 KitBot code, written against **WPILib v2027.0.0-alpha-8** (October 24, 2026).

This is not a buildable project, and the code has **not been compiled or run**. It was checked by hand against the `commandsv3`, `wpilibj`, `wpimath` and `tunables` source at that tag, and against WPILib's own v3 examples (`hatchbotcmdv3`, `rebuiltcmdv3`). 2027 is alpha software, so names can still change.

To try it, create a 2027 Command Robot project with a 2027 alpha installer, copy `src/main/java/frc/robot/deck13/` into it, and fix anything the build reports. The 2026 project in `examples/` cannot hold this code: v3 needs the 2027 libraries and Java 25.

The motor controllers are passed in from `Robot.java` instead of created inside each mechanism, so the code needs no vendor library. On a KitBot they would be REVLib's 2027 SPARK MAX objects.
