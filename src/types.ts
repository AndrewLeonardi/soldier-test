export type GamePhase = 'planning' | 'battle' | 'result'
export type Team = 'green' | 'tan'
export type UnitType = 'soldier' | 'jeep' | 'tank'
export type DefenseType = 'wall' | 'sandbag' | 'tower'
export type PlaceableType = UnitType | DefenseType
export type UnitState = 'idle' | 'walking' | 'rushing' | 'firing' | 'throwing' | 'hit' | 'dead'

export interface Unit {
  id: string
  type: PlaceableType
  team: Team
  position: [number, number, number]
  velocity: [number, number, number]
  health: number
  maxHealth: number
  state: UnitState
  stateAge: number
  lastFireTime: number
  lastGrenadeTime: number
  targetId: string | null
  facingAngle: number
  spinSpeed: number // tumble spin when launched
}

export interface WaveConfig {
  soldiers: number
  jeeps: number
  tanks: number
}

export interface PlacementOption {
  type: PlaceableType
  label: string
  cost: number
  icon: string
  description: string
}

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  { type: 'soldier',  label: 'Soldier',   cost: 100, icon: '\u{1F482}', description: 'Infantry unit' },
  { type: 'wall',     label: 'Wall',      cost: 50,  icon: '\u{1F9F1}', description: 'Blocks enemies' },
  { type: 'sandbag',  label: 'Sandbags',  cost: 75,  icon: '\u{1F4E6}', description: 'Low cover' },
  { type: 'tower',    label: 'Tower',     cost: 200, icon: '\u{1F3F0}', description: 'Elevated post' },
]

export const WAVE_CONFIGS: WaveConfig[] = [
  { soldiers: 5,  jeeps: 0, tanks: 0 },
  { soldiers: 8,  jeeps: 0, tanks: 0 },
  { soldiers: 6,  jeeps: 1, tanks: 0 },
  { soldiers: 10, jeeps: 2, tanks: 0 },
  { soldiers: 12, jeeps: 1, tanks: 1 },
]

export const UNIT_STATS: Record<PlaceableType, { health: number; speed: number; range: number; damage: number; fireRate: number }> = {
  soldier: { health: 100, speed: 1.5, range: 5,   damage: 25,  fireRate: 1.5 },
  jeep:    { health: 150, speed: 3.0, range: 4,   damage: 20,  fireRate: 1.0 },
  tank:    { health: 400, speed: 0.8, range: 7,   damage: 80,  fireRate: 3.0 },
  wall:    { health: 200, speed: 0,   range: 0,   damage: 0,   fireRate: 0   },
  sandbag: { health: 120, speed: 0,   range: 0,   damage: 0,   fireRate: 0   },
  tower:   { health: 300, speed: 0,   range: 0,   damage: 0,   fireRate: 0   },
}
