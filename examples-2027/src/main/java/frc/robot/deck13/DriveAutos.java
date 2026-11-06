package frc.robot.deck13;

import static frc.robot.deck13.Constants.AutoConstants.*;

import org.wpilib.command3.Command;

/** Deck 2's timed autonomous, written two ways in Commands v3. */
public final class DriveAutos {
  private DriveAutos() {}

  // #region sequence
  /** The builder: closest to Deck 2's Commands.sequence. */
  public static Command leaveAndTurn(KitBotDrive drive) {
    return Command.sequence(
            drive.driveFor(AUTO_SPEED, 0.0, DRIVE_OUT),
            drive.idleFor(PAUSE),
            drive.driveFor(0.0, AUTO_SPEED, TURN))
        .named("Leave and Turn");
  }
  // #endregion

  // #region coroutine
  /** The coroutine: plain Java, one step after another. */
  public static Command leaveAndTurnSteps(KitBotDrive drive) {
    return Command.requiring(drive)
        .executing(coroutine -> {
          coroutine.await(drive.driveFor(AUTO_SPEED, 0.0, DRIVE_OUT));
          coroutine.await(drive.idleFor(PAUSE));
          coroutine.await(drive.driveFor(0.0, AUTO_SPEED, TURN));
          System.out.println("Auto finished");
        })
        .named("Leave and Turn (steps)");
  }
  // #endregion
}
