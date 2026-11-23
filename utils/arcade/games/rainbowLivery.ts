// /utils/arcade/games/rainbowLivery.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-044 (main-game standard: customizable characters,
// STANDARD-AUDIT-2026-11-12 B): a call sign the crew uses on comms and in the credits, and three paint schemes per
// ship, the later two unlocked by medals. Both live in a save slot's Hangar and stay on this device. Neither
// changes a hitbox or the seeded run; paint recolours only the ship's painting, never the seat glow, HUD colour or
// P# label, so seats stay as easy to tell apart as before.
import type { RainbowMedal } from './rainbowLoadouts'

export const RAINBOW_CALL_SIGN_MAX = 10

/** Three-letter words the leaderboard already refuses as initials; a call sign may not contain them as a word. */
const BLOCKED_WORDS = new Set([
  'ASS',
  'CUM',
  'FAG',
  'FUK',
  'FUC',
  'KKK',
  'NIG',
  'SEX',
  'TIT',
  'WTF',
  'XXX',
])

/**
 * A call sign as the comms box prints it: capitals, digits, single spaces and hyphens, at most ten characters.
 * Anything else is dropped; too short or a refused word gives '' (no call sign).
 */
export function normalizeRainbowCallSign(raw: unknown): string {
  const sign = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, RAINBOW_CALL_SIGN_MAX)
    .trim()
  if (sign.replace(/[ -]/g, '').length < 2) return ''
  if (sign.split(/[ -]/).some((word) => BLOCKED_WORDS.has(word))) return ''
  return sign
}

export type RainbowPaint = {
  id: 'factory' | 'tide' | 'nova'
  name: string
  /** A canvas/CSS filter applied to the ship's painting only. */
  filter: string
  /** Medals of at least this grade, across this slot's seas, unlock it. */
  unlock: { medal: RainbowMedal; count: number } | null
  note: string
}

export const RAINBOW_PAINTS: readonly RainbowPaint[] = [
  {
    id: 'factory',
    name: 'Factory',
    filter: 'none',
    unlock: null,
    note: 'As the Palace yards built her.',
  },
  {
    id: 'tide',
    name: 'Tide',
    filter: 'hue-rotate(150deg) saturate(1.15)',
    unlock: { medal: 'silver', count: 3 },
    note: 'Three silver medals or better.',
  },
  {
    id: 'nova',
    name: 'Nova',
    filter: 'hue-rotate(-55deg) saturate(1.45) brightness(1.05)',
    unlock: { medal: 'gold', count: 3 },
    note: 'Three gold medals.',
  },
]

const RANK: Record<RainbowMedal, number> = { bronze: 1, silver: 2, gold: 3 }

/** Whether a slot's best medals have unlocked paint scheme `scheme`. */
export function rainbowPaintUnlocked(
  medals: Partial<Record<number, RainbowMedal>>,
  scheme: number,
): boolean {
  const paint = RAINBOW_PAINTS[scheme]
  if (!paint) return false
  if (!paint.unlock) return true
  const { medal, count } = paint.unlock
  return (
    Object.values(medals).filter(
      (earned) => earned !== undefined && RANK[earned] >= RANK[medal],
    ).length >= count
  )
}

/** What a flight needs: the call sign, and each ship's paint scheme by pilot (0-3). */
export type RainbowLivery = { callSign: string; paints: number[] }

export function sanitizeRainbowPaints(raw: unknown): number[] {
  return [0, 1, 2, 3].map((pilot) => {
    const scheme = Array.isArray(raw) ? raw[pilot] : undefined
    return Number.isInteger(scheme) && RAINBOW_PAINTS[scheme as number]
      ? (scheme as number)
      : 0
  })
}

/** The filter for a pilot's ship under this livery ('none' for factory paint). */
export function rainbowShipFilter(
  livery: RainbowLivery | undefined,
  pilot: number,
): string {
  return RAINBOW_PAINTS[livery?.paints[pilot] ?? 0]?.filter ?? 'none'
}
