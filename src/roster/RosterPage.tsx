import './roster.css'
import { useRosterStore } from '../rosterStore'
import { SoldierCard } from './SoldierCard'
import { BackArrowIcon, TrainIcon, BattleIcon } from '../ui/ToyIcons'

export function RosterPage() {
  const soldiers = useRosterStore(s => s.soldiers)
  const gold = useRosterStore(s => s.gold)
  const recruitSoldier = useRosterStore(s => s.recruitSoldier)

  const canRecruit = gold >= 200

  return (
    <div className="roster-page">
      {/* Header */}
      <div className="roster-header">
        <button className="roster-nav-btn" onClick={() => { window.location.hash = '#/' }}>
          <BackArrowIcon size={14} /> Battle
        </button>
        <h1 className="roster-title">YOUR SQUAD</h1>
        <div className="roster-gold">
          <span className="gold-icon" />
          <span>{gold}</span>
        </div>
      </div>

      {/* Soldier Grid */}
      <div className="roster-grid">
        {soldiers.map(s => (
          <SoldierCard key={s.id} soldier={s} />
        ))}

        {/* Recruit new */}
        <div
          className={`roster-card roster-recruit ${!canRecruit ? 'disabled' : ''}`}
          onClick={() => canRecruit && recruitSoldier()}
        >
          <div className="recruit-icon">+</div>
          <div className="recruit-label">Recruit New</div>
          <div className="recruit-cost">
            <span className="gold-icon-sm" /> 200
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="roster-footer">
        <button className="roster-footer-btn" onClick={() => { window.location.hash = '#/training' }}>
          <TrainIcon size={14} /> Training Grounds
        </button>
        <button className="roster-footer-btn primary" onClick={() => { window.location.hash = '#/' }}>
          <BattleIcon size={14} /> Go to Battle
        </button>
      </div>
    </div>
  )
}
