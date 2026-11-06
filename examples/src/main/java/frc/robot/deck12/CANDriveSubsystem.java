package frc.robot.deck12;

import static frc.robot.deck12.Constants.DriveConstants.*;
import static frc.robot.deck12.Constants.SimConstants.*;

import com.ctre.phoenix6.CANBus;
import com.ctre.phoenix6.hardware.Pigeon2;
import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.math.Matrix;
import edu.wpi.first.math.estimator.DifferentialDrivePoseEstimator;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.numbers.N1;
import edu.wpi.first.math.numbers.N3;
import edu.wpi.first.math.util.Units;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.Encoder;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/** Deck 10's KitBot with sensors, with odometry swapped for a pose estimator. */
public class CANDriveSubsystem extends SubsystemBase {
  // CIMs are BRUSHED motors: the classic KitBot bug.
  private final SparkMax leftLeader = new SparkMax(LEFT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax leftFollower = new SparkMax(LEFT_FOLLOWER_ID, MotorType.kBrushed);
  private final SparkMax rightLeader = new SparkMax(RIGHT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax rightFollower = new SparkMax(RIGHT_FOLLOWER_ID, MotorType.kBrushed);

  // The last outputs we commanded, saved for the simulator.
  private double leftOutput = 0.0;
  private double rightOutput = 0.0;

  private final DifferentialDrive drive = new DifferentialDrive(this::setLeft, this::setRight);

  private void setLeft(double output) {
    leftOutput = output;
    leftLeader.set(output);
  }

  private void setRight(double output) {
    rightOutput = output;
    rightLeader.set(output);
  }

  // None of these are in the stock KitBot.
  private final Encoder leftEncoder = new Encoder(LEFT_ENCODER_A, LEFT_ENCODER_B);
  private final Encoder rightEncoder = new Encoder(RIGHT_ENCODER_A, RIGHT_ENCODER_B);
  private final Pigeon2 gyro = new Pigeon2(GYRO_CAN_ID, new CANBus());

  // #region estimator
  // Replaces DifferentialDriveOdometry: the same wheel and
  // gyro readings, plus poses from a camera.
  private final DifferentialDrivePoseEstimator estimator =
      new DifferentialDrivePoseEstimator(
          KINEMATICS, gyro.getRotation2d(), 0.0, 0.0,
          startingGuess());

  /** Called by a camera class with a pose from tags. */
  public void addVisionMeasurement(
      Pose2d pose, double seconds, Matrix<N3, N1> stdDevs) {
    estimator.addVisionMeasurement(pose, seconds, stdDevs);
  }
  // #endregion

  @Override
  public void periodic() {
    // Every 20 ms: wheels and gyro, exactly as odometry did. This constructor keeps WPILib's
    // default trust in them: 0.02 m, 0.02 m and 0.01 rad.
    estimator.update(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance());
    estimatePublisher.set(getPose());
  }

  private final StructPublisher<Pose2d> estimatePublisher =
      NetworkTableInstance.getDefault()
          .getStructTopic("EstimatedPose", Pose2d.struct).publish();

  public CANDriveSubsystem() {
    leftEncoder.setDistancePerPulse(METERS_PER_CYCLE);
    rightEncoder.setDistancePerPulse(METERS_PER_CYCLE);

    SparkMaxConfig common = new SparkMaxConfig();
    common.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    common.idleMode(IdleMode.kBrake);

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

  /** Exercise: the estimator's first guess is off to the side of where the robot really is. */
  private static Pose2d startingGuess() {
    return new Pose2d(START_X_METERS, START_Y_METERS + START_GUESS_ERROR_METERS, Rotation2d.kZero);
  }

  /** Suppliers, not doubles: the stick is re-read on every 20 ms loop. */
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) {
    return run(() -> drive.arcadeDrive(forward.getAsDouble(), rotation.getAsDouble()))
        .withName("Arcade Drive");
  }

  /** Where the robot thinks it is: wheels, gyro and camera combined. */
  public Pose2d getPose() {
    return estimator.getEstimatedPosition();
  }

  /** How fast the robot is turning, in degrees per second, from the two wheel speeds. */
  public double turnRateDegreesPerSecond() {
    double radiansPerSecond =
        (rightEncoder.getRate() - leftEncoder.getRate()) / TRACK_WIDTH_METERS;
    return Units.radiansToDegrees(radiansPerSecond);
  }

  // Built only in simulation. On a real robot this stays null.
  private final DriveSim sim =
      RobotBase.isSimulation() ? new DriveSim(leftEncoder, rightEncoder, gyro) : null;

  /** Where the simulated robot really is. Falls back to the estimate on a real robot. */
  public Pose2d truePose() {
    return sim != null ? sim.truePose() : getPose();
  }

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
}
