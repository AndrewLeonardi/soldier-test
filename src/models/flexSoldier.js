import * as THREE from 'three'
import { getPlasticMat, TOY } from './materials.js'

let _geo = null

function geo() {
  if (_geo) return _geo
  _geo = {
    base:       new THREE.CylinderGeometry(0.35, 0.45, 0.05, 24),
    upperLeg:   new THREE.CylinderGeometry(0.07, 0.065, 0.24, 8),
    lowerLeg:   new THREE.CylinderGeometry(0.065, 0.06, 0.22, 8),
    boot:       new THREE.BoxGeometry(0.13, 0.1, 0.19),
    torso:      new THREE.BoxGeometry(0.28, 0.30, 0.17),
    belt:       new THREE.BoxGeometry(0.3, 0.055, 0.19),
    shoulders:  new THREE.BoxGeometry(0.34, 0.07, 0.18),
    neck:       new THREE.CylinderGeometry(0.05, 0.06, 0.07, 8),
    head:       new THREE.SphereGeometry(0.1, 12, 10),
    helmetDome: new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    helmetBrim: new THREE.CylinderGeometry(0.14, 0.14, 0.018, 16),
    upperArm:   new THREE.CylinderGeometry(0.05, 0.045, 0.16, 8),
    forearm:    new THREE.CylinderGeometry(0.045, 0.035, 0.16, 8),
    hand:       new THREE.SphereGeometry(0.035, 6, 6),
    stock:      new THREE.BoxGeometry(0.04, 0.1, 0.07),
    rifleBody:  new THREE.BoxGeometry(0.03, 0.05, 0.42),
    barrel:     new THREE.CylinderGeometry(0.013, 0.013, 0.28, 6),
  }
  return _geo
}

