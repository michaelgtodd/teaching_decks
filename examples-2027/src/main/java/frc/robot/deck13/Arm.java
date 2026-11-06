package frc.robot.deck13;

import static frc.robot.deck13.Constants.ArmConstants.*;

import java.util.function.DoubleSupplier;
import org.wpilib.command3.Command;
import org.wpilib.command3.Mechanism;
import org.wpilib.hardware.motor.MotorController;
import org.wpilib.math.controller.PIDController;

/** Deck 6's arm loop as a v3 command. The angle, in radians, comes from an encoder. */
public class Arm implements Mechanism {
  private final MotorController motor;
  private final DoubleSupplier angle; // radians, 0 = level
  private final PIDController pid = new PIDController(KP, 0.0, 0.0);

  public Arm(MotorController motor, DoubleSupplier angle) {
    this.motor = motor;
    this.angle = angle;
  }

  // #region hold
  public Command holdAt(double target) {
    return run(coroutine -> {
          pid.reset();
          while (true) {
            double now = angle.getAsDouble();
            double ff = KG * Math.cos(now); // gravity
            motor.setVoltage(ff + pid.calculate(now, target));
            coroutine.yield(); // one 20 ms step
          }
        })
        .whenExited(() -> motor.setVoltage(0.0))
        .named("Arm Hold");
  }
  // #endregion
}
