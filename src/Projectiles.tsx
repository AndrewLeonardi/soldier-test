import {
  Vector3, Group, Mesh, SphereGeometry, CylinderGeometry, BoxGeometry,
  MeshBasicMaterial, MeshStandardMaterial
} from 'three'

interface Bullet {
  position: Vector3
  velocity: Vector3
  age: number
  alive: boolean
  mesh: Group
  team: 'green' | 'tan'
}

interface Grenade {
  position: Vector3
  velocity: Vector3
  age: number
  alive: boolean
  exploded: boolean
  mesh: Mesh
  team: 'green' | 'tan'
}

interface Debris {
  position: Vector3
  velocity: Vector3
  rotation: Vector3
  rotSpeed: Vector3
  age: number
  alive: boolean
  mesh: Mesh
  scale: number
}

const BULLET_SPEED = 8
const BULLET_LIFETIME = 2.5
const GRENADE_FUSE = 1.2
const GRENADE_LIFETIME = 3.0
const GRENADE_BLAST_RADIUS = 3.0
const GRAVITY = -12
const DEBRIS_LIFETIME = 2.5

// Shared geometry — bullets
const bulletBodyGeo = new CylinderGeometry(0.02, 0.02, 0.15, 6)
const bulletGreenMat = new MeshBasicMaterial({ color: 0xffcc00 })
const bulletTanMat = new MeshBasicMaterial({ color: 0xff6600 })
const bulletGlowGeo = new SphereGeometry(0.04, 8, 8)
const bulletGlowGreenMat = new MeshBasicMaterial({ color: 0xffff66, transparent: true, opacity: 0.6 })
const bulletGlowTanMat = new MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.6 })
const bulletTrailGeo = new CylinderGeometry(0.008, 0.002, 0.3, 4)
const bulletTrailGreenMat = new MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 })
const bulletTrailTanMat = new MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.4 })

// Shared geometry — grenades
const grenadeGeo = new SphereGeometry(0.07, 8, 8)
const grenadeGreenMat = new MeshStandardMaterial({ color: 0x3d5a2f, roughness: 0.4 })
const grenadeTanMat = new MeshStandardMaterial({ color: 0x6b5a2f, roughness: 0.4 })

// Shared geometry — debris & effects
const debrisGeos = [
  new BoxGeometry(0.06, 0.06, 0.06),
  new SphereGeometry(0.04, 4, 4),
  new BoxGeometry(0.08, 0.04, 0.05),
]
const sparkGeo = new SphereGeometry(0.06, 6, 6)
const sparkMat = new MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 })
const flashGeo = new SphereGeometry(0.5, 8, 8)
const flashMat = new MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })

export interface HitInfo {
  targetId: string
  damage: number
  position: Vector3
  // Blast knockback direction + force (for launching soldiers)
  launchVel?: Vector3
}

export interface WallBlockRef {
  worldPos: Vector3
  velocity: Vector3
  alive: boolean
  mesh: Mesh
}

export class ProjectileManager {
  bullets: Bullet[] = []
  grenades: Grenade[] = []
  debris: Debris[] = []
  group: Group
  hits: HitInfo[] = []

  constructor() {
    this.group = new Group()
  }

  spawnBullet(origin: Vector3, direction: Vector3, team: 'green' | 'tan') {
    const isGreen = team === 'green'
    const grp = new Group()
    const body = new Mesh(bulletBodyGeo, isGreen ? bulletGreenMat : bulletTanMat)
    grp.add(body)
    const glow = new Mesh(bulletGlowGeo, isGreen ? bulletGlowGreenMat : bulletGlowTanMat)
    grp.add(glow)
    const trail = new Mesh(bulletTrailGeo, isGreen ? bulletTrailGreenMat : bulletTrailTanMat)
    trail.position.z = -0.2
    grp.add(trail)

    grp.position.copy(origin)
    grp.lookAt(origin.clone().add(direction))
    body.rotateX(Math.PI / 2)
    trail.rotateX(Math.PI / 2)

    this.group.add(grp)
    this.bullets.push({
      position: origin.clone(),
      velocity: direction.clone().normalize().multiplyScalar(BULLET_SPEED),
      age: 0,
      alive: true,
      mesh: grp,
      team,
    })
  }

