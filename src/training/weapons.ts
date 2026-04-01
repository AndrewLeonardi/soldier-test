import { WeaponDefinition } from '../types'

export const WEAPONS: WeaponDefinition[] = [
  {
    type: 'rifle',
    label: 'Rifle',
    description: 'Standard issue. Already trained.',
    icon: '\u{1F52B}',
    computeCost: 0,
    fitnessThreshold: 0,
    simDuration: 0,
    locked: false,
  },
  {
    type: 'rocketLauncher',
    label: 'Rocket Launcher',
    description: 'Shoulder-mounted explosive. Devastating but slow.',
    icon: '\u{1F680}',
    computeCost: 1,
    fitnessThreshold: 0.7,
    simDuration: 6,
    locked: false,
  },
  {
    type: 'machineGun',
    label: 'Machine Gun',
    description: 'Rapid fire suppression. Mows down groups.',
    icon: '\u{2694}',
    computeCost: 1,
    fitnessThreshold: 0.65,
    simDuration: 5,
    locked: true,
  },
]

export function getWeapon(type: string): WeaponDefinition | undefined {
  return WEAPONS.find(w => w.type === type)
}
