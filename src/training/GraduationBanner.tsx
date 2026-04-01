import { useTrainingStore } from './trainingStore'

export function GraduationBanner() {
  const graduated = useTrainingStore(s => s.graduated)
  const bestFitness = useTrainingStore(s => s.bestFitness)
  const generation = useTrainingStore(s => s.generation)
  const selectedWeapon = useTrainingStore(s => s.selectedWeapon)
  const graduate = useTrainingStore(s => s.graduate)
  const backToLoadout = useTrainingStore(s => s.backToLoadout)

  if (!graduated) return null

  const weaponName = selectedWeapon === 'rocketLauncher' ? 'Rocket Launcher'
    : selectedWeapon === 'machineGun' ? 'Machine Gun'
    : selectedWeapon ?? 'Weapon'

  return (
    <div className="graduation-overlay">
      <div className="graduation-content">
        <div className="graduation-stars">
          {'\u2B50'} {'\u2B50'} {'\u2B50'}
        </div>
        <div className="graduation-title">SKILL LEARNED!</div>
        <div className="graduation-weapon">{weaponName}</div>
        <div className="graduation-stats">
          <div>Fitness: {(bestFitness * 100).toFixed(1)}%</div>
          <div>Generations: {generation}</div>
        </div>
        <button className="graduation-btn" onClick={() => {
          graduate()
          backToLoadout()
        }}>
          Save &amp; Return to Loadout
        </button>
      </div>
    </div>
  )
}