export function createFlexSoldier(color = TOY.armyGreen) {
  const g = geo()
  const mat = getPlasticMat(color)
  const beltColor = color === TOY.armyGreen ? TOY.darkGreen : TOY.tanDark
  const beltMat = getPlasticMat(beltColor)

  const root = new THREE.Group()

  const base = new THREE.Mesh(g.base, mat)
  base.position.y = 0.025
  base.scale.set(1.15, 1, 1)
  root.add(base)

  const hips = new THREE.Group()
  hips.position.y = 0.52
  root.add(hips)

  // Left leg
  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.1, 0, 0)
  hips.add(leftLeg)
  const lUpperMesh = new THREE.Mesh(g.upperLeg, mat)
  lUpperMesh.position.y = -0.12
  leftLeg.add(lUpperMesh)
  const leftKnee = new THREE.Group()
  leftKnee.position.y = -0.24
  leftLeg.add(leftKnee)
  const lLowerMesh = new THREE.Mesh(g.lowerLeg, mat)
  lLowerMesh.position.y = -0.11
  leftKnee.add(lLowerMesh)
  const lBoot = new THREE.Mesh(g.boot, mat)
  lBoot.position.set(0, -0.24, 0.02)
  leftKnee.add(lBoot)

  // Right leg
  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.1, 0, 0)
  hips.add(rightLeg)
  const rUpperMesh = new THREE.Mesh(g.upperLeg, mat)
  rUpperMesh.position.y = -0.12
  rightLeg.add(rUpperMesh)
  const rightKnee = new THREE.Group()
  rightKnee.position.y = -0.24
  rightLeg.add(rightKnee)
  const rLowerMesh = new THREE.Mesh(g.lowerLeg, mat)
  rLowerMesh.position.y = -0.11
  rightKnee.add(rLowerMesh)
  const rBoot = new THREE.Mesh(g.boot, mat)
  rBoot.position.set(0, -0.24, 0.02)
  rightKnee.add(rBoot)

  // Spine
  const spine = new THREE.Group()
  spine.position.y = 0.04
  hips.add(spine)
  const torsoMesh = new THREE.Mesh(g.torso, mat)
  torsoMesh.position.y = 0.17
  spine.add(torsoMesh)
  const beltMesh = new THREE.Mesh(g.belt, beltMat)
  beltMesh.position.y = 0.02
  spine.add(beltMesh)
  const shoulderMesh = new THREE.Mesh(g.shoulders, mat)
  shoulderMesh.position.y = 0.33
  spine.add(shoulderMesh)

  // Head
  const headGrp = new THREE.Group()
  headGrp.position.y = 0.40
  spine.add(headGrp)
  const neckMesh = new THREE.Mesh(g.neck, mat)
  neckMesh.position.y = 0.0
  headGrp.add(neckMesh)
  const headMesh = new THREE.Mesh(g.head, mat)
  headMesh.position.y = 0.10
  headGrp.add(headMesh)
  const helmetDome = new THREE.Mesh(g.helmetDome, mat)
  helmetDome.position.y = 0.17
  headGrp.add(helmetDome)
  const helmetBrim = new THREE.Mesh(g.helmetBrim, mat)
  helmetBrim.position.y = 0.11
  headGrp.add(helmetBrim)

  // Left arm
  const leftArm = new THREE.Group()
  leftArm.position.set(-0.18, 0.30, 0)
  spine.add(leftArm)
  const lUpperArmMesh = new THREE.Mesh(g.upperArm, mat)
  lUpperArmMesh.position.y = -0.08
  leftArm.add(lUpperArmMesh)
  const leftElbow = new THREE.Group()
  leftElbow.position.y = -0.16
  leftArm.add(leftElbow)
  const lForearmMesh = new THREE.Mesh(g.forearm, mat)
  lForearmMesh.position.y = -0.08
  leftElbow.add(lForearmMesh)
  const lHand = new THREE.Mesh(g.hand, mat)
  lHand.position.y = -0.18
  leftElbow.add(lHand)

  // Right arm
  const rightArm = new THREE.Group()
  rightArm.position.set(0.18, 0.30, 0)
  spine.add(rightArm)
  const rUpperArmMesh = new THREE.Mesh(g.upperArm, mat)
  rUpperArmMesh.position.y = -0.08
  rightArm.add(rUpperArmMesh)
  const rightElbow = new THREE.Group()
  rightElbow.position.y = -0.16
  rightArm.add(rightElbow)
  const rForearmMesh = new THREE.Mesh(g.forearm, mat)
  rForearmMesh.position.y = -0.08
  rightElbow.add(rForearmMesh)
  const rHand = new THREE.Mesh(g.hand, mat)
  rHand.position.y = -0.18
  rightElbow.add(rHand)

  // Rifle
  const rifleGrp = new THREE.Group()
  rifleGrp.position.set(0, -0.14, 0.08)
  rightElbow.add(rifleGrp)
  const stock = new THREE.Mesh(g.stock, mat)
  stock.position.set(0, 0.06, -0.04)
  rifleGrp.add(stock)
  const rifleBody = new THREE.Mesh(g.rifleBody, mat)
  rifleBody.position.set(0, 0, 0.16)
  rifleGrp.add(rifleBody)
  const barrel = new THREE.Mesh(g.barrel, mat)
  barrel.position.set(0, 0, 0.50)
  barrel.rotation.x = Math.PI / 2
  rifleGrp.add(barrel)
  const flashGeo = new THREE.SphereGeometry(0.025, 6, 6)
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat)
  muzzleFlash.position.set(0, 0, 0.62)
  muzzleFlash.visible = false
  rifleGrp.add(muzzleFlash)

  root.traverse(child => {
    if (child.isMesh && child !== muzzleFlash) child.castShadow = true
  })

  return {
    group: root,
    parts: {
      root, base, hips,
      leftLeg, leftKnee, rightLeg, rightKnee,
      spine, headGrp,
      leftArm, leftElbow, rightArm, rightElbow,
      rifleGrp, muzzleFlash,
    },
  }
}

