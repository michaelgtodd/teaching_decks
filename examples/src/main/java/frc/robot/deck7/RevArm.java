package frc.robot.deck7;

import static edu.wpi.first.wpilibj2.command.Commands.waitUntil;
import static frc.robot.deck7.ArmConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.FeedbackSensor;
import com.revrobotics.spark.SparkAbsoluteEncoder;
import com.revrobotics.spark.SparkBase.ControlType;
import com.revrobotics.spark.SparkClosedLoopController;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.AbsoluteEncoderConfig;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/** An arm on a SPARK MAX, with a Through Bore Encoder V2 wired to its data port. */
public class RevArm extends SubsystemBase {
  // Output is duty cycle per rotation of error.
  private static final double KP = 2.0;
  // kV is volts per arm RPM: 12 V over the free speed of a NEO 2.0 at 60:1. kCos is volts.
  // There is no kS: SPARK firmware 27.0.0 changes how kS acts at a zero velocity setpoint.
  private static final double KV = 12.0 / (5676.0 / GEAR_RATIO);
  private static final double KG = 0.35;
  // RPM and RPM per second: the same motion as CtreArm's 0.5 rot/s and 1 rot/s^2.
  private static final double CRUISE_RPM = 30.0;
  private static final double ACCEL_RPM_PER_S = 60.0;
  private static final double PROFILE_ERROR_ROT = 0.05;

  private final SparkMax motor = new SparkMax(MOTOR_ID, MotorType.kBrushless);
  private final SparkClosedLoopController controller = motor.getClosedLoopController();
  private final SparkAbsoluteEncoder encoder = motor.getAbsoluteEncoder();
  private double target = 0.0;

  public RevArm() {
    SparkMaxConfig config = new SparkMaxConfig();
    config
        .idleMode(IdleMode.kBrake)
        .smartCurrentLimit((int) CURRENT_LIMIT_AMPS);
    config.softLimit
        .forwardSoftLimit(FORWARD_LIMIT_ROT)
        .forwardSoftLimitEnabled(true)
        .reverseSoftLimit(REVERSE_LIMIT_ROT)
        .reverseSoftLimitEnabled(true);
    // #region sensor
    config.absoluteEncoder
        .apply(AbsoluteEncoderConfig.Presets
            .REV_ThroughBoreEncoderV2)
        .zeroOffset(ENCODER_OFFSET_ROT);

    config.closedLoop
        .feedbackSensor(
            FeedbackSensor.kAbsoluteEncoder)
        .p(KP)
        .feedForward
        .kV(KV)
        .kCos(KG).kCosRatio(1.0);
    // #endregion

    // #region profile
    config.closedLoop.maxMotion
        .cruiseVelocity(CRUISE_RPM)
        .maxAcceleration(ACCEL_RPM_PER_S)
        .allowedProfileError(PROFILE_ERROR_ROT);
    // #endregion

    // Reset to a known state, then save, so settings survive a brownout or breaker trip.
    motor.configure(config, ResetMode.kResetSafeParameters, PersistMode.kPersistParameters);
  }

  // #region move
  public Command moveTo(double degrees) {
    double rotations = degrees / 360.0;
    return runOnce(() -> {
      target = rotations;
      controller.setSetpoint(rotations,
        ControlType.kMAXMotionPositionControl);
    }).andThen(waitUntil(this::atTarget));
  }
  // #endregion

  /** Did the arm itself arrive? */
  public boolean atTarget() {
    return Math.abs(encoder.getPosition() - target) < TOLERANCE_ROT;
  }

  /** True when the SPARK's own check says the setpoint is reached. */
  public boolean sparkSaysAtSetpoint() {
    return controller.isAtSetpoint();
  }
}
