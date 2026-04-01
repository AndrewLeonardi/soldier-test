import { SoldierProfile, WeaponType, WEAPON_ICONS } from '../types'
import { useRosterStore } from '../rosterStore'

const WEAPON_LABELS: Record<WeaponType, string> = {
  rifle: 'Rifle',
  rocketLauncher: 'Rocket',
  machineGun: 'Machine Gun',
}

interface SoldierCardProps {
  soldier: SoldierProfile
}

export function SoldierCard({ soldier }: SoldierCardProps) {
  const equipWeapon = useRosterStore(s => s.equipWeapon)
  const isInjured = soldier.status === 'injured'
  const trainedSkills = Object.keys(soldier.skills).filter(
    k => soldier.skills[k as WeaponType]
  ) as WeaponType[]

  return (
    <div className={`roster-card ${isInjured ? 'injured' : ''}`}>
      {/* Status badge */}
      <div className={`roster-status ${isInjured ? 'status-injured' : 'status-ready'}`}>
        {isInjured ? 'INJURED' : 'READY'}
      </div>

      {/* Soldier icon / avatar */}
      <div className="roster-avatar">
        <span className="roster-avatar-icon">{'\u{1F482}'}</span>
        <span className="roster-weapon-badge">{WEAPON_ICONS[soldier.equippedWeapon]}</span>
      </div>

      {/* Name */}
      <div className="roster-name">{soldier.name}</div>

      {/* Skills */}
      <div className="roster-skills">
        {trainedSkills.map(skill => {
          const isEquipped = soldier.equippedWeapon === skill
          return (
            <button
              key={skill}
              className={`roster-skill-btn ${isEquipped ? 'equipped' : ''}`}
              onClick={() => equipWeapon(soldier.id, skill)}
              title={`Equip ${WEAPON_LABELS[skill]}`}
            >
              <span>{WEAPON_ICONS[skill]}</span>
              <span className="skill-label">{WEAPON_LABELS[skill]}</span>
              {isEquipped && <span className="equipped-check">{'\u2713'}</span>}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="roster-stats-row">
        <span>Wins: {soldier.battlesWon}</span>
        <span>Kills: {soldier.kills}</span>
      </div>

      {/* Actions */}
      <div className="roster-actions">
        <button
          className="roster-train-btn"
          onClick={() => {
            window.location.hash = `#/training?soldier=${soldier.id}`
          }}
          disabled={isInjured}
        >
          {'\u{1F9E0}'} Train Skill
        </button>
      </div>
    </div>
  )
}
