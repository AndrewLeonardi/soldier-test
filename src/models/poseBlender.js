import { easeInOutQuad } from './easing.js'

const JOINT_NAMES = [
  'hips', 'spine', 'headGrp',
  'leftLeg', 'leftKnee', 'rightLeg', 'rightKnee',
  'leftArm', 'leftElbow', 'rightArm', 'rightElbow',
  'rifleGrp',
]

export function capturePose(parts) {
  const snap = {}
  for (const name of JOINT_NAMES) {
    const joint = parts[name]
    if (!joint) continue
    snap[name] = { rx: joint.rotation.x, ry: joint.rotation.y, rz: joint.rotation.z }
  }
  return snap
}

export function applyPose(parts, pose) {
  for (const name of JOINT_NAMES) {
    const jp = pose[name]
    if (!jp) continue
    const joint = parts[name]
    if (!joint) continue
    joint.rotation.x = jp.rx
    joint.rotation.y = jp.ry
    joint.rotation.z = jp.rz
  }
}

export function blendPoses(from, to, t) {
  const result = {}
  for (const name of JOINT_NAMES) {
    const a = from[name]
    const b = to[name]
    if (!a || !b) { result[name] = b ?? a ?? { rx: 0, ry: 0, rz: 0 }; continue }
    result[name] = {
      rx: a.rx + (b.rx - a.rx) * t,
      ry: a.ry + (b.ry - a.ry) * t,
      rz: a.rz + (b.rz - a.rz) * t,
    }
  }
  return result
}

export class PoseBlender {
  constructor() {
    this.fromPose = null
    this.blendProgress = 1
    this.blendDuration = 0.25
    this.currentState = ''
  }

  notifyStateChange(parts, newState, duration) {
    if (newState === this.currentState) return
    this.fromPose = capturePose(parts)
    this.blendProgress = 0
    this.blendDuration = duration ?? this._getDefaultDuration(this.currentState, newState)
    this.currentState = newState
  }

  update(parts, dt) {
    if (this.blendProgress >= 1 || !this.fromPose) return
    this.blendProgress += dt / this.blendDuration
    if (this.blendProgress >= 1) { this.blendProgress = 1; this.fromPose = null; return }
    const targetPose = capturePose(parts)
    const t = easeInOutQuad(this.blendProgress)
    const blended = blendPoses(this.fromPose, targetPose, t)
    applyPose(parts, blended)
  }

  _getDefaultDuration(from, to) {
    if (to === 'hit') return 0.08
    if (to === 'death') return 0.15
    if (to === 'fire' || to === 'firing') return 0.12
    if (from === 'idle' && to === 'walk') return 0.25
    if (from === 'walk' && to === 'idle') return 0.3
    if (to === 'aim') return 0.2
    return 0.25
  }

  snapToTarget() { this.blendProgress = 1; this.fromPose = null }
  get isBlending() { return this.blendProgress < 1 }
}
