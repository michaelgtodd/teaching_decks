package frc.robot.deck8;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class DriveConstants {
    // CAN IDs: must match what you set in REV Hardware Client 2
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    // The PDH channel your left leader is wired to. Check your own robot.
    public static final int LEFT_LEADER_PDH_CHANNEL = 0;

    // FIRST's 2026 KitBot code uses 60 A, to reduce breaker trips and CIM damage.
    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;

    // The KitBot drivetrain: four CIMs, 8.45:1, 6 inch wheels.
    public static final int DRIVE_MOTORS = 4;
    public static final double GEARING = 8.45;
    public static final double WHEEL_RADIUS_METERS = 0.0762;

    // Assumed, not measured. Weigh your robot, and test your own wheels on your own carpet.
    public static final double ROBOT_MASS_KG = 50.0;
    public static final double WHEEL_GRIP = 1.0;
    public static final double GRAVITY = 9.81;
  }
}
