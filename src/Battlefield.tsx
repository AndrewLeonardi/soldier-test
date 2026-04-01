import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from './store'
import { SoldierUnit } from './SoldierUnit'
import { DefenseWall, Sandbags, WatchTower, Jeep, Tank, WallBlock } from './Defenses'
import { Intel } from './Intel'
import { GhostPreview } from './GhostPreview'
import { ProjectileManager } from './Projectiles'
import { Unit, UNIT_STATS } from './types'

const INTEL_POS = new THREE.Vector3(-7, 0, 0)
const _worldPos = new THREE.Vector3()
const GRENADE_COOLDOWN = 8 // seconds between grenade throws

export function Battlefield() {
  const { scene } = useThree()
  const projRef = useRef(new ProjectileManager())
  const wallBlocksMap = useRef(new Map<string, WallBlock[]>())
  const battleTimeRef = useRef(0)
  const bannerClearedRef = useRef(false)

  const playerRef = useRef<Unit[]>([])
  const enemyRef = useRef<Unit[]>([])

  const phase = useGameStore(s => s.phase)
  const playerUnits = useGameStore(s => s.playerUnits)
  const enemies = useGameStore(s => s.enemies)
  const selectedPlacement = useGameStore(s => s.selectedPlacement)
  const placementRotation = useGameStore(s => s.placementRotation)

  useEffect(() => {
    playerRef.current = playerUnits.map(u => ({ ...u, position: [...u.position] as [number, number, number] }))
  }, [playerUnits])

  useEffect(() => {
    enemyRef.current = enemies.map(u => ({ ...u, position: [...u.position] as [number, number, number] }))
  }, [enemies])

  useEffect(() => {
    scene.add(projRef.current.group)
    return () => { scene.remove(projRef.current.group) }
  }, [scene])

  useEffect(() => {
    if (phase === 'battle') {
      battleTimeRef.current = 0
      bannerClearedRef.current = false
    }
  }, [phase])

  // ── Helper: try to throw a grenade at a target ──
  function tryGrenade(unit: Unit, targetPos: THREE.Vector3, time: number, proj: ProjectileManager, team: 'green' | 'tan') {
    if (unit.type !== 'soldier') return false
    if (time - unit.lastGrenadeTime < GRENADE_COOLDOWN) return false
    const uPos = new THREE.Vector3(...unit.position)
    const dist = uPos.distanceTo(targetPos)
    // Grenades are mid-range: 3-7 units
    if (dist < 2.5 || dist > 7) return false

    unit.lastGrenadeTime = time
    unit.state = 'throwing'
    unit.stateAge = 0
    const muzzle = uPos.clone()
    muzzle.y += 1.0
    const dir = targetPos.clone().sub(uPos).normalize()
    // Delay actual grenade spawn to match throw animation wind-up
    setTimeout(() => {
      proj.spawnGrenade(muzzle, dir, team)
    }, 300)
    return true
  }

  // ── BATTLE TICK ──
  useFrame((_, rawDelta) => {
    if (phase !== 'battle') return
    const delta = Math.min(rawDelta, 0.05)
    battleTimeRef.current += delta

    if (!bannerClearedRef.current && battleTimeRef.current > 1.5) {
      bannerClearedRef.current = true
      useGameStore.getState().setBannerText(null)
    }

    const players = playerRef.current
    const enemyUnits = enemyRef.current
    const proj = projRef.current
    const time = battleTimeRef.current

    const allWallBlocks: WallBlock[] = []
    wallBlocksMap.current.forEach(blocks => {
      for (const b of blocks) {
        if (b.alive) allWallBlocks.push(b)
      }
    })

    // ── Update enemies ──
    for (const enemy of enemyUnits) {
      if (enemy.state === 'dead') { enemy.stateAge += delta; continue }
      if (enemy.state === 'throwing') {
        enemy.stateAge += delta
        if (enemy.stateAge > 0.7) { enemy.state = 'idle'; enemy.stateAge = 0 }
        continue
      }
      enemy.stateAge += delta

      const shootableTargets = players.filter(p => p.health > 0 && p.type === 'soldier')
      let nearestShootable: Unit | null = null
      let nearestShootDist = Infinity
      const ePos = new THREE.Vector3(...enemy.position)

      for (const t of shootableTargets) {
        const d = ePos.distanceTo(new THREE.Vector3(...t.position))
        if (d < nearestShootDist) { nearestShootDist = d; nearestShootable = t }
      }

      const stats = UNIT_STATS[enemy.type]
      const speed = stats.speed

      // Check wall blocking
      let blockedByWall = false
      for (const block of allWallBlocks) {
        if (!block.settled) continue
        block.mesh.getWorldPosition(_worldPos)
        const distToBlock = ePos.distanceTo(_worldPos)
        if (distToBlock < 1.5 && _worldPos.x < ePos.x && _worldPos.x > ePos.x - 2.0) {
          blockedByWall = true
          // Try grenade first against wall cluster
          if (!tryGrenade(enemy, _worldPos, time, proj, 'tan')) {
            if (time - enemy.lastFireTime > stats.fireRate) {
              enemy.lastFireTime = time
              enemy.state = 'firing'
              enemy.stateAge = 0
              const muzzle = ePos.clone(); muzzle.y += 0.8
              const targetPos = _worldPos.clone(); targetPos.y = Math.max(targetPos.y, 0.1)
              const dir = targetPos.clone().sub(muzzle).normalize()
              proj.spawnBullet(muzzle, dir, 'tan')
              block.velocity.add(dir.clone().multiplyScalar(3))
              block.velocity.y += 2.0
            } else if (enemy.stateAge > 0.4) {
              enemy.facingAngle = Math.atan2(_worldPos.x - ePos.x, _worldPos.z - ePos.z)
            }
          } else {
            enemy.facingAngle = Math.atan2(_worldPos.x - ePos.x, _worldPos.z - ePos.z)
          }
          break
        }
      }

      if (!blockedByWall) {
        if (nearestShootable && nearestShootDist < stats.range) {
          const tPos = new THREE.Vector3(...nearestShootable.position)
          enemy.facingAngle = Math.atan2(tPos.x - ePos.x, tPos.z - ePos.z)

          // Try grenade occasionally, otherwise shoot
          if (!tryGrenade(enemy, tPos, time, proj, 'tan')) {
            if (time - enemy.lastFireTime > stats.fireRate) {
              enemy.lastFireTime = time
              enemy.state = 'firing'
              enemy.stateAge = 0
              const muzzle = ePos.clone(); muzzle.y += 0.8
              const targetCenter = tPos.clone(); targetCenter.y += 0.5
              const dir = targetCenter.sub(muzzle).normalize()
              proj.spawnBullet(muzzle, dir, 'tan')
            } else if (enemy.stateAge > 0.4) {
              enemy.state = 'idle'
            }
          }
        } else {
          const toIntel = INTEL_POS.clone().sub(ePos).normalize()
          enemy.position[0] += toIntel.x * speed * delta
          enemy.position[2] += toIntel.z * speed * delta
          enemy.facingAngle = Math.atan2(toIntel.x, toIntel.z)
          enemy.state = enemy.type === 'jeep' ? 'rushing' : 'walking'

          if (ePos.distanceTo(INTEL_POS) < 1.5) {
            useGameStore.getState().endBattle('defeat')
            return
          }
        }
      }
    }

    // ── Update player units ──
    for (const player of players) {
      if (player.health <= 0) {
        if (player.state !== 'dead') { player.state = 'dead'; player.stateAge = 0 }
        player.stateAge += delta
        continue
      }
      if (player.state === 'throwing') {
        player.stateAge += delta
        if (player.stateAge > 0.7) { player.state = 'idle'; player.stateAge = 0 }
        continue
      }

      const stats = UNIT_STATS[player.type]
      if (stats.range <= 0) continue

      player.stateAge += delta

      const pPos = new THREE.Vector3(...player.position)
      let nearestEnemy: Unit | null = null
      let nearestDist = Infinity

      for (const e of enemyUnits) {
        if (e.health <= 0) continue
        const d = pPos.distanceTo(new THREE.Vector3(...e.position))
        if (d < nearestDist) { nearestDist = d; nearestEnemy = e }
      }

      const isRocket = player.equippedWeapon === 'rocketLauncher'
      const effectiveRange = isRocket ? 8 : stats.range
      const effectiveFireRate = isRocket ? 2.5 : stats.fireRate

      if (nearestEnemy && nearestDist < effectiveRange) {
        const ePos = new THREE.Vector3(...nearestEnemy.position)
        player.facingAngle = Math.atan2(ePos.x - pPos.x, ePos.z - pPos.z)

        if (isRocket) {
          // Rocket soldiers fire rockets (arced grenades)
          if (time - player.lastFireTime > effectiveFireRate) {
            player.lastFireTime = time
            player.state = 'firing'
            player.stateAge = 0
            const muzzle = pPos.clone(); muzzle.y += 0.9
            const dir = ePos.clone().sub(pPos).normalize()
            proj.spawnGrenade(muzzle, dir, 'green')
          } else if (player.stateAge > 0.5) {
            player.state = 'idle'
          }
        } else {
          // Regular soldiers: try grenade occasionally, otherwise shoot
          if (!tryGrenade(player, ePos, time, proj, 'green')) {
            if (time - player.lastFireTime > effectiveFireRate) {
              player.lastFireTime = time
              player.state = 'firing'
              player.stateAge = 0
              const muzzle = pPos.clone(); muzzle.y += 0.8
              const targetCenter = ePos.clone(); targetCenter.y += 0.5
              const dir = targetCenter.sub(muzzle).normalize()
              proj.spawnBullet(muzzle, dir, 'green')
            } else if (player.stateAge > 0.4) {
              player.state = 'idle'
            }
          }
        }
      } else {
        if (player.state !== 'idle') { player.state = 'idle'; player.stateAge = 0 }
      }
    }

    // ── Update projectiles ──
    const allTargets = [
      ...players.filter(p => p.health > 0).map(p => ({
        id: p.id,
        position: new THREE.Vector3(p.position[0], p.position[1] + 0.5, p.position[2]),
        team: p.team as 'green' | 'tan',
        radius: p.type === 'tank' ? 0.7 : p.type === 'jeep' ? 0.5 : 0.4,
        alive: true,
      })),
      ...enemyUnits.filter(e => e.health > 0).map(e => ({
        id: e.id,
        position: new THREE.Vector3(e.position[0], e.position[1] + 0.5, e.position[2]),
        team: e.team as 'green' | 'tan',
        radius: e.type === 'tank' ? 0.7 : e.type === 'jeep' ? 0.5 : 0.4,
        alive: true,
      })),
    ]

    const wallBlocksWorld = allWallBlocks.map(b => {
      const wp = new THREE.Vector3()
      b.mesh.getWorldPosition(wp)
      return { worldPos: wp, velocity: b.velocity, alive: b.alive, mesh: b.mesh }
    })

    proj.update(delta, allTargets, wallBlocksWorld)

    // ── Apply hits ──
    for (const hit of proj.hits) {
      const playerUnit = players.find(p => p.id === hit.targetId)
      const enemyUnit = enemyUnits.find(e => e.id === hit.targetId)
      const unit = playerUnit || enemyUnit
      if (unit && unit.health > 0) {
        unit.health -= hit.damage

        // Grenade blast knockback (moderate — enough to stumble, not orbit)
        if (hit.launchVel) {
          unit.velocity[0] += hit.launchVel.x
          unit.velocity[1] += hit.launchVel.y
          unit.velocity[2] += hit.launchVel.z
          unit.spinSpeed = 1 + Math.random() * 2
        }

        if (unit.health <= 0) {
          unit.health = 0
          unit.state = 'dead'
          unit.stateAge = 0
          // Small death knockback (topple, not launch)
          if (!hit.launchVel) {
            const knockDir = new THREE.Vector3(...unit.position).sub(hit.position).normalize()
            unit.velocity[0] += knockDir.x * 1.5
            unit.velocity[1] += 1.5
            unit.velocity[2] += knockDir.z * 1.5
            unit.spinSpeed = 1 + Math.random() * 1.5
          }
        } else {
          // Alive hit — tiny stagger
          if (!hit.launchVel) {
            const knockDir = new THREE.Vector3(...unit.position).sub(hit.position).normalize()
            unit.velocity[0] += knockDir.x * 0.5
            unit.velocity[2] += knockDir.z * 0.5
          }
          unit.state = 'hit'
          unit.stateAge = 0
        }
      }
    }

    // ── Ragdoll physics for ALL units with velocity ──
    const GRAV = -15
    for (const unit of [...players, ...enemyUnits]) {
      const hasVel = Math.abs(unit.velocity[0]) > 0.01 || Math.abs(unit.velocity[1]) > 0.01 || Math.abs(unit.velocity[2]) > 0.01
      if (!hasVel && unit.position[1] <= 0.01) continue

      // Apply gravity
      unit.velocity[1] += GRAV * delta

      // Integrate position
      unit.position[0] += unit.velocity[0] * delta
      unit.position[1] += unit.velocity[1] * delta
      unit.position[2] += unit.velocity[2] * delta

      // Ground bounce
      if (unit.position[1] < 0) {
        unit.position[1] = 0
        unit.velocity[1] *= -0.3 // bouncy!
        unit.velocity[0] *= 0.7
        unit.velocity[2] *= 0.7
        unit.spinSpeed *= 0.6
        if (Math.abs(unit.velocity[1]) < 0.5) {
          unit.velocity[1] = 0
        }
      }

      // Air drag
      unit.velocity[0] *= 0.995
      unit.velocity[2] *= 0.995

      // Stop if barely moving on ground
      if (unit.position[1] <= 0.01 && Math.abs(unit.velocity[0]) < 0.05 && Math.abs(unit.velocity[2]) < 0.05) {
        unit.velocity[0] = 0
        unit.velocity[1] = 0
        unit.velocity[2] = 0
        unit.spinSpeed = 0
      }
    }

    // ── Check victory ──
    const aliveEnemies = enemyUnits.filter(e => e.health > 0)
    if (aliveEnemies.length === 0) {
      useGameStore.getState().endBattle('victory')
    }
  })

  // ── Placement ──
  const handlePlacement = useCallback((e: any) => {
    if (phase !== 'planning' || !selectedPlacement) return
    const point = e.point as THREE.Vector3
    if (point.x > 2) return
    useGameStore.getState().placeUnit(selectedPlacement, [
      Math.round(point.x * 2) / 2,
      0,
      Math.round(point.z * 2) / 2,
    ])
  }, [phase, selectedPlacement])

  const renderPlayers = phase === 'battle' || phase === 'result' ? playerRef.current : playerUnits
  const renderEnemies = phase === 'battle' || phase === 'result' ? enemyRef.current : enemies

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} onClick={handlePlacement}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {phase === 'planning' && selectedPlacement && (
        <mesh rotation-x={-Math.PI / 2} position={[-3.5, 0.003, 0]}>
          <planeGeometry args={[13, 12]} />
          <meshBasicMaterial color={0x4CAF50} transparent opacity={0.08} />
        </mesh>
      )}

      <Intel position={[-7, 0, 0]} />

      {/* Ghost preview when placing */}
      <GhostPreview />

      {renderPlayers.map(unit => {
        if (unit.type === 'soldier') return <SoldierUnit key={unit.id} unit={unit} />
        if (unit.type === 'wall') return <DefenseWall key={unit.id} unit={unit} wallBlocksMap={wallBlocksMap} />
        if (unit.type === 'sandbag') return <Sandbags key={unit.id} unit={unit} />
        if (unit.type === 'tower') return <WatchTower key={unit.id} unit={unit} onTowerClick={() => {
          // Clicking a tower with soldier selected → place soldier on top
          const state = useGameStore.getState()
          if (state.phase === 'planning' && state.selectedPlacement === 'soldier') {
            state.placeUnit('soldier', [unit.position[0], 1.85, unit.position[2]])
          }
        }} />
        if (unit.type === 'jeep') return <Jeep key={unit.id} unit={unit} />
        if (unit.type === 'tank') return <Tank key={unit.id} unit={unit} />
        return null
      })}

      {renderEnemies.map(unit => {
        if (unit.type === 'soldier') return <SoldierUnit key={unit.id} unit={unit} />
        if (unit.type === 'jeep') return <Jeep key={unit.id} unit={unit} />
        if (unit.type === 'tank') return <Tank key={unit.id} unit={unit} />
        return null
      })}
    </group>
  )
}