  spawnGrenade(origin: Vector3, direction: Vector3, team: 'green' | 'tan') {
    const isGreen = team === 'green'
    const mesh = new Mesh(grenadeGeo, (isGreen ? grenadeGreenMat : grenadeTanMat).clone())
    mesh.position.copy(origin)
    this.group.add(mesh)

    // Arced throw toward target
    const vel = direction.clone().normalize().multiplyScalar(6)
    vel.y = 5.5

    this.grenades.push({
      position: origin.clone(),
      velocity: vel,
      age: 0,
      alive: true,
      exploded: false,
      mesh,
      team,
    })
  }

  private spawnImpactSpark(pos: Vector3) {
    const spark = new Mesh(sparkGeo, sparkMat.clone())
    spark.position.copy(pos)
    this.group.add(spark)
    this.spawnDebris(pos, 3, 0x4a6b3a)
    setTimeout(() => { this.group.remove(spark) }, 150)
  }

  spawnExplosionFlash(pos: Vector3) {
    const flash = new Mesh(flashGeo, flashMat.clone())
    flash.position.copy(pos)
    flash.position.y += 0.3
    this.group.add(flash)
    this.spawnDebris(pos, 12, 0x4a6b3a)
    let age = 0
    const animate = () => {
      age += 0.016
      if (age > 0.3) { this.group.remove(flash); return }
      flash.scale.setScalar(1 + age * 3)
      ;(flash.material as MeshBasicMaterial).opacity = 0.9 * (1 - age / 0.3)
      requestAnimationFrame(animate)
    }
    animate()
  }

