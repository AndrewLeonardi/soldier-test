import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { useTrainingStore } from './trainingStore'
import { createFlexSoldier, poseIdle } from '../models/flexSoldier.js'
import { poseRocketKneel, poseRocketFire } from '../models/weaponPoses.js'
import { attachWeapon } from '../models/weaponModels.js'
import { TOY } from '../models/materials.js'

// ── Giant Soda Can Target ──
function SodaCan({ position, alive }: { position: [number, number, number]; alive: boolean }) {
  if (!alive) return null
  return (
    <group position={position}>
      {/* Can body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.2, 16]} />
        <meshStandardMaterial color={0xcc0000} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.35, 0.05, 16]} />
        <meshStandardMaterial color={0xcccccc} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Bottom rim */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.33, 0.05, 16]} />
        <meshStandardMaterial color={0xcccccc} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* White stripe */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.3, 16]} />
        <meshStandardMaterial color={0xffffff} roughness={0.4} />
      </mesh>
    </group>
  )
}

// ── Explosion effect (when target destroyed) ──
function Explosion({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null!)
  const ageRef = useRef(0)
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2,
      ),
      scale: 0.1 + Math.random() * 0.2,
      color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00',
    }))
  }, [])

  useFrame((_, dt) => {
    if (!ref.current) return
    ageRef.current += dt
    const age = ageRef.current
    if (age > 1.5) { ref.current.visible = false; return }
    ref.current.children.forEach((child, i) => {
      const p = particles[i]
      child.position.x = p.dir.x * age * 3
      child.position.y = p.dir.y * age * 3 - 4 * age * age
      child.position.z = p.dir.z * age * 3
      const fade = Math.max(0, 1 - age / 1.5)
      child.scale.setScalar(p.scale * (1 + age * 2) * fade)
    })
  })

  return (
    <group ref={ref} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ── Rocket Projectile (BIG and visible, updates position imperatively) ──
function RocketProjectile({ projectileRef }: { projectileRef: { position: number[]; velocity: number[]; alive: boolean } }) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!groupRef.current || !projectileRef.alive) {
      if (groupRef.current) groupRef.current.visible = false
      return
    }
    groupRef.current.visible = true
    // Read position directly from the mutable ref
    groupRef.current.position.set(projectileRef.position[0], projectileRef.position[1], projectileRef.position[2])
    // Orient along velocity
    const vx = projectileRef.velocity[0]
    const vy = projectileRef.velocity[1]
    const vz = projectileRef.velocity[2]
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (speed > 0.1) {
      groupRef.current.lookAt(
        projectileRef.position[0] + vx,
        projectileRef.position[1] + vy,
        projectileRef.position[2] + vz,
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* Rocket body */}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.03, 0.3, 6]} />
        <meshStandardMaterial color={0x444444} roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, 0.2]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color={0xcc0000} roughness={0.4} />
      </mesh>
      {/* Exhaust flame */}
      <mesh position={[0, 0, -0.2]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color={0xff6600} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.3]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial color={0xffcc00} transparent opacity={0.7} />
      </mesh>
      {/* Smoke trail */}
      <mesh position={[0, 0, -0.4]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={0x888888} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ── Training Soldier ──
function TrainingSoldier() {
  const groupRef = useRef<THREE.Group>(null!)
  const soldierRef = useRef<{ group: THREE.Group; parts: any } | null>(null)
  const elapsedRef = useRef(0)
  const weaponAttached = useRef(false)
  const selectedWeapon = useTrainingStore(s => s.selectedWeapon)

  useMemo(() => {
    soldierRef.current = createFlexSoldier(TOY.armyGreen)
    weaponAttached.current = false
  }, [])

  useEffect(() => {
    if (groupRef.current && soldierRef.current) {
      groupRef.current.add(soldierRef.current.group)
      return () => { groupRef.current?.remove(soldierRef.current!.group) }
    }
  }, [])

  useFrame((_, delta) => {
    const soldier = soldierRef.current
    if (!soldier || !groupRef.current) return
    const parts = soldier.parts

    if (!weaponAttached.current && selectedWeapon && selectedWeapon !== 'rifle') {
      attachWeapon(parts, selectedWeapon, TOY.armyGreen)
      weaponAttached.current = true
    }

    elapsedRef.current += delta
    const t = elapsedRef.current
    const state = useTrainingStore.getState()
    const sim = state.simState

    if (sim) {
      groupRef.current.position.set(sim.soldierPos[0], sim.soldierPos[1], sim.soldierPos[2])
      groupRef.current.rotation.y = sim.soldierAngle

      if (selectedWeapon === 'rocketLauncher') {
        if (sim.weaponCooldown > 0.8) {
          const progress = 1 - (sim.weaponCooldown - 0.8) / 0.4
          poseRocketFire(parts, Math.min(1, progress))
        } else {
          poseRocketKneel(parts, t)
        }
      } else {
        poseIdle(parts, t)
      }
    } else {
      poseRocketKneel(parts, t)
    }
  })

  return <group ref={groupRef} />
}

// ── Main Training Scene ──
export function TrainingScene() {
  const simState = useTrainingStore(s => s.simState)
  const simSpeed = useTrainingStore(s => s.simSpeed)
  const simRunning = useTrainingStore(s => s.simRunning)
  const explosionsRef = useRef<Array<{ id: string; position: [number, number, number] }>>([])
  const prevTargets = useRef<Record<string, boolean>>({})

  // Track target deaths for explosions
  useFrame(() => {
    if (!simState) return
    for (const t of simState.targets) {
      if (prevTargets.current[t.id] && !t.alive) {
        explosionsRef.current.push({ id: `exp-${Date.now()}-${t.id}`, position: [...t.position] })
      }
      prevTargets.current[t.id] = t.alive
    }
    // Clean old explosions
    if (explosionsRef.current.length > 10) {
      explosionsRef.current = explosionsRef.current.slice(-5)
    }
  })

  // Drive simulation
  useFrame((_, rawDelta) => {
    if (!simRunning) return
    const dt = Math.min(rawDelta, 0.05)
    const ticks = Math.max(1, simSpeed)
    for (let i = 0; i < ticks; i++) {
      useTrainingStore.getState().tick(dt)
    }
  })

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 20, 40]} />

      <directionalLight
        position={[6, 12, 8]} intensity={1.8} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={10} shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 6, -6]} intensity={0.5} color="#aaccff" />
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.6]} />
      <ambientLight intensity={0.25} />

      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={0xD4B896} roughness={0.9} />
      </mesh>

      {/* Arena boundary posts + ropes */}
      {[[-4, 0, -5], [-4, 0, 5], [9, 0, -5], [9, 0, 5]].map((pos, i) => (
        <mesh key={`post-${i}`} position={[pos[0], 0.3, pos[2]]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          <meshStandardMaterial color={0x8B4513} roughness={0.7} />
        </mesh>
      ))}

      <TrainingSoldier />

      {/* Soda Can Targets */}
      {simState?.targets.map(t => (
        <SodaCan key={t.id} position={t.position} alive={t.alive} />
      ))}

      {/* Rockets in flight — pass mutable refs for imperative position updates */}
      {simState?.projectiles.map(p => (
        <RocketProjectile key={p.id} projectileRef={p} />
      ))}

      {/* Explosions */}
      {explosionsRef.current.map(e => (
        <Explosion key={e.id} position={e.position} />
      ))}

      <OrbitControls
        makeDefault target={[2.5, 0.5, 0]}
        maxPolarAngle={Math.PI / 2.2} minDistance={4} maxDistance={22}
        enablePan={false}
      />
    </>
  )
}
