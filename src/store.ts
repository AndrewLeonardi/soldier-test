import { create } from 'zustand'
import { GamePhase, Unit, PlaceableType, UNIT_STATS, WAVE_CONFIGS, WEAPON_COSTS, WeaponType } from './types'
import { useRosterStore } from './rosterStore'

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
  playerUnits: Unit[]
  enemies: Unit[]
  selectedPlacement: string | null // can be PlaceableType or "soldier:s1"
  placementRotation: number
  result: 'victory' | 'defeat' | null
  bannerText: string | null
  placedSoldierIds: string[] // track which roster soldiers are placed

  selectPlacement: (type: string | null) => void
  placeUnit: (type: string, position: [number, number, number]) => void
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
    enemies.push(makeUnit({ id: uid(), type: 'soldier', team: 'tan', position: [7 + Math.random() * 1.5, 0, z], facingAngle: Math.PI / 2 }))
  }
  for (let i = 0; i < config.jeeps; i++) {
    const z = (i - (config.jeeps - 1) / 2) * 2.5
    enemies.push(makeUnit({ id: uid(), type: 'jeep', team: 'tan', position: [9 + Math.random(), 0, z], facingAngle: Math.PI / 2 }))
  }
  for (let i = 0; i < config.tanks; i++) {
    enemies.push(makeUnit({ id: uid(), type: 'tank', team: 'tan', position: [10, 0, i * 3], facingAngle: Math.PI / 2 }))
  }
  return enemies
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'planning',
  round: 1,
  playerUnits: [],
  enemies: spawnEnemies(1),
  selectedPlacement: null,
  placementRotation: 0,
  result: null,
  bannerText: 'ROUND 1',
  placedSoldierIds: [],

  selectPlacement: (type) => set({ selectedPlacement: type }),
  rotatePlacement: () => set(s => ({
    placementRotation: (s.placementRotation + Math.PI / 2) % (Math.PI * 2),
  })),

  placeUnit: (type, position) => {
    const state = get()
    const roster = useRosterStore.getState()

    // Parse soldier placement: "soldier:s1" or defense type
    let isSoldierFromRoster = type.startsWith('soldier:')
    let soldierId: string | undefined
    let weaponType: WeaponType = 'rifle'
    let placeableType: PlaceableType = 'soldier'
    let cost = 0

    if (isSoldierFromRoster) {
      soldierId = type.split(':')[1]
      const profile = roster.soldiers.find(s => s.id === soldierId)
      if (!profile) return
      weaponType = profile.equippedWeapon
      cost = WEAPON_COSTS[weaponType]
      placeableType = 'soldier'
    } else {
      placeableType = type as PlaceableType
      cost = getCost(placeableType)
    }

    if (!roster.spendGold(cost)) return

    // Tower snap
    let finalPos: [number, number, number] = position
    if (placeableType === 'soldier') {
      const tower = state.playerUnits.find(u =>
        u.type === 'tower' &&
        Math.abs(u.position[0] - position[0]) < 1.2 &&
        Math.abs(u.position[2] - position[2]) < 1.2
      )
      if (tower) finalPos = [tower.position[0], 1.85, tower.position[2]]
    }

    const unit = makeUnit({
      id: uid(),
      type: placeableType,
      team: 'green',
      position: finalPos,
      facingAngle: state.placementRotation,
      profileId: soldierId,
      equippedWeapon: isSoldierFromRoster ? weaponType : undefined,
    })

    set({
      playerUnits: [...state.playerUnits, unit],
      placedSoldierIds: soldierId
        ? [...state.placedSoldierIds, soldierId]
        : state.placedSoldierIds,
    })
  },

  removeUnit: (id) => set(s => {
    const unit = s.playerUnits.find(u => u.id === id)
    if (unit) {
      const cost = unit.profileId ? WEAPON_COSTS[unit.equippedWeapon ?? 'rifle'] : getCost(unit.type)
      useRosterStore.getState().addGold(cost)
    }
    return {
      playerUnits: s.playerUnits.filter(u => u.id !== id),
      placedSoldierIds: unit?.profileId
        ? s.placedSoldierIds.filter(sid => sid !== unit.profileId)
        : s.placedSoldierIds,
    }
  }),

  startBattle: () => set({ phase: 'battle', bannerText: 'BATTLE!', selectedPlacement: null }),

  endBattle: (result) => {
    const state = get()
    if (result === 'victory') {
      useRosterStore.getState().addGold(200 + state.round * 50)
    }
    set({ phase: 'result', result, bannerText: result === 'victory' ? 'VICTORY!' : 'DEFEAT!' })
  },

  nextRound: () => set(s => {
    const nextRound = s.round + 1
    useRosterStore.getState().healSoldiers(nextRound)
    const surviving = s.playerUnits
      .filter(u => u.health > 0)
      .map(u => ({ ...u, state: 'idle' as const, stateAge: 0, targetId: null, lastFireTime: -10, lastGrenadeTime: -10, velocity: [0, 0, 0] as [number, number, number], spinSpeed: 0 }))
    return {
      phase: 'planning', round: nextRound,
      playerUnits: surviving, enemies: spawnEnemies(nextRound),
      result: null, bannerText: `ROUND ${nextRound}`, placementRotation: 0,
      placedSoldierIds: surviving.filter(u => u.profileId).map(u => u.profileId!),
    }
  }),

  reset: () => {
    _nextId = 1
    set({
      phase: 'planning', round: 1,
      playerUnits: [], enemies: spawnEnemies(1),
      selectedPlacement: null, placementRotation: 0,
      result: null, bannerText: 'ROUND 1',
      placedSoldierIds: [],
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
