import { useGameStore } from '../store'
import { useRosterStore } from '../rosterStore'
import { PLACEMENT_OPTIONS, WEAPON_COSTS, SoldierProfile } from '../types'
import { WEAPON_ICON_COMPONENTS, PlacementIcon, RotateIcon, SquadIcon } from './ToyIcons'

export function PlacementBar() {
  const phase = useGameStore(s => s.phase)
  const gold = useRosterStore(s => s.gold)
  const selectedPlacement = useGameStore(s => s.selectedPlacement)
  const placementRotation = useGameStore(s => s.placementRotation)
  const selectPlacement = useGameStore(s => s.selectPlacement)
  const rotatePlacement = useGameStore(s => s.rotatePlacement)
  const startBattle = useGameStore(s => s.startBattle)
  const placedSoldierIds = useGameStore(s => s.placedSoldierIds)

  const soldiers = useRosterStore(s => s.soldiers)

  if (phase !== 'planning') return null

  // Filter soldiers: ready + not already placed
  const availableSoldiers = soldiers.filter(s =>
    s.status === 'ready' && !placedSoldierIds.includes(s.id)
  )

  // Defense-only options (no generic soldier)
  const defenseOptions = PLACEMENT_OPTIONS.filter(o => o.type !== 'soldier')

  const rotIdx = Math.round(placementRotation / (Math.PI / 2)) % 4
  const WeaponIcon = ({ weapon }: { weapon: string }) => {
    const Comp = WEAPON_ICON_COMPONENTS[weapon as keyof typeof WEAPON_ICON_COMPONENTS]
    return Comp ? <Comp size={28} /> : null
  }

  return (
    <div className="placement-bar">
      {/* Squad soldiers */}
      {availableSoldiers.map(soldier => {
        const cost = WEAPON_COSTS[soldier.equippedWeapon]
        const canAfford = gold >= cost
        const isSelected = selectedPlacement === `soldier:${soldier.id}`
        return (
          <div
            key={soldier.id}
            className={`placement-card soldier-card ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
            onClick={() => {
              if (!canAfford) return
              selectPlacement(isSelected ? null : `soldier:${soldier.id}` as any)
            }}
          >
            <span className="placement-card-icon"><WeaponIcon weapon={soldier.equippedWeapon} /></span>
            <span className="placement-card-name">{soldier.name}</span>
            <span className="placement-card-cost">
              <span className="coin" />
              {cost}
            </span>
          </div>
        )
      })}

      {/* Separator */}
      {availableSoldiers.length > 0 && defenseOptions.length > 0 && (
        <div className="placement-divider" />
      )}

      {/* Defense options */}
      {defenseOptions.map(opt => {
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
            <span className="placement-card-icon"><PlacementIcon type={opt.type} size={28} /></span>
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
            <RotateIcon size={24} />
          </span>
          <span className="placement-card-name">Rotate</span>
          <span className="placement-card-cost" style={{ color: '#8a9a7a', fontSize: '10px' }}>
            [R] key
          </span>
        </div>
      )}

      <button className="roster-link-btn" onClick={() => { window.location.hash = '#/roster' }}>
        <SquadIcon size={16} /> Squad
      </button>

      <button className="battle-btn" onClick={startBattle}>
        Fight!
      </button>
    </div>
  )
}
