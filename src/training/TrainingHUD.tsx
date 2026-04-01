import { useTrainingStore } from './trainingStore'
import { getWeapon } from './weapons'

export function TrainingHUD() {
  const generation = useTrainingStore(s => s.generation)
  const currentIndividual = useTrainingStore(s => s.currentIndividual)
  const populationSize = useTrainingStore(s => s.population.length)
  const bestFitness = useTrainingStore(s => s.bestFitness)
  const fitnessHistory = useTrainingStore(s => s.fitnessHistory)
  const simSpeed = useTrainingStore(s => s.simSpeed)
  const simRunning = useTrainingStore(s => s.simRunning)
  const selectedWeapon = useTrainingStore(s => s.selectedWeapon)
  const graduated = useTrainingStore(s => s.graduated)
  const compute = useTrainingStore(s => s.compute)
  const setSimSpeed = useTrainingStore(s => s.setSimSpeed)
  const pauseResume = useTrainingStore(s => s.pauseResume)
  const backToLoadout = useTrainingStore(s => s.backToLoadout)

  const weaponDef = selectedWeapon ? getWeapon(selectedWeapon) : null
  const threshold = weaponDef?.fitnessThreshold ?? 1
  const progressPct = Math.min(100, (bestFitness / threshold) * 100)

  // Last few fitness values for mini sparkline
  const lastFew = fitnessHistory.slice(-20)

  return (
    <div className="training-hud">
      {/* Top left: Generation info */}
      <div className="thud-top-left">
        <div className="thud-gen">GEN {generation}</div>
        <div className="thud-individual">
          Attempt {currentIndividual + 1} / {populationSize || 20}
        </div>
      </div>

      {/* Top center: Fitness */}
      <div className="thud-top-center">
        <div className="thud-fitness-label">Best Fitness</div>
        <div className="thud-fitness-value">{(bestFitness * 100).toFixed(1)}%</div>
        {/* Mini sparkline */}
        {lastFew.length > 1 && (
          <div className="thud-sparkline">
            {lastFew.map((f, i) => (
              <div
                key={i}
                className="thud-spark-bar"
                style={{ height: `${Math.max(2, f * 40)}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top right: Speed + compute */}
      <div className="thud-top-right">
        <div className="thud-compute">
          <span className="thud-compute-icon" />
          {compute}
        </div>
        <div className="thud-speed-controls">
          {[1, 2, 5, 10, 50].map(s => (
            <button
              key={s}
              className={`thud-speed-btn ${simSpeed === s ? 'active' : ''}`}
              onClick={() => setSimSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: Progress bar + controls */}
      <div className="thud-bottom">
        <div className="thud-progress-bar">
          <div className="thud-progress-fill" style={{ width: `${progressPct}%` }} />
          <div className="thud-progress-label">
            {progressPct < 100 ? `${progressPct.toFixed(0)}% to graduation` : 'Ready to graduate!'}
          </div>
        </div>
        <div className="thud-controls">
          <button className="thud-btn pause" onClick={pauseResume}>
            {simRunning ? 'Pause' : 'Resume'}
          </button>
          <button className="thud-btn back" onClick={backToLoadout}>
            Stop Training
          </button>
        </div>
      </div>
    </div>
  )
}
