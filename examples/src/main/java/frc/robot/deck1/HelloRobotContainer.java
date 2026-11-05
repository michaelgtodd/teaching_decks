package frc.robot.deck1;

import edu.wpi.first.wpilibj2.command.Command;
import frc.robot.commands.Autos;
import frc.robot.commands.ExampleCommand;
import frc.robot.deck1.Constants.OperatorConstants;
import frc.robot.subsystems.ExampleSubsystem;
// #region import
import edu.wpi.first.wpilibj2.command.Commands;
// #endregion
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;
import edu.wpi.first.wpilibj2.command.button.Trigger;

/** The Command Robot template's RobotContainer, plus one binding. */
public class HelloRobotContainer {
  private final ExampleSubsystem m_exampleSubsystem = new ExampleSubsystem();

  // #region controller
  private final CommandXboxController m_driverController =
      new CommandXboxController(OperatorConstants.kDriverControllerPort);
  // #endregion

  public HelloRobotContainer() {
    configureBindings();
  }

  // #region bindings
  private void configureBindings() {
    // Schedule `ExampleCommand` when `exampleCondition` changes to `true`
    new Trigger(m_exampleSubsystem::exampleCondition)
        .onTrue(new ExampleCommand(m_exampleSubsystem));

    // Schedule `exampleMethodCommand` when the Xbox controller's B button is pressed,
    // cancelling on release.
    m_driverController.b().whileTrue(m_exampleSubsystem.exampleMethodCommand());

    // Print a message when the A button is pressed.
    m_driverController.a()
        .onTrue(Commands.print("Hello, robot"));
  }
  // #endregion

  public Command getAutonomousCommand() {
    return Autos.exampleAuto(m_exampleSubsystem);
  }
}
