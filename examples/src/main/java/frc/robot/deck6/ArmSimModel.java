package frc.robot.deck6;

import static frc.robot.deck6.ArmUnits.*;
import static frc.robot.deck6.Constants.ArmConstants.*;

import com.revrobotics.sim.SparkAbsoluteEncoderSim;
import com.revrobotics.sim.SparkMaxSim;
import com.revrobotics.spark.SparkMax;
import edu.wpi.first.math.system.plant.DCMotor;
import edu.wpi.first.math.util.Units;
import edu.wpi.first.wpilibj.simulation.RoboRioSim;
import edu.wpi.first.wpilibj.simulation.SingleJointedArmSim;
import edu.wpi.first.wpilibj.smartdashboard.Mechanism2d;
import edu.wpi.first.wpilibj.smartdashboard.MechanismLigament2d;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;

/** A pretend arm: physics, a simulated SPARK, and a drawing for the dashboard. */
public class ArmSimModel {
  private static final double LOOP_SECONDS = 0.020;

  private final SparkMaxSim sparkSim;
  private final SparkAbsoluteEncoderSim encoderSim;

  // #region physics
  private final SingleJointedArmSim physics =
      new SingleJointedArmSim(
          DCMotor.getNEO(1),
          GEAR_RATIO,
          SingleJointedArmSim.estimateMOI(ARM_LENGTH_METERS, ARM_MASS_KG),
          ARM_LENGTH_METERS,
          HARD_STOP_MIN_RAD,
          HARD_STOP_MAX_RAD,
          true, // simulate gravity
          HARD_STOP_MIN_RAD); // start on the low stop
  private final Mechanism2d mechanism = new Mechanism2d(2, 2);
  private final MechanismLigament2d armLine =
      new MechanismLigament2d("Arm", ARM_LENGTH_METERS, 0);
  // #endregion

  public ArmSimModel(SparkMax motor) {
    sparkSim = new SparkMaxSim(motor, DCMotor.getNEO(1));
    encoderSim = sparkSim.getAbsoluteEncoderSim();
    sparkSim.setPosition(armRadToMotorRotations(HARD_STOP_MIN_RAD));
    encoderSim.setPosition(armRadToEncoder(HARD_STOP_MIN_RAD));
    mechanism.getRoot("Pivot", 1, 1).append(armLine);
    SmartDashboard.putData("Arm", mechanism);
  }

  // #region update
  /** Call from simulationPeriodic, every 20 ms. */
  public void update() {
    double battery = RoboRioSim.getVInVoltage();
    physics.setInputVoltage(sparkSim.getAppliedOutput() * battery);
    physics.update(LOOP_SECONDS);

    // With no conversion factors, iterate() wants the NEO's speed in RPM.
    double armRadPerSec = physics.getVelocityRadPerSec();
    sparkSim.iterate(armRadPerSecToMotorRpm(armRadPerSec), battery, LOOP_SECONDS);

    encoderSim.setPosition(armRadToEncoder(physics.getAngleRads()));
    encoderSim.setVelocity(Units.radiansPerSecondToRotationsPerMinute(armRadPerSec));

    armLine.setAngle(Units.radiansToDegrees(physics.getAngleRads()));
  }
  // #endregion
}
