package frc.robot.deck11;

import static frc.robot.deck11.Constants.LauncherConstants.*;

import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

/** A stand-in launcher: a flywheel and a feeder. Swap in your robot's real mechanism. */
public class Launcher extends SubsystemBase {
  private final SparkMax flywheel = new SparkMax(FLYWHEEL_ID, MotorType.kBrushed);
  private final SparkMax feeder = new SparkMax(FEEDER_ID, MotorType.kBrushed);

  // #region commands
  /** Starts the flywheel, then ends at once. The flywheel keeps spinning. */
  public Command spinUp() {
    return runOnce(() -> flywheel.set(FLYWHEEL_SPEED)).withName("Spin up");
  }

  /** Feeds for LAUNCH_SECONDS, then stops both motors. */
  public Command launch() {
    return run(() -> feeder.set(FEED_SPEED))
        .withTimeout(LAUNCH_SECONDS)
        .finallyDo(this::stop)
        .withName("Launch");
  }
  // #endregion

  private void stop() {
    flywheel.stopMotor();
    feeder.stopMotor();
  }
}
