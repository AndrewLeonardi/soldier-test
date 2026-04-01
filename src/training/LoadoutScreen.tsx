import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createFlexSoldier, poseIdle } from '../models/flexSoldier.js'
import { poseRocketKneel } from '../models/weaponPoses.js'
import { attachWeapon } from '../models/weaponModels.js'
import { TOY } from '../models/materials.js'
import { useTrainingStore } from './trainingStore'
import { WEAPONS } from './weapons'
import { WeaponType } from '../types'

// ── 3D Soldier Preview (rotates slowly, shows equipped weapon) ──
function SoldierPreview({ weapon }: { weapon: WeaponType | null }) {
  const groupRef = useRef<THREE.Group>(null!)
  const soldierRef = useRef<{ group: THREE.Group; parts: any } | null>(null)
  const currentWeapon = useRef<string | null>(null)
  const elapsedRef = useRef(0)

  useMemo(() => {
    soldierRef.current = createFlexSoldier(TOY.armyGreen)
    currentWeapon.current = null
  }, [])

  useEffect(() => {
    if (groupRef.current && soldierRef.current) {
      groupRef.current.add(soldierRef.current.group)
      return () => { groupRef.current?.remove(soldierRef.current!.group) }
    }
  }, [])

  useFrame((_, delta) => {
    if (!soldierRef.current || !groupRef.current) return
    const parts = soldierRef.current.parts
    elapsedRef.current += delta

    // Swap weapon if changed
    if (weapon !== currentWeapon.current) {
      attachWeapon(parts, weapon ?? 'rifle', TOY.armyGreen)
      currentWeapon.current = weapon ?? null
    }

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.4

    // Pose based on weapon
    if (weapon === 'rocketLauncher') {
      poseRocketKneel(parts, elapsedRef.current)
    } else {
      poseIdle(parts, elapsedRef.current)
    }
  })

  return <group ref={groupRef} />
}

function PreviewCanvas({ weapon }: { weapon: WeaponType | null }) {
  return (
    <Canvas camera={{ position: [0, 0.6, 3.0], fov: 40 }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#1a1a2e']} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <directionalLight position={[-2, 3, -3]} intensity={0.6} color="#aaccff" />
      <ambientLight intensity={0.4} />

      {/* Pedestal */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.04, 24]} />
        <meshStandardMaterial color={0x333344} roughness={0.5} metalness={0.2} />
      </mesh>

      <SoldierPreview weapon={weapon} />
    </Canvas>
  )
}

// ── Loadout Screen ──
export function LoadoutScreen() {
  const selectedWeapon = useTrainingStore(s => s.selectedWeapon)
  const trainedBrains = useTrainingStore(s => s.trainedBrains)
  const compute = useTrainingStore(s => s.compute)
  const selectWeapon = useTrainingStore(s => s.selectWeapon)
  const startTraining = useTrainingStore(s => s.startTraining)

  return (
    <div className="loadout-screen">
      {/* Header */}
      <div className="loadout-header">
        <button className="loadout-back-btn" onClick={() => { window.location.hash = '#/' }}>
          {'\u2190'} Back to Battle
        </button>
        <h1 className="loadout-title">TRAINING GROUNDS</h1>
        <div className="loadout-compute">
          <span className="compute-icon" />
          <span>{compute} Compute</span>
        </div>
      </div>

      {/* Main content */}
      <div className="loadout-content">
        {/* Left: Weapon list */}
        <div className="loadout-weapons">
          <h2 className="loadout-section-title">WEAPONS</h2>
          {WEAPONS.map(w => {
            const isTrained = !!trainedBrains[w.type]
            const isSelected = selectedWeapon === w.type
            const isDefault = w.type === 'rifle'
            const isLocked = w.locked && !isTrained

            return (
              <div
                key={w.type}
                className={`loadout-weapon-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isTrained ? 'trained' : ''}`}
                onClick={() => !isLocked && selectWeapon(w.type)}
              >
                <span className="weapon-icon">{w.icon}</span>
                <div className="weapon-info">
                  <div className="weapon-name">
                    {isLocked ? '???' : w.label}
                    {isTrained && <span className="trained-badge">{'\u2705'}</span>}
                    {isDefault && <span className="default-badge">DEFAULT</span>}
                  </div>
                  <div className="weapon-desc">
                    {isLocked ? 'Complete previous training to unlock' : w.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Center: 3D Preview */}
        <div className="loadout-preview">
          <PreviewCanvas weapon={selectedWeapon} />
        </div>

        {/* Right: Stats / info */}
        <div className="loadout-stats">
          <h2 className="loadout-section-title">SOLDIER INFO</h2>
          {selectedWeapon && selectedWeapon !== 'rifle' && !trainedBrains[selectedWeapon] && (
            <div className="loadout-train-info">
              <p>This soldier needs training to use this weapon.</p>
              <p>The neural network will learn through trial and error.</p>
              <p className="loadout-cost">Cost: 1 compute / generation</p>
              <button className="loadout-train-btn" onClick={startTraining}>
                {'\u{1F9E0}'} BEGIN TRAINING
              </button>
            </div>
          )}
          {selectedWeapon && trainedBrains[selectedWeapon] && (
            <div className="loadout-trained-info">
              <div className="trained-stat">
                <span>Status:</span> <span className="stat-value trained">TRAINED</span>
              </div>
              <div className="trained-stat">
                <span>Fitness:</span>
                <span className="stat-value">{(trainedBrains[selectedWeapon]!.fitness * 100).toFixed(1)}%</span>
              </div>
              <div className="trained-stat">
                <span>Generations:</span>
                <span className="stat-value">{trainedBrains[selectedWeapon]!.generation}</span>
              </div>
              <button className="loadout-train-btn retrain" onClick={startTraining}>
                {'\u{1F504}'} Retrain
              </button>
            </div>
          )}
          {selectedWeapon === 'rifle' && (
            <div className="loadout-trained-info">
              <div className="trained-stat">
                <span>Status:</span> <span className="stat-value trained">DEFAULT WEAPON</span>
              </div>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '12px' }}>
                Standard issue rifle. All soldiers come equipped with basic rifle training.
              </p>
            </div>
          )}
          {!selectedWeapon && (
            <p style={{ color: '#666', padding: '20px' }}>Select a weapon to view details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
