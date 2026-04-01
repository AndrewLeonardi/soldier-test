/**
 * Genetic algorithm for evolving neural net weights.
 * Population of weight vectors → selection → crossover → mutation → next gen.
 */

export class GeneticAlgorithm {
  populationSize: number
  eliteCount: number
  mutationRate: number
  mutationStrength: number
  crossoverRate: number

  constructor(
    populationSize = 20,
    eliteCount = 5,
    mutationRate = 0.15,
    mutationStrength = 0.5,
    crossoverRate = 0.3,
  ) {
    this.populationSize = populationSize
    this.eliteCount = eliteCount
    this.mutationRate = mutationRate
    this.mutationStrength = mutationStrength
    this.crossoverRate = crossoverRate
  }

  /** Create initial random population */
  initPopulation(weightCount: number): number[][] {
    const pop: number[][] = []
    for (let i = 0; i < this.populationSize; i++) {
      const individual: number[] = []
      for (let w = 0; w < weightCount; w++) {
        individual.push(Math.random() * 2 - 1)
      }
      pop.push(individual)
    }
    return pop
  }

  /** Evolve: given fitnesses for current generation, produce next generation */
  evolve(population: number[][], fitnesses: number[], generation: number): number[][] {
    // Sort indices by fitness (descending)
    const indices = Array.from({ length: population.length }, (_, i) => i)
    indices.sort((a, b) => fitnesses[b] - fitnesses[a])

    const sorted = indices.map(i => population[i])
    const newPop: number[][] = []

    // Elites survive unchanged
    for (let i = 0; i < this.eliteCount; i++) {
      newPop.push([...sorted[i]])
    }

    // Adaptive mutation: strength decays over generations
    const adaptiveStrength = Math.max(0.1, this.mutationStrength * Math.pow(0.98, generation))

    // Fill remaining slots
    while (newPop.length < this.populationSize) {
      const parentA = this.tournamentSelect(population, fitnesses, 3)
      const parentB = this.tournamentSelect(population, fitnesses, 3)

      let child: number[]
      if (Math.random() < this.crossoverRate) {
        child = this.crossover(parentA, parentB)
      } else {
        child = [...parentA]
      }

      child = this.mutate(child, this.mutationRate, adaptiveStrength)
      newPop.push(child)
    }

    return newPop
  }

  /** Tournament selection: pick k random individuals, return the fittest */
  private tournamentSelect(population: number[][], fitnesses: number[], k: number): number[] {
    let bestIdx = Math.floor(Math.random() * population.length)
    let bestFit = fitnesses[bestIdx]

    for (let i = 1; i < k; i++) {
      const idx = Math.floor(Math.random() * population.length)
      if (fitnesses[idx] > bestFit) {
        bestIdx = idx
        bestFit = fitnesses[idx]
      }
    }
    return population[bestIdx]
  }

  /** Uniform crossover: for each weight, pick from parent A or B with 50% chance */
  private crossover(a: number[], b: number[]): number[] {
    return a.map((val, i) => Math.random() < 0.5 ? val : b[i])
  }

  /** Gaussian mutation: add N(0, strength) to each weight with probability rate */
  private mutate(weights: number[], rate: number, strength: number): number[] {
    return weights.map(w => {
      if (Math.random() < rate) {
        return w + gaussianRandom() * strength
      }
      return w
    })
  }
}

/** Box-Muller transform for gaussian random numbers */
function gaussianRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
