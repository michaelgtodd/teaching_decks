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
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.math.util.Units;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj2.command.button.Trigger;

/** Version 1: PID and feedforward on the roboRIO, where you can see every number. */
public class ArmSubsystem extends SubsystemBase {
  // #region loop
  // A NEO is brushless. kBrushed would damage it.
  private final SparkMax motor = new SparkMax(MOTOR_ID, MotorType.kBrushless);
  private final SparkAbsoluteEncoder throughBore = motor.getAbsoluteEncoder();
  private final PIDController pid = new PIDController(KP, 0, KD);
  private final ArmFeedforward feedforward = new ArmFeedforward(KS, KG, KV);

  /** Runs every 20 ms. Feedforward holds, PID fixes the rest. */
  private void driveToTarget() {
    double angle = getAngleRad();
    double ffVolts = feedforward.calculate(angle, 0.0);
    double pidVolts = pid.calculate(angle, targetRad);
    double volts = ffVolts + pidVolts;
    lastVolts = MathUtil.clamp(volts, -MAX_VOLTS, MAX_VOLTS);
    motor.setVoltage(lastVolts);
  }
  // #endregion

  private final RelativeEncoder neoEncoder = motor.getEncoder();
  private final ArmSimModel sim = RobotBase.isSimulation() ? new ArmSimModel(motor) : null;

  private double targetRad;
  private double lastVolts;

  public ArmSubsystem() {
    motor.configure(
        ArmConfig.base(), ResetMode.kResetSafeParameters, PersistMode.kPersistParameters);
    pid.setTolerance(TOLERANCE_RAD);
  }

  /** Arm angle in radians, from the through-bore. 0 is flat and up is positive. */
  public double getAngleRad() {
    return encoderToArmRad(throughBore.getPosition());
  }

  /** The NEO's encoder forgets at power-off, so copy the true angle into it. */
  private void syncNeoEncoder() {
    neoEncoder.setPosition(armRadToMotorRotations(getAngleRad()));
  }

  private void prepare() {
    syncNeoEncoder();
    pid.reset();
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

  // #region commands
  /** Near the goal for 0.1 s in a row. */
  public final Trigger atGoal =
      new Trigger(pid::atSetpoint).debounce(0.1);

  public Command moveTo(double goalRad) {
    double goal =
        MathUtil.clamp(goalRad, SOFT_MIN_RAD, SOFT_MAX_RAD);
    return startRun(() -> startMove(goal), this::driveToTarget)
        .until(atGoal)
        .withName("Arm moveTo");
  }

  public Command holdPosition() {
    return startRun(this::startHold, this::driveToTarget)
        .withName("Arm hold");
  }
  // #endregion

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
    SmartDashboard.putNumber("Arm/Goal (deg)", Units.radiansToDegrees(pid.getSetpoint()));
    SmartDashboard.putNumber("Arm/Volts", lastVolts);
  }

  @Override
  public void simulationPeriodic() {
    sim.update();
  }
}
