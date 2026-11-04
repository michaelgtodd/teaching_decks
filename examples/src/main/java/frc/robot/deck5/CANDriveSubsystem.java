package frc.robot.deck5;

import static frc.robot.deck5.Constants.DriveConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.wpilibj.RobotController;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/** The deck 2 KitBot drivetrain, plus what it sends to the dashboard. */
public class CANDriveSubsystem extends SubsystemBase {
  // CIMs are BRUSHED motors: the classic KitBot bug.
  private final SparkMax leftLeader =
      new SparkMax(LEFT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax leftFollower =
      new SparkMax(LEFT_FOLLOWER_ID, MotorType.kBrushed);
  private final SparkMax rightLeader =
      new SparkMax(RIGHT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax rightFollower =
      new SparkMax(RIGHT_FOLLOWER_ID, MotorType.kBrushed);

  private final DifferentialDrive drive =
      new DifferentialDrive(leftLeader, rightLeader);

  public CANDriveSubsystem() {
    SparkMaxConfig common = new SparkMaxConfig();
    common.voltageCompensation(NOMINAL_VOLTS).smartCurrentLimit(CURRENT_LIMIT_AMPS);
    common.idleMode(IdleMode.kBrake);

    SparkMaxConfig leftConfig = new SparkMaxConfig();
    leftConfig.apply(common);

    // The two sides face opposite ways, so one must be inverted.
    SparkMaxConfig rightConfig = new SparkMaxConfig();
    rightConfig.apply(common).inverted(true);

    SparkMaxConfig leftFollowerConfig = new SparkMaxConfig();
    leftFollowerConfig.apply(common).follow(leftLeader);

    SparkMaxConfig rightFollowerConfig = new SparkMaxConfig();
    rightFollowerConfig.apply(common).follow(rightLeader);

    // Reset first so a swapped-in SPARK starts from a known state.
    // Persist so settings survive a brownout or breaker trip.
    ResetMode reset = ResetMode.kResetSafeParameters;
    PersistMode persist = PersistMode.kPersistParameters;
    leftLeader.configure(leftConfig, reset, persist);
    rightLeader.configure(rightConfig, reset, persist);
    leftFollower.configure(leftFollowerConfig, reset, persist);
    rightFollower.configure(rightFollowerConfig, reset, persist);

    publishWidgets();
  }

  // #region publish
  /** Once, from the constructor: items with a widget. */
  private void publishWidgets() {
    SmartDashboard.putData(this); // shows the running command
    SmartDashboard.putData("Drive Out 1 s", driveOut(1.0));
  }

  /** Every 20 ms, on its own. Send what someone will read. */
  @Override
  public void periodic() {
    SmartDashboard.putNumber(
        "Battery (V)", RobotController.getBatteryVoltage());
    SmartDashboard.putNumber(
        "Left Output (%)",
        leftLeader.getAppliedOutput() * 100.0);
  }
  // #endregion

  /** Suppliers, not doubles: the stick is re-read on every 20 ms loop. */
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) {
    return run(() -> drive.arcadeDrive(forward.getAsDouble(), rotation.getAsDouble()))
        .withName("Arcade Drive");
  }

  /** Drives forward, then stops. The name is what the dashboard shows. */
  public Command driveOut(double seconds) {
    return run(() -> drive.arcadeDrive(AUTO_DRIVE_OUTPUT, 0.0))
        .withTimeout(seconds)
        .andThen(runOnce(drive::stopMotor))
        .withName("Drive Out");
  }
}
