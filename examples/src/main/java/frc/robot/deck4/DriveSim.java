package frc.robot.deck4;

import static frc.robot.deck4.Constants.SimConstants.*;

import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotGearing;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotMotor;
import edu.wpi.first.wpilibj.simulation.DifferentialDrivetrainSim.KitbotWheelSize;

/** The physics model and its output. Only ever built when running in simulation. */
public class DriveSim {
  // #region sim
  private final DifferentialDrivetrainSim sim =
      DifferentialDrivetrainSim.createKitbotSim(
          KitbotMotor.kDualCIMPerSide, KitbotGearing.k8p45,
          KitbotWheelSize.kSixInch, null);

  private final StructPublisher<Pose2d> posePublisher =
      NetworkTableInstance.getDefault()
          .getStructTopic("SimPose", Pose2d.struct).publish();

  public void step(double leftVolts, double rightVolts) {
    sim.setInputs(leftVolts, rightVolts);
    sim.update(LOOP_SECONDS);
    posePublisher.set(sim.getPose());
  }
  // #endregion

  public DriveSim() {
    // Without this the robot starts at (0, 0), the corner of the field.
    sim.setPose(new Pose2d(START_X_METERS, START_Y_METERS, Rotation2d.kZero));
  }
}
