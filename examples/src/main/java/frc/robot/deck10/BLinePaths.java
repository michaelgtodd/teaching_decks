package frc.robot.deck10;

import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import frc.robot.lib.BLine.FollowPath;
import frc.robot.lib.BLine.Path;

/** BLine-Lib. Holonomic drivetrains only, so this one uses a swerve stand-in. */
public final class BLinePaths {
  private BLinePaths() {}

  // Max speed, accel, turn speed, turn accel, end tolerances and handoff radius.
  static {
    Path.setDefaultGlobalConstraints(
        new Path.DefaultGlobalConstraints(2.0, 1.5, 360.0, 720.0, 0.05, 2.0, 0.3));
  }

  // #region builder
  public static Command toHub(SwerveStandIn drive) {
    var follow = new FollowPath.Builder(
        drive, drive::getPose,
        drive::getRobotRelativeSpeeds,
        drive::driveRobotRelative,
        new PIDController(5.0, 0.0, 0.0), // translation
        new PIDController(3.0, 0.0, 0.0), // rotation
        new PIDController(2.0, 0.0, 0.0)) // cross-track
        .withPoseReset(drive::resetPose);
    FollowPath.registerEventTrigger("spinUp", spinUp());
    return follow.build(new Path(
        new Path.Waypoint(2.0, 4.0, Rotation2d.kZero),
        new Path.TranslationTarget(3.5, 4.5),
        new Path.EventTrigger(0.5, "spinUp"),
        new Path.Waypoint(5.0, 5.0, Rotation2d.kZero)));
  }
  // #endregion

  private static Command spinUp() {
    return Commands.print("spin up");
  }
}
