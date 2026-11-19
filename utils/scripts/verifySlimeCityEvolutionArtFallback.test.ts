import assert from 'node:assert/strict'
import {
  SLIME_CITY_ART,
  slimeArtId,
  slimeCardArtId,
} from '../slimeCity/artManifest'

// An alternate COG choice is still a level-three fighter, even when its
// distinct painting has not arrived. Never show its base card as a downgrade.
const sharedThird = 'pogo-punk'
assert.equal(slimeArtId('evolutions', sharedThird + '@3b'), null)
assert.ok(slimeArtId('evolutions', sharedThird + '@3'))
assert.equal(
  slimeCardArtId(sharedThird, 3, 1),
  slimeArtId('evolutions', sharedThird + '@3'),
)
assert.equal(
  slimeCardArtId(sharedThird, 3, 0),
  slimeArtId('evolutions', sharedThird + '@3'),
)

// Distinct alternate illustrations still win when a curated one exists.
const splitThird = 's1-riot-choir'
assert.ok(slimeArtId('evolutions', splitThird + '@3b'))
assert.equal(
  slimeCardArtId(splitThird, 3, 1),
  slimeArtId('evolutions', splitThird + '@3b'),
)
assert.equal(
  slimeCardArtId(splitThird, 3, 0),
  slimeArtId('evolutions', splitThird + '@3'),
)

// A stage without its own curated painting must not borrow another card's
// painting: L2 falls back to the card's own art, never a sibling's. Since
// 2026-11-19 PT every card has curated L2 art (fusevest@2 was the last), so
// check the precedence rule across the whole catalog instead of one fixture.
const evolutions = SLIME_CITY_ART.evolutions as Record<string, number>
for (const id of Object.keys(SLIME_CITY_ART.cards)) {
  assert.equal(slimeCardArtId(id, 1, 0), slimeArtId('cards', id))
  assert.equal(
    slimeCardArtId(id, 2, 0),
    evolutions[id + '@2'] ?? slimeArtId('cards', id),
    id + ' L2 uses its own stage or card art',
  )
}
assert.equal(slimeArtId('evolutions', 'fusevest@2'), 276580)
assert.equal(slimeCardArtId('nonexistent-slime-card', 3, 1), null)
console.log('Slime City COG evolution art fallback verified')
