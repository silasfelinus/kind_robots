// utils/rulerHooked/console.ts
//
// Presentation data for the kingdom-decay console (ruler-hooked/t-054): the
// meter labels, the five-tab deck, the region names the map uses, and the
// reign-health tier the rainbow chrome takes. Pure and framework-free.

import { AXIS_KEYS } from '~/types/ruler-hooked'
import type { AxisKey, KingdomHealth, RegionKey } from '~/types/ruler-hooked'

/** Player-facing names. Joy reads as "Hearts", as in the 2026-11-05 mockups. */
export const AXIS_LABEL: Record<AxisKey, string> = {
  joy: 'Hearts',
  nature: 'Nature',
  prosperity: 'Prosperity',
  order: 'Order',
  treasury: 'Treasury',
}

/** The four left-hand meters; treasury is the coin capsule in the HUD. */
export const METER_AXES: readonly AxisKey[] = [
  'joy',
  'nature',
  'prosperity',
  'order',
]

export const AXIS_ICON: Record<AxisKey | 'coins', string> = {
  joy: 'kind-icon:heart',
  nature: 'kind-icon:tree',
  prosperity: 'kind-icon:money',
  order: 'kind-icon:crown',
  treasury: 'kind-icon:coin',
  coins: 'kind-icon:coin',
}

export type ConsoleTab = 'lake' | 'map' | 'court' | 'gear' | 'fishopedia'

export const CONSOLE_TABS: readonly {
  id: ConsoleTab
  label: string
  icon: string
}[] = [
  { id: 'lake', label: 'Lake', icon: 'kind-icon:fish' },
  { id: 'map', label: 'Map', icon: 'kind-icon:map' },
  { id: 'court', label: 'Court', icon: 'kind-icon:crown' },
  { id: 'gear', label: 'Gear', icon: 'kind-icon:bag' },
  { id: 'fishopedia', label: 'Fishopedia', icon: 'kind-icon:book-open' },
]

/** The tab `step` places away from `current`, wrapping at both ends. */
export function stepTab(current: ConsoleTab, step: number): ConsoleTab {
  const ids = CONSOLE_TABS.map((t) => t.id)
  const at = Math.max(0, ids.indexOf(current))
  const n = ids.length
  return ids[(((at + step) % n) + n) % n] ?? 'lake'
}

export type ReignTier = 'pristine' | 'strained' | 'rotten'

/** Mean of every kingdom axis, 0..100. */
export function reignMean(health: KingdomHealth): number {
  const total = AXIS_KEYS.reduce((sum, key) => sum + (health[key] ?? 0), 0)
  return total / AXIS_KEYS.length
}

/** Any one of these alone rots the chronicle, whatever the mean says. */
export const ROT_FLOOR = 20
export const TYRANNY_ORDER = 85
export const TYRANNY_JOY = 30

/**
 * The chronicle's condition. A new reign (every axis 50) opens pristine; a
 * reign that sinks below 50 on average strains the book, and below 30 it rots.
 * A collapse the mean would hide also rots it: Hearts (joy) or Nature at or
 * below 20, or tyranny (Order at or above 85 while Hearts are at or below 30),
 * so the mockups' Order 93 / Hearts 24 reign reads as rotten.
 */
export function reignTier(health: KingdomHealth): ReignTier {
  const joy = health.joy ?? 0
  const nature = health.nature ?? 0
  const order = health.order ?? 0
  if (joy <= ROT_FLOOR || nature <= ROT_FLOOR) return 'rotten'
  if (order >= TYRANNY_ORDER && joy <= TYRANNY_JOY) return 'rotten'
  const mean = reignMean(health)
  if (mean >= 50) return 'pristine'
  if (mean >= 30) return 'strained'
  return 'rotten'
}

