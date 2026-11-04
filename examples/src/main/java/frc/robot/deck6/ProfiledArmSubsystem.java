package frc.robot.deck6;

import static frc.robot.deck6.ArmUnits.*;
import static frc.robot.deck6.Constants.ArmConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.RelativeEncoder;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkAbsoluteEncoder;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.controller.ArmFeedforward;
import edu.wpi.first.math.controller.ProfiledPIDController;
import edu.wpi.first.math.trajectory.TrapezoidProfile;
import edu.wpi.first.math.util.Units;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj2.command.button.Trigger;

/** Version 2: the same arm, with a motion profile between it and the goal. */
public class ProfiledArmSubsystem extends SubsystemBase {
  private final SparkMax motor = new SparkMax(MOTOR_ID, MotorType.kBrushless);
  private final SparkAbsoluteEncoder throughBore = motor.getAbsoluteEncoder();
  private final RelativeEncoder neoEncoder = motor.getEncoder();
  private final ArmFeedforward feedforward = new ArmFeedforward(KS, KG, KV);

  // #region loop
  private final ProfiledPIDController controller =
      new ProfiledPIDController(
          KP, 0, KD,
          new TrapezoidProfile.Constraints(
              MAX_VELOCITY_RAD_PER_S, MAX_ACCEL_RAD_PER_S2));

  private void driveToTarget() {
    double angle = getAngleRad();
    // Moves the profile one step, then runs PID against it.
    double pidVolts = controller.calculate(angle, targetRad);
    double speed = controller.getSetpoint().velocity;
    double ffVolts = feedforward.calculate(angle, speed);
    double volts = ffVolts + pidVolts;
    lastVolts = MathUtil.clamp(volts, -MAX_VOLTS, MAX_VOLTS);
    motor.setVoltage(lastVolts);
  }
  // #endregion

  private final ArmSimModel sim = RobotBase.isSimulation() ? new ArmSimModel(motor) : null;

  private double targetRad;
  private double lastVolts;

  /** True once the profile has finished and the arm has stayed near the goal for 0.1 s. */
  public final Trigger atGoal = new Trigger(controller::atGoal).debounce(0.1);

  public ProfiledArmSubsystem() {
    motor.configure(
        ArmConfig.base(), ResetMode.kResetSafeParameters, PersistMode.kPersistParameters);
    controller.setTolerance(TOLERANCE_RAD);
  }

  /** Arm angle in radians, from the through-bore. 0 is flat and up is positive. */
  public double getAngleRad() {
    return encoderToArmRad(throughBore.getPosition());
  }

  /** The NEO's encoder forgets at power-off, so copy the true angle into it. */
  private void syncNeoEncoder() {
    neoEncoder.setPosition(armRadToMotorRotations(getAngleRad()));
  }

  /** Start the profile from where the arm really is. */
  private void prepare() {
    syncNeoEncoder();
    controller.reset(getAngleRad(), encoderRpmToArmRadPerSec(throughBore.getVelocity()));
  }

  private void startMove(double goalRad) {
    prepare();
    targetRad = goalRad;
  }

  /** Keep the last goal if the arm got there. If not, hold where the arm is now. */
  private void startHold() {
    prepare();
    if (Math.abs(targetRad - getAngleRad()) > TOLERANCE_RAD) {
      targetRad = getAngleRad();
    }
  }

  public Command moveTo(double goalRad) {
    double goal = MathUtil.clamp(goalRad, SOFT_MIN_RAD, SOFT_MAX_RAD);
    return startRun(() -> startMove(goal), this::driveToTarget)
        .until(atGoal)
        .withName("Arm moveTo");
  }

  public Command holdPosition() {
    return startRun(this::startHold, this::driveToTarget).withName("Arm hold");
  }

  /** A SPARK reboot zeroes the NEO's encoder and the soft limits use it, so catch that. */
  private void recoverFromReboot() {
    if (motor.getStickyWarnings().hasReset) {
      motor.clearFaults();
      syncNeoEncoder();
    }
  }

  @Override
  public void periodic() {
    recoverFromReboot();
    SmartDashboard.putNumber("Arm/Through-bore raw (rot)", throughBore.getPosition());
    SmartDashboard.putNumber("Arm/Angle (deg)", Units.radiansToDegrees(getAngleRad()));
    SmartDashboard.putNumber(
        "Arm/Setpoint (deg)", Units.radiansToDegrees(controller.getSetpoint().position));
    SmartDashboard.putNumber("Arm/Volts", lastVolts);
  }

  @Override
  public void simulationPeriodic() {
    sim.update();
  }
}
