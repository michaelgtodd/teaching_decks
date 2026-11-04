package frc.robot.deck7;

/**
 * Numbers shared by the REV and CTRE arms in Deck 7.
 *
 * <p>Both arms use an absolute encoder on the arm shaft, so one encoder rotation is one arm
 * rotation. Rotation 0 means the arm is level, pointing forward. Everything is in the sensor's own
 * units, rotations, and commands convert from degrees in Java. No conversion factors are set, so
 * the REV arm behaves the same on SPARK firmware 26.x and 27.x, which has none.
 *
 * <p>Gains live in each arm class because the vendors use different units. All gains are starting
 * guesses, not tuned values.
 */
public final class ArmConstants {
  private ArmConstants() {}

  public static final int MOTOR_ID = 20;
  public static final int ENCODER_ID = 21;

  /** Motor rotations per arm rotation. */
  public static final double GEAR_RATIO = 60.0;

  /** Encoder reading when the arm is level. Measure this on your robot. */
  public static final double ENCODER_OFFSET_ROT = 0.0;

  public static final double CURRENT_LIMIT_AMPS = 40.0;

  /** Arm rotations. */
  public static final double FORWARD_LIMIT_ROT = 0.30;

  /**
   * Arm rotations. The SPARK's absolute reading runs from 0 to 1 and wraps at 0, so this arm rests
   * on a hard stop just above level and never travels through that wrap.
   */
  public static final double REVERSE_LIMIT_ROT = 0.02;

  /** Arm rotations. Close enough to count as arrived. */
  public static final double TOLERANCE_ROT = 0.01;
}
