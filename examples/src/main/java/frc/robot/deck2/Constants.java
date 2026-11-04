package frc.robot.deck2;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  // #region constants
  public static final class DriveConstants {
    // CAN IDs: must match what you set in REV Hardware Client 2
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    // FIRST's 2026 KitBot code uses 60 A, to reduce breaker trips and CIM damage.
    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;

    // FIRST's 2026 KitBot values. arcadeDrive then squares them: 0.49 and 0.64 at full stick.
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;

  }
  // #endregion
}
