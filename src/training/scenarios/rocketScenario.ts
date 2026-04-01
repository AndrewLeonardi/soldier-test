import { TrainingTarget, TrainingProjectile } from '../../types'

/**
 * Rocket Launcher Training — Hybrid approach
 *
 * BASE BEHAVIOR (free):
 *   - Soldier auto-faces the nearest alive target
 *   - Fires when the net says to
 *
 * NEURAL NET LEARNS:
 *   - Aim offset (fine-tune left/right from auto-aim)
 *   - Elevation angle (must learn the arc for different distances)
 *   - When to fire (timing/confidence)
 *
 * This means Gen 1 = soldier faces targets but rockets go wild
 * because elevation is random. Over training, it learns the arc.
 */

const ROCKET_SPEED = 8
const ROCKET_GRAVITY = -9
const ROCKET_COOLDOWN = 1.8
const BLAST_RADIUS = 1.3
const TARGET_RADIUS = 0.45

export interface RocketSimState {
  soldierPos: [number, number, number]
  soldierAngle: number
  weaponCooldown: number
  targets: TrainingTarget[]
  projectiles: TrainingProjectile[]
  score: number
  rocketsFireD: number
  rocketsHit: number
  time: number
  closestApproach: Record<string, number>
}

export function createRocketTargets(): TrainingTarget[] {
  return [
    { id: 't1', position: [4, 0, 0], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't2', position: [6, 0, 2.5], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't3', position: [5, 0, -2.5], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't4', position: [8, 0, 1], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't5', position: [7, 0, -1.5], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
  ]
}

export function initRocketSim(): RocketSimState {
  return {
    soldierPos: [0, 0, 0],
    soldierAngle: 0,
    weaponCooldown: 0,
    targets: createRocketTargets(),
    projectiles: [],
    score: 0,
    rocketsFireD: 0,
    rocketsHit: 0,
    time: 0,
    closestApproach: { t1: 999, t2: 999, t3: 999, t4: 999, t5: 999 },
  }
}

export function getRocketInputs(state: RocketSimState): number[] {
  const { soldierPos, targets, weaponCooldown, time } = state

  // Find nearest alive target
  let nearest = targets[0]
  let nearestDist = 999
  for (const t of targets) {
    if (!t.alive) continue
    const dx = t.position[0] - soldierPos[0]
    const dz = t.position[2] - soldierPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < nearestDist) { nearestDist = dist; nearest = t }
  }

  const aliveCount = targets.filter(t => t.alive).length

  return [
    nearest.position[0] / 10,                     // target X
    nearest.position[2] / 5,                       // target Z
    Math.min(1, nearestDist / 10),                 // distance
    Math.min(1, weaponCooldown / ROCKET_COOLDOWN), // cooldown
    aliveCount / 5,                                // targets left
    Math.min(1, time / 6),                         // time elapsed
  ]
}

