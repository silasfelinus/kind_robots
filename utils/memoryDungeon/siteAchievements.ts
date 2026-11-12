// /utils/memoryDungeon/siteAchievements.ts
//
// Memory Dungeon's live site achievements
// (utils/achievements/catalog/main/memory-dungeon.ts). A curated subset of
// the local Chronicle medals and reality completions maps to achievement
// codes. memoryWorldStore judges them only from what play just added: never
// from hydrate or a loaded checkpoint. The site-level `memory-master` code
// (Classic Match) stays where it is.

import { MEMORY_BRIAR_ACHIEVEMENTS } from './achievements'

/** Reality completions, in campaign order. */
export const MEMORY_COMPLETION_CODES: Readonly<Record<string, string>> = {
  e01: 'memory-dungeon-briar-cleared',
  e02: 'memory-dungeon-other-marches',
  e03: 'memory-dungeon-morrow-earth',
  e04: 'memory-dungeon-earth-decided',
  e05: 'memory-dungeon-scylla',
  e06: 'memory-dungeon-twin-tide',
}

/** One medal, or the first medal of a family, earns the code. */
const MEDAL_FAMILIES: readonly {
  code: string
  match: (id: string) => boolean
}[] = [
  { code: 'memory-dungeon-first-medal', match: () => true },
  {
    code: 'memory-dungeon-fourth-column',
    match: (id) => id === 'the-fourth-column',
  },
  {
    code: 'memory-dungeon-both-marches',
    match: (id) => /^e02-/.test(id),
  },
  {
    code: 'memory-dungeon-hearth-release',
    match: (id) => id.startsWith('e01-house-release-'),
  },
  {
    code: 'memory-dungeon-hearth-renew',
    match: (id) => id.startsWith('e01-house-renew-'),
  },
  {
    code: 'memory-dungeon-hearth-break',
    match: (id) => id.startsWith('e01-house-break-'),
  },
  {
    code: 'memory-dungeon-ordinary-kindness',
    match: (id) => /^e0[34]-/.test(id),
  },
  {
    code: 'memory-dungeon-hoshimori',
    match: (id) => id.startsWith('e07-vesper-'),
  },
  {
    code: 'memory-dungeon-cold-oven',
    match: (id) => id.startsWith('e07-cinder-'),
  },
  {
    code: 'memory-dungeon-hoshimori-night',
    match: (id) => id.startsWith('e08-night-'),
  },
]

const BRIAR_MEDAL_IDS = MEMORY_BRIAR_ACHIEVEMENTS.map((medal) => medal.id)
export const MEMORY_MEDAL_CASE = 24

/** Codes earned by the medals that were just added (before -> after). */
export function memoryMedalDeeds(
  before: readonly string[],
  after: readonly string[],
): string[] {
  const known = new Set(before)
  const added = after.filter((id) => !known.has(id))
  if (!added.length) return []
  const codes = MEDAL_FAMILIES.filter((family) => added.some(family.match)).map(
    (family) => family.code,
  )
  const has = new Set(after)
  if (
    added.some((id) => BRIAR_MEDAL_IDS.includes(id)) &&
    BRIAR_MEDAL_IDS.every((id) => has.has(id))
  )
    codes.push('memory-dungeon-briar-medals')
  if (before.length < MEMORY_MEDAL_CASE && after.length >= MEMORY_MEDAL_CASE)
    codes.push('memory-dungeon-medal-case')
  return codes
}

/** Codes earned by the realities that were just completed (before -> after). */
export function memoryCompletionDeeds(
  before: readonly string[],
  after: readonly string[],
): string[] {
  return after
    .filter((id) => !before.includes(id))
    .flatMap((id) => MEMORY_COMPLETION_CODES[id] ?? [])
}
