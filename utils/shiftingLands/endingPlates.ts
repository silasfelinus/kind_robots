// zuzu-shifting-lands ENDINGS-STANDARD-ROUND-1 (main-game standard item 6):
// every shared ending has its own painted plate, and none of them shows a
// protagonist, so the same picture fits whichever traveler walked the road.
// The displayed title decides the plate: a moral constellation's title first,
// then a V7 retitle, then the mark ending (endingsV6.ts, endingsV7.ts,
// endingsConstellationsV7.ts). Files ship under public/shifting-lands/endings/.
export const SHARED_ENDING_PLATES: Readonly<Record<string, string>> = {
  'A Well With No Lock': 'shared-well',
  'The Door Held Open': 'open-door',
  'The Toll Nobody Sees': 'masked-rule',
  'The Truth With Teeth': 'scarred-witness',
  'The Last Loaf': 'last-loaf',
  'The Book Left Open': 'unsealed-book',
  'The Bell That Answers': 'bell-again',
  'The Ford Without a Name': 'unmarked-ford',
  'The Crown Made of Salt': 'salt-crown',
  'The Road No One Names': 'unnamed-road',
  'The Debt Carried Open': 'debt-carried-open',
  'A Road Wide Enough for Everyone': 'road-wide-enough',
  'The Lantern Commons': 'commons',
  'The Book Nobody Owns': 'public-record',
  'A Ford With No Toll': 'wayfinders',
  'The Franchise of Hunger': 'tribute',
  'The Province of Empty Hands': 'coercion',
  'The Market of Silence': 'mixed-dominion',
  'A Bridge Without Forgiveness': 'restitution',
}

export const sharedEndingPlate = (
  title: string | null | undefined,
): string | null =>
  title && Object.hasOwn(SHARED_ENDING_PLATES, title)
    ? `/shifting-lands/endings/${SHARED_ENDING_PLATES[title]}.webp`
    : null

// The scrapbook's record of which shared endings this player has reached,
// across every journey, keyed by plate id. Versioned; the store keeps it in
// its own localStorage key and components only read the page below.
export const SHARED_ENDING_IDS: readonly string[] =
  Object.values(SHARED_ENDING_PLATES)
export const SHARED_ENDINGS_RECORD_VERSION = 1
export type SharedEndingsRecord = {
  version: 1
  found: string[]
}

export const sharedEndingId = (
  title: string | null | undefined,
): string | null =>
  title && Object.hasOwn(SHARED_ENDING_PLATES, title)
    ? SHARED_ENDING_PLATES[title]!
    : null

export const sharedEndingPlatePath = (id: string): string =>
  `/shifting-lands/endings/${id}.webp`

export const emptySharedEndingsRecord = (): SharedEndingsRecord => ({
  version: SHARED_ENDINGS_RECORD_VERSION,
  found: [],
})

// Reads a stored record, keeping only real endings, in catalog order.
// Anything unreadable becomes an empty record.
export function readSharedEndingsRecord(value: unknown): SharedEndingsRecord {
  const record = emptySharedEndingsRecord()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return record
  const saved = value as { version?: unknown; found?: unknown }
  if (
    saved.version !== SHARED_ENDINGS_RECORD_VERSION ||
    !Array.isArray(saved.found)
  )
    return record
  const ids = saved.found as unknown[]
  record.found = SHARED_ENDING_IDS.filter((id) => ids.includes(id))
  return record
}

// The record with one more ending found; the same object when nothing is new.
export function withSharedEnding(
  record: SharedEndingsRecord,
  id: string,
): SharedEndingsRecord {
  if (!SHARED_ENDING_IDS.includes(id) || record.found.includes(id))
    return record
  return {
    ...record,
    found: SHARED_ENDING_IDS.filter(
      (entry) => entry === id || record.found.includes(entry),
    ),
  }
}

export type SharedScrapbookPage = {
  found: number
  total: number
  endings: Array<{ id: string; title: string; found: boolean; plate: string }>
}

// Every shared ending in catalog order: X of 19 found.
export function sharedScrapbook(
  record: SharedEndingsRecord,
): SharedScrapbookPage {
  const endings = Object.entries(SHARED_ENDING_PLATES).map(([title, id]) => ({
    id,
    title,
    found: record.found.includes(id),
    plate: sharedEndingPlatePath(id),
  }))
  return {
    found: endings.filter((ending) => ending.found).length,
    total: endings.length,
    endings,
  }
}
