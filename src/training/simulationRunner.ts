import { NeuralNet } from './neuralNet'
import {
  RocketSimState,
  initRocketSim,
  getRocketInputs,
  applyRocketOutputs,
  tickRocketProjectiles,
  scoreRocketFitness,
} from './scenarios/rocketScenario'

export type SimState = RocketSimState // union with other scenarios later

export interface SimConfig {
  simDuration: number
  weaponType: string
}

export function initSim(config: SimConfig): SimState {
  if (config.weaponType === 'rocketLauncher') {
    return initRocketSim()
  }
  return initRocketSim() // fallback
}

export function getInputs(state: SimState, config: SimConfig): number[] {
  if (config.weaponType === 'rocketLauncher') {
    return getRocketInputs(state)
  }
  return getRocketInputs(state)
}

export function applyOutputs(state: SimState, outputs: number[], dt: number, config: SimConfig): void {
  if (config.weaponType === 'rocketLauncher') {
    applyRocketOutputs(state, outputs, dt)
  }
}

export function tickProjectiles(state: SimState, dt: number, config: SimConfig): void {
  if (config.weaponType === 'rocketLauncher') {
    tickRocketProjectiles(state, dt)
  }
}

export function scoreFitness(state: SimState, config: SimConfig): number {
  if (config.weaponType === 'rocketLauncher') {
    return scoreRocketFitness(state)
  }
  return 0
}

/**
 * Run one full simulation tick.
 * Called from the training store or from the R3F useFrame loop.
 */
export function simTick(
  state: SimState,
  nn: NeuralNet,
  config: SimConfig,
  dt: number,
): void {
  // 1. Get neural net inputs from current state
  const inputs = getInputs(state, config)

  // 2. Forward pass
  const outputs = nn.forward(inputs)

  // 3. Apply outputs (move soldier, fire weapon)
  applyOutputs(state, outputs, dt, config)

  // 4. Update projectiles (gravity, collisions, scoring)
  tickProjectiles(state, dt, config)

  // 5. Advance time
  state.time += dt
}
