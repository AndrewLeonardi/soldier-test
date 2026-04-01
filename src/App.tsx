import { useEffect } from 'react'
import './ui/game.css'
import { Game } from './Game'
import { HUD } from './ui/HUD'
import { PlacementBar } from './ui/PlacementBar'
import { PhaseBanner } from './ui/PhaseBanner'
import { useGameStore } from './store'

export function App() {
  // Keyboard shortcut: R to rotate placement
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const state = useGameStore.getState()
        if (state.phase === 'planning' && state.selectedPlacement) {
          state.rotatePlacement()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="game-container">
      <div className="game-canvas">
        <Game />
      </div>
      <HUD />
      <PlacementBar />
      <PhaseBanner />
    </div>
  )
}
