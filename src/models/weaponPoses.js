/**
 * Weapon-specific poses for soldiers.
 * Each pose sets all joint rotations for the specific weapon stance.
 */

/**
 * Rocket Launcher — Kneeling pose
 * Right knee down, left knee up, tube on right shoulder
 */
export function poseRocketKneel(p, t) {
  // Standing rocket stance — legs braced, tube on shoulder
  p.leftLeg.rotation.x = 0.15
  p.leftKnee.rotation.x = -0.1
  p.rightLeg.rotation.x = -0.2
  p.rightKnee.rotation.x = -0.1
  p.hips.position.y = 0.52

  // Right arm: raise to shoulder the tube
  p.rightArm.rotation.x = -1.3
  p.rightArm.rotation.z = -0.15
  p.rightElbow.rotation.x = -0.5

  // Left arm: supporting from below
  p.leftArm.rotation.x = -1.1
  p.leftArm.rotation.z = 0.25
  p.leftElbow.rotation.x = -0.7

  // Spine: slight lean back from weight
  p.spine.rotation.x = -0.05 + Math.sin(t * 0.8) * 0.01
  p.spine.rotation.z = 0

  // Head: looking along the tube
  p.headGrp.rotation.x = 0.05 + Math.sin(t * 1.2) * 0.01
  p.headGrp.rotation.y = 0.05

  // Weapon angle compensation
  const spineX = -0.05
  const armX = -1.3
  const elbowX = -0.5
  p.rifleGrp.rotation.x = -(spineX + armX + elbowX) - 0.2
  p.rifleGrp.rotation.z = 0
}

/**
 * Rocket Launcher — Fire recoil
 * Big backward kick from shoulder
 */
export function poseRocketFire(p, progress) {
  // Start from kneeling pose
  poseRocketKneel(p, 0)

  let kick
  if (progress < 0.2) {
    kick = Math.sin((progress / 0.2) * Math.PI)
  } else {
    const settle = (progress - 0.2) / 0.8
    kick = Math.exp(-settle * 4) * Math.sin(settle * 8) * 0.5
  }

  // Big recoil
  p.spine.rotation.x = 0.05 - kick * 0.2
  p.rightArm.rotation.x = -1.4 + kick * 0.3
  p.headGrp.rotation.x = -0.05 + kick * 0.1

  // Weapon kicks up
  p.rifleGrp.rotation.x += kick * 0.4
}

/**
 * Machine Gun — Crouching behind bipod
 * Low crouch, both arms forward gripping the weapon
 */
export function poseMachineGunCrouch(p, t) {
  // Deep crouch
  p.leftLeg.rotation.x = -0.7
  p.leftKnee.rotation.x = -1.4
  p.rightLeg.rotation.x = -0.6
  p.rightKnee.rotation.x = -1.3
  p.hips.position.y = 0.3

  // Both arms forward, gripping gun
  p.rightArm.rotation.x = -Math.PI / 2 + 0.1
  p.rightArm.rotation.z = -0.1
  p.rightElbow.rotation.x = -0.3

  p.leftArm.rotation.x = -Math.PI / 2 + 0.15
  p.leftArm.rotation.z = 0.2
  p.leftElbow.rotation.x = -0.4

  // Hunched forward
  p.spine.rotation.x = 0.4 + Math.sin(t * 1.5) * 0.01
  p.spine.rotation.z = 0

  // Head: scanning
  p.headGrp.rotation.x = -0.25
  p.headGrp.rotation.y = Math.sin(t * 0.8) * 0.08

  // Weapon aim compensation
  const spineX = 0.4
  const armX = -Math.PI / 2 + 0.1
  const elbowX = -0.3
  p.rifleGrp.rotation.x = -(spineX + armX + elbowX)
}

/**
 * Machine Gun — Firing (rapid vibration)
 */
export function poseMachineGunFire(p, t) {
  poseMachineGunCrouch(p, t)

  // Rapid vibration from recoil
  const shake = Math.sin(t * 60) * 0.02
  p.rightArm.rotation.x += shake
  p.leftArm.rotation.x += shake * 0.7
  p.spine.rotation.x += shake * 0.3
  p.headGrp.rotation.x += shake * 0.5
}
