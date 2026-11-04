package frc.robot.deck4;

/** Every magic number lives here, grouped by subsystem. */
public final class Constants {
  private Constants() {}

  public static final class DriveConstants {
    // CAN IDs: must match what you set in REV Hardware Client 2
    public static final int LEFT_LEADER_ID = 1;
    public static final int LEFT_FOLLOWER_ID = 2;
    public static final int RIGHT_LEADER_ID = 3;
    public static final int RIGHT_FOLLOWER_ID = 4;

    public static final int CURRENT_LIMIT_AMPS = 60;
    public static final double NOMINAL_VOLTS = 12.0;
  }

  public static final class OperatorConstants {
    public static final int DRIVER_PORT = 0;
    public static final double DEADBAND = 0.08;
    public static final double DRIVE_SCALE = 0.7;
    public static final double TURN_SCALE = 0.8;

    // Exercise: the forward command may change by at most this much per second.
    public static final double FORWARD_SLEW_PER_SEC = 1.0;
  }

  // #region simconstants
  public static final class SimConstants {
    // One robot loop: how far simulated time moves on each step.
    public static final double LOOP_SECONDS = 0.02;

    // Where the robot starts, in meters from the corner of the blue alliance wall.
    public static final double START_X_METERS = 2.0;
    public static final double START_Y_METERS = 4.0;
  }
  // #endregion
}
