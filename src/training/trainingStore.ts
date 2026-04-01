import { create } from 'zustand'
import { WeaponType, TrainedBrain } from '../types'
import { NeuralNet } from './neuralNet'
import { GeneticAlgorithm } from './geneticAlgorithm'
import { SimState, SimConfig, initSim, simTick, scoreFitness } from './simulationRunner'
import { getWeapon } from './weapons'

const INPUT_SIZE = 6
const HIDDEN_SIZE = 8
const OUTPUT_SIZE = 4
const WEIGHT_COUNT = NeuralNet.weightCount(INPUT_SIZE, HIDDEN_SIZE, OUTPUT_SIZE)
const GA = new GeneticAlgorithm(20, 5, 0.15, 0.5, 0.3)

interface TrainingStore {
  // Navigation
  screen: 'loadout' | 'arena'
  selectedWeapon: WeaponType | null

  // Evolution
  generation: number
  population: number[][]
  currentIndividual: number
  fitnesses: number[]
  bestFitness: number
  bestWeights: number[] | null
  fitnessHistory: number[] // best fitness per generation for graph

  // Simulation
  simState: SimState | null
  simConfig: SimConfig | null
  simSpeed: number
  simRunning: boolean
  graduated: boolean

  // Neural net instance (reused, weights swapped)
  nn: NeuralNet

  // Compute tokens
  compute: number

  // Trained brains (persisted)
  trainedBrains: Partial<Record<WeaponType, TrainedBrain>>

  // Actions
  setScreen: (s: 'loadout' | 'arena') => void
  selectWeapon: (w: WeaponType) => void
  startTraining: () => void
  setSimSpeed: (speed: number) => void
  pauseResume: () => void
  tick: (dt: number) => void
  backToLoadout: () => void
  graduate: () => void
}

// Load saved brains from localStorage
function loadBrains(): Partial<Record<WeaponType, TrainedBrain>> {
  try {
    const saved = localStorage.getItem('trainedBrains')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return {}
}

function saveBrains(brains: Partial<Record<WeaponType, TrainedBrain>>) {
  try {
    localStorage.setItem('trainedBrains', JSON.stringify(brains))
  } catch { /* ignore */ }
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  screen: 'loadout',
  selectedWeapon: null,
  generation: 0,
  population: [],
  currentIndividual: 0,
  fitnesses: [],
  bestFitness: 0,
  bestWeights: null,
  fitnessHistory: [],
  simState: null,
  simConfig: null,
  simSpeed: 1,
  simRunning: false,
  graduated: false,
  nn: new NeuralNet(INPUT_SIZE, HIDDEN_SIZE, OUTPUT_SIZE),
  compute: 500,
  trainedBrains: loadBrains(),

  setScreen: (s) => set({ screen: s }),
  selectWeapon: (w) => set({ selectedWeapon: w }),
  setSimSpeed: (speed) => set({ simSpeed: speed }),

  pauseResume: () => set(s => ({ simRunning: !s.simRunning })),

  backToLoadout: () => set({
    screen: 'loadout',
    simRunning: false,
    simState: null,
    generation: 0,
    population: [],
    fitnesses: [],
    bestFitness: 0,
    bestWeights: null,
    fitnessHistory: [],
    graduated: false,
  }),

  startTraining: () => {
    const weapon = get().selectedWeapon
    if (!weapon) return
    const def = getWeapon(weapon)
    if (!def) return

    const population = GA.initPopulation(WEIGHT_COUNT)
    const config: SimConfig = { simDuration: def.simDuration, weaponType: weapon }
    const nn = get().nn
    nn.setWeights(population[0])
    const sim = initSim(config)

    set({
      screen: 'arena',
      generation: 1,
      population,
      currentIndividual: 0,
      fitnesses: new Array(population.length).fill(0),
      bestFitness: 0,
      bestWeights: null,
      fitnessHistory: [],
      simState: sim,
      simConfig: config,
      simRunning: true,
      graduated: false,
    })
  },

  tick: (dt: number) => {
    const state = get()
    if (!state.simRunning || !state.simState || !state.simConfig) return
    if (state.graduated) return

    const { nn, simConfig } = state
    const sim = state.simState

    // Run simulation tick
    simTick(sim, nn, simConfig, dt)

    // Check if attempt is over (time exceeded)
    if (sim.time >= simConfig.simDuration) {
      // Score this individual
      const fitness = scoreFitness(sim, simConfig)
      const fitnesses = [...state.fitnesses]
      fitnesses[state.currentIndividual] = fitness

      const newBest = fitness > state.bestFitness ? fitness : state.bestFitness
      const newBestWeights = fitness > state.bestFitness
        ? nn.getWeights()
        : state.bestWeights

      const nextIndividual = state.currentIndividual + 1

      if (nextIndividual >= state.population.length) {
        // All individuals tested → evolve to next generation
        const genBest = Math.max(...fitnesses)
        const history = [...state.fitnessHistory, genBest]
        const nextPop = GA.evolve(state.population, fitnesses, state.generation)
        const nextGen = state.generation + 1

        // Check graduation
        const weaponDef = getWeapon(state.selectedWeapon!)
        const graduated = newBest >= (weaponDef?.fitnessThreshold ?? 1)

        // Start first individual of next gen
        nn.setWeights(nextPop[0])
        const newSim = initSim(simConfig)

        set({
          generation: nextGen,
          population: nextPop,
          currentIndividual: 0,
          fitnesses: new Array(nextPop.length).fill(0),
          bestFitness: newBest,
          bestWeights: newBestWeights,
          fitnessHistory: history,
          simState: newSim,
          graduated,
          compute: state.compute - 1, // 1 compute per generation
        })
      } else {
        // Next individual in current generation
        nn.setWeights(state.population[nextIndividual])
        const newSim = initSim(simConfig)

        set({
          currentIndividual: nextIndividual,
          fitnesses,
          bestFitness: newBest,
          bestWeights: newBestWeights,
          simState: newSim,
        })
      }
    } else {
      // Still running — just update the sim state reference for rendering
      set({ simState: { ...sim } })
    }
  },

  graduate: () => {
    const state = get()
    if (!state.bestWeights || !state.selectedWeapon) return

    const brain: TrainedBrain = {
      weaponType: state.selectedWeapon,
      weights: state.bestWeights,
      fitness: state.bestFitness,
      generation: state.generation,
    }

    const brains = { ...state.trainedBrains, [state.selectedWeapon]: brain }
    saveBrains(brains)

    set({
      trainedBrains: brains,
      simRunning: false,
    })
  },
}))