  private spawnDebris(pos: Vector3, count: number, color: number) {
    const mat = new MeshStandardMaterial({ color, roughness: 0.5 })
    for (let i = 0; i < count; i++) {
      const geo = debrisGeos[Math.floor(Math.random() * debrisGeos.length)]
      const mesh = new Mesh(geo, mat)
      mesh.position.copy(pos)
      const scale = 0.5 + Math.random() * 1.5
      mesh.scale.setScalar(scale)
      this.group.add(mesh)
      this.debris.push({
        position: pos.clone(),
        velocity: new Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 5,
          (Math.random() - 0.5) * 6,
        ),
        rotation: new Vector3(),
        rotSpeed: new Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
        ),
        age: 0,
        alive: true,
        mesh,
        scale,
      })
    }
  }

  update(
    delta: number,
    targets: Array<{ id: string; position: Vector3; team: 'green' | 'tan'; radius: number; alive: boolean }>,
    wallBlocks?: WallBlockRef[],
  ) {
    this.hits = []

    // ── Bullets ──
    for (const b of this.bullets) {
      if (!b.alive) continue
      b.age += delta
      if (b.age > BULLET_LIFETIME) {
        b.alive = false
        this.group.remove(b.mesh)
        continue
      }

      b.velocity.y -= 0.5 * delta
      b.position.add(b.velocity.clone().multiplyScalar(delta))
      b.mesh.position.copy(b.position)
      b.mesh.lookAt(b.position.clone().add(b.velocity))

      if (b.position.y < 0) {
        b.alive = false
        this.group.remove(b.mesh)
        this.spawnImpactSpark(b.position.clone())
        continue
      }

      // Hit unit targets
      for (const target of targets) {
        if (!target.alive) continue
        if (target.team === b.team) continue
        const dist = b.position.distanceTo(target.position)
        if (dist < target.radius) {
          b.alive = false
          this.group.remove(b.mesh)
          this.hits.push({ targetId: target.id, damage: 25, position: b.position.clone() })
          this.spawnImpactSpark(b.position.clone())
          break
        }
      }

      // Hit wall blocks
      if (b.alive && wallBlocks) {
        for (const block of wallBlocks) {
          if (!block.alive) continue
          const dist = b.position.distanceTo(block.worldPos)
          if (dist < 0.25) {
            b.alive = false
            this.group.remove(b.mesh)
            block.velocity.add(b.velocity.clone().multiplyScalar(0.08))
            block.velocity.y += 2.0
            this.spawnImpactSpark(b.position.clone())
            break
          }
        }
      }
    }

    // ── Grenades ──
    for (const g of this.grenades) {
      if (!g.alive) continue
      g.age += delta

      if (!g.exploded) {
        // Physics: gravity arc
        g.velocity.y += GRAVITY * delta
        g.position.add(g.velocity.clone().multiplyScalar(delta))

        // Bounce off ground
        if (g.position.y < 0.07) {
          g.position.y = 0.07
          g.velocity.y *= -0.3
          g.velocity.x *= 0.6
          g.velocity.z *= 0.6
        }

        g.mesh.position.copy(g.position)
        g.mesh.rotation.x += delta * 8
        g.mesh.rotation.z += delta * 5

        // Fuse timer → EXPLODE
        if (g.age > GRENADE_FUSE) {
          g.exploded = true
          this.group.remove(g.mesh)
          this.spawnExplosionFlash(g.position)

          // Damage + knockback units in blast radius
          for (const target of targets) {
            if (!target.alive) continue
            if (target.team === g.team) continue
            const dist = g.position.distanceTo(target.position)
            if (dist < GRENADE_BLAST_RADIUS) {
              const force = (GRENADE_BLAST_RADIUS - dist) / GRENADE_BLAST_RADIUS
              const damage = Math.round(60 * force)
              const launchDir = target.position.clone().sub(g.position).normalize()
              launchDir.y = 0.4 + force * 0.3
              const launchVel = launchDir.multiplyScalar(force * 6)
              this.hits.push({ targetId: target.id, damage, position: g.position.clone(), launchVel })
            }
          }

          // Blast wall blocks
          if (wallBlocks) {
            for (const block of wallBlocks) {
              if (!block.alive) continue
              const dist = g.position.distanceTo(block.worldPos)
              if (dist < GRENADE_BLAST_RADIUS) {
                const force = (GRENADE_BLAST_RADIUS - dist) / GRENADE_BLAST_RADIUS
                const dir = block.worldPos.clone().sub(g.position).normalize()
                dir.y += 0.5
                block.velocity.add(dir.multiplyScalar(force * 14))
                block.velocity.y += force * 10
              }
            }
          }
        }
      }

      if (g.age > GRENADE_LIFETIME + 2) {
        g.alive = false
      }
    }

    // ── Debris ──
    for (const d of this.debris) {
      if (!d.alive) continue
      d.age += delta
      if (d.age > DEBRIS_LIFETIME) {
        d.alive = false
        this.group.remove(d.mesh)
        continue
      }
      d.velocity.y += GRAVITY * delta * 0.8
      d.position.add(d.velocity.clone().multiplyScalar(delta))
      if (d.position.y < 0.03) {
        d.position.y = 0.03
        d.velocity.y *= -0.15
        d.velocity.x *= 0.5
        d.velocity.z *= 0.5
      }
      d.rotation.add(d.rotSpeed.clone().multiplyScalar(delta))
      d.mesh.position.copy(d.position)
      d.mesh.rotation.set(d.rotation.x, d.rotation.y, d.rotation.z)
      const fade = 1 - d.age / DEBRIS_LIFETIME
      d.mesh.scale.setScalar(d.scale * Math.max(0.1, fade))
    }

    // Cleanup
    this.bullets = this.bullets.filter(b => b.alive)
    this.grenades = this.grenades.filter(g => g.alive)
    this.debris = this.debris.filter(d => d.alive)
  }
}
