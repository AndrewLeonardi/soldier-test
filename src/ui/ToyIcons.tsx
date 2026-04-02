import { WeaponType, PlaceableType } from '../types'

interface IconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

// ── Unit Icons ──────────────────────────────────────────

export function SoldierIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Classic toy soldier: standing with rifle */}
      <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1.5 5C9.7 7 9 7.7 9 8.5V13l-2.5 5.5a1 1 0 0 0 .9 1.5h1.2l1.4-4h4l1.4 4h1.2a1 1 0 0 0 .9-1.5L15 13V8.5C15 7.7 14.3 7 13.5 7h-3zm.5 2h2v3h-2V9zm5 1.5l1.5-1.5.7.7L16.5 11.5l-.5-.5v-.5zm-8 0V11l-.5.5L5.8 9.7l.7-.7L8 10.5z" />
      {/* Base plate */}
      <rect x="8" y="20" width="8" height="2" rx="1" />
    </svg>
  )
}

export function RifleIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M3 11h14l2-2h2v2h-1l1 2h-2l-1-1H4v2l-1 1V10l1 1h-.001z" />
      <rect x="6" y="13" width="2" height="3" rx="0.5" />
      <rect x="15" y="9" width="4" height="1" rx="0.5" />
    </svg>
  )
}

export function RocketLauncherIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Tube */}
      <rect x="2" y="10" width="16" height="4" rx="2" />
      {/* Front cone */}
      <path d="M18 10l3 2-3 2v-4z" />
      {/* Rear flare */}
      <path d="M2 9v6l-1-1v-4l1-1z" />
      {/* Grip */}
      <rect x="10" y="14" width="3" height="4" rx="0.5" />
      {/* Sight */}
      <rect x="13" y="7" width="2" height="3" rx="0.5" />
    </svg>
  )
}

export function MachineGunIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Body */}
      <rect x="3" y="10" width="14" height="3" rx="1" />
      {/* Barrel */}
      <rect x="17" y="10.5" width="5" height="2" rx="1" />
      {/* Stock */}
      <path d="M3 10l-1 1v3l1 1v-5z" />
      {/* Ammo box */}
      <rect x="8" y="13" width="4" height="3" rx="0.5" />
      {/* Bipod legs */}
      <line x1="16" y1="13" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="13" x2="12" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Handle */}
      <rect x="6" y="7" width="3" height="3" rx="0.5" />
    </svg>
  )
}

export function TankIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Hull */}
      <rect x="2" y="12" width="20" height="5" rx="2" />
      {/* Turret */}
      <rect x="8" y="8" width="8" height="4" rx="2" />
      {/* Barrel */}
      <rect x="16" y="9" width="7" height="2" rx="1" />
      {/* Tracks */}
      <rect x="1" y="17" width="22" height="3" rx="1.5" />
      <circle cx="4" cy="18.5" r="1.2" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="8" cy="18.5" r="1.2" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="18.5" r="1.2" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="16" cy="18.5" r="1.2" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="20" cy="18.5" r="1.2" fill="none" stroke={color} strokeWidth="0.8" />
    </svg>
  )
}

// ── Defense Icons ────────────────────────────────────────

export function WallIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Brick rows */}
      <rect x="2" y="4" width="9" height="4" rx="0.5" />
      <rect x="13" y="4" width="9" height="4" rx="0.5" />
      <rect x="2" y="10" width="6" height="4" rx="0.5" />
      <rect x="10" y="10" width="6" height="4" rx="0.5" />
      <rect x="18" y="10" width="4" height="4" rx="0.5" />
      <rect x="2" y="16" width="9" height="4" rx="0.5" />
      <rect x="13" y="16" width="9" height="4" rx="0.5" />
    </svg>
  )
}

export function SandbagIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Bottom row */}
      <ellipse cx="6" cy="18" rx="5" ry="3" />
      <ellipse cx="18" cy="18" rx="5" ry="3" />
      {/* Top row */}
      <ellipse cx="12" cy="13" rx="5" ry="3" />
      {/* Top single */}
      <ellipse cx="12" cy="8" rx="4" ry="2.5" />
    </svg>
  )
}

export function TowerIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Legs */}
      <line x1="6" y1="22" x2="8" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="22" x2="16" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Cross braces */}
      <line x1="7" y1="16" x2="17" y2="16" stroke={color} strokeWidth="1.5" />
      {/* Platform */}
      <rect x="5" y="8" width="14" height="2" rx="0.5" />
      {/* Railing */}
      <rect x="5" y="4" width="1.5" height="4" rx="0.5" />
      <rect x="17.5" y="4" width="1.5" height="4" rx="0.5" />
      <rect x="5" y="4" width="14" height="1.5" rx="0.5" />
      {/* Ladder */}
      <line x1="19" y1="22" x2="18" y2="10" stroke={color} strokeWidth="1" />
      <line x1="21" y1="22" x2="20" y2="10" stroke={color} strokeWidth="1" />
      <line x1="19.1" y1="14" x2="20.9" y2="14" stroke={color} strokeWidth="0.8" />
      <line x1="19.2" y1="17" x2="20.8" y2="17" stroke={color} strokeWidth="0.8" />
      <line x1="19.3" y1="20" x2="20.7" y2="20" stroke={color} strokeWidth="0.8" />
    </svg>
  )
}

// ── UI Icons ────────────────────────────────────────────

export function RotateIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 3 21 9 15 9" fill={color} />
    </svg>
  )
}

export function SquadIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <circle cx="8" cy="5" r="2.5" />
      <path d="M5 10h6a1 1 0 0 1 1 1v4H4v-4a1 1 0 0 1 1-1z" />
      <circle cx="16" cy="5" r="2.5" />
      <path d="M13 10h6a1 1 0 0 1 1 1v4h-8v-4a1 1 0 0 1 1-1z" />
      <rect x="3" y="16" width="18" height="2" rx="1" />
    </svg>
  )
}

export function TrainIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={style}>
      {/* Crosshair / target */}
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill={color} />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export function CheckIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="4 12 9 17 20 6" />
    </svg>
  )
}

export function BackArrowIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="10 18 4 12 10 6" />
    </svg>
  )
}

export function BattleIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      {/* Crossed bayonets / swords */}
      <path d="M5 2l6 10-6 10h2l7-9 7 9h2l-6-10 6-10h-2l-7 9-7-9H5z" />
    </svg>
  )
}

export function StarIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function RetryIcon({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
      <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
    </svg>
  )
}

// ── Lookup Maps ─────────────────────────────────────────

export const WEAPON_ICON_COMPONENTS: Record<WeaponType, React.FC<IconProps>> = {
  rifle: RifleIcon,
  rocketLauncher: RocketLauncherIcon,
  machineGun: MachineGunIcon,
  tank: TankIcon,
}

export const DEFENSE_ICON_COMPONENTS: Record<string, React.FC<IconProps>> = {
  soldier: SoldierIcon,
  wall: WallIcon,
  sandbag: SandbagIcon,
  tower: TowerIcon,
}

export function PlacementIcon({ type, size = 24 }: { type: PlaceableType; size?: number }) {
  const Component = DEFENSE_ICON_COMPONENTS[type] || SoldierIcon
  return <Component size={size} />
}
