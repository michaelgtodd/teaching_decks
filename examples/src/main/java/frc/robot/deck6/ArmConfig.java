package frc.robot.deck6;

import static frc.robot.deck6.ArmUnits.armRadToMotorRotations;
import static frc.robot.deck6.Constants.ArmConstants.*;

import com.revrobotics.spark.FeedbackSensor;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;

/** SPARK MAX settings every version of the arm shares. */
public final class ArmConfig {
  private ArmConfig() {}

  /** A through-bore encoder on the arm shaft, wired to the SPARK MAX data port. */
  public static SparkMaxConfig base() {
    SparkMaxConfig config = new SparkMaxConfig();
    // #region motor
    config.idleMode(IdleMode.kBrake);
    config.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    config.voltageCompensation(NOMINAL_VOLTS);
    config.inverted(MOTOR_INVERTED);
    // #endregion

    // #region encoder
    // No conversion factors: see ArmUnits.
    // The through-bore gives the true angle. inverted() also sets up the data port.
    config.absoluteEncoder.inverted(ENCODER_INVERTED);
    // The SPARK's loop and soft limits use the NEO's encoder, in NEO rotations.
    config.closedLoop.feedbackSensor(FeedbackSensor.kPrimaryEncoder);
    // #endregion

    // #region soft
    // NEO rotations, because the NEO's encoder is the selected sensor.
    config.softLimit
        .forwardSoftLimit(armRadToMotorRotations(SOFT_MAX_RAD))
        .forwardSoftLimitEnabled(true)
        .reverseSoftLimit(armRadToMotorRotations(SOFT_MIN_RAD))
        .reverseSoftLimitEnabled(true);
    // #endregion
    return config;
  }
}
