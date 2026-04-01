import { TrainingTarget, TrainingProjectile } from '../../types'

/**
 * Tank Operation Training — NERO Hybrid
 *
 * SCRIPTED (free):
 *   - Turret auto-tracks nearest target
 *   - Shell trajectory computed from ballistics
 *
 * NEURAL NET LEARNS:
 *   - Steering (turn left/right)
 *   - Throttle (forward/reverse)
 *   - Fire trigger (when to shoot)
 *
 * The fun: Gen 1 = tank spinning in circles, smashing into walls.
 * Gen 20+ = tank navigates toward targets, positions itself, and fires.
 */

const TANK_MAX_SPEED = 2.5
const TANK_TURN_SPEED = 1.2 // rad/sec
const TANK_ACCELERATION = 3.0
const TANK_FRICTION = 0.92
const SHELL_SPEED = 12
const SHELL_GRAVITY = 6
const SHELL_COOLDOWN = 2.0
const BLAST_RADIUS = 2.0
const TARGET_RADIUS = 0.5
const ARENA_MIN_X = -4
const ARENA_MAX_X = 10
const ARENA_MIN_Z = -5
const ARENA_MAX_Z = 5

export interface TankSimState {
  tankPos: [number, number, number]
  tankAngle: number       // body heading
  tankSpeed: number       // forward velocity
  turretAngle: number     // world angle the turret points (scripted)
  weaponCooldown: number
  targets: TrainingTarget[]
  projectiles: TrainingProjectile[]
  score: number
  shellsFired: number
  shellsHit: number
  time: number
  closestApproach: Record<string, number>
  totalDistance: number    // how far the tank drove
}

function idealShellElevation(distance: number): number {
  const ratio = (SHELL_GRAVITY * distance) / (SHELL_SPEED * SHELL_SPEED)
  if (ratio > 1 || ratio < -1) return 0.35
  return 0.5 * Math.asin(Math.min(1, Math.max(-1, ratio)))
}

export function createTankTargets(): TrainingTarget[] {
  // Targets spread wide — tank must DRIVE to reach them
  return [
    { id: 't1', position: [6, 0, 0], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't2', position: [4, 0, 4], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't3', position: [8, 0, -3], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't4', position: [9, 0, 3], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't5', position: [3, 0, -4], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
  ]
}

export function initTankSim(): TankSimState {
  return {
    tankPos: [-3, 0, 0],
    tankAngle: 0, // facing +X
    tankSpeed: 0,
    turretAngle: 0,
    weaponCooldown: 0,
    targets: createTankTargets(),
    projectiles: [],
    score: 0,
    shellsFired: 0,
    shellsHit: 0,
    time: 0,
    closestApproach: { t1: 999, t2: 999, t3: 999, t4: 999, t5: 999 },
    totalDistance: 0,
  }
}

export function getTankInputs(state: TankSimState): number[] {
  const { tankPos, tankAngle, weaponCooldown, targets, tankSpeed, time } = state

  // Find nearest alive target
  let nearest = targets[0]
  let nearestDist = 999
  for (const t of targets) {
    if (!t.alive) continue
    const dx = t.position[0] - tankPos[0]
    const dz = t.position[2] - tankPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < nearestDist) { nearestDist = dist; nearest = t }
  }

  // Angle to target relative to tank heading
  const dx = nearest.position[0] - tankPos[0]
  const dz = nearest.position[2] - tankPos[2]
  const targetAngle = Math.atan2(dx, dz)
  let relAngle = targetAngle - tankAngle
  while (relAngle > Math.PI) relAngle -= Math.PI * 2
  while (relAngle < -Math.PI) relAngle += Math.PI * 2

  const aliveCount = targets.filter(t => t.alive).length

  return [
    relAngle / Math.PI,                              // angle to target (-1 to 1)
    Math.min(1, nearestDist / 12),                    // distance (0-1)
    tankSpeed / TANK_MAX_SPEED,                       // current speed (-1 to 1)
    Math.min(1, weaponCooldown / SHELL_COOLDOWN),     // cooldown (0-1)
    aliveCount / 5,                                   // targets remaining
    Math.min(1, time / 8),                            // time elapsed
  ]
}

