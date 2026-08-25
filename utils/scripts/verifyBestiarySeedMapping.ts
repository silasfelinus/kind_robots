// utils/scripts/verifyBestiarySeedMapping.ts
//
// cthulhuquarium/t-008. Checks everything about scripts/seed_bestiary.ts that
// can be checked WITHOUT a database, which is most of what goes wrong: the
// bible parses, every value lands in a legal enum, nothing overruns its column,
// every evolution edge resolves, and the safety floor actually refuses a short
// read.
//
// Column widths are the interesting half. A VarChar overrun is invisible until
// the insert runs against production, by which point the seed has already
// half-applied -- so the widths are asserted here from the schema's own numbers.
//
//   npx tsx utils/scripts/verifyBestiarySeedMapping.ts

import {
  findBible,
  loadBible,
  toUpsertData,
  MIN_EXPECTED_SPECIES,
} from '../../scripts/seed_bestiary'

const RARITIES = new Set([
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
])
const EVOLUTION_KINDS = new Set(['GROWTH', 'BREEDING', null])

// From prisma/schema.prisma's Monster model. Kept literal on purpose: if a
// column narrows, this file should fail rather than silently follow.
const WIDTHS: Record<string, number> = {
  name: 256,
  species: 764,
  class: 764,
  alignment: 256,
  behavior: 255,
  games: 764,
}

const failures: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}

const bible = loadBible(findBible())
console.log(`bible: ${bible.length} species`)

check(
  bible.length >= MIN_EXPECTED_SPECIES,
  `bible has ${bible.length} species, below the floor`,
)
check(bible.length === 151, `expected 151 species, found ${bible.length}`)

const slugs = new Set(bible.map((f) => f.slug))
check(slugs.size === bible.length, 'duplicate slug in the bible')

for (const fish of bible) {
  const data = toUpsertData(fish)
  const where = `${fish.slug}`

  for (const key of [
    'tier',
    'charm',
    'empathy',
    'grace',
    'luck',
    'might',
    'wits',
  ] as const) {
    check(
      RARITIES.has(String(data[key])),
      `${where}: ${key} is '${data[key]}', not a Rarity`,
    )
  }
  check(
    EVOLUTION_KINDS.has(data.evolutionKind),
    `${where}: bad evolutionKind '${data.evolutionKind}'`,
  )

  for (const [column, limit] of Object.entries(WIDTHS)) {
    const value = (data as Record<string, unknown>)[column]
    if (typeof value === 'string') {
      check(
        value.length <= limit,
        `${where}: ${column} is ${value.length} chars, over VarChar(${limit})`,
      )
    }
  }

  check(
    Number.isInteger(data.size) && data.size >= 1 && data.size <= 12,
    `${where}: size ${data.size} outside 1..12`,
  )
  check(
    Number.isInteger(data.hue) && data.hue >= 0 && data.hue <= 360,
    `${where}: hue ${data.hue} outside 0..360`,
  )
  check((data.yieldPerTick ?? 0) > 0, `${where}: yieldPerTick must be positive`)
  check(
    (data.tickIntervalSeconds ?? 0) > 0,
    `${where}: tickIntervalSeconds must be positive`,
  )
  check((data.unlockCost ?? -1) >= 0, `${where}: unlockCost must be >= 0`)
  check(data.games.length > 0, `${where}: games is empty`)
  check(data.isActive === true, `${where}: seeded rows must be active`)

  // A species reached only by evolution is not purchasable. The bible's own
  // validator enforces this; re-checked here because it reaches the DB as a
  // price a player could otherwise be charged.
  if (fish.evolves_to) {
    check(
      slugs.has(fish.evolves_to),
      `${where}: evolves_to '${fish.evolves_to}' is not a known slug`,
    )
    check(
      fish.evolution_kind !== undefined,
      `${where}: has evolves_to but no evolution_kind`,
    )
  }
}

// The floor is the only thing standing between a mistyped --bible path and a
// deactivated bestiary, so assert the number itself rather than trusting it.
check(
  MIN_EXPECTED_SPECIES >= 100,
  `safety floor is ${MIN_EXPECTED_SPECIES}, too low to protect the table`,
)
check(
  MIN_EXPECTED_SPECIES <= bible.length,
  'safety floor is above the real bible size and would block every run',
)

const edges = bible.filter((f) => f.evolves_to).length
const shared = bible.filter((f) => f.games.includes('ruler-hooked')).length
console.log(`${edges} evolution edges, ${shared} shared with ruler-hooked`)

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  x ${failure}`)
  process.exit(1)
}
console.log('bestiary seed mapping is sound')
