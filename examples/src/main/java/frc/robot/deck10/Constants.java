package frc.robot.deck10;

import edu.wpi.first.math.kinematics.DifferentialDriveKinematics;
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

    // The stock KitBot has none of these sensors. Channels and IDs are examples.
    public static final int LEFT_ENCODER_A = 0;
    public static final int LEFT_ENCODER_B = 1;
    public static final int RIGHT_ENCODER_A = 2;
    public static final int RIGHT_ENCODER_B = 3;
    public static final int GYRO_CAN_ID = 10;

    // Quadrature cycles for one turn of the wheel. Depends on your encoder and which shaft it reads.
    public static final double ENCODER_CYCLES_PER_WHEEL_TURN = 2048.0;

    // These match the WPILib KitBot simulator. Measure your own robot.
    public static final double GEARING = 8.45;
    public static final double WHEEL_RADIUS_METERS = Units.inchesToMeters(3.0);
    public static final double TRACK_WIDTH_METERS = Units.inchesToMeters(26.0);
    public static final double MASS_KG = Units.lbsToKilograms(60.0);
    public static final double MOI_KG_M2 = 0.86;

    public static final double METERS_PER_CYCLE =
        2.0 * Math.PI * WHEEL_RADIUS_METERS / ENCODER_CYCLES_PER_WHEEL_TURN;
    public static final DifferentialDriveKinematics KINEMATICS =
        new DifferentialDriveKinematics(TRACK_WIDTH_METERS);
  }

  public static final class PathConstants {
    // Volts per m/s of wheel speed, and wheel-speed P. Find yours with SysId.
    public static final double KV = 2.35;
    public static final double WHEEL_KP = 2.0;

    public static final double MAX_SPEED = 2.0; // m/s
    public static final double MAX_ACCEL = 1.5; // m/s per second

    // Exercise: set false to run on feedforward alone.
    public static final boolean USE_FEEDBACK = true;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;
  }

  public static final class SimConstants {
    // One robot loop: how far simulated time moves on each step.
    public static final double LOOP_SECONDS = 0.02;

    // Where the robot starts, in meters from the corner of the blue alliance wall.
    public static final double START_X_METERS = 2.0;
    public static final double START_Y_METERS = 4.0;

    // Where the exercise path ends.
    public static final double END_X_METERS = 5.0;
    public static final double END_Y_METERS = 5.0;

    // Exercise: 0.9 makes the left side 10% weak, like a stiff gearbox.
    public static final double LEFT_SIDE_STRENGTH = 1.0;
  }
}
