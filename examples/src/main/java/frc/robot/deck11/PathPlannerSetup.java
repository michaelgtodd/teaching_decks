package frc.robot.deck11;

import com.pathplanner.lib.auto.AutoBuilder;
import com.pathplanner.lib.config.RobotConfig;
import com.pathplanner.lib.controllers.PPLTVController;
import com.pathplanner.lib.events.EventTrigger;
import com.pathplanner.lib.path.PathPlannerPath;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.DriverStation.Alliance;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import frc.robot.deck10.CANDriveSubsystem;

/** PathPlannerLib on the Deck 10 tank drive, using the settings saved by the PathPlanner app. */
public final class PathPlannerSetup {
  private PathPlannerSetup() {}

  /** Call once, before any auto is built. Returns false if the app's settings are missing. */
  public static boolean configure(CANDriveSubsystem drive) {
    // #region load
    RobotConfig config;
    try {
      config = RobotConfig.fromGUISettings(); // deploy/pathplanner/settings.json
    } catch (Exception e) {
      DriverStation.reportError("PathPlanner settings: " + e.getMessage(), false);
      return false;
    }
    // #endregion
    // #region configure
    AutoBuilder.configure(
        drive::getPose, // where odometry thinks we are
        drive::resetPose, // used by Reset Odometry
        drive::getSpeeds, // robot-relative speeds
        (speeds, feedforwards) -> drive.driveSpeeds(speeds),
        new PPLTVController(0.02), // tank follower, 20 ms loop
        config,
        PathPlannerSetup::isRedAlliance, // true: mirror for red
        drive);
    // #endregion
    return true;
  }

  private static boolean isRedAlliance() {
    return DriverStation.getAlliance().orElse(Alliance.Blue) == Alliance.Red;
  }

  // #region trigger
  /** Not called here: First Auto's marker already runs spinUp. Use this OR a command on a marker. */
  public static void bindMarkerTriggers(Launcher launcher) {
    new EventTrigger("spinUp").onTrue(launcher.spinUp());
  }
  // #endregion

  // #region in-code
  /** First Auto, written in Java: the same two paths and the same launch. */
  public static Command firstAutoInCode(Launcher launcher) {
    try {
      PathPlannerPath toHub = PathPlannerPath.fromPathFile("Drive to Hub");
      PathPlannerPath backOff = PathPlannerPath.fromPathFile("Back Off");
      return Commands.sequence(
          AutoBuilder.resetOdom(toHub.getStartingDifferentialPose()),
          AutoBuilder.followPath(toHub), // its spinUp marker still fires
          launcher.launch(),
          AutoBuilder.followPath(backOff));
    } catch (Exception e) {
      DriverStation.reportError("Path file: " + e.getMessage(), false);
      return Commands.none();
    }
  }
  // #endregion
}
