package frc.robot.deck9;

import edu.wpi.first.math.util.Units;

/** Every magic number in deck 9, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class DriveConstants {
    // CAN IDs: must match what you set in REV Hardware Client 2
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    // FIRST's 2026 KitBot code uses 60 A, to reduce breaker trips and CIM damage.
    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;

    // FIRST's 2026 KitBot values.
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;

    // Drive feel, for the tuning exercise in FeelRobotContainer.
    public static final double STICK_EXPONENT = 3.0;
    public static final double FORWARD_SLEW_PER_SEC = 3.0;
  }

  /** Speed control for the KitBot drivetrain, with one wheel encoder added to each side. */
  public static final class SpeedConstants {
    // roboRIO DIO ports. The KitBot code has no encoders, so these are ours to pick.
    public static final int LEFT_ENCODER_A = 0;
    public static final int LEFT_ENCODER_B = 1;
    public static final int RIGHT_ENCODER_A = 2;
    public static final int RIGHT_ENCODER_B = 3;

    // The sides are mirror images, so one encoder counts backward. Check yours: see the gotcha.
    public static final boolean LEFT_ENCODER_REVERSED = false;
    public static final boolean RIGHT_ENCODER_REVERSED = true;

    // The robot: 6 inch wheels, 8.45:1, an assumed 50 kg.
    public static final double WHEEL_RADIUS_METERS = Units.inchesToMeters(3.0);
    public static final double GEAR_RATIO = 8.45;
    public static final double ROBOT_MASS_KG = 50.0;

    // REV Through Bore Encoder on the wheel shaft: 2048 cycles per turn.
    public static final double ENCODER_CYCLES_PER_TURN = 2048.0;
    public static final double METERS_PER_PULSE =
        2.0 * Math.PI * WHEEL_RADIUS_METERS / ENCODER_CYCLES_PER_TURN;

    // #region gains
    // Gains for the example robot in the simulator. Yours come from SysId.
    public static final double KS = 1.0; // volts to get moving
    public static final double KV = 2.34; // volts per m/s
    public static final double KA = 0.56; // volts per m/s squared
    public static final double KP = 6.0; // volts per m/s of error
    // #endregion

    public static final double MAX_VOLTS = 12.0;
    public static final double MAX_SPEED_MPS = 3.5; // full stick, below what the motors can reach
    public static final double MAX_ACCEL_MPS2 = 3.5; // how fast the goal may rise
    public static final double TEST_SPEED_MPS = 2.0; // the A button

    // Simulator only: the track width and spin inertia are rough, and only matter when turning.
    public static final double TRACK_WIDTH_METERS = 0.6;
    public static final double SPIN_INERTIA_KG_M2 = 5.0;
    public static final double FRICTION_VOLTS = 1.0; // the real friction in the simulated robot
    public static final double STOPPED_MPS = 0.05; // slower than this counts as stopped
    public static final double PUSH_NEWTONS = 80.0; // the Y button: a defender leaning on you
    public static final double LOOP_SECONDS = 0.02;
  }

  // #region arm
  /** The example arm from deck 6: a uniform 0.8 m, 4 kg bar on one NEO through 60:1. */
  public static final class ArmConstants {
    public static final int MOTOR_ID = 5;
    public static final double GEAR_RATIO = 60.0; // NEO turns per arm turn
    public static final double ARM_LENGTH_METERS = 0.8;
    public static final double ARM_MASS_KG = 4.0;

    public static final double KG = 1.21; // volts to hold the arm flat
    public static final double KV = 1.19; // volts per rad/s

    public static final double MAX_VELOCITY_RAD_PER_S = 2.5;
    public static final double MAX_ACCEL_RAD_PER_S2 = 6.0;

    // Where the metal stops the arm.
    public static final double HARD_STOP_MIN_RAD = Units.degreesToRadians(-30);
    public static final double HARD_STOP_MAX_RAD = Units.degreesToRadians(110);

    // Software stops the motor before the metal does.
    public static final double SOFT_MIN_RAD = Units.degreesToRadians(-25);
    public static final double SOFT_MAX_RAD = Units.degreesToRadians(100);

    public static final int CURRENT_LIMIT_AMPS = 40; // REV suggests 40 to 60 for a NEO
    public static final double NOMINAL_VOLTS = 12.0;
    public static final double MAX_VOLTS = 6.0; // the output clamp

    public static final double TOLERANCE_RAD = Units.degreesToRadians(2);

    // Check these on the real arm, with the robot disabled.
    public static final boolean MOTOR_INVERTED = false; // positive volts must raise the arm
    public static final boolean ENCODER_INVERTED = false; // raising the arm must count up
    public static final double ENCODER_FLAT_ROTATIONS = 0.0; // raw reading with the arm held flat

    // The SPARK's own loop uses native units: error in NEO rotations, output in duty cycle.
    // This is a low start, about 6 volts per arm radian. Tune it on the device.
    public static final double SPARK_KP = 0.05; // duty cycle per NEO rotation
    public static final double SPARK_KD = 0.0;
    public static final double MAX_OUTPUT = MAX_VOLTS / NOMINAL_VOLTS; // duty cycle
    public static final double ALLOWED_PROFILE_ERROR_RAD = Units.degreesToRadians(10);
  }
  // #endregion
}
