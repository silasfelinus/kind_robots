// /utils/arcade/games/glitchGardenShed.ts
//
// The Compost Shed (conductor kr-arcade/t-089): between gardens the gardening bot spends the
// petals it earned in play (one per bloom, one per apple caught, a handful per objective) on its
// kit. Petals are never real money. The wider nozzle, the second beam and the snail siren are kept
// for the run; the prism flower (in a lane you pick) and the extra can are planted at the start of
// the next garden.

export type Kit = {
  /** The beam fixes a little either side of where it flies. */
  nozzle: boolean
  /** Two beams on screen at once. */
  twin: boolean
  /** A chime and an arrow when a slime snail sets out. */
  siren: boolean
  /** A pre-bloomed prism flower for the next garden, in this lane (column). */
  prismLane: number | null
  /** Extra sprinkler cans for the next garden. */
  cans: number
}

export const NEW_KIT: Kit = {
  nozzle: false,
  twin: false,
  siren: false,
  prismLane: null,
  cans: 0,
}

export type ShedItemId = 'nozzle' | 'twin' | 'prism' | 'can' | 'siren' | 'done'

export type ShedItem = {
  id: ShedItemId
  name: string
  line: string
  cost: number
}

export const SHED_ITEMS: readonly ShedItem[] = [
  { id: 'nozzle', name: 'WIDER NOZZLE', line: 'FIX A LITTLE WIDER', cost: 80 },
  { id: 'twin', name: 'SECOND BEAM', line: 'TWO BEAMS AT ONCE', cost: 140 },
  {
    id: 'prism',
    name: 'PRISM FLOWER',
    line: '< > PICK ITS LANE',
    cost: 30,
  },
  { id: 'can', name: 'SPRINKLER CAN', line: 'ONE MORE CAN', cost: 25 },
  { id: 'siren', name: 'SNAIL SIREN', line: 'CHIMES AT A SNAIL', cost: 50 },
  { id: 'done', name: 'BACK TO THE GARDEN', line: '', cost: 0 },
]

/** Extra cans a run can carry into one garden. */
export const MAX_KIT_CANS = 2
/** How long the shed stays open before the bot heads out on its own (ticks). */
export const SHED_TICKS = 1200

/** Why `item` can't be bought now, or null when it can. */
export function cannotBuy(
  item: ShedItem,
  kit: Kit,
  petals: number,
): string | null {
  if (item.id === 'done') return null
  if (item.id === 'nozzle' && kit.nozzle) return 'ALREADY FITTED'
  if (item.id === 'twin' && kit.twin) return 'ALREADY FITTED'
  if (item.id === 'siren' && kit.siren) return 'ALREADY FITTED'
  if (item.id === 'prism' && kit.prismLane !== null) return 'ONE AT A TIME'
  if (item.id === 'can' && kit.cans >= MAX_KIT_CANS) return 'THE CART IS FULL'
  if (petals < item.cost) return `NEEDS ${item.cost} PETALS`
  return null
}

/** The kit and petals after buying `item` (the prism flower goes in `lane`). */
export function buy(
  item: ShedItem,
  kit: Kit,
  petals: number,
  lane: number,
): { kit: Kit; petals: number } {
  if (cannotBuy(item, kit, petals) !== null || item.id === 'done')
    return { kit, petals }
  const next: Kit = { ...kit }
  if (item.id === 'nozzle') next.nozzle = true
  if (item.id === 'twin') next.twin = true
  if (item.id === 'siren') next.siren = true
  if (item.id === 'prism') next.prismLane = lane
  if (item.id === 'can') next.cans = kit.cans + 1
  return { kit: next, petals: petals - item.cost }
}
