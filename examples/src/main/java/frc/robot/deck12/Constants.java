package frc.robot.deck12;

import edu.wpi.first.apriltag.AprilTagFieldLayout;
import edu.wpi.first.apriltag.AprilTagFields;
import edu.wpi.first.math.Matrix;
import edu.wpi.first.math.VecBuilder;
import edu.wpi.first.math.geometry.Rotation3d;
import edu.wpi.first.math.geometry.Transform3d;
import edu.wpi.first.math.geometry.Translation3d;
import edu.wpi.first.math.kinematics.DifferentialDriveKinematics;
import edu.wpi.first.math.numbers.N1;
import edu.wpi.first.math.numbers.N3;
import edu.wpi.first.math.util.Units;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class DriveConstants {
    // CAN IDs: must match what you set in REV Hardware Client 2
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;

    // The stock KitBot has none of these sensors. Channels and IDs are examples, as in Deck 10.
    public static final int LEFT_ENCODER_A = 0;
    public static final int LEFT_ENCODER_B = 1;
    public static final int RIGHT_ENCODER_A = 2;
    public static final int RIGHT_ENCODER_B = 3;
    public static final int GYRO_CAN_ID = 10;
    public static final double ENCODER_CYCLES_PER_WHEEL_TURN = 2048.0;

    // These match the WPILib KitBot simulator. Measure your own robot.
    public static final double WHEEL_RADIUS_METERS = Units.inchesToMeters(3.0);
    public static final double TRACK_WIDTH_METERS = Units.inchesToMeters(26.0);

    public static final double METERS_PER_CYCLE =
        2.0 * Math.PI * WHEEL_RADIUS_METERS / ENCODER_CYCLES_PER_WHEEL_TURN;
    public static final DifferentialDriveKinematics KINEMATICS =
        new DifferentialDriveKinematics(TRACK_WIDTH_METERS);
  }

  public static final class VisionConstants {
    // Must match the camera name you set in the PhotonVision web UI.
    public static final String CAMERA_NAME = "front";
    // Must match the Limelight's hostname. "limelight" is its default.
    public static final String LIMELIGHT_NAME = "limelight";

    // Where the camera sits on the robot: 0.3 m forward, 0.25 m up, facing forward.
    public static final Transform3d ROBOT_TO_CAMERA =
        new Transform3d(new Translation3d(0.3, 0.0, 0.25), Rotation3d.kZero);

    // Where every AprilTag is on the 2026 field.
    public static final AprilTagFieldLayout TAG_LAYOUT =
        AprilTagFieldLayout.loadField(AprilTagFields.kDefaultField);

    // #region stddevs
    // Standard deviations for x (m), y (m), heading (rad).
    // Bigger means trust less. These start from PhotonVision's
    // example. The huge heading number leaves heading to the gyro.
    public static final Matrix<N3, N1> ONE_TAG_STD_DEVS =
        VecBuilder.fill(4, 4, 9999999);
    public static final Matrix<N3, N1> MULTI_TAG_STD_DEVS =
        VecBuilder.fill(0.5, 0.5, 9999999);
    // #endregion
    // A single tag farther away than this is ignored.
    public static final double MAX_ONE_TAG_METERS = 4.0;
  }

  public static final class SimConstants {
    public static final double LOOP_SECONDS = 0.02;

    // Where the simulated robot really starts, in meters from the blue alliance wall corner.
    public static final double START_X_METERS = 2.0;
    public static final double START_Y_METERS = 4.0;

    // Exercise: how far off the pose estimator's starting guess is, in meters.
    public static final double START_GUESS_ERROR_METERS = 1.0;

    // Exercise: false stops the camera from correcting the pose.
    public static final boolean USE_VISION = true;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;
  }
}
