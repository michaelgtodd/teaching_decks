package frc.robot.deck3;

import static frc.robot.deck2.Constants.DriveConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.epilogue.Logged;
import edu.wpi.first.wpilibj.RobotController;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/**
 * The Deck 2 KitBot drivetrain with telemetry added. It shows levels 1 and 3 together so one file
 * compiles both. On a real robot you would rarely publish the same value both ways.
 */
// #region logged
@Logged
public class CANDriveSubsystem extends SubsystemBase {
  // Robot() calls Epilogue.bind(this), which reads these.
  public double getLeftCurrentAmps() {
    return leftLeader.getOutputCurrent();
  }

  public double getRightCurrentAmps() {
    return rightLeader.getOutputCurrent();
  }

  @Logged(name = "BrownedOut")
  public boolean isBrownedOut() {
    return RobotController.isBrownedOut();
  }
  // #endregion

  private final SparkMax leftLeader = new SparkMax(LEFT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax leftFollower = new SparkMax(LEFT_FOLLOWER_ID, MotorType.kBrushed);
  private final SparkMax rightLeader = new SparkMax(RIGHT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax rightFollower = new SparkMax(RIGHT_FOLLOWER_ID, MotorType.kBrushed);

  // DifferentialDrive is Sendable, so @Logged also records the left and right speeds it commands.
  private final DifferentialDrive drive = new DifferentialDrive(leftLeader, rightLeader);

  public CANDriveSubsystem() {
    SparkMaxConfig common = new SparkMaxConfig();
    common.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    common.idleMode(IdleMode.kBrake);

    // Leaders only: 26.x firmware compensates followers twice.
    SparkMaxConfig rightConfig = new SparkMaxConfig();
    rightConfig.apply(common).voltageCompensation(NOMINAL_VOLTS);
    // One side must be inverted. On the KitBot, it's the left.
    SparkMaxConfig leftConfig = new SparkMaxConfig();
    leftConfig.apply(rightConfig).inverted(true);

    SparkMaxConfig leftFollowerConfig = new SparkMaxConfig();
    leftFollowerConfig.apply(common).follow(leftLeader);
    SparkMaxConfig rightFollowerConfig = new SparkMaxConfig();
    rightFollowerConfig.apply(common).follow(rightLeader);

    // Reset: a swapped-in SPARK starts from a known state.
    // Persist: settings survive a brownout or breaker trip.
    ResetMode reset = ResetMode.kResetSafeParameters;
    PersistMode persist = PersistMode.kPersistParameters;
    leftLeader.configure(leftConfig, reset, persist);
    rightLeader.configure(rightConfig, reset, persist);
    leftFollower.configure(leftFollowerConfig, reset, persist);
    rightFollower.configure(rightFollowerConfig, reset, persist);
  }

  // #region dashboard
  @Override
  public void periodic() {
    // Runs every 20 ms, even while the robot is disabled.
    SmartDashboard.putNumber("Drive/LeftAppliedOutput", leftLeader.getAppliedOutput());
    SmartDashboard.putNumber("Drive/RightAppliedOutput", rightLeader.getAppliedOutput());
    SmartDashboard.putNumber("Drive/BatteryVolts", RobotController.getBatteryVoltage());
  }
  // #endregion

  /** Suppliers, not doubles: the stick is re-read on every 20 ms loop. */
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) {
    return run(() -> drive.arcadeDrive(forward.getAsDouble(), rotation.getAsDouble()))
        .withName("Arcade Drive");
  }
}
