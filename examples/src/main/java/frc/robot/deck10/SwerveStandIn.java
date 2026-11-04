package frc.robot.deck10;

import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.geometry.Translation2d;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/**
 * Stands in for a real swerve subsystem, so BLinePaths has something to compile and run against.
 * BLine only works on holonomic drivetrains, and WPILib 2026 has no swerve simulator class. This
 * applies the commanded speeds perfectly, so it shows the API, not how well a real robot tracks.
 */
public class SwerveStandIn extends SubsystemBase {
  private static final double LOOP_SECONDS = 0.02;

  private Pose2d pose = Pose2d.kZero;
  private ChassisSpeeds speeds = new ChassisSpeeds();

  public Pose2d getPose() {
    return pose;
  }

  public void resetPose(Pose2d newPose) {
    pose = newPose;
  }

  public ChassisSpeeds getRobotRelativeSpeeds() {
    return speeds;
  }

  public void driveRobotRelative(ChassisSpeeds newSpeeds) {
    speeds = newSpeeds;
  }

  @Override
  public void simulationPeriodic() {
    Translation2d move =
        new Translation2d(speeds.vxMetersPerSecond, speeds.vyMetersPerSecond)
            .rotateBy(pose.getRotation())
            .times(LOOP_SECONDS);
    Rotation2d turn = Rotation2d.fromRadians(speeds.omegaRadiansPerSecond * LOOP_SECONDS);
    pose = new Pose2d(pose.getTranslation().plus(move), pose.getRotation().plus(turn));
  }
}
