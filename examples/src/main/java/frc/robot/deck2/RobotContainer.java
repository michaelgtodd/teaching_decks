package frc.robot.deck2;

import static frc.robot.deck2.Constants.OperatorConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

public class RobotContainer {
  // #region fields
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);
  // #endregion

  public RobotContainer() {
    configureBindings();
  }

  // #region bindings
  private void configureBindings() {
    // Sticks read negative when pushed away, and +rotation is counter-clockwise.
    drive.setDefaultCommand(
        drive.driveArcade(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE,
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));
  }
  // #endregion

  // #region auto
  /** Robot.java schedules this when autonomous starts and cancels it when teleop starts. */
  public Command getAutonomousCommand() {
    return DriveAutos.leaveAndTurn(drive);
  }
  // #endregion
}
