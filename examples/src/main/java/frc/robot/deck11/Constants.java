package frc.robot.deck11;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class LauncherConstants {
    // A stand-in launcher with two motors. IDs and motor type are examples: use your robot's.
    public static final int FLYWHEEL_ID = 5;
    public static final int FEEDER_ID = 6;

    public static final double FLYWHEEL_SPEED = 0.8; // fraction of battery voltage
    public static final double FEED_SPEED = 0.6;
    public static final double LAUNCH_SECONDS = 1.0;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;
  }
}
