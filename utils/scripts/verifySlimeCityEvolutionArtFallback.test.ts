import assert from 'node:assert/strict'
import { slimeArtId, slimeCardArtId } from '../slimeCity/artManifest'

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

// The pending Ironjaw evolution art must not borrow another card's painting.
const ironjaw = 'scrapper'
assert.equal(slimeArtId('evolutions', ironjaw + '@3'), null)
assert.equal(slimeCardArtId(ironjaw, 3, 1), slimeArtId('cards', ironjaw))
assert.equal(slimeCardArtId('nonexistent-slime-card', 3, 1), null)
console.log('Slime City COG evolution art fallback verified')
