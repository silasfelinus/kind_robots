// /utils/comments/dreamLocations.ts
//
// New LOCATION Dreams authored to give Scenarios somewhere to happen.
//
// The fitness audit found 72 Scenarios with no Dream at all. Most of them are
// not missing a link -- they are missing a place. "The Fox Prince" wants an
// enchanted foxwood and there isn't one, so attaching it to the nearest party
// would be worse than leaving it empty.
//
// A location is created ONCE and then linked. The publisher is idempotent on
// slug: if a Dream with that slug already exists it is adopted rather than
// duplicated, so a re-run after a partial failure resumes instead of filling
// the catalog with near-identical worlds.
//
// House style, copied from the daily dream cycle rather than invented:
//   description  "Known for X  Local rule: Y  Best scene: Z"
//   flavorText   the local rule on its own
// The older curated locations (The Lantern Greenhouse, Gallowsun Junction) use
// a plain paragraph. Both read fine on a card; the three-part form is the
// current one and it gives a scenario author more to work with, because a rule
// somebody can break is a plot and a paragraph of atmosphere is not.

export type DreamLocation = {
  /** Unique, kebab-case, matches the catalog's existing slugs. */
  slug: string
  title: string
  /** "Known for ... Local rule: ... Best scene: ..." */
  description: string
  /** The local rule, alone. Shown on the card. */
  flavorText: string
  /** Scenarios this place is the setting for. */
  scenarioIds: number[]
  /** Why this place needed to exist, in the author's words. */
  why: string
}

export type DreamLocationBatch = {
  version: number
  batch: string
  releaseGate: string
  draftingModel?: string
  locations: DreamLocation[]
}

export const LOCATION_DESIGNER = 'fitness-pass'

export const MIN_DESCRIPTION_WORDS = 20
export const MAX_DESCRIPTION_WORDS = 90
export const MIN_FLAVOR_WORDS = 3
export const MAX_FLAVOR_WORDS = 20

/** The three parts the description has to carry, in order. */
export const DESCRIPTION_MARKERS = ['Known for', 'Local rule:', 'Best scene:'] as const

export function descriptionPartsInOrder(description: string): boolean {
  let cursor = -1
  for (const marker of DESCRIPTION_MARKERS) {
    const at = description.indexOf(marker)
    if (at <= cursor) return false
    cursor = at
  }
  return true
}

export function slugLooksValid(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 80
}
