// /utils/zuzuLair/prefs.ts
//
// Zuzu's Lair options and the flash-assist rule. Pure, so the contract test can pin them.

import type { LairDifficulty } from './types'

export interface LairPrefs {
  difficulty: LairDifficulty
  flash: boolean | null
  buttons: boolean | null
  muted: boolean
}

export function sanitizeLairPrefs(value: unknown): LairPrefs {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<
    string,
    unknown
  >
  const tri = (v: unknown) => (typeof v === 'boolean' ? v : null)
  return {
    difficulty: raw.difficulty === 'classic' ? 'classic' : 'assist',
    flash: tri(raw.flash),
    buttons: tri(raw.buttons),
    muted: raw.muted === true,
  }
}

/** Flash assist defaults on for Assist and off for Classic; an explicit choice wins. */
export function flashEnabled(
  difficulty: LairDifficulty,
  flash: boolean | null,
): boolean {
  return flash ?? difficulty === 'assist'
}

/** Never strobe faster than 3 Hz (DESIGN-BRIEF): 2 Hz here. */
export const FLASH_HZ = 2

/**
 * Whether the hint is lit `sinceOpen` seconds after the window opened. Under reduced motion it
 * glows steadily; otherwise it pulses at FLASH_HZ.
 */
export function hintLit(sinceOpen: number, reducedMotion: boolean): boolean {
  if (sinceOpen < 0) return false
  if (reducedMotion) return true
  return Math.floor(sinceOpen * FLASH_HZ * 2) % 2 === 0
}