export function applyRocketOutputs(
  state: RocketSimState,
  outputs: number[],
  dt: number,
): void {
  const { soldierPos, targets } = state

  // ── AUTO-AIM: face the nearest alive target (FREE) ──
  let nearest = targets[0]
  let nearestDist = 999
  for (const t of targets) {
    if (!t.alive) continue
    const dx = t.position[0] - soldierPos[0]
    const dz = t.position[2] - soldierPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < nearestDist) { nearestDist = dist; nearest = t }
  }

  const dx = nearest.position[0] - soldierPos[0]
  const dz = nearest.position[2] - soldierPos[2]
  const baseAngle = Math.atan2(dx, dz)

  // ── NEURAL NET OUTPUT[0]: aim offset (fine-tune angle) ──
  // Maps [-1, 1] → [-0.3, 0.3] radians (~17 degrees each way)
  const aimOffset = outputs[0] * 0.3
  const finalAngle = baseAngle + aimOffset
  state.soldierAngle = finalAngle

  // ── NEURAL NET OUTPUT[1]: elevation (MUST LEARN THIS) ──
  // Maps [-1, 1] → [0.1, 0.7] radians
  // Low elevation = flat shot (close targets)
  // High elevation = arced shot (far targets)
  const elevation = (outputs[1] + 1) * 0.5 * 0.6 + 0.1

  // ── NEURAL NET OUTPUT[2]: fire trigger ──
  if (outputs[2] > 0 && state.weaponCooldown <= 0) {
    const cosEl = Math.cos(elevation)
    const sinEl = Math.sin(elevation)
    const dir = [
      Math.sin(finalAngle) * cosEl,
      sinEl,
      Math.cos(finalAngle) * cosEl,
    ]

    state.projectiles.push({
      id: `r${state.rocketsFireD}`,
      position: [
        soldierPos[0] + dir[0] * 0.6,
        0.9,
        soldierPos[2] + dir[2] * 0.6,
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

    p.velocity[1] += ROCKET_GRAVITY * dt
    p.position[0] += p.velocity[0] * dt
    p.position[1] += p.velocity[1] * dt
    p.position[2] += p.velocity[2] * dt

    // Track closest approach
    for (const t of state.targets) {
      if (!t.alive) continue
      const tdx = p.position[0] - t.position[0]
      const tdz = p.position[2] - t.position[2]
      const dist = Math.sqrt(tdx * tdx + tdz * tdz)
      if (dist < (state.closestApproach[t.id] ?? 999)) {
        state.closestApproach[t.id] = dist
      }
    }

    // Direct hit
    for (const t of state.targets) {
      if (!t.alive) continue
      const tdx = p.position[0] - t.position[0]
      const tdy = p.position[1] - t.position[1]
      const tdz = p.position[2] - t.position[2]
      const dist = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz)
      if (dist < t.radius + 0.3) {
        t.alive = false
        p.alive = false
        state.rocketsHit++
        state.score += 100
      }
    }

    // Ground impact → splash
    if (p.position[1] < 0.05 && p.alive) {
      p.alive = false
      for (const t of state.targets) {
        if (!t.alive) continue
        const tdx = p.position[0] - t.position[0]
        const tdz = p.position[2] - t.position[2]
        const dist = Math.sqrt(tdx * tdx + tdz * tdz)
        if (dist < BLAST_RADIUS) {
          t.alive = false
          state.rocketsHit++
          state.score += 80 * (1 - dist / BLAST_RADIUS)
        }
      }
    }

    if (p.age > 6 || Math.abs(p.position[0]) > 25 || Math.abs(p.position[2]) > 25 || p.position[1] < -1) {
      p.alive = false
    }
  }

  state.projectiles = state.projectiles.filter(p => p.alive)
}

export function scoreRocketFitness(state: RocketSimState): number {
  const destroyed = state.targets.filter(t => !t.alive).length

  // ── HITS: the main event ──
  let fitness = destroyed * 200

  // ── CLOSE APPROACHES: smooth gradient for learning ──
  for (const t of state.targets) {
    if (!t.alive) continue
    const closest = state.closestApproach[t.id] ?? 999
    if (closest < 4) {
      fitness += (4 - closest) * 8 // max 32 per target
    }
  }

  // ── FIRING REWARD: must fire to score ──
  fitness += Math.min(state.rocketsFireD, 5) * 5

  // ── ACCURACY BONUS ──
  if (state.rocketsHit > 0 && state.rocketsFireD > 0) {
    fitness += (state.rocketsHit / state.rocketsFireD) * 40
  }

  // ── SPAM PENALTY: only for excessive fire ──
  if (state.rocketsFireD > 7) {
    fitness -= (state.rocketsFireD - 7) * 10
  }

  // Normalize: 5 × 200 hits + bonuses ≈ 1200 max
  // Threshold 0.7 = 840 → need 3-4 target kills with decent accuracy
  return Math.max(0, fitness) / 1200
}
