import assert from 'node:assert/strict'
import {
  TAROT_CATALOG,
  TAROT_DECK_SEEDS,
  filterTarotCards,
  seedTarotCards,
} from '../tarotStudio'

assert.equal(TAROT_CATALOG.length, 78)
assert.equal(TAROT_CATALOG.filter((card) => card.arcana === 'major').length, 22)
assert.equal(TAROT_CATALOG.filter((card) => card.arcana === 'minor').length, 56)
assert.equal(new Set(TAROT_CATALOG.map((card) => card.key)).size, 78)
assert.equal(new Set(TAROT_CATALOG.map((card) => card.oracleId)).size, 78)

for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
  assert.equal(
    TAROT_CATALOG.filter((card) => card.suit === suit).length,
    14,
    `${suit} has fourteen ranks`,
  )
}
assert.deepEqual(
  TAROT_DECK_SEEDS.map((seed) => seed.slug),
  ['superkate', 'kind-robots', 'zuzu'],
)

for (const seed of TAROT_DECK_SEEDS) {
  const cards = seedTarotCards(seed.slug)
  assert.equal(cards.length, 78)
  assert.ok(cards.every((card) => card.status === 'DRAFT'))
  assert.ok(cards.every((card) => card.prompt.length > 40))
  assert.equal(cards[0]?.oracleId, 'the-newly-woken')
}
const kind = seedTarotCards('kind-robots')
assert.equal(kind[0]?.title, 'The Newly Woken')
assert.equal(kind[21]?.title, 'The Whole World')
const standard = seedTarotCards('superkate')
assert.equal(standard[0]?.title, 'The Fool')
assert.equal(standard[21]?.title, 'The World')

// Data-ownership boundary (tarot-studio/t-010): every card keeps the canonical
// Kind Oracle identity from conductor projects/kind-oracle/docs/spec.md. Tarot
// Studio owns art and per-deck titles; it never forks the reading engine's ids.
const CANONICAL_MAJOR_IDS = [
  'the-newly-woken',
  'the-tinkerer',
  'the-quiet-archivist',
  'the-gardener',
  'the-lighthouse-keeper',
  'the-storyteller',
  'the-two-bots',
  'the-wayfarer',
  'the-gentle-giant',
  'the-lantern-bearer',
  'the-wheel',
  'the-fair-scale',
  'the-upside-down-bot',
  'the-shedding',
  'the-mender',
  'the-tangle',
  'the-short-circuit',
  'the-night-sky-bot',
  'the-moon-pool',
  'the-sunrise-engine',
  'the-reboot',
  'the-whole-world',
]
const CANONICAL_SUIT_BY_TAROT: Record<string, string> = {
  wands: 'sparks',
  cups: 'currents',
  swords: 'breezes',
  pentacles: 'cogs',
}
const CANONICAL_RANK_BY_TAROT: Record<string, string> = {
  ace: 'ace',
  two: 'two',
  three: 'three',
  four: 'four',
  five: 'five',
  six: 'six',
  seven: 'seven',
  eight: 'eight',
  nine: 'nine',
  ten: 'ten',
  page: 'apprentice',
  knight: 'wanderer',
  queen: 'keeper',
  king: 'elder',
}
const canonicalIds = new Set([
  ...CANONICAL_MAJOR_IDS,
  ...Object.values(CANONICAL_SUIT_BY_TAROT).flatMap((suit) =>
    Object.values(CANONICAL_RANK_BY_TAROT).map((rank) => `${rank}-of-${suit}`),
  ),
])
assert.equal(canonicalIds.size, 78)
assert.deepEqual(
  new Set(TAROT_CATALOG.map((card) => card.oracleId)),
  canonicalIds,
  'the catalog covers exactly the 78 canonical Kind Oracle ids',
)
for (const card of TAROT_CATALOG) {
  const expected =
    card.arcana === 'major'
      ? CANONICAL_MAJOR_IDS[card.ordinal]
      : `${CANONICAL_RANK_BY_TAROT[card.rank]}-of-${CANONICAL_SUIT_BY_TAROT[card.suit ?? '']}`
  assert.equal(card.oracleId, expected, `${card.key} resolves to ${expected}`)
}
for (const seed of TAROT_DECK_SEEDS) {
  const byKey = new Map(TAROT_CATALOG.map((card) => [card.key, card.oracleId]))
  for (const card of seedTarotCards(seed.slug)) {
    assert.equal(
      card.oracleId,
      byKey.get(card.key),
      `${seed.slug}/${card.key} keeps its canonical oracleId`,
    )
  }
}

const gallery = kind.map((card) => ({ ...card, checkpoint: null }))
assert.equal(filterTarotCards(gallery, { arcana: 'major' }).length, 22)
assert.equal(filterTarotCards(gallery, { arcana: 'minor' }).length, 56)
assert.equal(filterTarotCards(gallery, { suit: 'cups' }).length, 14)
assert.equal(filterTarotCards(gallery, { rank: 'ace' }).length, 4)
assert.equal(filterTarotCards(gallery, { checkpoint: 'default' }).length, 78)
assert.equal(filterTarotCards(gallery, { status: 'APPROVED' }).length, 0)
assert.equal(filterTarotCards(gallery, { query: 'newly woken' }).length, 1)
console.log(
  'Tarot Studio: 78-card catalogs, canonical Kind Oracle ids, deck variants and filters pass.',
)
