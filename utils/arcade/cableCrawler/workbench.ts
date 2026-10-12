// /utils/arcade/cableCrawler/workbench.ts
//
// The Workbench (conductor kr-arcade/t-065, CABINETS.md section 8, "Power and meta"): it opens
// between components. Copper earned in play (never real money) buys an extra cable, a longer
// surge reach, insulation to start with, a new cable colour, or a golden-byte finder for the next
// component. The rules here are pure so the test can check every purchase.

/** Copper for each thing done in play. */
export const COPPER = {
  reboot: 1,
  maze: 2,
  byte: 3,
  boss: 6,
  saver: 3,
} as const

export type BenchItemId =
  'done' | 'cable' | 'reach' | 'insulation' | 'colour' | 'finder'

export type BenchItem = {
  id: BenchItemId
  name: string
  /** One line saying what it does. */
  note: string
  cost: number
}

export const BENCH_ITEMS: readonly BenchItem[] = [
  {
    id: 'done',
    name: 'BACK TO WORK',
    note: 'ON TO THE NEXT COMPONENT',
    cost: 0,
  },
  {
    id: 'cable',
    name: 'EXTRA CABLE',
    note: 'ONE MORE CABLE TO PLAY',
    cost: 10,
  },
  {
    id: 'reach',
    name: 'LONG SURGE',
    note: 'SURGES ARC ONE CELL FURTHER',
    cost: 16,
  },
  {
    id: 'insulation',
    name: 'INSULATION',
    note: 'ONE FREE PASS OVER YOURSELF',
    cost: 5,
  },
  {
    id: 'colour',
    name: 'CABLE COLOUR',
    note: 'A NEW COAT FOR YOUR CABLE',
    cost: 3,
  },
  {
    id: 'finder',
    name: 'BYTE FINDER',
    note: 'NEXT GOLDEN BYTES SHOW AT ONCE',
    cost: 6,
  },
]

/** What the Workbench can change. */
export type Kit = {
  copper: number
  lives: number
  /** Extra surge reach bought (0 or 1). */
  reach: number
  insulation: number
  colour: number
  /** The byte finder, bought for the next component. */
  finder: boolean
}

export const MAX_LIVES = 9
export const MAX_INSULATION = 3
export const CABLE_COLOURS = 4

/** Why an item can't be bought now, or null if it can. */
export function cannotBuy(kit: Kit, id: BenchItemId): string | null {
  const item = BENCH_ITEMS.find((i) => i.id === id)!
  if (id === 'done') return null
  if (id === 'cable' && kit.lives >= MAX_LIVES) return 'CABLES FULL'
  if (id === 'reach' && kit.reach >= 1) return 'ALREADY LONG'
  if (id === 'insulation' && kit.insulation >= MAX_INSULATION)
    return 'INSULATION FULL'
  if (id === 'finder' && kit.finder) return 'ALREADY BOUGHT'
  if (kit.copper < item.cost) return 'NOT ENOUGH COPPER'
  return null
}

/** The kit after buying `id` (unchanged if it can't be bought). */
export function buy(kit: Kit, id: BenchItemId): Kit {
  if (id === 'done' || cannotBuy(kit, id)) return kit
  const item = BENCH_ITEMS.find((i) => i.id === id)!
  const next = { ...kit, copper: kit.copper - item.cost }
  if (id === 'cable') next.lives++
  if (id === 'reach') next.reach = 1
  if (id === 'insulation') next.insulation++
  if (id === 'colour') next.colour = (kit.colour + 1) % CABLE_COLOURS
  if (id === 'finder') next.finder = true
  return next
}
