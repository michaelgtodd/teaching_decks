package frc.robot.deck10;

import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;

/** The first auto for any robot: no sensors, no library. */
public final class TimedAuto {
  private TimedAuto() {}

  // #region timed
  public static Command driveForward(CANDriveSubsystem drive) {
    return drive.driveArcade(() -> 0.6, () -> 0.0).withTimeout(1.5)
        .andThen(drive.runOnce(drive::stop))
        .andThen(Commands.print("launch fuel here"));
  }
  // #endregion
}
