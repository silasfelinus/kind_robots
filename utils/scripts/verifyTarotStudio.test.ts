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

const gallery = kind.map((card) => ({ ...card, checkpoint: null }))
assert.equal(filterTarotCards(gallery, { arcana: 'major' }).length, 22)
assert.equal(filterTarotCards(gallery, { arcana: 'minor' }).length, 56)
assert.equal(filterTarotCards(gallery, { suit: 'cups' }).length, 14)
assert.equal(filterTarotCards(gallery, { rank: 'ace' }).length, 4)
assert.equal(filterTarotCards(gallery, { checkpoint: 'default' }).length, 78)
assert.equal(filterTarotCards(gallery, { status: 'APPROVED' }).length, 0)
assert.equal(filterTarotCards(gallery, { query: 'newly woken' }).length, 1)
console.log('Tarot Studio: 78-card catalogs, deck variants and filters pass.')
