// Hybridizer starter catalog contract (hybridizer t-006).
//
// Every one of the 200 starters is pinned to exactly one canonical Facet, so
// the game never resolves art by title (a title lookup handed "Orange" the
// COLOR swatch). artState is honest: `facet-image` only where the linked Facet
// already had a delivered image at audit time, `art-queued` where the Facet was
// created and its ArtJob queued. Monsters and fantastical lifeforms are SPECIES,
// never an invented monster taxonomy.
import assert from 'node:assert/strict'
import catalog from '../hybridizer/starterCatalog.json'

type Starter = {
  key: string
  title: string
  taxonomy: string
  facetGroup?: string
  facetId: number | null
  artState: string
}

const entries = catalog.entries as Starter[]

assert.equal(entries.length, 200, 'The starter catalog holds exactly 200')
assert.equal(new Set(entries.map((e) => e.key)).size, 200, 'Keys are unique')

for (const entry of entries) {
  assert.ok(
    Number.isInteger(entry.facetId) && (entry.facetId ?? 0) > 0,
    `${entry.key} is pinned to a Facet id`,
  )
  assert.ok(
    ['facet-image', 'art-queued'].includes(entry.artState),
    `${entry.key} has an honest artState, not ${entry.artState}`,
  )
  assert.ok(
    ['ANIMAL', 'SPECIES', 'ARCHETYPE', 'OTHER'].includes(entry.taxonomy),
    `${entry.key} uses a canonical Facet taxonomy`,
  )
}

const facetIds = entries.map((e) => e.facetId)
assert.equal(
  new Set(facetIds).size,
  200,
  'No two starters share a Facet (no hidden duplicates or aliases)',
)

for (const key of [
  'vampire',
  'zombie',
  'ghost',
  'skeleton',
  'werewolf',
  'dragon',
  'unicorn',
  'phoenix',
  'alien',
  'robot',
  'cyborg',
]) {
  assert.equal(
    entries.find((e) => e.key === key)?.taxonomy,
    'SPECIES',
    `${key} is a SPECIES`,
  )
}

const fruit = entries.filter((e) => e.facetGroup === 'fruit')
assert.equal(fruit.length, 20, 'Twenty fruit starters')
assert.ok(
  fruit.every((e) => e.taxonomy === 'OTHER'),
  'Fruit is OTHER',
)

const states = entries.reduce<Record<string, number>>((acc, e) => {
  acc[e.artState] = (acc[e.artState] ?? 0) + 1
  return acc
}, {})
console.log(
  `Hybridizer starter catalog contract passed: 200 pinned, ` +
    `${states['facet-image'] ?? 0} with Facet images, ` +
    `${states['art-queued'] ?? 0} queued.`,
)
