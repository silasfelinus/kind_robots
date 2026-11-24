/** Device-only display preference. Never store account progression here. */
const KEY = 'kr-slime-city-clash-format-v1'
export type SavedClashFormat = 'solo' | 'alliance'

export function readClashFormatPreference(): SavedClashFormat | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'solo' || value === 'alliance' ? value : null
  } catch {
    return null
  }
}

export function writeClashFormatPreference(format: SavedClashFormat): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, format)
  } catch {
    // Storage can be disabled; the in-memory selection still works.
  }
}

const MOTION_KEY = 'kr-slime-city-reduced-motion-v1'

export function readReducedMotionPreference(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(MOTION_KEY)
    return value === 'on' ? true : value === 'off' ? false : null
  } catch {
    return null
  }
}

export function writeReducedMotionPreference(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOTION_KEY, on ? 'on' : 'off')
  } catch {
    // Storage can be disabled; the in-memory choice still works.
  }
}

const TEXT_KEY = 'kr-slime-city-large-text-v1'

export function readLargeTextPreference(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(TEXT_KEY)
    return value === 'on' ? true : value === 'off' ? false : null
  } catch {
    return null
  }
}

export function writeLargeTextPreference(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TEXT_KEY, on ? 'on' : 'off')
  } catch {
    // Storage can be disabled; the in-memory choice still works.
  }
}

const CONTRAST_KEY = 'kr-slime-city-high-contrast-v1'

export function readHighContrastPreference(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(CONTRAST_KEY)
    return value === 'on' ? true : value === 'off' ? false : null
  } catch {
    return null
  }
}

export function writeHighContrastPreference(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONTRAST_KEY, on ? 'on' : 'off')
  } catch {
    // Storage can be disabled; the in-memory choice still works.
  }
}

const SPEED_KEY = 'kr-slime-city-clash-speed-v1'
/** How long the automatic Clash beats (rival plays, alley strikes) linger. */
export type ClashSpeed = 'relaxed' | 'normal' | 'quick'
export const CLASH_SPEEDS: readonly ClashSpeed[] = [
  'relaxed',
  'normal',
  'quick',
]
/** Delay multiplier per speed; reduced motion caps it at the quick pace. */
export const CLASH_SPEED_PACE: Record<ClashSpeed, number> = {
  relaxed: 1.6,
  normal: 1,
  quick: 0.4,
}

export function readClashSpeedPreference(): ClashSpeed | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(SPEED_KEY)
    return value === 'relaxed' || value === 'normal' || value === 'quick'
      ? value
      : null
  } catch {
    return null
  }
}

export function writeClashSpeedPreference(speed: ClashSpeed): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SPEED_KEY, speed)
  } catch {
    // Storage can be disabled; the in-memory choice still works.
  }
}
