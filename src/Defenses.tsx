import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Unit } from './types'

// ── Wall Segment ─────────────────────────────────────────
const BLOCK_W = 0.4
const BLOCK_H = 0.2
const BLOCK_D = 0.2
const WALL_COLS = 6
const WALL_ROWS = 5
const GRAVITY = -12

const blockGeo = new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D)
const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.35, metalness: 0.02 })

export interface WallBlock {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  alive: boolean
  settled: boolean
  homePos: THREE.Vector3
}

interface DefenseProps {
  unit: Unit
  wallBlocksMap?: React.MutableRefObject<Map<string, WallBlock[]>>
}

export function DefenseWall({ unit, wallBlocksMap }: DefenseProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const initialized = useRef(false)

  const blocks = useMemo(() => {
    const arr: WallBlock[] = []
    for (let row = 0; row < WALL_ROWS; row++) {
      for (let col = 0; col < WALL_COLS; col++) {
        const mesh = new THREE.Mesh(blockGeo, wallMat)
        const offsetX = row % 2 === 0 ? 0 : BLOCK_W * 0.5
        const x = col * BLOCK_W - (WALL_COLS * BLOCK_W) / 2 + BLOCK_W / 2 + offsetX
        const y = row * BLOCK_H + BLOCK_H / 2
        const z = 0
        mesh.position.set(x, y, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        arr.push({
          mesh,
          velocity: new THREE.Vector3(),
          alive: true,
          settled: true,
          homePos: new THREE.Vector3(x, y, z),
        })
      }
    }
    return arr
  }, [])

  useMemo(() => {
    if (wallBlocksMap?.current) {
      wallBlocksMap.current.set(unit.id, blocks)
    }
  }, [blocks, unit.id, wallBlocksMap])

  // Structural integrity check counter (don't run every frame)
  const integrityTimer = useRef(0)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    if (groupRef.current && !initialized.current) {
      groupRef.current.position.set(...unit.position)
      groupRef.current.rotation.y = unit.facingAngle
      for (const b of blocks) groupRef.current.add(b.mesh)
      initialized.current = true
    }

    // ── Structural integrity: unsupported blocks fall ──
    integrityTimer.current += delta
    if (integrityTimer.current > 0.15) {
      integrityTimer.current = 0
      for (let row = 1; row < WALL_ROWS; row++) {
        for (let col = 0; col < WALL_COLS; col++) {
          const idx = row * WALL_COLS + col
          const block = blocks[idx]
          if (!block.alive || !block.settled) continue

          // Check: is there ANY settled block below that overlaps horizontally?
          // A block on this row sits on the row below. Due to brick offset,
          // check both the block directly below and the diagonal neighbors.
          const belowRow = row - 1
          let hasSupport = false

          // Ground row (row 0) is always supported
          if (belowRow < 0) { hasSupport = true; continue }

          const bx = block.mesh.position.x
          for (let bc = 0; bc < WALL_COLS; bc++) {
            const belowIdx = belowRow * WALL_COLS + bc
            const belowBlock = blocks[belowIdx]
            if (!belowBlock.alive || !belowBlock.settled) continue

            // Check horizontal overlap: blocks support if they overlap by at least 30% of width
            const bxBelow = belowBlock.mesh.position.x
            const overlap = BLOCK_W - Math.abs(bx - bxBelow)
            if (overlap > BLOCK_W * 0.25) {
              hasSupport = true
              break
            }
          }

          if (!hasSupport) {
            // No support! Unsettle this block — it falls
            block.settled = false
            block.velocity.y = -0.5 // small initial downward nudge
            // Add slight random horizontal drift for visual variety
            block.velocity.x += (Math.random() - 0.5) * 0.3
          }
        }
      }
    }

    // ── Physics for each block ──
    for (const b of blocks) {
      if (!b.alive) continue

      const speed = b.velocity.length()

      // Settling check: slow + near home height
      if (speed < 0.01 && b.mesh.position.y <= b.homePos.y + 0.01) {
        b.settled = true
        b.velocity.set(0, 0, 0)
        continue
      }

      b.settled = false

      // Gravity
      b.velocity.y += GRAVITY * delta

      // Integrate position
      b.mesh.position.add(b.velocity.clone().multiplyScalar(delta))

      // Ground collision
      if (b.mesh.position.y < BLOCK_H / 2) {
        b.mesh.position.y = BLOCK_H / 2
        b.velocity.y *= -0.25
        b.velocity.x *= 0.6
        b.velocity.z *= 0.6
        if (Math.abs(b.velocity.y) < 0.3) b.velocity.y = 0
      }

      // Tumble rotation when moving fast
      if (speed > 0.5) {
        b.mesh.rotation.x += b.velocity.z * delta * 2
        b.mesh.rotation.z -= b.velocity.x * delta * 2
      }

      // Damping
      b.velocity.multiplyScalar(0.993)
    }
  })

  return <group ref={groupRef} />
}

