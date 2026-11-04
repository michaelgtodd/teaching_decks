package frc.robot.deck5;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class DriveConstants {
    // CAN IDs: must match what you set in the REV Hardware Client
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;

    /** Output used by the simple drive-out autos, from -1 to 1. */
    public static final double AUTO_DRIVE_OUTPUT = 0.5;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    // A good value found by live tuning belongs here, so it survives a restart.
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.5;
  }

  public static final class DashboardConstants {
    public static final double LOW_BATTERY_VOLTS = 11.0;
    public static final double LOW_BATTERY_SECONDS = 2.0;
  }

  public static final class ArmConstants {
    public static final int ARM_MOTOR_ID = 7;
    /** Volts per degree of error. Start small and raise it one change at a time. */
    public static final double ARM_KP = 0.05;
    public static final double DEGREES_PER_MOTOR_ROTATION = 3.6;
  }
}
