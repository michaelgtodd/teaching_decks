package frc.robot.deck1;

// #region subsystem
import static frc.robot.deck1.Constants.RollerConstants.*;
import com.revrobotics.spark.SparkLowLevel.MotorType;
import com.revrobotics.spark.SparkMax;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;

public class RollerSubsystem extends SubsystemBase {
  private final SparkMax m_motor =
      new SparkMax(kMotorId, MotorType.kBrushed);

  public Command spinCommand() {
    return startEnd(
        () -> m_motor.set(kSpeed),
        () -> m_motor.set(0));
  }
}
// #endregion
