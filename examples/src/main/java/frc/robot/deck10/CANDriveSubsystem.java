package frc.robot.deck10;

import static frc.robot.deck10.Constants.DriveConstants.*;
import static frc.robot.deck10.Constants.PathConstants.*;

import com.ctre.phoenix6.CANBus;
import com.ctre.phoenix6.hardware.Pigeon2;
import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.math.controller.SimpleMotorFeedforward;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.math.kinematics.DifferentialDriveOdometry;
import edu.wpi.first.math.kinematics.DifferentialDriveWheelSpeeds;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.Encoder;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import java.util.function.DoubleSupplier;

/** The Deck 4 KitBot drivetrain, plus the sensors and methods a path follower needs. */
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

  // None of these are in the stock KitBot.
  private final Encoder leftEncoder =
      new Encoder(LEFT_ENCODER_A, LEFT_ENCODER_B);
  private final Encoder rightEncoder =
      new Encoder(RIGHT_ENCODER_A, RIGHT_ENCODER_B);
  private final Pigeon2 gyro = new Pigeon2(GYRO_CAN_ID, new CANBus());

  private final DifferentialDriveOdometry odometry =
      new DifferentialDriveOdometry(gyro.getRotation2d(), 0.0, 0.0);

  private final SimpleMotorFeedforward feedforward = new SimpleMotorFeedforward(0.0, KV);
  private final PIDController leftWheelPid =
      new PIDController(USE_FEEDBACK ? WHEEL_KP : 0.0, 0.0, 0.0);
  private final PIDController rightWheelPid =
      new PIDController(USE_FEEDBACK ? WHEEL_KP : 0.0, 0.0, 0.0);

  private final StructPublisher<Pose2d> odometryPublisher =
      NetworkTableInstance.getDefault()
          .getStructTopic("OdometryPose", Pose2d.struct).publish();

  public CANDriveSubsystem() {
    leftEncoder.setDistancePerPulse(METERS_PER_CYCLE);
    rightEncoder.setDistancePerPulse(METERS_PER_CYCLE);

    SparkMaxConfig common = new SparkMaxConfig();
    common.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    common.idleMode(IdleMode.kBrake);

    // Leaders only: followers copy their leader's output.
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

  /** Where the robot thinks it is. */
  public Pose2d getPose() {
    return odometry.getPoseMeters();
  }

  /** Tell the robot where it is. Odometry believes you. */
  public void resetPose(Pose2d pose) {
    odometry.resetPosition(gyro.getRotation2d(),
        leftEncoder.getDistance(), rightEncoder.getDistance(), pose);
  }

  /** How fast it is moving, measured from the encoders. */
  public ChassisSpeeds getSpeeds() {
    return KINEMATICS.toChassisSpeeds(new DifferentialDriveWheelSpeeds(
        leftEncoder.getRate(), rightEncoder.getRate()));
  }

  /** Make the robot move at these speeds. */
  public void driveSpeeds(ChassisSpeeds speeds) {
    var wheels = KINEMATICS.toWheelSpeeds(speeds);
    double left = wheelVolts(wheels.leftMetersPerSecond,
        leftEncoder.getRate(), leftWheelPid);
    double right = wheelVolts(wheels.rightMetersPerSecond,
        rightEncoder.getRate(), rightWheelPid);
    setLeft(left / NOMINAL_VOLTS);
    setRight(right / NOMINAL_VOLTS);
    drive.feed();
  }

  // Deck 6 again: feedforward does the work, feedback fixes the rest.
  private double wheelVolts(double target, double measured, PIDController pid) {
    double volts = feedforward.calculate(target) + pid.calculate(measured, target);
    return MathUtil.clamp(volts, -NOMINAL_VOLTS, NOMINAL_VOLTS);
  }

  public void stop() {
    drive.stopMotor();
  }

  @Override
  public void periodic() {
    odometry.update(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance());
    odometryPublisher.set(getPose());
  }

  // Built only in simulation. On a real robot this stays null.
  private final DriveSim sim =
      RobotBase.isSimulation() ? new DriveSim(leftEncoder, rightEncoder, gyro) : null;

  /** Where the simulated robot really is. Falls back to odometry on a real robot. */
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
