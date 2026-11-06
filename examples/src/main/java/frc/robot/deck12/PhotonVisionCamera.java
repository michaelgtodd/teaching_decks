package frc.robot.deck12;

import static frc.robot.deck12.Constants.VisionConstants.*;

import edu.wpi.first.math.Matrix;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.numbers.N1;
import edu.wpi.first.math.numbers.N3;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.Optional;
import org.photonvision.EstimatedRobotPose;
import org.photonvision.PhotonCamera;
import org.photonvision.PhotonPoseEstimator;
import org.photonvision.simulation.PhotonCameraSim;
import org.photonvision.simulation.SimCameraProperties;
import org.photonvision.simulation.VisionSystemSim;

/**
 * One PhotonVision camera that feeds AprilTag robot poses into the drivetrain's pose estimator.
 * Follows PhotonVision's own poseest example at v2026.3.4, cut down for a tank drive.
 */
public class PhotonVisionCamera extends SubsystemBase {
  private final CANDriveSubsystem drive;

  // The name must match the camera name in the PhotonVision web UI.
  private final PhotonCamera camera = new PhotonCamera(CAMERA_NAME);
  // Turns tag corners into a robot pose, using the field layout and where the camera is mounted.
  private final PhotonPoseEstimator estimator =
      new PhotonPoseEstimator(TAG_LAYOUT, ROBOT_TO_CAMERA);

  // Built only in simulation. On a real robot this stays null.
  private VisionSystemSim visionSim;

  public PhotonVisionCamera(CANDriveSubsystem drive) {
    this.drive = drive;
    if (RobotBase.isSimulation()) {
      setUpSimulation();
    }
  }

  @Override
  // #region periodic
  public void periodic() {
    for (var result : camera.getAllUnreadResults()) {
      var est = estimator.estimateCoprocMultiTagPose(result);
      if (est.isEmpty()) {
        est = estimator.estimateLowestAmbiguityPose(result);
      }
      est.ifPresent(this::send);
    }
  }

  private void send(EstimatedRobotPose est) {
    Pose2d pose = est.estimatedPose.toPose2d();
    trustFor(est, pose).ifPresent(stdDevs ->
        drive.addVisionMeasurement(
            pose, est.timestampSeconds, stdDevs));
  }
  // #endregion

  /**
   * Trust many close tags more than one far tag, as in PhotonVision's example. Empty means ignore
   * this estimate.
   */
  private Optional<Matrix<N3, N1>> trustFor(EstimatedRobotPose est, Pose2d pose) {
    int tags = est.targetsUsed.size();
    double totalMeters = 0.0;
    for (var target : est.targetsUsed) {
      var tagPose = TAG_LAYOUT.getTagPose(target.getFiducialId());
      if (tagPose.isPresent()) {
        var tagSpot = tagPose.get().toPose2d().getTranslation();
        totalMeters += tagSpot.getDistance(pose.getTranslation());
      }
    }
    double meters = tags > 0 ? totalMeters / tags : 0.0;
    if (tags == 1 && meters > MAX_ONE_TAG_METERS) {
      return Optional.empty();
    }
    var base = tags > 1 ? MULTI_TAG_STD_DEVS : ONE_TAG_STD_DEVS;
    return Optional.of(base.times(1 + meters * meters / 30));
  }

  // #region sim
  private void setUpSimulation() {
    visionSim = new VisionSystemSim("main"); // a simulated field
    visionSim.addAprilTags(TAG_LAYOUT); // with every 2026 AprilTag on it
    // A pretend camera: 960 x 720 pixels, 90 degree view, 15 frames a second, 50 ms late.
    var props = new SimCameraProperties()
        .setCalibration(960, 720, Rotation2d.fromDegrees(90))
        .setFPS(15)
        .setAvgLatencyMs(50)
        .setLatencyStdDevMs(15);
    visionSim.addCamera(new PhotonCameraSim(camera, props), ROBOT_TO_CAMERA);
  }
  @Override
  public void simulationPeriodic() {
    visionSim.update(drive.truePose()); // where the robot really is, not its estimate
  }
  // #endregion
}
