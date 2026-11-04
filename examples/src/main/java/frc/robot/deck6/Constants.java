package frc.robot.deck6;

import edu.wpi.first.math.util.Units;

/**
 * The example arm from deck 6: a uniform 0.8 m, 4 kg bar on one NEO through 60:1.
 *
 * <p>Angles are radians. 0 is horizontal and up is positive.
 */
public final class Constants {
  private Constants() {}

  // #region arm
  public static final class ArmConstants {
    public static final int MOTOR_ID = 5;
    public static final double GEAR_RATIO = 60.0; // NEO turns per arm turn
    public static final double ARM_LENGTH_METERS = 0.8;
    public static final double ARM_MASS_KG = 4.0;

    // Gains tuned in simulation. A real arm starts low: see the recipe.
    public static final double KS = 0.0; // volts (the sim has no friction)
    public static final double KG = 1.21; // volts to hold the arm flat
    public static final double KV = 1.19; // volts per rad/s
    public static final double KP = 30.0; // volts per radian
    public static final double KD = 1.2; // volts per rad/s of error change
    // #endregion

    // #region profile
    public static final double MAX_VELOCITY_RAD_PER_S = 2.5;
    public static final double MAX_ACCEL_RAD_PER_S2 = 6.0;
    // #endregion

    // #region limits
    // Where the metal stops the arm. The simulator uses these.
    public static final double HARD_STOP_MIN_RAD = Units.degreesToRadians(-30);
    public static final double HARD_STOP_MAX_RAD = Units.degreesToRadians(110);

    // Software stops the motor before the metal does.
    public static final double SOFT_MIN_RAD = Units.degreesToRadians(-25);
    public static final double SOFT_MAX_RAD = Units.degreesToRadians(100);

    public static final int CURRENT_LIMIT_AMPS = 40; // REV suggests 40 to 60 for a NEO
    public static final double NOMINAL_VOLTS = 12.0;
    public static final double MAX_VOLTS = 6.0; // the output clamp
    // #endregion

    // Named arm positions.
    public static final double STOW_RAD = SOFT_MIN_RAD;
    public static final double SCORE_RAD = Units.degreesToRadians(45);
    public static final double TOLERANCE_RAD = Units.degreesToRadians(2);

    // #region direction
    // Check these on the real arm, with the robot disabled. See the runaway gotcha.
    public static final boolean MOTOR_INVERTED = false; // positive volts must raise the arm
    public static final boolean ENCODER_INVERTED = false; // raising the arm must count up
    public static final double ENCODER_FLAT_ROTATIONS = 0.0; // raw reading with the arm held flat
    // #endregion

    // #region spark
    // The SPARK's own loop uses native units: error in NEO rotations, output in duty cycle.
    // This is a low start, about 6 volts per arm radian. Tune it on the device.
    public static final double SPARK_KP = 0.05; // duty cycle per NEO rotation
    public static final double SPARK_KD = 0.0;
    public static final double MAX_OUTPUT = MAX_VOLTS / NOMINAL_VOLTS; // duty cycle
    public static final double ALLOWED_PROFILE_ERROR_RAD = Units.degreesToRadians(10);
    // #endregion
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
  }
}
