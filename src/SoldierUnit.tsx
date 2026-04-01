import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createFlexSoldier, poseIdle, poseWalk, poseAim, poseShoot, poseHit, poseDeath, poseRush, poseThrow } from './models/flexSoldier.js'
import { PoseBlender } from './models/poseBlender.js'
import { TOY } from './models/materials.js'
import { Unit } from './types'

interface SoldierUnitProps {
  unit: Unit
}

export function SoldierUnit({ unit }: SoldierUnitProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const soldierRef = useRef<{ group: THREE.Group; parts: any } | null>(null)
  const blenderRef = useRef(new PoseBlender())
  const elapsedRef = useRef(0)
  const prevState = useRef(unit.state)
  // Tumble tracking for ragdoll
  const tumbleRef = useRef({ rx: 0, rz: 0 })

  const color = unit.team === 'green' ? TOY.armyGreen : TOY.tan

  useMemo(() => {
    const soldier = createFlexSoldier(color)
    soldierRef.current = soldier
  }, [color])

  useEffect(() => {
    if (groupRef.current && soldierRef.current) {
      groupRef.current.add(soldierRef.current.group)
      return () => { groupRef.current?.remove(soldierRef.current!.group) }
    }
  }, [])

  useFrame((_, delta) => {
    const soldier = soldierRef.current
    if (!soldier || !groupRef.current) return

    elapsedRef.current += delta
    const t = elapsedRef.current
    const parts = soldier.parts

    // Position — lerp toward target (fast when on ground, instant when airborne)
    const isAirborne = unit.position[1] > 0.1 || Math.abs(unit.velocity[1]) > 0.5
    const lerpSpeed = isAirborne ? 20 : 8
    const target = new THREE.Vector3(...unit.position)
    groupRef.current.position.lerp(target, Math.min(1, delta * lerpSpeed))

    // Facing — normal rotation when alive, tumble when ragdolling
    const isRagdolling = unit.spinSpeed > 0.1
    if (isRagdolling) {
      // Wild tumbling!
      tumbleRef.current.rx += unit.spinSpeed * delta * 3
      tumbleRef.current.rz += unit.spinSpeed * delta * 2.3
      groupRef.current.rotation.x = tumbleRef.current.rx
      groupRef.current.rotation.z = tumbleRef.current.rz
      // Keep some Y rotation for direction
      groupRef.current.rotation.y += unit.spinSpeed * delta * 0.5
    } else {
      // Normal facing
      const targetRot = unit.facingAngle
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRot,
        Math.min(1, delta * 6)
      )
      // Settle tumble rotations back to 0
      tumbleRef.current.rx *= 0.9
      tumbleRef.current.rz *= 0.9
      groupRef.current.rotation.x = tumbleRef.current.rx
      groupRef.current.rotation.z = tumbleRef.current.rz
    }

    // State change → notify blender
    if (unit.state !== prevState.current) {
      blenderRef.current.notifyStateChange(parts, unit.state, undefined)
      prevState.current = unit.state
    }

    // Apply pose (skip if ragdolling hard — the tumble IS the animation)
    if (!isRagdolling) {
      switch (unit.state) {
        case 'idle':
          poseIdle(parts, t)
          break
        case 'walking':
          poseWalk(parts, t, 6)
          break
        case 'rushing':
          poseRush(parts, t)
          break
        case 'firing': {
          const fireProgress = Math.min(1, unit.stateAge / 0.4)
          poseShoot(parts, fireProgress)
          break
        }
        case 'throwing': {
          const throwProgress = Math.min(1, unit.stateAge / 0.6)
          poseThrow(parts, throwProgress)
          break
        }
        case 'hit':
          poseHit(parts, unit.stateAge)
          break
        case 'dead': {
          const deathProgress = Math.min(1, unit.stateAge / 1.5)
          poseDeath(parts, deathProgress)
          break
        }
      }
      blenderRef.current.update(parts, delta)
    }
  })

  return <group ref={groupRef} />
}
