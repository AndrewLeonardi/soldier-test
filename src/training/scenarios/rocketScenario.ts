import { TrainingTarget, TrainingProjectile } from '../../types'

/**
 * Rocket Launcher Training — v4 (NERO-inspired hybrid)
 *
 * KEY INSIGHT (from UT Austin NERO research):
 * Don't make the net learn physics. Script the aiming, let the net learn decisions.
 *
 * SCRIPTED (free):
 *   - Auto-face nearest target
 *   - Compute ideal elevation from ballistics formula
 *   - Fire mechanics
 *
 * NEURAL NET LEARNS:
 *   - Aim offset correction (fine-tune the scripted aim)
 *   - Elevation correction (adjust the computed arc)
 *   - Fire confidence (when to pull the trigger)
 *   - Target selection bias (net can shift aim toward other targets)
 *
 * This means Gen 1 = rockets go roughly toward targets but with random
 * corrections. The net learns to REFINE, not to discover physics.
 */

const ROCKET_SPEED = 8
const ROCKET_GRAVITY = 9 // positive for the formula, negated in physics
const ROCKET_COOLDOWN = 1.5
const BLAST_RADIUS = 1.5
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

/** Ballistics: compute ideal launch elevation for a given distance */
function idealElevation(distance: number): number {
  // θ = 0.5 * arcsin(g * d / v²)
  const ratio = (ROCKET_GRAVITY * distance) / (ROCKET_SPEED * ROCKET_SPEED)
  if (ratio > 1 || ratio < -1) return 0.4 // out of range, use 45-ish degrees
  return 0.5 * Math.asin(Math.min(1, Math.max(-1, ratio)))
}

export function createRocketTargets(): TrainingTarget[] {
  return [
    { id: 't1', position: [3.5, 0, 0.5], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't2', position: [4, 0, -0.8], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't3', position: [5.5, 0, 2], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't4', position: [5, 0, -2.5], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
    { id: 't5', position: [7.5, 0, 0], velocity: [0, 0, 0], alive: true, radius: TARGET_RADIUS },
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

  // Compute the IDEAL elevation from physics
  const ideal = idealElevation(nearestDist)
  const aliveCount = targets.filter(t => t.alive).length

  return [
    nearest.position[0] / 10,                     // target X (normalized)
    nearest.position[2] / 5,                       // target Z (normalized)
    Math.min(1, nearestDist / 10),                 // distance (normalized)
    ideal / 0.8,                                   // ideal elevation (normalized ~0-1)
    Math.min(1, weaponCooldown / ROCKET_COOLDOWN), // cooldown
    aliveCount / 5,                                // targets remaining
  ]
}

export function applyRocketOutputs(
  state: RocketSimState,
  outputs: number[],
  dt: number,
): void {
  const { soldierPos, targets } = state

  // ── SCRIPTED: auto-face nearest alive target ──
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

  // ── SCRIPTED: compute ideal elevation from ballistics ──
  const baseElevation = idealElevation(nearestDist)

  // ── NET OUTPUT[0]: aim offset correction ──
  // Small range: [-0.2, 0.2] radians (~11 degrees)
  const aimCorrection = outputs[0] * 0.2
  const finalAngle = baseAngle + aimCorrection
  state.soldierAngle = finalAngle

  // ── NET OUTPUT[1]: elevation correction ──
  // Small range: [-0.15, 0.15] radians on top of the ideal
  const elevationCorrection = outputs[1] * 0.15
  const finalElevation = Math.max(0.05, Math.min(0.8, baseElevation + elevationCorrection))

  // ── NET OUTPUT[2]: fire trigger ──
  if (outputs[2] > 0 && state.weaponCooldown <= 0) {
    const cosEl = Math.cos(finalElevation)
    const sinEl = Math.sin(finalElevation)
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

    // Gravity (negative Y)
    p.velocity[1] -= ROCKET_GRAVITY * dt
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

  // Hits dominate
  let fitness = destroyed * 200

  // Close approaches for gradient
  for (const t of state.targets) {
    if (!t.alive) continue
    const closest = state.closestApproach[t.id] ?? 999
    if (closest < 4) {
      fitness += (4 - closest) * 8
    }
  }

  // Firing reward
  fitness += Math.min(state.rocketsFireD, 5) * 5

  // Accuracy bonus
  if (state.rocketsHit > 0 && state.rocketsFireD > 0) {
    fitness += (state.rocketsHit / state.rocketsFireD) * 50
  }

  // Spam penalty
  if (state.rocketsFireD > 7) {
    fitness -= (state.rocketsFireD - 7) * 10
  }

  // Normalize: 5 × 200 + bonuses ≈ 1200
  // Threshold 0.6 = 720 → need 3+ targets with some bonus
  return Math.max(0, fitness) / 1200
}
