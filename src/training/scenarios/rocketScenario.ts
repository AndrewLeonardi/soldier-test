import { TrainingTarget, TrainingProjectile } from '../../types'

/**
 * Rocket Launcher Training Scenario
 *
 * Soldier stands at origin, giant soda cans at varying distances.
 * Must learn to aim the rocket (arced trajectory) and blow them up.
 *
 * Neural net inputs (6):
 *   [0] distance to nearest alive target (normalized 0-1)
 *   [1] angle to nearest alive target (normalized -1 to 1)
 *   [2] target x position (normalized)
 *   [3] target z position (normalized)
 *   [4] weapon cooldown (0 = ready, 1 = cooling)
 *   [5] alive targets (normalized 0-1)
 *
 * Neural net outputs (4):
 *   [0] turn delta (-1 to 1)
 *   [1] aim elevation (-1 to 1)
 *   [2] fire trigger (> 0 = fire)
 *   [3] move forward/back (-1 to 1)
 */

const ROCKET_SPEED = 9
const ROCKET_GRAVITY = -8
const ROCKET_COOLDOWN = 1.2
const BLAST_RADIUS = 2.5
const TARGET_RADIUS = 0.6

export interface RocketSimState {
  soldierPos: [number, number, number]
  soldierAngle: number
  weaponCooldown: number
  targets: TrainingTarget[]
  projectiles: TrainingProjectile[]
  score: number
  rocketsFireD: number
  time: number
  closestApproach: Record<string, number>
  totalTurnAmount: number // track spinning for penalty
}

export function createRocketTargets(): TrainingTarget[] {
  return [
    {
      id: 't1',
      position: [4 + Math.random(), 0, -1 + Math.random() * 0.5],
      velocity: [0, 0, 0],
      alive: true,
      radius: TARGET_RADIUS,
    },
    {
      id: 't2',
      position: [5.5 + Math.random(), 0, 2 + Math.random() * 0.5],
      velocity: [0, 0, 0],
      alive: true,
      radius: TARGET_RADIUS,
    },
    {
      id: 't3',
      position: [3.5 + Math.random(), 0, -2.5 + Math.random() * 0.5],
      velocity: [0, 0, 0],
      alive: true,
      radius: TARGET_RADIUS,
    },
  ]
}

export function initRocketSim(): RocketSimState {
  return {
    soldierPos: [0, 0, 0],
    soldierAngle: 0, // facing +X toward targets
    weaponCooldown: 0,
    targets: createRocketTargets(),
    projectiles: [],
    score: 0,
    rocketsFireD: 0,
    time: 0,
    closestApproach: { t1: 999, t2: 999, t3: 999 },
    totalTurnAmount: 0,
  }
}

export function getRocketInputs(state: RocketSimState): number[] {
  const { soldierPos, soldierAngle, weaponCooldown, targets } = state

  let nearestDist = 999
  let nearestAngle = 0
  let nearestX = 0
  let nearestZ = 0
  let aliveCount = 0

  for (const t of targets) {
    if (!t.alive) continue
    aliveCount++
    const dx = t.position[0] - soldierPos[0]
    const dz = t.position[2] - soldierPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < nearestDist) {
      nearestDist = dist
      const targetAngle = Math.atan2(dx, dz)
      let relAngle = targetAngle - soldierAngle
      while (relAngle > Math.PI) relAngle -= Math.PI * 2
      while (relAngle < -Math.PI) relAngle += Math.PI * 2
      nearestAngle = relAngle / Math.PI
      nearestX = t.position[0] / 8
      nearestZ = t.position[2] / 8
    }
  }

  return [
    Math.min(1, nearestDist / 10),
    nearestAngle,
    nearestX,
    nearestZ,
    Math.min(1, weaponCooldown / ROCKET_COOLDOWN),
    aliveCount / 3,
  ]
}

