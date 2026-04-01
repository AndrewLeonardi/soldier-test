import { create } from 'zustand'
import { GamePhase, Unit, PlaceableType, UNIT_STATS, WAVE_CONFIGS } from './types'

let _nextId = 1
const uid = () => `u${_nextId++}`

function makeUnit(overrides: Partial<Unit> & Pick<Unit, 'id' | 'type' | 'team' | 'position' | 'facingAngle'>): Unit {
  const stats = UNIT_STATS[overrides.type]
  return {
    health: stats.health,
    maxHealth: stats.health,
    state: 'idle',
    stateAge: 0,
    lastFireTime: -10,
    lastGrenadeTime: -10,
    targetId: null,
    velocity: [0, 0, 0],
    spinSpeed: 0,
    ...overrides,
  }
}

interface GameStore {
  phase: GamePhase
  round: number
  gold: number
  playerUnits: Unit[]
  enemies: Unit[]
  selectedPlacement: PlaceableType | null
  placementRotation: number
  result: 'victory' | 'defeat' | null
  bannerText: string | null

  selectPlacement: (type: PlaceableType | null) => void
  placeUnit: (type: PlaceableType, position: [number, number, number]) => void
  removeUnit: (id: string) => void
  rotatePlacement: () => void
  startBattle: () => void
  endBattle: (result: 'victory' | 'defeat') => void
  nextRound: () => void
  reset: () => void
  setBannerText: (text: string | null) => void
}

function spawnEnemies(round: number): Unit[] {
  const config = WAVE_CONFIGS[Math.min(round - 1, WAVE_CONFIGS.length - 1)]
  const enemies: Unit[] = []

  for (let i = 0; i < config.soldiers; i++) {
    const z = (i - (config.soldiers - 1) / 2) * 1.4
    enemies.push(makeUnit({
      id: uid(), type: 'soldier', team: 'tan',
      position: [7 + Math.random() * 1.5, 0, z],
      facingAngle: Math.PI / 2,
    }))
  }
  for (let i = 0; i < config.jeeps; i++) {
    const z = (i - (config.jeeps - 1) / 2) * 2.5
    enemies.push(makeUnit({
      id: uid(), type: 'jeep', team: 'tan',
      position: [9 + Math.random(), 0, z],
      facingAngle: Math.PI / 2,
    }))
  }
  for (let i = 0; i < config.tanks; i++) {
    enemies.push(makeUnit({
      id: uid(), type: 'tank', team: 'tan',
      position: [10, 0, i * 3],
      facingAngle: Math.PI / 2,
    }))
  }
  return enemies
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'planning',
  round: 1,
  gold: 500,
  playerUnits: [],
  enemies: spawnEnemies(1),
  selectedPlacement: null,
  placementRotation: 0,
  result: null,
  bannerText: 'ROUND 1',

  selectPlacement: (type) => set({ selectedPlacement: type }),
  rotatePlacement: () => set(s => ({
    placementRotation: (s.placementRotation + Math.PI / 2) % (Math.PI * 2),
  })),

  placeUnit: (type, position) => {
    const state = get()
    const cost = getCost(type)
    if (state.gold < cost) return

    // If placing a soldier near a tower, snap to the tower platform
    let finalPos: [number, number, number] = position
    if (type === 'soldier') {
      const tower = state.playerUnits.find(u =>
        u.type === 'tower' &&
        Math.abs(u.position[0] - position[0]) < 1.2 &&
        Math.abs(u.position[2] - position[2]) < 1.2
      )
      if (tower) {
        finalPos = [tower.position[0], 1.85, tower.position[2]]
      }
    }

    set({
      gold: state.gold - cost,
      playerUnits: [...state.playerUnits, makeUnit({
        id: uid(), type, team: 'green',
        position: finalPos,
        facingAngle: state.placementRotation,
      })],
    })
  },

  removeUnit: (id) => set(s => ({
    playerUnits: s.playerUnits.filter(u => u.id !== id),
    gold: s.gold + getCost(s.playerUnits.find(u => u.id === id)?.type ?? 'wall'),
  })),

  startBattle: () => set({ phase: 'battle', bannerText: 'BATTLE!', selectedPlacement: null }),

  endBattle: (result) => set(s => ({
    phase: 'result',
    result,
    bannerText: result === 'victory' ? 'VICTORY!' : 'DEFEAT!',
    gold: result === 'victory' ? s.gold + 200 + s.round * 50 : s.gold,
  })),

  nextRound: () => set(s => {
    const nextRound = s.round + 1
    const surviving = s.playerUnits
      .filter(u => u.health > 0)
      .map(u => ({ ...u, state: 'idle' as const, stateAge: 0, targetId: null, lastFireTime: -10, lastGrenadeTime: -10, velocity: [0, 0, 0] as [number, number, number], spinSpeed: 0 }))
    return {
      phase: 'planning', round: nextRound,
      playerUnits: surviving, enemies: spawnEnemies(nextRound),
      result: null, bannerText: `ROUND ${nextRound}`, placementRotation: 0,
    }
  }),

  reset: () => {
    _nextId = 1
    set({
      phase: 'planning', round: 1, gold: 500,
      playerUnits: [], enemies: spawnEnemies(1),
      selectedPlacement: null, placementRotation: 0,
      result: null, bannerText: 'ROUND 1',
    })
  },

  setBannerText: (text) => set({ bannerText: text }),
}))

function getCost(type: PlaceableType): number {
  const costs: Record<PlaceableType, number> = {
    soldier: 100, wall: 50, sandbag: 75, tower: 200, jeep: 250, tank: 400,
  }
  return costs[type] ?? 0
}
