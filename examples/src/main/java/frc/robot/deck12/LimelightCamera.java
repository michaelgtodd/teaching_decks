package frc.robot.deck12;

import static frc.robot.deck12.Constants.VisionConstants.*;

import edu.wpi.first.math.VecBuilder;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/**
 * One Limelight running MegaTag2, feeding the same pose estimator. Follows the Java example on
 * Limelight's "Robot Localization with MegaTag2" page, using LimelightHelpers v1.14.
 */
public class LimelightCamera extends SubsystemBase {
  private final CANDriveSubsystem drive;

  public LimelightCamera(CANDriveSubsystem drive) {
    this.drive = drive;
  }

  // MegaTag2 needs the robot's heading every loop, in degrees. v1.14 returns null when there is no
  // data, such as with no Limelight on the network. Limelight's example ignores vision while the
  // robot turns faster than 360 degrees a second. The huge heading number keeps the gyro's heading.
  @Override
  // #region megatag2
  public void periodic() {
    double yaw = drive.getPose().getRotation().getDegrees();
    LimelightHelpers.SetRobotOrientation(
        LIMELIGHT_NAME, yaw, 0, 0, 0, 0, 0);
    var mt2 = LimelightHelpers
        .getBotPoseEstimate_wpiBlue_MegaTag2(LIMELIGHT_NAME);
    if (mt2 == null || mt2.tagCount == 0) {
      return;
    }
    if (Math.abs(drive.turnRateDegreesPerSecond()) > 360) {
      return;
    }
    drive.addVisionMeasurement(
        mt2.pose, mt2.timestampSeconds,
        VecBuilder.fill(.7, .7, 9999999));
  }
  // #endregion
}
