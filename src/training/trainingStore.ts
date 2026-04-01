import { create } from 'zustand'
import { WeaponType, TrainedBrain } from '../types'
import { NeuralNet } from './neuralNet'
import { GeneticAlgorithm } from './geneticAlgorithm'
import { SimState, SimConfig, initSim, simTick, scoreFitness } from './simulationRunner'
import { getWeapon } from './weapons'
import { useRosterStore } from '../rosterStore'

const INPUT_SIZE = 6
const HIDDEN_SIZE = 12
const OUTPUT_SIZE = 4
const WEIGHT_COUNT = NeuralNet.weightCount(INPUT_SIZE, HIDDEN_SIZE, OUTPUT_SIZE)
const GA = new GeneticAlgorithm(30, 6, 0.2, 0.6, 0.35)

interface TrainingStore {
  screen: 'loadout' | 'arena'
  selectedWeapon: WeaponType | null
  selectedSoldierId: string | null

  // Evolution
  generation: number
  population: number[][]
  currentIndividual: number
  fitnesses: number[]
  bestFitness: number
  bestWeights: number[] | null
  fitnessHistory: number[]

  // Simulation
  simState: SimState | null
  simConfig: SimConfig | null
  simSpeed: number
  simRunning: boolean
  graduated: boolean

  nn: NeuralNet
  compute: number

  // Actions
  setScreen: (s: 'loadout' | 'arena') => void
  selectWeapon: (w: WeaponType) => void
  selectSoldier: (id: string | null) => void
  startTraining: () => void
  setSimSpeed: (speed: number) => void
  pauseResume: () => void
  tick: (dt: number) => void
  backToLoadout: () => void
  graduate: () => void
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  screen: 'loadout',
  selectedWeapon: null,
  selectedSoldierId: null,
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

  setScreen: (s) => set({ screen: s }),
  selectWeapon: (w) => set({ selectedWeapon: w }),
  selectSoldier: (id) => set({ selectedSoldierId: id }),
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

    // If soldier already has a brain for this weapon, seed population with it
    const soldierId = get().selectedSoldierId
    let population = GA.initPopulation(WEIGHT_COUNT)

    if (soldierId) {
      const roster = useRosterStore.getState()
      const soldier = roster.soldiers.find(s => s.id === soldierId)
      const existingBrain = soldier?.skills[weapon]
      if (existingBrain && existingBrain.weights.length > 0) {
        // Seed first few individuals with existing brain + mutations
        for (let i = 0; i < 5; i++) {
          population[i] = existingBrain.weights.map(w => w + (Math.random() - 0.5) * 0.2)
        }
        population[0] = [...existingBrain.weights] // keep one exact copy
      }
    }

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

    simTick(sim, nn, simConfig, dt)

    if (sim.time >= simConfig.simDuration) {
      const fitness = scoreFitness(sim, simConfig)
      const fitnesses = [...state.fitnesses]
      fitnesses[state.currentIndividual] = fitness

      const newBest = fitness > state.bestFitness ? fitness : state.bestFitness
      const newBestWeights = fitness > state.bestFitness ? nn.getWeights() : state.bestWeights
      const nextIndividual = state.currentIndividual + 1

      if (nextIndividual >= state.population.length) {
        const genBest = Math.max(...fitnesses)
        const history = [...state.fitnessHistory, genBest]
        const nextPop = GA.evolve(state.population, fitnesses, state.generation)
        const nextGen = state.generation + 1
        const weaponDef = getWeapon(state.selectedWeapon!)
        const MIN_GENERATIONS = 5
        const graduated = nextGen >= MIN_GENERATIONS && newBest >= (weaponDef?.fitnessThreshold ?? 1)

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
          compute: state.compute - 1,
        })
      } else {
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

    // Save to soldier's profile in the roster
    if (state.selectedSoldierId) {
      useRosterStore.getState().trainSkill(state.selectedSoldierId, state.selectedWeapon, brain)
    }

    set({ simRunning: false })
  },
}))
