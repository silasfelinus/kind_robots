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
  },
  {
    floor: 2,
    numeral: 'II',
    name: 'Below Stairs',
    opensAt: 10,
    milestoneId: 'bestiary_10',
    background: 'sunken-pantry',
    depths: [2],
  },
  {
    floor: 3,
    numeral: 'III',
    name: 'The Flooded Wing',
    opensAt: 25,
    milestoneId: 'bestiary_25',
    background: 'sorting-office',
    depths: [3],
  },
  {
    floor: 4,
    numeral: 'IV',
    name: 'The Conservatory',
    opensAt: 50,
    milestoneId: 'bestiary_50',
    background: 'flooded-conservatory',
    depths: [4],
  },
  {
    floor: 5,
    numeral: 'V',
    name: 'The Bottom of Things',
    opensAt: 95,
    milestoneId: 'bestiary_95',
    background: 'abyssal-plain',
    depths: [5],
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

// The deepest open floor for a player who knows `collectedCount` species.
export function openFloorFor(collectedCount: number): FloorNumber {
  let open: FloorNumber = 1
  for (const entry of CTHULHUQUARIUM_FLOORS) {
    if (collectedCount >= entry.opensAt) open = entry.floor
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
export function openDepthsFor(collectedCount: number): number[] {
  const open = openFloorFor(collectedCount)
  return CTHULHUQUARIUM_FLOORS.filter((entry) => entry.floor <= open).flatMap(
    (entry) => [...entry.depths],
  )
}

export function canBuySpecies(args: {
  depth: number | null | undefined
  everCollected: boolean
  collectedCount: number
}): boolean {
  if (args.everCollected) return true
  return floorForDepth(args.depth) <= openFloorFor(args.collectedCount)
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
  } | null
}

export function floorStatus(collectedCount: number): FloorStatus {
  const open = floorInfo(openFloorFor(collectedCount))
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
        }
      : null,
  }
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
