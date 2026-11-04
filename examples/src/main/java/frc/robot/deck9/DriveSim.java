package frc.robot.deck9;

import static frc.robot.deck9.Constants.SpeedConstants.*;

import edu.wpi.first.math.system.plant.DCMotor;
import edu.wpi.first.wpilibj.Encoder;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim;
import edu.wpi.first.wpilibj.simulation.EncoderSim;

/** A pretend KitBot: the physics, friction, and a defender who can lean on you. */
public class DriveSim {
  private static final DCMotor ALL_FOUR_CIMS = DCMotor.getCIM(4);

  // createKitbotSim assumes a much lighter robot, so build the full version with our mass.
  private final DifferentialDrivetrainSim physics =
      new DifferentialDrivetrainSim(
          DCMotor.getCIM(2),
          GEAR_RATIO,
          SPIN_INERTIA_KG_M2,
          ROBOT_MASS_KG,
          WHEEL_RADIUS_METERS,
          TRACK_WIDTH_METERS,
          null);

  private final EncoderSim leftEncoderSim;
  private final EncoderSim rightEncoderSim;
  private double pushNewtons;

  public DriveSim(Encoder leftEncoder, Encoder rightEncoder) {
    leftEncoderSim = new EncoderSim(leftEncoder);
    rightEncoderSim = new EncoderSim(rightEncoder);
  }

  /** A steady push against the robot, in newtons. */
  public void setPush(double newtons) {
    pushNewtons = newtons;
  }

  /** Call from simulationPeriodic, every 20 ms. */
  public void step(double leftVolts, double rightVolts) {
    physics.setInputs(
        afterLosses(leftVolts, physics.getLeftVelocityMetersPerSecond()),
        afterLosses(rightVolts, physics.getRightVelocityMetersPerSecond()));
    physics.update(LOOP_SECONDS);
    leftEncoderSim.setDistance(physics.getLeftPositionMeters());
    leftEncoderSim.setRate(physics.getLeftVelocityMetersPerSecond());
    rightEncoderSim.setDistance(physics.getRightPositionMeters());
    rightEncoderSim.setRate(physics.getRightVelocityMetersPerSecond());
  }

  /** The volts left over once the push and friction have taken their share. */
  private double afterLosses(double volts, double speed) {
    double voltsPerNewton =
        ALL_FOUR_CIMS.rOhms * WHEEL_RADIUS_METERS / (GEAR_RATIO * ALL_FOUR_CIMS.KtNMPerAmp);
    double drive = volts - pushNewtons * voltsPerNewton;
    if (Math.abs(speed) > STOPPED_MPS) {
      return drive - FRICTION_VOLTS * Math.signum(speed);
    }
    // Stopped: friction holds until the push is big enough to break it free.
    return Math.abs(drive) > FRICTION_VOLTS ? drive - FRICTION_VOLTS * Math.signum(drive) : 0.0;
  }
}
