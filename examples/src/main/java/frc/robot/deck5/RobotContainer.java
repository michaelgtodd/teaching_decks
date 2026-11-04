package frc.robot.deck5;

import static frc.robot.deck5.Constants.DashboardConstants.*;
import static frc.robot.deck5.Constants.OperatorConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.net.WebServer;
import edu.wpi.first.wpilibj.Filesystem;
import edu.wpi.first.wpilibj.RobotController;
import edu.wpi.first.wpilibj.smartdashboard.SendableChooser;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;
import edu.wpi.first.wpilibj2.command.button.RobotModeTriggers;
import edu.wpi.first.wpilibj2.command.button.Trigger;
import frc.robot.deck5.util.Elastic;
import java.util.function.DoubleSupplier;

public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

  public RobotContainer() {
    serveLayout();
    configureBindings();
    configureAutoChooser();
    configureDriverAlerts();
  }

  // #region serve
  // In Elastic: File, Save As, into src/main/deploy/elastic-layout.json. Then deploy.
  // Elastic's Download From Robot looks on port 5800, so start this once at startup.
  private void serveLayout() {
    WebServer.start(5800, Filesystem.getDeployDirectory().getPath());
  }
  // #endregion

  private void configureBindings() {
    // #region tuning
    SmartDashboard.setDefaultNumber("Drive Scale", DRIVE_SCALE); // once: only fills an empty box
    DoubleSupplier driveScale =
        () -> SmartDashboard.getNumber("Drive Scale", DRIVE_SCALE); // every loop: reads the box
    // #endregion

    // Sticks read negative when pushed away, and +rotation is counter-clockwise.
    drive.setDefaultCommand(
        drive.driveArcade(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * driveScale.getAsDouble(),
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));
  }

  // #region chooser
  private final SendableChooser<Command> chooser =
      new SendableChooser<>();

  private void configureAutoChooser() {
    chooser.setDefaultOption("Do nothing", Commands.none());
    chooser.addOption("Drive 2 s", drive.driveOut(2.0));
    chooser.addOption("Drive 4 s", drive.driveOut(4.0));
    SmartDashboard.putData("Auto", chooser);
  }

  /** Robot.java calls this when auto starts. */
  public Command getAutonomousCommand() {
    return chooser.getSelected();
  }
  // #endregion

  // #region alerts
  private final Elastic.Notification warning =
      new Elastic.Notification(
          Elastic.NotificationLevel.WARNING,
          "Low battery",
          "Swap it.");

  private void configureDriverAlerts() {
    new Trigger(this::batteryLow)
        .debounce(LOW_BATTERY_SECONDS)
        .onTrue(once(() -> Elastic.sendNotification(warning)));
    RobotModeTriggers.autonomous()
        .onTrue(once(() -> Elastic.selectTab("Autonomous")));
    RobotModeTriggers.teleop()
        .onTrue(once(() -> Elastic.selectTab("Teleoperated")));
  }
  // #endregion

  private boolean batteryLow() {
    return RobotController.getBatteryVoltage() < LOW_BATTERY_VOLTS;
  }

  /** Runs one time, even while the robot is disabled. */
  private Command once(Runnable action) {
    return Commands.runOnce(action).ignoringDisable(true);
  }
}
