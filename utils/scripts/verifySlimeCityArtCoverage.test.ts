import assert from 'node:assert/strict'
import { CARDS } from '../slimeCity/prototypes'
import {
  SLIME_CITY_ART,
  slimeArtId,
  slimeCardArtId,
} from '../slimeCity/artManifest'

// slime-city/t-012 player handoff: reconcile the art manifest against the
// 300-card catalog. A card that renders without a painting, an image that is
// borrowed by two different slots, or an evolution key for a card that no
// longer exists would each ship as a visible defect.

// 1. Every catalog card has its own base painting.
assert.equal(CARDS.length, 300, 'CLASH catalog keeps all 300 card ids')
const cardIds = new Set(CARDS.map((card) => card.id))
assert.equal(cardIds.size, CARDS.length, 'card ids are unique')
for (const card of CARDS) {
  assert.ok(
    slimeArtId('cards', card.id) !== null,
    card.id + ' has base card art',
  )
}

// 2. Every manifest id is a positive integer and no ArtImage is reused by two
// slots (a borrowed painting reads as the wrong card or scene).
const owner = new Map<number, string>()
for (const [group, ids] of Object.entries(SLIME_CITY_ART)) {
  for (const [slug, id] of Object.entries(ids as Record<string, number>)) {
    const slot = group + '/' + slug
    assert.ok(Number.isInteger(id) && id > 0, slot + ' is a real ArtImage id')
    assert.equal(
      owner.get(id),
      undefined,
      `ArtImage ${id} is used by both ${owner.get(id)} and ${slot}`,
    )
    owner.set(id, slot)
  }
}

// 3. Every evolution painting belongs to a real card stage.
for (const key of Object.keys(SLIME_CITY_ART.evolutions)) {
  const match = /^(.+)@(2|3|3b)$/.exec(key)
  assert.ok(match, key + ' names a stage @2, @3 or @3b')
  assert.ok(cardIds.has(match[1]), key + ' names a catalog card')
}

// 4. Every card at every level and branch resolves to some painting; never
// null, never another card's art.
const ownSlots = (id: string) =>
  new Set([
    'cards/' + id,
    'evolutions/' + id + '@2',
    'evolutions/' + id + '@3',
    'evolutions/' + id + '@3b',
  ])
for (const card of CARDS) {
  const slots = ownSlots(card.id)
  for (const level of [1, 2, 3]) {
    for (const pick of [0, 1]) {
      const art = slimeCardArtId(card.id, level, pick)
      assert.ok(art !== null, `${card.id} L${level}/${pick} has art`)
      assert.ok(
        slots.has(owner.get(art) ?? ''),
        `${card.id} L${level}/${pick} uses its own painting`,
      )
    }
  }
}

// 5. Evolution coverage ratchet. These cards still show an earlier stage's
// painting at L2/L3 until their evolution renders are delivered and curated.
// The numbers may only go down: lower a baseline when art lands.
const PENDING_EVOLUTION_ART_BASELINE: Record<string, number> = {
  catgirls: 0,
  bloodfairies: 14,
  ironjaw: 10,
  riot: 10,
  undertow: 12,
  exchange: 10,
  mercenary: 10,
}
const pending: Record<string, string[]> = {}
for (const card of CARDS) {
  const team = String((card as { team?: string }).team ?? 'none')
  const missing =
    slimeArtId('evolutions', card.id + '@2') === null ||
    slimeArtId('evolutions', card.id + '@3') === null
  if (missing) (pending[team] ??= []).push(card.id)
}
for (const team of Object.keys(pending)) {
  assert.ok(
    team in PENDING_EVOLUTION_ART_BASELINE,
    team + ' is a known crew in the evolution art baseline',
  )
}
let total = 0
for (const [team, baseline] of Object.entries(PENDING_EVOLUTION_ART_BASELINE)) {
  const count = pending[team]?.length ?? 0
  total += count
  assert.ok(
    count <= baseline,
    `${team} lost evolution art: ${count} pending > baseline ${baseline}`,
  )
}
console.log(
  `Slime City art coverage verified: 300/300 base cards, ${owner.size} unique ArtImages, ` +
    `${300 - total}/300 cards with L2 and L3 paintings (${total} pending)`,
)