export function applyTankOutputs(
  state: TankSimState,
  outputs: number[],
  dt: number,
): void {
  // ── NET OUTPUT[0]: Steering ──
  state.tankAngle += outputs[0] * TANK_TURN_SPEED * dt

  // ── NET OUTPUT[1]: Throttle ──
  const throttle = outputs[1] // -1 (reverse) to +1 (forward)
  state.tankSpeed += throttle * TANK_ACCELERATION * dt
  state.tankSpeed = Math.max(-TANK_MAX_SPEED * 0.5, Math.min(TANK_MAX_SPEED, state.tankSpeed))
  state.tankSpeed *= TANK_FRICTION // friction

  // Move tank
  const moveX = Math.sin(state.tankAngle) * state.tankSpeed * dt
  const moveZ = Math.cos(state.tankAngle) * state.tankSpeed * dt
  state.tankPos[0] += moveX
  state.tankPos[2] += moveZ
  state.totalDistance += Math.abs(state.tankSpeed * dt)

  // Clamp to arena
  state.tankPos[0] = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, state.tankPos[0]))
  state.tankPos[2] = Math.max(ARENA_MIN_Z, Math.min(ARENA_MAX_Z, state.tankPos[2]))

  // ── SCRIPTED: Turret auto-tracks nearest target ──
  let nearest = state.targets[0]
  let nearestDist = 999
  for (const t of state.targets) {
    if (!t.alive) continue
    const dx = t.position[0] - state.tankPos[0]
    const dz = t.position[2] - state.tankPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < nearestDist) { nearestDist = dist; nearest = t }
  }
  const tdx = nearest.position[0] - state.tankPos[0]
  const tdz = nearest.position[2] - state.tankPos[2]
  state.turretAngle = Math.atan2(tdx, tdz)

  // ── NET OUTPUT[2]: Fire trigger ──
  if (outputs[2] > 0 && state.weaponCooldown <= 0 && nearestDist < 10) {
    // Scripted: compute ideal elevation from ballistics
    const elevation = idealShellElevation(nearestDist)
    const cosEl = Math.cos(elevation)
    const sinEl = Math.sin(elevation)
    const dir = [
      Math.sin(state.turretAngle) * cosEl,
      sinEl,
      Math.cos(state.turretAngle) * cosEl,
    ]

    state.projectiles.push({
      id: `sh${state.shellsFired}`,
      position: [
        state.tankPos[0] + dir[0] * 0.8,
        0.5, // barrel height
        state.tankPos[2] + dir[2] * 0.8,
      ],
      velocity: [
        dir[0] * SHELL_SPEED,
        dir[1] * SHELL_SPEED,
        dir[2] * SHELL_SPEED,
      ],
      age: 0,
      alive: true,
    })

    state.weaponCooldown = SHELL_COOLDOWN
    state.shellsFired++
  }

  state.weaponCooldown = Math.max(0, state.weaponCooldown - dt)
}

export function tickTankProjectiles(state: TankSimState, dt: number): void {
  for (const p of state.projectiles) {
    if (!p.alive) continue
    p.age += dt

    p.velocity[1] -= SHELL_GRAVITY * dt
    p.position[0] += p.velocity[0] * dt
    p.position[1] += p.velocity[1] * dt
    p.position[2] += p.velocity[2] * dt

    // Track closest approach
    for (const t of state.targets) {
      if (!t.alive) continue
      const dx = p.position[0] - t.position[0]
      const dz = p.position[2] - t.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < (state.closestApproach[t.id] ?? 999)) {
        state.closestApproach[t.id] = dist
      }
    }

    // Direct hit
    for (const t of state.targets) {
      if (!t.alive) continue
      const dx = p.position[0] - t.position[0]
      const dy = p.position[1] - t.position[1]
      const dz = p.position[2] - t.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < t.radius + 0.4) {
        t.alive = false
        p.alive = false
        state.shellsHit++
        state.score += 120
      }
    }

    // Ground impact → splash
    if (p.position[1] < 0.1 && p.alive) {
      p.alive = false
      for (const t of state.targets) {
        if (!t.alive) continue
        const dx = p.position[0] - t.position[0]
        const dz = p.position[2] - t.position[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < BLAST_RADIUS) {
          t.alive = false
          state.shellsHit++
          state.score += 90 * (1 - dist / BLAST_RADIUS)
        }
      }
    }

    if (p.age > 5 || Math.abs(p.position[0]) > 25 || Math.abs(p.position[2]) > 25) {
      p.alive = false
    }
  }

  state.projectiles = state.projectiles.filter(p => p.alive)
}

export function scoreTankFitness(state: TankSimState): number {
  const destroyed = state.targets.filter(t => !t.alive).length

  // Hits dominate
  let fitness = destroyed * 200

  // Close approaches for gradient
  for (const t of state.targets) {
    if (!t.alive) continue
    const closest = state.closestApproach[t.id] ?? 999
    if (closest < 5) {
      fitness += (5 - closest) * 6
    }
  }

  // Reward for moving (encourages exploration, not sitting still)
  fitness += Math.min(state.totalDistance, 8) * 5

  // Firing reward
  fitness += Math.min(state.shellsFired, 4) * 5

  // Accuracy bonus
  if (state.shellsHit > 0 && state.shellsFired > 0) {
    fitness += (state.shellsHit / state.shellsFired) * 40
  }

  // Spam penalty
  if (state.shellsFired > 6) {
    fitness -= (state.shellsFired - 6) * 8
  }

  // Normalize: 5 × 200 + bonuses ≈ 1300
  return Math.max(0, fitness) / 1300
}
