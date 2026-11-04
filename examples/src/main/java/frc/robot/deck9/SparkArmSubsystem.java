package frc.robot.deck9;

import static frc.robot.deck9.ArmUnits.*;
import static frc.robot.deck9.Constants.ArmConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.RelativeEncoder;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkAbsoluteEncoder;
import com.revrobotics.spark.SparkBase.ControlType;
import com.revrobotics.spark.SparkClosedLoopController;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj2.command.button.Trigger;

/**
 * The loop runs on the SPARK MAX, every 1 ms. Run this one on a real arm. For simulator practice,
 * use the roboRIO arms from Deck 6.
 *
 * <p>The loop uses the NEO's encoder in NEO rotations, because kCos needs the sensor to read 0 at
 * flat and go negative below it. A through-bore with no zero centering wraps just below flat.
 */
public class SparkArmSubsystem extends SubsystemBase {
  private final SparkMax motor = new SparkMax(MOTOR_ID, MotorType.kBrushless);
  private final SparkAbsoluteEncoder throughBore = motor.getAbsoluteEncoder();
  private final RelativeEncoder neoEncoder = motor.getEncoder();
  private final SparkClosedLoopController closedLoop = motor.getClosedLoopController();

  private double goalRad;

  /** True once the arm has stayed near the last goal for 0.1 s. */
  public final Trigger atGoal =
      new Trigger(() -> Math.abs(goalRad - getAngleRad()) < TOLERANCE_RAD).debounce(0.1);

  public SparkArmSubsystem() {
    SparkMaxConfig config = sparkConfig();
    // #region maxmotion
    // In position control kV does nothing. MAXMotion uses it. Native units are RPM.
    config.closedLoop.feedForward.kV(KV / armRadPerSecToMotorRpm(1.0));
    config.closedLoop.maxMotion
        .cruiseVelocity(armRadPerSecToMotorRpm(MAX_VELOCITY_RAD_PER_S))
        .maxAcceleration(armRadPerSecToMotorRpm(MAX_ACCEL_RAD_PER_S2))
        .allowedProfileError(armRadToMotorRotations(ALLOWED_PROFILE_ERROR_RAD));
    // #endregion
    motor.configure(config, ResetMode.kResetSafeParameters, PersistMode.kPersistParameters);
  }

  /** Arm angle in radians, from the through-bore. 0 is flat and up is positive. */
  public double getAngleRad() {
    return encoderToArmRad(throughBore.getPosition());
  }

  /** The NEO's encoder forgets at power-off, so copy the true angle into it. */
  private void syncNeoEncoder() {
    neoEncoder.setPosition(armRadToMotorRotations(getAngleRad()));
  }

  // #region device
  private static SparkMaxConfig sparkConfig() {
    SparkMaxConfig config = ArmConfig.base();
    config.closedLoop
        .p(SPARK_KP).d(SPARK_KD)
        .outputRange(-MAX_OUTPUT, MAX_OUTPUT);
    config.closedLoop.feedForward
        .kCos(KG) // an arm uses kCos, not REV's kG
        .kCosRatio(1.0 / GEAR_RATIO); // NEO turns to arm turns
    return config;
  }

  private void setGoal(double goal) {
    goalRad = MathUtil.clamp(goal, SOFT_MIN_RAD, SOFT_MAX_RAD);
    double rotations = armRadToMotorRotations(goalRad);
    closedLoop.setSetpoint(rotations, ControlType.kPosition);
  }
  // #endregion

  /** Keep the last goal if the arm got there. If not, hold where the arm is now. */
  private void holdHere() {
    syncNeoEncoder();
    boolean nearGoal = Math.abs(goalRad - getAngleRad()) < TOLERANCE_RAD;
    setGoal(nearGoal ? goalRad : getAngleRad());
  }

  private void moveHere(double goal) {
    syncNeoEncoder();
    setGoal(goal);
  }

  // #region commands
  /** One message over CAN, then the SPARK does the work. */
  public Command moveTo(double goal) {
    return runOnce(() -> moveHere(goal))
        .andThen(Commands.waitUntil(atGoal))
        .withName("Arm moveTo");
  }

  /** On enable, aim at where the arm is, not an old goal. */
  public Command holdPosition() {
    return startRun(this::holdHere, () -> {}).withName("Arm hold");
  }
  // #endregion

  // #region smooth
  /** The same move with REV's onboard motion profile. */
  public Command moveToSmooth(double goal) {
    return runOnce(
            () -> {
              syncNeoEncoder();
              goalRad = MathUtil.clamp(goal, SOFT_MIN_RAD, SOFT_MAX_RAD);
              closedLoop.setSetpoint(
                  armRadToMotorRotations(goalRad), ControlType.kMAXMotionPositionControl);
            })
        .andThen(Commands.waitUntil(atGoal))
        .withName("Arm moveToSmooth");
  }
  // #endregion

  /** A SPARK reboot zeroes the NEO's encoder, which this loop uses. Stop and hold. */
  @Override
  public void periodic() {
    if (motor.getStickyWarnings().hasReset) {
      motor.clearFaults();
      holdHere();
    }
  }
}
