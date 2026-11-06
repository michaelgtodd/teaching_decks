package frc.robot.deck12;

import static frc.robot.deck12.Constants.SimConstants.*;

import com.ctre.phoenix6.hardware.Pigeon2;
import com.ctre.phoenix6.sim.Pigeon2SimState;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj.Encoder;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotGearing;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotMotor;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotWheelSize;
import edu.wpi.first.wpilibj.simulation.EncoderSim;

/** Deck 10's physics model: it writes the encoders and gyro a real robot would read. */
public class DriveSim {
  private final DifferentialDrivetrainSim sim =
      DifferentialDrivetrainSim.createKitbotSim(
          KitbotMotor.kDualCIMPerSide, KitbotGearing.k8p45,
          KitbotWheelSize.kSixInch, null);

  private final StructPublisher<Pose2d> posePublisher =
      NetworkTableInstance.getDefault()
          .getStructTopic("SimPose", Pose2d.struct).publish();

  private final EncoderSim leftEncoder;
  private final EncoderSim rightEncoder;
  private final Pigeon2SimState gyro;

  public DriveSim(Encoder left, Encoder right, Pigeon2 pigeon) {
    leftEncoder = new EncoderSim(left);
    rightEncoder = new EncoderSim(right);
    gyro = pigeon.getSimState();
    sim.setPose(new Pose2d(START_X_METERS, START_Y_METERS, Rotation2d.kZero));
  }

  public void step(double leftVolts, double rightVolts) {
    sim.setInputs(leftVolts, rightVolts);
    sim.update(LOOP_SECONDS);

    leftEncoder.setDistance(sim.getLeftPositionMeters());
    leftEncoder.setRate(sim.getLeftVelocityMetersPerSecond());
    rightEncoder.setDistance(sim.getRightPositionMeters());
    rightEncoder.setRate(sim.getRightVelocityMetersPerSecond());
    gyro.setRawYaw(sim.getHeading().getDegrees());

    posePublisher.set(sim.getPose());
  }

  /** Where the simulated robot really is. A real robot can't ask this. */
  public Pose2d truePose() {
    return sim.getPose();
  }
}
