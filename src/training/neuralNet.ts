/**
 * Hand-rolled feedforward neural network.
 * No dependencies — just math.
 *
 * Architecture: inputs → hidden (tanh) → outputs (tanh)
 * For 6→8→4: (6*8+8) + (8*4+4) = 92 weights total
 */

export class NeuralNet {
  inputSize: number
  hiddenSize: number
  outputSize: number
  weights: Float64Array

  constructor(inputSize: number, hiddenSize: number, outputSize: number) {
    this.inputSize = inputSize
    this.hiddenSize = hiddenSize
    this.outputSize = outputSize
    const total = NeuralNet.weightCount(inputSize, hiddenSize, outputSize)
    this.weights = new Float64Array(total)
  }

  static weightCount(input: number, hidden: number, output: number): number {
    // input→hidden weights + hidden biases + hidden→output weights + output biases
    return (input * hidden + hidden) + (hidden * output + output)
  }

  randomize(): void {
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = (Math.random() * 2 - 1) // [-1, 1]
    }
  }

  setWeights(w: number[]): void {
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = w[i] ?? 0
    }
  }

  getWeights(): number[] {
    return Array.from(this.weights)
  }

  forward(inputs: number[]): number[] {
    const { inputSize, hiddenSize, outputSize, weights } = this

    // ── Layer 1: input → hidden ──
    let offset = 0
    const hidden = new Array(hiddenSize)
    for (let h = 0; h < hiddenSize; h++) {
      let sum = 0
      for (let i = 0; i < inputSize; i++) {
        sum += inputs[i] * weights[offset++]
      }
      sum += weights[offset++] // bias
      hidden[h] = Math.tanh(sum)
    }

    // ── Layer 2: hidden → output ──
    const output = new Array(outputSize)
    for (let o = 0; o < outputSize; o++) {
      let sum = 0
      for (let h = 0; h < hiddenSize; h++) {
        sum += hidden[h] * weights[offset++]
      }
      sum += weights[offset++] // bias
      output[o] = Math.tanh(sum)
    }

    return output
  }
}
