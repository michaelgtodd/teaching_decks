package frc.robot.deck13;

import static frc.robot.deck13.Constants.FeederConstants.*;

import org.wpilib.command3.Command;
import org.wpilib.command3.Mechanism;
import org.wpilib.hardware.discrete.DigitalInput;
import org.wpilib.hardware.motor.MotorController;

/** A feeder roller with a beam-break sensor: true when a game piece blocks the beam. */
public class Feeder implements Mechanism {
  private final MotorController motor;
  private final DigitalInput beamBreak = new DigitalInput(BEAM_BREAK_CHANNEL);

  public Feeder(MotorController motor) {
    this.motor = motor;
  }

  public boolean hasPiece() {
    return !beamBreak.get(); // the beam is broken while a piece is in it
  }

  // #region wrong
  /** Wrong: if this is canceled while waiting, the last line never runs. */
  public Command intakeUnsafe() {
    return run(coroutine -> {
          motor.setThrottle(FEED_SPEED);
          coroutine.waitUntil(this::hasPiece);
          motor.setThrottle(0.0);
        })
        .named("Intake (unsafe)");
  }
  // #endregion

  // #region right
  /** Right: whenExited runs however the command ends. */
  public Command intake() {
    return run(coroutine -> {
          motor.setThrottle(FEED_SPEED);
          coroutine.waitUntil(this::hasPiece);
        })
        .whenExited(() -> motor.setThrottle(0.0))
        .named("Intake");
  }
  // #endregion
}
