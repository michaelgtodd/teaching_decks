package frc.robot.deck8;

import static frc.robot.deck8.Constants.DriveConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.wpilibj.PowerDistribution;
import edu.wpi.first.wpilibj.RobotController;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/** The Deck 2 KitBot drivetrain, with the current limit from DriveLimits and current logging. */
public class CANDriveSubsystem extends SubsystemBase {
  private final SparkMax leftLeader = new SparkMax(LEFT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax leftFollower = new SparkMax(LEFT_FOLLOWER_ID, MotorType.kBrushed);
  private final SparkMax rightLeader = new SparkMax(RIGHT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax rightFollower = new SparkMax(RIGHT_FOLLOWER_ID, MotorType.kBrushed);

  private final DifferentialDrive drive = new DifferentialDrive(leftLeader, rightLeader);
  private final PowerDistribution pdh = new PowerDistribution();

  public CANDriveSubsystem() {
    SparkMaxConfig common = DriveLimits.commonConfig();

    SparkMaxConfig rightConfig = new SparkMaxConfig();
    rightConfig.apply(common).voltageCompensation(NOMINAL_VOLTS);
    // One side must be inverted. On the KitBot, it's the left.
    SparkMaxConfig leftConfig = new SparkMaxConfig();
    leftConfig.apply(rightConfig).inverted(true);

    SparkMaxConfig leftFollowerConfig = new SparkMaxConfig();
    leftFollowerConfig.apply(common).follow(leftLeader);
    SparkMaxConfig rightFollowerConfig = new SparkMaxConfig();
    rightFollowerConfig.apply(common).follow(rightLeader);

    ResetMode reset = ResetMode.kResetSafeParameters;
    PersistMode persist = PersistMode.kPersistParameters;
    leftLeader.configure(leftConfig, reset, persist);
    rightLeader.configure(rightConfig, reset, persist);
    leftFollower.configure(leftFollowerConfig, reset, persist);
    rightFollower.configure(rightFollowerConfig, reset, persist);
  }

  @Override
  public void periodic() {
    // #region log
    SmartDashboard.putNumber("Drive/MotorAmps", leftLeader.getOutputCurrent());
    SmartDashboard.putNumber("Drive/AppliedOutput", leftLeader.getAppliedOutput());
    SmartDashboard.putNumber("Drive/PdhChannelAmps", pdh.getCurrent(LEFT_LEADER_PDH_CHANNEL));
    SmartDashboard.putNumber("Drive/BatteryVolts", RobotController.getBatteryVoltage());
    // #endregion
  }

  /** Suppliers, not doubles: the stick is re-read on every 20 ms loop. */
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) {
    return run(() -> drive.arcadeDrive(forward.getAsDouble(), rotation.getAsDouble()))
        .withName("Arcade Drive");
  }
}
