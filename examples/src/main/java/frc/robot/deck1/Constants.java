package frc.robot.deck1;

public final class Constants {
  public static class OperatorConstants {
    public static final int kDriverControllerPort = 0;
  }

  // #region roller
  public static class RollerConstants {
    // The feeder roller on the 2026 KitBot. Must match REV Hardware Client 2.
    public static final int kMotorId = 6;

    // Output from -1 to 1. 0.3 is 30% of battery voltage.
    public static final double kSpeed = 0.3;
  }
  // #endregion
}
