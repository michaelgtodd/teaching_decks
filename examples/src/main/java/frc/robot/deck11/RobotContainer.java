package frc.robot.deck11;

import static frc.robot.deck11.Constants.OperatorConstants.*;

import com.pathplanner.lib.auto.AutoBuilder;
import com.pathplanner.lib.auto.NamedCommands;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.wpilibj.smartdashboard.SendableChooser;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;
import frc.robot.deck10.CANDriveSubsystem;

/** Deck 11: autos drawn in the PathPlanner app, run on the Deck 10 drivetrain. */
public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final Launcher launcher = new Launcher();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);
  private final SendableChooser<Command> autoChooser;

  public RobotContainer() {
    // #region setup
    // 1. Tell PathPlannerLib how to drive this robot.
    boolean ready = PathPlannerSetup.configure(drive);

    // 2. Register every name used in the app, before any auto is built.
    NamedCommands.registerCommand("spinUp", launcher.spinUp());
    NamedCommands.registerCommand("launch", launcher.launch());

    // 3. One chooser entry per .auto file in deploy/pathplanner/autos, plus "None".
    autoChooser = ready ? AutoBuilder.buildAutoChooser() : new SendableChooser<>();
    if (!ready) {
      autoChooser.setDefaultOption("None", Commands.none());
    }
    SmartDashboard.putData("Auto Chooser", autoChooser);
    // #endregion

    configureBindings();
  }

  public Command getAutonomousCommand() {
    return autoChooser.getSelected();
  }

  private void configureBindings() {
    drive.setDefaultCommand(
        drive.driveArcade(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE,
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));
    driver.a().onTrue(launcher.launch());
  }
}
