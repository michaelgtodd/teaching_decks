package frc.robot.deck4;

import static frc.robot.deck4.Constants.OperatorConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.filter.SlewRateLimiter;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

/** Exactly the Deck 2 bindings: the simulator drives the same command as the robot. */
public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

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

  // #region slew
  // Exercise: pass this::slewedForward as the first argument to driveArcade.
  private final SlewRateLimiter forwardLimiter =
      new SlewRateLimiter(FORWARD_SLEW_PER_SEC);

  private double slewedForward() {
    double stick = -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE;
    return forwardLimiter.calculate(stick);
  }
  // #endregion

  public Command getAutonomousCommand() {
    return Commands.none();
  }
}
