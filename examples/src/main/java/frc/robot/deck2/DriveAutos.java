package frc.robot.deck2;

import static frc.robot.deck2.Constants.AutoConstants.*;

import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;

/** Timed autonomous routines, built from the drive's command factory. */
public final class DriveAutos {
  private DriveAutos() {}

  // #region then
  /** Drive forward, hold still, then turn left: one command that does three things. */
  public static Command forwardPauseTurn(CANDriveSubsystem drive) {
    return drive.driveArcade(() -> AUTO_SPEED, () -> 0.0).withTimeout(DRIVE_OUT_SECONDS)
        .andThen(drive.driveArcade(() -> 0.0, () -> 0.0).withTimeout(PAUSE_SECONDS))
        .andThen(drive.driveArcade(() -> 0.0, () -> AUTO_SPEED).withTimeout(TURN_SECONDS));
  }
  // #endregion

  // #region sequence
  /** The same routine as a list: easier to read, reorder and extend. */
  public static Command leaveAndTurn(CANDriveSubsystem drive) {
    return Commands.sequence(
            drive.driveArcade(() -> AUTO_SPEED, () -> 0.0).withTimeout(DRIVE_OUT_SECONDS),
            drive.driveArcade(() -> 0.0, () -> 0.0).withTimeout(PAUSE_SECONDS),
            drive.driveArcade(() -> 0.0, () -> AUTO_SPEED).withTimeout(TURN_SECONDS),
            Commands.print("Auto finished"))
        .withName("Leave and turn");
  }
  // #endregion
}