export function poseIdle(p, t) {
  p.spine.rotation.x = Math.sin(t * 0.8) * 0.02
  p.spine.rotation.z = Math.sin(t * 0.5) * 0.01
  p.headGrp.rotation.y = Math.sin(t * 0.3) * 0.15
  p.headGrp.rotation.x = Math.sin(t * 0.5) * 0.05
  p.leftArm.rotation.x = 0.05; p.leftArm.rotation.z = 0.15
  p.leftElbow.rotation.x = -0.2
  p.rightArm.rotation.x = 0.05; p.rightArm.rotation.z = -0.15
  p.rightElbow.rotation.x = -0.2
  p.leftLeg.rotation.x = 0; p.leftKnee.rotation.x = 0
  p.rightLeg.rotation.x = 0; p.rightKnee.rotation.x = 0
}

export function poseWalk(p, t, speed = 6) {
  const s = t * speed
  const stride = 0.5
  p.leftLeg.rotation.x = Math.sin(s) * stride
  p.leftKnee.rotation.x = Math.max(0, -Math.sin(s)) * stride * 0.8
  p.rightLeg.rotation.x = Math.sin(s + Math.PI) * stride
  p.rightKnee.rotation.x = Math.max(0, -Math.sin(s + Math.PI)) * stride * 0.8
  p.leftArm.rotation.x = Math.sin(s + Math.PI) * 0.4; p.leftArm.rotation.z = 0.1
  p.leftElbow.rotation.x = -0.3
  p.rightArm.rotation.x = Math.sin(s) * 0.4; p.rightArm.rotation.z = -0.1
  p.rightElbow.rotation.x = -0.3
  p.spine.rotation.z = Math.sin(s) * 0.06
  p.spine.rotation.x = 0.08 + Math.sin(s * 2) * 0.03
  p.headGrp.rotation.x = -0.08 + Math.sin(s * 2) * 0.02
  p.headGrp.rotation.y = 0
  p.hips.position.y = 0.52 + Math.abs(Math.sin(s)) * 0.03
}

export function poseAim(p, t) {
  const spineX = 0.15
  p.spine.rotation.x = spineX; p.spine.rotation.z = 0
  const armX = -Math.PI / 2
  const elbowX = -0.2
  p.rightArm.rotation.x = armX; p.rightArm.rotation.z = -0.1
  p.rightElbow.rotation.x = elbowX
  p.leftArm.rotation.x = -Math.PI / 2 + 0.1; p.leftArm.rotation.z = 0.3
  p.leftElbow.rotation.x = -0.3
  p.rifleGrp.rotation.x = -(spineX + armX + elbowX)
  p.headGrp.rotation.x = -0.1; p.headGrp.rotation.y = 0.05; p.headGrp.rotation.z = -0.05
  p.spine.rotation.x += Math.sin(t * 1.5) * 0.01
  p.leftLeg.rotation.x = 0.1; p.leftKnee.rotation.x = -0.15
  p.rightLeg.rotation.x = -0.15; p.rightKnee.rotation.x = -0.1
}

export function poseShoot(p, progress) {
  poseAim(p, 0)
  let kick
  if (progress < 0.3) {
    kick = Math.sin((progress / 0.3) * Math.PI)
  } else {
    const settle = (progress - 0.3) / 0.7
    kick = Math.exp(-settle * 5) * Math.sin(settle * 12) * 0.4
  }
  const armKick = kick * 0.15
  p.rightArm.rotation.x = -Math.PI / 2 + armKick
  p.spine.rotation.x = 0.15 - kick * 0.06
  p.headGrp.rotation.x = -0.1 + kick * 0.04
  p.spine.rotation.z = kick * 0.03
  p.rifleGrp.rotation.x = -(p.spine.rotation.x + p.rightArm.rotation.x + (-0.2))
  if (p.muzzleFlash) {
    p.muzzleFlash.visible = progress < 0.15
    if (p.muzzleFlash.visible) {
      p.muzzleFlash.scale.setScalar(0.8 + Math.random() * 0.4)
      p.muzzleFlash.rotation.z = Math.random() * Math.PI
    }
  }
}

