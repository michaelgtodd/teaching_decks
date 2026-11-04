package frc.robot.deck4;

import static frc.robot.deck4.Constants.DriveConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/** The Deck 2 KitBot drivetrain, plus the few lines the simulator needs. */
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

  // #region capture
  // The last outputs we commanded, saved for the simulator.
  private double leftOutput = 0.0;
  private double rightOutput = 0.0;

  private final DifferentialDrive drive =
      new DifferentialDrive(this::setLeft, this::setRight);

  private void setLeft(double output) {
    leftOutput = output;
    leftLeader.set(output);
  }

  private void setRight(double output) {
    rightOutput = output;
    rightLeader.set(output);
  }
  // #endregion

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

  /** Suppliers, not doubles: the stick is re-read on every 20 ms loop. */
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) {
    return run(() -> drive.arcadeDrive(forward.getAsDouble(), rotation.getAsDouble()))
        .withName("Arcade Drive");
  }

  // #region simperiodic
  // Built only in simulation. On a real robot this stays null.
  private final DriveSim sim =
      RobotBase.isSimulation() ? new DriveSim() : null;

  @Override
  public void simulationPeriodic() {
    double leftVolts = leftOutput * NOMINAL_VOLTS;
    double rightVolts = rightOutput * NOMINAL_VOLTS;

    // Real motors stop when disabled. Saved outputs do not.
    if (DriverStation.isDisabled()) {
      leftVolts = 0.0;
      rightVolts = 0.0;
    }
    sim.step(leftVolts, rightVolts);
  }
  // #endregion
}
