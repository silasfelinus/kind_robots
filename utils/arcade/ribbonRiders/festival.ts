// /utils/arcade/ribbonRiders/festival.ts
//
// The Lantern Festival Circuit's meta (conductor kr-arcade/t-075): festival tickets earned in play
// (never real money), the Paint Shop that opens between fairgrounds, the rider's kit it sells,
// and the save kept at the start of each fairground (utils/arcade/saves.ts holds it by slug).

import { FAIRGROUNDS, SECRET_FAIR_INDEX } from './fairgrounds'

export type Pattern = 'plain' | 'stripes' | 'hearts' | 'stars'
export const PATTERNS: readonly Pattern[] = [
  'plain',
  'stripes',
  'hearts',
  'stars',
]

/** What the Paint Shop has fitted to the rider. */
export type Kit = {
  /** Grip Tyres: no turn delay on ice. */
  grip: boolean
  /** Bigger Spool levels: each adds to the wrap size limit. */
  spool: number
  /** A Snip in hand at the start of every arena. */
  snip: boolean
  pattern: Pattern
  patterns: Pattern[]
}

export function newKit(): Kit {
  return {
    grip: false,
    spool: 0,
    snip: false,
    pattern: 'plain',
    patterns: ['plain'],
  }
}

export const SPOOL_STEP = 40
export const MAX_SPOOL = 2
export const MAX_LIVES = 6
export const MAX_TICKETS = 999

export type ShopId =
  | 'grip'
  | 'spool'
  | 'sidecar'
  | 'snip'
  | 'stripes'
  | 'hearts'
  | 'stars'
  | 'leave'

export type ShopItem = { id: ShopId; name: string; about: string; cost: number }

export const SHOP: readonly ShopItem[] = [
  { id: 'grip', name: 'GRIP TYRES', about: 'NO SLIDE ON ICE', cost: 8 },
  {
    id: 'spool',
    name: 'BIGGER SPOOL',
    about: `WRAPS UP TO ${SPOOL_STEP} CELLS BIGGER`,
    cost: 6,
  },
  { id: 'sidecar', name: 'SIDECAR', about: 'A SPARE RIDER', cost: 5 },
  {
    id: 'snip',
    name: 'STARTING SNIP',
    about: 'A SNIP IN HAND EVERY ARENA',
    cost: 6,
  },
  { id: 'stripes', name: 'STRIPES', about: 'A STRIPED RIBBON', cost: 3 },
  { id: 'hearts', name: 'HEARTS', about: 'A RIBBON OF HEARTS', cost: 3 },
  { id: 'stars', name: 'STARS', about: 'A RIBBON OF STARS', cost: 3 },
  { id: 'leave', name: 'ON TO THE NEXT FAIR', about: '', cost: 0 },
]

/** Why an item can't be bought now, or null when it can. */
export function shopBlock(
  item: ShopItem,
  kit: Kit,
  tickets: number,
  lives: number,
): string | null {
  if (item.id === 'leave') return null
  const pattern = PATTERNS.includes(item.id as Pattern)
  if (pattern && kit.patterns.includes(item.id as Pattern)) return 'WEAR IT'
  if (item.id === 'grip' && kit.grip) return 'FITTED'
  if (item.id === 'snip' && kit.snip) return 'FITTED'
  if (item.id === 'spool' && kit.spool >= MAX_SPOOL) return 'FULL'
  if (item.id === 'sidecar' && lives >= MAX_LIVES) return 'FULL'
  if (tickets < item.cost) return 'NEED TICKETS'
  return null
}

/** Buy (or, for an owned pattern, wear) an item: the tickets and lives left. */
export function buy(
  item: ShopItem,
  kit: Kit,
  tickets: number,
  lives: number,
): { ok: boolean; tickets: number; lives: number } {
  const pattern = PATTERNS.includes(item.id as Pattern)
    ? (item.id as Pattern)
    : null
  if (pattern && kit.patterns.includes(pattern)) {
    kit.pattern = kit.pattern === pattern ? 'plain' : pattern
    return { ok: true, tickets, lives }
  }
  if (shopBlock(item, kit, tickets, lives)) return { ok: false, tickets, lives }
  tickets -= item.cost
  switch (item.id) {
    case 'grip':
      kit.grip = true
      break
    case 'spool':
      kit.spool++
      break
    case 'snip':
      kit.snip = true
      break
    case 'sidecar':
      lives++
      break
    default:
      if (pattern) {
        kit.patterns.push(pattern)
        kit.pattern = pattern
      }
  }
  return { ok: true, tickets, lives }
}

