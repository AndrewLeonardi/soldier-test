import { useTrainingStore } from './trainingStore'

const ROCKET_INPUT_LABELS = ['Tgt X', 'Tgt Z', 'Dist', 'Ideal El', 'Cooldown', 'Alive']
const ROCKET_OUTPUT_LABELS = ['Aim', 'Elevate', 'FIRE', '—']
const TANK_INPUT_LABELS = ['Angle', 'Dist', 'Speed', 'Cooldown', 'Alive', 'Time']
const TANK_OUTPUT_LABELS = ['Steer', 'Throttle', 'FIRE', '—']

export function NeuralNetViz() {
  const nn = useTrainingStore(s => s.nn)
  const simRunning = useTrainingStore(s => s.simRunning)
  const simState = useTrainingStore(s => s.simState)
  const selectedWeapon = useTrainingStore(s => s.selectedWeapon)

  if (!simRunning || !simState) return null

  const isTank = selectedWeapon === 'tank'
  const inputLabels = isTank ? TANK_INPUT_LABELS : ROCKET_INPUT_LABELS
  const outputLabels = isTank ? TANK_OUTPUT_LABELS : ROCKET_OUTPUT_LABELS
  const inputSize = nn.inputSize
  const hiddenSize = nn.hiddenSize
  const outputSize = nn.outputSize

  let weights: number[]
  let outputs: number[]
  try {
    weights = nn.getWeights()
    outputs = nn.forward(new Array(inputSize).fill(0))
  } catch {
    return null
  }

  // Layout
  const W = 280
  const H = 240
  const layerX = [40, 140, 240]
  const inputY = (i: number) => 15 + i * (H - 30) / Math.max(1, inputSize - 1)
  const hiddenY = (i: number) => 12 + i * (H - 24) / Math.max(1, hiddenSize - 1)
  const outputY = (i: number) => 35 + i * (H - 70) / Math.max(1, outputSize - 1)

  // Parse input→hidden weights for connection coloring (sample subset to avoid clutter)
  let wIdx = 0
  const connections: { x1: number; y1: number; x2: number; y2: number; w: number }[] = []
  for (let h = 0; h < hiddenSize; h++) {
    for (let i = 0; i < inputSize; i++) {
      if (wIdx < weights.length) {
        const w = weights[wIdx]
        // Only draw strong connections to reduce clutter
        if (Math.abs(w) > 0.3) {
          connections.push({ x1: layerX[0], y1: inputY(i), x2: layerX[1], y2: hiddenY(h), w })
        }
      }
      wIdx++
    }
    wIdx++ // bias
  }
  for (let o = 0; o < outputSize; o++) {
    for (let h = 0; h < hiddenSize; h++) {
      if (wIdx < weights.length) {
        const w = weights[wIdx]
        if (Math.abs(w) > 0.3) {
          connections.push({ x1: layerX[1], y1: hiddenY(h), x2: layerX[2], y2: outputY(o), w })
        }
      }
      wIdx++
    }
    wIdx++ // bias
  }

  return (
    <div className="nn-viz">
      <div className="nn-title">NEURAL NETWORK</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Connections */}
        {connections.map((c, i) => {
          const absW = Math.min(Math.abs(c.w), 2)
          return (
            <line key={`c-${i}`}
              x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={c.w > 0 ? '#4CAF50' : '#FF5252'}
              strokeWidth={0.5 + absW * 0.7}
              opacity={0.2 + absW * 0.3}
            />
          )
        })}

        {/* Input nodes */}
        {Array.from({ length: inputSize }, (_, i) => (
          <g key={`in-${i}`}>
            <circle cx={layerX[0]} cy={inputY(i)} r={5}
              fill="rgba(100,180,255,0.6)" stroke="#4488cc" strokeWidth={1}
            />
            <text x={layerX[0] - 10} y={inputY(i) + 3}
              textAnchor="end" fontSize="7" fill="#8899aa" fontFamily="monospace"
            >{inputLabels[i] ?? `I${i}`}</text>
          </g>
        ))}

        {/* Hidden nodes */}
        {Array.from({ length: hiddenSize }, (_, i) => (
          <circle key={`h-${i}`} cx={layerX[1]} cy={hiddenY(i)} r={4}
            fill="rgba(180,130,255,0.5)" stroke="#8866cc" strokeWidth={1}
          />
        ))}

        {/* Output nodes */}
        {Array.from({ length: outputSize }, (_, i) => {
          const val = outputs[i] ?? 0
          const isFire = i === 2 && val > 0
          return (
            <g key={`out-${i}`}>
              <circle cx={layerX[2]} cy={outputY(i)} r={6}
                fill={isFire ? '#FF6600' : `rgba(100,255,130,${0.3 + Math.abs(val) * 0.5})`}
                stroke={isFire ? '#FF8800' : '#44cc66'} strokeWidth={isFire ? 2 : 1}
              />
              <text x={layerX[2] + 10} y={outputY(i) + 3}
                fontSize="7" fill={isFire ? '#FF8800' : '#88aa88'} fontFamily="monospace"
              >{outputLabels[i] ?? `O${i}`}</text>
              <text x={layerX[2] + 10} y={outputY(i) + 12}
                fontSize="6" fill="#666" fontFamily="monospace"
              >{val.toFixed(2)}</text>
            </g>
          )
        })}

        <text x={layerX[0]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">INPUT</text>
        <text x={layerX[1]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">HIDDEN</text>
        <text x={layerX[2]} y={H - 2} textAnchor="middle" fontSize="7" fill="#556" fontFamily="monospace">OUTPUT</text>
      </svg>
    </div>
  )
}
