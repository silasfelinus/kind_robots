export const SETTINGS_KEY = 'shifting-desks-settings-v1'

export const BADGE_TONES = ['classic', 'teal', 'plum', 'copper'] as const
export type BadgeTone = (typeof BADGE_TONES)[number]
export const PRONOUN_OPTIONS = [
  'unspecified',
  'they/them',
  'she/her',
  'he/him',
  'any pronouns',
] as const
export type EmployeePronouns = (typeof PRONOUN_OPTIONS)[number]

export type EmployeeIdentity = {
  name: string
  pronouns: EmployeePronouns
  badgeTone: BadgeTone
}

export const DEFAULT_EMPLOYEE_IDENTITY: EmployeeIdentity = {
  name: '',
  pronouns: 'unspecified',
  badgeTone: 'classic',
}

export function normalizeEmployeeIdentity(value: unknown): EmployeeIdentity {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const name =
    typeof raw.name === 'string'
      ? raw.name.trim().replace(/\\s+/g, ' ').slice(0, 32)
      : ''
  return {
    name,
    pronouns: PRONOUN_OPTIONS.includes(raw.pronouns as EmployeePronouns)
      ? (raw.pronouns as EmployeePronouns)
      : 'unspecified',
    badgeTone: BADGE_TONES.includes(raw.badgeTone as BadgeTone)
      ? (raw.badgeTone as BadgeTone)
      : 'classic',
  }
}

export function isEmployeeIdentity(value: unknown): value is EmployeeIdentity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const raw = value as Record<string, unknown>
  return (
    typeof raw.name === 'string' &&
    raw.name.length <= 32 &&
    PRONOUN_OPTIONS.includes(raw.pronouns as EmployeePronouns) &&
    BADGE_TONES.includes(raw.badgeTone as BadgeTone)
  )
}

export function badgeToneClass(tone: BadgeTone): string {
  switch (tone) {
    case 'teal':
      return 'sepia-[.35] hue-rotate-[125deg] saturate-150'
    case 'plum':
      return 'sepia-[.25] hue-rotate-[255deg] saturate-150'
    case 'copper':
      return 'sepia-[.55] saturate-150'
    default:
      return ''
  }
}

export const DEFAULT_DESK_SETTINGS = {
  textSize: 'normal',
  readingSpeed: 'normal',
  motion: 'system',
  contrast: 'standard',
  musicVolume: 50,
  soundVolume: 65,
} as const

export type DeskSettings = {
  textSize: 'normal' | 'large' | 'extra-large'
  readingSpeed: 'normal' | 'fast' | 'instant'
  motion: 'system' | 'reduced'
  contrast: 'standard' | 'high'
  musicVolume: number
  soundVolume: number
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback
}

export function parseDeskSettings(value: unknown): DeskSettings {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return {
    textSize: oneOf(raw.textSize, ['normal', 'large', 'extra-large'], 'normal'),
    readingSpeed: oneOf(raw.readingSpeed, ['normal', 'fast', 'instant'], 'normal'),
    motion: oneOf(raw.motion, ['system', 'reduced'], 'system'),
    contrast: oneOf(raw.contrast, ['standard', 'high'], 'standard'),
    musicVolume: volume(raw.musicVolume, DEFAULT_DESK_SETTINGS.musicVolume),
    soundVolume: volume(raw.soundVolume, DEFAULT_DESK_SETTINGS.soundVolume),
  }
}
