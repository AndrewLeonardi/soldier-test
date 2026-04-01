import { useGameStore } from '../store'
import { PLACEMENT_OPTIONS } from '../types'

const ROTATION_LABELS = ['Right', 'Down', 'Left', 'Up']

export function PlacementBar() {
  const phase = useGameStore(s => s.phase)
  const gold = useGameStore(s => s.gold)
  const selectedPlacement = useGameStore(s => s.selectedPlacement)
  const placementRotation = useGameStore(s => s.placementRotation)
  const selectPlacement = useGameStore(s => s.selectPlacement)
  const rotatePlacement = useGameStore(s => s.rotatePlacement)
  const startBattle = useGameStore(s => s.startBattle)

  if (phase !== 'planning') return null

  const rotIdx = Math.round(placementRotation / (Math.PI / 2)) % 4

  return (
    <div className="placement-bar">
      {PLACEMENT_OPTIONS.map(opt => {
        const canAfford = gold >= opt.cost
        const isSelected = selectedPlacement === opt.type
        return (
          <div
            key={opt.type}
            className={`placement-card ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
            onClick={() => {
              if (!canAfford) return
              selectPlacement(isSelected ? null : opt.type)
            }}
          >
            <span className="placement-card-icon">{opt.icon}</span>
            <span className="placement-card-name">{opt.label}</span>
            <span className="placement-card-cost">
              <span className="coin" />
              {opt.cost}
            </span>
          </div>
        )
      })}

      {/* Rotate button */}
      {selectedPlacement && (
        <div className="placement-card rotate-card" onClick={rotatePlacement}>
          <span className="placement-card-icon" style={{ transform: `rotate(${rotIdx * 90}deg)` }}>
            {'\u27A1'}
          </span>
          <span className="placement-card-name">Rotate</span>
          <span className="placement-card-cost" style={{ color: '#666', fontSize: '10px' }}>
            [R] key
          </span>
        </div>
      )}

      <button className="training-nav-btn" onClick={() => { window.location.hash = '#/training' }}>
        {'\u{1F9E0}'} Train
      </button>

      <button className="battle-btn" onClick={startBattle}>
        Fight!
      </button>
    </div>
  )
}