// ── Sandbag Bunker ──────────────────────────────────────
const sandbagGeo = new THREE.BoxGeometry(0.3, 0.14, 0.18)
const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xA89070, roughness: 0.85 })

export function Sandbags({ unit }: DefenseProps) {
  return (
    <group position={unit.position} rotation-y={unit.facingAngle}>
      {/* Front row - 5 sandbags */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`f-${i}`} geometry={sandbagGeo} material={sandbagMat}
          position={[(i - 2) * 0.32, 0.07, 0.3]}
          rotation={[0, (i % 2) * 0.1, 0]}
          castShadow receiveShadow
        />
      ))}
      {/* Second row offset */}
      {[...Array(4)].map((_, i) => (
        <mesh key={`s-${i}`} geometry={sandbagGeo} material={sandbagMat}
          position={[(i - 1.5) * 0.32, 0.21, 0.3]}
          rotation={[0, (i % 2) * -0.1, 0]}
          castShadow receiveShadow
        />
      ))}
      {/* Side walls */}
      {[-0.65, 0.65].map((x, idx) => (
        <group key={`side-${idx}`}>
          <mesh geometry={sandbagGeo} material={sandbagMat}
            position={[x, 0.07, 0]} rotation={[0, Math.PI / 2, 0]}
            castShadow receiveShadow
          />
          <mesh geometry={sandbagGeo} material={sandbagMat}
            position={[x, 0.21, 0]} rotation={[0, Math.PI / 2, 0]}
            castShadow receiveShadow
          />
        </group>
      ))}
      {/* Top row */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`t-${i}`} geometry={sandbagGeo} material={sandbagMat}
          position={[(i - 1) * 0.32, 0.35, 0.3]}
          castShadow receiveShadow
        />
      ))}
    </group>
  )
}

