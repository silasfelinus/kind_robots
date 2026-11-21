// utils/cthulhuquariumFloors.ts
//
// The descent (conductor cthulhuquarium/t-102). Charlotte's building has five
// floors, one per canon fish `tier` (seeded as Monster.depth). A floor opens
// when the player has known enough species, at the existing bestiary
// milestones, and only an open floor's species can be bought. Anything the
// player owns, or has ever owned, stays orderable whatever its floor, so a
// veteran tank never loses access to a fish.
//
// The intro already promises this ("the more of them you know, the more of
// the building opens up to you"), and DESIGN-BRIEF decision 4 asks for it:
// the common tiers stay recognizable so that the strangeness further down
// lands.
//
// Pure: no Vue, no Prisma. The server imports this file by relative path.

export type FloorNumber = 1 | 2 | 3 | 4 | 5

export interface CthulhuquariumFloor {
  floor: FloorNumber
  numeral: string
  name: string
  // Distinct species known (codex entries) needed to open this floor.
  opensAt: number
  // The bestiary milestone that opens it, so its Charlotte scene is the
  // floor's opening scene. Floor I is open from the start.
  milestoneId: string | null
  // The tank background handed over when the floor opens; it is also the
  // backdrop for that floor's scenes when they have no plate of their own.
  background: string
  // Monster.depth values that live on this floor.
  depths: readonly number[]
  // cthulhuquarium/t-105: coins for the key, sold by Charlotte once the floor's
  // threshold is met (conductor economy.yaml `floor_keys`, tuned with
  // simulate_descent.py). The Shop Floor needs no key.
  keyCost: number
}

// cthulhuquarium/t-105 (Silas 2026-11-21: "canon rarity + slower floors"): the
// price of each floor's key, chosen with conductor
// projects/cthulhuquarium/data/simulate_descent.py so a casual player (two
// 10-minute sessions a day) opens Below Stairs in the first session, the
// Flooded Wing within a day or two, the Conservatory within the week, and the
// Bottom of Things about day 10. Mirrors economy.yaml `floor_keys`.
// Silas 2026-11-21 halved the wait for the last key: at 400,000 a casual player
// waited ~8.5 days with nothing new to buy; at 200,000 it is ~4.
export const FLOOR_KEY_COSTS: Readonly<Record<2 | 3 | 4 | 5, number>> = {
  2: 150,
  3: 3_000,
  4: 30_000,
  5: 200_000,
}

export const CTHULHUQUARIUM_FLOORS: readonly CthulhuquariumFloor[] = [
  {
    floor: 1,
    numeral: 'I',
    name: 'The Shop Floor',
    opensAt: 0,
    milestoneId: null,
    background: 'parlour',
    depths: [1],
    keyCost: 0,
  },
  {
    floor: 2,
    numeral: 'II',
    name: 'Below Stairs',
    opensAt: 10,
    milestoneId: 'bestiary_10',
    background: 'sunken-pantry',
    depths: [2],
    keyCost: FLOOR_KEY_COSTS[2],
  },
  {
    floor: 3,
    numeral: 'III',
    name: 'The Flooded Wing',
    opensAt: 25,
    milestoneId: 'bestiary_25',
    background: 'sorting-office',
    depths: [3],
    keyCost: FLOOR_KEY_COSTS[3],
  },
  {
    floor: 4,
    numeral: 'IV',
    name: 'The Conservatory',
    opensAt: 50,
    milestoneId: 'bestiary_50',
    background: 'flooded-conservatory',
    depths: [4],
    keyCost: FLOOR_KEY_COSTS[4],
  },
  {
    floor: 5,
    numeral: 'V',
    name: 'The Bottom of Things',
    opensAt: 95,
    milestoneId: 'bestiary_95',
    background: 'abyssal-plain',
    depths: [5],
    keyCost: FLOOR_KEY_COSTS[5],
  },
]

// How many of the next floor's species the Market shows as silhouettes.
export const LOCKED_TEASER_COUNT = 3

export function floorInfo(floor: number): CthulhuquariumFloor {
  return (
    CTHULHUQUARIUM_FLOORS.find((entry) => entry.floor === floor) ??
    CTHULHUQUARIUM_FLOORS[0]!
  )
}

