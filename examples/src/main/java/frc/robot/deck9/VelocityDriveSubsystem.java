package frc.robot.deck9;

import static edu.wpi.first.units.Units.Meters;
import static edu.wpi.first.units.Units.MetersPerSecond;
import static edu.wpi.first.units.Units.Volts;
import static frc.robot.deck9.Constants.DriveConstants.*;
import static frc.robot.deck9.Constants.SpeedConstants.*;

import com.revrobotics.PersistMode;
import com.revrobotics.ResetMode;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkBaseConfig.IdleMode;
import com.revrobotics.spark.config.SparkMaxConfig;
import edu.wpi.first.math.filter.SlewRateLimiter;
import edu.wpi.first.units.measure.Voltage;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.Encoder;
import edu.wpi.first.wpilibj.RobotBase;
import edu.wpi.first.wpilibj.drive.DifferentialDrive;
import edu.wpi.first.wpilibj.drive.DifferentialDrive.WheelSpeeds;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj.sysid.SysIdRoutineLog;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj2.command.sysid.SysIdRoutine;
import java.util.function.DoubleSupplier;

/** The KitBot drivetrain driven by speed: one encoder and one speed loop per side, in Java. */
public class VelocityDriveSubsystem extends SubsystemBase {
  private final SparkMax leftLeader = new SparkMax(LEFT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax leftFollower = new SparkMax(LEFT_FOLLOWER_ID, MotorType.kBrushed);
  private final SparkMax rightLeader = new SparkMax(RIGHT_LEADER_ID, MotorType.kBrushed);
  private final SparkMax rightFollower = new SparkMax(RIGHT_FOLLOWER_ID, MotorType.kBrushed);

  private final Encoder leftEncoder = new Encoder(LEFT_ENCODER_A, LEFT_ENCODER_B);
  private final Encoder rightEncoder = new Encoder(RIGHT_ENCODER_A, RIGHT_ENCODER_B);

  private final SpeedLoop leftLoop = new SpeedLoop();
  private final SpeedLoop rightLoop = new SpeedLoop();
  private final SlewRateLimiter testRamp = new SlewRateLimiter(MAX_ACCEL_MPS2);

  private double leftVolts;
  private double rightVolts;
  private double leftGoal;

  // Built only in simulation. On a real robot this stays null.
  private final DriveSim sim =
      RobotBase.isSimulation() ? new DriveSim(leftEncoder, rightEncoder) : null;

  public VelocityDriveSubsystem() {
    SparkMaxConfig common = new SparkMaxConfig();
    common.smartCurrentLimit(CURRENT_LIMIT_AMPS);
    common.idleMode(IdleMode.kBrake);

    SparkMaxConfig rightConfig = new SparkMaxConfig();
    rightConfig.apply(common).voltageCompensation(NOMINAL_VOLTS);
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

    leftEncoder.setDistancePerPulse(METERS_PER_PULSE);
    rightEncoder.setDistancePerPulse(METERS_PER_PULSE);
    leftEncoder.setReverseDirection(LEFT_ENCODER_REVERSED);
    rightEncoder.setReverseDirection(RIGHT_ENCODER_REVERSED);
  }

  /** Forward speed in m/s, the average of the two sides. */
  public double getSpeedMps() {
    return (leftEncoder.getRate() + rightEncoder.getRate()) / 2.0;
  }

  // #region goals
  /** Send one side's volts each, from wheel-speed goals in m/s. */
  private void driveAt(double leftMps, double rightMps) {
    leftGoal = leftMps;
    driveVolts(
        leftLoop.calculate(leftEncoder.getRate(), leftMps),
        rightLoop.calculate(rightEncoder.getRate(), rightMps));
  }
  // #endregion

  private void driveVolts(double left, double right) {
    leftVolts = left;
    rightVolts = right;
    leftLeader.setVoltage(left);
    rightLeader.setVoltage(right);
  }

  private void startFromHere() {
    leftLoop.reset(leftEncoder.getRate());
    rightLoop.reset(rightEncoder.getRate());
    testRamp.reset(getSpeedMps());
  }

  // #region factory
  /** The sticks ask for a speed, not a share of the battery. */
  public Command driveSpeed(DoubleSupplier forward, DoubleSupplier rotation) {
    return startRun(
            this::startFromHere,
            () -> {
              WheelSpeeds wheels =
                  DifferentialDrive.arcadeDriveIK(
                      forward.getAsDouble(), rotation.getAsDouble(), false);
              driveAt(wheels.left * MAX_SPEED_MPS, wheels.right * MAX_SPEED_MPS);
            })
        .withName("Speed Drive");
  }
  // #endregion

  /** Ramp up to one speed and hold it, for tuning. */
  public Command holdSpeed(double goalMps) {
    return startRun(
            this::startFromHere,
            () -> {
              double goal = testRamp.calculate(goalMps);
              driveAt(goal, goal);
            })
        .withName("Hold Speed");
  }

  /** Lean on the simulated robot. Does nothing on a real one. */
  public void setSimPush(double newtons) {
    if (sim != null) {
      sim.setPush(newtons);
    }
  }

  // #region sysid
  private final SysIdRoutine sysId =
      new SysIdRoutine(
          new SysIdRoutine.Config(),
          new SysIdRoutine.Mechanism(this::sysIdDrive, this::sysIdLog, this));

  private void sysIdDrive(Voltage volts) {
    driveVolts(volts.in(Volts), volts.in(Volts));
  }

  private void sysIdLog(SysIdRoutineLog log) {
    log.motor("drive-left")
        .voltage(Volts.of(leftVolts))
        .linearPosition(Meters.of(leftEncoder.getDistance()))
        .linearVelocity(MetersPerSecond.of(leftEncoder.getRate()));
    log.motor("drive-right")
        .voltage(Volts.of(rightVolts))
        .linearPosition(Meters.of(rightEncoder.getDistance()))
        .linearVelocity(MetersPerSecond.of(rightEncoder.getRate()));
  }

  /** The slow test: volts ramp up gently. */
  public Command sysIdQuasistatic(SysIdRoutine.Direction direction) {
    return sysId.quasistatic(direction);
  }

  /** The fast test: a sudden step in volts. */
  public Command sysIdDynamic(SysIdRoutine.Direction direction) {
    return sysId.dynamic(direction);
  }
  // #endregion

  @Override
  public void periodic() {
    SmartDashboard.putNumber("Drive/Left goal (mps)", leftGoal);
    SmartDashboard.putNumber("Drive/Left speed (mps)", leftEncoder.getRate());
    SmartDashboard.putNumber("Drive/Right speed (mps)", rightEncoder.getRate());
    SmartDashboard.putNumber("Drive/Left volts", leftVolts);
  }

  @Override
  public void simulationPeriodic() {
    // Real motors stop when disabled. Saved volts do not.
    boolean stopped = DriverStation.isDisabled();
    sim.step(stopped ? 0.0 : leftVolts, stopped ? 0.0 : rightVolts);
  }
}
