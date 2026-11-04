package frc.robot.deck3;

import edu.wpi.first.epilogue.Epilogue;
import edu.wpi.first.epilogue.Logged;
import edu.wpi.first.wpilibj.DataLogManager;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.TimedRobot;
import edu.wpi.first.wpilibj2.command.CommandScheduler;

/** All three telemetry levels switched on. Epilogue follows Robot, then container, then drive. */
@Logged
public class Robot extends TimedRobot {
  private final RobotContainer container = new RobotContainer();

  // #region datalog
  public Robot() {
    // Save every NetworkTables change to a .wpilog file.
    DataLogManager.start();

    // Also record the enabled state and the joysticks.
    DriverStation.startDataLog(DataLogManager.getLog());

    // Level 3, next slide: log every @Logged class.
    Epilogue.bind(this);
  }
  // #endregion

  @Override
  public void robotPeriodic() {
    CommandScheduler.getInstance().run();
  }
}
