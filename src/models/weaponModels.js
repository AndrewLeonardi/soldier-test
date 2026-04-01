import * as THREE from 'three'
import { getPlasticMat, TOY } from './materials.js'

/**
 * Rocket Launcher — tube on shoulder
 * Sits in rifleGrp, positioned for shoulder carry
 */
export function createRocketLauncher(color = TOY.armyGreen) {
  const mat = getPlasticMat(color)
  const metalMat = getPlasticMat(TOY.metalDark)
  const group = new THREE.Group()

  // Main tube
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
    metalMat,
  )
  tube.rotation.x = Math.PI / 2
  tube.position.z = 0.2
  tube.castShadow = true
  group.add(tube)

  // Rear flare (wider opening)
  const flare = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.04, 0.08, 8),
    metalMat,
  )
  flare.rotation.x = Math.PI / 2
  flare.position.z = -0.12
  flare.castShadow = true
  group.add(flare)

  // Front opening
  const front = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.06, 8),
    metalMat,
  )
  front.rotation.x = Math.PI / 2
  front.position.z = 0.52
  front.castShadow = true
  group.add(front)

  // Sight on top
  const sight = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.04, 0.06),
    mat,
  )
  sight.position.set(0, 0.06, 0.15)
  sight.castShadow = true
  group.add(sight)

  // Grip underneath
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.06, 0.03),
    mat,
  )
  grip.position.set(0, -0.05, 0.1)
  grip.castShadow = true
  group.add(grip)

  // Shoulder pad
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.03, 0.1),
    mat,
  )
  pad.position.set(0, -0.04, -0.05)
  pad.castShadow = true
  group.add(pad)

  return group
}

/**
 * Machine Gun — bipod-mounted heavy weapon
 * Larger than rifle, with visible ammo box
 */
export function createMachineGun(color = TOY.armyGreen) {
  const mat = getPlasticMat(color)
  const metalMat = getPlasticMat(TOY.metalDark)
  const group = new THREE.Group()

  // Receiver body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.06, 0.4),
    metalMat,
  )
  body.position.z = 0.15
  body.castShadow = true
  group.add(body)

  // Barrel (long)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.012, 0.35, 6),
    metalMat,
  )
  barrel.rotation.x = Math.PI / 2
  barrel.position.z = 0.52
  barrel.castShadow = true
  group.add(barrel)

  // Stock
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.12),
    mat,
  )
  stock.position.set(0, 0, -0.1)
  stock.castShadow = true
  group.add(stock)

  // Ammo box (left side)
  const ammoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.05, 0.06),
    mat,
  )
  ammoBox.position.set(-0.05, -0.02, 0.1)
  ammoBox.castShadow = true
  group.add(ammoBox)

  // Bipod legs (two angled cylinders)
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4),
      metalMat,
    )
    leg.position.set(side * 0.04, -0.08, 0.35)
    leg.rotation.z = side * 0.3
    leg.rotation.x = 0.2
    leg.castShadow = true
    group.add(leg)
  }

  // Muzzle flash (hidden by default)
  const flashGeo = new THREE.SphereGeometry(0.03, 6, 6)
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat)
  muzzleFlash.position.set(0, 0, 0.7)
  muzzleFlash.visible = false
  group.add(muzzleFlash)

  return group
}

/**
 * Attach a weapon to a soldier's parts, replacing the default rifle.
 */
export function attachWeapon(parts, weaponType, color) {
  const rifleGrp = parts.rifleGrp
  // Remove all existing children
  while (rifleGrp.children.length > 0) {
    rifleGrp.remove(rifleGrp.children[0])
  }

  if (weaponType === 'rocketLauncher') {
    const launcher = createRocketLauncher(color)
    rifleGrp.add(launcher)
  } else if (weaponType === 'machineGun') {
    const mg = createMachineGun(color)
    rifleGrp.add(mg)
  } else {
    // Default rifle — recreate basic rifle geometry
    const mat = getPlasticMat(color)
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.07), mat)
    stock.position.set(0, 0.06, -0.04)
    rifleGrp.add(stock)
    const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.42), mat)
    rifleBody.position.set(0, 0, 0.16)
    rifleGrp.add(rifleBody)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.28, 6), mat,
    )
    barrel.position.set(0, 0, 0.50)
    barrel.rotation.x = Math.PI / 2
    rifleGrp.add(barrel)
    const flashGeo = new THREE.SphereGeometry(0.025, 6, 6)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const muzzle = new THREE.Mesh(flashGeo, flashMat)
    muzzle.position.set(0, 0, 0.62)
    muzzle.visible = false
    rifleGrp.add(muzzle)
    parts.muzzleFlash = muzzle
  }
}
