package frc.robot.deck7;

import static edu.wpi.first.wpilibj2.command.Commands.waitUntil;
import static frc.robot.deck7.ArmConstants.*;

import com.ctre.phoenix6.CANBus;
import com.ctre.phoenix6.StatusCode;
import com.ctre.phoenix6.configs.CANcoderConfiguration;
import com.ctre.phoenix6.configs.TalonFXConfiguration;
import com.ctre.phoenix6.controls.MotionMagicVoltage;
import com.ctre.phoenix6.hardware.CANcoder;
import com.ctre.phoenix6.hardware.TalonFX;
import com.ctre.phoenix6.signals.FeedbackSensorSourceValue;
import com.ctre.phoenix6.signals.GravityTypeValue;
import com.ctre.phoenix6.signals.NeutralModeValue;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/** An arm on a Kraken (Talon FX), with a CANcoder on the arm shaft. Needs no Pro license. */
public class CtreArm extends SubsystemBase {
  // All of these are volts, because MotionMagicVoltage outputs volts.
  // kP is volts per rotation of error.
  private static final double KP = 24.0;
  // CTRE's docs use 0.12 V per motor rps as an example kV. Times 60:1 gives volts per arm rps.
  private static final double KV = 7.2;
  private static final double KG = 0.35;
  // Rotations per second and per second squared: the same motion as RevArm's 30 RPM and 60 RPM/s.
  private static final double CRUISE_RPS = 0.5;
  private static final double ACCEL_RPS2 = 1.0;

  private final CANBus bus = CANBus.roboRIO();
  private final TalonFX motor = new TalonFX(MOTOR_ID, bus);
  private final CANcoder encoder = new CANcoder(ENCODER_ID, bus);
  private final MotionMagicVoltage request = new MotionMagicVoltage(0);
  private double target = 0.0;

  public CtreArm() {
    CANcoderConfiguration encoderConfig = new CANcoderConfiguration();
    encoderConfig.MagnetSensor.MagnetOffset = ENCODER_OFFSET_ROT;
    encoderConfig.MagnetSensor.AbsoluteSensorDiscontinuityPoint = 0.5;
    encoder.getConfigurator().apply(encoderConfig);

    TalonFXConfiguration config = new TalonFXConfiguration();
    config.MotorOutput.NeutralMode = NeutralModeValue.Brake;
    config.CurrentLimits.StatorCurrentLimit = CURRENT_LIMIT_AMPS;
    config.CurrentLimits.StatorCurrentLimitEnable = true;
    config.SoftwareLimitSwitch.ForwardSoftLimitThreshold = FORWARD_LIMIT_ROT;
    config.SoftwareLimitSwitch.ForwardSoftLimitEnable = true;
    config.SoftwareLimitSwitch.ReverseSoftLimitThreshold = REVERSE_LIMIT_ROT;
    config.SoftwareLimitSwitch.ReverseSoftLimitEnable = true;
    // #region sensor
    var feedback = config.Feedback;
    feedback.FeedbackRemoteSensorID = ENCODER_ID;
    feedback.FeedbackSensorSource =
        FeedbackSensorSourceValue.RemoteCANcoder;
    feedback.SensorToMechanismRatio = 1.0;
    feedback.RotorToSensorRatio = GEAR_RATIO;

    config.Slot0.GravityType =
        GravityTypeValue.Arm_Cosine;
    config.Slot0.kG = KG;
    config.Slot0.kP = KP;
    config.Slot0.kV = KV;
    // #endregion

    // #region profile
    var magic = config.MotionMagic;
    magic.MotionMagicCruiseVelocity = CRUISE_RPS;
    magic.MotionMagicAcceleration = ACCEL_RPS2;
    // #endregion

    // Saved on the device automatically. Settings not set above go back to factory defaults.
    StatusCode status = motor.getConfigurator().apply(config);
    if (!status.isOK()) {
      System.out.println("Could not configure the arm: " + status);
    }
  }

  // #region move
  public Command moveTo(double degrees) {
    double rotations = degrees / 360.0;
    return runOnce(() -> {
      target = rotations;
      motor.setControl(
          request.withPosition(rotations));
    }).andThen(waitUntil(this::atTarget));
  }
  // #endregion

  /** Did the arm itself arrive? */
  public boolean atTarget() {
    return Math.abs(motor.getPosition().getValueAsDouble() - target) < TOLERANCE_ROT;
  }

  /** True when the Motion Magic profile has finished. The arm may still be settling. */
  public boolean profileFinished() {
    return motor.getMotionMagicAtTarget().getValue();
  }
}
