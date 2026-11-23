import type { RainbowMedal } from './rainbowLoadouts'
import {
  normalizeRainbowCallSign,
  rainbowPaintUnlocked,
  sanitizeRainbowPaints,
  type RainbowLivery,
} from './rainbowLivery'

export type RainbowHangarUpgrade = 'shield' | 'charge' | 'life'
type Act = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type RainbowHangar = {
  v: 1
  medals: Partial<Record<Act, RainbowMedal>>
  upgrades: RainbowHangarUpgrade[]
  /** The crew's call sign for this slot (t-044), '' or absent for none. */
  callSign?: string
  /** Each pilot's paint scheme (index into RAINBOW_PAINTS), by pilot 0-3. */
  paints?: number[]
}
export const RAINBOW_HANGAR_UPGRADES = [
  {
    id: 'shield',
    name: 'Pearl Hull',
    cost: 4,
    effect: 'Start with a fourth shield petal; pickups refill it.',
  },
  {
    id: 'charge',
    name: 'Star Battery',
    cost: 6,
    effect: 'Start each flight with 20 super charge.',
  },
  {
    id: 'life',
    name: 'Second Sunrise',
    cost: 8,
    effect: 'Gain one extra life per pilot, on every difficulty.',
  },
] as const

const ranks: Record<RainbowMedal, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
}
export function emptyRainbowHangar(): RainbowHangar {
  return { v: 1, medals: {}, upgrades: [] }
}

/** Corrupted or legacy local preferences must never crash the Hangar. */
export function readRainbowHangar(raw: unknown): RainbowHangar {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return emptyRainbowHangar()
  const input = raw as Record<string, unknown>
  if (input.v !== 1) return emptyRainbowHangar()
  const medals: RainbowHangar['medals'] = {}
  if (
    input.medals &&
    typeof input.medals === 'object' &&
    !Array.isArray(input.medals)
  ) {
    for (const [key, value] of Object.entries(input.medals)) {
      const act = Number(key)
      if (
        Number.isInteger(act) &&
        act >= 1 &&
        act <= 8 &&
        (value === 'bronze' || value === 'silver' || value === 'gold')
      )
        medals[act as Act] = value
    }
  }
  const upgrades: RainbowHangarUpgrade[] = []
  if (Array.isArray(input.upgrades))
    for (const item of RAINBOW_HANGAR_UPGRADES)
      if (input.upgrades.includes(item.id)) upgrades.push(item.id)
  const hangar: RainbowHangar = { v: 1, medals, upgrades }
  const callSign = normalizeRainbowCallSign(input.callSign)
  if (callSign) hangar.callSign = callSign
  // A paint stays only while its medals still unlock it.
  const paints = sanitizeRainbowPaints(input.paints).map((scheme) =>
    rainbowPaintUnlocked(medals, scheme) ? scheme : 0,
  )
  if (paints.some(Boolean)) hangar.paints = paints
  return hangar
}

/** Set (or, with '' or an unusable value, clear) the slot's call sign. */
export function withRainbowCallSign(
  hangar: RainbowHangar,
  raw: unknown,
): RainbowHangar {
  const callSign = normalizeRainbowCallSign(raw)
  const { callSign: _old, ...rest } = hangar
  return callSign ? { ...rest, callSign } : rest
}

/** Paint a pilot's ship with an unlocked scheme; a locked scheme or unknown pilot changes nothing. */
export function withRainbowPaint(
  hangar: RainbowHangar,
  pilot: number,
  scheme: number,
): RainbowHangar {
  if (!Number.isInteger(pilot) || pilot < 0 || pilot > 3) return hangar
  if (!rainbowPaintUnlocked(hangar.medals, scheme)) return hangar
  const paints = sanitizeRainbowPaints(hangar.paints)
  if (paints[pilot] === scheme) return hangar
  paints[pilot] = scheme
  return { ...hangar, paints }
}

/** The slot's livery for a flight. */
export function rainbowHangarLivery(hangar: RainbowHangar): RainbowLivery {
  return {
    callSign: hangar.callSign ?? '',
    paints: sanitizeRainbowPaints(hangar.paints),
  }
}

/** Replay a sea as often as you like; only your best medal adds petals. */
export function awardRainbowHangarMedals(
  hangar: RainbowHangar,
  save: unknown,
): RainbowHangar {
  if (!save || typeof save !== 'object') return hangar
  const medals = (save as { medals?: unknown }).medals
  if (!medals || typeof medals !== 'object' || Array.isArray(medals))
    return hangar
  const earned = { ...hangar.medals }
  let improved = false
  for (const [key, value] of Object.entries(
    medals as Record<string, unknown>,
  )) {
    const act = Number(key)
    if (!Number.isInteger(act) || act < 1 || act > 8) continue
    if (value !== 'bronze' && value !== 'silver' && value !== 'gold') continue
    const previous = earned[act as Act]
    if (ranks[value] <= (previous ? ranks[previous] : 0)) continue
    earned[act as Act] = value
    improved = true
  }
  return improved ? { ...hangar, medals: earned } : hangar
}
export function rainbowHangarBalance(hangar: RainbowHangar): number {
  const earned = Object.values(hangar.medals).reduce(
    (sum: number, medal) => sum + (medal ? ranks[medal] : 0),
    0,
  )
  const spent = RAINBOW_HANGAR_UPGRADES.reduce(
    (sum, item) => sum + (hangar.upgrades.includes(item.id) ? item.cost : 0),
    0,
  )
  return Math.max(0, earned - spent)
}
export function purchaseRainbowHangarUpgrade(
  hangar: RainbowHangar,
  upgrade: RainbowHangarUpgrade,
): RainbowHangar {
  const item = RAINBOW_HANGAR_UPGRADES.find((entry) => entry.id === upgrade)
  if (
    !item ||
    hangar.upgrades.includes(upgrade) ||
    rainbowHangarBalance(hangar) < item.cost
  )
    return hangar
  return { ...hangar, upgrades: [...hangar.upgrades, upgrade] }
}
export function rainbowHangarBonuses(hangar: RainbowHangar) {
  return {
    shield: hangar.upgrades.includes('shield'),
    charge: hangar.upgrades.includes('charge'),
    life: hangar.upgrades.includes('life'),
  }
}
