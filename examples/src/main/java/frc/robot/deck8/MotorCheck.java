package frc.robot.deck8;

import static frc.robot.deck8.Constants.DriveConstants.*;

import edu.wpi.first.math.system.plant.DCMotor;

/** Checks the hand math for the KitBot. Call print() once from the RobotContainer constructor. */
public final class MotorCheck {
  private MotorCheck() {}

  // #region check
  public static void print() {
    // withReduction() applies the gearing to the motor's numbers.
    DCMotor side = DCMotor.getCIM(2).withReduction(GEARING);
    DCMotor cim = DCMotor.getCIM(1);

    double topSpeed = side.freeSpeedRadPerSec * WHEEL_RADIUS_METERS;
    double oneStalled = cim.getCurrent(0, NOMINAL_VOLTS);

    System.out.printf("Top speed, free-speed math: %.2f m/s%n", topSpeed);
    System.out.printf("Stall current: %.0f A per CIM, %.0f A for four%n",
        oneStalled, DRIVE_MOTORS * oneStalled);
  }
  // #endregion
}
