import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Battlefield } from './Battlefield'

export function Game() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 16], fov: 38 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Sky color */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 25, 45]} />

      {/* Lighting */}
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
      <directionalLight position={[-5, 8, -8]} intensity={0.5} color="#aaccff" />
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.6]} />
      <ambientLight intensity={0.2} />

      {/* Ground */}
      <Ground />

      {/* Main battlefield */}
      <Battlefield />

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 6}
        minDistance={8}
        maxDistance={28}
        target={[0, 0, 0]}
        enablePan={false}
      />
    </Canvas>
  )
}

function Ground() {
  return (
    <group>
      {/* Main sand ground */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color={0xD4B896} roughness={0.9} />
      </mesh>

      {/* Darker border / edge of sandbox */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[44, 34]} />
        <meshStandardMaterial color={0x6b4226} roughness={0.8} />
      </mesh>

      {/* Subtle grid lines for placement (green zone) */}
      <gridHelper
        args={[14, 14, 0x4CAF50, 0x4CAF50]}
        position={[-3.5, 0.005, 0]}
        material-opacity={0.12}
        material-transparent={true}
      />
    </group>
  )
}
