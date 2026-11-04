package frc.robot.deck10;

import choreo.auto.AutoFactory;
import choreo.auto.AutoRoutine;
import choreo.auto.AutoTrajectory;
import choreo.trajectory.DifferentialSample;
import edu.wpi.first.math.controller.LTVUnicycleController;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.wpilibj2.command.Commands;

/** ChoreoLib on a tank drive. toHub.traj comes from the Choreo app. */
public class ChoreoPaths {
  private final CANDriveSubsystem drive;
  private final LTVUnicycleController follower = new LTVUnicycleController(0.02);
  private final AutoFactory factory;

  public ChoreoPaths(CANDriveSubsystem drive) {
    this.drive = drive;
    factory = new AutoFactory(drive::getPose, drive::resetPose, this::follow, true, drive);
  }

  // #region slide
  // You write the follower. Choreo hands you one sample per loop.
  private void follow(DifferentialSample sample) {
    ChassisSpeeds plan = sample.getChassisSpeeds();
    drive.driveSpeeds(follower.calculate(drive.getPose(), sample.getPose(),
        plan.vxMetersPerSecond, plan.omegaRadiansPerSecond));
  }

  public AutoRoutine toHubAndLaunch() {
    AutoRoutine routine = factory.newRoutine("toHubAndLaunch");
    AutoTrajectory toHub = routine.trajectory("toHub"); // deploy/choreo/toHub.traj
    routine.active().onTrue(Commands.sequence(toHub.resetOdometry(), toHub.cmd()));
    toHub.atTime("spinUp").onTrue(Commands.print("spin up")); // a marker from the app
    toHub.done().onTrue(Commands.print("launch fuel here"));
    return routine;
  }
  // #endregion
}
