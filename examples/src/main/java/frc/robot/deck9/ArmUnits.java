package frc.robot.deck9;

import static frc.robot.deck9.Constants.ArmConstants.*;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.util.Units;

/**
 * The hardware boundary. The SPARK speaks rotations and RPM, and everything else speaks arm
 * radians. This is the only class that converts.
 *
 * <p>We use no SPARK conversion factors, so the SPARK reports plain rotations and RPM.
 */
public final class ArmUnits {
  private ArmUnits() {}

  // #region boundary
  public static double encoderToArmRad(double encoderRotations) {
    double turnsFromFlat = encoderRotations - ENCODER_FLAT_ROTATIONS;
    return MathUtil.angleModulus(Units.rotationsToRadians(turnsFromFlat));
  }

  public static double armRadToMotorRotations(double armRad) {
    return Units.radiansToRotations(armRad) * GEAR_RATIO;
  }
  // #endregion

  /** The through-bore is on the arm shaft, so its RPM is the arm's RPM. */
  public static double encoderRpmToArmRadPerSec(double encoderRpm) {
    return Units.rotationsPerMinuteToRadiansPerSecond(encoderRpm);
  }

  public static double armRadPerSecToMotorRpm(double armRadPerSec) {
    return Units.radiansPerSecondToRotationsPerMinute(armRadPerSec) * GEAR_RATIO;
  }

  /** The reverse of encoderToArmRad, for the simulator. Raw readings run from 0 to 1. */
  public static double armRadToEncoder(double armRad) {
    double rotations = Units.radiansToRotations(armRad) + ENCODER_FLAT_ROTATIONS;
    return MathUtil.inputModulus(rotations, 0.0, 1.0);
  }
}
