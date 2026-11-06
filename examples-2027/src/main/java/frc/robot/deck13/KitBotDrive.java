package frc.robot.deck13;

import java.util.function.DoubleSupplier;
import org.wpilib.command3.Command;
import org.wpilib.command3.Mechanism;
import org.wpilib.drive.DifferentialDrive;
import org.wpilib.hardware.motor.MotorController;
import org.wpilib.units.measure.Time;

/** Deck 2's drivetrain as a v3 mechanism. The motor controllers come from Robot.java. */
public class KitBotDrive implements Mechanism {
  private final DifferentialDrive drive;

  public KitBotDrive(MotorController left, MotorController right) {
    drive = new DifferentialDrive(left, right);
  }

  // #region arcade
  /** Drive from the sticks. Lowest priority, so any other command can take over. */
  public Command arcadeDrive(DoubleSupplier fwd, DoubleSupplier rot) {
    return runRepeatedly(() -> drive.arcadeDrive(fwd.getAsDouble(), rot.getAsDouble()))
        .withPriority(Command.LOWEST_PRIORITY)
        .named("Arcade Drive");
  }
  // #endregion

  // #region drive-for
  /** Drive at fixed outputs for a set time. */
  public Command driveFor(double fwd, double rot, Time duration) {
    return runRepeatedly(() -> drive.arcadeDrive(fwd, rot))
        .named("Drive " + fwd + ", " + rot)
        .withTimeout(duration);
  }
  // #endregion

  // #region idle
  /** Idle by driving at zero, so motor safety stays fed. idleFor() uses this too. */
  @Override
  public Command idle() {
    return runRepeatedly(drive::stopMotor)
        .withPriority(Command.LOWEST_PRIORITY)
        .named("Drive Idle");
  }
  // #endregion
}