export const REGION_NAME: Partial<Record<RegionKey, string>> = {
  sky: 'The Sky',
  far_shore: 'The Far Shore',
  treeline: 'The Wildwood',
  village_edge: 'Willowbrook Village',
  castle_grounds: 'Castle Grounds',
  lake: 'Castle Lake',
  near_bank: 'The Near Bank',
}

/** Where each region's name sits on the painted map, in % of the frame. */
export const REGION_PIN: Partial<Record<RegionKey, { x: number; y: number }>> =
  {
    sky: { x: 50, y: 9 },
    far_shore: { x: 22, y: 31 },
    treeline: { x: 76, y: 27 },
    village_edge: { x: 18, y: 47 },
    castle_grounds: { x: 74, y: 45 },
    lake: { x: 50, y: 64 },
    near_bank: { x: 34, y: 87 },
  }

/**
 * What each region's state looks like from the throne, as [label, line]. The
 * atlas copy from the 2026-11-05 console overhaul, plus the t-054 decay rungs
 * (sky, lake and near bank) and the tyranny pins. Unknown states fall back to
 * the region's first entry.
 */
export const REGION_COPY: Partial<
  Record<RegionKey, Record<string, [label: string, line: string]>>
> = {
  sky: {
    open: ['Open', 'A wide blue sky. Even the gulls seem cheerful.'],
    overcast: ['Overcast', 'A low grey lid. People have stopped looking up.'],
    choked: ['Smoke-choked', 'Soot hangs over everything. Nobody sings.'],
  },
  lake: {
    clear: [
      'Your fishing grounds',
      'Clear, cold and stubbornly full of opinions with fins.',
    ],
    murky: ['Murky', 'Brown water and a smell the fish complain about.'],
    poisoned: [
      'Poisoned',
      'An oily sheen and floating bones. The fish that are left are angry.',
    ],
  },
  near_bank: {
    grassy: ['Grassy', 'Soft grass to the water. A good place for a stool.'],
    trampled: ['Trampled', 'Mud and boot prints. The reeds are thinning.'],
    dead: ['Dead reeds', 'Grey stalks and old bones at the waterline.'],
  },
  far_shore: {
    pristine: ['Pristine', 'Reeds, herons and nobody in a hurry.'],
    farmed: [
      'Farmed',
      'Neat fields to the waterline. The herons are negotiating.',
    ],
    industrial: [
      'Industrial',
      'Chimneys where the reeds were. The fish have noticed.',
    ],
    gallows: [
      'Gallows',
      'Gallows on the shore, raised by your order. Nobody fishes there now.',
    ],
  },
  treeline: {
    wild: ['Wild', 'Old trees, older moss, druids who know your name.'],
    tended: ['Tended', 'Paths and pruning. The wood allows it.'],
    logged: ['Logged', 'Stumps and sawdust. The druids are writing letters.'],
    overbuilt: [
      'Overbuilt',
      'Towers where the forest stood. Vex is delighted.',
    ],
  },
  village_edge: {
    hamlet: ['Hamlet', 'Six cottages, one inn, everyone related.'],
    township: [
      'Township',
      'A market square and a surprising number of bakeries.',
    ],
    boomtown: [
      'Boomtown',
      'Scaffolding everywhere. Nobody remembers the old inn.',
    ],
    garrisoned: [
      'Garrisoned',
      'Pikes at every corner and a curfew bell. The bakeries are shut.',
    ],
  },
  castle_grounds: {
    humble: ['Humble', 'Patched banners and a very loyal goat.'],
    flourishing: [
      'Flourishing',
      'Gardens, fountains, freshly painted crenellations.',
    ],
    gaudy: ['Gaudy', 'Gold leaf on the gold leaf.'],
  },
}

/** The [label, line] for a region in a state, falling back to its first entry. */
export function regionCopy(
  region: RegionKey,
  state: string | undefined,
): [label: string, line: string] {
  const copy = REGION_COPY[region] ?? {}
  return (
    (state ? copy[state] : undefined) ??
    Object.values(copy)[0] ?? [state ?? '', '']
  )
}
