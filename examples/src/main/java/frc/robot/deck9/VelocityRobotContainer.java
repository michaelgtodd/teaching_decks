package frc.robot.deck9;

import static frc.robot.deck9.Constants.OperatorConstants.*;
import static frc.robot.deck9.Constants.SpeedConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.filter.SlewRateLimiter;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;
import edu.wpi.first.wpilibj2.command.sysid.SysIdRoutine.Direction;

/** RobotContainer for speed driving, including the simulator exercise and the SysId tests. */
public class VelocityRobotContainer {
  private final VelocityDriveSubsystem drive = new VelocityDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

  // One limiter per stick axis. The output is a share of top speed, so divide by it.
  private final SlewRateLimiter forwardLimiter =
      new SlewRateLimiter(MAX_ACCEL_MPS2 / MAX_SPEED_MPS);

  public VelocityRobotContainer() {
    drive.setDefaultCommand(drive.driveSpeed(this::shapedForward, this::shapedTurn));

    // #region bindings
    // Hold A: ramp to a test speed. Hold Y: a defender leans on the simulated robot.
    driver.a().whileTrue(drive.holdSpeed(TEST_SPEED_MPS));
    driver.y().whileTrue(
        Commands.startEnd(
            () -> drive.setSimPush(PUSH_NEWTONS), () -> drive.setSimPush(0.0)));
    // #endregion

    // Hold to run, so letting go stops the test. Give the robot about 20 feet of floor.
    driver.povUp().whileTrue(drive.sysIdQuasistatic(Direction.kForward));
    driver.povDown().whileTrue(drive.sysIdQuasistatic(Direction.kReverse));
    driver.povRight().whileTrue(drive.sysIdDynamic(Direction.kForward));
    driver.povLeft().whileTrue(drive.sysIdDynamic(Direction.kReverse));
  }

  private double shapedForward() {
    double x = -driver.getLeftY();
    x = MathUtil.applyDeadband(x, DEADBAND);
    x = MathUtil.copyDirectionPow(x, STICK_EXPONENT);
    return forwardLimiter.calculate(x);
  }

  private double shapedTurn() {
    double x = -driver.getRightX();
    x = MathUtil.applyDeadband(x, DEADBAND);
    return MathUtil.copyDirectionPow(x, STICK_EXPONENT) * TURN_SCALE;
  }

  public Command getAutonomousCommand() {
    return Commands.none();
  }
}