export function applyRocketOutputs(
  state: RocketSimState,
  outputs: number[],
  dt: number,
): void {
  // Turn — CLAMPED to prevent wild spinning
  const turnAmount = outputs[0] * 1.0 * dt // max 1 rad/sec
  state.soldierAngle += turnAmount
  state.totalTurnAmount += Math.abs(turnAmount)

  // Move forward/back (slow, just for positioning)
  const moveSpeed = outputs[3] * 0.5 * dt
  state.soldierPos[0] += Math.sin(state.soldierAngle) * moveSpeed
  state.soldierPos[2] += Math.cos(state.soldierAngle) * moveSpeed
  // Clamp to arena
  state.soldierPos[0] = Math.max(-3, Math.min(3, state.soldierPos[0]))
  state.soldierPos[2] = Math.max(-4, Math.min(4, state.soldierPos[2]))

  // Fire
  if (outputs[2] > 0 && state.weaponCooldown <= 0) {
    // Elevation controls arc height: map [-1,1] to [0.15, 0.6]
    const elevation = (outputs[1] + 1) * 0.5 * 0.45 + 0.15

    const cosEl = Math.cos(elevation)
    const sinEl = Math.sin(elevation)
    const dir = [
      Math.sin(state.soldierAngle) * cosEl,
      sinEl,
      Math.cos(state.soldierAngle) * cosEl,
    ]

    state.projectiles.push({
      id: `r${state.rocketsFireD}`,
      position: [
        state.soldierPos[0] + dir[0] * 0.6,
        0.9, // shoulder height
        state.soldierPos[2] + dir[2] * 0.6,
      ],
      velocity: [
        dir[0] * ROCKET_SPEED,
        dir[1] * ROCKET_SPEED,
        dir[2] * ROCKET_SPEED,
      ],
      age: 0,
      alive: true,
    })

    state.weaponCooldown = ROCKET_COOLDOWN
    state.rocketsFireD++
  }

  state.weaponCooldown = Math.max(0, state.weaponCooldown - dt)
}

export function tickRocketProjectiles(state: RocketSimState, dt: number): void {
  for (const p of state.projectiles) {
    if (!p.alive) continue
    p.age += dt

    // Gravity
    p.velocity[1] += ROCKET_GRAVITY * dt

    // Move
    p.position[0] += p.velocity[0] * dt
    p.position[1] += p.velocity[1] * dt
    p.position[2] += p.velocity[2] * dt

    // Track closest approach to all targets (even while in flight)
    for (const t of state.targets) {
      if (!t.alive) continue
      const dx = p.position[0] - t.position[0]
      const dz = p.position[2] - t.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < (state.closestApproach[t.id] ?? 999)) {
        state.closestApproach[t.id] = dist
      }
    }

    // Direct hit on targets (in-air collision)
    for (const t of state.targets) {
      if (!t.alive) continue
      const dx = p.position[0] - t.position[0]
      const dy = p.position[1] - t.position[1]
      const dz = p.position[2] - t.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < t.radius + 0.3) {
        t.alive = false
        p.alive = false
        state.score += 120 // direct hit bonus
        state.score += Math.max(0, 40 * (1 - state.time / 4))
      }
    }

    // Hit ground → splash damage
    if (p.position[1] < 0.05 && p.alive) {
      p.alive = false
      for (const t of state.targets) {
        if (!t.alive) continue
        const dx = p.position[0] - t.position[0]
        const dz = p.position[2] - t.position[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < BLAST_RADIUS) {
          t.alive = false
          const accuracy = 1 - dist / BLAST_RADIUS
          state.score += 100 * accuracy
          state.score += Math.max(0, 30 * (1 - state.time / 4))
        }
      }
    }

    // Kill if too old or out of bounds
    if (p.age > 6 || Math.abs(p.position[0]) > 20 || Math.abs(p.position[2]) > 20 || p.position[1] < -1) {
      p.alive = false
    }
  }

  state.projectiles = state.projectiles.filter(p => p.alive)
}

export function scoreRocketFitness(state: RocketSimState): number {
  let fitness = state.score

  // Penalty for excessive spinning (discourages random rotation)
  if (state.totalTurnAmount > 3) {
    fitness -= (state.totalTurnAmount - 3) * 8
  }

  // Penalty for not firing at all
  if (state.rocketsFireD === 0) {
    fitness -= 20
  }

  // Penalty for excessive rockets (encourages efficiency)
  fitness -= Math.max(0, state.rocketsFireD - 4) * 8

  // Partial credit for EVERY target based on closest approach
  for (const t of state.targets) {
    const closest = state.closestApproach[t.id] ?? 999
    if (t.alive && closest < 8) {
      // Generous partial credit — closer = way more points
      fitness += Math.max(0, (8 - closest) * 8)
    }
  }

  // Bonus for facing targets generally (anti-spin reward)
  for (const t of state.targets) {
    if (!t.alive) continue
    const dx = t.position[0] - state.soldierPos[0]
    const dz = t.position[2] - state.soldierPos[2]
    const angleToTarget = Math.atan2(dx, dz)
    let angleDiff = Math.abs(angleToTarget - state.soldierAngle)
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2)
    // Up to 15 points for facing the right way
    fitness += (Math.PI - angleDiff) / Math.PI * 15
  }

  // Normalize: max ~540 (3 targets × 160 + bonuses), threshold 0.45 = ~243
  return Math.max(0, fitness) / 540
}