export function poseHit(p, age) {
  const envelope = Math.exp(-age * 7)
  const freq = Math.max(8, 22 - age * 30)
  const shake = Math.sin(age * freq * Math.PI * 2) * envelope
  const stagger = Math.exp(-age * 4) * 0.2
  p.spine.rotation.z = shake * 0.15
  p.spine.rotation.x = stagger + shake * 0.08
  p.headGrp.rotation.x = shake * 0.2 + stagger * 0.5
  p.headGrp.rotation.y = shake * 0.08
  p.leftArm.rotation.x = 0.3 + shake * 0.2; p.leftArm.rotation.z = 0.15
  p.rightArm.rotation.x = 0.3 - shake * 0.15; p.rightArm.rotation.z = -0.15
  p.leftKnee.rotation.x = -stagger * 0.5; p.rightKnee.rotation.x = -stagger * 0.3
  p.leftLeg.rotation.x = stagger * 0.2; p.rightLeg.rotation.x = -stagger * 0.1
}

export function poseDeath(p, progress) {
  // IMPORTANT: Never rotate p.root — that pushes the mesh below ground.
  // Only animate body parts (spine, limbs, head) which stay above the base plate.
  p.root.position.y = 0
  p.root.rotation.x = 0
  p.root.rotation.z = 0

  if (progress < 0.2) {
    // Phase 1: stagger backward
    const t = progress / 0.2
    const ease = t * t
    p.spine.rotation.x = ease * 0.5
    p.spine.rotation.z = ease * 0.1
    p.headGrp.rotation.x = ease * 0.4
    p.headGrp.rotation.y = 0
    p.leftArm.rotation.x = ease * 0.6; p.leftArm.rotation.z = ease * 0.3
    p.rightArm.rotation.x = ease * 0.4; p.rightArm.rotation.z = -ease * 0.2
    p.leftElbow.rotation.x = -ease * 0.3
    p.rightElbow.rotation.x = -ease * 0.2
    p.leftLeg.rotation.x = 0; p.rightLeg.rotation.x = 0
    p.leftKnee.rotation.x = -ease * 0.3; p.rightKnee.rotation.x = -ease * 0.2
    p.hips.position.y = 0.52
  } else if (progress < 0.5) {
    // Phase 2: knees buckle, collapse downward
    const t = (progress - 0.2) / 0.3
    const ease = t * t * (3 - 2 * t)
    p.spine.rotation.x = 0.5 + ease * 0.3
    p.spine.rotation.z = 0.1 + ease * 0.15
    p.headGrp.rotation.x = 0.4 + ease * 0.3
    p.headGrp.rotation.y = ease * 0.1
    p.leftArm.rotation.x = 0.6 + ease * 0.2; p.leftArm.rotation.z = 0.3 + ease * 0.5
    p.rightArm.rotation.x = 0.4 + ease * 0.3; p.rightArm.rotation.z = -0.2 - ease * 0.4
    p.leftElbow.rotation.x = -0.3 - ease * 0.5
    p.rightElbow.rotation.x = -0.2 - ease * 0.4
    p.leftLeg.rotation.x = -ease * 0.4; p.leftKnee.rotation.x = -0.3 - ease * 0.6
    p.rightLeg.rotation.x = ease * 0.2; p.rightKnee.rotation.x = -0.2 - ease * 0.5
    // Hips drop as knees buckle
    p.hips.position.y = 0.52 - ease * 0.25
  } else {
    // Phase 3: slump forward, arms go limp
    const t = (progress - 0.5) / 0.5
    const ease = 1 - Math.pow(1 - t, 3)
    p.spine.rotation.x = 0.8 + ease * 0.4
    p.spine.rotation.z = 0.25 - ease * 0.1
    p.headGrp.rotation.x = 0.7 + ease * 0.3
    p.headGrp.rotation.y = 0.1 + ease * 0.1
    p.leftArm.rotation.x = 0.8; p.leftArm.rotation.z = 0.8 + ease * 0.3
    p.rightArm.rotation.x = 0.7; p.rightArm.rotation.z = -0.6 - ease * 0.3
    p.leftElbow.rotation.x = -0.8 - ease * 0.2
    p.rightElbow.rotation.x = -0.6 - ease * 0.3
    p.leftLeg.rotation.x = -0.4; p.leftKnee.rotation.x = -0.9
    p.rightLeg.rotation.x = 0.2; p.rightKnee.rotation.x = -0.7
    p.hips.position.y = 0.27
  }
}

