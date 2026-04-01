import { Canvas } from '@react-three/fiber'
import { TrainingScene } from './TrainingScene'
import { TrainingHUD } from './TrainingHUD'
import { GraduationBanner } from './GraduationBanner'
import { NeuralNetViz } from './NeuralNetViz'

export function TrainingArena() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [2, 8, 12], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <TrainingScene />
      </Canvas>
      <TrainingHUD />
      <NeuralNetViz />
      <GraduationBanner />
    </div>
  )
}
