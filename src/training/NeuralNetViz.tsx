import { useTrainingStore } from './trainingStore'
import { NeuralNet } from './neuralNet'

const INPUT_LABELS = ['Dist', 'Angle', 'Tgt X', 'Tgt Z', 'Cooldown', 'Alive']
const OUTPUT_LABELS = ['Turn', 'Elevate', 'FIRE', 'Move']
const INPUT_SIZE = 6
const HIDDEN_SIZE = 12
const OUTPUT_SIZE = 4

/**
 * Live neural network visualization.
 * Shows nodes + weighted connections, updates each frame.
 */
export function NeuralNetViz() {
  const nn = useTrainingStore(s => s.nn)
  const simState = useTrainingStore(s => s.simState)
  const simRunning = useTrainingStore(s => s.simRunning)

  if (!simRunning || !simState) return null

  // Get current weights
  const weights = nn.getWeights()

  // Run a forward pass to get node activations
  // Compute inputs from current state (simplified — just read what we can)
  const activations = computeActivations(nn, weights)

  // Layout
  const W = 280
  const H = 220
  const layerX = [40, 140, 240]
  const inputY = (i: number) => 15 + i * (H - 30) / (INPUT_SIZE - 1)
  const hiddenY = (i: number) => 20 + i * (H - 40) / (HIDDEN_SIZE - 1)
  const outputY = (i: number) => 35 + i * (H - 70) / (OUTPUT_SIZE - 1)

  // Parse weight values for connection coloring
  let wIdx = 0
  const inputToHidden: { from: number; to: number; w: number }[] = []
  for (let h = 0; h < HIDDEN_SIZE; h++) {
    for (let i = 0; i < INPUT_SIZE; i++) {
      inputToHidden.push({ from: i, to: h, w: weights[wIdx++] })
    }
    wIdx++ // bias
  }
  const hiddenToOutput: { from: number; to: number; w: number }[] = []
  for (let o = 0; o < OUTPUT_SIZE; o++) {
    for (let h = 0; h < HIDDEN_SIZE; h++) {
      hiddenToOutput.push({ from: h, to: o, w: weights[wIdx++] })
    }
    wIdx++ // bias
  }

  return (
    <div className="nn-viz">
      <div className="nn-title">NEURAL NETWORK</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Input → Hidden connections */}
        {inputToHidden.map((c, i) => {
          const absW = Math.min(Math.abs(c.w), 2)
          const opacity = 0.15 + absW * 0.3
          const color = c.w > 0 ? '#4CAF50' : '#FF5252'
          return (
            <line key={`ih-${i}`}
              x1={layerX[0]} y1={inputY(c.from)}
              x2={layerX[1]} y2={hiddenY(c.to)}
              stroke={color} strokeWidth={0.5 + absW * 0.8} opacity={opacity}
            />
          )
        })}
        {/* Hidden → Output connections */}
        {hiddenToOutput.map((c, i) => {
          const absW = Math.min(Math.abs(c.w), 2)
          const opacity = 0.15 + absW * 0.3
          const color = c.w > 0 ? '#4CAF50' : '#FF5252'
          return (
            <line key={`ho-${i}`}
              x1={layerX[1]} y1={hiddenY(c.from)}
              x2={layerX[2]} y2={outputY(c.to)}
              stroke={color} strokeWidth={0.5 + absW * 0.8} opacity={opacity}
            />
          )
        })}

        {/* Input nodes */}
        {Array.from({ length: INPUT_SIZE }, (_, i) => {
          const val = activations.inputs[i] ?? 0
          const brightness = Math.abs(val)
          return (
            <g key={`in-${i}`}>
              <circle cx={layerX[0]} cy={inputY(i)} r={6}
                fill={`rgba(100, 180, 255, ${0.3 + brightness * 0.7})`}
                stroke="#4488cc" strokeWidth={1}
              />
              <text x={layerX[0] - 12} y={inputY(i) + 3}
                textAnchor="end" fontSize="7" fill="#8899aa" fontFamily="monospace"
              >{INPUT_LABELS[i]}</text>
            </g>
          )
        })}

        {/* Hidden nodes */}
        {Array.from({ length: HIDDEN_SIZE }, (_, i) => {
          const val = activations.hidden[i] ?? 0
          const brightness = Math.abs(val)
          return (
            <circle key={`hid-${i}`} cx={layerX[1]} cy={hiddenY(i)} r={5}
              fill={`rgba(180, 130, 255, ${0.3 + brightness * 0.7})`}
              stroke="#8866cc" strokeWidth={1}
            />
          )
        })}

        {/* Output nodes */}
        {Array.from({ length: OUTPUT_SIZE }, (_, i) => {
          const val = activations.outputs[i] ?? 0
          const isActive = Math.abs(val) > 0.3
          const isFire = i === 2 && val > 0
          return (
            <g key={`out-${i}`}>
              <circle cx={layerX[2]} cy={outputY(i)} r={7}
                fill={isFire ? '#FF6600' : isActive ? `rgba(100, 255, 130, 0.8)` : 'rgba(100, 255, 130, 0.3)'}
                stroke={isFire ? '#FF8800' : '#44cc66'} strokeWidth={isFire ? 2 : 1}
              />
              <text x={layerX[2] + 12} y={outputY(i) + 3}
                fontSize="7" fill={isFire ? '#FF8800' : '#88aa88'} fontFamily="monospace"
              >{OUTPUT_LABELS[i]}</text>
              <text x={layerX[2] + 12} y={outputY(i) + 12}
                fontSize="6" fill="#666" fontFamily="monospace"
              >{val.toFixed(2)}</text>
            </g>
          )
        })}

        {/* Layer labels */}
        <text x={layerX[0]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">INPUT</text>
        <text x={layerX[1]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">HIDDEN</text>
        <text x={layerX[2]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">OUTPUT</text>
      </svg>
    </div>
  )
}

function computeActivations(nn: NeuralNet, weights: number[]) {
  // Simple: just run forward with dummy inputs based on last state
  // In practice, we read the last inputs from the store
  const state = useTrainingStore.getState()
  const sim = state.simState
  let inputs = [0, 0, 0, 0, 0, 0]
  if (sim) {
    // Approximate inputs
    const targets = sim.targets.filter((t: any) => t.alive)
    if (targets.length > 0) {
      const t = targets[0]
      const dx = t.position[0] - sim.soldierPos[0]
      const dz = t.position[2] - sim.soldierPos[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      const angle = Math.atan2(dx, dz)
      let relAngle = angle - sim.soldierAngle
      while (relAngle > Math.PI) relAngle -= Math.PI * 2
      while (relAngle < -Math.PI) relAngle += Math.PI * 2
      inputs = [
        Math.min(1, dist / 10),
        relAngle / Math.PI,
        t.position[0] / 8,
        t.position[2] / 8,
        Math.min(1, sim.weaponCooldown / 1.2),
        targets.length / 3,
      ]
    }
  }
  const outputs = nn.forward(inputs)

  // Compute hidden layer activations manually
  const hidden: number[] = []
  let offset = 0
  for (let h = 0; h < HIDDEN_SIZE; h++) {
    let sum = 0
    for (let i = 0; i < INPUT_SIZE; i++) {
      sum += inputs[i] * weights[offset++]
    }
    sum += weights[offset++]
    hidden.push(Math.tanh(sum))
  }

  return { inputs, hidden, outputs }
}
