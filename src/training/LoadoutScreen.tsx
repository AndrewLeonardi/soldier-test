import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createFlexSoldier, poseIdle } from '../models/flexSoldier.js'
import { poseRocketKneel } from '../models/weaponPoses.js'
import { attachWeapon } from '../models/weaponModels.js'
import { TOY } from '../models/materials.js'
import { useTrainingStore } from './trainingStore'
import { useRosterStore } from '../rosterStore'
import { WEAPONS } from './weapons'
import { WeaponType } from '../types'

// ── 3D Soldier Preview ──
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
    if (weapon !== currentWeapon.current) {
      attachWeapon(parts, weapon ?? 'rifle', TOY.armyGreen)
      currentWeapon.current = weapon ?? null
    }
    groupRef.current.rotation.y += delta * 0.4
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
  const selectedSoldierId = useTrainingStore(s => s.selectedSoldierId)
  const compute = useTrainingStore(s => s.compute)
  const selectWeapon = useTrainingStore(s => s.selectWeapon)
  const selectSoldier = useTrainingStore(s => s.selectSoldier)
  const startTraining = useTrainingStore(s => s.startTraining)

  const soldiers = useRosterStore(s => s.soldiers)

  // Read soldier from URL param on mount
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/soldier=([^&]+)/)
    if (match) {
      selectSoldier(match[1])
    }
  }, [])

  const selectedSoldier = soldiers.find(s => s.id === selectedSoldierId)
  const hasBrain = selectedSoldier?.skills[selectedWeapon ?? 'rifle']

  return (
    <div className="loadout-screen">
      <div className="loadout-header">
        <button className="loadout-back-btn" onClick={() => { window.location.hash = '#/roster' }}>
          {'\u2190'} Back to Roster
        </button>
        <h1 className="loadout-title">TRAINING GROUNDS</h1>
        <div className="loadout-compute">
          <span className="compute-icon" />
          <span>{compute} Compute</span>
        </div>
      </div>

      <div className="loadout-content">
        {/* Left: Soldier picker + Weapon list */}
        <div className="loadout-weapons">
          {/* Soldier picker */}
          <h2 className="loadout-section-title">SELECT SOLDIER</h2>
          <div className="soldier-picker">
            {soldiers.filter(s => s.status === 'ready').map(s => (
              <div
                key={s.id}
                className={`soldier-pick-btn ${selectedSoldierId === s.id ? 'selected' : ''}`}
                onClick={() => selectSoldier(s.id)}
              >
                <span>{'\u{1F482}'}</span>
                <span className="soldier-pick-name">{s.name}</span>
              </div>
            ))}
          </div>

          {selectedSoldierId && (
            <>
              <h2 className="loadout-section-title" style={{ marginTop: '16px' }}>WEAPONS</h2>
              {WEAPONS.map(w => {
                const isTrained = !!selectedSoldier?.skills[w.type]
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
            </>
          )}
        </div>

        {/* Center: 3D Preview */}
        <div className="loadout-preview">
          <PreviewCanvas weapon={selectedWeapon} />
          {selectedSoldier && (
            <div style={{
              position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
              color: '#FFD700', fontSize: '16px', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              letterSpacing: '1px',
            }}>
              {selectedSoldier.name}
            </div>
          )}
        </div>

        {/* Right: Info + Actions */}
        <div className="loadout-stats">
          {!selectedSoldierId && (
            <p style={{ color: '#666', padding: '20px' }}>Select a soldier from your roster to begin training.</p>
          )}
          {selectedSoldierId && !selectedWeapon && (
            <p style={{ color: '#666', padding: '20px' }}>Now select a weapon skill to train.</p>
          )}
          {selectedSoldierId && selectedWeapon && selectedWeapon !== 'rifle' && !hasBrain && (
            <div className="loadout-train-info">
              <h2 className="loadout-section-title">TRAIN {selectedSoldier?.name}</h2>
              <p>{selectedSoldier?.name} needs training to use this weapon.</p>
              <p>The neural network will learn through trial and error.</p>
              <p className="loadout-cost">Cost: 1 compute / generation</p>
              <button className="loadout-train-btn" onClick={startTraining}>
                {'\u{1F9E0}'} BEGIN TRAINING
              </button>
            </div>
          )}
          {selectedSoldierId && selectedWeapon && hasBrain && (
            <div className="loadout-trained-info">
              <h2 className="loadout-section-title">{selectedSoldier?.name}</h2>
              <div className="trained-stat">
                <span>Status:</span>
                <span className="stat-value trained">TRAINED</span>
              </div>
              <div className="trained-stat">
                <span>Fitness:</span>
                <span className="stat-value">{((hasBrain as any).fitness * 100).toFixed(1)}%</span>
              </div>
              <div className="trained-stat">
                <span>Generations:</span>
                <span className="stat-value">{(hasBrain as any).generation}</span>
              </div>
              <button className="loadout-train-btn" onClick={startTraining}>
                {'\u{1F504}'} Train More
              </button>
            </div>
          )}
          {selectedSoldierId && selectedWeapon === 'rifle' && (
            <div className="loadout-trained-info">
              <h2 className="loadout-section-title">{selectedSoldier?.name}</h2>
              <div className="trained-stat">
                <span>Status:</span> <span className="stat-value trained">DEFAULT WEAPON</span>
              </div>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '12px' }}>
                All soldiers come with basic rifle training.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
