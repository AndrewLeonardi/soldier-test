import { NeuralNet } from './neuralNet'
import {
  RocketSimState, initRocketSim, getRocketInputs, applyRocketOutputs,
  tickRocketProjectiles, scoreRocketFitness,
} from './scenarios/rocketScenario'
import {
  TankSimState, initTankSim, getTankInputs, applyTankOutputs,
  tickTankProjectiles, scoreTankFitness,
} from './scenarios/tankScenario'

export type SimState = RocketSimState | TankSimState

export interface SimConfig {
  simDuration: number
  weaponType: string
}

export function initSim(config: SimConfig): SimState {
  if (config.weaponType === 'tank') return initTankSim()
  return initRocketSim()
}

export function getInputs(state: SimState, config: SimConfig): number[] {
  if (config.weaponType === 'tank') return getTankInputs(state as TankSimState)
  return getRocketInputs(state as RocketSimState)
}

export function applyOutputs(state: SimState, outputs: number[], dt: number, config: SimConfig): void {
  if (config.weaponType === 'tank') return applyTankOutputs(state as TankSimState, outputs, dt)
  applyRocketOutputs(state as RocketSimState, outputs, dt)
}

export function tickProjectiles(state: SimState, dt: number, config: SimConfig): void {
  if (config.weaponType === 'tank') return tickTankProjectiles(state as TankSimState, dt)
  tickRocketProjectiles(state as RocketSimState, dt)
}

export function scoreFitness(state: SimState, config: SimConfig): number {
  if (config.weaponType === 'tank') return scoreTankFitness(state as TankSimState)
  return scoreRocketFitness(state as RocketSimState)
}

export function simTick(state: SimState, nn: NeuralNet, config: SimConfig, dt: number): void {
  const inputs = getInputs(state, config)
  const outputs = nn.forward(inputs)
  applyOutputs(state, outputs, dt, config)
  tickProjectiles(state, dt, config)
  state.time += dt
}
