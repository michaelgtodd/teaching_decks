package frc.robot.deck6;

import static frc.robot.deck6.Constants.ArmConstants.*;
import static frc.robot.deck6.Constants.OperatorConstants.*;

import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

public class RobotContainer {
  // All three arm versions have moveTo, holdPosition and atGoal, so swap them here.
  private final ProfiledArmSubsystem arm = new ProfiledArmSubsystem();
  private final CommandXboxController driver = new CommandXboxController(DRIVER_PORT);

  public RobotContainer() {
    configureBindings();
  }

  // #region bindings
  private void configureBindings() {
    // With nothing else running, hold still.
    // This also stops the arm jumping when you enable.
    arm.setDefaultCommand(arm.holdPosition());

    driver.a().onTrue(arm.moveTo(STOW_RAD));
    driver.y().onTrue(arm.moveTo(SCORE_RAD));

    // A Trigger can watch the arm, not just a button.
    // This only fires if the arm has arrived.
    driver.rightBumper().and(arm.atGoal).onTrue(Commands.print("Score!"));
  }
  // #endregion

  public Command getAutonomousCommand() {
    return Commands.none();
  }
}
