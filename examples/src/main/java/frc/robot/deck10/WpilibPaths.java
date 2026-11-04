package frc.robot.deck10;

import static frc.robot.deck10.Constants.DriveConstants.*;
import static frc.robot.deck10.Constants.PathConstants.*;
import static frc.robot.deck10.Constants.SimConstants.*;

import edu.wpi.first.math.controller.LTVUnicycleController;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.geometry.Translation2d;
import edu.wpi.first.math.trajectory.Trajectory;
import edu.wpi.first.math.trajectory.TrajectoryConfig;
import edu.wpi.first.math.trajectory.TrajectoryGenerator;
import edu.wpi.first.wpilibj.Timer;
import edu.wpi.first.wpilibj2.command.Command;
import java.util.List;

/** WPILib's own tools: no vendor library and no app. */
public final class WpilibPaths {
  private WpilibPaths() {}

  public static Trajectory sCurve() {
    TrajectoryConfig limits = new TrajectoryConfig(MAX_SPEED, MAX_ACCEL).setKinematics(KINEMATICS);
    return TrajectoryGenerator.generateTrajectory(
        new Pose2d(START_X_METERS, START_Y_METERS, Rotation2d.kZero),
        List.of(new Translation2d(3.5, 4.5)),
        new Pose2d(END_X_METERS, END_Y_METERS, Rotation2d.kZero),
        limits);
  }

  // #region follow
  public static Command follow(
      CANDriveSubsystem drive, Trajectory path) {
    var follower = new LTVUnicycleController(0.02);
    follower.setEnabled(USE_FEEDBACK);
    Timer clock = new Timer();
    return drive.startRun(() -> {
          drive.resetPose(path.getInitialPose());
          clock.restart();
        }, () -> {
          Trajectory.State plan = path.sample(clock.get());
          drive.driveSpeeds(
              follower.calculate(drive.getPose(), plan));
        })
        .withTimeout(path.getTotalTimeSeconds())
        .finallyDo(drive::stop);
  }
  // #endregion
}
