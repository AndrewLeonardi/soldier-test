import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from './store'

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(9999, 9999)
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const intersectPoint = new THREE.Vector3()

// Track mouse position
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  })
}

// Ghost geometry for each type
const GHOST_CONFIGS: Record<string, { geo: THREE.BufferGeometry; scale: [number, number, number]; yOffset: number }> = {
  soldier: { geo: new THREE.CylinderGeometry(0.35, 0.45, 1.0, 12), scale: [1, 1, 1], yOffset: 0.5 },
  wall: { geo: new THREE.BoxGeometry(2.4, 1.0, 0.2), scale: [1, 1, 1], yOffset: 0.5 },
  sandbag: { geo: new THREE.BoxGeometry(1.6, 0.4, 0.8), scale: [1, 1, 1], yOffset: 0.2 },
  tower: { geo: new THREE.BoxGeometry(1.1, 2.0, 1.1), scale: [1, 1, 1], yOffset: 1.0 },
}

const ghostMat = new THREE.MeshBasicMaterial({
  color: 0x4CAF50,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
})
const ghostMatInvalid = new THREE.MeshBasicMaterial({
  color: 0xFF4444,
  transparent: true,
  opacity: 0.25,
  depthWrite: false,
})

export function GhostPreview() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  const phase = useGameStore(s => s.phase)
  const selected = useGameStore(s => s.selectedPlacement)
  const rotation = useGameStore(s => s.placementRotation)

  useFrame(() => {
    if (!meshRef.current) return
    if (phase !== 'planning' || !selected) {
      meshRef.current.visible = false
      return
    }

    // Raycast mouse → ground plane
    raycaster.setFromCamera(mouse, camera)
    raycaster.ray.intersectPlane(groundPlane, intersectPoint)

    if (!intersectPoint) {
      meshRef.current.visible = false
      return
    }

    // Snap to grid
    const snappedX = Math.round(intersectPoint.x * 2) / 2
    const snappedZ = Math.round(intersectPoint.z * 2) / 2
    const valid = snappedX <= 2

    const config = GHOST_CONFIGS[selected]
    if (!config) {
      meshRef.current.visible = false
      return
    }

    meshRef.current.visible = true
    meshRef.current.geometry = config.geo
    meshRef.current.material = valid ? ghostMat : ghostMatInvalid
    meshRef.current.position.set(snappedX, config.yOffset, snappedZ)
    meshRef.current.rotation.y = rotation
    meshRef.current.scale.set(...config.scale)
  })

  return <mesh ref={meshRef} />
}
