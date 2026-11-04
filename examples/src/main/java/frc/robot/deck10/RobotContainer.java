package frc.robot.deck10;

import static frc.robot.deck10.Constants.OperatorConstants.*;
import static frc.robot.deck10.Constants.SimConstants.*;

import com.pathplanner.lib.util.PathPlannerLogging;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Translation2d;
import edu.wpi.first.math.trajectory.Trajectory;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj.smartdashboard.SendableChooser;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

/** Deck 4's robot, plus a chooser of autos. Point Robot.java here to run it in the simulator. */
public class RobotContainer {
  private final CANDriveSubsystem drive = new CANDriveSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);
  private final SendableChooser<Command> autoChooser = new SendableChooser<>();

  private final StructPublisher<Pose2d> targetPublisher =
      NetworkTableInstance.getDefault()
          .getStructTopic("TargetPose", Pose2d.struct).publish();

  public RobotContainer() {
    configureBindings();
    PathPlannerPaths.configure(drive);
    PathPlannerLogging.setLogTargetPoseCallback(targetPublisher::set);

    Trajectory wpilibPath = WpilibPaths.sCurve();
    autoChooser.setDefaultOption("PathPlanner S-curve", reportEnd(PathPlannerPaths.sCurve()));
    autoChooser.addOption("WPILib S-curve", reportEnd(WpilibPaths.follow(drive, wpilibPath)));
    autoChooser.addOption("Timed", TimedAuto.driveForward(drive));
    SmartDashboard.putData("Auto", autoChooser);
  }

  private void configureBindings() {
    // Sticks read negative when pushed away, and +rotation is counter-clockwise.
    drive.setDefaultCommand(
        drive.driveArcade(
            () -> -MathUtil.applyDeadband(driver.getLeftY(), DEADBAND) * DRIVE_SCALE,
            () -> -MathUtil.applyDeadband(driver.getRightX(), DEADBAND) * TURN_SCALE));
  }

  /** After a path, show how far the robot really ended from where it should be. */
  private Command reportEnd(Command path) {
    return path.finallyDo(() -> {
      var end = new Translation2d(END_X_METERS, END_Y_METERS);
      double missed = drive.truePose().getTranslation().getDistance(end);
      SmartDashboard.putNumber("Path/EndErrorMeters", missed);
      System.out.printf("Path ended %.2f m from the goal%n", missed);
    });
  }

  public Command getAutonomousCommand() {
    return autoChooser.getSelected();
  }
}
