package frc.robot.deck7;

import com.ctre.phoenix6.controls.Follower;
import com.ctre.phoenix6.hardware.TalonFX;
import com.ctre.phoenix6.signals.MotorAlignmentValue;
import com.revrobotics.spark.ClosedLoopSlot;
import com.revrobotics.spark.SparkBase.ControlType;
import com.revrobotics.spark.SparkClosedLoopController;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkMaxConfig;

/** The other on-controller features from the Deck 7 tables, in one small compiled file. */
public final class Followers {
  private Followers() {}

  /** REV: the follower is set up in its config. True means spin opposite to the leader. */
  public static SparkMaxConfig revFollower(SparkMax leader) {
    return (SparkMaxConfig) new SparkMaxConfig().follow(leader, true);
  }

  /** CTRE: the follower is a control request sent to the second motor. */
  public static void ctreFollower(TalonFX follower, int leaderId) {
    follower.setControl(new Follower(leaderId, MotorAlignmentValue.Opposed));
  }

  /** SPARK gain slots run from kSlot0 to kSlot3, and you pick one when you set the setpoint. */
  public static void revLastSlot(SparkClosedLoopController controller, double rpm) {
    controller.setSetpoint(rpm, ControlType.kVelocity, ClosedLoopSlot.kSlot3);
  }
}
