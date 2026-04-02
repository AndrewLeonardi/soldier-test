import { SoldierProfile, WeaponType } from '../types'
import { useRosterStore } from '../rosterStore'
import { SoldierIcon, WEAPON_ICON_COMPONENTS, TrainIcon, CheckIcon } from '../ui/ToyIcons'

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

  const WeaponBadge = WEAPON_ICON_COMPONENTS[soldier.equippedWeapon]

  return (
    <div className={`roster-card ${isInjured ? 'injured' : ''}`}>
      {/* Status badge */}
      <div className={`roster-status ${isInjured ? 'status-injured' : 'status-ready'}`}>
        {isInjured ? 'INJURED' : 'READY'}
      </div>

      {/* Soldier icon / avatar */}
      <div className="roster-avatar">
        <div className="roster-avatar-icon"><SoldierIcon size={40} /></div>
        <span className="roster-weapon-badge"><WeaponBadge size={18} /></span>
      </div>

      {/* Name */}
      <div className="roster-name">{soldier.name}</div>

      {/* Skills */}
      <div className="roster-skills">
        {trainedSkills.map(skill => {
          const isEquipped = soldier.equippedWeapon === skill
          const SkillIcon = WEAPON_ICON_COMPONENTS[skill]
          return (
            <button
              key={skill}
              className={`roster-skill-btn ${isEquipped ? 'equipped' : ''}`}
              onClick={() => equipWeapon(soldier.id, skill)}
              title={`Equip ${WEAPON_LABELS[skill]}`}
            >
              <span className="skill-icon-wrap"><SkillIcon size={14} /></span>
              <span className="skill-label">{WEAPON_LABELS[skill]}</span>
              {isEquipped && <span className="equipped-check"><CheckIcon size={10} /></span>}
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
          <TrainIcon size={14} /> Train Skill
        </button>
      </div>
    </div>
  )
}
