package frc.robot.deck9;

import static frc.robot.deck9.Constants.OperatorConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.filter.SlewRateLimiter;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

/** RobotContainer with the drive-feel exercise done: a stick curve and a slew-rate limit. */
public class FeelRobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);
  private final SlewRateLimiter forwardLimiter = new SlewRateLimiter(FORWARD_SLEW_PER_SEC);

  public FeelRobotContainer() {
    drive.setDefaultCommand(drive.driveArcadeRaw(this::shapedForward, this::shapedTurn));
  }

  // #region feel
  private double shapedForward() {
    double x = -driver.getLeftY();
    x = MathUtil.applyDeadband(x, DEADBAND);
    x = MathUtil.copyDirectionPow(x, STICK_EXPONENT);
    return forwardLimiter.calculate(x * DRIVE_SCALE);
  }

  private double shapedTurn() {
    double x = -driver.getRightX();
    x = MathUtil.applyDeadband(x, DEADBAND);
    x = MathUtil.copyDirectionPow(x, STICK_EXPONENT);
    return x * TURN_SCALE;
  }
  // #endregion

  public Command getAutonomousCommand() {
    return Commands.none();
  }
}