// ── Watch Tower (open top — no roof, soldier can stand on platform) ──
export function WatchTower({ unit, onTowerClick }: DefenseProps & { onTowerClick?: () => void }) {
  return (
    <group position={unit.position} rotation-y={unit.facingAngle} onClick={(e) => {
      e.stopPropagation()
      onTowerClick?.()
    }}>
      {/* 4 legs */}
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.9, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
          <meshStandardMaterial color={0x6b4226} roughness={0.7} />
        </mesh>
      ))}
      {/* Cross braces */}
      {[[-0.4, 0], [0.4, 0], [0, -0.4], [0, 0.4]].map(([x, z], i) => (
        <mesh key={`brace-${i}`} position={[x, 0.5, z]}
          rotation={[0, 0, i < 2 ? 0.4 : 0]}
          castShadow>
          <boxGeometry args={[i < 2 ? 0.04 : 0.84, 0.04, i < 2 ? 0.84 : 0.04]} />
          <meshStandardMaterial color={0x5a3a1a} roughness={0.7} />
        </mesh>
      ))}
      {/* Platform */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.08, 1.1]} />
        <meshStandardMaterial color={0x6b4226} roughness={0.6} />
      </mesh>
      {/* Railing — half-height walls on 3 sides (front open for shooting) */}
      {[
        { pos: [0, 2.0, -0.52] as [number, number, number], size: [1.08, 0.32, 0.05] as [number, number, number] },
        { pos: [-0.52, 2.0, 0] as [number, number, number], size: [0.05, 0.32, 1.08] as [number, number, number] },
        { pos: [0.52, 2.0, 0] as [number, number, number], size: [0.05, 0.32, 1.08] as [number, number, number] },
      ].map((wall, i) => (
        <mesh key={`rail-${i}`} position={wall.pos} castShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={0x3d6b4f} roughness={0.5} />
        </mesh>
      ))}
      {/* Front rail — lower, for cover */}
      <mesh position={[0, 1.94, 0.52]} castShadow>
        <boxGeometry args={[1.08, 0.2, 0.05]} />
        <meshStandardMaterial color={0x3d6b4f} roughness={0.5} />
      </mesh>
      {/* Corner posts */}
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x, 2.1, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.52, 6]} />
          <meshStandardMaterial color={0x5a3a1a} roughness={0.7} />
        </mesh>
      ))}
      {/* Ladder */}
      <group position={[0.55, 0.9, 0]}>
        <mesh position={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.04, 1.8, 0.04]} />
          <meshStandardMaterial color={0x6b4226} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.08]} castShadow>
          <boxGeometry args={[0.04, 1.8, 0.04]} />
          <meshStandardMaterial color={0x6b4226} roughness={0.7} />
        </mesh>
        {[...Array(6)].map((_, i) => (
          <mesh key={`rung-${i}`} position={[0, -0.6 + i * 0.3, 0]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.2]} />
            <meshStandardMaterial color={0x5a3a1a} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ── Vehicle: Jeep ───────────────────────────────────────
export function Jeep({ unit }: { unit: Unit }) {
  return (
    <group position={unit.position} rotation-y={unit.facingAngle}>
      {/* Chassis */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.2, 1.1]} />
        <meshStandardMaterial color={unit.team === 'green' ? 0x3d6b4f : 0xC2A645} roughness={0.35} />
      </mesh>
      {/* Hood */}
      <mesh position={[0, 0.32, 0.4]} castShadow>
        <boxGeometry args={[0.54, 0.14, 0.35]} />
        <meshStandardMaterial color={unit.team === 'green' ? 0x3d6b4f : 0xC2A645} roughness={0.35} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.42, 0.2]} rotation-x={0.3}>
        <boxGeometry args={[0.52, 0.2, 0.02]} />
        <meshStandardMaterial color={0x88aacc} roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Wheels */}
      {[[-0.33, 0.12, 0.32], [0.33, 0.12, 0.32], [-0.33, 0.12, -0.32], [0.33, 0.12, -0.32]].map((pos, i) => (
        <mesh key={`w-${i}`} position={[pos[0], pos[1], pos[2]]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.07, 12]} />
          <meshStandardMaterial color={0x222222} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ── Vehicle: Tank ───────────────────────────────────────
export function Tank({ unit }: { unit: Unit }) {
  return (
    <group position={unit.position} rotation-y={unit.facingAngle}>
      {/* Hull */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.9, 0.28, 1.4]} />
        <meshStandardMaterial color={unit.team === 'green' ? 0x4a5a3a : 0x8B7D3C} roughness={0.4} />
      </mesh>
      {/* Turret base */}
      <mesh position={[0, 0.44, -0.05]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.18, 12]} />
        <meshStandardMaterial color={unit.team === 'green' ? 0x3d6b4f : 0xC2A645} roughness={0.35} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.46, 0.55]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={0x3a3a3a} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Tracks */}
      {[-0.48, 0.48].map((x, i) => (
        <mesh key={`track-${i}`} position={[x, 0.12, 0]} castShadow>
          <boxGeometry args={[0.14, 0.24, 1.5]} />
          <meshStandardMaterial color={0x333333} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
