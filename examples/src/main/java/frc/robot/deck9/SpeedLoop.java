package frc.robot.deck9;

import static frc.robot.deck9.Constants.SpeedConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.math.controller.SimpleMotorFeedforward;

/** The speed loop for one side of the drivetrain. Speeds are in m/s and outputs are in volts. */
public class SpeedLoop {
  private final SimpleMotorFeedforward feedforward = new SimpleMotorFeedforward(KS, KV, KA);
  private final PIDController pid = new PIDController(KP, 0, 0);
  private double lastGoal;

  // #region loop
  /** Call once per loop. Returns the volts for this side. */
  public double calculate(double measured, double goal) {
    // The volts we can predict: kS, kV and kA.
    double ffVolts =
        feedforward.calculateWithVelocities(lastGoal, goal);
    // The volts we couldn't: P works on what is left over.
    double pidVolts = pid.calculate(measured, goal);
    lastGoal = goal;
    return MathUtil.clamp(
        ffVolts + pidVolts, -MAX_VOLTS, MAX_VOLTS);
  }
  // #endregion

  /** Start from the speed the robot is really going. */
  public void reset(double measured) {
    lastGoal = measured;
    pid.reset();
  }
}
