package frc.robot.deck13;

import static frc.robot.deck13.Constants.OperatorConstants.*;

import org.wpilib.command3.Command;
import org.wpilib.command3.Scheduler;
import org.wpilib.command3.button.CommandGamepad;
import org.wpilib.drivers.motor.PWMSparkMax;
import org.wpilib.framework.TimedRobot;
import org.wpilib.math.util.MathUtil;
import org.wpilib.tunable.Selectable;
import org.wpilib.tunable.Tunables;

/**
 * Deck 2's robot in Commands v3. Like WPILib's v3 examples, it builds everything in Robot, with no
 * RobotContainer. PWMSparkMax stands in for the KitBot's CAN SPARK MAX controllers, so this needs
 * no vendor library.
 */
public class Robot extends TimedRobot {
  private final KitBotDrive drive = new KitBotDrive(new PWMSparkMax(0), new PWMSparkMax(1));
  private final Feeder feeder = new Feeder(new PWMSparkMax(2));
  private final CommandGamepad driver = new CommandGamepad(DRIVER_PORT);
  private final Selectable<Command> autoChooser = new Selectable<>();

  // #region setup
  public Robot() {
    drive.setDefaultCommand(
        drive.arcadeDrive(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE,
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));

    driver.faceDown().onTrue(feeder.intake());

    autoChooser.addDefault("Leave and Turn", DriveAutos.leaveAndTurn(drive));
    autoChooser.add("Leave and Turn (steps)", DriveAutos.leaveAndTurnSteps(drive));
    Tunables.publish("Auto", autoChooser);
  }
  // #endregion

  // #region loop
  @Override
  public void robotPeriodic() {
    Scheduler.getDefault().run(); // was CommandScheduler.getInstance().run()
  }

  @Override
  public void autonomousInit() {
    Command auto = autoChooser.getSelected();
    if (auto != null) {
      Scheduler.getDefault().schedule(auto); // canceled when autonomous ends
    }
  }
  // #endregion
}