/** Tickets for a clear: the arena's own, two for beating par, one for leaving the Lantern Kids be. */
export function clearTickets(
  base: number,
  underPar: boolean,
  kind: boolean,
): number {
  return base + (underPar ? 2 : 0) + (kind ? 1 : 0)
}

// --- the save ------------------------------------------------------------------------------------

/** A festival kept at a fairground's start (ArcadeGameInstance.save), handed back as `resume`. */
/** One lifetime bow per standard fairground, in stable campaign order. */
export function readGoldenBows(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return FAIRGROUNDS.filter((fair) => raw.includes(fair.id)).map(
    (fair) => fair.id,
  )
}

export function hasAllGoldenBows(bows: readonly string[]): boolean {
  return FAIRGROUNDS.every((fair) => bows.includes(fair.id))
}

export type FestivalSave = {
  v: 1
  /** The fairground to start (an index into FAIRGROUNDS). */
  fair: number
  score: number
  lives: number
  tickets: number
  kit: Kit
  /** The run it came from ended: picking it up again starts the score from zero. */
  continued: boolean
  /** All Grand Marshals beaten on this device. */
  champion: boolean
  /** A champion's harder, mirrored festival is in progress. */
  encore?: boolean
  goldenBows?: string[]
  trueChampion?: boolean
}

const isCount = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/** A stored save checked against this festival; null when it is not one we can use. */
export function readFestivalSave(raw: unknown): FestivalSave | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  if (v.v !== 1) return null
  if (!isCount(v.fair, SECRET_FAIR_INDEX)) return null
  const goldenBows = readGoldenBows(v.goldenBows)
  const unlocked = hasAllGoldenBows(goldenBows)
  if (v.fair === SECRET_FAIR_INDEX && !unlocked) return null
  if (v.trueChampion !== undefined && typeof v.trueChampion !== 'boolean')
    return null
  if (v.trueChampion && !unlocked) return null
  if (!isCount(v.score, 5_000_000)) return null
  if (!isCount(v.lives, MAX_LIVES) || v.lives < 1) return null
  if (!isCount(v.tickets, MAX_TICKETS)) return null
  if (typeof v.continued !== 'boolean' || typeof v.champion !== 'boolean')
    return null
  if (v.encore !== undefined && typeof v.encore !== 'boolean') return null
  if (v.encore && !v.champion) return null
  const k = v.kit as Record<string, unknown> | null
  if (!k || typeof k !== 'object') return null
  if (typeof k.grip !== 'boolean' || typeof k.snip !== 'boolean') return null
  if (!isCount(k.spool, MAX_SPOOL)) return null
  if (!Array.isArray(k.patterns)) return null
  const patterns = k.patterns.filter((p): p is Pattern =>
    PATTERNS.includes(p as Pattern),
  )
  if (!patterns.includes('plain')) patterns.unshift('plain')
  const pattern = PATTERNS.includes(k.pattern as Pattern)
    ? (k.pattern as Pattern)
    : 'plain'
  return {
    v: 1,
    fair: v.fair,
    score: v.score,
    lives: v.lives,
    tickets: v.tickets,
    continued: v.continued,
    champion: v.champion,
    ...(v.encore === true ? { encore: true } : {}),
    ...(goldenBows.length ? { goldenBows } : {}),
    ...(v.trueChampion === true ? { trueChampion: true } : {}),
    kit: {
      grip: k.grip,
      spool: k.spool,
      snip: k.snip,
      patterns: [...new Set(patterns)],
      pattern: patterns.includes(pattern) ? pattern : 'plain',
    },
  }
}
