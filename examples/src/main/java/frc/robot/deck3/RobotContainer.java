package frc.robot.deck3;

import static frc.robot.deck2.Constants.OperatorConstants.*;

import edu.wpi.first.epilogue.Logged;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.wpilibj.PowerDistribution;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

/** Deck 2's bindings. Tagging this class lets Epilogue reach the drivetrain inside it. */
@Logged
public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

  // PowerDistribution is Sendable, so @Logged records voltage, total current and every channel.
  @Logged(name = "PDH")
  private final PowerDistribution pdh = new PowerDistribution();

  public RobotContainer() {
    configureBindings();
  }

  private void configureBindings() {
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
