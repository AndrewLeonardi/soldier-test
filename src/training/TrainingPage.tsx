import './training.css'
import { useTrainingStore } from './trainingStore'
import { LoadoutScreen } from './LoadoutScreen'
import { TrainingArena } from './TrainingArena'

export function TrainingPage() {
  const screen = useTrainingStore(s => s.screen)

  return (
    <div className="training-container">
      {screen === 'loadout' && <LoadoutScreen />}
      {screen === 'arena' && <TrainingArena />}
    </div>
  )
}
