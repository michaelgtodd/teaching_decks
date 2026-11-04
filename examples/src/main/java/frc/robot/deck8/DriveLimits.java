package frc.robot.deck8;

import static frc.robot.deck8.Constants.DriveConstants.*;

import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.math.system.plant.DCMotor;

/** Picks a drivetrain current limit from the physics, then builds the config that uses it. */
public final class DriveLimits {
  private DriveLimits() {}

  // #region choose
  /** Motor current where the wheels start to slip. */
  public static double slipAmps() {
    double forceN = WHEEL_GRIP * ROBOT_MASS_KG * GRAVITY;
    double wheelNm = forceN * WHEEL_RADIUS_METERS;
    double motorNm = wheelNm / (DRIVE_MOTORS * GEARING);
    return DCMotor.getCIM(1).getCurrent(motorNm);
  }

  public static SparkMaxConfig commonConfig() {
    SparkMaxConfig config = new SparkMaxConfig();
    config.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    config.idleMode(IdleMode.kBrake);
    return config;
  }
  // #endregion
}
