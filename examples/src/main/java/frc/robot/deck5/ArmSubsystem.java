package frc.robot.deck5;

import static frc.robot.deck5.Constants.ArmConstants.*;

import com.revrobotics.RelativeEncoder;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/** Just enough arm to tune a gain live. Deck 6 builds the real one. */
public class ArmSubsystem extends SubsystemBase {
  private final SparkMax motor = new SparkMax(ARM_MOTOR_ID, MotorType.kBrushless);
  private final RelativeEncoder encoder = motor.getEncoder();
  private final PIDController pid = new PIDController(ARM_KP, 0.0, 0.0);

  public ArmSubsystem() {
    // #region armpid
    // PIDController is Sendable, so Elastic shows a box for each gain and the setpoint.
    SmartDashboard.putData("Arm PID", pid);
    // #endregion
  }

  private double angleDegrees() {
    return encoder.getPosition() * DEGREES_PER_MOTOR_ROTATION;
  }

  @Override
  public void periodic() {
    // Graph this one while you tune.
    SmartDashboard.putNumber("Arm Angle (deg)", angleDegrees());
  }

  /** Uses the setpoint in the PID widget, so you can change it from the dashboard. */
  public Command holdSetpoint() {
    return run(() -> motor.setVoltage(pid.calculate(angleDegrees())))
        .withName("Hold Arm Setpoint");
  }
}