export function poseThrow(p, progress) {
  const t = progress * progress * (3 - 2 * progress)
  if (t < 0.5) {
    const wind = t * 2
    p.spine.rotation.x = -0.15 * wind
    p.spine.rotation.z = 0.1 * wind
    p.rightArm.rotation.x = -0.3 - wind * 1.8
    p.rightArm.rotation.z = -0.2 - wind * 0.3
    p.rightElbow.rotation.x = -0.5 - wind * 1.0
    p.leftArm.rotation.x = -0.4 - wind * 0.5
    p.leftArm.rotation.z = 0.3
    p.leftElbow.rotation.x = -0.8
    p.leftLeg.rotation.x = 0.15 * wind
    p.rightLeg.rotation.x = -0.2 * wind
    p.leftKnee.rotation.x = 0
    p.rightKnee.rotation.x = -0.15 * wind
    p.headGrp.rotation.x = 0.1 * wind
    p.headGrp.rotation.y = 0
  } else {
    const release = (t - 0.5) * 2
    p.spine.rotation.x = -0.15 + release * 0.45
    p.spine.rotation.z = 0.1 - release * 0.2
    p.rightArm.rotation.x = -2.1 + release * 2.4
    p.rightArm.rotation.z = -0.5 + release * 0.4
    p.rightElbow.rotation.x = -1.5 + release * 1.2
    p.leftArm.rotation.x = -0.9 + release * 0.5
    p.leftArm.rotation.z = 0.3
    p.leftElbow.rotation.x = -0.8
    p.leftLeg.rotation.x = 0.15 + release * 0.15
    p.rightLeg.rotation.x = -0.2 + release * 0.1
    p.leftKnee.rotation.x = 0
    p.rightKnee.rotation.x = -0.15 + release * 0.15
    p.headGrp.rotation.x = 0.1 - release * 0.2
    p.headGrp.rotation.y = 0
  }
  p.rifleGrp.rotation.x = 0.5
  p.rifleGrp.rotation.z = 0.3
  p.hips.position.y = 0.52
}

export function poseRush(p, t) {
  const s = t * 9
  const stride = 0.6
  p.leftLeg.rotation.x = Math.sin(s) * stride
  p.leftKnee.rotation.x = Math.max(0, -Math.sin(s)) * stride * 0.85
  p.rightLeg.rotation.x = Math.sin(s + Math.PI) * stride
  p.rightKnee.rotation.x = Math.max(0, -Math.sin(s + Math.PI)) * stride * 0.85
  p.spine.rotation.x = 0.35; p.spine.rotation.z = Math.sin(s) * 0.05
  p.headGrp.rotation.x = -0.2; p.headGrp.rotation.y = 0
  p.rightArm.rotation.x = -0.8; p.rightArm.rotation.z = -0.1
  p.rightElbow.rotation.x = -0.4
  p.leftArm.rotation.x = Math.sin(s + Math.PI) * 0.5; p.leftArm.rotation.z = 0.15
  p.leftElbow.rotation.x = -0.4
  const spineX = 0.35, armX = -0.8, elbowX = -0.4
  p.rifleGrp.rotation.x = -(spineX + armX + elbowX)
  p.hips.position.y = 0.52 + Math.abs(Math.sin(s)) * 0.04
}
