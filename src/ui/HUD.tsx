import { useGameStore } from '../store'

export function HUD() {
  const gold = useGameStore(s => s.gold)
  const round = useGameStore(s => s.round)
  const phase = useGameStore(s => s.phase)

  return (
    <div className="hud">
      <div className="hud-gold">
        <div className="hud-gold-icon" />
        <span className="hud-gold-amount">{gold}</span>
      </div>
      <div className="hud-round">Round {round}</div>
      <div className="hud-phase">{phase}</div>
    </div>
  )
}
