package frc.robot.deck10;

import static frc.robot.deck10.Constants.DriveConstants.*;
import static frc.robot.deck10.Constants.PathConstants.*;
import static frc.robot.deck10.Constants.SimConstants.*;

import com.pathplanner.lib.auto.AutoBuilder;
import com.pathplanner.lib.auto.NamedCommands;
import com.pathplanner.lib.commands.PathPlannerAuto;
import com.pathplanner.lib.config.ModuleConfig;
import com.pathplanner.lib.config.RobotConfig;
import com.pathplanner.lib.controllers.PPLTVController;
import com.pathplanner.lib.path.GoalEndState;
import com.pathplanner.lib.path.PathConstraints;
import com.pathplanner.lib.path.PathPlannerPath;
import com.pathplanner.lib.path.Waypoint;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.system.plant.DCMotor;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.DriverStation.Alliance;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import java.util.List;

/** PathPlannerLib on a tank drive. Call configure once, from RobotContainer. */
public final class PathPlannerPaths {
  private PathPlannerPaths() {}

  // #region configure
  public static void configure(CANDriveSubsystem drive) {
    AutoBuilder.configure(
        drive::getPose,
        drive::resetPose,
        drive::getSpeeds,
        (speeds, feedforwards) -> drive.driveSpeeds(speeds),
        pathFollower(),
        robotConfig(),
        PathPlannerPaths::isRedAlliance,
        drive);
  }
  public static Command firstAuto() {
    NamedCommands.registerCommand("launch", launch());
    return new PathPlannerAuto("First Auto");
  }
  // #endregion

  /** PPLTVController is built on WPILib's LTV follower. */
  private static PPLTVController pathFollower() {
    var follower = new PPLTVController(0.02);
    follower.setEnabled(USE_FEEDBACK);
    return follower;
  }

  private static boolean isRedAlliance() {
    return DriverStation.getAlliance().orElse(Alliance.Blue) == Alliance.Red;
  }

  /** You can enter these in the PathPlanner app instead, then call RobotConfig.fromGUISettings(). */
  private static RobotConfig robotConfig() {
    double maxWheelSpeed = NOMINAL_VOLTS / KV;
    DCMotor gearbox = DCMotor.getCIM(2).withReduction(GEARING);
    ModuleConfig side =
        new ModuleConfig(WHEEL_RADIUS_METERS, maxWheelSpeed, 1.0, gearbox, CURRENT_LIMIT_AMPS, 2);
    return new RobotConfig(MASS_KG, MOI_KG_M2, side, TRACK_WIDTH_METERS);
  }

  private static Command launch() {
    return Commands.print("launch fuel here");
  }

  /** An S-curve built in code, so the exercise needs no app and no deploy file. */
  public static Command sCurve() {
    var start = new Pose2d(START_X_METERS, START_Y_METERS, Rotation2d.kZero);
    var finish = new Pose2d(END_X_METERS, END_Y_METERS, Rotation2d.kZero);
    List<Waypoint> waypoints = PathPlannerPath.waypointsFromPoses(start, finish);

    var limits = new PathConstraints(MAX_SPEED, MAX_ACCEL, 6.0, 12.0);
    var end = new GoalEndState(0.0, Rotation2d.kZero);
    var path = new PathPlannerPath(waypoints, limits, null, end);
    return AutoBuilder.resetOdom(start).andThen(AutoBuilder.followPath(path));
  }
}