// The deepest open floor: every floor down to it has its threshold met and
// its key held (cthulhuquarium/t-105). Keys are bought in order, so the first
// floor missing either stops the descent. The Shop Floor is always open.
export function openFloorFor(
  collectedCount: number,
  keys: readonly number[] = [],
): FloorNumber {
  let open: FloorNumber = 1
  for (const entry of CTHULHUQUARIUM_FLOORS) {
    if (entry.floor === 1) continue
    if (collectedCount < entry.opensAt || !keys.includes(entry.floor)) break
    open = entry.floor
  }
  return open
}

// A species with no depth (not from the canon bible) lives on the Shop Floor.
export function floorForDepth(depth: number | null | undefined): FloorNumber {
  if (depth === null || depth === undefined || !Number.isFinite(depth)) {
    return 1
  }
  const match = CTHULHUQUARIUM_FLOORS.find((entry) =>
    entry.depths.includes(depth),
  )
  if (match) return match.floor
  return depth > 5 ? 5 : 1
}

// Every Monster.depth value on an open floor.
export function openDepthsFor(
  collectedCount: number,
  keys: readonly number[] = [],
): number[] {
  const open = openFloorFor(collectedCount, keys)
  return CTHULHUQUARIUM_FLOORS.filter((entry) => entry.floor <= open).flatMap(
    (entry) => [...entry.depths],
  )
}

export function canBuySpecies(args: {
  depth: number | null | undefined
  everCollected: boolean
  collectedCount: number
  keys?: readonly number[]
}): boolean {
  if (args.everCollected) return true
  return (
    floorForDepth(args.depth) <= openFloorFor(args.collectedCount, args.keys)
  )
}

export interface FloorStatus {
  floor: FloorNumber
  numeral: string
  name: string
  collectedCount: number
  next: {
    floor: FloorNumber
    numeral: string
    name: string
    threshold: number
    remaining: number
    // The key's price, and whether Charlotte will sell it yet (the threshold
    // is met). Once bought, this floor is open and `next` moves down.
    keyCost: number
    keyForSale: boolean
  } | null
}

export function floorStatus(
  collectedCount: number,
  keys: readonly number[] = [],
): FloorStatus {
  const open = floorInfo(openFloorFor(collectedCount, keys))
  const nextEntry = CTHULHUQUARIUM_FLOORS.find(
    (entry) => entry.floor === open.floor + 1,
  )
  return {
    floor: open.floor,
    numeral: open.numeral,
    name: open.name,
    collectedCount,
    next: nextEntry
      ? {
          floor: nextEntry.floor,
          numeral: nextEntry.numeral,
          name: nextEntry.name,
          threshold: nextEntry.opensAt,
          remaining: Math.max(0, nextEntry.opensAt - collectedCount),
          keyCost: nextEntry.keyCost,
          keyForSale: collectedCount >= nextEntry.opensAt,
        }
      : null,
  }
}

// Whether the key to `floor` may be bought now: the floor above it is open, the
// threshold is met, and it is not already held.
export function canBuyFloorKey(
  floor: number,
  collectedCount: number,
  keys: readonly number[],
): boolean {
  const entry = CTHULHUQUARIUM_FLOORS.find((item) => item.floor === floor)
  if (!entry || entry.floor === 1 || keys.includes(floor)) return false
  return (
    openFloorFor(collectedCount, keys) === floor - 1 &&
    collectedCount >= entry.opensAt
  )
}

// Which floor (if any) a bestiary milestone opens.
export function floorOpenedBy(milestoneId: string): FloorNumber | null {
  return (
    CTHULHUQUARIUM_FLOORS.find((entry) => entry.milestoneId === milestoneId)
      ?.floor ?? null
  )
}

// Portrait file stems to try, most specific first. A character can carry
// per-floor variants (`wilbur-stint-wince-f3`); a floor without its own
// variant borrows the nearest shallower one, then the base pose.
export function portraitCandidates(
  slug: string,
  pose: string,
  floor: number,
): string[] {
  const candidates: string[] = []
  const deepest = Math.min(Math.max(Math.floor(floor), 1), 5)
  for (let level = deepest; level >= 2; level--) {
    candidates.push(`${slug}-${pose}-f${level}`)
  }
  candidates.push(`${slug}-${pose}`)
  return candidates
}
