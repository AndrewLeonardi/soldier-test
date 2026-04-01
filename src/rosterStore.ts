import { create } from 'zustand'
import { SoldierProfile, WeaponType, TrainedBrain } from './types'

let _nextId = 100

interface RosterStore {
  soldiers: SoldierProfile[]
  gold: number // shared gold pool (also used in battle store)

  recruitSoldier: (name: string) => void
  trainSkill: (soldierId: string, weapon: WeaponType, brain: TrainedBrain) => void
  equipWeapon: (soldierId: string, weapon: WeaponType) => void
  injureSoldier: (soldierId: string, currentRound: number) => void
  healSoldiers: (currentRound: number) => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
}

const STARTER_SOLDIERS: SoldierProfile[] = [
  {
    id: 's1',
    name: 'PVT Rico',
    skills: { rifle: { weaponType: 'rifle', weights: [], fitness: 1, generation: 0 } },
    equippedWeapon: 'rifle',
    status: 'ready',
    injuredUntilRound: 0,
    battlesWon: 0,
    kills: 0,
  },
  {
    id: 's2',
    name: 'PVT Ace',
    skills: { rifle: { weaponType: 'rifle', weights: [], fitness: 1, generation: 0 } },
    equippedWeapon: 'rifle',
    status: 'ready',
    injuredUntilRound: 0,
    battlesWon: 0,
    kills: 0,
  },
  {
    id: 's3',
    name: 'PVT Duke',
    skills: { rifle: { weaponType: 'rifle', weights: [], fitness: 1, generation: 0 } },
    equippedWeapon: 'rifle',
    status: 'ready',
    injuredUntilRound: 0,
    battlesWon: 0,
    kills: 0,
  },
]

const SOLDIER_NAMES = [
  'SGT Max', 'CPL Storm', 'PVT Flash', 'PVT Blaze', 'CPL Hawk',
  'PVT Ghost', 'PVT Tank', 'SGT Wolf', 'CPL Shadow', 'PVT Viper',
  'PVT Reaper', 'CPL Frost', 'PVT Razor', 'SGT Iron', 'PVT Cobra',
]

function loadRoster(): { soldiers: SoldierProfile[]; gold: number } {
  try {
    const saved = localStorage.getItem('soldierRoster')
    if (saved) {
      const data = JSON.parse(saved)
      return { soldiers: data.soldiers ?? STARTER_SOLDIERS, gold: data.gold ?? 10000 }
    }
  } catch { /* ignore */ }
  return { soldiers: [...STARTER_SOLDIERS], gold: 10000 }
}

function saveRoster(soldiers: SoldierProfile[], gold: number) {
  try {
    localStorage.setItem('soldierRoster', JSON.stringify({ soldiers, gold }))
  } catch { /* ignore */ }
}

export const useRosterStore = create<RosterStore>((set, get) => {
  const initial = loadRoster()
  return {
    soldiers: initial.soldiers,
    gold: initial.gold,

    recruitSoldier: (name?: string) => {
      const state = get()
      if (state.gold < 200) return
      const id = `s${_nextId++}`
      const soldierName = name || SOLDIER_NAMES[Math.floor(Math.random() * SOLDIER_NAMES.length)]
      const newSoldier: SoldierProfile = {
        id,
        name: soldierName,
        skills: { rifle: { weaponType: 'rifle', weights: [], fitness: 1, generation: 0 } },
        equippedWeapon: 'rifle',
        status: 'ready',
        injuredUntilRound: 0,
        battlesWon: 0,
        kills: 0,
      }
      const soldiers = [...state.soldiers, newSoldier]
      const gold = state.gold - 200
      saveRoster(soldiers, gold)
      set({ soldiers, gold })
    },

    trainSkill: (soldierId, weapon, brain) => {
      const state = get()
      const soldiers = state.soldiers.map(s =>
        s.id === soldierId
          ? { ...s, skills: { ...s.skills, [weapon]: brain } }
          : s
      )
      saveRoster(soldiers, state.gold)
      set({ soldiers })
    },

    equipWeapon: (soldierId, weapon) => {
      const state = get()
      const soldiers = state.soldiers.map(s =>
        s.id === soldierId ? { ...s, equippedWeapon: weapon } : s
      )
      saveRoster(soldiers, state.gold)
      set({ soldiers })
    },

    injureSoldier: (soldierId, currentRound) => {
      const state = get()
      const soldiers = state.soldiers.map(s =>
        s.id === soldierId
          ? { ...s, status: 'injured' as const, injuredUntilRound: currentRound + 2 }
          : s
      )
      saveRoster(soldiers, state.gold)
      set({ soldiers })
    },

    healSoldiers: (currentRound) => {
      const state = get()
      const soldiers = state.soldiers.map(s =>
        s.status === 'injured' && currentRound >= s.injuredUntilRound
          ? { ...s, status: 'ready' as const }
          : s
      )
      saveRoster(soldiers, state.gold)
      set({ soldiers })
    },

    addGold: (amount) => {
      const state = get()
      const gold = state.gold + amount
      saveRoster(state.soldiers, gold)
      set({ gold })
    },

    spendGold: (amount) => {
      const state = get()
      if (state.gold < amount) return false
      const gold = state.gold - amount
      saveRoster(state.soldiers, gold)
      set({ gold })
      return true
    },
  }
})
