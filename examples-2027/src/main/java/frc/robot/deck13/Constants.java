package frc.robot.deck13;

import static org.wpilib.units.Units.Seconds;

import org.wpilib.units.measure.Time;

/** Every magic number lives here, grouped by mechanism. Same values as Deck 2. */
public final class Constants {
  private Constants() {}

  public static final class AutoConstants {
    public static final double AUTO_SPEED = 0.4; // fraction of full output
    public static final Time DRIVE_OUT = Seconds.of(2.0);
    public static final Time PAUSE = Seconds.of(1.0);
    public static final Time TURN = Seconds.of(0.8);
  }

  public static final class FeederConstants {
    public static final int BEAM_BREAK_CHANNEL = 0; // example DIO channel
    public static final double FEED_SPEED = 0.6;
  }

  public static final class ArmConstants {
    public static final double KP = 6.0; // volts per radian, as in Deck 6
    public static final double KG = 0.9; // volts to hold the arm level
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;
  }
}
