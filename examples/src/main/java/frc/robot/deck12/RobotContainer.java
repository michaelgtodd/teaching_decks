package frc.robot.deck12;

import static frc.robot.deck12.Constants.OperatorConstants.*;
import static frc.robot.deck12.Constants.SimConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

/** A KitBot with sensors and one AprilTag camera. Point Robot.java here to run it in the simulator. */
public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

  // #region camera
  // PhotonVision by default. For a Limelight, use new LimelightCamera(drive) instead.
  // A camera with no actuators still makes a good subsystem: its periodic() runs every loop.
  private final SubsystemBase camera = USE_VISION ? new PhotonVisionCamera(drive) : null;
  // #endregion

  public RobotContainer() {
    // Sticks read negative when pushed away, and +rotation is counter-clockwise.
    drive.setDefaultCommand(
        drive.driveArcade(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE,
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));
  }

  public Command getAutonomousCommand() {
    return Commands.none();
  }
}
