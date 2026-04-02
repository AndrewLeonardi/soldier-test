import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createFlexSoldier, poseIdle, poseWalk, poseAim, poseShoot, poseHit, poseDeath, poseRush, poseThrow } from './models/flexSoldier.js'
import { poseRocketKneel, poseRocketFire } from './models/weaponPoses.js'
import { attachWeapon } from './models/weaponModels.js'
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
  const tumbleRef = useRef({ rx: 0, rz: 0 })
  const weaponAttached = useRef(false)

  const color = unit.team === 'green' ? TOY.armyGreen : TOY.tan

  useMemo(() => {
    const soldier = createFlexSoldier(color)
    soldierRef.current = soldier
    weaponAttached.current = false
  }, [color])

  useEffect(() => {
    if (groupRef.current && soldierRef.current) {
      groupRef.current.add(soldierRef.current.group)

      // Attach weapon if equipped
      if (unit.equippedWeapon && unit.equippedWeapon !== 'rifle') {
        attachWeapon(soldierRef.current.parts, unit.equippedWeapon, color)
        weaponAttached.current = true
      }

      return () => { groupRef.current?.remove(soldierRef.current!.group) }
    }
  }, [])

  useFrame((_, delta) => {
    const soldier = soldierRef.current
    if (!soldier || !groupRef.current) return

    elapsedRef.current += delta
    const t = elapsedRef.current
    const parts = soldier.parts

    // Position — always clamp above ground
    const isAirborne = unit.position[1] > 0.1 || Math.abs(unit.velocity[1]) > 0.5
    const lerpSpeed = isAirborne ? 20 : 8
    const target = new THREE.Vector3(unit.position[0], Math.max(0, unit.position[1]), unit.position[2])
    groupRef.current.position.lerp(target, Math.min(1, delta * lerpSpeed))
    if (groupRef.current.position.y < 0) groupRef.current.position.y = 0

    // Rotation — ragdoll tumble only when airborne with spin
    const isGrounded = unit.position[1] < 0.05
    if (unit.spinSpeed > 0.1 && !isGrounded) {
      // Airborne tumble
      tumbleRef.current.rx += unit.spinSpeed * delta * 3
      tumbleRef.current.rz += unit.spinSpeed * delta * 2.3
      groupRef.current.rotation.x = tumbleRef.current.rx
      groupRef.current.rotation.z = tumbleRef.current.rz
      groupRef.current.rotation.y += unit.spinSpeed * delta * 0.5
    } else if (isGrounded) {
      // On ground: settle rotation back to upright (x=0, z=0)
      tumbleRef.current.rx *= 0.85
      tumbleRef.current.rz *= 0.85
      if (Math.abs(tumbleRef.current.rx) < 0.02) tumbleRef.current.rx = 0
      if (Math.abs(tumbleRef.current.rz) < 0.02) tumbleRef.current.rz = 0
      groupRef.current.rotation.x = tumbleRef.current.rx
      groupRef.current.rotation.z = tumbleRef.current.rz
      // Face direction
      const targetRot = unit.facingAngle
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, Math.min(1, delta * 6))
    } else {
      // Normal (no spin, not grounded — falling)
      const targetRot = unit.facingAngle
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, Math.min(1, delta * 6))
      tumbleRef.current.rx *= 0.95
      tumbleRef.current.rz *= 0.95
      groupRef.current.rotation.x = tumbleRef.current.rx
      groupRef.current.rotation.z = tumbleRef.current.rz
    }

    // State transition
    if (unit.state !== prevState.current) {
      blenderRef.current.notifyStateChange(parts, unit.state, undefined)
      prevState.current = unit.state
    }

    // Pose — weapon-aware
    const isRocket = unit.equippedWeapon === 'rocketLauncher'

    const isRagdolling = unit.spinSpeed > 0.1 && !isGrounded
    if (!isRagdolling) {
      switch (unit.state) {
        case 'idle':
          if (isRocket) poseRocketKneel(parts, t)
          else poseIdle(parts, t)
          break
        case 'walking':
          poseWalk(parts, t, 6)
          break
        case 'rushing':
          poseRush(parts, t)
          break
        case 'firing': {
          if (isRocket) {
            const fireProgress = Math.min(1, unit.stateAge / 0.5)
            poseRocketFire(parts, fireProgress)
          } else {
            const fireProgress = Math.min(1, unit.stateAge / 0.4)
            poseShoot(parts, fireProgress)
          }
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
